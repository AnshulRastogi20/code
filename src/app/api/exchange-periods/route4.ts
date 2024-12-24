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

    // Get the subjects being exchanged
    const firstSubject = firstDaySchedule.periods[firstPeriodIndex].subject;
    const secondSubject = secondDaySchedule.periods[secondPeriodIndex].subject;

    // Swap the subjects in timetable
    firstDaySchedule.periods[firstPeriodIndex].subject = secondSubject;
    secondDaySchedule.periods[secondPeriodIndex].subject = firstSubject;

    await timetable.save();

    // Update ClassInfo using aggregation pipeline
    const currentDate = new Date();
    const todayStr = currentDate.toDateString();
    const todayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    await ClassInfo.updateOne(
      { userId: dbUser._id },
      [
        // Stage 1: Debugging - Log initial state of subjects
        {
          $set: {
            debug_initial_subject: "$subject",
          },
        },
        // Stage 2: Handle class exchanges
        {
          $set: {
            subject: {
              $map: {
                input: "$subject",
                as: "subj",
                in: {
                  $cond: [
                    { $in: ["$$subj.name", [firstSubject, secondSubject]] },
                    {
                      $mergeObjects: [
                        "$$subj",
                        {
                          allclasses: {
                            $concatArrays: [
                              // Existing classes not affected by exchange
                              {
                                $filter: {
                                  input: "$$subj.allclasses",
                                  as: "cls",
                                  cond: {
                                    $and: [
                                      {
                                        $or: [
                                          { $lt: ["$$cls.date", currentDate] },
                                          {
                                            $and: [
                                              {
                                                $eq: [
                                                  { $dateToString: { date: "$$cls.date", format: "%Y-%m-%d" } },
                                                  { $dateToString: { date: currentDate, format: "%Y-%m-%d" } },
                                                ],
                                              },
                                              { $eq: ["$$cls.attended", true] },
                                            ],
                                          },
                                        ],
                                      },
                                      {
                                        $not: {
                                          $or: [
                                            {
                                              $and: [
                                                { $eq: ["$$subj.name", firstSubject] },
                                                { $eq: ["$$cls.startTime", firstPeriod.startTime] },
                                              ],
                                            },
                                            {
                                              $and: [
                                                { $eq: ["$$subj.name", secondSubject] },
                                                { $eq: ["$$cls.startTime", secondPeriod.startTime] },
                                              ],
                                            },
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              // Add new classes for today
                              {
                                $cond: [
                                  {
                                    $and: [
                                      { $eq: ["$$subj.name", firstSubject] },
                                      { $eq: [todayName, secondPeriod.day] },
                                    ],
                                  },
                                  [
                                    {
                                      date: currentDate,
                                      startTime: secondPeriod.startTime,
                                      endTime: secondPeriod.endTime,
                                      isHoliday: false,
                                      happened: true,
                                      attended: false,
                                      topicsCovered: [],
                                    },
                                  ],
                                  [],
                                ],
                              },
                              {
                                $cond: [
                                  {
                                    $and: [
                                      { $eq: ["$$subj.name", secondSubject] },
                                      { $eq: [todayName, firstPeriod.day] },
                                    ],
                                  },
                                  [
                                    {
                                      date: currentDate,
                                      startTime: firstPeriod.startTime,
                                      endTime: firstPeriod.endTime,
                                      isHoliday: false,
                                      happened: true,
                                      attended: false,
                                      topicsCovered: [],
                                    },
                                  ],
                                  [],
                                ],
                              },
                            ],
                          },
                        },
                      ],
                    },
                    "$$subj",
                  ],
                },
              },
            },
          },
        },
        // Stage 3: Debugging - Log state after handling exchanges
        {
          $set: {
            debug_after_exchange: "$subject",
          },
        },
        // Stage 4: Update attendance counts
        {
          $set: {
            subject: {
              $map: {
                input: "$subject",
                as: "subj",
                in: {
                  $mergeObjects: [
                    "$$subj",
                    {
                      allHappened: {
                        $size: {
                          $filter: {
                            input: "$$subj.allclasses",
                            as: "cls",
                            cond: "$$cls.happened",
                          },
                        },
                      },
                      allAttended: {
                        $size: {
                          $filter: {
                            input: "$$subj.allclasses",
                            as: "cls",
                            cond: "$$cls.attended",
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        // Stage 5: Debugging - Log final state of subjects
        {
          $set: {
            debug_final_subject: "$subject",
          },
        },
        // Stage 6: Remove debugging logs
        {
          $unset: [
            "debug_initial_subject",
            "debug_after_exchange",
            "debug_final_subject",
          ],
        },
      ]
    );
    
    

    return NextResponse.json({ message: 'Periods exchanged successfully' });
  } catch (error) {
    // ...existing error handling...
    console.error('Period exchange error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

