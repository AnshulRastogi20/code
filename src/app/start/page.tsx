'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, PlayCircle, Ban } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Period, DaySchedule } from '@/types'

export default function StartPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [todayClasses, setTodayClasses] = useState<Period[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const today = new Date()
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(today)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    }
  }, [status, router,session])

  useEffect(() => {
    const fetchTodayClasses = async () => {
      try {
        const { data } = await axios.get('/api/user/timetable')
        const todaySchedule = data.schedule.find((day: DaySchedule) => 
          day.day.toUpperCase() === dayName.toUpperCase()
        )
        setTodayClasses(todaySchedule?.periods || [])
      } catch (error) {
        console.error('Failed:', error)
        toast.error('Failed to load today\'s classes')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodayClasses()
  }, [dayName])

  const handleStartDay = async () => {
    try {
      await axios.post('/api/start', { action: 'startDay' })
      toast.success('Day started successfully')
      router.push('/schedule')
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Failed to start day')
    }
  }

  const handleMarkHoliday = async () => {
    try {
      await axios.post('/api/start', { action: 'markHoliday' })
      toast.success('Day marked as holiday')
      router.push('/schedule')
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Failed to mark holiday')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Today's Schedule
          </h1>
          <p className="text-gray-400">
            {dayName}, {today.getDate()} {monthName}
          </p>
        </motion.div>
        
        <div className="grid gap-6 mb-8">
          {todayClasses.map((period, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-none hover:bg-white/15 transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {period.subject}
                      </h3>
                      <div className="flex items-center text-gray-400 space-x-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {period.startTime} - {period.endTime}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {period.teacher}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="flex gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={handleStartDay}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl flex items-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Start Today's Day
          </Button>
          <Button 
            onClick={handleMarkHoliday}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 px-8 py-6 text-lg rounded-xl flex items-center gap-2"
          >
            <Ban className="w-5 h-5" />
            Mark as Holiday
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
