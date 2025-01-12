import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import QueryProvider from './QueryProvider'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/providers/session-provider'
import { NextUIClientProvider } from '@/components/providers/nextui-provider'
import Navbar from '@/components/ui/material/Navbar'

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

        <main > 
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

