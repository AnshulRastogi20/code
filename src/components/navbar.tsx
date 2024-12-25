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
    <nav className="bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
          <Link 
            href="/schedule"
            className={`text-sm font-medium transition-colors ${
              pathname === '/' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Schedule
          </Link>
          <Link 
            href="/attendance"
            className={`text-sm font-medium transition-colors ${
              pathname === '/attendance' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Attendance
          </Link>
          <Link 
            href="/calendar"
            className={`text-sm font-medium transition-colors ${
              pathname === '/calendar' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            Calendar
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center">
          <Button 
            variant="outline"
            onClick={() => signOut()}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm sm:text-base px-3 sm:px-4"
          >
            <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
            Sign Out
          </Button>
          <Link href="/profile" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 text-sm sm:text-base px-3 sm:px-4 w-full"
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

