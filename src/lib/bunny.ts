export async function uploadToBunny(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE!
  const apiKey = process.env.BUNNY_STORAGE_API_KEY!
  const endpoint = process.env.BUNNY_STORAGE_ENDPOINT || 'https://storage.bunnycdn.com'
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL!

  const url = `${endpoint}/${storageZone}/${filename}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: apiKey,
      'Content-Type': mimeType,
    },
    body: new Uint8Array(buffer),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`BunnyCDN upload failed: ${response.status} ${error}`)
  }

  return `${cdnUrl}/${filename}`
}

export function generateImageFilename(userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `wbzero/${userId}/${timestamp}-${random}.png`
}

/**
 * Extract the storage path from a full CDN URL.
 * e.g. "https://cdn.example.com/wbzero/user123/img.png" → "wbzero/user123/img.png"
 */
export function extractFilenameFromUrl(cdnUrl: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_BUNNY_CDN_URL!
  if (cdnUrl.startsWith(cdnBase)) {
    return cdnUrl.slice(cdnBase.length + 1) // +1 for the trailing slash
  }
  // Fallback: extract path after the domain
  const url = new URL(cdnUrl)
  return url.pathname.slice(1) // remove leading /
}

/**
 * Delete a file from BunnyCDN storage. Accepts 200 or 404 (already gone).
 */
export async function deleteFromBunny(filename: string): Promise<void> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE!
  const apiKey = process.env.BUNNY_STORAGE_API_KEY!
  const endpoint = process.env.BUNNY_STORAGE_ENDPOINT || 'https://storage.bunnycdn.com'

  const url = `${endpoint}/${storageZone}/${filename}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      AccessKey: apiKey,
    },
  })

  if (!response.ok && response.status !== 404) {
    const error = await response.text()
    throw new Error(`BunnyCDN delete failed: ${response.status} ${error}`)
  }
}
