import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// DELETE /api/images/[id] - soft delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership via project→chapter→image join
  const result = await pool.query(
    `UPDATE wbz_image SET deleted_at = NOW()
     FROM wbz_chapter c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE wbz_image.id = $1
       AND wbz_image.chapter_id = c.id
       AND p.user_id = $2
       AND wbz_image.deleted_at IS NULL
     RETURNING wbz_image.id`,
    [id, session.user.id]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

// PATCH /api/images/[id] - update image title
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { title } = await request.json()

  if (typeof title !== 'string') {
    return NextResponse.json({ error: 'title must be a string' }, { status: 400 })
  }

  const result = await pool.query(
    `UPDATE wbz_image SET title = $3
     FROM wbz_chapter c
     JOIN wbz_project p ON c.project_id = p.id
     WHERE wbz_image.id = $1
       AND wbz_image.chapter_id = c.id
       AND p.user_id = $2
       AND wbz_image.deleted_at IS NULL
     RETURNING wbz_image.*`,
    [id, session.user.id, title || null]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  return NextResponse.json({ image: result.rows[0] })
}
