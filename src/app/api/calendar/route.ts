/**
 * API routes for calendar operations
 * GET: Retrieves formatted calendar data with class schedules
 * POST: Marks specific dates as holidays
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { User } from '@/models/User'
import { ClassInfo } from '@/models/ClassInfo'
import { connectDB } from '@/lib/db'
import { authOptions } from '../auth/[...nextauth]/route'
import { SubjectInfo } from '@/types'

export async function GET(req: Request) {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await User.findOne({ email: session.user.email })
        const classInfo = await ClassInfo.findOne({ userId: user._id })

        if (!classInfo) {
            return NextResponse.json({ error: 'No class data found' }, { status: 404 })
        }

        // Process and format calendar data
        const calendarData = classInfo.subject.flatMap((subject:SubjectInfo) => 
            subject.allclasses.map(cls => ({
                date: cls.date,
                isHoliday: cls.isHoliday,
                happened: cls.happened,
                subject: subject.name,
                startTime: cls.startTime,
                endTime: cls.endTime,
                topicsCovered: cls.topicsCovered
            }))
        )

        return NextResponse.json({ calendarData })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

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
        const classInfo = await ClassInfo.findOne({ userId: user._id })

        if (!classInfo) {
            return NextResponse.json({ error: 'No class data found' }, { status: 404 })
        }

        // Mark all classes on the selected date as holiday
        classInfo.subject.forEach((subject:SubjectInfo) => {
            subject.allclasses.forEach(cls => {
                if (cls.date.toDateString() === holidayDate.toDateString()) {
                    cls.isHoliday = true
                    cls.happened = false
                    cls.attended = false
                }
            })
        })

        await classInfo.save()
        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
