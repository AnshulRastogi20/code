import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { User } from '@/models/User'
import { Timetable } from '@/models/Timetable'
import { ClassInfo } from '@/models/ClassInfo'
import { connectDB } from '@/lib/db'
import { authOptions } from '../auth/[...nextauth]/route'
import type { DaySchedule, SubjectInfo, ClassInfoInterface , Period} from '@/types'

export async function POST(req: Request) {
  try {
    // Initialize database and authenticate user
    await connectDB()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract action type (startDay or markHoliday)
    const { action } = await req.json()

    // Get user's timetable information
    const user = await User.findOne({ email: session.user.email })
    const timetable = await Timetable.findById(user.timetableId)
    
    if (!timetable) {
      return NextResponse.json({ error: 'Timetable not found' }, { status: 404 })
    }

    // Get current day's schedule
    const today = new Date()
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]
    
    // Find schedule for current day
    const todaySchedule = timetable.schedule.find((day: DaySchedule) => 
      day.day.toUpperCase() === dayName.toUpperCase()
    )

    if (!todaySchedule) {
      return NextResponse.json({ error: 'No schedule found for today' }, { status: 404 })
    }

    // Initialize class info if not exists
    let classInfo = await ClassInfo.findOne({ userId: user._id })
    
    if (!classInfo) {
      // Create new class info with initial subject setup
      const initialSubjects: SubjectInfo[] = todaySchedule.periods.map((period:Period) => ({
        name: period.subject,
        allclasses: [],
        allHappened: 0,
        allAttended: 0
      }))

      classInfo = new ClassInfo({
        userId: user._id,
        subject: initialSubjects
      })
    }

    // Process day's classes based on action type
    if (action === 'startDay' || action === 'markHoliday') {
      // Update each subject's attendance records
      classInfo.subject.forEach((subject: SubjectInfo) => {
        const periodInfo = todaySchedule.periods.find((p :Period)=> p.subject === subject.name)
        if (periodInfo) {
          subject.allclasses.push({
            date: today,
            startTime: periodInfo.startTime,
            endTime: periodInfo.endTime,
            isHoliday: action === 'markHoliday',
            happened: action === 'startDay',
            attended: false,
            topicsCovered: []
          })

           if (action === 'startDay'){
             // Increment allHappened counter
             subject.allHappened = (subject.allHappened || 0) + 1;
           }
        }
      })
    }

    await classInfo?.save()
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Start route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
