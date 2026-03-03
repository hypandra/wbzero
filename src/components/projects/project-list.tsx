'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { ProjectCard } from './project-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateProjectDialog } from './create-project-dialog'
import { Loading } from '@/components/ui/spinner'

interface Project {
  id: string
  title: string
  updated_at: string
}

const ORDER_KEY = 'wbzero-project-order'

function applyStoredOrder(projects: Project[]): Project[] {
  try {
    const stored = localStorage.getItem(ORDER_KEY)
    if (!stored) return projects
    const order: string[] = JSON.parse(stored)
    const map = new Map(projects.map((p) => [p.id, p]))
    const sorted = order.flatMap((id) => (map.has(id) ? [map.get(id)!] : []))
    const unordered = projects.filter((p) => !order.includes(p.id))
    return [...sorted, ...unordered]
  } catch {
    return projects
  }
}

function saveOrder(projects: Project[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(projects.map((p) => p.id)))
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(applyStoredOrder(data.projects || []))
    } catch {
      setError('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setProjects((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id)
      const newIndex = prev.findIndex((p) => p.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)
      saveOrder(reordered)
      return reordered
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading message="Loading projects..." />
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet. Start writing!</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first project
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={projects.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onDelete={fetchProjects} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProjectCreated={fetchProjects}
      />
    </div>
  )
}
