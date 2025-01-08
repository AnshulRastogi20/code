/**
 * API route for exchanging periods in a timetable
 * POST: Handles the exchange of two periods, updating both timetable and class info
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { Timetable } from '@/models/Timetable';
import { ClassInfo } from '@/models/ClassInfo';
import { User } from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/options';
import { DaySchedule, Period } from '@/types';
export async function POST(req: Request) {



  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstPeriod, secondPeriod, endDate } = await req.json();

    if (!firstPeriod || !secondPeriod) {
      return NextResponse.json({ error: 'Both periods are required' }, { status: 400 });
    }

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Step 1: Update Timetable
    const timetable = await Timetable.findOne({ userId: dbUser._id });
    if (!timetable) {
      return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
    }

    const firstDaySchedule = timetable.schedule.find((day:DaySchedule) => day.day === firstPeriod.day);
    const secondDaySchedule = timetable.schedule.find((day:DaySchedule) => day.day === secondPeriod.day);
    if (!firstDaySchedule || !secondDaySchedule) {
      return NextResponse.json({ error: 'Invalid day selected' }, { status: 400 });
    }

    const firstPeriodIndex = firstDaySchedule.periods.findIndex((p:Period) => 
      p.startTime === firstPeriod.startTime && p.endTime === firstPeriod.endTime);
    const secondPeriodIndex = secondDaySchedule.periods.findIndex((p:Period) => 
      p.startTime === secondPeriod.startTime && p.endTime === secondPeriod.endTime);
    
    if (firstPeriodIndex === -1 || secondPeriodIndex === -1) {
      return NextResponse.json({ error: 'Period not found' }, { status: 400 });
    }

    // Get original subjects before exchange
    const firstOriginalSubject = firstDaySchedule.periods[firstPeriodIndex].subject;
    const secondOriginalSubject = secondDaySchedule.periods[secondPeriodIndex].subject;

    console.log("firstPeriod" , firstPeriod)
    console.log("secondPeriod" , secondPeriod)

    // Handle exchange in timetable
    if (endDate) {
      // Temporary exchange - preserve time values
      firstDaySchedule.periods[firstPeriodIndex] = {
        startTime: firstPeriod.startTime,
        endTime: firstPeriod.endTime,
        subject: secondOriginalSubject,
        temporaryExchange: {
          originalSubject: firstOriginalSubject,
          exchangeEndDate: new Date(endDate)
        }
      };

      secondDaySchedule.periods[secondPeriodIndex] = {
        startTime: secondPeriod.startTime,
        endTime: secondPeriod.endTime,
        subject: firstOriginalSubject,
        temporaryExchange: {
          originalSubject: secondOriginalSubject,
          exchangeEndDate: new Date(endDate)
        }
      };
    } else {
      // Permanent exchange - preserve time values
      const firstPeriodCopy = {
        startTime: firstPeriod.startTime,
        endTime: firstPeriod.endTime,
        subject: secondDaySchedule.periods[secondPeriodIndex].subject
      };

      const secondPeriodCopy = {
        startTime: secondPeriod.startTime,
        endTime: secondPeriod.endTime,
        subject: firstDaySchedule.periods[firstPeriodIndex].subject
      };

      firstDaySchedule.periods[firstPeriodIndex] = firstPeriodCopy;
      secondDaySchedule.periods[secondPeriodIndex] = secondPeriodCopy;
    }

    await timetable.save();

    // Update ClassInfo using aggregation pipeline
    const currentDate = new Date();
    // const todayStr = currentDate.toDateString();
    // const todayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    await ClassInfo.updateOne(
      { userId: dbUser._id },
      [
        // Map through subjects and handle exchanges
        {
          $set: {
            subject: {
              $map: {
                input: "$subject",
                as: "subj",
                in: {
                  $cond: [
                    { $in: ["$$subj.name", [firstOriginalSubject, secondOriginalSubject]] },
                    {
                      $mergeObjects: [
                        "$$subj",
                        {
                          allclasses: {
                            $concatArrays: [
                              // Keep unaffected classes
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
                                                { $eq: ["$$subj.name", firstOriginalSubject] },
                                                { $eq: ["$$cls.startTime", firstPeriod.startTime] },
                                              ],
                                            },
                                            {
                                              $and: [
                                                { $eq: ["$$subj.name", secondOriginalSubject] },
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
        // Update attendance counts
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
        
      ]
    );


    
    
    return NextResponse.json({ message: 'Periods exchanged successfully' });
    

  } catch (error) {
    // ...existing error handling...
    console.error('Period exchange error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 501 });
  }
}

