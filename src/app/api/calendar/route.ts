import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { User } from '@/models/User'
import { ClassInfo } from '@/models/ClassInfo'
import { Timetable } from '@/models/Timetable'
import { connectDB } from '@/lib/db'
import { authOptions } from '../auth/[...nextauth]/options'
import type { allClasses, DaySchedule, Period, SubjectInfo } from '@/types'

/**
 * GET endpoint to retrieve calendar data with class schedules and temporary exchanges
 */
export async function GET() {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await User.findOne({ email: session.user.email })
        
        // Fetch both ClassInfo and Timetable data
        const [classInfo, timetable] = await Promise.all([
            ClassInfo.findOne({ userId: user._id }),
            Timetable.findById(user.timetableId)
        ])

        if (!classInfo) {
            return NextResponse.json({ error: 'No class data found' }, { status: 404 })
        }

        // Transform ClassInfo data to calendar format with exchange info
        const calendarData = classInfo.subject.flatMap((subject: SubjectInfo) => 
            subject.allclasses.map(cls => {
                const timetablePeriod = timetable?.schedule
                    .flatMap((day:DaySchedule) => day.periods)
                    .find((p:Period) => p.subject === subject.name && p.startTime === cls.startTime)

                return {
                    date: cls.date,
                    isHoliday: cls.isHoliday,
                    happened: cls.happened,
                    subject: subject.name,
                    startTime: cls.startTime,
                    endTime: cls.endTime,
                    topicsCovered: cls.topicsCovered,
                    temporaryExchange: timetablePeriod?.temporaryExchange || null
                }
            })
        )

        return NextResponse.json({ calendarData })
    } catch (error) {
        console.error('Calendar API Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}

/**
 * POST endpoint to mark dates as holidays
 */
export async function POST(req: Request) {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { date } = await req.json()
        const holidayDate = new Date(date)
        
        const user = await User.findOne({ email: session.user.email })
        const [classInfo, timetable] = await Promise.all([
            ClassInfo.findOne({ userId: user._id }),
            Timetable.findById(user.timetableId)
        ])

        if (!classInfo || !timetable) {
            return NextResponse.json({ error: 'Required data not found' }, { status: 404 })
        }

        const dayOfWeek = holidayDate.getDay()
        const daySchedule = timetable.schedule.find((day:DaySchedule) => 
            day.day.toLowerCase() === [
                'sunday', 'monday', 'tuesday', 'wednesday', 
                'thursday', 'friday', 'saturday'
            ][dayOfWeek].toLowerCase()
        )

        if (!daySchedule) {
            return NextResponse.json({ error: 'No schedule found for this day' }, { status: 400 })
        }

        // Process each period using MongoDB updates
        for (const period of daySchedule.periods) {
            const classData = {
                date: holidayDate,
                startTime: period.startTime,
                endTime: period.endTime,
                isHoliday: true,
                happened: false,
                attended: false,
                topicsCovered: []
            }

            // Simplified update query
            await ClassInfo.findOneAndUpdate(
                {
                    userId: user._id,
                    'subject.name': period.subject
                },
                {
                    $set: {
                        'subject.$[elem].allclasses': [
                            ...classInfo.subject.find((s:SubjectInfo) => s.name === period.subject)?.allclasses.filter(
                                (cls:allClasses )=> cls.date.toDateString() !== holidayDate.toDateString() || 
                                      cls.startTime !== period.startTime
                            ) || [],
                            classData
                        ]
                    }
                },
                {
                    arrayFilters: [{ 'elem.name': period.subject }],
                    new: true
                }
            )
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Calendar Holiday API Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
