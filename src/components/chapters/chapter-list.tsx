'use client'

import { useState } from 'react'
import { ChapterEditor } from './chapter-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react'
import { TagChip } from '@/components/ui/tag-chip'

interface Chapter {
  id: string
  title: string
  content: string
  position: number
  tags?: string[]
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

interface ChapterListProps {
  projectId: string
  chapters: Chapter[]
  images: Image[]
  onChapterUpdate: (chapterId: string, updates: Partial<Chapter>) => Promise<void>
  onChapterDelete: (chapterId: string) => Promise<void>
  onVisualize: (chapterId: string, selectedText: string) => Promise<void>
  onImagesUpdated: () => Promise<void>
  onCreateChapter: (title: string) => Promise<void>
}

export function ChapterList({
  projectId,
  chapters,
  images,
  onChapterUpdate,
  onChapterDelete,
  onVisualize,
  onImagesUpdated,
  onCreateChapter,
}: ChapterListProps) {
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showNewChapterForm, setShowNewChapterForm] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim()) return
    setIsCreating(true)
    try {
      await onCreateChapter(newChapterTitle.trim())
      setNewChapterTitle('')
      setShowNewChapterForm(false)
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsCreating(false)
    }
  }

  const chapterImages = (chapterId: string) => {
    return images.filter(img => img.chapter_id === chapterId)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Chapters</h2>
        {!showNewChapterForm && (
          <Button onClick={() => setShowNewChapterForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Chapter
          </Button>
        )}
      </div>

      {showNewChapterForm && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Chapter title..."
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateChapter()
                  if (e.key === 'Escape') {
                    setShowNewChapterForm(false)
                    setNewChapterTitle('')
                  }
                }}
                autoFocus
              />
              <Button onClick={handleCreateChapter} disabled={isCreating || !newChapterTitle.trim()}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewChapterForm(false)
                  setNewChapterTitle('')
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {chapters.length === 0 && !showNewChapterForm ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No chapters yet. Add a chapter to start writing!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chapters.map((chapter) => (
            <Card key={chapter.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-lg">{chapter.title}</CardTitle>
                    {chapter.tags && chapter.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {chapter.tags.map((tag) => (
                          <TagChip key={tag} tag={tag} size="sm" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedChapterId(
                        expandedChapterId === chapter.id ? null : chapter.id
                      )}
                    >
                      {expandedChapterId === chapter.id ? (
                        <><ChevronUp className="w-4 h-4 mr-1" /> Collapse</>
                      ) : (
                        <><ChevronDown className="w-4 h-4 mr-1" /> Expand</>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onChapterDelete(chapter.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {expandedChapterId === chapter.id && (
                <CardContent>
                  <ChapterEditor
                    projectId={projectId}
                    chapter={chapter}
                    images={chapterImages(chapter.id)}
                    onSave={async (content) => {
                      await onChapterUpdate(chapter.id, { content })
                    }}
                    onVisualize={async (selectedText) => {
                      await onVisualize(chapter.id, selectedText)
                    }}
                    onImagesUpdated={onImagesUpdated}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
