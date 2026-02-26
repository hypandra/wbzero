import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'
import { validateTheme, type AITheme } from '@/lib/theme/ai-theme'

const pool = createPgPool()

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userResult = await pool.query(
    'SELECT id, active_theme_id FROM wbz_user WHERE id = $1',
    [session.user.id]
  )
  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const themesResult = await pool.query(
    `SELECT id, name, prompt, theme, created_at
     FROM wbz_user_theme
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [session.user.id]
  )
  const activeId = userResult.rows[0].active_theme_id
  const activeTheme = activeId
    ? themesResult.rows.find((row) => row.id === activeId) ?? null
    : null

  return NextResponse.json({
    activeTheme,
    themes: themesResult.rows,
  })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  const theme = validateTheme(body?.theme) as AITheme | null
  if (!theme) {
    return NextResponse.json({ error: 'Invalid theme payload' }, { status: 400 })
  }

  const insertResult = await pool.query(
    `INSERT INTO wbz_user_theme (user_id, name, prompt, theme)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, prompt, theme, created_at`,
    [session.user.id, theme.name, prompt || null, theme]
  )
  const inserted = insertResult.rows[0]

  await pool.query(
    'UPDATE wbz_user SET active_theme_id = $1 WHERE id = $2',
    [inserted.id, session.user.id]
  )

  return NextResponse.json({ theme: inserted })
}

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const themeId = typeof body?.themeId === 'string' ? body.themeId : ''
  if (!themeId) {
    return NextResponse.json({ error: 'Theme id required' }, { status: 400 })
  }

  const themeResult = await pool.query(
    `SELECT id FROM wbz_user_theme
     WHERE id = $1 AND user_id = $2`,
    [themeId, session.user.id]
  )
  if (themeResult.rows.length === 0) {
    return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
  }

  await pool.query(
    'UPDATE wbz_user SET active_theme_id = $1 WHERE id = $2',
    [themeId, session.user.id]
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await pool.query(
    'UPDATE wbz_user SET active_theme_id = NULL WHERE id = $1',
    [session.user.id]
  )

  return NextResponse.json({ success: true })
}
