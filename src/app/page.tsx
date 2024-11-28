'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings } from 'lucide-react'

export default function SchedulePage() {
  const [classes] = useState([
    { id: 1, name: 'Mathematics', time: '9:00 AM', topics: '' },
    { id: 2, name: 'Physics', time: '10:00 AM', topics: '' },
    { id: 3, name: 'Chemistry', time: '11:00 AM', topics: '' },
  ])

  return (
    <div className="space-y-6">
      <div className="border rounded-lg border-white/10 p-4">
        <div className="grid grid-cols-[1fr_100px_100px] gap-4 mb-4 pb-2 border-b border-white/10">
          <div className="font-medium">Class</div>
          <div className="font-medium text-center">Attended</div>
          <div className="font-medium text-center">Status</div>
        </div>
        {classes.map((class_) => (
          <div key={class_.id} className="grid grid-cols-[1fr_100px_100px] gap-4 items-center mb-4">
            <div>
              <div className="font-medium">{class_.name}</div>
              <div className="text-sm text-white/70">{class_.time}</div>
            </div>
            <div className="flex justify-center">
              <Checkbox />
            </div>
            <div className="flex justify-center">
              <Select>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Input 
                placeholder="Topics covered in this class..."
                className="bg-transparent border-white/10"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-white/10">
              <Settings className="mr-2 h-4 w-4" />
              Master Settings
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Exchange Periods</DropdownMenuItem>
            <DropdownMenuItem>Mark as Holiday</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="text-sm text-white/70">
          Monday, 27 November 2023 | Computer Science Department
        </div>
      </div>
    </div>
  )
}

