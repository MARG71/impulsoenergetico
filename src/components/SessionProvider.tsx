'use client'
// src/components/SessionProvider.tsx

import { SessionProvider as NextAuthProvider } from 'next-auth/react'
import { Session } from 'next-auth'

interface Props {
  children: React.ReactNode
  session?: Session | null
}

export default function SessionProvider({ children, session }: Props) {
  return <NextAuthProvider session={session}>{children}</NextAuthProvider>
}
