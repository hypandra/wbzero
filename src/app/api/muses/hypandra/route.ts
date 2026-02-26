import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import type { MuseContext } from '@/lib/muses/context'
import { buildMuseContextSummary } from '@/lib/muses/prompts'

const HYPANDRA_REFLECTIONS_API_URL = 'https://hypandra.com/api/v1/reflections/generate'
const HYPANDRA_QUESTIONS_API_URL = 'https://hypandra.com/api/v1/questions/generate/external'
const HYPANDRA_API_KEY = process.env.HYPANDRA_API_KEY
const MAX_QUESTIONS_INPUT_LENGTH = 1200
const PREVIEW_LENGTH = 260

interface MuseMessage {
  role: 'user' | 'assistant'
  content: string
}

type HypandraMode = 'reflections' | 'questions'

const truncate = (value: string, max: number) => (
  value.length > max ? `${value.slice(0, max)}...` : value
)

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!HYPANDRA_API_KEY) {
    return NextResponse.json({ error: 'Missing Hypandra API key' }, { status: 500 })
  }

  const body = await request.json()
  const messages = Array.isArray(body?.messages) ? body.messages : []
  const context = body?.context as MuseContext | undefined
  const mode = (body?.mode === 'questions' ? 'questions' : 'reflections') as HypandraMode

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

  const contextSummary = buildMuseContextSummary(context)
  const lastUserMessage = [...sanitizedMessages].reverse().find((message) => message.role === 'user')
  const fallbackPrompt = mode === 'questions'
    ? 'Generate concise questions that help the user move forward.'
    : 'Use the context to reflect with curiosity and offer thoughtful reflections. Questions are optional.'
  const seedPrompt = lastUserMessage?.content ?? fallbackPrompt
  const prompt = `${seedPrompt}\n\n${contextSummary}`.trim()
  const questionsInput = truncate(prompt, MAX_QUESTIONS_INPUT_LENGTH)
  const promptPreview = truncate(mode === 'questions' ? questionsInput : prompt, PREVIEW_LENGTH)

  const response = await fetch(
    mode === 'questions' ? HYPANDRA_QUESTIONS_API_URL : HYPANDRA_REFLECTIONS_API_URL,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HYPANDRA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        mode === 'questions'
          ? { input: questionsInput, count: 5 }
          : { question: prompt, count: 4 }
      ),
    }
  )

  if (!response.ok) {
    let upstreamMessage = ''
    let upstreamTraceId = ''
    try {
      const payload = await response.json()
      upstreamMessage = payload?.error?.message ?? payload?.error ?? ''
      upstreamTraceId = payload?.error?.traceId ?? payload?.traceId ?? ''
    } catch {
      upstreamMessage = await response.text()
    }
    const details = [
      upstreamMessage ? `Hypandra: ${upstreamMessage}` : 'Hypandra did not accept the request.',
      upstreamTraceId ? `traceId: ${upstreamTraceId}` : null,
      `mode: ${mode}`,
      `prompt length: ${prompt.length}`,
    ].filter(Boolean).join(' ')
    console.error('Hypandra error:', {
      status: response.status,
      mode,
      upstreamMessage,
      upstreamTraceId,
      promptPreview,
    })
    return NextResponse.json(
      {
        error: 'Hypandra rejected the request',
        details,
        promptPreview,
        traceId: upstreamTraceId,
      },
      { status: 502 }
    )
  }

  const data = await response.json()
  const reflections = Array.isArray(data?.reflections)
    ? data.reflections.filter((value: unknown) => typeof value === 'string')
    : []
  const questions = Array.isArray(data?.questions)
    ? data.questions
        .map((item: { question_text?: string } | string) => (
          typeof item === 'string' ? item : item.question_text
        ))
        .filter((value: unknown) => typeof value === 'string')
    : []

  if (reflections.length === 0 && questions.length === 0) {
    return NextResponse.json(
      {
        error: `No ${mode} from Hypandra`,
        details: `Hypandra returned an empty result. mode: ${mode}. prompt length: ${prompt.length}.`,
        promptPreview,
      },
      { status: 502 }
    )
  }

  const preferred = mode === 'questions' ? questions : reflections
  const fallback = mode === 'questions' ? reflections : questions
  const items = preferred.length > 0 ? preferred : fallback
  const label = preferred.length > 0
    ? mode
    : (mode === 'questions' ? 'reflections' : 'questions')
  const message = `Here are a few ${label} to explore:\n${items.map((item: string) => `- ${item}`).join('\n')}`

  return NextResponse.json({ message, reflections, questions })
}
