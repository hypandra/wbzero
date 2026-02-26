export interface AITheme {
  name: string
  palette: {
    bg: string
    fg: string
    accent: string
    accent2: string
    muted: string
    card: string
    border: string
  }
  typography: {
    headingFont: string
    bodyFont: string
    scale: 'tight' | 'normal' | 'loose'
  }
  effects: {
    radius: string
    shadow: string
    glow?: string
  }
  gradients?: {
    hero?: string
  }
}

export const defaultAITheme: AITheme = {
  name: 'Default',
  palette: {
    bg: '#f8fafc',
    fg: '#0f172a',
    accent: '#2563eb',
    accent2: '#f59e0b',
    muted: '#64748b',
    card: '#ffffff',
    border: '#e2e8f0',
  },
  typography: {
    headingFont: 'system-ui, sans-serif',
    bodyFont: 'system-ui, sans-serif',
    scale: 'normal',
  },
  effects: {
    radius: '12px',
    shadow: '0 6px 20px rgba(15, 23, 42, 0.08)',
  },
}

export const themeToCssVarsObject = (theme: AITheme) => {
  const sanitizeRawValue = (value: string): string => value
    .replace(/;/g, '')
    .replace(/url\s*\([^)]*\)/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/javascript:/gi, '')
    .trim()

  const isHexColor = (value: string) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
  const isRgbColor = (value: string) => /^rgba?\(\s*\d{1,3}\s*(,\s*\d{1,3}\s*){2}(,\s*(0|1|0?\.\d+)\s*)?\)$/i.test(value)
  const isHslColor = (value: string) => /^hsla?\(\s*\d{1,3}\s*(,\s*\d{1,3}%\s*){2}(,\s*(0|1|0?\.\d+)\s*)?\)$/i.test(value)
  const isNamedColor = (value: string) => /^[a-z]+$/i.test(value)
  const sanitizeColor = (value: string, fallback: string): string => {
    const cleaned = sanitizeRawValue(value)
    if (isHexColor(cleaned) || isRgbColor(cleaned) || isHslColor(cleaned) || isNamedColor(cleaned)) {
      return cleaned
    }
    return fallback
  }

  const sanitizeFontFamily = (value: string, fallback: string): string => {
    const cleaned = sanitizeRawValue(value)
    if (/^[a-z0-9,\s-]+$/i.test(cleaned)) {
      return cleaned
    }
    return fallback
  }

  const sanitizeCssValue = (value: string, fallback: string): string => {
    const cleaned = sanitizeRawValue(value)
    if (/^[#(),.%\s+\-_/a-z0-9]+$/i.test(cleaned) && cleaned.length > 0) {
      return cleaned
    }
    return fallback
  }

  const safeTheme = {
    palette: {
      bg: sanitizeColor(theme.palette.bg, defaultAITheme.palette.bg),
      fg: sanitizeColor(theme.palette.fg, defaultAITheme.palette.fg),
      accent: sanitizeColor(theme.palette.accent, defaultAITheme.palette.accent),
      accent2: sanitizeColor(theme.palette.accent2, defaultAITheme.palette.accent2),
      muted: sanitizeColor(theme.palette.muted, defaultAITheme.palette.muted),
      card: sanitizeColor(theme.palette.card, defaultAITheme.palette.card),
      border: sanitizeColor(theme.palette.border, defaultAITheme.palette.border),
    },
    typography: {
      headingFont: sanitizeFontFamily(theme.typography.headingFont, defaultAITheme.typography.headingFont),
      bodyFont: sanitizeFontFamily(theme.typography.bodyFont, defaultAITheme.typography.bodyFont),
    },
    effects: {
      radius: sanitizeCssValue(theme.effects.radius, defaultAITheme.effects.radius),
      shadow: sanitizeCssValue(theme.effects.shadow, defaultAITheme.effects.shadow),
      glow: theme.effects.glow ? sanitizeCssValue(theme.effects.glow, defaultAITheme.effects.shadow) : undefined,
    },
    gradients: {
      hero: theme.gradients?.hero ? sanitizeCssValue(theme.gradients.hero, 'none') : undefined,
    },
  }

  const vars: Record<string, string> = {
    '--theme-bg': safeTheme.palette.bg,
    '--theme-fg': safeTheme.palette.fg,
    '--theme-accent': safeTheme.palette.accent,
    '--theme-accent2': safeTheme.palette.accent2,
    '--theme-muted': safeTheme.palette.muted,
    '--theme-card': safeTheme.palette.card,
    '--theme-border': safeTheme.palette.border,
    '--theme-heading-font': safeTheme.typography.headingFont,
    '--theme-body-font': safeTheme.typography.bodyFont,
    '--theme-radius': safeTheme.effects.radius,
    '--theme-shadow': safeTheme.effects.shadow,
  }

  if (safeTheme.effects.glow) {
    vars['--theme-glow'] = safeTheme.effects.glow
  }
  if (safeTheme.gradients.hero) {
    vars['--theme-hero-gradient'] = safeTheme.gradients.hero
  }

  const scales = {
    tight: { heroSize: '3.2rem', sectionSize: '1.9rem', lineHeight: '1.1' },
    normal: { heroSize: '3.6rem', sectionSize: '2.1rem', lineHeight: '1.2' },
    loose: { heroSize: '4rem', sectionSize: '2.4rem', lineHeight: '1.35' },
  }
  const scale = scales[theme.typography.scale]
  vars['--theme-hero-size'] = scale.heroSize
  vars['--theme-section-size'] = scale.sectionSize
  vars['--theme-line-height'] = scale.lineHeight

  return vars
}

const isNonEmptyString = (value: unknown) => typeof value === 'string' && value.trim().length > 0

export const parseThemeJson = (content: string): AITheme | null => {
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  const candidate = content.slice(start, end + 1)
  try {
    const parsed = JSON.parse(candidate)
    return validateTheme(parsed)
  } catch {
    return null
  }
}

export const validateTheme = (value: unknown): AITheme | null => {
  if (!value || typeof value !== 'object') return null
  const theme = value as AITheme
  if (!isNonEmptyString(theme.name)) return null
  if (!theme.palette || !theme.typography || !theme.effects) return null
  const palette = theme.palette
  if (!isNonEmptyString(palette.bg)
    || !isNonEmptyString(palette.fg)
    || !isNonEmptyString(palette.accent)
    || !isNonEmptyString(palette.accent2)
    || !isNonEmptyString(palette.muted)
    || !isNonEmptyString(palette.card)
    || !isNonEmptyString(palette.border)
  ) {
    return null
  }
  const typography = theme.typography
  if (!isNonEmptyString(typography.headingFont)
    || !isNonEmptyString(typography.bodyFont)
    || !['tight', 'normal', 'loose'].includes(typography.scale)
  ) {
    return null
  }
  const effects = theme.effects
  if (!isNonEmptyString(effects.radius) || !isNonEmptyString(effects.shadow)) return null
  return theme
}
