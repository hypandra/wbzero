'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Save, Trash2, ImageDown, Pencil } from 'lucide-react'
import { ImageRefineDialog } from './image-refine-dialog'
import { PromptViewerDialog } from '@/components/prompt-viewer-dialog'
import { DEFAULT_PROMPT_TEMPLATE, renderPromptTemplate } from '@/lib/prompts'
import { useErrorAlert } from '@/components/error-alert-provider'
import { setMuseDocumentContext } from '@/lib/muses/context'
import { TipTapEditor, extractTextFromTipTapJson } from './tiptap-editor'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ChapterEditorProps {
  projectId: string
  chapter: {
    id: string
    title: string
    content: string
  }
  images: Array<{
    id: string
    url: string
    source_text: string
    parent_id?: string | null
    refinement_prompt?: string | null
    title?: string | null
  }>
  onSave: (content: string) => Promise<void>
  onVisualize: (selectedText: string) => Promise<void>
  onImagesUpdated: () => Promise<void>
}

export function ChapterEditor({
  projectId,
  chapter,
  images,
  onSave,
  onVisualize,
  onImagesUpdated,
}: ChapterEditorProps) {
  const { showError } = useErrorAlert()
  const [content, setContent] = useState(chapter.content)
  const [selectedText, setSelectedText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [refineTarget, setRefineTarget] = useState<ChapterEditorProps['images'][number] | null>(null)
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const imageLookup = new Map(images.map((image) => [image.id, image]))

  useEffect(() => {
    // Extract plain text for muse context
    const plainContent = content.startsWith('{')
      ? extractTextFromTipTapJson(content)
      : content

    setMuseDocumentContext({
      id: chapter.id,
      title: chapter.title,
      content: plainContent,
      path: `/projects/${projectId}?chapter=${chapter.id}`,
    })

    return () => {
      setMuseDocumentContext(null)
    }
  }, [chapter.id, chapter.title, content, projectId])

  const handleContentChange = useCallback((json: string) => {
    setContent(json)

    // Auto-save with debounce
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave(json)
      } catch {
        // Silent fail on auto-save — user can manually save
      }
    }, 2000)
  }, [onSave])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  const handleVisualize = async () => {
    if (!selectedText) return
    setIsGenerating(true)
    try {
      await onVisualize(selectedText)
      setSelectedText('')
    } catch (err) {
      showError('Failed to generate image', 'Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    setIsSaving(true)
    try {
      await onSave(content)
    } catch (err) {
      showError('Failed to save chapter', 'Your changes may not have been saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    setDeletingId(imageId)
    try {
      const response = await fetch(`/api/images/${imageId}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete image')
      }
      await onImagesUpdated()
    } catch (err) {
      showError('Failed to delete image', 'Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleTitleEdit = (image: ChapterEditorProps['images'][number]) => {
    setEditingTitleId(image.id)
    setEditingTitleValue(image.title || image.source_text?.slice(0, 50) || '')
  }

  const handleTitleSave = async (imageId: string) => {
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitleValue.trim() }),
      })
      if (!response.ok) throw new Error('Failed to update title')
      await onImagesUpdated()
    } catch (err) {
      showError('Failed to update title', 'Please try again.')
    } finally {
      setEditingTitleId(null)
    }
  }

  const handleImageUpload = useCallback(async (file: File): Promise<{ id: string; url: string; title: string } | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chapter_id', chapter.id)

    try {
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Upload failed')
      }
      const data = await response.json()
      await onImagesUpdated()
      return { id: data.image.id, url: data.image.url, title: data.image.title || file.name }
    } catch (err) {
      showError('Failed to upload image', err instanceof Error ? err.message : 'Please try again.')
      return null
    }
  }, [chapter.id, onImagesUpdated, showError])

  const displayTitle = (image: ChapterEditorProps['images'][number]) => {
    if (image.title) return image.title
    if (image.source_text) return image.source_text.slice(0, 50) + (image.source_text.length > 50 ? '...' : '')
    return 'Untitled'
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <TipTapEditor
          content={content}
          onChange={handleContentChange}
          onTextSelected={setSelectedText}
          onImageUpload={handleImageUpload}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {selectedText && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground mb-2">
              Selected: &quot;{selectedText.slice(0, 100)}{selectedText.length > 100 ? '...' : ''}&quot;
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleVisualize}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? 'Creating illustration...' : 'Illustrate this'}
              </Button>
              <PromptViewerDialog
                prompt={() => ({
                  systemPrompt: `Prompt Template:\n${DEFAULT_PROMPT_TEMPLATE}\n\n(Customize your prompt template in Settings)`,
                  context: `Full Prompt (with selected text):\n${renderPromptTemplate(DEFAULT_PROMPT_TEMPLATE, selectedText)}`,
                })}
                label="Image Generation"
                description="Generate illustrations from selected text"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {images.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3">Illustrations</h4>
          <div className="grid grid-cols-2 gap-4">
            {images.map((image) => (
              <Card key={image.id} id={`image-${image.id}`} className="overflow-hidden group">
                <div className="relative">
                  <img src={image.url} alt={displayTitle(image)} className="w-full" />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={deletingId === image.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete illustration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the illustration. It can&apos;t be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteImage(image.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardContent className="py-2 space-y-2">
                  {editingTitleId === image.id ? (
                    <Input
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTitleSave(image.id)
                        if (e.key === 'Escape') setEditingTitleId(null)
                      }}
                      onBlur={() => handleTitleSave(image.id)}
                      className="text-xs h-7"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => handleTitleEdit(image)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1 text-left"
                    >
                      <span>&quot;{displayTitle(image)}&quot;</span>
                      <Pencil className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                  {image.parent_id && (
                    <a
                      href={`#image-${image.parent_id}`}
                      className="text-xs text-primary underline"
                    >
                      Refined from previous image
                    </a>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRefineTarget(image)}
                    >
                      Refine
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Insert into editor"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        // Dispatch a custom event that TipTapEditor can listen for
                        window.dispatchEvent(new CustomEvent('wbz-insert-image', {
                          detail: { src: image.url, imageId: image.id, title: displayTitle(image) }
                        }))
                      }}
                    >
                      <ImageDown className="h-4 w-4" />
                    </Button>
                    {image.parent_id && imageLookup.get(image.parent_id)?.source_text && (
                      <span className="text-xs text-muted-foreground">
                        Source: {imageLookup.get(image.parent_id)?.source_text?.slice(0, 40)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {refineTarget && (
        <ImageRefineDialog
          open={!!refineTarget}
          onOpenChange={(open) => {
            if (!open) setRefineTarget(null)
          }}
          image={{
            id: refineTarget.id,
            url: refineTarget.url,
            source_text: refineTarget.source_text,
          }}
          onRefresh={onImagesUpdated}
        />
      )}
    </div>
  )
}
