'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar } from '@/components/ui/calendar'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { CalendarData } from '@/types'
import { Switch } from "@/components/ui/switch"



export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [calendarData, setCalendarData] = useState<CalendarData[]>([])
    const [selectedClass, setSelectedClass] = useState<CalendarData | null>(null)
    const [showTopics, setShowTopics] = useState(false)
    const [showHolidayConfirm, setShowHolidayConfirm] = useState(false)
    const [showAttendanceConfirm, setShowAttendanceConfirm] = useState(false)
    const [selectedAttendance, setSelectedAttendance] = useState<{
        subject: string;
        date: string;
        startTime: string;
        current: boolean;
    } | null>(null)
    const [selectedHappened, setSelectedHappened] = useState<{
        subject: string;
        date: string;
        startTime: string;
        current: boolean;
    } | null>(null)
    const [showHappenedConfirm, setShowHappenedConfirm] = useState(false)

    useEffect(() => {
        fetchCalendarData()
    }, [])

    const fetchCalendarData = async () => {
        try {
            const { data } = await axios.get('/api/calendar')
            setCalendarData(data.calendarData)
        } catch (error) {
            console.error('Failed to fetch calendar data:', error)
        }
    }

    const markHoliday = async (date: Date) => {
        try {
            const response = await axios.post('/api/calendar', { date })
            if (response.status === 200) {
                await fetchCalendarData()
            }
        } catch (error) {
            console.error('Failed to mark holiday:', error)
        }
    }

    const getClassesForDate = (date: Date) => {
        return calendarData.filter(cls => 
            new Date(cls.date).toDateString() === date.toDateString()
        )
    }

    const isHolidayDate = (date: Date) => {
        const classes = getClassesForDate(date);
        return classes.length > 0 && classes.every(cls => cls.isHoliday);
    };

    const handleHolidayClick = () => {
        setShowHolidayConfirm(true)
    }

    const confirmMarkHoliday = async () => {
        await markHoliday(selectedDate!)
        setShowHolidayConfirm(false)
    }

    const handleAttendanceChange = async (confirmed: boolean) => {
        if (!confirmed || !selectedAttendance) {
            setShowAttendanceConfirm(false)
            return
        }

        try {
            const response = await axios.patch('/api/calendar/attended', {
                subject: selectedAttendance.subject,
                date: selectedAttendance.date,
                startTime: selectedAttendance.startTime,
                attended: !selectedAttendance.current
            })

            if (response.status === 200 && response.data.success) {
                // Update the local state immediately
                setCalendarData(prevData => 
                    prevData.map(cls => 
                        cls.subject === selectedAttendance.subject &&
                        cls.date === selectedAttendance.date &&
                        cls.startTime === selectedAttendance.startTime
                            ? { ...cls, attended: !selectedAttendance.current }
                            : cls
                    )
                )
            }
        } catch (error) {
            console.error('Failed to update attendance:', error)
        }

        setShowAttendanceConfirm(false)
    }

    const handleHappenedChange = async (confirmed: boolean) => {
        if (!confirmed || !selectedHappened) {
            setShowHappenedConfirm(false)
            return
        }

        try {
            const response = await axios.patch('/api/calendar/happened', {
                subject: selectedHappened.subject,
                date: selectedHappened.date,
                startTime: selectedHappened.startTime,
                happened: !selectedHappened.current
            })

            if (response.status === 200 && response.data.success) {
                setCalendarData(prevData => 
                    prevData.map(cls => 
                        cls.subject === selectedHappened.subject &&
                        cls.date === selectedHappened.date &&
                        cls.startTime === selectedHappened.startTime
                            ? { ...cls, happened: !selectedHappened.current }
                            : cls
                    )
                )
            }
        } catch (error) {
            console.error('Failed to update happened status:', error)
        }

        setShowHappenedConfirm(false)
    }

    const handleAddSchedule = async () => {
        if (!selectedDate) return;
        
        try {
            const response = await axios.post('/api/calendar/add-schedule', { 
                date: selectedDate 
            });
            
            if (response.status === 200) {
                await fetchCalendarData()
            }
        } catch (error) {
            console.error('Failed to add schedule:', error)
        }
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex flex-col items-center space-y-6">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-lg hover:shadow-xl transition-all">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        modifiers={{
                            holiday: (date) => calendarData.some(cls => 
                                new Date(cls.date).toDateString() === date.toDateString() && cls.isHoliday
                            ),
                            today: (date) => date.toDateString() === new Date().toDateString(),
                            noData: (date) => !calendarData.some(cls => 
                                new Date(cls.date).toDateString() === date.toDateString()
                            )
                        }}
                        className="text-white"
                        modifiersStyles={{
                            holiday: { color: 'rgb(239 68 68)', fontWeight: 'bold' },
                            today: { color: 'rgb(99 102 241)', fontWeight: 'bold' },
                            noData: { color: 'rgb(156 163 175)' }
                        }}
                    />
                </div>

                {selectedDate && !isHolidayDate(selectedDate) && (
                    <>
                        <Drawer>
                            <DrawerTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                                    {new Date(selectedDate) > new Date() 
                                        ? 'Mark Holiday' 
                                        : 'View Schedule'}
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="bg-gray-900 border-t border-gray-700">
                                <DrawerHeader className="mb-4">
                                    <DrawerTitle className="text-white">
                                        {selectedDate.toDateString()}
                                    </DrawerTitle>
                                </DrawerHeader>
                                
                                <div className="px-6 pb-6 items-center">
                                    {new Date(selectedDate) > new Date() ? (
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium items-center"
                                        onClick={handleHolidayClick}
                                        
                                        >
                                            Mark as Holiday
                                        </Button>
                                    ) : (
                                        <div className="space-y-2 text-white max-h-[60vh] overflow-y-auto">
                                            {getClassesForDate(selectedDate).length > 0 ? (
                                                getClassesForDate(selectedDate).map((cls, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-4 border border-gray-700 rounded-xl bg-white/5 flex items-center justify-between"
                                                    >
                                                        <div 
                                                            className="cursor-pointer flex-grow"
                                                            onClick={() => {
                                                                setSelectedClass(cls)
                                                                setShowTopics(true)
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <h3>{cls.subject}</h3>
                                                                {cls.temporaryExchange && (
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className="ml-2 text-white"
                                                                    >
                                                                        Original: {cls.temporaryExchange.originalSubject}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p>{cls.startTime} - {cls.endTime}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-col">
                                                            <div className="flex items-center gap-2 w-full justify-end">
                                                                <Badge 
                                                                    variant={cls.happened ? "default" : "secondary"}
                                                                    className={cls.happened ? "bg-blue-500 hover:bg-blue-600" : ""}
                                                                >
                                                                    {cls.happened ? "Happened" : "Not Happened"}
                                                                </Badge>
                                                                <Switch
                                                                    checked={cls.happened}
                                                                    onCheckedChange={() => {
                                                                        setSelectedHappened({
                                                                            subject: cls.subject,
                                                                            date: cls.date,
                                                                            startTime: cls.startTime,
                                                                            current: cls.happened
                                                                        })
                                                                        setShowHappenedConfirm(true)
                                                                    }}
                                                                    className="bg-gray-600"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 w-full justify-end">
                                                                <Badge 
                                                                    variant={cls.attended ? "default" : "secondary"}
                                                                    className={cls.attended ? "bg-green-500 hover:bg-green-600" : ""}
                                                                >
                                                                    {cls.attended ? "Attended" : "Absent"}
                                                                </Badge>
                                                                <Switch
                                                                    checked={cls.attended}
                                                                    disabled={!cls.happened}
                                                                    onCheckedChange={() => {
                                                                        setSelectedAttendance({
                                                                            subject: cls.subject,
                                                                            date: cls.date,
                                                                            startTime: cls.startTime,
                                                                            current: cls.attended
                                                                        })
                                                                        setShowAttendanceConfirm(true)
                                                                    }}
                                                                    className="bg-gray-600"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 flex items-center justify-between">
                                                    <p>No Schedule for this date</p>
                                                    {selectedDate && new Date(selectedDate) < new Date() && (
                                                        <Button 
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                                                            onClick={handleAddSchedule}
                                                        >
                                                            Add Schedule
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </DrawerContent>
                        </Drawer>

                        <AlertDialog open={showHolidayConfirm} onOpenChange={setShowHolidayConfirm}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action is irreversible. All classes scheduled for {selectedDate?.toDateString()} will be cancelled.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel
                                    className='text-black'
                                    >Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={confirmMarkHoliday}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}

                {selectedDate && isHolidayDate(selectedDate) && (
                    <Button 
                        disabled 
                        className="bg-red-600/50 cursor-not-allowed text-white/70"
                    >
                        Holiday
                    </Button>
                )}

                <Dialog open={showTopics} onOpenChange={setShowTopics} >
                    <DialogContent className='text-black'>
                        <DialogHeader>
                            <DialogTitle
                            className='text-black'>
                                Topics Covered - {selectedClass?.subject}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 text-black">
                            {selectedClass?.topicsCovered.map((topic, idx) => (
                                <p key={idx}>{topic}</p>
                            ))}
                            {(!selectedClass?.topicsCovered || selectedClass.topicsCovered.length === 0) && (
                                <p>No topics covered</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={showAttendanceConfirm} onOpenChange={setShowAttendanceConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Change Attendance Status?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to change the class attendance status? This will affect your attendance record.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel 
                            onClick={() => handleAttendanceChange(false)}
                            className='text-black'
                            >
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleAttendanceChange(true)}>
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={showHappenedConfirm} onOpenChange={setShowHappenedConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Change Class Status?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to change the class happened status?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel 
                                onClick={() => handleHappenedChange(false)}
                                className='text-black'
                            >
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleHappenedChange(true)}>
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <div className="flex gap-4 p-4 bg-gray-800/50 rounded-lg">
                    <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-500">
                        Current Date
                    </Badge>
                    <Badge variant="outline" className="bg-red-600/20 text-red-400 border-red-500">
                        Holiday
                    </Badge>
                    <Badge variant="outline" className="bg-gray-600/20 text-gray-400 border-gray-500">
                        No Data
                    </Badge>
                </div>
            </div>
        </div>
    )
}
