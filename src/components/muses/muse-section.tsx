'use client'

import { useState } from 'react'
import { MuseCard } from '@/components/muses/muse-card'
import { MuseChat, type MuseMessage } from '@/components/muses/muse-chat'
import { useErrorAlert } from '@/components/error-alert-provider'
import { apiFetch, parseError } from '@/lib/api'
import { getMuseContext, type MuseContextImage } from '@/lib/muses/context'
import type { IrisPackage } from '@/lib/muses/iris'
import { Dialog, DialogContent } from '@/components/ui/dialog'

type MuseId = 'melete' | 'hypandra' | 'iris'

interface MuseDefinition {
  id: MuseId
  name: string
  subtitle: string
  description: string
}

const MUSES: MuseDefinition[] = [
  {
    id: 'melete',
    name: 'Melete',
    subtitle: 'Practice + constraints',
    description: 'The muse of practice and getting unstuck.',
  },
  {
    id: 'hypandra',
    name: 'Hypandra',
    subtitle: 'Curious reflections',
    description: 'Asks questions and reflects with curiosity.',
  },
  {
    id: 'iris',
    name: 'Iris',
    subtitle: 'Adjacent work scout',
    description: 'Finds adjacent ideas and kindred thinkers.',
  },
]

interface MuseSectionProps {
  projectId: string | null
  images: MuseContextImage[]
  filePath: string | null
}

export function MuseSection({ projectId, images, filePath }: MuseSectionProps) {
  const { showError } = useErrorAlert()
  const [activeMuseId, setActiveMuseId] = useState<MuseId | null>(null)
  const [dialogMuseId, setDialogMuseId] = useState<MuseId | null>(null)
  const [messagesByMuse, setMessagesByMuse] = useState<Record<MuseId, MuseMessage[]>>({
    melete: [],
    hypandra: [],
    iris: [],
  })
  const [draftsByMuse, setDraftsByMuse] = useState<Record<MuseId, string>>({
    melete: '',
    hypandra: '',
    iris: '',
  })
  const [packagesByMuse, setPackagesByMuse] = useState<Record<MuseId, IrisPackage | null>>({
    melete: null,
    hypandra: null,
    iris: null,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleMuse = (id: MuseId) => {
    setActiveMuseId((prev) => (prev === id ? null : id))
  }

  const sendMuseRequest = async (museId: MuseId, draft: string | null) => {
    const nextMessages = draft
      ? ([...messagesByMuse[museId], { role: 'user', content: draft }] as MuseMessage[])
      : ([...messagesByMuse[museId]] as MuseMessage[])

    setMessagesByMuse((prev) => ({ ...prev, [museId]: nextMessages }))
    if (draft !== null) {
      setDraftsByMuse((prev) => ({ ...prev, [museId]: '' }))
    }
    setPackagesByMuse((prev) => ({ ...prev, [museId]: null }))
    setIsLoading(true)

    try {
      const data = await apiFetch<{ message: string; package?: IrisPackage }>(`/api/muses/${museId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          context: getMuseContext({ projectId, images, filePath }),
          ...(museId === 'hypandra' ? { mode: 'reflections' } : {}),
        }),
      })

      setMessagesByMuse((prev) => ({
        ...prev,
        [museId]: [
          ...nextMessages,
          { role: 'assistant', content: data.message },
        ],
      }))
      if (museId === 'iris' && data.package) {
        setPackagesByMuse((prev) => ({ ...prev, iris: data.package ?? null }))
      }
    } catch (error) {
      const { title, description } = parseError(error)
      showError(title, description)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async (museId: MuseId) => {
    const draft = draftsByMuse[museId].trim()
    if (!draft) return
    await sendMuseRequest(museId, draft)
  }

  const handleGenerateHypandra = async (museId: MuseId) => {
    if (museId !== 'hypandra' || isLoading) return
    await sendMuseRequest('hypandra', null)
  }

  const handleGenerateIris = async (museId: MuseId) => {
    if (museId !== 'iris' || isLoading) return
    await sendMuseRequest('iris', null)
  }

  const handlePopOut = (museId: MuseId) => {
    setActiveMuseId(null)
    setDialogMuseId(museId)
  }

  const handlePopIn = (museId: MuseId) => {
    setDialogMuseId(null)
    setActiveMuseId(museId)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Muses</div>
        <div className="text-xs text-muted-foreground">Creative copilots</div>
      </div>

      <div className="space-y-2">
        {MUSES.map((muse) => (
          <div key={muse.id}>
            {activeMuseId === muse.id ? (
              <MuseChat
                museId={muse.id}
                museName={muse.name}
                museDescription={muse.description}
                messages={messagesByMuse[muse.id]}
                inputValue={draftsByMuse[muse.id]}
                packageData={muse.id === 'iris' ? packagesByMuse.iris : null}
                isLoading={isLoading}
                context={getMuseContext({ projectId, images, filePath })}
                loadingLabel={muse.id === 'iris'
                  ? 'Iris flow: generate queries → search → package'
                  : muse.id === 'hypandra'
                    ? 'Generating reflections...'
                    : undefined}
                emptyStateDescription={muse.id === 'iris'
                  ? 'Click to generate an Iris Pack from the context in view, or add a prompt to steer the search.'
                  : muse.id === 'hypandra'
                    ? 'Click to get reflections from the context in view, or ask for a nudge, a constraint, or a question to get moving.'
                    : 'Ask for a nudge, a constraint, or a question to get moving.'}
                emptyStateActionLabel={muse.id === 'hypandra'
                  ? 'Get reflections from context'
                  : muse.id === 'iris'
                    ? 'Generate Iris Pack from context'
                  : undefined}
                onEmptyStateAction={muse.id === 'hypandra'
                  ? () => handleGenerateHypandra(muse.id)
                  : muse.id === 'iris'
                    ? () => handleGenerateIris(muse.id)
                    : undefined}
                popActionLabel="Pop out"
                onPopAction={() => handlePopOut(muse.id)}
                onInputChange={(value) =>
                  setDraftsByMuse((prev) => ({ ...prev, [muse.id]: value }))
                }
                onSend={() => handleSend(muse.id)}
                onClose={() => setActiveMuseId(null)}
              />
            ) : (
              <MuseCard
                name={muse.name}
                subtitle={muse.subtitle}
                isActive={false}
                onClick={() => handleToggleMuse(muse.id)}
                onPopOut={() => handlePopOut(muse.id)}
              />
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!dialogMuseId} onOpenChange={(open) => !open && setDialogMuseId(null)}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] overflow-hidden">
          {dialogMuseId ? (
            <MuseChat
              museId={dialogMuseId}
              museName={MUSES.find((muse) => muse.id === dialogMuseId)?.name ?? 'Muse'}
              museDescription={MUSES.find((muse) => muse.id === dialogMuseId)?.description ?? ''}
              messages={messagesByMuse[dialogMuseId]}
              inputValue={draftsByMuse[dialogMuseId]}
              packageData={dialogMuseId === 'iris' ? packagesByMuse.iris : null}
              isLoading={isLoading}
              context={getMuseContext({ projectId, images, filePath })}
              loadingLabel={dialogMuseId === 'iris'
                ? 'Iris flow: generate queries → search → package'
                : dialogMuseId === 'hypandra'
                  ? 'Generating reflections...'
                  : undefined}
              emptyStateDescription={dialogMuseId === 'iris'
                ? 'Click to generate an Iris Pack from the context in view, or add a prompt to steer the search.'
                : dialogMuseId === 'hypandra'
                  ? 'Click to get reflections from the context in view, or ask for a nudge, a constraint, or a question to get moving.'
                  : 'Ask for a nudge, a constraint, or a question to get moving.'}
              emptyStateActionLabel={dialogMuseId === 'hypandra'
                ? 'Get reflections from context'
                : dialogMuseId === 'iris'
                  ? 'Generate Iris Pack from context'
                  : undefined}
              onEmptyStateAction={dialogMuseId === 'hypandra'
                ? () => handleGenerateHypandra(dialogMuseId)
                : dialogMuseId === 'iris'
                  ? () => handleGenerateIris(dialogMuseId)
                  : undefined}
              popActionLabel="Pop back into panel"
              onPopAction={() => handlePopIn(dialogMuseId)}
              onInputChange={(value) =>
                setDraftsByMuse((prev) => ({ ...prev, [dialogMuseId]: value }))
              }
              onSend={() => handleSend(dialogMuseId)}
              onClose={() => setDialogMuseId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
