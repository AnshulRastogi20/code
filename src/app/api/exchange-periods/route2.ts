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
import { ClassInfoInterface, DaySchedule, Period, SubjectInfo } from '@/types';

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
    const { firstPeriod, secondPeriod, endDate } = body;

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

    // Get the complete period objects being exchanged
    const firstPeriodObject = firstDaySchedule.periods[firstPeriodIndex];
    const secondPeriodObject = secondDaySchedule.periods[secondPeriodIndex];

    if (endDate) {
      // Store the original subject strings and end date
      const firstOriginalSubject = firstPeriodObject.subject;
      const secondOriginalSubject = secondPeriodObject.subject;

      // Set temporary exchanges with just the required fields
      firstDaySchedule.periods[firstPeriodIndex] = {
        ...firstPeriodObject,
        subject: secondPeriodObject.subject,
        temporaryExchange: {
          originalSubject: firstOriginalSubject,
          exchangeEndDate: new Date(endDate)
        }
      };

      secondDaySchedule.periods[secondPeriodIndex] = {
        ...secondPeriodObject,
        subject: firstOriginalSubject,
        temporaryExchange: {
          originalSubject: secondOriginalSubject,
          exchangeEndDate: new Date(endDate)
        }
      };
    } else {
      // Simple swap without temporary exchange
      const tempSubject = firstPeriodObject.subject;
      firstDaySchedule.periods[firstPeriodIndex].subject = secondPeriodObject.subject;
      secondDaySchedule.periods[secondPeriodIndex].subject = tempSubject;
    }

    await timetable.save();

    // Update ClassInfo for both subjects
    const classInfo = await ClassInfo.findOne({ userId: dbUser._id });
    if (classInfo) {
      const currentDate = new Date();
      const todayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const endDateTime = endDate ? new Date(endDate) : null;

      // Find subject documents using the original subjects before exchange
      const firstSubject = classInfo.subject.find((s:SubjectInfo) => 
        s.name === firstPeriodObject.subject
      );
      const secondSubject = classInfo.subject.find((s:SubjectInfo) => 
        s.name === secondPeriodObject.subject
      );

      if (firstSubject && secondSubject) {
        console.log("Before changes:", {
          firstSubject: { name: firstSubject.name, classCount: firstSubject.allclasses.length },
          secondSubject: { name: secondSubject.name, classCount: secondSubject.allclasses.length }
        });

        // Remove future classes for both periods
        firstSubject.allclasses = firstSubject.allclasses.filter((cls:ClassInfoInterface) => {
          const classDate = new Date(cls.date);
          return classDate < currentDate || 
                 cls.startTime !== firstPeriod.startTime || 
                 new Date(cls.date).toLocaleDateString('en-US', { weekday: 'long' }) !== firstPeriod.day;
        });

        secondSubject.allclasses = secondSubject.allclasses.filter((cls:ClassInfoInterface) => {
          const classDate = new Date(cls.date);
          return classDate < currentDate || 
                 cls.startTime !== secondPeriod.startTime || 
                 new Date(cls.date).toLocaleDateString('en-US', { weekday: 'long' }) !== secondPeriod.day;
        });

        // Add today's classes if applicable
        if (todayName === firstPeriod.day) {
          const newClass = {
            date: new Date(currentDate),
            startTime: firstPeriod.startTime,
            endTime: firstPeriod.endTime,
            isHoliday: false,
            happened: true,
            attended: false,
            topicsCovered: [],
            temporarySubject: endDate ? secondPeriodObject.subject : null,
            exchangeEndDate: endDateTime
          };

          // Add to the appropriate subject based on exchange type
          if (endDate) {
            firstSubject.allclasses.push(newClass);
          } else {
            secondSubject.allclasses.push(newClass);
          }
        }

        if (todayName === secondPeriod.day) {
          const newClass = {
            date: new Date(currentDate),
            startTime: secondPeriod.startTime,
            endTime: secondPeriod.endTime,
            isHoliday: false,
            happened: true,
            attended: false,
            topicsCovered: [],
            temporarySubject: endDate ? firstPeriodObject.subject : null,
            exchangeEndDate: endDateTime
          };

          // Add to the appropriate subject based on exchange type
          if (endDate) {
            secondSubject.allclasses.push(newClass);
          } else {
            firstSubject.allclasses.push(newClass);
          }
        }

        // Recalculate attendance counts
        firstSubject.allHappened = firstSubject.allclasses.filter((c: Period) => c.happened).length;
        firstSubject.allAttended = firstSubject.allclasses.filter((c: Period) => c.attended).length;
        secondSubject.allHappened = secondSubject.allclasses.filter((c: Period) => c.happened).length;
        secondSubject.allAttended = secondSubject.allclasses.filter((c: Period) => c.attended).length;

        console.log("After changes:", {
          firstSubject: { name: firstSubject.name, classCount: firstSubject.allclasses.length },
          secondSubject: { name: secondSubject.name, classCount: secondSubject.allclasses.length }
        });

        await classInfo.save();
      }
    }

    return NextResponse.json({ message: 'Periods exchanged successfully' });
  } catch (error) {
    console.error('Period exchange error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
  