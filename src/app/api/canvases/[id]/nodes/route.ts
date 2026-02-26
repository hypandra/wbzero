import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// POST /api/canvases/[id]/nodes - create node
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const {
    label,
    type,
    content,
    chapter_id,
    image_id,
    position_x,
    position_y,
    color,
  } = await request.json()

  const canvasResult = await pool.query(
    `SELECT c.id, c.project_id FROM wbz_canvas c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [id, session.user.id]
  )

  if (canvasResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const projectId = canvasResult.rows[0].project_id

  if (chapter_id) {
    const chapterResult = await pool.query(
      'SELECT id FROM wbz_chapter WHERE id = $1 AND project_id = $2',
      [chapter_id, projectId]
    )
    if (chapterResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid chapter link' }, { status: 400 })
    }
  }

  if (image_id) {
    const imageResult = await pool.query(
      `SELECT i.id FROM wbz_image i
       JOIN wbz_chapter c ON i.chapter_id = c.id
       WHERE i.id = $1 AND c.project_id = $2 AND i.deleted_at IS NULL`,
      [image_id, projectId]
    )
    if (imageResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid image link' }, { status: 400 })
    }
  }

  const nodeResult = await pool.query(
    `INSERT INTO wbz_canvas_node
      (canvas_id, type, label, content, chapter_id, image_id, position_x, position_y, color)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      type || null,
      label || 'New node',
      content || null,
      chapter_id || null,
      image_id || null,
      position_x ?? 0,
      position_y ?? 0,
      color || null,
    ]
  )

  return NextResponse.json({ node: nodeResult.rows[0] })
}
