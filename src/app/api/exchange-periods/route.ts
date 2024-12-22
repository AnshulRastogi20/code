/**
 * API route for exchanging periods in a timetable
 * POST: Handles the exchange of two periods, updating both timetable and class info
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { Timetable } from '@/models/Timetable';
import { ClassInfo } from '@/models/ClassInfo';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/route';
import { DaySchedule, Period, SubjectInfo } from '@/types';

export async function POST(req: Request) {
  try {
    // Initialize connection and verify authentication
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Extract and validate period exchange details
    const { firstPeriod, secondPeriod } = body;

    if (!firstPeriod || !secondPeriod) {
      return NextResponse.json({ error: 'Both periods are required' }, { status: 400 });
    }

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update Timetable with exchanged periods
    const timetable = await Timetable.findOne({ userId: dbUser._id });
    if (!timetable) {
      return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
    }

    // Find the periods to exchange
    const firstDaySchedule = timetable.schedule.find((day:DaySchedule) => day.day === firstPeriod.day);
    const secondDaySchedule = timetable.schedule.find((day:DaySchedule) => day.day === secondPeriod.day);

    if (!firstDaySchedule || !secondDaySchedule) {
      return NextResponse.json({ error: 'Invalid day selected' }, { status: 400 });
    }

    const firstPeriodIndex = firstDaySchedule.periods.findIndex(
      (p:Period) => p.startTime === firstPeriod.startTime && p.endTime === firstPeriod.endTime
    );
    const secondPeriodIndex = secondDaySchedule.periods.findIndex(
      (p:Period) => p.startTime === secondPeriod.startTime && p.endTime === secondPeriod.endTime
    );

    if (firstPeriodIndex === -1 || secondPeriodIndex === -1) {
      return NextResponse.json({ error: 'Period not found' }, { status: 400 });
    }

    // Get the subjects being exchanged
    const firstSubject = firstDaySchedule.periods[firstPeriodIndex].subject;
    const secondSubject = secondDaySchedule.periods[secondPeriodIndex].subject;

    // Swap the subjects in timetable
    firstDaySchedule.periods[firstPeriodIndex].subject = secondSubject;
    secondDaySchedule.periods[secondPeriodIndex].subject = firstSubject;

    await timetable.save();

    // Update ClassInfo for both periods
    const classInfo = await ClassInfo.findOne({ userId: dbUser._id });
    if (classInfo) {
      const currentDate = new Date();
      const todayStr = currentDate.toDateString();

      classInfo.subject.forEach((subj: SubjectInfo) => {
        if (subj.name === firstSubject || subj.name === secondSubject) {
          // Handle current day's exchanges differently
          const todayClasses = subj.allclasses.filter(cls => 
            new Date(cls.date).toDateString() === todayStr
          );

          todayClasses.forEach(cls => {
            if (!cls.attended) { // Only process unattended classes
              // Remove the class entry if it matches exchange criteria
              if ((subj.name === firstSubject && 
                  cls.startTime === firstPeriod.startTime && 
                  cls.endTime === firstPeriod.endTime) ||
                  (subj.name === secondSubject && 
                  cls.startTime === secondPeriod.startTime && 
                  cls.endTime === secondPeriod.endTime)) {
                
                subj.allclasses = subj.allclasses.filter(c => 
                  !(new Date(c.date).toDateString() === todayStr && 
                    c.startTime === cls.startTime && 
                    c.endTime === cls.endTime)
                );
              }
            }
          });

          // Add new entries for exchanged classes on current day
          if (subj.name === secondSubject) {
            const shouldAddFirst = !subj.allclasses.some(cls => 
              new Date(cls.date).toDateString() === todayStr && 
              cls.startTime === firstPeriod.startTime
            );

            if (shouldAddFirst) {
              subj.allclasses.push({
                date: currentDate,
                startTime: firstPeriod.startTime,
                endTime: firstPeriod.endTime,
                isHoliday: false,
                happened: true,
                attended: false,
                topicsCovered: []
              });
            }
          }

          if (subj.name === firstSubject) {
            const shouldAddSecond = !subj.allclasses.some(cls => 
              new Date(cls.date).toDateString() === todayStr && 
              cls.startTime === secondPeriod.startTime
            );

            if (shouldAddSecond) {
              subj.allclasses.push({
                date: currentDate,
                startTime: secondPeriod.startTime,
                endTime: secondPeriod.endTime,
                isHoliday: false,
                happened: true,
                attended: false,
                topicsCovered: []
              });
            }
          }

          // Handle future dates and attendance records
          subj.allclasses.forEach(cls => {
            const classDate = new Date(cls.date);
            if (classDate > currentDate) {
              const dayOfWeek = classDate.toLocaleDateString('en-US', { weekday: 'long' });
              
              // Check and update first period
              if (dayOfWeek === firstPeriod.day && 
                  cls.startTime === firstPeriod.startTime && 
                  cls.endTime === firstPeriod.endTime) {
                if (subj.name === firstSubject) {
                  subj.name = secondSubject;
                }
              }
              
              // Check and update second period
              if (dayOfWeek === secondPeriod.day && 
                  cls.startTime === secondPeriod.startTime && 
                  cls.endTime === secondPeriod.endTime) {
                if (subj.name === secondSubject) {
                  subj.name = firstSubject;
                }
              }
            }
          });
        }
      });

      // Update attendance counts
      classInfo.subject.forEach((subj: SubjectInfo) => {
        subj.allHappened = subj.allclasses.filter(cls => cls.happened).length;
        subj.allAttended = subj.allclasses.filter(cls => cls.attended).length;
      });

      await classInfo.save();
    }

    return NextResponse.json({ message: 'Periods exchanged successfully' });
  } catch (error) {
    // ...existing error handling...
    console.error('Period exchange error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
