import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// GET /api/projects/[id]/tags - get all unique tags in a project (for autocomplete)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify project ownership
  const projectResult = await pool.query(
    'SELECT id FROM wbz_project WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  )

  if (projectResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Get all unique tags across all chapters in this project
  const result = await pool.query(
    `SELECT DISTINCT t.tag_name, COUNT(*) as usage_count
     FROM wbz_chapter_tag t
     JOIN wbz_chapter c ON t.chapter_id = c.id
     WHERE c.project_id = $1
     GROUP BY t.tag_name
     ORDER BY usage_count DESC, t.tag_name ASC`,
    [id]
  )

  return NextResponse.json({
    tags: result.rows.map(r => ({
      name: r.tag_name,
      count: parseInt(r.usage_count, 10),
    })),
  })
}
