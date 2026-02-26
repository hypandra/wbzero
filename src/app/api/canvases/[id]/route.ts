import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

const canvasOwnershipQuery = `
  SELECT c.* FROM wbz_canvas c
  JOIN wbz_project p ON c.project_id = p.id
  WHERE c.id = $1 AND p.user_id = $2
`

// GET /api/canvases/[id] - get single canvas
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const canvasResult = await pool.query(canvasOwnershipQuery, [id, session.user.id])

  if (canvasResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ canvas: canvasResult.rows[0] })
}

// PUT /api/canvases/[id] - update canvas
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { title } = await request.json()

  const canvasResult = await pool.query(canvasOwnershipQuery, [id, session.user.id])
  if (canvasResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updates: string[] = []
  const values: any[] = []
  let paramCount = 1

  if (title !== undefined) {
    updates.push(`title = $${paramCount++}`)
    values.push(title)
  }

  if (updates.length === 0) {
    return NextResponse.json({ canvas: canvasResult.rows[0] })
  }

  values.push(id)
  const updated = await pool.query(
    `UPDATE wbz_canvas SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  )

  return NextResponse.json({ canvas: updated.rows[0] })
}

// DELETE /api/canvases/[id] - delete canvas
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const canvasResult = await pool.query(canvasOwnershipQuery, [id, session.user.id])
  if (canvasResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await pool.query('DELETE FROM wbz_canvas WHERE id = $1', [id])
  return NextResponse.json({ success: true })
}
