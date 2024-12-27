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

        // Get day of week for the holiday date (0 = Sunday, 1 = Monday, etc.)
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

        // For each period in the day's schedule, create or update class records
        daySchedule.periods.forEach((period:Period) => {
            const subjectIndex = classInfo.subject.findIndex((s:SubjectInfo) => s.name === period.subject)
            
            if (subjectIndex !== -1) {
                // Check if class record already exists
                const existingClassIndex = classInfo.subject[subjectIndex].allclasses.findIndex(
                    (cls:allClasses) => cls.date.toDateString() === holidayDate.toDateString() &&
                          cls.startTime === period.startTime
                )

                const classData = {
                    date: holidayDate,
                    startTime: period.startTime,
                    endTime: period.endTime,
                    isHoliday: true,
                    happened: false,
                    attended: false,
                    topicsCovered: []
                }

                if (existingClassIndex !== -1) {
                    // Update existing record
                    classInfo.subject[subjectIndex].allclasses[existingClassIndex] = {
                        ...classInfo.subject[subjectIndex].allclasses[existingClassIndex],
                        ...classData
                    }
                } else {
                    // Create new record
                    classInfo.subject[subjectIndex].allclasses.push(classData)
                }
            }
        })

        await classInfo.save()
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Calendar Holiday API Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
