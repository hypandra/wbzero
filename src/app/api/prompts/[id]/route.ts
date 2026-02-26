import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// PUT /api/prompts/[id] - update prompt (creates new version)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { content } = await request.json()
  const trimmedContent = typeof content === 'string' ? content.trim() : ''

  if (!trimmedContent) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const promptResult = await client.query(
      'SELECT * FROM wbz_prompt WHERE id = $1 AND user_id = $2',
      [id, session.user.id]
    )

    if (promptResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const prompt = promptResult.rows[0]
    const versionResult = await client.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
       FROM wbz_prompt WHERE user_id = $1 AND name = $2`,
      [session.user.id, prompt.name]
    )
    const nextVersion = versionResult.rows[0].next_version

    await client.query(
      `UPDATE wbz_prompt
       SET is_active = false
       WHERE user_id = $1 AND name = $2 AND is_active = true`,
      [session.user.id, prompt.name]
    )

    const insertResult = await client.query(
      `INSERT INTO wbz_prompt (id, user_id, name, content, version, is_active)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true)
       RETURNING *`,
      [session.user.id, prompt.name, trimmedContent, nextVersion]
    )

    await client.query('COMMIT')
    return NextResponse.json({ prompt: insertResult.rows[0] })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Prompt update error:', error)
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
  } finally {
    client.release()
  }
}
