import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Timetable } from '@/models/Timetable';
import { ClassInfo } from '@/models/ClassInfo';
import { authOptions } from '../auth/[...nextauth]/route';
import { DaySchedule, Period, SubjectInfo, ClassInfoInterface } from '@/types';


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user's timetable
    const user = await User.findById(session.user._id);
    if (!user?.timetableId) {
      return NextResponse.json({ error: 'No timetable found' }, { status: 404 });
    }

    const timetable = await Timetable.findById(user.timetableId);
    if (!timetable) {
      return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
    }

    // Extract unique subjects from timetable
    const timetableSubjects = new Set<string>();
    timetable.schedule.forEach((day:DaySchedule) => {
      day.periods.forEach((period:Period) => {
        timetableSubjects.add(period.subject);
      });
    });

    // Find or create ClassInfo
    let classInfo = await ClassInfo.findOne({ userId: session.user._id });
    
    if (!classInfo) {
      // Create new ClassInfo with empty subject array
      await ClassInfo.create({
        userId: session.user._id,
        subject: []
      });
    }

    classInfo = await ClassInfo.findOne({ userId: session.user._id });
    

    // Get existing subject names
    const existingSubjects = new Set(classInfo.subject.map((s: SubjectInfo) => s.name));

    // Add missing subjects with empty allclasses arrays
    Array.from(timetableSubjects).forEach(subjectName => {
        if (!existingSubjects.has(subjectName)) {
          const newSubject = {
            name: subjectName,
            allclasses: [],
            allHappened: 0,
            allAttended: 0
          };
          classInfo.subject.push(newSubject);
        }
      });
  
      const savedClassInfo = await classInfo.save();
      return NextResponse.json({
        message: 'ClassInfo updated successfully',
        data: savedClassInfo
      });

  } catch (error) {
    console.error('ClassInfo creation error:', error);
    return NextResponse.json({ error: 'Failed to create ClassInfo' }, { status: 500 });
  }
}
