'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: '/auth/sign-in',
        redirect: true
      })
      // Clear any local storage or state if needed
      localStorage.clear()
      sessionStorage.clear()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }
  
  // Don't render if not authenticated
  if (status !== 'authenticated' || !session) {
    return null
  }
  
  return (
    <nav className="bg-black border-b border-zinc-800 shadow-lg mb-6">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex gap-6">
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
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={handleSignOut}
            className="border-red-900/30 text-red-500 hover:bg-red-950/50 hover:text-red-400"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          <Link href="/profile">
            <Button 
              variant="outline" 
              className="bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

