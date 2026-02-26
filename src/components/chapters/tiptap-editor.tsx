'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { WbzImage } from '@/lib/tiptap/image-node'
import { EditorToolbar } from './editor-toolbar'

interface TipTapEditorProps {
  content: string
  onChange: (json: string) => void
  onTextSelected: (text: string) => void
  onImageUpload: (file: File) => Promise<{ id: string; url: string; title: string } | null>
}

function isJsonContent(content: string): boolean {
  if (!content.startsWith('{')) return false
  try {
    const parsed = JSON.parse(content)
    return parsed.type === 'doc'
  } catch {
    return false
  }
}

export function TipTapEditor({
  content,
  onChange,
  onTextSelected,
  onImageUpload,
}: TipTapEditorProps) {
  const isInitialLoad = useRef(true)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      WbzImage,
      Placeholder.configure({
        placeholder: 'Start writing... (select text to create illustrations)',
      }),
      Markdown,
    ],
    content: isJsonContent(content)
      ? JSON.parse(content)
      : content || '',
    onUpdate: ({ editor }) => {
      if (!isInitialLoad.current) {
        onChange(JSON.stringify(editor.getJSON()))
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ')
        if (text.trim()) {
          onTextSelected(text.trim())
          return
        }
      }
      onTextSelected('')
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 border rounded-lg min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors',
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const files = event.dataTransfer?.files
        if (!files?.length) return false

        const file = files[0]
        if (!file.type.startsWith('image/')) return false

        event.preventDefault()
        handleFileUpload(file)
        return true
      },
    },
  })

  // Mark initial load complete after first render
  useEffect(() => {
    if (editor && isInitialLoad.current) {
      // Small delay to ensure initial content is set
      requestAnimationFrame(() => {
        isInitialLoad.current = false
      })
    }
  }, [editor])

  // Update editor content when prop changes (e.g. on chapter switch)
  useEffect(() => {
    if (!editor || isInitialLoad.current) return

    const currentJson = JSON.stringify(editor.getJSON())
    if (content === currentJson) return

    isInitialLoad.current = true
    if (isJsonContent(content)) {
      editor.commands.setContent(JSON.parse(content))
    } else {
      editor.commands.setContent(content || '')
    }
    requestAnimationFrame(() => {
      isInitialLoad.current = false
    })
  }, [content, editor])

  const handleFileUpload = useCallback(async (file: File) => {
    if (!editor) return
    const result = await onImageUpload(file)
    if (result) {
      editor.chain().focus().setImage({
        src: result.url,
        alt: result.title,
        title: result.title,
        imageId: result.id,
      } as any).run()
    }
  }, [editor, onImageUpload])

  const handleToolbarUpload = useCallback(async (file: File) => {
    await handleFileUpload(file)
  }, [handleFileUpload])

  // Listen for insert-image events from the image gallery
  useEffect(() => {
    const handler = (e: Event) => {
      if (!editor) return
      const detail = (e as CustomEvent).detail as { src: string; imageId: string; title: string }
      editor.chain().focus().setImage({
        src: detail.src,
        alt: detail.title,
        title: detail.title,
        imageId: detail.imageId,
      } as any).run()
    }
    window.addEventListener('wbz-insert-image', handler)
    return () => window.removeEventListener('wbz-insert-image', handler)
  }, [editor])

  return (
    <div>
      <EditorToolbar editor={editor} onImageUpload={handleToolbarUpload} />
      <EditorContent editor={editor} />
    </div>
  )
}

/**
 * Extract plain text from TipTap JSON for context/search purposes.
 */
export function extractTextFromTipTapJson(json: string): string {
  try {
    const doc = JSON.parse(json)
    if (doc.type !== 'doc') return json

    const texts: string[] = []
    function walk(node: any) {
      if (node.type === 'text' && node.text) {
        texts.push(node.text)
      }
      if (node.content) {
        for (const child of node.content) {
          walk(child)
        }
      }
    }
    walk(doc)
    return texts.join(' ')
  } catch {
    return json
  }
}
