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
    <div className="dark min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
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
