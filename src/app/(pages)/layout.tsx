'use client'

import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import { Toaster } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  return (
    <div className={`${inter.className} bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen`}>
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <Toaster position="top-center" />
        {children}
      </div>
    </div>
  )
}

