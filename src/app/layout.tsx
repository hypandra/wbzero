import type { Metadata } from 'next'
import { Hedvig_Letters_Serif } from 'next/font/google'
import { ErrorAlertProvider } from '@/components/error-alert-provider'
import './globals.css'

const hedvig = Hedvig_Letters_Serif({ subsets: ['latin'], weight: '400' })

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
      <body>
        <ErrorAlertProvider>
          {children}
        </ErrorAlertProvider>
        <a
          href="https://hypandra.com/curiosity-builds/wbzero"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-50 opacity-60 hover:opacity-100 transition-opacity flex items-center gap-0 bg-black/55 rounded-2xl px-3 py-1.5"
          aria-label="Curiosity Builds by Hypandra"
        >
          <img src="/hypandra-torch.svg" alt="" className="h-7 w-auto -mt-0.5" />
          <span className={`${hedvig.className} text-white/90 text-xs leading-tight -ml-0.5 flex flex-col items-center`}>
            <span>Curiosity</span>
            <span>Builds!</span>
          </span>
        </a>
      </body>
    </html>
  )
}
