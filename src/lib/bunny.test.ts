import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { extractFilenameFromUrl } from '@/lib/bunny'

describe('extractFilenameFromUrl', () => {
  const originalCdn = process.env.NEXT_PUBLIC_BUNNY_CDN_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_BUNNY_CDN_URL = 'https://wbzero.b-cdn.net'
  })

  afterEach(() => {
    if (originalCdn === undefined) {
      delete process.env.NEXT_PUBLIC_BUNNY_CDN_URL
    } else {
      process.env.NEXT_PUBLIC_BUNNY_CDN_URL = originalCdn
    }
  })

  it('strips the CDN base URL prefix to get the storage path', () => {
    const url = 'https://wbzero.b-cdn.net/wbzero/user123/img.png'
    expect(extractFilenameFromUrl(url)).toBe('wbzero/user123/img.png')
  })

  it('falls back to pathname parsing when the prefix does not match', () => {
    const url = 'https://other-cdn.net/wbzero/user123/img.png?version=1'
    expect(extractFilenameFromUrl(url)).toBe('wbzero/user123/img.png')
  })
})
