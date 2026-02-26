import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// PATCH /api/chapters/[id] - update chapter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { title, content, position } = await request.json()

  // Verify ownership through project
  const chapterResult = await pool.query(
    `SELECT c.* FROM wbz_chapter c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [id, session.user.id]
  )

  if (chapterResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updates: string[] = []
  const values: any[] = []
  let paramCount = 1

  if (title !== undefined) {
    updates.push(`title = $${paramCount++}`)
    values.push(title)
  }
  if (content !== undefined) {
    updates.push(`content = $${paramCount++}`)
    values.push(content)
  }
  if (position !== undefined) {
    updates.push(`position = $${paramCount++}`)
    values.push(position)
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(id)

  const result = await pool.query(
    `UPDATE wbz_chapter SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  )

  return NextResponse.json({ chapter: result.rows[0] })
}

// DELETE /api/chapters/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const chapterResult = await pool.query(
    `SELECT c.id FROM wbz_chapter c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [id, session.user.id]
  )

  if (chapterResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await pool.query('DELETE FROM wbz_chapter WHERE id = $1', [id])

  return NextResponse.json({ success: true })
}
