'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Layers,
  Settings,
  ScrollText,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TagChip } from '@/components/ui/tag-chip'
import { ChapterTagManager } from '@/components/chapters/chapter-tag-manager'
import { Loading } from '@/components/ui/spinner'

interface Project {
  id: string
  title: string
}

interface Chapter {
  id: string
  title: string
  tags?: string[]
}

interface Canvas {
  id: string
  title: string
}

interface TagManagerState {
  chapterId: string
  position: { x: number; y: number }
}

export function LeftNavTree() {
  const pathname = usePathname()
  const projectId = useMemo(() => {
    const match = pathname.match(/^\/projects\/([^/]+)/)
    return match?.[1] ?? null
  }, [pathname])
  const [projects, setProjects] = useState<Project[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCanvasLoading, setIsCanvasLoading] = useState(false)
  const [tagManager, setTagManager] = useState<TagManagerState | null>(null)

  const removeTag = async (chapterId: string, tagName: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_name: tagName }),
      })
      if (response.ok) {
        setChapters(prev =>
          prev.map(c =>
            c.id === chapterId
              ? { ...c, tags: c.tags?.filter(t => t !== tagName) }
              : c
          )
        )
      }
    } catch {
      // Ignore errors
    }
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) return
        const data = await response.json()
        setProjects(data.projects || [])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  useEffect(() => {
    if (!projectId) {
      setChapters([])
      return
    }

    setExpandedProjectId(projectId)
    const fetchProjectChapters = async () => {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) return
      const data = await response.json()
      setChapters(data.chapters || [])
    }

    fetchProjectChapters()
  }, [projectId])

  useEffect(() => {
    if (!expandedProjectId) {
      setCanvases([])
      return
    }

    setIsCanvasLoading(true)
    const fetchCanvases = async () => {
      const response = await fetch(`/api/projects/${expandedProjectId}/canvases`)
      if (response.ok) {
        const data = await response.json()
        setCanvases(data.canvases || [])
      } else {
        setCanvases([])
      }
      setIsCanvasLoading(false)
    }

    fetchCanvases()
  }, [expandedProjectId])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b">
        <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
          Navigation
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-4">
          <Link
            href="/changes"
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1 text-sm',
              pathname === '/changes'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <ScrollText className="w-4 h-4" />
            <span>Changelog</span>
          </Link>
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1 text-sm',
              pathname === '/settings'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </div>
        {isLoading ? (
          <div className="px-2"><Loading message="Loading workspace..." /></div>
        ) : projects.length === 0 ? (
          <div className="text-sm text-muted-foreground px-2">
            Create a project to start building chapters.
          </div>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => {
              const isCurrent = project.id === projectId
              const isExpanded = expandedProjectId === project.id
              return (
                <li key={project.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedProjectId(isExpanded ? null : project.id)
                      }
                      className="p-1 text-muted-foreground hover:text-foreground"
                      aria-label={isExpanded ? 'Collapse project' : 'Expand project'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      href={`/projects/${project.id}`}
                      className={cn(
                        'flex-1 flex items-center gap-2 rounded px-2 py-1 text-sm',
                        isCurrent
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      )}
                    >
                      {isCurrent && isExpanded ? (
                        <FolderOpen className="w-4 h-4" />
                      ) : (
                        <Folder className="w-4 h-4" />
                      )}
                      <span className="truncate">{project.title}</span>
                    </Link>
                  </div>
                  {isExpanded && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground px-2">
                          <Layers className="w-3 h-3" />
                          Canvases
                        </div>
                        {isCanvasLoading ? (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            Loading canvases...
                          </div>
                        ) : canvases.length === 0 ? (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            No canvases yet
                          </div>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {canvases.map((canvas) => (
                              <li key={canvas.id}>
                                <Link
                                  href={`/projects/${project.id}/canvas/${canvas.id}`}
                                  className="block rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                >
                                  {canvas.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground px-2">
                          <FileText className="w-3 h-3" />
                          Chapters
                        </div>
                        {isCurrent ? (
                          chapters.length === 0 ? (
                            <div className="px-2 py-1 text-xs text-muted-foreground">
                              No chapters yet
                            </div>
                          ) : (
                            <ul className="mt-1 space-y-1">
                              {chapters.map((chapter) => (
                                <li
                                  key={chapter.id}
                                  className="group flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60 rounded"
                                  onContextMenu={(e) => {
                                    e.preventDefault()
                                    setTagManager({
                                      chapterId: chapter.id,
                                      position: { x: e.clientX, y: e.clientY },
                                    })
                                  }}
                                >
                                  <FileText className="w-3 h-3 shrink-0" />
                                  <span className="truncate flex-1">{chapter.title}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      setTagManager({
                                        chapterId: chapter.id,
                                        position: { x: rect.right + 8, y: rect.top },
                                      })
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded transition-opacity shrink-0"
                                    title="Manage tags"
                                  >
                                    <Tag className="w-3 h-3" />
                                  </button>
                                  {chapter.tags && chapter.tags.length > 0 && (
                                    <div className="flex gap-0.5 shrink-0">
                                      {chapter.tags.slice(0, 2).map((tag) => (
                                        <TagChip
                                          key={tag}
                                          tag={tag}
                                          size="sm"
                                          onRemove={() => removeTag(chapter.id, tag)}
                                        />
                                      ))}
                                      {chapter.tags.length > 2 && (
                                        <span className="text-[10px] text-muted-foreground">
                                          +{chapter.tags.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )
                        ) : (
                          <div className="px-2 py-1 text-xs text-muted-foreground">
                            Open project to view chapters
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Tag Manager Popover */}
      {tagManager && projectId && (
        <ChapterTagManager
          chapterId={tagManager.chapterId}
          projectId={projectId}
          tags={chapters.find(c => c.id === tagManager.chapterId)?.tags || []}
          onTagsChange={(newTags) => {
            setChapters(prev =>
              prev.map(c =>
                c.id === tagManager.chapterId
                  ? { ...c, tags: newTags }
                  : c
              )
            )
          }}
          position={tagManager.position}
          onClose={() => setTagManager(null)}
        />
      )}
    </div>
  )
}
