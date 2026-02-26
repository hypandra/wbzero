import { describe, expect, it } from 'vitest'
import { defaultAITheme, parseThemeJson, validateTheme } from '@/lib/theme/ai-theme'

const sampleTheme = {
  name: 'Studio Glow',
  palette: {
    bg: '#0f172a',
    fg: '#f8fafc',
    accent: '#38bdf8',
    accent2: '#f472b6',
    muted: '#94a3b8',
    card: '#111827',
    border: '#1f2937',
  },
  typography: {
    headingFont: '"Space Grotesk", sans-serif',
    bodyFont: '"Inter", sans-serif',
    scale: 'normal',
  },
  effects: {
    radius: '14px',
    shadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
}

describe('validateTheme', () => {
  it('accepts a valid theme', () => {
    expect(validateTheme(sampleTheme)).toEqual(sampleTheme)
  })

  it('rejects an invalid theme', () => {
    const invalid = { ...sampleTheme, palette: { ...sampleTheme.palette, bg: '' } }
    expect(validateTheme(invalid)).toBeNull()
  })
})

describe('parseThemeJson', () => {
  it('parses a JSON theme from a string', () => {
    const content = `Here is your theme:\n${JSON.stringify(sampleTheme)}`
    expect(parseThemeJson(content)).toEqual(sampleTheme)
  })

  it('returns null when JSON is missing', () => {
    expect(parseThemeJson('No JSON here')).toBeNull()
  })
})

describe('defaultAITheme', () => {
  it('is a valid theme', () => {
    expect(validateTheme(defaultAITheme)).toEqual(defaultAITheme)
  })
})
