'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CanvasView } from '@/components/canvas/canvas-view'

export default function CanvasPage() {
  const params = useParams()
  const projectId = params.id as string
  const canvasId = params.canvasId as string

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to project
        </Link>
      </Button>
      <CanvasView canvasId={canvasId} />
    </div>
  )
}
