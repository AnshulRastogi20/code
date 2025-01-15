// Import necessary dependencies
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { User } from '@/models/User'
import { Timetable } from '@/models/Timetable'
import { ClassInfo } from '@/models/ClassInfo'
import { connectDB } from '@/lib/db'
import { authOptions } from '../auth/[...nextauth]/options'
import type { DaySchedule, SubjectInfo, Period } from '@/types'

/**
 * POST endpoint to handle starting a new day or marking a holiday
 * This function initializes or updates class records for the current day
 */
export async function POST(req: Request) {
  try {
    // Initialize database and authenticate user
    await connectDB()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract action type from request body
    const { action } = await req.json()

    // Get user's timetable information
    const user = await User.findOne({ email: session.user.email })
    const timetable = await Timetable.findById(user.timetableId)
    
    if (!timetable) {
      return NextResponse.json({ error: 'Timetable not found' }, { status: 404 })
    }

    // Set up date handling for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayUTC = new Date(Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0, 0, 0, 0
    ))
    // Get current day name (Monday, Tuesday, etc.)
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]
    
    // Find today's schedule in the timetable
    const todaySchedule = timetable.schedule.find((day: DaySchedule) => 
      day.day.toUpperCase() === dayName.toUpperCase()
    )

    if (!todaySchedule) {
      return NextResponse.json({ error: 'No schedule found for today' }, { status: 404 })
    }

    // Get or create class info for the user
    let classInfo = await ClassInfo.findOne({ userId: user._id })
    
    // Check for existing entries for today
    const hasExistingEntries = classInfo?.subject.some((subj: SubjectInfo) =>
      subj.allclasses.some((cls: any) =>
        new Date(cls.date).toDateString() === today.toDateString()
      )
    )

    if (hasExistingEntries) {
      return NextResponse.json({ 
        error: 'Classes for today are already initialized',
        isDateStarted: true
      }, { status: 409 })
    }

    if (!classInfo) {
      // Initialize new class info with subjects from today's schedule
      const initialSubjects: SubjectInfo[] = todaySchedule.periods.map((period:Period) => ({
        name: period.subject,
        allclasses: [],
        allHappened: 0,
        allAttended: 0
      }));

      classInfo = new ClassInfo({
        userId: user._id,
        subject: initialSubjects
      });
    }

    // Process classes based on action type (startDay or markHoliday)
    if (action === 'startDay' || action === 'markHoliday') {
      // Process each period in today's schedule
      todaySchedule.periods.forEach((period: Period) => {
        const subject = classInfo.subject.find((s:SubjectInfo) => s.name === period.subject);
        if (subject) {
          // Check for duplicate entries
          const isDuplicate = subject.allclasses.some((cls:Period) => 
            cls.date.toDateString() === today.toDateString() &&
            cls.startTime === period.startTime &&
            cls.endTime === period.endTime
          );

          if (!isDuplicate) {
            subject.allclasses.push({
              date: todayUTC,
              startTime: period.startTime,
              endTime: period.endTime,
              isHoliday: action === 'markHoliday',
              happened: action === 'startDay',
              attended: false,
              topicsCovered: []
            });

            if (action === 'startDay') {
              subject.allHappened = subject.allclasses.filter((cls:Period) => cls.happened).length;
            }
          }
        }
      });
    }

    await classInfo?.save()
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Start route error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }, { status: 500 })
  }
}
