'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Generate a consistent color from a string (tag name)
function stringToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

interface TagChipProps {
  tag: string
  onRemove?: () => void
  size?: 'sm' | 'md'
  className?: string
}

export function TagChip({ tag, onRemove, size = 'sm', className }: TagChipProps) {
  const hue = stringToHue(tag)
  const bgColor = `hsl(${hue}, 70%, 92%)`
  const textColor = `hsl(${hue}, 70%, 30%)`
  const borderColor = `hsl(${hue}, 60%, 80%)`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: borderColor,
      }}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="rounded-full p-0.5 hover:bg-black/10 transition-colors"
          aria-label={`Remove ${tag} tag`}
        >
          <X className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        </button>
      )}
    </span>
  )
}
