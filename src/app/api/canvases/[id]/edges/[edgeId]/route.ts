import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// DELETE /api/canvases/[id]/edges/[edgeId] - delete edge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; edgeId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, edgeId } = await params
  const edgeResult = await pool.query(
    `SELECT e.id FROM wbz_canvas_edge e
     JOIN wbz_canvas c ON e.canvas_id = c.id
     JOIN wbz_project p ON c.project_id = p.id
     WHERE e.id = $1 AND c.id = $2 AND p.user_id = $3`,
    [edgeId, id, session.user.id]
  )

  if (edgeResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await pool.query('DELETE FROM wbz_canvas_edge WHERE id = $1', [edgeId])
  return NextResponse.json({ success: true })
}
