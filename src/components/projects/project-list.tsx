'use client'

import { useState, useEffect } from 'react'
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

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      setError('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = () => {
    setCreateDialogOpen(true)
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
        <Button onClick={handleCreateProject}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet. Start writing!</p>
          <Button onClick={handleCreateProject}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onProjectCreated={fetchProjects}
      />
    </div>
  )
}
