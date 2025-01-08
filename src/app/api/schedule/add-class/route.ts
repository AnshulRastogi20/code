import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { User } from '@/models/User'
import { ClassInfo } from '@/models/ClassInfo'
import { Timetable } from '@/models/Timetable'
import { connectDB } from '@/lib/db'
import { authOptions } from '../../auth/[...nextauth]/options'
import { DaySchedule, SubjectInfo } from '@/types'

export async function POST(req: Request) {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { subject, startTime, endTime, validTill } = await req.json()

        if (!subject || !startTime || !endTime || !validTill) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate time format for 12-hour format
        const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]$/
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return NextResponse.json({ 
                error: 'Invalid time format. Please use 12-hour format (HH:mm)' 
            }, { status: 400 })
        }

        // Format times to ensure consistent HH:mm format in 12-hour
        const formatTime = (time: string) => {
            const [hours, minutes] = time.split(':')
            return `${hours.padStart(2, '0')}:${minutes}`
        }

        const formattedStartTime = formatTime(startTime)
        const formattedEndTime = formatTime(endTime)

        const user = await User.findOne({ email: session.user.email })
        const [classInfo, timetable] = await Promise.all([
            ClassInfo.findOne({ userId: user._id }),
            Timetable.findById(user.timetableId)
        ])

        if (!classInfo || !timetable) {
            return NextResponse.json({ error: 'Required data not found' }, { status: 404 })
        }

        // Add to Timetable
        const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        const daySchedule = timetable.schedule.find((day:DaySchedule) => day.day.toLowerCase() === currentDay)
        
        if (!daySchedule) {
            return NextResponse.json({ error: 'Day schedule not found' }, { status: 400 })
        }

        // Add new period to the day's schedule
        daySchedule.periods.push({
            subject,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            temporaryExchange: {
                originalSubject: 'temporary',
                exchangeEndDate: new Date(validTill)
            }
        })

        // Add to ClassInfo
        const today = new Date()
        const todayUTC = new Date(Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            0, 0, 0, 0
        ))

        const validTillDate = new Date(validTill)
        const validTillUTC = new Date(Date.UTC(
            validTillDate.getFullYear(),
            validTillDate.getMonth(),
            validTillDate.getDate(),
            0, 0, 0, 0
        ))

        // Create class entries for each day until validTill
        const subjectIndex = classInfo.subject.findIndex((s:SubjectInfo) => s.name === subject)
        if (subjectIndex === -1) {
            // Create new subject if it doesn't exist
            classInfo.subject.push({
                name: subject,
                allclasses: [],
                allHappened: 0,
                allAttended: 0
            })
        }

        // Add class entries for each day
        for (let date = new Date(todayUTC); date <= validTillUTC; date.setDate(date.getDate() + 1)) {
            const currentDayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
            
            if (currentDayName === daySchedule.day.toLowerCase()) {
                const classData = {
                    date: new Date(Date.UTC(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                        0, 0, 0, 0
                    )),
                    startTime: formattedStartTime,
                    endTime: formattedEndTime,
                    isHoliday: false,
                    happened: false,
                    attended: false,
                    topicsCovered: []
                }
                
                const targetSubject = classInfo.subject.find((s:SubjectInfo) => s.name === subject)
                if (targetSubject) {
                    targetSubject.allclasses.push(classData)
                }
            }
        }

        // Save both documents
        await Promise.all([
            timetable.save(),
            classInfo.save()
        ])

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Add class error:', error)
        return NextResponse.json({ error: 'Failed to add class' }, { status: 500 })
    }
}
