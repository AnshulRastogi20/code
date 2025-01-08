import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from './QueryProvider'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/providers/session-provider'
import { NextUIClientProvider } from '@/components/providers/nextui-provider'
import { Navbar } from '@/components/navbar'

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
          <QueryProvider>
            <Providers>
        <Navbar />
        <main className="container mx-auto p-4 mt-16"> {/* Added mt-20 for spacing below navbar */}
              <NextUIClientProvider>
                <Toaster position="top-center" />
                {children}
              </NextUIClientProvider>
        </main>
            </Providers>
          </QueryProvider>
      </body>
    </html>
  )
}

