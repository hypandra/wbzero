import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// GET /api/chapters/[id]/tags - get all tags for a chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership through project
  const chapterResult = await pool.query(
    `SELECT c.id FROM wbz_chapter c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [id, session.user.id]
  )

  if (chapterResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const result = await pool.query(
    'SELECT id, tag_name, created_at FROM wbz_chapter_tag WHERE chapter_id = $1 ORDER BY created_at',
    [id]
  )

  return NextResponse.json({ tags: result.rows })
}

// POST /api/chapters/[id]/tags - add a tag to a chapter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { tag_name } = await request.json()

  if (!tag_name || typeof tag_name !== 'string' || !tag_name.trim()) {
    return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
  }

  const normalizedTag = tag_name.trim().toLowerCase()

  // Verify ownership through project
  const chapterResult = await pool.query(
    `SELECT c.id FROM wbz_chapter c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [id, session.user.id]
  )

  if (chapterResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Insert tag (ON CONFLICT to handle duplicates gracefully)
  const result = await pool.query(
    `INSERT INTO wbz_chapter_tag (chapter_id, tag_name)
     VALUES ($1, $2)
     ON CONFLICT (chapter_id, tag_name) DO NOTHING
     RETURNING id, tag_name, created_at`,
    [id, normalizedTag]
  )

  if (result.rows.length === 0) {
    // Tag already existed
    const existing = await pool.query(
      'SELECT id, tag_name, created_at FROM wbz_chapter_tag WHERE chapter_id = $1 AND tag_name = $2',
      [id, normalizedTag]
    )
    return NextResponse.json({ tag: existing.rows[0], existed: true })
  }

  return NextResponse.json({ tag: result.rows[0] })
}

// DELETE /api/chapters/[id]/tags - remove a tag from a chapter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { tag_name } = await request.json()

  if (!tag_name || typeof tag_name !== 'string') {
    return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
  }

  const normalizedTag = tag_name.trim().toLowerCase()

  // Verify ownership through project
  const chapterResult = await pool.query(
    `SELECT c.id FROM wbz_chapter c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [id, session.user.id]
  )

  if (chapterResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await pool.query(
    'DELETE FROM wbz_chapter_tag WHERE chapter_id = $1 AND tag_name = $2',
    [id, normalizedTag]
  )

  return NextResponse.json({ success: true })
}
