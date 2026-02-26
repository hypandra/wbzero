import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

const nodeOwnershipQuery = `
  SELECT n.*, c.project_id FROM wbz_canvas_node n
  JOIN wbz_canvas c ON n.canvas_id = c.id
  JOIN wbz_project p ON c.project_id = p.id
  WHERE n.id = $1 AND c.id = $2 AND p.user_id = $3
`

// PUT /api/canvases/[id]/nodes/[nodeId] - update node
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, nodeId } = await params
  const payload = await request.json()

  const nodeResult = await pool.query(nodeOwnershipQuery, [nodeId, id, session.user.id])
  if (nodeResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const projectId = nodeResult.rows[0].project_id

  if (Object.prototype.hasOwnProperty.call(payload, 'chapter_id') && payload.chapter_id) {
    const chapterResult = await pool.query(
      'SELECT id FROM wbz_chapter WHERE id = $1 AND project_id = $2',
      [payload.chapter_id, projectId]
    )
    if (chapterResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid chapter link' }, { status: 400 })
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'image_id') && payload.image_id) {
    const imageResult = await pool.query(
      `SELECT i.id FROM wbz_image i
       JOIN wbz_chapter c ON i.chapter_id = c.id
       WHERE i.id = $1 AND c.project_id = $2 AND i.deleted_at IS NULL`,
      [payload.image_id, projectId]
    )
    if (imageResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid image link' }, { status: 400 })
    }
  }

  const updates: string[] = []
  const values: any[] = []
  let paramCount = 1

  const fields: Record<string, string> = {
    label: 'label',
    content: 'content',
    type: 'type',
    color: 'color',
    chapter_id: 'chapter_id',
    image_id: 'image_id',
    position_x: 'position_x',
    position_y: 'position_y',
  }

  for (const [key, column] of Object.entries(fields)) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      updates.push(`${column} = $${paramCount++}`)
      values.push(payload[key] ?? null)
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ node: nodeResult.rows[0] })
  }

  values.push(nodeId)
  const updated = await pool.query(
    `UPDATE wbz_canvas_node SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  )

  return NextResponse.json({ node: updated.rows[0] })
}

// DELETE /api/canvases/[id]/nodes/[nodeId] - delete node
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, nodeId } = await params
  const nodeResult = await pool.query(nodeOwnershipQuery, [nodeId, id, session.user.id])
  if (nodeResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await pool.query('DELETE FROM wbz_canvas_node WHERE id = $1', [nodeId])
  return NextResponse.json({ success: true })
}
