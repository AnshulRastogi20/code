'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import {  signOut ,useSession } from 'next-auth/react'
// import { signOut } from 'next-auth/client'

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()


  
  // Don't render if not authenticated
  if (status !== 'authenticated' || !session) {
    return null
  }
  
  return (
    <nav className="bg-black border-b border-zinc-800 shadow-lg mb-6">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
          <Link 
            href="/schedule"
            className={`text-sm font-medium transition-colors ${
              pathname === '/' 
                ? 'text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Schedule
          </Link>
          <Link 
            href="/attendance"
            className={`text-sm font-medium transition-colors ${
              pathname === '/attendance' 
                ? 'text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Attendance
          </Link>
          <Link 
            href="/calendar"
            className={`text-sm font-medium transition-colors ${
              pathname === '/calendar' 
                ? 'text-white' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Calendar
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
          <Button 
            variant="outline"
            onClick={() => signOut()}
            className="border-red-900/30 text-red-500 hover:bg-red-950/50 hover:text-red-400 text-sm sm:text-base px-3 sm:px-4"
          >
            <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
            Sign Out
          </Button>
          <Link href="/profile" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800 text-sm sm:text-base px-3 sm:px-4 w-full"
            >
              <User className="h-4 w-4 mr-1 sm:mr-2" />
              Profile
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

