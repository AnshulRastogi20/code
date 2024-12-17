'use client'

import { SessionProvider } from 'next-auth/react'
import { NextUIProvider } from '@nextui-org/react'
import { useRouter } from 'next/navigation'

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <NextUIProvider navigate={router.push}>
        {children}
      </NextUIProvider>
    </SessionProvider>
  )
}
