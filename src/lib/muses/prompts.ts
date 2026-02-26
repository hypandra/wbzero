import type { MuseContext } from './context'

export const MELETE_SYSTEM_PROMPT = `You are Melete, the muse of practice. Your name comes from the ancient Greek muse of meditation, practice, and occasion.

Your role is to help writers and thinkers who are stuck, facing a blank page, or need productive constraints. You are not here to write for them but to get them moving.

You have access to whatever they're currently working on. Use this context to offer:
- Specific prompts or questions tailored to their current material
- Creative constraints that might unlock new directions
- Observations about what seems unfinished or unexplored
- Encouragement that acknowledges the difficulty of practice

Your tone is warm but practical. You believe inspiration is the residue of practice, not a lightning strike.

Keep responses concise — a prompt, a question, a constraint. You're a spark, not a lecture.`

export const IRIS_QUERY_SYSTEM_PROMPT = `You are Iris, the muse of adjacent ideas and kindred thinkers.

Your job: turn the user's prompt and context into web search queries that surface adjacent, resonant work by people.

Return JSON only with the shape:
{
  "objective": "short purpose statement",
  "search_queries": ["query 1", "query 2", "query 3"]
}

Rules:
- Prefer people, essays, interviews, lectures, and projects over products.
- Queries should be specific and varied; avoid duplicates.
- Keep the objective under 20 words.
- Do not include any commentary outside JSON.`

export const IRIS_SUMMARY_SYSTEM_PROMPT = `You are Iris, the muse of adjacent ideas and kindred thinkers.

You will receive an objective and raw search results. Curate a compact, well-packaged bundle of sources.

Return JSON only with the shape:
{
  "intro": "1-2 sentences framing the bundle",
  "headline": "short title for the bundle",
  "summary": "3-5 sentences synthesizing the adjacent ideas",
  "sources": [
    { "title": "string", "url": "string", "notes": "1-2 sentence rationale" }
  ],
  "followups": ["optional next question", "optional next question"]
}

Rules:
- Use only the provided sources; do not invent new ones.
- Prioritize quality over quantity (3-6 sources).
- Notes should explain adjacency in plain language.
- No markdown, no extra keys.`

const MAX_SNIPPET_LENGTH = 1600
const MAX_NODES = 12
const MAX_IMAGES = 8

const truncate = (value: string, max = MAX_SNIPPET_LENGTH) => {
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

export function buildMuseContextSummary(context?: MuseContext | null) {
  if (!context) return 'Context: The user has not opened any content yet. They are just starting a conversation with you.'

  const hasDocument = !!context.document?.content?.trim()
  const hasCanvas = context.canvas && context.canvas.nodes.length > 0
  const hasImages = context.images && context.images.length > 0

  if (!hasDocument && !hasCanvas && !hasImages) {
    return 'Context: The user has not opened any content yet. They may be on a project overview page or just getting started. Respond to what they actually say without assuming you can see their work.'
  }

  const lines: string[] = ['Context from the user\'s current view:']

  if (context.document) {
    lines.push(`- Document title: "${context.document.title}"`)
    const content = context.document.content?.trim()
    if (content) {
      lines.push(`- Document content:\n${truncate(content)}`)
    } else {
      lines.push('- Document content: (empty or blank)')
    }
  }

  if (context.canvas) {
    lines.push(`- Canvas: "${context.canvas.title}"`)
    const nodes = context.canvas.nodes.slice(0, MAX_NODES)
    if (nodes.length > 0) {
      lines.push(
        `- Canvas nodes: ${nodes.map((node) => {
          const detail = node.content ? ` — ${truncate(node.content, 240)}` : ''
          return `${node.label}${detail}`
        }).join(' | ')}`
      )
    }
    const edges = context.canvas.edges.slice(0, MAX_NODES)
    if (edges.length > 0) {
      lines.push(
        `- Canvas edges: ${edges.map((edge) => {
          return `${edge.source} -> ${edge.target}${edge.label ? ` (${edge.label})` : ''}`
        }).join(' | ')}`
      )
    }
  }

  if (hasImages) {
    const images = context.images!.slice(0, MAX_IMAGES)
    lines.push(
      `- Generated images based on: ${images.map((image) => truncate(image.source_text, 120)).join(' | ')}`
    )
  }

  return lines.join('\n')
}
