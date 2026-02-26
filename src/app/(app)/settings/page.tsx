'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Prompt {
  id: string
  name: string
  content: string
  version: number
  is_active: boolean
  created_at: string
}

export default function SettingsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [history, setHistory] = useState<Record<string, Prompt[]>>({})
  const [selectedHistory, setSelectedHistory] = useState<Record<string, string>>({})
  const [editContent, setEditContent] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchPrompts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/prompts')
      if (!response.ok) {
        throw new Error('Failed to load prompts')
      }
      const data = await response.json()
      const activePrompts: Prompt[] = data.prompts || []
      setPrompts(activePrompts)

      const historyEntries = await Promise.all(
        activePrompts.map(async (prompt) => {
          const historyResponse = await fetch(`/api/prompts/${prompt.id}/history`)
          if (!historyResponse.ok) {
            return { id: prompt.id, history: [] as Prompt[] }
          }
          const historyData = await historyResponse.json()
          return { id: prompt.id, history: historyData.history || [] }
        })
      )

      const nextHistory: Record<string, Prompt[]> = {}
      const nextSelected: Record<string, string> = {}
      const nextEdits: Record<string, string> = {}

      for (const entry of historyEntries) {
        nextHistory[entry.id] = entry.history
        const activeVersion = entry.history.find((item: Prompt) => item.is_active)
        nextSelected[entry.id] = activeVersion?.id || entry.history[0]?.id || entry.id
        const prompt = activePrompts.find((item: Prompt) => item.id === entry.id)
        if (prompt) {
          nextEdits[prompt.id] = prompt.content
        }
      }

      setHistory(nextHistory)
      setSelectedHistory(nextSelected)
      setEditContent(nextEdits)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [])

  const handleCreate = async () => {
    setError('')
    setIsSaving(true)
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          content: newContent,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to create prompt')
      }

      setNewName('')
      setNewContent('')
      await fetchPrompts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prompt')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async (prompt: Prompt) => {
    setError('')
    setIsSaving(true)
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent[prompt.id] ?? prompt.content,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to update prompt')
      }

      await fetchPrompts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prompt')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRevert = async (prompt: Prompt) => {
    const selectedId = selectedHistory[prompt.id]
    if (!selectedId || selectedId === prompt.id) {
      return
    }

    const selectedVersion = history[prompt.id]?.find((item) => item.id === selectedId)
    if (!selectedVersion) {
      return
    }

    setError('')
    setIsSaving(true)
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: selectedVersion.content,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to revert prompt')
      }

      await fetchPrompts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revert prompt')
    } finally {
      setIsSaving(false)
    }
  }

  const promptCards = useMemo(() => {
    return prompts.map((prompt) => {
      const promptHistory = history[prompt.id] || []
      const selectedId = selectedHistory[prompt.id] || prompt.id
      const selectedEntry = promptHistory.find((item) => item.id === selectedId)
      const isRevertDisabled = !selectedEntry || selectedId === prompt.id

      return (
        <Card key={prompt.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{prompt.name}</span>
              <span className="text-xs text-muted-foreground">v{prompt.version}</span>
            </CardTitle>
            <CardDescription>
              Active prompt template for this style.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={editContent[prompt.id] ?? prompt.content}
              onChange={(event) =>
                setEditContent((prev) => ({ ...prev, [prompt.id]: event.target.value }))
              }
              className="min-h-[140px]"
            />
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">Version history</label>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedId}
                onChange={(event) =>
                  setSelectedHistory((prev) => ({
                    ...prev,
                    [prompt.id]: event.target.value,
                  }))
                }
                disabled={promptHistory.length === 0}
              >
                {promptHistory.length === 0 ? (
                  <option value={prompt.id}>No history</option>
                ) : (
                  promptHistory.map((item) => (
                    <option key={item.id} value={item.id}>
                      v{item.version}
                      {item.is_active ? ' (active)' : ''} -{' '}
                      {new Date(item.created_at).toLocaleString()}
                    </option>
                  ))
                )}
              </select>
              <div className="flex gap-2">
                <Button onClick={() => handleSave(prompt)} disabled={isSaving}>
                  Save new version
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRevert(prompt)}
                  disabled={isSaving || isRevertDisabled}
                >
                  Revert to selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    })
  }, [prompts, history, selectedHistory, editContent, isSaving])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize prompt templates and manage version history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a new prompt</CardTitle>
          <CardDescription>Give each prompt a unique name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="prompt-name">
              Name
            </label>
            <Input
              id="prompt-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g., watercolor"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="prompt-content">
              Template
            </label>
            <Textarea
              id="prompt-content"
              value={newContent}
              onChange={(event) => setNewContent(event.target.value)}
              placeholder="Describe the look and feel you want."
              className="min-h-[120px]"
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Button onClick={handleCreate} disabled={isSaving}>
            Create prompt
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Prompt templates</h2>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading prompts...</div>
        ) : prompts.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No prompts found. Create one to get started.
          </div>
        ) : (
          <div className="space-y-4">{promptCards}</div>
        )}
      </div>
    </div>
  )
}
