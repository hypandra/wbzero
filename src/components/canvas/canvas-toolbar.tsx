'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LayoutGrid, Plus, Scan, Sparkles } from 'lucide-react'
import { PromptViewerDialog } from '@/components/prompt-viewer-dialog'

const CANVAS_GENERATE_SYSTEM_PROMPT = `You are a creative assistant helping to generate mind map / canvas nodes.
Given a prompt, generate a structured set of nodes and edges for a visual canvas.
Return JSON only, no markdown, in this exact format:
{
  "nodes": [
    { "label": "Node title", "type": "optional type tag", "content": "optional longer description" }
  ],
  "edges": [
    { "from": 0, "to": 1, "label": "optional edge label" }
  ]
}
- Generate 4-8 nodes typically
- Use "from" and "to" as indices into the nodes array
- Types could be: idea, character, location, event, theme, question, etc.
- Keep labels concise (2-5 words)
- Content is optional, use for additional context`

interface CanvasToolbarProps {
  title: string
  onTitleSave: (title: string) => void
  onAddNode: () => void
  onAutoLayout: () => void
  onFitView: () => void
  onGenerate: (prompt: string) => Promise<void>
  isGenerating?: boolean
}

export function CanvasToolbar({
  title,
  onTitleSave,
  onAddNode,
  onAutoLayout,
  onFitView,
  onGenerate,
  isGenerating = false,
}: CanvasToolbarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generatePrompt, setGeneratePrompt] = useState('')

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3 min-w-[220px]">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onTitleSave(draftTitle.trim() || 'Untitled Canvas')
                  setIsEditing(false)
                }
                if (event.key === 'Escape') {
                  setDraftTitle(title)
                  setIsEditing(false)
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => {
                onTitleSave(draftTitle.trim() || 'Untitled Canvas')
                setIsEditing(false)
              }}
            >
              Save
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="text-left"
            onClick={() => {
              setDraftTitle(title)
              setIsEditing(true)
            }}
          >
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Canvas
            </div>
            <div className="text-lg font-semibold">{title}</div>
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onAddNode}>
          <Plus className="w-4 h-4 mr-2" />
          Add node
        </Button>
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center gap-1">
                <DialogTitle>Generate nodes with AI</DialogTitle>
                <PromptViewerDialog
                  prompt={() => ({
                    systemPrompt: CANVAS_GENERATE_SYSTEM_PROMPT,
                    context: `Your Prompt:\n${generatePrompt || '(not yet entered)'}`,
                  })}
                  label="Canvas Generation"
                  description="Generate connected nodes for visual canvases"
                />
              </div>
              <DialogDescription>
                Describe what you want to create and AI will generate connected nodes for your canvas.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="e.g., Character web for a mystery novel with a detective, suspect, victim, and witnesses..."
                className="min-h-[120px]"
                disabled={isGenerating}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Examples: "Plot structure for a three-act story", "Mind map of themes in climate change", "Character relationships for a fantasy epic"
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratePrompt('')
                  setGenerateOpen(false)
                }}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (generatePrompt.trim()) {
                    await onGenerate(generatePrompt.trim())
                    setGeneratePrompt('')
                    setGenerateOpen(false)
                  }
                }}
                disabled={!generatePrompt.trim() || isGenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={onAutoLayout}>
          <LayoutGrid className="w-4 h-4 mr-2" />
          Auto-layout
        </Button>
        <Button variant="ghost" onClick={onFitView}>
          <Scan className="w-4 h-4 mr-2" />
          Fit view
        </Button>
      </div>
    </div>
  )
}
