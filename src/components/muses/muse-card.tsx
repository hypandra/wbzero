import { cn } from '@/lib/utils'

interface MuseCardProps {
  name: string
  subtitle: string
  isActive: boolean
  onClick: () => void
  onPopOut?: () => void
}

export function MuseCard({ name, subtitle, isActive, onClick, onPopOut }: MuseCardProps) {
  return (
    <div
      className={cn(
        'w-full rounded-lg border px-3 py-2 text-left transition',
        'hover:border-foreground/40 hover:bg-muted/40',
        isActive
          ? 'border-foreground/60 bg-muted/60 shadow-sm'
          : 'border-muted-foreground/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onClick}
          className="flex-1 text-left"
          aria-pressed={isActive}
        >
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </button>
        {onPopOut ? (
          <button
            type="button"
            onClick={onPopOut}
            className="text-[11px] rounded border px-2 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/40"
          >
            Pop out
          </button>
        ) : null}
      </div>
    </div>
  )
}
