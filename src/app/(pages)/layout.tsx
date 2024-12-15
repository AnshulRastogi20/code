import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navbar'
import { Toaster } from 'react-hot-toast'

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
      <div className={`${inter.className} bg-black text-white min-h-screen`}>
        <Navbar />
        <div className="container mx-auto p-4">
        <Toaster position="top-center" /> {children}
        </div>
      </div>
  )
}

