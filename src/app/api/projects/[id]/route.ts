import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { createPgPool } from '@/lib/postgres'

const pool = createPgPool()

// GET /api/projects/[id] - get project with chapters
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
    'SELECT * FROM wbz_project WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  )

  if (projectResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const chaptersResult = await pool.query(
    'SELECT * FROM wbz_chapter WHERE project_id = $1 ORDER BY position ASC, created_at ASC',
    [id]
  )

  // Get images and tags for all chapters
  const chapterIds = chaptersResult.rows.map(c => c.id)
  let images: any[] = []
  let tags: any[] = []

  if (chapterIds.length > 0) {
    const [imagesResult, tagsResult] = await Promise.all([
      pool.query(
        'SELECT * FROM wbz_image WHERE chapter_id = ANY($1) AND deleted_at IS NULL ORDER BY position ASC, created_at ASC',
        [chapterIds]
      ),
      pool.query(
        'SELECT chapter_id, tag_name FROM wbz_chapter_tag WHERE chapter_id = ANY($1) ORDER BY created_at ASC',
        [chapterIds]
      ),
    ])
    images = imagesResult.rows
    tags = tagsResult.rows
  }

  // Group tags by chapter_id for easier frontend consumption
  const tagsByChapter: Record<string, string[]> = {}
  for (const tag of tags) {
    if (!tagsByChapter[tag.chapter_id]) {
      tagsByChapter[tag.chapter_id] = []
    }
    tagsByChapter[tag.chapter_id].push(tag.tag_name)
  }

  // Attach tags to each chapter
  const chaptersWithTags = chaptersResult.rows.map(chapter => ({
    ...chapter,
    tags: tagsByChapter[chapter.id] || [],
  }))

  return NextResponse.json({
    project: projectResult.rows[0],
    chapters: chaptersWithTags,
    images,
  })
}

// DELETE /api/projects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  await pool.query(
    'DELETE FROM wbz_project WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  )

  return NextResponse.json({ success: true })
}
