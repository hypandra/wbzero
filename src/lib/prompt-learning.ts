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

export async function suggestPromptImprovements(
  basePrompt: string,
  refinementsThatWorked: string[],
  originalSourceText: string
): Promise<string> {
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
            'You improve image generation prompts based on user refinements. Return only the updated prompt text with edits applied. No commentary.',
        },
        {
          role: 'user',
          content: JSON.stringify(
            {
              basePrompt,
              refinementsThatWorked,
              originalSourceText,
            },
            null,
            2
          ),
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Prompt learning failed: ${response.status} ${error}`)
  }

  const data = await response.json()
  const message = data?.choices?.[0]?.message
  const content = extractTextContent(message).trim()

  return content || basePrompt
}
