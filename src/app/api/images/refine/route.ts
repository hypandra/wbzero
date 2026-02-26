import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'
import { refineImage } from '@/lib/image-gen'
import { generatePromptVariations } from '@/lib/variations'
import { uploadToBunny, generateImageFilename } from '@/lib/bunny'

const pool = createPgPool()

// POST /api/images/refine
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { image_id, refinement_prompt } = await request.json()
  const trimmedPrompt = typeof refinement_prompt === 'string' ? refinement_prompt.trim() : ''

  if (!image_id || !trimmedPrompt) {
    return NextResponse.json({ error: 'image_id and refinement_prompt required' }, { status: 400 })
  }

  const imageResult = await pool.query(
    `SELECT i.*
     FROM wbz_image i
     JOIN wbz_chapter c ON i.chapter_id = c.id
     JOIN wbz_project p ON c.project_id = p.id
     WHERE i.id = $1 AND p.user_id = $2 AND i.deleted_at IS NULL`,
    [image_id, session.user.id]
  )

  if (imageResult.rows.length === 0) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const image = imageResult.rows[0]

  try {
    const imageResponse = await fetch(image.url)
    if (!imageResponse.ok) {
      const error = await imageResponse.text()
      return NextResponse.json(
        { error: `Failed to fetch source image: ${imageResponse.status} ${error}` },
        { status: 502 }
      )
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const variations = await generatePromptVariations(trimmedPrompt)

    if (variations.length === 0) {
      return NextResponse.json({ error: 'No prompt variations generated' }, { status: 500 })
    }

    const refinedBuffers = await Promise.all(
      variations.map((variation) => refineImage(imageBuffer, variation))
    )

    const uploadResults = await Promise.all(
      refinedBuffers.map(async (buffer) => {
        const filename = generateImageFilename(session.user.id)
        const url = await uploadToBunny(buffer, filename, 'image/png')
        return { url, filename }
      })
    )

    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM wbz_image WHERE chapter_id = $1 AND deleted_at IS NULL',
      [image.chapter_id]
    )
    const startingPosition = Number(positionResult.rows[0].next_pos || 0)

    const insertedImages = await Promise.all(
      uploadResults.map(async (upload, index) => {
        const variation = variations[index]
        const position = startingPosition + index
        const insertResult = await pool.query(
          `INSERT INTO wbz_image (chapter_id, url, prompt, source_text, position, parent_id, refinement_prompt, title)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            image.chapter_id,
            upload.url,
            image.prompt,
            image.source_text,
            position,
            image.id,
            variation,
            image.title,
          ]
        )
        return insertResult.rows[0]
      })
    )

    return NextResponse.json({ images: insertedImages })
  } catch (error) {
    console.error('Image refinement error:', error)
    return NextResponse.json({ error: 'Failed to refine image' }, { status: 500 })
  }
}
