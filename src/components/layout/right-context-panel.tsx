'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ImageIcon, Link2 } from 'lucide-react'
import { TagChip } from '@/components/ui/tag-chip'
import { CanvasList } from '@/components/canvas/canvas-list'
import { useErrorAlert } from '@/components/error-alert-provider'
import { MuseSection } from '@/components/muses/muse-section'
import { ThemeLabDialog } from '@/components/theme/theme-lab-dialog'

interface Chapter {
  id: string
  title: string
  tags?: string[]
}

interface Image {
  id: string
  url: string
  source_text: string
  chapter_id: string
}

interface Canvas {
  id: string
  title: string
}

export function RightContextPanel() {
  const pathname = usePathname()
  const router = useRouter()
  const { showError } = useErrorAlert()
  const projectId = useMemo(() => {
    const match = pathname.match(/^\/projects\/([^/]+)/)
    return match?.[1] ?? null
  }, [pathname])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchContext = async () => {
      if (!projectId) {
        setChapters([])
        setImages([])
        setCanvases([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [projectResponse, canvasResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/canvases`),
        ])
        if (projectResponse.ok) {
          const data = await projectResponse.json()
          setChapters(data.chapters || [])
          setImages(data.images || [])
        }
        if (canvasResponse.ok) {
          const canvasData = await canvasResponse.json()
          setCanvases(canvasData.canvases || [])
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchContext()
  }, [projectId])

  // Listen for canvas updates to refresh title
  useEffect(() => {
    const handleCanvasUpdate = (event: CustomEvent<{ id: string; title: string }>) => {
      setCanvases(prev => prev.map(c =>
        c.id === event.detail.id ? { ...c, title: event.detail.title } : c
      ))
    }
    window.addEventListener('canvas-updated', handleCanvasUpdate as EventListener)
    return () => window.removeEventListener('canvas-updated', handleCanvasUpdate as EventListener)
  }, [])

  const handleCreateCanvas = async () => {
    if (!projectId) return

    // Check for existing untitled canvas and navigate to it instead
    const existingUntitled = canvases.find(c => c.title === 'Untitled Canvas')
    if (existingUntitled) {
      router.push(`/projects/${projectId}/canvas/${existingUntitled.id}`)
      return
    }

    setIsCreatingCanvas(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/canvases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Canvas' }),
      })
      if (!response.ok) {
        throw new Error('Failed to create canvas')
      }
      const data = await response.json()
      setCanvases((prev) => [data.canvas, ...prev])
      router.push(`/projects/${projectId}/canvas/${data.canvas.id}`)
    } catch (error) {
      // eslint-disable-next-line no-alert
      showError('Failed to create canvas', 'Please try again.')
    } finally {
      setIsCreatingCanvas(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b">
        <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
          Context
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {!projectId ? (
          <div className="text-sm text-muted-foreground">
            Select a project to explore relationships and artifacts.
          </div>
        ) : isLoading ? (
          <div className="text-sm text-muted-foreground">Loading connections...</div>
        ) : (
          <>
            <div className="space-y-2">
              <CanvasList
                projectId={projectId}
                canvases={canvases}
                isCreating={isCreatingCanvas}
                onCreateCanvas={handleCreateCanvas}
                onDeleteCanvas={(id) => setCanvases((prev) => prev.filter((c) => c.id !== id))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                Related chapters
              </div>
              {chapters.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Chapters will appear here as you build your project.
                </div>
              ) : (
                <ul className="space-y-2">
                  {chapters.slice(0, 6).map((chapter) => (
                    <li
                      key={chapter.id}
                      className="text-xs text-muted-foreground"
                    >
                      <div className="truncate">{chapter.title}</div>
                      {chapter.tags && chapter.tags.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {chapter.tags.slice(0, 3).map((tag) => (
                            <TagChip key={tag} tag={tag} size="sm" />
                          ))}
                          {chapter.tags.length > 3 && (
                            <span className="text-[10px]">+{chapter.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                Generated images
              </div>
              {images.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Visualizations will show up as you generate them.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {images.slice(0, 6).map((image) => (
                    <div
                      key={image.id}
                      className="rounded border bg-muted/30 overflow-hidden"
                    >
                      <img
                        src={image.url}
                        alt={image.source_text || 'Generated image'}
                        className="h-20 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Relationship map</div>
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
                Network view placeholder. We can visualize chapter links and imagery here next.
              </div>
            </div>

            <div className="pt-2">
              <MuseSection projectId={projectId} images={images} filePath={pathname} />
            </div>
          </>
        )}
        <div className="pt-4">
          <div className="text-sm font-medium mb-2">Style</div>
          <ThemeLabDialog />
        </div>
      </div>
    </div>
  )
}
