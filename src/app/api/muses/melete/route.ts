import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { buildMuseContextSummary, MELETE_SYSTEM_PROMPT } from '@/lib/muses/prompts'
import type { MuseContext } from '@/lib/muses/context'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

interface MuseMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const messages = Array.isArray(body?.messages) ? body.messages : []
  const context = body?.context as MuseContext | undefined

  const sanitizedMessages: MuseMessage[] = messages
    .filter((message: MuseMessage) =>
      message
      && (message.role === 'user' || message.role === 'assistant')
      && typeof message.content === 'string'
    )
    .map((message: MuseMessage) => ({
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message: MuseMessage) => message.content.length > 0)

  if (sanitizedMessages.length === 0) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
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
        { role: 'system', content: MELETE_SYSTEM_PROMPT },
        { role: 'system', content: buildMuseContextSummary(context) },
        ...sanitizedMessages,
      ],
      temperature: 0.6,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Melete OpenRouter error:', error)
    return NextResponse.json({ error: 'Failed to reach Melete' }, { status: 502 })
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    return NextResponse.json({ error: 'No response from Melete' }, { status: 502 })
  }

  return NextResponse.json({ message: content })
}
