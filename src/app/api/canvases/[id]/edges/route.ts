import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// POST /api/canvases/[id]/edges - create edge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { from_node_id, to_node_id, label } = await request.json()

  const canvasResult = await pool.query(
    `SELECT c.id FROM wbz_canvas c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [id, session.user.id]
  )

  if (canvasResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const nodeResult = await pool.query(
    `SELECT id FROM wbz_canvas_node
     WHERE canvas_id = $1 AND id = ANY($2)`,
    [id, [from_node_id, to_node_id]]
  )

  if (nodeResult.rows.length !== 2) {
    return NextResponse.json({ error: 'Invalid nodes' }, { status: 400 })
  }

  const edgeResult = await pool.query(
    `INSERT INTO wbz_canvas_edge (canvas_id, from_node_id, to_node_id, label)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, from_node_id, to_node_id, label || null]
  )

  return NextResponse.json({ edge: edgeResult.rows[0] })
}
