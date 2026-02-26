'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChapterList } from '@/components/chapters/chapter-list'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useErrorAlert } from '@/components/error-alert-provider'
import { parseError } from '@/lib/api'

interface Project {
  id: string
  title: string
  user_id: string
}

interface Chapter {
  id: string
  title: string
  content: string
  position: number
}

interface Image {
  id: string
  url: string
  source_text: string
  chapter_id: string
  parent_id?: string | null
  refinement_prompt?: string | null
  title?: string | null
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showError } = useErrorAlert()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [images, setImages] = useState<Image[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Project not found')
        } else {
          throw new Error('Failed to fetch project')
        }
        return
      }
      const data = await response.json()
      setProject(data.project)
      setChapters(data.chapters || [])
      setImages(data.images || [])
    } catch (err) {
      setError('Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChapter = async (title: string) => {
    const response = await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        title,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create chapter')
    }

    await fetchProject()
  }

  const handleChapterUpdate = async (chapterId: string, updates: Partial<Chapter>) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update chapter')
      }

      await fetchProject()
    } catch (err) {
      showError('Failed to update chapter', 'Your changes may not have been saved.')
      throw err
    }
  }

  const handleChapterDelete = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return

    try {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete chapter')
      }

      await fetchProject()
    } catch (err) {
      showError('Failed to delete chapter', 'Please try again.')
    }
  }

  const handleVisualize = async (chapterId: string, selectedText: string) => {
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapterId,
          source_text: selectedText,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate image')
      }

      await fetchProject()
    } catch (err) {
      const { title, description } = parseError(err)
      showError(title, description)
      throw err
    }
  }

  const handleImagesUpdated = async () => {
    await fetchProject()
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">Loading project...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center text-destructive">{error || 'Project not found'}</div>
        <div className="text-center mt-4">
          <Button asChild variant="link">
            <Link href="/projects">Back to My Projects</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Projects
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{project.title}</h1>
      </div>

      <ChapterList
        projectId={projectId}
        chapters={chapters}
        images={images}
        onChapterUpdate={handleChapterUpdate}
        onChapterDelete={handleChapterDelete}
        onVisualize={handleVisualize}
        onImagesUpdated={handleImagesUpdated}
        onCreateChapter={handleCreateChapter}
      />
    </div>
  )
}
