'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

interface ProjectCardProps {
  project: {
    id: string
    title: string
    updated_at: string
  }
  onDelete: () => void
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const date = new Date(project.updated_at)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative group">
      <Link href={`/projects/${project.id}`}>
        <Card className="hover:border-primary transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg pr-8">{project.title}</CardTitle>
            <CardDescription>Updated {formattedDate}</CardDescription>
          </CardHeader>
        </Card>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            disabled={isDeleting}
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 size={15} />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{project.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all its contents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
