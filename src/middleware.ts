import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  if (pathname.startsWith('/api/auth/') || pathname === '/api/auth') {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/cron/') || pathname === '/api/cron') {
    return NextResponse.next()
  }

  try {
    const sessionResponse = await fetch(`${origin}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })

    if (!sessionResponse.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await sessionResponse.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
