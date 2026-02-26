import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'
import { DEFAULT_PROMPT_TEMPLATE } from '@/lib/prompts'

const pool = createPgPool()
const DEFAULT_PROMPT_NAME = 'default'

async function ensureDefaultPrompt(userId: string) {
  const existing = await pool.query(
    'SELECT id FROM wbz_prompt WHERE user_id = $1 AND name = $2 LIMIT 1',
    [userId, DEFAULT_PROMPT_NAME]
  )

  if (existing.rows.length > 0) {
    return
  }

  await pool.query(
    `INSERT INTO wbz_prompt (id, user_id, name, content, version, is_active)
     VALUES (gen_random_uuid()::text, $1, $2, $3, 1, true)`,
    [userId, DEFAULT_PROMPT_NAME, DEFAULT_PROMPT_TEMPLATE]
  )
}

// GET /api/prompts - list user's prompts (active versions only)
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureDefaultPrompt(session.user.id)

  const result = await pool.query(
    `SELECT * FROM wbz_prompt
     WHERE user_id = $1 AND is_active = true
     ORDER BY name ASC, version DESC`,
    [session.user.id]
  )

  return NextResponse.json({ prompts: result.rows })
}

// POST /api/prompts - create new prompt
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, content } = await request.json()
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  const trimmedContent = typeof content === 'string' ? content.trim() : ''

  if (!trimmedName) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  if (trimmedName.length > 100) {
    return NextResponse.json({ error: 'Name too long' }, { status: 400 })
  }

  if (!trimmedContent) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const existing = await pool.query(
    `SELECT 1 FROM wbz_prompt
     WHERE user_id = $1 AND name = $2 AND is_active = true`,
    [session.user.id, trimmedName]
  )

  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Prompt name already exists' }, { status: 409 })
  }

  const versionResult = await pool.query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
     FROM wbz_prompt WHERE user_id = $1 AND name = $2`,
    [session.user.id, trimmedName]
  )
  const version = versionResult.rows[0].next_version

  const result = await pool.query(
    `INSERT INTO wbz_prompt (id, user_id, name, content, version, is_active)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true)
     RETURNING *`,
    [session.user.id, trimmedName, trimmedContent, version]
  )

  return NextResponse.json({ prompt: result.rows[0] })
}
