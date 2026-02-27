'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut } from '@/lib/auth-client'
import { LeftNavTree } from '@/components/layout/left-nav-tree'
import { RightContextPanel } from '@/components/layout/right-context-panel'
import { ProjectThemeProvider } from '@/components/theme/project-theme-provider'
import { Loading } from '@/components/ui/spinner'
import { PanelRight, Layers, ImageIcon, Sparkles, Palette, UserCircle } from 'lucide-react'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [rightCollapsed, setRightCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('wbz-right-collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('wbz-right-collapsed', String(rightCollapsed))
  }, [rightCollapsed])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        setRightCollapsed(c => !c)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <ProjectThemeProvider>
      <div className="min-h-screen flex flex-col bg-[var(--theme-bg)] text-[var(--theme-fg)]">
        <nav className="bg-[var(--theme-card)] border-b border-[var(--theme-border)] h-14">
          <div className="h-full px-4 flex justify-between items-center">
            <a href="/projects" className="text-xl font-bold">
              world builder zero
            </a>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRightCollapsed(c => !c)}
                title="Toggle context panel (⌘.)"
                className={`p-1.5 rounded transition-colors ${
                  rightCollapsed
                    ? 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
                    : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                <PanelRight className="w-5 h-5" />
              </button>
              <a
                href="/profile"
                title="Profile"
                className="p-1.5 rounded transition-colors text-[var(--theme-muted)] hover:text-[var(--theme-fg)]"
              >
                <UserCircle className="w-5 h-5" />
              </a>
              <span className="text-sm text-[var(--theme-muted)]">{session.user.email}</span>
              <button
                onClick={async () => {
                  await signOut()
                  router.push('/login')
                }}
                className="px-3 py-1 text-sm border border-[var(--theme-border)] rounded hover:bg-[var(--theme-card)]"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex min-h-0">
          <aside className="w-64 bg-[var(--theme-card)] border-r border-[var(--theme-border)] overflow-y-auto">
            <LeftNavTree />
          </aside>
          <main className="flex-1 overflow-y-auto bg-[var(--theme-bg)]">
            <div className="px-6 py-6">{children}</div>
          </main>
          <aside
            className={`bg-[var(--theme-card)] border-l border-[var(--theme-border)] transition-all duration-200 ${
              rightCollapsed ? 'w-10' : 'w-[40rem]'
            }`}
          >
            {rightCollapsed ? (
              <div className="flex flex-col items-center gap-3 pt-4">
                {[
                  { icon: Layers, label: 'Canvases' },
                  { icon: ImageIcon, label: 'Images' },
                  { icon: Sparkles, label: 'Muse' },
                  { icon: Palette, label: 'Style' },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => setRightCollapsed(false)}
                    title={label}
                    className="p-1.5 text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
                <span className="mt-auto mb-4 text-[9px] text-[var(--theme-muted)] opacity-60">⌘.</span>
              </div>
            ) : (
              <div className="overflow-y-auto h-full">
                <RightContextPanel />
              </div>
            )}
          </aside>
        </div>
      </div>
    </ProjectThemeProvider>
  )
}
