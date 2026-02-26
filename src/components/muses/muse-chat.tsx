import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PromptViewerDialog } from '@/components/prompt-viewer-dialog'
import type { IrisPackage } from '@/lib/muses/iris'
import type { MuseContext } from '@/lib/muses/context'
import {
  MELETE_SYSTEM_PROMPT,
  IRIS_QUERY_SYSTEM_PROMPT,
  buildMuseContextSummary,
} from '@/lib/muses/prompts'
import { X } from 'lucide-react'

export interface MuseMessage {
  role: 'user' | 'assistant'
  content: string
}

type MuseId = 'melete' | 'hypandra' | 'iris'

const MUSE_PROMPTS: Record<MuseId, string> = {
  melete: MELETE_SYSTEM_PROMPT,
  hypandra: `[Hypandra uses the Hypandra Reflections API]

Endpoint: https://hypandra.com/api/v1/reflections/generate

Hypandra generates curious reflections and questions based on your content.
The context below is sent to Hypandra's API along with any message you provide.

Mode: "reflections" or "questions" (selected via toggle)`,
  iris: IRIS_QUERY_SYSTEM_PROMPT,
}

interface MuseChatProps {
  museId: MuseId
  museName: string
  museDescription: string
  messages: MuseMessage[]
  inputValue: string
  packageData?: IrisPackage | null
  isLoading: boolean
  context?: MuseContext | null
  loadingLabel?: string
  emptyStateDescription?: string
  emptyStateActionLabel?: string
  onEmptyStateAction?: () => void
  popActionLabel?: string
  onPopAction?: () => void
  mode?: 'reflections' | 'questions'
  onModeChange?: (mode: 'reflections' | 'questions') => void
  onInputChange: (value: string) => void
  onSend: () => void
  onClose: () => void
}

export function MuseChat({
  museId,
  museName,
  museDescription,
  messages,
  inputValue,
  packageData,
  isLoading,
  context,
  loadingLabel,
  emptyStateDescription,
  emptyStateActionLabel,
  onEmptyStateAction,
  popActionLabel,
  onPopAction,
  mode,
  onModeChange,
  onInputChange,
  onSend,
  onClose,
}: MuseChatProps) {
  const buildPromptData = () => {
    const systemPrompt = MUSE_PROMPTS[museId]
    const contextSummary = buildMuseContextSummary(context)
    return { systemPrompt, context: contextSummary }
  }

  return (
    <div className="rounded-lg border bg-muted/20">
      <div className="flex items-start justify-between border-b px-3 py-2">
        <div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold">{museName}</span>
            <PromptViewerDialog
              prompt={buildPromptData}
              label={museName}
              description={museDescription}
            />
          </div>
          <div className="text-xs text-muted-foreground">{museDescription}</div>
          {mode && onModeChange ? (
            <div className="mt-2 inline-flex rounded-md border bg-background p-0.5 text-[11px]">
              <button
                type="button"
                className={mode === 'reflections'
                  ? 'rounded px-2 py-0.5 bg-foreground/10 text-foreground'
                  : 'rounded px-2 py-0.5 text-muted-foreground hover:text-foreground'}
                onClick={() => onModeChange('reflections')}
              >
                Reflections
              </button>
              <button
                type="button"
                className={mode === 'questions'
                  ? 'rounded px-2 py-0.5 bg-foreground/10 text-foreground'
                  : 'rounded px-2 py-0.5 text-muted-foreground hover:text-foreground'}
                onClick={() => onModeChange('questions')}
              >
                Questions
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {popActionLabel && onPopAction ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onPopAction}
            >
              {popActionLabel}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close muse chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-64 space-y-3 overflow-y-auto px-3 py-3 text-sm">
        {messages.length === 0 ? (
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>
              {emptyStateDescription ?? 'Ask for a nudge, a constraint, or a question to get moving.'}
            </div>
            {emptyStateActionLabel && onEmptyStateAction ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onEmptyStateAction}
                disabled={isLoading}
              >
                {emptyStateActionLabel}
              </Button>
            ) : null}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={message.role === 'user'
                ? 'rounded-lg bg-background px-3 py-2 text-foreground shadow-sm'
                : 'rounded-lg bg-foreground/5 px-3 py-2 text-foreground'}
            >
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {message.role === 'user' ? 'You' : museName}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))
        )}
        {isLoading ? (
          <div className="text-xs text-muted-foreground">
            {loadingLabel ?? 'Thinking...'}
          </div>
        ) : null}
        {packageData ? (
          <div className="rounded-lg border bg-background px-3 py-3 text-sm space-y-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Iris Pack
            </div>
            <div className="text-base font-semibold">{packageData.headline}</div>
            <div className="text-sm text-muted-foreground">{packageData.summary}</div>
            <div className="space-y-2">
              {packageData.sources.map((source) => (
                <div key={source.url} className="rounded-md border bg-muted/30 px-3 py-2">
                  <div className="font-medium">{source.title}</div>
                  <a
                    href={source.url}
                    className="text-xs text-primary underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.url}
                  </a>
                  <div className="text-xs text-muted-foreground">{source.notes}</div>
                </div>
              ))}
            </div>
            {packageData.followups?.length ? (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground">
                  Follow-up angles
                </div>
                <div className="text-xs text-muted-foreground">
                  {packageData.followups.join(' · ')}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-t px-3 py-3 space-y-2">
        <Textarea
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={`Message ${museName}...`}
          className="min-h-[80px] text-sm"
        />
        <div className="flex justify-end">
          <Button onClick={onSend} disabled={isLoading || !inputValue.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
