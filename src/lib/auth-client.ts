import { createAuthClient } from "better-auth/react"

function getBaseURL() {
  // In browser, always use current origin for flexibility
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Server-side, use env var
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || ''
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
})

export const { useSession, signIn, signOut, signUp } = authClient
