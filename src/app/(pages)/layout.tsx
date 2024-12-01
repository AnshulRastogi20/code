import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'College Attendance Management',
  description: 'Track and manage college attendance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <div className={`${inter.className} bg-black text-white min-h-screen`}>
        <Navbar />
        <div className="container mx-auto p-4">
          {children}
        </div>
      </div>
  )
}

