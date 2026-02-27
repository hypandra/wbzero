import { renderPromptTemplate } from '@/lib/prompts'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

/**
 * Extract base64 data from a response part, handling multiple formats
 */
function extractBase64FromPart(part: any): string | null {
  if (!part) return null

  // Direct data field
  if (part.data && typeof part.data === 'string') {
    return part.data
  }

  // inline_data format (Gemini native)
  if (part.inline_data?.data) {
    return part.inline_data.data
  }

  // image object with data
  if (part.image?.data) {
    return part.image.data
  }

  // b64_json format (OpenAI style)
  if (part.b64_json) {
    return part.b64_json
  }

  // source.data format
  if (part.source?.data) {
    return part.source.data
  }

  // image_url with data URL
  const urlCandidate = part.image_url?.url || part.image_url || part.url
  if (typeof urlCandidate === 'string' && urlCandidate.startsWith('data:image/')) {
    const base64 = urlCandidate.split(',')[1]
    if (base64) return base64
  }

  // Check for data URL in string
  if (typeof part === 'string') {
    const match = part.match(/data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)/)
    if (match) return match[1]
  }

  if (typeof part.text === 'string') {
    const match = part.text.match(/data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)/)
    if (match) return match[1]
  }

  return null
}

function extractImageBufferFromResponse(data: any): Buffer | null {
  const message = data?.choices?.[0]?.message

  // Format 1: message.images array
  if (message?.images && Array.isArray(message.images)) {
    for (const img of message.images) {
      const base64 = extractBase64FromPart(img)
      if (base64) return Buffer.from(base64, 'base64')
    }
  }

  // Format 2: message.content array
  if (Array.isArray(message?.content)) {
    for (const part of message.content) {
      const base64 = extractBase64FromPart(part)
      if (base64) return Buffer.from(base64, 'base64')
    }
  }

  // Format 3: message.content.parts array
  if (Array.isArray(message?.content?.parts)) {
    for (const part of message.content.parts) {
      const base64 = extractBase64FromPart(part)
      if (base64) return Buffer.from(base64, 'base64')
    }
  }

  // Format 4: message.content as string (check for embedded data URL)
  if (typeof message?.content === 'string') {
    const base64 = extractBase64FromPart(message.content)
    if (base64) return Buffer.from(base64, 'base64')
  }

  // Format 5: top-level data array (OpenAI images style)
  if (Array.isArray(data?.data)) {
    for (const item of data.data) {
      const base64 = extractBase64FromPart(item)
      if (base64) return Buffer.from(base64, 'base64')
    }
  }

  // Format 6: candidates array (native Gemini format)
  if (Array.isArray(data?.candidates)) {
    for (const candidate of data.candidates) {
      if (Array.isArray(candidate?.content?.parts)) {
        for (const part of candidate.content.parts) {
          const base64 = extractBase64FromPart(part)
          if (base64) return Buffer.from(base64, 'base64')
        }
      }
    }
  }

  // Format 7: top-level images array
  if (Array.isArray(data?.images)) {
    for (const img of data.images) {
      const base64 = extractBase64FromPart(img)
      if (base64) return Buffer.from(base64, 'base64')
      if (typeof img === 'string') {
        return Buffer.from(img, 'base64')
      }
    }
  }

  return null
}

export async function generateImage(sourceText: string, promptTemplate: string): Promise<Buffer> {
  const renderedPrompt = renderPromptTemplate(promptTemplate, sourceText)
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: renderedPrompt,
      size: '1024x1024',
      quality: 'low',
      output_format: 'png',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Image generation failed: ${response.status} ${error}`)
  }

  const data = await response.json()

  const buffer = extractImageBufferFromResponse(data)
  if (buffer) return buffer

  console.error('Could not extract image. Full response:', JSON.stringify(data, null, 2))
  throw new Error('Could not extract image from response')
}

export async function refineImage(imageBuffer: Buffer, refinementPrompt: string): Promise<Buffer> {
  const formData = new FormData()
  formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'source.png')
  formData.append('prompt', refinementPrompt)
  formData.append('model', 'gpt-image-1')
  formData.append('size', '1024x1024')
  formData.append('quality', 'low')

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Image refinement failed: ${response.status} ${error}`)
  }

  const data = await response.json()
  const buffer = extractImageBufferFromResponse(data)
  if (buffer) return buffer

  console.error('Could not extract refined image. Full response:', JSON.stringify(data, null, 2))
  throw new Error('Could not extract refined image from response')
}
