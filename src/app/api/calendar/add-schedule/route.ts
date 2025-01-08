import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { User } from '@/models/User'
import { ClassInfo } from '@/models/ClassInfo'
import { Timetable } from '@/models/Timetable'
import { connectDB } from '@/lib/db'
import { authOptions } from '../../auth/[...nextauth]/options'
import type { DaySchedule } from '@/types'

export async function POST(req: Request) {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { date } = await req.json()
        const scheduleDate = new Date(date)
        
        if (scheduleDate > new Date()) {
            return NextResponse.json({ error: 'Cannot add schedule for future dates' }, { status: 400 })
        }

        const user = await User.findOne({ email: session.user.email })
        const [classInfo, timetable] = await Promise.all([
            ClassInfo.findOne({ userId: user._id }),
            Timetable.findById(user.timetableId)
        ])

        if (!classInfo || !timetable) {
            return NextResponse.json({ error: 'Required data not found' }, { status: 404 })
        }

        const dayOfWeek = scheduleDate.getDay()
        const daySchedule = timetable.schedule.find((day: DaySchedule) => 
            day.day.toLowerCase() === [
                'sunday', 'monday', 'tuesday', 'wednesday', 
                'thursday', 'friday', 'saturday'
            ][dayOfWeek].toLowerCase()
        )

        if (!daySchedule) {
            return NextResponse.json({ error: 'No schedule found for this day' }, { status: 400 })
        }

        // Add classes for each period in the schedule
        for (const period of daySchedule.periods) {
            const classData = {
                date: scheduleDate,
                startTime: period.startTime,
                endTime: period.endTime,
                isHoliday: false,
                happened: false,
                attended: false,
                topicsCovered: []
            }

            await ClassInfo.findOneAndUpdate(
                {
                    userId: user._id,
                    'subject.name': period.subject
                },
                {
                    $addToSet: {
                        'subject.$[elem].allclasses': classData
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
        console.error('Add Schedule API Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
