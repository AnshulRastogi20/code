'use client'

import { useEffect, useState } from 'react'
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
}

export default function SchedulePage() {
  const [changedPeriods, setChangedPeriods] = useState<{[key: string]: boolean}>({});
  const [timetable, setTimetable] = useState<DaySchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const today = new Date()
  const dayIndex = today.getDay()
  const monthIndex = today.getMonth()

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const dayName = daysOfWeek[dayIndex]
  const monthName = monthsOfYear[monthIndex]

  useEffect(() => {
    const fetchTodaySchedule = async () => {
      try {
        setIsLoading(true)
        const { data } = await axios.get('/api/user/timetable')
        const todaySchedule = data.schedule.find((day: DaySchedule) => 
          day.day.toUpperCase() === dayName.toUpperCase()
        )
        setTimetable(todaySchedule)
      } catch (error) {
        console.error('Failed to fetch timetable:', error)
        toast.error('Failed to load schedule')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodaySchedule()
  }, [dayName])

  const handleAttendanceChange = async (subject: string, attended: boolean) => {
    setChangedPeriods(prev => ({ ...prev, [subject]: true }));
    try {
      const response = await axios.post('/api/attendance', {
        subjectName: subject,
        attended,
        date: today.toISOString()
      });
      
      // Update the period with new attendance counts
      if (timetable && response.data) {
        const updatedPeriods = timetable.periods.map(period => {
          if (period.subject === subject) {
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
    }
  }

  const handleDisableClass = async (subject: string) => {
    try {
      const period = timetable?.periods.find(p => p.subject === subject);
      await axios.post('/api/attendance/holiday', {
        subjectName: subject,
        date: today.toISOString(),
        isHoliday: !period?.isHoliday
      });
      
      // Update local state
      if (timetable) {
        const updatedPeriods = timetable.periods.map(period => {
          if (period.subject === subject) {
            return {
              ...period,
              isHoliday: !period.isHoliday
            };
          }
          return period;
        });
        setTimetable({ ...timetable, periods: updatedPeriods });
      }
      
      toast.success(period?.isHoliday ? 'Class enabled' : 'Class disabled');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update class status');
    }
  }

  const handleTopicsUpdate = async (subject: string, topics: string) => {
    setChangedPeriods(prev => ({ ...prev, [subject]: true }));
    try {
      await axios.post('/api/attendance/topics', {
        subjectName: subject,
        topics,
        date: today.toISOString()
      })
      toast.success('Topics updated')
    } catch (error) {
      toast.error('Failed to update topics')
    }
  }

  const handleSaveChanges = async (subject: string) => {
    try {
      const period = timetable?.periods.find(p => p.subject === subject);
      if (period) {
        await axios.post('/api/attendance', {
          subjectName: subject,
          attended: period.attended,
          topics: period.topicsCovered,
          date: today.toISOString()
        });
        toast.success('Changes saved');
        setChangedPeriods(prev => ({ ...prev, [subject]: false }));
      }
    } catch (error) {
      toast.error('Failed to save changes');
    }
  }

  const handleDayHoliday = async () => {
    try {
      await axios.post('/api/attendance/holiday', {
        date: today.toISOString()
      })
      toast.success('Day marked as holiday')
    } catch (error) {
      toast.error('Failed to mark holiday')
    }
  }

  if (isLoading) {
    return <div>Loading schedule...</div>
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className=" text-white text-2xl font-bold">
          {dayName}, {today.getDate()} {monthName}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="text-black *:h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleDayHoliday()}>
              Mark as Holiday
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Exchange Periods
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        {timetable?.periods.map((period) => (
          <Card key={period.subject}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Period Details */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{period.subject}</h3>
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
                        id={`attendance-${period.subject}`}
                        checked={period.attended}
                        onCheckedChange={(checked) => 
                          handleAttendanceChange(period.subject, checked as boolean)
                        }
                        disabled={period.isHoliday}
                      />
                      <label htmlFor={`attendance-${period.subject}`}>
                        Attended
                      </label>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Options
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem 
                          onClick={() => handleDisableClass(period.subject)}
                        >
                          {period.isHoliday ? 'Enable Class' : 'Disable Class'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Topics Input */}
                <Input
                  placeholder="Topics covered in class..."
                  value={period.topicsCovered || ''}
                  onChange={(e) => handleTopicsUpdate(period.subject, e.target.value)}
                  disabled={!period.attended || period.isHoliday}
                />

                {/* Save Button */}
                {changedPeriods[period.subject] && (
                  <Button onClick={() => handleSaveChanges(period.subject)}>
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
