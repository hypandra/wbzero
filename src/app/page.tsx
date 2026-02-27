'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, BookOpen } from 'lucide-react'
import { Loading } from '@/components/ui/spinner'

export default function HomePage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && session) {
      router.push('/projects')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-black text-white relative overflow-hidden">
      {/* Stars */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {[
          [8,12],[15,72],[22,38],[31,55],[37,18],[44,88],[52,6],[58,43],[65,29],[71,67],
          [78,14],[84,51],[91,82],[96,33],[5,90],[25,5],[48,76],[62,22],[80,60],[13,47],
          [40,95],[70,8],[88,40],[34,70],[56,15],[18,85],[74,55],[92,20],[28,62],[50,35],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={`${cx}%`}
            cy={`${cy}%`}
            r={i % 3 === 0 ? "1.2" : "0.7"}
            fill="white"
            opacity={i % 4 === 0 ? "0.5" : "0.25"}
          />
        ))}
      </svg>
      <div className="max-w-md w-full space-y-8 p-8 text-center relative z-10">
        <div>
          <h1 className="text-5xl font-light tracking-wide mb-8">world builder zero</h1>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
