'use client'

import { useState } from 'react'
import { FileCog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export interface PromptData {
  systemPrompt: string
  context?: string
}

interface PromptViewerDialogProps {
  /** The prompt data to display, or a function that returns it (for lazy loading) */
  prompt: PromptData | (() => PromptData) | (() => Promise<PromptData>)
  /** Label for what this prompt is for (e.g., "Muse: Melete", "Image Generation") */
  label: string
  /** Optional description of what this AI does */
  description?: string
  /** Size of the trigger button */
  size?: 'sm' | 'default'
}

export function PromptViewerDialog({
  prompt,
  label,
  description,
  size = 'sm',
}: PromptViewerDialogProps) {
  const [open, setOpen] = useState(false)
  const [promptData, setPromptData] = useState<PromptData | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && promptData === null) {
      setLoading(true)
      try {
        if (typeof prompt === 'function') {
          const result = prompt()
          if (result instanceof Promise) {
            setPromptData(await result)
          } else {
            setPromptData(result)
          }
        } else {
          setPromptData(prompt)
        }
      } catch (error) {
        setPromptData({ systemPrompt: `Error loading prompt: ${error}` })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button
        variant="ghost"
        size="icon"
        className={size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'}
        onClick={() => handleOpen(true)}
        aria-label={`View ${label} prompt`}
        title={`View ${label} prompt`}
      >
        <FileCog className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </Button>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{label} Prompt</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-auto space-y-6 py-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading prompt...</div>
          ) : promptData ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  System Prompt
                </label>
                <Textarea
                  readOnly
                  value={promptData.systemPrompt}
                  className="min-h-[120px] font-mono text-sm resize-none"
                />
              </div>
              {promptData.context && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Context
                  </label>
                  <Textarea
                    readOnly
                    value={promptData.context}
                    className="min-h-[120px] font-mono text-sm resize-none"
                  />
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
