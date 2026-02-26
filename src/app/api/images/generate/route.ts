import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'
import { generateImage } from '@/lib/image-gen'
import { uploadToBunny, generateImageFilename } from '@/lib/bunny'
import { DEFAULT_PROMPT_TEMPLATE, renderPromptTemplate } from '@/lib/prompts'
import { generateImageTitle } from '@/lib/image-title'

const pool = createPgPool()

// POST /api/images/generate
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chapter_id, source_text, prompt_id } = await request.json()

  if (!chapter_id || !source_text) {
    return NextResponse.json({ error: 'chapter_id and source_text required' }, { status: 400 })
  }

  // Verify chapter ownership
  const chapterResult = await pool.query(
    `SELECT c.id FROM wbz_chapter c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [chapter_id, session.user.id]
  )

  if (chapterResult.rows.length === 0) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  try {
    let promptTemplate = DEFAULT_PROMPT_TEMPLATE
    const promptId = prompt_id as string | undefined

    if (promptId) {
      const promptResult = await pool.query(
        `SELECT id, content FROM wbz_prompt
         WHERE id = $1 AND user_id = $2`,
        [promptId, session.user.id]
      )
      if (promptResult.rows.length === 0) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
      }
      promptTemplate = promptResult.rows[0].content
    } else {
      const promptResult = await pool.query(
        `SELECT id, content FROM wbz_prompt
         WHERE user_id = $1 AND name = 'default' AND is_active = true
         LIMIT 1`,
        [session.user.id]
      )
      if (promptResult.rows.length > 0) {
        promptTemplate = promptResult.rows[0].content
      } else {
        const insertResult = await pool.query(
          `INSERT INTO wbz_prompt (id, user_id, name, content, version, is_active)
           VALUES (gen_random_uuid()::text, $1, 'default', $2, 1, true)
           RETURNING id, content`,
          [session.user.id, DEFAULT_PROMPT_TEMPLATE]
        )
        promptTemplate = insertResult.rows[0].content
      }
    }

    const renderedPrompt = renderPromptTemplate(promptTemplate, source_text)

    // Generate image
    const imageBuffer = await generateImage(source_text, promptTemplate)

    // Upload to Bunny
    const filename = generateImageFilename(session.user.id)
    const url = await uploadToBunny(imageBuffer, filename, 'image/png')

    // Get next position
    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM wbz_image WHERE chapter_id = $1 AND deleted_at IS NULL',
      [chapter_id]
    )
    const position = positionResult.rows[0].next_pos

    // Save to database
    const title = generateImageTitle(source_text)
    const result = await pool.query(
      `INSERT INTO wbz_image (chapter_id, url, prompt, source_text, position, title)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [chapter_id, url, renderedPrompt, source_text, position, title]
    )

    return NextResponse.json({ image: result.rows[0] })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
