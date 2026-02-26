import { NextRequest, NextResponse } from 'next/server'
import { createPgPool } from '@/lib/postgres'
import { deleteFromBunny, extractFilenameFromUrl } from '@/lib/bunny'

const pool = createPgPool()

// GET /api/cron/cleanup-images - purge soft-deleted images from CDN and database
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await pool.query(
    `SELECT id, url FROM wbz_image
     WHERE deleted_at IS NOT NULL
       AND deleted_at < NOW() - INTERVAL '24 hours'`
  )

  const images = result.rows
  let cleaned = 0
  let failed = 0

  for (const image of images) {
    try {
      const filename = extractFilenameFromUrl(image.url)
      await deleteFromBunny(filename)
      await pool.query('DELETE FROM wbz_image WHERE id = $1', [image.id])
      cleaned++
    } catch (err) {
      console.error(`Failed to cleanup image ${image.id}:`, err)
      failed++
    }
  }

  return NextResponse.json({
    total: images.length,
    cleaned,
    failed,
  })
}
