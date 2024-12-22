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
        <div className="container mx-auto p-4">
            <div className="flex flex-col items-center space-y-4">
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
                    modifiersStyles={{
                        holiday: { color: 'red' },
                        today: { color: 'blue' },
                        noData: { color: 'grey' }
                    }}
                />

                {selectedDate && (
                    <Drawer>
                        <DrawerTrigger asChild>
                            <Button>
                                {new Date(selectedDate) > new Date() ? 'Mark Holiday' : 'View Schedule'}
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle className='text-black'>
                                    {selectedDate.toDateString()}
                                </DrawerTitle>
                                {new Date(selectedDate) > new Date() ? (
                                    <Button onClick={() => markHoliday(selectedDate)} >
                                        Mark as Holiday
                                    </Button>
                                ) : (
                                    <div className="space-y-2 text-black">
                                        {getClassesForDate(selectedDate).length > 0 ? (
                                            getClassesForDate(selectedDate).map((cls, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-2 border rounded cursor-pointer text-black"
                                                    onClick={() => {
                                                        setSelectedClass(cls)
                                                        setShowTopics(true)
                                                    }}
                                                >
                                                    <h3>{cls.subject}</h3>
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
