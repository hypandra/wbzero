import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// POST /api/chapters - create new chapter
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { project_id, title } = await request.json()

  // Verify project ownership
  const projectResult = await pool.query(
    'SELECT id FROM wbz_project WHERE id = $1 AND user_id = $2',
    [project_id, session.user.id]
  )

  if (projectResult.rows.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Get next position
  const positionResult = await pool.query(
    'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM wbz_chapter WHERE project_id = $1',
    [project_id]
  )
  const position = positionResult.rows[0].next_pos

  const result = await pool.query(
    'INSERT INTO wbz_chapter (project_id, title, position) VALUES ($1, $2, $3) RETURNING *',
    [project_id, title || 'Untitled Chapter', position]
  )

  return NextResponse.json({ chapter: result.rows[0] })
}
