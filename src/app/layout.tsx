


import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from './QueryProvider';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react'
import Providers from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'College Attendance Management',
  description: 'Track and manage college attendance',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <main className="container mx-auto p-4">
        {/* <SessionProvider> */}
          <QueryProvider>
          <Providers>
             <Toaster position="top-center" />{children}
           </Providers>
          </QueryProvider>
        {/* </SessionProvider> */}
        </main>
      </body>
    </html>
  )
}

