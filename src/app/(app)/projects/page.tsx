import { ProjectList } from '@/components/projects/project-list'

export default function ProjectsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Browse your projects and jump into chapters.
        </p>
      </div>
      <ProjectList />
    </div>
  )
}
