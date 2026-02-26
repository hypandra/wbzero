'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TagChip } from '@/components/ui/tag-chip'
import { Input } from '@/components/ui/input'

interface ChapterTagManagerProps {
  chapterId: string
  projectId: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  position: { x: number; y: number }
  onClose: () => void
}

interface ProjectTag {
  name: string
  count: number
}

export function ChapterTagManager({
  chapterId,
  projectId,
  tags,
  onTagsChange,
  position,
  onClose,
}: ChapterTagManagerProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [newTag, setNewTag] = useState('')
  const [projectTags, setProjectTags] = useState<ProjectTag[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch project tags for autocomplete
  useEffect(() => {
    const fetchProjectTags = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/tags`)
        if (response.ok) {
          const data = await response.json()
          setProjectTags(data.tags || [])
        }
      } catch {
        // Ignore errors
      }
    }
    fetchProjectTags()
  }, [projectId])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    // Use setTimeout to avoid immediate close from the triggering click
    setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const addTag = async (tagName: string) => {
    const normalized = tagName.trim().toLowerCase()
    if (!normalized || tags.includes(normalized)) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/chapters/${chapterId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_name: normalized }),
      })
      if (response.ok) {
        onTagsChange([...tags, normalized])
        setNewTag('')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const removeTag = async (tagName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/chapters/${chapterId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_name: tagName }),
      })
      if (response.ok) {
        onTagsChange(tags.filter(t => t !== tagName))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Filter suggestions: project tags not already on this chapter
  const suggestions = projectTags
    .filter(pt => !tags.includes(pt.name))
    .filter(pt => !newTag || pt.name.includes(newTag.toLowerCase()))
    .slice(0, 5)

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-64 rounded-lg border bg-popover shadow-lg p-3"
      style={{
        left: position.x,
        top: position.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-3 text-sm font-medium">
        <Tag className="w-4 h-4" />
        Manage Tags
      </div>

      {/* Current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              size="md"
              onRemove={() => removeTag(tag)}
            />
          ))}
        </div>
      )}

      {/* Add new tag input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTag.trim()) {
                addTag(newTag)
              }
            }}
            placeholder="Add tag..."
            className="h-8 text-xs"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => addTag(newTag)}
            disabled={!newTag.trim() || isLoading}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded border',
              newTag.trim() && !isLoading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Suggestions
            </div>
            <div className="flex flex-wrap gap-1">
              {suggestions.map((pt) => (
                <button
                  key={pt.name}
                  type="button"
                  onClick={() => addTag(pt.name)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] hover:bg-muted transition-colors"
                >
                  {pt.name}
                  <span className="text-muted-foreground">({pt.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
