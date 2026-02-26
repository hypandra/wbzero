'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ErrorAlertContextType {
  showError: (title: string, description?: string) => void
}

const ErrorAlertContext = createContext<ErrorAlertContextType | null>(null)

export function useErrorAlert() {
  const context = useContext(ErrorAlertContext)
  if (!context) {
    throw new Error('useErrorAlert must be used within ErrorAlertProvider')
  }
  return context
}

interface ErrorAlertProviderProps {
  children: ReactNode
}

export function ErrorAlertProvider({ children }: ErrorAlertProviderProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<{ title: string; description?: string } | null>(null)

  const showError = useCallback((title: string, description?: string) => {
    setError({ title, description })
    setOpen(true)
  }, [])

  return (
    <ErrorAlertContext.Provider value={{ showError }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{error?.title || 'Error'}</AlertDialogTitle>
            {error?.description && (
              <AlertDialogDescription>{error.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErrorAlertContext.Provider>
  )
}
