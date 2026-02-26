'use client'

import { useCallback, useRef } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

const HANDLE_SIZE = 10
const MIN_WIDTH = 100

const handleStyle = (position: 'nw' | 'ne' | 'sw' | 'se'): React.CSSProperties => ({
  position: 'absolute',
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  background: 'hsl(var(--primary))',
  borderRadius: 2,
  cursor: position === 'nw' || position === 'se' ? 'nwse-resize' : 'nesw-resize',
  ...(position.includes('n') ? { top: -HANDLE_SIZE / 2 } : { bottom: -HANDLE_SIZE / 2 }),
  ...(position.includes('w') ? { left: -HANDLE_SIZE / 2 } : { right: -HANDLE_SIZE / 2 }),
})

export function ResizableImage({ node, selected, updateAttributes }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, corner: 'nw' | 'ne' | 'sw' | 'se') => {
      e.preventDefault()
      e.stopPropagation()

      const img = imgRef.current
      if (!img) return

      const startX = e.clientX
      const startWidth = img.offsetWidth
      const isLeft = corner.includes('w')

      // Lock body cursor and selection during drag
      const prevCursor = document.body.style.cursor
      const prevUserSelect = document.body.style.userSelect
      document.body.style.cursor = isLeft ? 'nesw-resize' : 'nwse-resize'
      if (corner === 'nw' || corner === 'se') {
        document.body.style.cursor = 'nwse-resize'
      }
      document.body.style.userSelect = 'none'

      const maxWidth = containerRef.current?.parentElement?.clientWidth ?? 800

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX
        const newWidth = Math.max(
          MIN_WIDTH,
          Math.min(maxWidth, startWidth + (isLeft ? -dx : dx))
        )
        // Mutate style directly for snappy feedback
        if (img) {
          img.style.width = `${newWidth}px`
        }
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        document.body.style.cursor = prevCursor
        document.body.style.userSelect = prevUserSelect

        if (img) {
          const finalWidth = img.offsetWidth
          updateAttributes({ width: finalWidth })
        }
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [updateAttributes]
  )

  const width = node.attrs.width as number | null

  return (
    <NodeViewWrapper className="wbz-resizable-image-wrapper">
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'inline-block',
          lineHeight: 0,
        }}
      >
        <img
          ref={imgRef}
          src={node.attrs.src as string}
          alt={node.attrs.alt as string ?? ''}
          title={node.attrs.title as string ?? undefined}
          draggable={false}
          style={{
            width: width ? `${width}px` : undefined,
            height: 'auto',
            maxWidth: '100%',
            display: 'block',
            outline: selected ? '2px solid hsl(var(--primary))' : 'none',
            outlineOffset: 2,
            borderRadius: 4,
          }}
        />
        {selected && (
          <>
            {(['nw', 'ne', 'sw', 'se'] as const).map((pos) => (
              <div
                key={pos}
                style={handleStyle(pos)}
                onMouseDown={(e) => handleMouseDown(e, pos)}
              />
            ))}
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}
