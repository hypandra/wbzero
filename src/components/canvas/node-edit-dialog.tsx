'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const TYPE_PRESETS = ['idea', 'character', 'location', 'event', 'theme', 'note']
const COLOR_PRESETS = [
  { name: 'Orange', value: '#F97316' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#EAB308' },
]

interface NodeTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentValue: string | null
  onSave: (value: string | null) => void
}

export function NodeTypeDialog({
  open,
  onOpenChange,
  currentValue,
  onSave,
}: NodeTypeDialogProps) {
  const [value, setValue] = useState(currentValue || '')

  useEffect(() => {
    if (open) {
      setValue(currentValue || '')
    }
  }, [open, currentValue])

  const handleSave = () => {
    onSave(value.trim() || null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Node Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="node-type" className="text-sm font-medium">
              Type
            </label>
            <Input
              id="node-type"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              placeholder="e.g., idea, character, location"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Quick picks</div>
            <div className="flex flex-wrap gap-2">
              {TYPE_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={value === preset ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValue(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => { onSave(null); onOpenChange(false) }}>
            Clear
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface NodeColorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentValue: string | null
  onSave: (value: string | null) => void
}

export function NodeColorDialog({
  open,
  onOpenChange,
  currentValue,
  onSave,
}: NodeColorDialogProps) {
  const [value, setValue] = useState(currentValue || '')

  useEffect(() => {
    if (open) {
      setValue(currentValue || '')
    }
  }, [open, currentValue])

  const handleSave = () => {
    onSave(value.trim() || null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Node Color</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="node-color" className="text-sm font-medium">
              Color (hex)
            </label>
            <div className="flex gap-2">
              <Input
                id="node-color"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
                placeholder="#F97316"
                autoFocus
              />
              {value && (
                <div
                  className="w-9 h-9 rounded border shrink-0"
                  style={{ backgroundColor: value }}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Quick picks</div>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className="w-8 h-8 rounded border-2 transition-all"
                  style={{
                    backgroundColor: preset.value,
                    borderColor: value === preset.value ? '#000' : 'transparent',
                  }}
                  onClick={() => setValue(preset.value)}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => { onSave(null); onOpenChange(false) }}>
            Clear
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
