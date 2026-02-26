'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Layers, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useErrorAlert } from '@/components/error-alert-provider'

interface Canvas {
  id: string
  title: string
}

interface CanvasListProps {
  projectId: string
  canvases: Canvas[]
  isCreating?: boolean
  onCreateCanvas: () => void
  onDeleteCanvas?: (id: string) => void
}

export function CanvasList({
  projectId,
  canvases,
  isCreating,
  onCreateCanvas,
  onDeleteCanvas,
}: CanvasListProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { showError } = useErrorAlert()
  const [deleteTarget, setDeleteTarget] = useState<Canvas | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/canvases/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete canvas')
      }
      onDeleteCanvas?.(deleteTarget.id)
      // If we're viewing the deleted canvas, navigate away
      if (pathname.includes(`/canvas/${deleteTarget.id}`)) {
        router.push(`/projects/${projectId}`)
      }
    } catch (err) {
      showError('Failed to delete canvas', 'Please try again.')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className="w-4 h-4 text-muted-foreground" />
          Canvases
        </div>
        <Button size="sm" variant="outline" onClick={onCreateCanvas} disabled={isCreating}>
          <Plus className="w-3 h-3 mr-1" />
          New
        </Button>
      </div>
      {canvases.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          No canvases yet. Create one to start mapping ideas.
        </div>
      ) : (
        <ul className="space-y-1">
          {canvases.map((canvas) => (
            <li key={canvas.id} className="group flex items-center">
              <Link
                href={`/projects/${projectId}/canvas/${canvas.id}`}
                className="flex-1 flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
              >
                <span className="truncate">{canvas.title}</span>
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(canvas)}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                title="Delete canvas"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.title}&rdquo; and all its nodes and connections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
