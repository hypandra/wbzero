/**
 * Generate a title from source text by truncating at a word boundary (~50 chars).
 */
export function generateImageTitle(sourceText: string): string {
  const trimmed = sourceText.trim()
  if (trimmed.length <= 50) return trimmed

  const truncated = trimmed.slice(0, 50)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > 20) {
    return truncated.slice(0, lastSpace) + '...'
  }
  return truncated + '...'
}
