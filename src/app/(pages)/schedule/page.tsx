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
  const [changedPeriods, setChangedPeriods] = useState<{[key: number]: boolean}>({});
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

  const handleAttendanceChange = async (periodIndex: number, attended: boolean) => {
    setChangedPeriods(prev => ({ ...prev, [periodIndex]: true }));
    try {
      const response = await axios.post('/api/attendance', {
        periodIndex,
        attended,
        date: today.toISOString()
      });
      
      // Update the period with new attendance counts
      if (timetable && response.data) {
        const updatedPeriods = [...timetable.periods];
        updatedPeriods[periodIndex] = {
          ...updatedPeriods[periodIndex],
          allAttended: response.data.allAttended,
          allHappened: response.data.allHappened,
          attended
        };
        setTimetable({ ...timetable, periods: updatedPeriods });
      }
      
      toast.success('Attendance updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update attendance');
    }
  }

  const handleDisableClass = async (periodIndex: number) => {
    try {
      const period = timetable?.periods[periodIndex];
      await axios.post('/api/attendance/holiday', {
        periodIndex,
        date: today.toISOString(),
        isHoliday: !period?.isHoliday
      });
      
      // Update local state
      if (timetable) {
        const updatedPeriods = [...timetable.periods];
        updatedPeriods[periodIndex] = {
          ...updatedPeriods[periodIndex],
          isHoliday: !period?.isHoliday
        };
        setTimetable({ ...timetable, periods: updatedPeriods });
      }
      
      toast.success(period?.isHoliday ? 'Class enabled' : 'Class disabled');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update class status');
    }
  }

  const handleTopicsUpdate = async (periodIndex: number, topics: string) => {
    setChangedPeriods(prev => ({ ...prev, [periodIndex]: true }));
    try {
      await axios.post('/api/attendance/topics', {
        periodIndex,
        topics,
        date: today.toISOString()
      })
      toast.success('Topics updated')
    } catch (error) {
      toast.error('Failed to update topics')
    }
  }

  const handleSaveChanges = async (periodIndex: number) => {
    try {
      const period = timetable?.periods[periodIndex];
      if (period) {
        await axios.post('/api/attendance', {
          periodIndex,
          attended: period.attended,
          topics: period.topicsCovered,
          date: today.toISOString()
        });
        toast.success('Changes saved');
        setChangedPeriods(prev => ({ ...prev, [periodIndex]: false }));
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
        <h1 className=" text-black text-2xl font-bold">
          {dayName}, {today.getDate()} {monthName}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
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
        {timetable?.periods.map((period, index) => (
          <Card key={index}>
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
                        id={`attendance-${index}`}
                        checked={period.attended}
                        onCheckedChange={(checked) => 
                          handleAttendanceChange(index, checked as boolean)
                        }
                        disabled={period.isHoliday}
                      />
                      <label htmlFor={`attendance-${index}`}>
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
                          onClick={() => handleDisableClass(index)}
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
                  onChange={(e) => handleTopicsUpdate(index, e.target.value)}
                  disabled={!period.attended || period.isHoliday}
                />

                {/* Save Button */}
                {changedPeriods[index] && (
                  <Button onClick={() => handleSaveChanges(index)}>
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
