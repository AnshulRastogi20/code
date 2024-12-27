'use client'
import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

interface CalendarData {
    date: string
    isHoliday: boolean
    happened: boolean
    subject: string
    startTime: string
    endTime: string
    topicsCovered: string[]
    temporaryExchange?: {
        originalSubject: string;
        exchangeEndDate: Date;
    } | null;
}

export default function CalendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date>()
    const [calendarData, setCalendarData] = useState<CalendarData[]>([])
    const [selectedClass, setSelectedClass] = useState<CalendarData | null>(null)
    const [showTopics, setShowTopics] = useState(false)
    const [showHolidayConfirm, setShowHolidayConfirm] = useState(false)

    useEffect(() => {
        fetchCalendarData()
    }, [])

    const fetchCalendarData = async () => {
        const response = await fetch('/api/calendar')
        const data = await response.json()
        setCalendarData(data.calendarData)
    }

    const markHoliday = async (date: Date) => {
        const response = await fetch('/api/calendar', {
            method: 'POST',
            body: JSON.stringify({ date })
        })
        if (response.ok) {
            fetchCalendarData()
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
                                                        className="p-4 border border-gray-700 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-all"
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
                                                                    className="ml-2"
                                                                >
                                                                    Original: {cls.temporaryExchange.originalSubject}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p>{cls.startTime} - {cls.endTime}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center">
                                                    <p>No Schedule for this date</p>
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
