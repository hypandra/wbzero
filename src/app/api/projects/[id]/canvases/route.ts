import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// GET /api/projects/[id]/canvases - list canvases for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const projectResult = await pool.query(
    'SELECT id FROM wbz_project WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  )

  if (projectResult.rows.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const canvasesResult = await pool.query(
    'SELECT * FROM wbz_canvas WHERE project_id = $1 ORDER BY created_at DESC',
    [id]
  )

  return NextResponse.json({ canvases: canvasesResult.rows })
}

// POST /api/projects/[id]/canvases - create new canvas
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { title } = await request.json()

  const projectResult = await pool.query(
    'SELECT id FROM wbz_project WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  )

  if (projectResult.rows.length === 0) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const canvasResult = await pool.query(
    'INSERT INTO wbz_canvas (project_id, title) VALUES ($1, $2) RETURNING *',
    [id, title || 'Untitled Canvas']
  )

  return NextResponse.json({ canvas: canvasResult.rows[0] })
}
