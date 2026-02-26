import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// GET /api/projects - list user's projects
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await pool.query(
    'SELECT * FROM wbz_project WHERE user_id = $1 ORDER BY updated_at DESC',
    [session.user.id]
  )

  return NextResponse.json({ projects: result.rows })
}

// POST /api/projects - create new project
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title } = await request.json()
  
  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 })
  }

  const result = await pool.query(
    'INSERT INTO wbz_project (user_id, title) VALUES ($1, $2) RETURNING *',
    [session.user.id, title.trim()]
  )

  return NextResponse.json({ project: result.rows[0] })
}
