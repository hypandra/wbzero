const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

function extractTextContent(message: any): string {
  if (!message?.content) return ''
  if (typeof message.content === 'string') return message.content
  if (Array.isArray(message.content)) {
    return message.content
      .map((part: any) => {
        if (typeof part === 'string') return part
        if (typeof part?.text === 'string') return part.text
        return ''
      })
      .join('')
  }
  return ''
}

export async function generatePromptVariations(userInstruction: string): Promise<string[]> {
  const trimmed = userInstruction.trim()
  if (!trimmed) {
    return []
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
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Rewrite the user instruction into three creative variations. Return only a JSON array of three strings. The first entry must be the original instruction.',
        },
        {
          role: 'user',
          content: trimmed,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Prompt variation failed: ${response.status} ${error}`)
  }

  const data = await response.json()
  const message = data?.choices?.[0]?.message
  const content = extractTextContent(message).trim()

  let variations: string[] = []
  if (content) {
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        variations = parsed.filter((item) => typeof item === 'string').map((item) => item.trim())
      }
    } catch (error) {
      variations = []
    }
  }

  if (variations.length === 0) {
    variations = [
      trimmed,
      `${trimmed}, emphasize the change with richer detail`,
      `${trimmed}, add more nuance and stylistic flair`,
    ]
  }

  if (variations.length < 3) {
    variations = variations.concat(
      Array.from({ length: 3 - variations.length }, () => trimmed)
    )
  }

  variations[0] = trimmed
  return variations.slice(0, 3)
}
