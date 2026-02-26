'use client'

import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import type { ChangeEntry, ChangeTerm } from '@/data/changes'
import { UPDATES } from '@/data/changes'

const sortUpdates = (updates: ChangeEntry[], order: 'desc' | 'asc') => {
  return [...updates].sort((a, b) => (
    order === 'desc'
      ? b.publishedAt.localeCompare(a.publishedAt)
      : a.publishedAt.localeCompare(b.publishedAt)
  ))
}

const kindLabel = (kind: ChangeTerm['kind']) => {
  if (kind === 'internal') return 'Internal'
  if (kind === 'tool') return 'Tool'
  return 'Practice'
}

const kindStyles = (kind: ChangeTerm['kind']) => {
  if (kind === 'internal') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (kind === 'tool') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

export default function ChangesPage() {
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')
  const [showAll, setShowAll] = useState(false)
  const sorted = useMemo(() => sortUpdates(UPDATES, order), [order])
  const visible = showAll ? sorted : sorted.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Changelog
          </div>
          <p className="text-sm text-muted-foreground">
            What changed, why it matters, and new terms we’re learning together.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOrder('desc')}
            className={order === 'desc'
              ? 'rounded-full border px-3 py-1 text-xs font-medium bg-muted'
              : 'rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground'}
          >
            Latest first
          </button>
          <button
            type="button"
            onClick={() => setOrder('asc')}
            className={order === 'asc'
              ? 'rounded-full border px-3 py-1 text-xs font-medium bg-muted'
              : 'rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground'}
          >
            Oldest first
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {visible.map((update) => (
          <article key={update.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{update.title}</h2>
                <div className="text-xs text-muted-foreground">{update.publishedAt}</div>
              </div>
              {update.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {update.tags.map((tag) => (
                    <span key={tag} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-3 space-y-3 text-sm">
              <p>{update.summary}</p>
              {update.devNote ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Builder note:</span> {update.devNote}
                </div>
              ) : null}
            </div>

            {update.terms?.length ? (
              <details className="mt-4 rounded-lg border bg-muted/10 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                  Terms we used
                </summary>
                <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                  {update.terms.map((term) => (
                    <div key={term.key} className="rounded-md border bg-white p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{term.label}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${kindStyles(term.kind)}`}>
                          {kindLabel(term.kind)}
                        </span>
                      </div>
                      <p className="mt-2">{term.description}</p>
                      {term.note ? (
                        <p className="mt-2 text-[11px] text-muted-foreground">{term.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </article>
        ))}
      </div>

      {sorted.length > 5 ? (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {showAll ? (
            <>
              Show fewer updates
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              See more updates
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      ) : null}
    </div>
  )
}
