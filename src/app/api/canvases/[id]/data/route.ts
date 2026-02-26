import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// GET /api/canvases/[id]/data - get canvas with nodes and edges
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const canvasResult = await pool.query(
    `SELECT c.* FROM wbz_canvas c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [id, session.user.id]
  )

  if (canvasResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const nodesResult = await pool.query(
    'SELECT * FROM wbz_canvas_node WHERE canvas_id = $1 ORDER BY created_at ASC',
    [id]
  )
  const edgesResult = await pool.query(
    'SELECT * FROM wbz_canvas_edge WHERE canvas_id = $1 ORDER BY created_at ASC',
    [id]
  )

  return NextResponse.json({
    canvas: canvasResult.rows[0],
    nodes: nodesResult.rows,
    edges: edgesResult.rows,
  })
}
