import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// GET /api/prompts/[id]/history - get version history for a prompt
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const promptResult = await pool.query(
    'SELECT name FROM wbz_prompt WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  )

  if (promptResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const name = promptResult.rows[0].name
  const historyResult = await pool.query(
    `SELECT * FROM wbz_prompt
     WHERE user_id = $1 AND name = $2
     ORDER BY version DESC`,
    [session.user.id, name]
  )

  return NextResponse.json({ history: historyResult.rows })
}
