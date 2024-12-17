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
    <nav className="border-b border-white/10 mb-6">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex gap-4">
          <Link 
            href="schedule"
            className={`text-sm ${pathname === '/' ? 'text-white' : 'text-white/70 hover:text-white'}`}
          >
            Schedule
          </Link>
          <Link 
            href="/attendance"
            className={`text-sm ${pathname === '/attendance' ? 'text-white' : 'text-white/70 hover:text-white'}`}
          >
            Attendance
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <Link href="/profile">
            <Button variant="outline" className="border-white/10 text-black">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

