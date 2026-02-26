'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    updated_at: string
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const date = new Date(project.updated_at)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{project.title}</CardTitle>
          <CardDescription>Updated {formattedDate}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
