import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'
import { uploadToBunny, generateImageFilename } from '@/lib/bunny'

const pool = createPgPool()

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

// POST /api/images/upload - upload a user image
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const chapterId = formData.get('chapter_id') as string | null

  if (!file || !chapterId) {
    return NextResponse.json({ error: 'file and chapter_id required' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed. Use PNG, JPEG, WebP, or GIF.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
  }

  // Verify chapter ownership
  const chapterResult = await pool.query(
    `SELECT c.id FROM wbz_chapter c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [chapterId, session.user.id]
  )

  if (chapterResult.rows.length === 0) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = generateImageFilename(session.user.id)
    const url = await uploadToBunny(buffer, filename, file.type)

    // Generate title from filename (strip extension)
    const title = file.name.replace(/\.[^.]+$/, '').slice(0, 50)

    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM wbz_image WHERE chapter_id = $1 AND deleted_at IS NULL',
      [chapterId]
    )
    const position = positionResult.rows[0].next_pos

    const result = await pool.query(
      `INSERT INTO wbz_image (chapter_id, url, prompt, source_text, position, title)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [chapterId, url, 'user-upload', null, position, title]
    )

    return NextResponse.json({ image: result.rows[0] })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
