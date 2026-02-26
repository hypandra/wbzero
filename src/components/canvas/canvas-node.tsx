'use client'

import { useEffect, useRef, useState } from 'react'
import { Handle, type Node as FlowNode, type NodeProps, Position } from '@xyflow/react'
import { Link2, Palette, Tag, Trash2, Unlink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NodeTypeDialog, NodeColorDialog } from './node-edit-dialog'

interface ChapterOption {
  id: string
  title: string
}

export interface CanvasNodeData extends Record<string, unknown> {
  label: string
  type?: string | null
  content?: string | null
  color?: string | null
  chapter_id?: string | null
  image_id?: string | null
  chapters?: ChapterOption[]
  onUpdate?: (id: string, updates: Partial<CanvasNodeData>) => void
  onDelete?: (id: string) => void
  onOpenChapter?: (chapterId: string) => void
}

export type CanvasNodeType = FlowNode<CanvasNodeData, 'canvas'>

export function CanvasNode({ id, data, selected }: NodeProps<CanvasNodeType>) {
  const [isEditing, setIsEditing] = useState(false)
  const [labelValue, setLabelValue] = useState(data.label)
  const [contentValue, setContentValue] = useState(data.content || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [colorDialogOpen, setColorDialogOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setLabelValue(data.label)
  }, [data.label])

  useEffect(() => {
    setContentValue(data.content || '')
  }, [data.content])

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const isLinked = Boolean(data.chapter_id || data.image_id)
  const showChapterLink = Boolean(data.chapter_id)
  const borderColor = data.color || (isLinked ? '#10b981' : undefined)

  const handleSave = () => {
    setIsEditing(false)
    if (labelValue.trim() !== data.label || contentValue !== (data.content || '')) {
      data.onUpdate?.(id, {
        label: labelValue.trim() || 'New node',
        content: contentValue.trim() || null,
      })
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-white px-3 py-2 text-xs shadow-sm min-w-[160px]',
        selected ? 'ring-2 ring-blue-400' : 'ring-0'
      )}
      style={{ borderColor }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        setIsEditing(true)
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        setMenuOpen(true)
      }}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <Handle type="source" position={Position.Right} className="w-2 h-2" />

      {isEditing ? (
        <div className="space-y-2">
          <Input
            value={labelValue}
            onChange={(event) => setLabelValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSave()
              if (event.key === 'Escape') {
                setLabelValue(data.label)
                setContentValue(data.content || '')
                setIsEditing(false)
              }
            }}
            autoFocus
          />
          <textarea
            value={contentValue}
            onChange={(event) => setContentValue(event.target.value)}
            className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs"
            rows={3}
            placeholder="Add notes..."
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLabelValue(data.label)
                setContentValue(data.content || '')
                setIsEditing(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-1">
            <div className="font-semibold text-sm text-center">{data.label}</div>
            {data.type ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
                {data.type}
              </span>
            ) : null}
          </div>
          {data.content ? (
            <div className="mt-1 text-[11px] text-muted-foreground line-clamp-3 text-center">
              {data.content}
            </div>
          ) : null}
          {showChapterLink ? (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-600"
              onClick={(event) => {
                event.stopPropagation()
                if (data.chapter_id) {
                  data.onOpenChapter?.(data.chapter_id)
                }
              }}
            >
              <Link2 className="w-3 h-3" />
              Linked
            </button>
          ) : null}
        </>
      )}

      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-20 mt-2 w-48 rounded-md border bg-white shadow-lg p-2 text-xs"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-muted"
            onClick={() => {
              setMenuOpen(false)
              setTypeDialogOpen(true)
            }}
          >
            <Tag className="w-3 h-3" />
            Set type
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-muted"
            onClick={() => {
              setMenuOpen(false)
              setColorDialogOpen(true)
            }}
          >
            <Palette className="w-3 h-3" />
            Set color
          </button>
          {data.chapters && data.chapters.length > 0 ? (
            <div className="mt-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Link to chapter
              </div>
              <select
                className="w-full rounded border border-input bg-transparent px-2 py-1 text-xs"
                value={data.chapter_id || ''}
                onChange={(event) => {
                  const nextId = event.target.value || null
                  data.onUpdate?.(id, { chapter_id: nextId })
                  setMenuOpen(false)
                }}
              >
                <option value="">None</option>
                {data.chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {data.chapter_id ? (
            <button
              type="button"
              className="mt-2 flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-muted"
              onClick={() => {
                data.onUpdate?.(id, { chapter_id: null })
                setMenuOpen(false)
              }}
            >
              <Unlink className="w-3 h-3" />
              Remove link
            </button>
          ) : null}
          <button
            type="button"
            className="mt-2 flex w-full items-center gap-2 rounded px-2 py-1 text-destructive hover:bg-destructive/10"
            onClick={() => {
              data.onDelete?.(id)
              setMenuOpen(false)
            }}
          >
            <Trash2 className="w-3 h-3" />
            Delete node
          </button>
        </div>
      )}

      <NodeTypeDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        currentValue={data.type || null}
        onSave={(value) => data.onUpdate?.(id, { type: value })}
      />

      <NodeColorDialog
        open={colorDialogOpen}
        onOpenChange={setColorDialogOpen}
        currentValue={data.color || null}
        onSave={(value) => data.onUpdate?.(id, { color: value })}
      />
    </div>
  )
}
