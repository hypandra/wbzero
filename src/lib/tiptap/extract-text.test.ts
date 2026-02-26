import { describe, expect, it } from 'vitest'
import { extractTextFromTipTapJson } from '@/components/chapters/tiptap-editor'

describe('extractTextFromTipTapJson', () => {
  it('extracts plain text from a TipTap JSON document', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello' },
            { type: 'text', text: 'world' },
          ],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Nested' }],
            },
          ],
        },
      ],
    }

    expect(extractTextFromTipTapJson(JSON.stringify(doc))).toBe('Hello world Nested')
  })

  it('returns the original string when not valid JSON', () => {
    expect(extractTextFromTipTapJson('not-json')).toBe('not-json')
  })

  it('returns the original string when JSON is not a TipTap doc', () => {
    const notDoc = JSON.stringify({ type: 'paragraph', content: [] })
    expect(extractTextFromTipTapJson(notDoc)).toBe(notDoc)
  })

  it('handles an empty doc', () => {
    const empty = JSON.stringify({ type: 'doc', content: [] })
    expect(extractTextFromTipTapJson(empty)).toBe('')
  })
})
