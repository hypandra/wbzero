import type { Metadata } from 'next'
import { ErrorAlertProvider } from '@/components/error-alert-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'WBZero',
  description: 'Writing and art organization tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://hypandra.com/embed/curiosity-badge.js" type="module" />
      </head>
      <body>
        <ErrorAlertProvider>
          {children}
        </ErrorAlertProvider>
        {/* @ts-expect-error - Web Component */}
        <curiosity-badge project="wbzero" />
      </body>
    </html>
  )
}
