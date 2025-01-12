'use client'

import '@/app/globals.css'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {  useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {  ArrowLeftRight } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from "@/components/ui/calendar"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { Input } from '@/components/ui/input'
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { allClasses, SubjectInfo } from '@/types'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Input as TimeInput } from "@nextui-org/react"

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
  temporaryExchange?: {
    originalSubject: string;
    exchangeEndDate: Date;
  } | null;
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
  const [showHolidayConfirmation, setShowHolidayConfirmation] = useState(false);
  const [pendingEnableAction, setPendingEnableAction] = useState<{
    subject: string;
    startTime: string;
  } | null>(null);
  const [showAddClass, setShowAddClass] = useState(false)
  const [validTill, setValidTill] = useState<Date>()
  const [newClass, setNewClass] = useState({
    subject: '',
    startTime: '12:00',  // Set default times
    endTime: '13:00',
    startPeriod: 'PM',
    endPeriod: 'PM'
  })
  const [originalValues, setOriginalValues] = useState<{
    [key: string]: {
        attended?: boolean;
        topicsCovered?: string;
    };
  }>({});

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
          const savedSubject = savedData.find((s: SubjectInfo) => 
            s.name === period.subject &&
            s.allclasses.some((c: allClasses) => 
              new Date(c.date).toDateString() === selectedDate.toDateString() &&
              c.startTime === period.startTime  // Add this check
            )
          )

          if (savedSubject) {
            const savedClass = savedSubject.allclasses.find((c: allClasses) => 
              new Date(c.date).toDateString() === selectedDate.toDateString() &&
              c.startTime === period.startTime  // Add this check
            )
            
            return {
              ...period,
              attended: savedClass?.attended,
              happened: savedClass?.happened,
              isHoliday: savedClass?.isHoliday,
              disabled: !savedClass?.happened,
              topicsCovered: savedClass?.topicsCovered.join(', '),
              allAttended: savedSubject.allAttended,
              allHappened: savedSubject.allHappened
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



  const handleAttendanceChange = async (subject: string, attended: boolean, startTime: string) => {
    const key = `${subject}-${startTime}`;
        
    // Store original value if not already stored
    if (!originalValues[key]) {
        const period = timetable?.periods.find(p => 
            p.subject === subject && p.startTime === startTime
        );
        setOriginalValues(prev => ({
            ...prev,
            [key]: { attended: period?.attended, topicsCovered: period?.topicsCovered }
        }));
    }

    setChangedPeriods(prev => ({
        ...prev,
        [key]: originalValues[key]?.attended !== attended
    }));
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
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Failed to update attendance');
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
  // If trying to enable a holiday class, show confirmation
  const period = timetable?.periods.find(p => p.subject === subject && p.startTime === startTime);
  if (!shouldDisable && period?.isHoliday) {
    setShowHolidayConfirmation(true);
    setPendingEnableAction({ subject, startTime });
    return;
  }

  await updateClassStatus(subject, shouldDisable, startTime);
}

const updateClassStatus = async (subject: string, shouldDisable: boolean, startTime: string) => {
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
  } catch (error) {
    toast.error(
      axios.isAxiosError(error) 
        ? error.response?.data?.error 
        : `Failed to ${shouldDisable ? 'disable' : 'enable'} class`
    );
  }
}

// Modify handleTopicsUpdate function
const handleTopicsUpdate = async (subject: string, topics: string, startTime: string) => {
  const key = `${subject}-${startTime}`;
        
  // Store original value if not already stored
  if (!originalValues[key]) {
      const period = timetable?.periods.find(p => 
          p.subject === subject && p.startTime === startTime
      );
      setOriginalValues(prev => ({
          ...prev,
          [key]: { attended: period?.attended, topicsCovered: period?.topicsCovered }
      }));
  }

  setChangedPeriods(prev => ({
      ...prev,
      [key]: originalValues[key]?.topicsCovered !== topics
  }));
  
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
    console.error('Failed:', error)

    toast.error('Failed to update topics')
  }
}

const handleSaveChanges = async (subject: string, startTime: string) => {
  const key = `${subject}-${startTime}`;
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
      
      // Update original values after successful save
      setOriginalValues(prev => ({
          ...prev,
          [key]: {
              attended: period.attended,
              topicsCovered: period.topicsCovered
          }
      }));
      setChangedPeriods(prev => ({ ...prev, [key]: false }));
      toast.success('Changes saved');
    }
  } catch (error) {
    console.error('Failed:', error)
    toast.error('Failed to save changes');
  }
}



// Add time conversion helper
const convertTo24Hour = (time: string, period: string) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  let hour = parseInt(hours)
  
  if (period === 'PM' && hour < 12) {
      hour += 12
  } else if (period === 'AM' && hour === 12) {
      hour = 0
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`
}

const convertTo12Hour = (time: string) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  let hour = parseInt(hours)
  
  // Convert hour to 12-hour format
  if (hour > 12) {
      hour = hour - 12
  } else if (hour === 0) {
      hour = 12
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`
}

const handleAddClass = async () => {
  try {
      // Format date properly for UTC storage
      const formattedDate = validTill ? new Date(Date.UTC(
          validTill.getFullYear(),
          validTill.getMonth(),
          validTill.getDate(),
          0, 0, 0, 0
      )).toISOString() : null;

      const formattedClass = {
          subject: newClass.subject,
          startTime: convertTo12Hour(newClass.startTime),
          endTime: convertTo12Hour(newClass.endTime),
          validTill: formattedDate
      }

      console.log('Sending data:', formattedClass) // For debugging
      const response = await axios.post('/api/schedule/add-class', formattedClass)

      if (response.status === 200) {
          setShowAddClass(false)
          fetchTodaySchedule()
          toast.success('Class added successfully')
      }
  } catch (error) {
      console.error('Failed to add class:', error)
      toast.error('Failed to add class')
  }
}


  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-indigo-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col">
            <span className="text-gray-500 text-sm font-medium">{dayName}</span>
            <h1 className="text-gray-900 text-2xl font-bold">
              {dateDisplay} {monthName}
            </h1>
          </div>
          <div className="flex gap-4 mb-4 " >
            <Button 
                onClick={() => setShowAddClass(true)}
                variant="outline" 

                className="bg-white hover:bg-gray-50 text-indigo-600 border-indigo-200 shadow-sm"
            >
                Add a Class
            </Button>
            <Link href="/exchange">
              <Button 
                variant="outline" 
                className="bg-white hover:bg-gray-50 text-indigo-600 border-indigo-200 shadow-sm"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Exchange Periods
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-3">
          {timetable?.periods.map((period, index) => (
            <Card 
              key={`${period.subject}-${period.startTime}-${index}`}
              className="border border-gray-700 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">{period.subject}</h3>
                        {period.temporaryExchange && (
                          <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                            Original: {period.temporaryExchange.originalSubject}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{period.startTime} - {period.endTime}</span>
                        <span>•</span>
                        <span>{period.teacher}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`attendance-${period.subject}-${period.startTime}`}
                          checked={period.attended}
                          onCheckedChange={(checked) => 
                            handleAttendanceChange(period.subject, checked as boolean, period.startTime)
                          }
                          disabled={period.isHoliday || period.disabled}
                          className="border-gray-300 data-[state=checked]:bg-indigo-600"
                        />
                        <label 
                          htmlFor={`attendance-${period.subject}-${period.startTime}`}
                          className="text-gray-700 text-sm"
                        >
                          Present
                        </label>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={period.attended}
                        onClick={() => handleDisableClass(period.subject, !period.disabled, period.startTime)}
                        className={`h-8 px-3 shadow-sm ${
                          period.disabled 
                            ? 'border-green-200 text-green-600 hover:bg-green-50' 
                            : 'border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {period.disabled ? 'Enable' : 'Disable'}
                      </Button>
                    </div>
                  </div>

                  <Input
                    placeholder="Topics covered..."
                    value={period.topicsCovered || ''}
                    onChange={(e) => handleTopicsUpdate(period.subject, e.target.value, period.startTime)}
                    disabled={period.disabled || (!period.attended && !period.topicsCovered)}
                    className="bg-white/5 border-gray-700 text-gray-700 text-sm h-9 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                  />

                  {changedPeriods[`${period.subject}-${period.startTime}`] && (
                    <Button 
                      onClick={() => handleSaveChanges(period.subject, period.startTime)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto shadow-sm"
                    >
                      Save Changes
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={showHolidayConfirmation} onOpenChange={setShowHolidayConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Holiday Class?</AlertDialogTitle>
            <AlertDialogDescription>
              This class is marked as a holiday. Enabling it might affect attendance records. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowHolidayConfirmation(false);
              setPendingEnableAction(null);
            }}
            className='text-black'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingEnableAction) {
                updateClassStatus(pendingEnableAction.subject, false, pendingEnableAction.startTime);
                setShowHolidayConfirmation(false);
                setPendingEnableAction(null);
              }
            }}>
              Enable Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Class Drawer */}
      <Drawer open={showAddClass} onOpenChange={setShowAddClass}>
        <DrawerContent className="bg-gray-900 border-t border-gray-700">
            <DrawerHeader>
                <DrawerTitle>Add New Class</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-4">
                <div className="space-y-2 ">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                        id="subject"
                        value={newClass.subject}
                        onChange={(e) => setNewClass(prev => ({
                            ...prev,
                            subject: e.target.value
                        }))}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4 text-white">
                    <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <div className="flex gap-2 text-white">
                            <TimeInput
                                id="startTime"
                                type="time"
                                value={newClass.startTime}
                                variant="bordered"
                                radius="sm"
                                onChange={(e) => setNewClass(prev => ({
                                    ...prev,
                                    startTime: e.target.value
                                }))}
                                className="max-w-[200px] flex-1"
                                classNames={{
                                    input: "bg-white/5 text-white",
                                    innerWrapper: "bg-transparent",
                                    inputWrapper: "bg-transparent border-gray-700 hover:border-gray-600"
                                }}
                            />
                            
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <div className="flex gap-2">
                            <TimeInput
                                id="endTime"
                                type="time"
                                value={newClass.endTime}
                                variant="bordered"
                                radius="sm"
                                onChange={(e) => setNewClass(prev => ({
                                    ...prev,
                                    endTime: e.target.value
                                }))}
                                className="max-w-[200px] flex-1 text-white"
                                classNames={{
                                    input: "bg-white/5 text-white",
                                    innerWrapper: "bg-transparent",
                                    inputWrapper: "bg-transparent border-gray-700 hover:border-gray-600"
                                }}
                            />
                            
                        </div>
                    </div>
                </div>
                <div className="space-y-2 ">
                    <Label>Valid Till</Label>
                    <Calendar
                        mode="single"
                        selected={validTill}
                        onSelect={setValidTill}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border content-center"
                    />
                </div>
                <div className="flex justify-end gap-4">
                    <DrawerClose asChild>
                        <Button 
                        variant="outline"
                        className='text-black'
                        >
                          Cancel
                        </Button>
                    </DrawerClose>
                    <Button 
                        variant="outline"
                        onClick={handleAddClass}
                        className='text-black'
                        disabled={!newClass.subject || !newClass.startTime || !newClass.endTime || !validTill}
                    >
                        Add Class
                    </Button>
                </div>
            </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
