// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { connectDB } from '@/lib/db';
// import { User } from '@/models/User';
// import { Timetable } from '@/models/Timetable';
// import { ClassInfo } from '@/models/ClassInfo';
// import { authOptions } from '../auth/[...nextauth]/route';
import { DaySchedule, Period, SubjectInfo, ClassInfoInterface } from '@/types';

// export async function POST(req: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     await connectDB();

//     // Fetch user and timetable
//     const user = await User.findById(session.user._id).populate('timetableId');
//     if (!user || !user.timetableId) {
//       return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
//     }

//     const timetable = await Timetable.findById(user.timetableId);
//     if (!timetable) {
//       return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
//     }

//     // Get current date without time
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Fetch or create class info record with explicit periods array
//     let classInfo = await ClassInfo.findOne({ 
//       userId: session.user._id, 
//       date: {
//         $gte: today,
//         $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
//       }
//     });

//     if (!classInfo) {
//       classInfo = await ClassInfo.create({
//         userId: session.user._id,
//         date: today,
//         periods: [], // Initialize empty array
//         isHoliday: false
//       });
//     }

//     // Ensure periods exists
//     if (!classInfo.periods) {
//       classInfo.periods = [];
//     }

//     // Get all subjects from timetable
//     const timetableSubjects = new Set<string>();

//     timetable.schedule.forEach((day: DaySchedule) => {
//       day.periods.forEach((period: { subject: string }) => {
//         timetableSubjects.add(period.subject);
//       });
//     });

//     // Check and add missing subjects to class info
//     const classSubjects = new Set(
//       Array.isArray(classInfo.periods) 
//         ? classInfo.periods.map((p: Period) => p.subject)
//         : []
//     );

//     timetableSubjects.forEach(subject => {
//       if (!classSubjects.has(subject)) {
//         classInfo.periods.push({
//           subject,
//           startTime: '',
//           endTime: '',
//           attended: false,
//           disabled: false,
//           topicsCovered: ''
//         });
//       }
//     });

//     await classInfo.save();

//     return NextResponse.json({ 
//       message: 'Class info record updated', 
//       classInfo 
//     });
//   } catch (error) {
//     console.error('Error updating class info record:', error);
//     return NextResponse.json({ 
//       error: `Failed to update class info record: ${error}` 
//     }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Timetable } from '@/models/Timetable';
import { ClassInfo } from '@/models/ClassInfo';
import { authOptions } from '../auth/[...nextauth]/route';

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
