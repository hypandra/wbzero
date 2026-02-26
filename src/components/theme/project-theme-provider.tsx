'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { defaultAITheme, type AITheme, themeToCssVarsObject } from '@/lib/theme/ai-theme'

interface ThemeRecord {
  id: string
  name: string
  prompt: string | null
  theme: AITheme
  created_at: string
}

interface ThemeContextValue {
  activeTheme: ThemeRecord | null
  previewTheme: AITheme | null
  setPreviewTheme: (theme: AITheme | null) => void
  refresh: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useProjectTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useProjectTheme must be used within ProjectThemeProvider')
  }
  return context
}

export function ProjectThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<ThemeRecord | null>(null)
  const [previewTheme, setPreviewTheme] = useState<AITheme | null>(null)

  const loadTheme = useCallback(async () => {
    const data = await apiFetch<{ activeTheme: ThemeRecord | null }>(`/api/theme`)
    setActiveTheme(data.activeTheme ?? null)
  }, [])

  useEffect(() => {
    loadTheme()
  }, [loadTheme])

  const resolvedTheme = previewTheme ?? activeTheme?.theme ?? defaultAITheme
  const style = themeToCssVarsObject(resolvedTheme)

  return (
    <ThemeContext.Provider value={{ activeTheme, previewTheme, setPreviewTheme, refresh: loadTheme }}>
      <div className="theme-surface" style={style}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
