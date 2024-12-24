'use client'
import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

    return (
        <div className="container mx-auto p-6">
            <div className="flex flex-col items-center space-y-6">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-lg">
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
                            holiday: { color: 'rgb(248 113 113)' },
                            today: { color: 'rgb(99 102 241)' },
                            noData: { color: 'rgb(156 163 175)' }
                        }}
                    />
                </div>

                {selectedDate && (
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button>
                                {new Date(selectedDate) > new Date() ? 'Mark Holiday' : 'View Schedule'}
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="bg-gray-900 border-t border-gray-700">
                            <DrawerHeader>
                                <DrawerTitle className="text-white">
                                    {selectedDate.toDateString()}
                                </DrawerTitle>
                                {new Date(selectedDate) > new Date() ? (
                                    <Button onClick={() => markHoliday(selectedDate)} >
                                        Mark as Holiday
                                    </Button>
                                ) : (
                                    <div className="space-y-2 text-white">
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
                            </DrawerHeader>
                        </DrawerContent>
                    </Drawer>
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

                <div className="flex gap-4">
                    <Badge variant="outline" className="bg-blue-500">Current Date</Badge>
                    <Badge variant="outline" className="bg-red-500">Holiday</Badge>
                    <Badge variant="outline" className="bg-gray-500">No Data</Badge>
                </div>
            </div>
        </div>
    )
}
