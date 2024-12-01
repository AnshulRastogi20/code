'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            
            <Button variant="outline" className="border-white/10 text-black">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Exchange Periods</DropdownMenuItem>
            <DropdownMenuItem>Mark as Holiday</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

