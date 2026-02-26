import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { parseThemeJson, type AITheme } from '@/lib/theme/ai-theme'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

const SYSTEM_PROMPT = `You are a design assistant generating theme tokens for a writing workspace.

Return JSON only with the shape:
{
  "name": "theme name",
  "palette": {
    "bg": "#hex",
    "fg": "#hex",
    "accent": "#hex",
    "accent2": "#hex",
    "muted": "#hex",
    "card": "#hex",
    "border": "#hex"
  },
  "typography": {
    "headingFont": "CSS font-family string",
    "bodyFont": "CSS font-family string",
    "scale": "tight | normal | loose"
  },
  "effects": {
    "radius": "12px",
    "shadow": "0 6px 20px rgba(0,0,0,0.1)",
    "glow": "optional box shadow"
  },
  "gradients": {
    "hero": "optional CSS gradient"
  }
}

Rules:
- Keep colors readable (contrast between bg and fg).
- Use realistic font families (system or common Google fonts).
- Output JSON only.`

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'Missing OpenRouter API key' }, { status: 500 })
  }

  const body = await request.json()
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://wbzero.com',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'WBZero',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-haiku',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Generate a theme for: "${prompt}"` },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Theme generation error:', error)
    return NextResponse.json({ error: 'Failed to generate theme' }, { status: 502 })
  }

  const data = await response.json()
  const raw = data?.choices?.[0]?.message?.content ?? ''
  const parsed = parseThemeJson(raw)
  if (!parsed) {
    return NextResponse.json(
      {
        error: 'AI returned invalid theme format',
        details: 'Try a simpler style description and regenerate.',
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ theme: parsed as AITheme })
}
