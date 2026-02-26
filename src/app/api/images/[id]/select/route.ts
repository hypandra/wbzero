import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'
import { suggestPromptImprovements } from '@/lib/prompt-learning'

const pool = createPgPool()

// POST /api/images/[id]/select
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { selected } = await request.json()

  if (!selected) {
    return NextResponse.json({ error: 'selected flag required' }, { status: 400 })
  }

  const imageResult = await pool.query(
    `SELECT i.*, parent.prompt AS parent_prompt, parent.source_text AS parent_source_text
     FROM wbz_image i
     JOIN wbz_chapter c ON i.chapter_id = c.id
     JOIN wbz_project p ON c.project_id = p.id
     LEFT JOIN wbz_image parent ON i.parent_id = parent.id
     WHERE i.id = $1 AND p.user_id = $2 AND i.deleted_at IS NULL`,
    [id, session.user.id]
  )

  if (imageResult.rows.length === 0) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const image = imageResult.rows[0]

  if (image.parent_id) {
    await pool.query(
      'UPDATE wbz_image SET refinement_prompt = $1 WHERE id = $2',
      [image.refinement_prompt, image.parent_id]
    )
  }

  try {
    const basePrompt = image.parent_prompt || image.prompt || ''
    const originalSourceText = image.parent_source_text || image.source_text || ''
    const refinementsThatWorked = image.refinement_prompt ? [image.refinement_prompt] : []
    const suggestion = await suggestPromptImprovements(
      basePrompt,
      refinementsThatWorked,
      originalSourceText
    )

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('Prompt learning error:', error)
    return NextResponse.json({ error: 'Failed to suggest prompt improvements' }, { status: 500 })
  }
}
