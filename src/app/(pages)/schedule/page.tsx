'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, ArrowLeftRight } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import { set } from 'mongoose'
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"

// import { Period } from '@/types'

interface DaySchedule {
  day: string
  periods: Period[]
}

interface Period {
  // ...existing code...
  isHoliday?: boolean;
  happened?: boolean;
  allAttended?: number;
  allHappened?: number;
  attended?: boolean;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  topicsCovered?: string;
  disabled?: boolean;
  temporarySubject?: string | null;
  originalSubject?: string;
}

export default function SchedulePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [changedPeriods, setChangedPeriods] = useState<{[key: string]: boolean}>({});
  const [timetable, setTimetable] = useState<DaySchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate] = useState(new Date()) // Initialize once
  const [dayName, setDayName] = useState('')
  const [monthName, setMonthName] = useState('')
  const [dateDisplay, setDateDisplay] = useState('')

  useEffect(() => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    
    setDayName(daysOfWeek[selectedDate.getDay()])
    setMonthName(monthsOfYear[selectedDate.getMonth()])
    setDateDisplay(selectedDate.getDate().toString())
  }, [selectedDate])

  const fetchTodaySchedule = useCallback(async () => {
    if (!dayName) return;
    
    try {
      setIsLoading(true)
      const [timetableRes, savedDataRes] = await Promise.all([
        axios.get('/api/user/timetable'),
        axios.get(`/api/schedule?date=${selectedDate.toISOString()}`)
      ])

      const todaySchedule = timetableRes.data.schedule.find((day: DaySchedule) => 
        day.day.toUpperCase() === dayName.toUpperCase()
      )

      if (todaySchedule && savedDataRes.data.data) {
        const savedData = savedDataRes.data.data
        const mergedPeriods = todaySchedule.periods.map((period: Period) => {
          const savedSubject = savedData.find((s: any) => 
            s.name === period.subject &&
            s.allclasses.some((c: any) => 
              new Date(c.date).toDateString() === selectedDate.toDateString() &&
              c.startTime === period.startTime  // Add this check
            )
          )

          if (savedSubject) {
            const savedClass = savedSubject.allclasses.find((c: any) => 
              new Date(c.date).toDateString() === selectedDate.toDateString() &&
              c.startTime === period.startTime  // Add this check
            )
            
            if (savedClass) {
              return {
                ...period,
                attended: savedClass.attended,
                happened: savedClass.happened,
                isHoliday: savedClass.isHoliday,
                disabled: !savedClass.happened,
                topicsCovered: savedClass.topicsCovered.join(', '),
                allAttended: savedSubject.allAttended,
                allHappened: savedSubject.allHappened,
                temporarySubject: savedClass.temporarySubject,
                originalSubject: savedClass.temporarySubject ? period.subject : undefined
              }
            }
          }
          return period
        })

        setTimetable({ ...todaySchedule, periods: mergedPeriods })
      } else {
        setTimetable(todaySchedule)
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
      toast.error('Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }, [dayName, selectedDate])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    }
  }, [status, router])

  useEffect(() => {
    fetchTodaySchedule()
  }, [fetchTodaySchedule])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/sign-in' })
  }

  const handleAttendanceChange = async (subject: string, attended: boolean, startTime: string) => {
    setChangedPeriods(prev => ({ ...prev, [subject + startTime]: true }));
    try {
        const response = await axios.post('/api/attendance/update', {
            subjectName: subject,
            attended,
            date: selectedDate.toISOString(),
            startTime
        });
        
        // Update only the specific period that was changed
        if (timetable && response.data) {
            const updatedPeriods = timetable.periods.map(period => {
                if (period.subject === subject && period.startTime === startTime) {
                    return {
                        ...period,
                        allAttended: response.data.allAttended,
                        allHappened: response.data.allHappened,
                        attended
                    };
                }
                return period;
            });
            setTimetable({ ...timetable, periods: updatedPeriods });
        }
        
        toast.success('Attendance updated');
    } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to update attendance');
        // Revert the checkbox state on error
        if (timetable) {
            const updatedPeriods = timetable.periods.map(period => {
                if (period.subject === subject && period.startTime === startTime) {
                    return {
                        ...period,
                        attended: !attended // revert to previous state
                    };
                }
                return period;
            });
            setTimetable({ ...timetable, periods: updatedPeriods });
        }
    }
}

// Modify handleDisableClass function
const handleDisableClass = async (subject: string, shouldDisable: boolean, startTime: string) => {
    try {
        const response = await axios.post('/api/disableClass', {
            subjectName: subject,
            date: selectedDate.toISOString(),
            startTime,
            isDisabled: shouldDisable
        });

        // Update local state
        if (timetable) {
            const updatedPeriods = timetable.periods.map(period => {
                if (period.subject === subject && period.startTime === startTime) {
                    return {
                        ...period,
                        disabled: shouldDisable,
                        attended: shouldDisable ? false : period.attended,
                        allHappened: response.data.allHappened,
                        allAttended: response.data.allAttended
                    };
                }
                return period;
            });
            setTimetable({ ...timetable, periods: updatedPeriods });
        }
        toast.success(shouldDisable ? 'Class disabled successfully' : 'Class enabled successfully');
    } catch (error: any) {
        toast.error(error.response?.data?.error || `Failed to ${shouldDisable ? 'disable' : 'enable'} class`);
    }
}

// Modify handleTopicsUpdate function
const handleTopicsUpdate = async (subject: string, topics: string, startTime: string) => {
  setChangedPeriods(prev => ({ ...prev, [subject + startTime]: true }));
  
  // Update local state immediately
  if (timetable) {
    const updatedPeriods = timetable.periods.map(period => {
      if (period.subject === subject && period.startTime === startTime) {
        return {
          ...period,
          topicsCovered: topics
        };
      }
      return period;
    });
    setTimetable({ ...timetable, periods: updatedPeriods });
  }

  try {
    await axios.post('/api/attendance/topics', {
      subjectName: subject,
      topics,
      date: selectedDate.toISOString(),
      startTime
    })
    toast.success('Topics updated')
  } catch (error) {
    toast.error('Failed to update topics')
  }
}

const handleSaveChanges = async (subject: string, startTime: string) => {
  try {
    const period = timetable?.periods.find(p => p.subject === subject && p.startTime === startTime);
    if (period) {
      await axios.post('/api/attendance/update', {
        subjectName: subject,
        attended: period.attended,
        topics: period.topicsCovered,
        date: selectedDate.toISOString(),
        startTime
      });
      toast.success('Changes saved');
      setChangedPeriods(prev => ({ ...prev, [subject + startTime]: false }));
    }
  } catch (error) {
    toast.error('Failed to save changes');
  }
}

  const handleDayHoliday = async () => {
    try {
      await axios.post('/api/attendance/holiday', {
        date: selectedDate.toISOString()
      })
      toast.success('Day marked as holiday')
    } catch (error) {
      toast.error('Failed to mark holiday')
    }
  }

  if (status === 'loading' || isLoading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className=" text-white text-2xl font-bold">
          {dayName}, {dateDisplay} {monthName}
        </h1>
        <div className="flex gap-2">
         
              <Link href="/exchange">
              <Button variant="outline" size="icon" className="w-40 h-10 text-black">
              <ArrowLeftRight className="h-4 w-10 " />
                Exchange Periods
              </Button>
                </Link>
           
          
        </div>
      </div>

      <div className="space-y-4">
        {timetable?.periods.map((period, index) => (
          <Card key={`${period.subject}-${period.startTime}-${index}`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Period Details */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{period.subject}</h3>
                      {period.temporarySubject && (
                        <Badge 
                          variant="outline" 
                          className="ml-2 cursor-help"
                          title={`Exchanged with ${period.originalSubject}`}
                        >
                          Exchange
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {period.startTime} - {period.endTime}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Teacher: {period.teacher}
                    </p>
                  </div>
                  {/* Attendance and Disable Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id={`attendance-${period.subject}-${period.startTime}`}
                        checked={period.attended}
                        onCheckedChange={(checked) => 
                          handleAttendanceChange(period.subject, checked as boolean, period.startTime)
                        }
                        disabled={period.isHoliday||period.disabled}
                      />
                      <label htmlFor={`attendance-${period.subject}-${period.startTime}`}>
                        Attended
                      </label>
                    </div>
                    
                    
                        <Button variant="outline" size="sm" 
                        className='border-red-500'
                        disabled={period.attended} 
                        onClick={() => handleDisableClass(period.subject, !period.disabled, period.startTime)}
                        >
                          {period.disabled ? 'Enable ' : 'Disable '}
                        </Button>
                      
                  </div>
                </div>

                {/* Topics Input */}
                <Input
                  placeholder="Topics covered in class..."
                  value={period.topicsCovered || ''}
                  onChange={(e) => handleTopicsUpdate(period.subject, e.target.value, period.startTime)}
                  disabled={period.disabled || (!period.attended && !period.topicsCovered)}
                />

                {/* Save Button */}
                {changedPeriods[period.subject + period.startTime] && (
                  <Button onClick={() => handleSaveChanges(period.subject, period.startTime)}>
                    Save Changes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
