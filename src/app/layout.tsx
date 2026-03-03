import type { Metadata } from 'next'
import { Orbitron } from 'next/font/google'
import { ErrorAlertProvider } from '@/components/error-alert-provider'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
})

export const metadata: Metadata = {
  title: 'WorldBuilder:Zero',
  description: 'Writing and art organization tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={orbitron.variable}>
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
