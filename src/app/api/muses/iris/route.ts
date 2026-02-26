import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import type { MuseContext } from '@/lib/muses/context'
import { buildMuseContextSummary, IRIS_QUERY_SYSTEM_PROMPT, IRIS_SUMMARY_SYSTEM_PROMPT } from '@/lib/muses/prompts'
import { extractJsonObject, type IrisPackage } from '@/lib/muses/iris'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY

interface MuseMessage {
  role: 'user' | 'assistant'
  content: string
}

const MAX_RESULTS = 6
const MAX_CHARS_PER_RESULT = 1200
const PARALLEL_BETA_HEADER = 'search-extract-2025-10-10'

async function getParallelClient() {
  const module: any = await import('parallel-web')
  const ParallelClient = module.Parallel ?? module.default ?? module
  return new ParallelClient({ apiKey: PARALLEL_API_KEY })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!OPENROUTER_API_KEY || !PARALLEL_API_KEY) {
    return NextResponse.json({ error: 'Missing API credentials' }, { status: 500 })
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

  const lastUserMessage = [...sanitizedMessages].reverse().find((message) => message.role === 'user')

  const contextSummary = buildMuseContextSummary(context)
  const seedPrompt = lastUserMessage?.content
    ?? 'Use the context to find adjacent ideas and kindred thinkers.'

  const queryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
        { role: 'system', content: IRIS_QUERY_SYSTEM_PROMPT },
        { role: 'system', content: contextSummary },
        { role: 'user', content: seedPrompt },
      ],
      temperature: 0.5,
    }),
  })

  if (!queryResponse.ok) {
    const error = await queryResponse.text()
    console.error('Iris OpenRouter query error:', error)
    return NextResponse.json({ error: 'Failed to reach Iris' }, { status: 502 })
  }

  const queryData = await queryResponse.json()
  const queryContent = queryData.choices?.[0]?.message?.content ?? ''
  const queryPayload = extractJsonObject(queryContent) ?? {}
  const objective = typeof queryPayload.objective === 'string'
    ? queryPayload.objective
    : `Find adjacent ideas to: ${seedPrompt}`.slice(0, 200)
  const rawQueries = Array.isArray(queryPayload.search_queries)
    ? queryPayload.search_queries.filter((query: unknown) => typeof query === 'string')
    : []
  const dedupedQueries = rawQueries
    .map((query: string) => query.trim())
    .filter((query: string) => query.length > 0)
    .filter((query: string, index: number, list: string[]) => {
      const normalized = query.toLowerCase()
      return list.findIndex((item) => item.toLowerCase() === normalized) === index
    })
  const searchQueries = dedupedQueries.length > 0
    ? dedupedQueries.slice(0, 3)
    : [seedPrompt]

  let results: Array<{ title: string; url: string; excerpts?: string[]; content?: string }> = []
  try {
    const client = await getParallelClient()
    const searchResponse = await client.beta.search({
      objective,
      search_queries: searchQueries,
      max_results: MAX_RESULTS,
      max_chars_per_result: MAX_CHARS_PER_RESULT,
      depth: 'snippets',
    }, {
      headers: {
        'parallel-beta': PARALLEL_BETA_HEADER,
      },
    })
    results = Array.isArray(searchResponse?.results) ? searchResponse.results : []
  } catch (error) {
    const errorPayload = error as { status?: number; error?: { message?: string; ref_id?: string }; message?: string }
    const upstreamMessage = errorPayload?.error?.message ?? errorPayload?.message ?? ''
    const upstreamRef = errorPayload?.error?.ref_id ?? ''
    const details = [
      upstreamMessage ? `Parallel: ${upstreamMessage}` : null,
      upstreamRef ? `requestId: ${upstreamRef}` : null,
      `beta header: ${PARALLEL_BETA_HEADER}`,
    ].filter(Boolean).join(' ')
    console.error('Iris Parallel search error:', error)
    return NextResponse.json(
      {
        error: 'Parallel search failed',
        details,
      },
      { status: 502 }
    )
  }

  const summaryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
        { role: 'system', content: IRIS_SUMMARY_SYSTEM_PROMPT },
        { role: 'system', content: contextSummary },
        {
          role: 'user',
          content: JSON.stringify({ objective, results }, null, 2),
        },
      ],
      temperature: 0.4,
    }),
  })

  if (!summaryResponse.ok) {
    const error = await summaryResponse.text()
    console.error('Iris OpenRouter summary error:', error)
    return NextResponse.json({ error: 'Failed to summarize Iris results' }, { status: 502 })
  }

  const summaryData = await summaryResponse.json()
  const summaryContent = summaryData.choices?.[0]?.message?.content ?? ''
  const summaryPayload = extractJsonObject(summaryContent)

  const fallbackSources = results.slice(0, 4).map((result) => ({
    title: result.title,
    url: result.url,
    notes: result.excerpts?.[0]?.slice(0, 200) || 'Adjacent source to explore.',
  }))

  const safeSources = Array.isArray(summaryPayload?.sources)
    ? summaryPayload.sources
        .filter((source: unknown) => {
          if (!source || typeof source !== 'object') return false
          const candidate = source as { title?: unknown; url?: unknown; notes?: unknown }
          return typeof candidate.title === 'string'
            && typeof candidate.url === 'string'
            && typeof candidate.notes === 'string'
        })
        .map((source: unknown) => {
          const candidate = source as { title: string; url: string; notes: string }
          return {
            title: candidate.title,
            url: candidate.url,
            notes: candidate.notes,
          }
        })
        .slice(0, 6)
    : []

  const irisPackage: IrisPackage = {
    intro: typeof summaryPayload?.intro === 'string' ? summaryPayload.intro : 'Here is a curated bundle of adjacent ideas.',
    headline: typeof summaryPayload?.headline === 'string' ? summaryPayload.headline : 'Adjacent threads',
    summary: typeof summaryPayload?.summary === 'string' ? summaryPayload.summary : 'A small set of relevant threads to spark new angles.',
    sources: safeSources.length > 0 ? safeSources : fallbackSources,
    followups: Array.isArray(summaryPayload?.followups)
      ? summaryPayload.followups.filter((item: unknown) => typeof item === 'string').slice(0, 3)
      : undefined,
  }

  return NextResponse.json({ message: irisPackage.intro, package: irisPackage })
}
