import { describe, expect, it } from 'vitest'
import { generateImageTitle } from '@/lib/image-title'

describe('generateImageTitle', () => {
  it('returns full text when 50 characters or fewer', () => {
    const input = 'Short title that fits within fifty characters'
    expect(generateImageTitle(input)).toBe(input)
  })

  it('truncates at a word boundary with ellipsis when over 50 chars', () => {
    const input = 'This is a long title that should truncate cleanly at a word boundary'
    expect(generateImageTitle(input)).toBe('This is a long title that should truncate cleanly...')
  })

  it('falls back to hard truncation when no space after position 20', () => {
    const input = 'SupercalifragilisticexpialidociousIsAVeryLongWordWithoutSpaces'
    expect(generateImageTitle(input)).toBe('SupercalifragilisticexpialidociousIsAVeryLongWordW...')
  })

  it('handles empty or whitespace input', () => {
    expect(generateImageTitle('')).toBe('')
    expect(generateImageTitle('   ')).toBe('')
  })
})
