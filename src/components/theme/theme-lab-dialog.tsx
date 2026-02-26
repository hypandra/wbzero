'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useErrorAlert } from '@/components/error-alert-provider'
import { apiFetch, parseError } from '@/lib/api'
import { defaultAITheme, type AITheme } from '@/lib/theme/ai-theme'
import { useProjectTheme } from '@/components/theme/project-theme-provider'

interface ThemeRecord {
  id: string
  name: string
  prompt: string | null
  theme: AITheme
  created_at: string
}

export function ThemeLabDialog() {
  const { showError } = useErrorAlert()
  const { activeTheme, previewTheme, setPreviewTheme, refresh } = useProjectTheme()
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<ThemeRecord[]>([])
  const [generatedTheme, setGeneratedTheme] = useState<AITheme | null>(null)
  const [activeTab, setActiveTab] = useState<'generated' | 'preview'>('generated')

  const loadHistory = async () => {
    const data = await apiFetch<{ themes: ThemeRecord[] }>(`/api/theme`)
    setHistory(data.themes ?? [])
  }

  useEffect(() => {
    if (!open) return
    loadHistory().catch((error) => {
      const { title, description } = parseError(error)
      showError(title, description)
    })
  }, [open])

  const displayTheme = activeTab === 'preview' && previewTheme
    ? previewTheme
    : generatedTheme ?? activeTheme?.theme ?? defaultAITheme

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    try {
      const data = await apiFetch<{ theme: AITheme; error?: string }>(`/api/theme/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      setGeneratedTheme(data.theme)
      setActiveTab('generated')
    } catch (error) {
      const { title, description } = parseError(error)
      showError(title, description)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyGenerated = async () => {
    const themeToApply = previewTheme ?? generatedTheme
    if (!themeToApply) return
    try {
      await apiFetch(`/api/theme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, theme: themeToApply }),
      })
      await refresh()
      await loadHistory()
      setGeneratedTheme(null)
      setPreviewTheme(null)
      setPrompt('')
      setActiveTab('generated')
    } catch (error) {
      const { title, description } = parseError(error)
      showError(title, description)
    }
  }

  const handleReset = async () => {
    try {
      await apiFetch(`/api/theme`, { method: 'DELETE' })
      await refresh()
      setPreviewTheme(null)
      setGeneratedTheme(null)
      setActiveTab('generated')
    } catch (error) {
      const { title, description } = parseError(error)
      showError(title, description)
    }
  }

  const handleApplyVersion = async (themeId: string) => {
    try {
      await apiFetch(`/api/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      })
      await refresh()
    } catch (error) {
      const { title, description } = parseError(error)
      showError(title, description)
    }
  }

  const previewLabel = useMemo(() => {
    if (activeTab === 'preview') return 'Previewing theme'
    if (generatedTheme) return 'Generated theme'
    return 'Live theme'
  }, [activeTab, generatedTheme])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Theme Lab
      </Button>
      <DialogContent
        className="left-auto right-6 top-16 translate-x-0 translate-y-0 w-[32rem] max-w-[90vw] max-h-[85vh] overflow-y-auto"
        overlayClassName="bg-transparent"
      >
        <DialogHeader>
          <DialogTitle>Theme Lab</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{previewLabel}</div>
            <div className="text-base font-semibold">{displayTheme.name}</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Heading font: {displayTheme.typography.headingFont}</div>
              <div>Body font: {displayTheme.typography.bodyFont}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(displayTheme.palette).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-5 w-5 rounded border"
                    style={{ background: value, borderColor: displayTheme.palette.border }}
                  />
                  <span className="text-muted-foreground">{key}</span>
                </div>
              ))}
            </div>
            {generatedTheme && !previewTheme ? (
              <div className="inline-flex rounded-full border bg-background p-1 text-[11px]">
                <button
                  type="button"
                  className={activeTab === 'generated'
                    ? 'rounded-full px-3 py-1 bg-foreground/10 text-foreground'
                    : 'rounded-full px-3 py-1 text-muted-foreground hover:text-foreground'}
                  onClick={() => setActiveTab('generated')}
                >
                  Generated theme
                </button>
              </div>
            ) : (
              <div className="inline-flex rounded-full border bg-background p-1 text-[11px]">
                <span className="rounded-full px-3 py-1 bg-foreground/10 text-foreground">
                  Preview theme
                </span>
              </div>
            )}
            <div className="flex gap-2">
              {generatedTheme && !previewTheme ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!generatedTheme) return
                    setPreviewTheme(generatedTheme)
                    setActiveTab('preview')
                  }}
                >
                  Preview this theme
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                  >
                    Clear preview
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleApplyGenerated}
                  >
                    Apply theme
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Generate with AI</div>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the vibe: cozy cabin, oceanic sci‑fi, elegant serif, etc."
              className="min-h-[90px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
                {isGenerating ? 'Generating...' : 'Generate theme'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleApplyGenerated}
                disabled={!generatedTheme}
              >
                Apply generated theme
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Theme versions</div>
            {history.length === 0 ? (
              <div className="text-xs text-muted-foreground">No saved themes yet.</div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-md border bg-background p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewTheme(item.theme)}
                        >
                          Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApplyVersion(item.id)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    {item.prompt ? (
                      <div className="text-xs text-muted-foreground">
                        Prompt: {item.prompt}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
