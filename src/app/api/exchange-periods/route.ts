import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { Timetable } from '@/models/Timetable';
import { ClassInfo } from '@/models/ClassInfo';
import { User } from '@/models/User';
import { authOptions } from '../auth/[...nextauth]/route';
import { ClassInfoInterface, DaySchedule, Period, SubjectInfo } from '@/types';

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

    // Handle exchange in timetable
    if (endDate) {
      // Temporary exchange
      firstDaySchedule.periods[firstPeriodIndex] = {
        ...firstDaySchedule.periods[firstPeriodIndex],
        subject: secondOriginalSubject,
        temporaryExchange: {
          originalSubject: firstOriginalSubject,
          exchangeEndDate: new Date(endDate)
        }
      };

      secondDaySchedule.periods[secondPeriodIndex] = {
        ...secondDaySchedule.periods[secondPeriodIndex],
        subject: firstOriginalSubject,
        temporaryExchange: {
          originalSubject: secondOriginalSubject,
          exchangeEndDate: new Date(endDate)
        }
      };
    } else {
      // Permanent exchange
      const tempSubject = firstDaySchedule.periods[firstPeriodIndex].subject;
      firstDaySchedule.periods[firstPeriodIndex].subject = secondDaySchedule.periods[secondPeriodIndex].subject;
      secondDaySchedule.periods[secondPeriodIndex].subject = tempSubject;
    }

    await timetable.save();

    // Step 2 & 3: Update ClassInfo using aggregation pipeline
    const currentDate = new Date();
    const todayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    // First update: Remove future occurrences and update counts
    await ClassInfo.updateOne(
      { userId: dbUser._id },
      [
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
                            $filter: {
                              input: "$$subj.allclasses",
                              as: "cls",
                              cond: {
                                $or: [
                                  { $lt: ["$$cls.date", currentDate] },
                                  {
                                    $and: [
                                      {
                                        $ne: [
                                          {
                                            $dayOfWeek: {
                                              $toDate: "$$cls.date"
                                            }
                                          },
                                          {
                                            $cond: [
                                              { $eq: ["$$subj.name", firstOriginalSubject] },
                                              { $indexOfArray: [["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], firstPeriod.day] },
                                              { $indexOfArray: [["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], secondPeriod.day] }
                                            ]
                                          }
                                        ]
                                      },
                                      {
                                        $ne: ["$$cls.startTime",
                                          {
                                            $cond: [
                                              { $eq: ["$$subj.name", firstOriginalSubject] },
                                              firstPeriod.startTime,
                                              secondPeriod.startTime
                                            ]
                                          }
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            }
                          }
                        }
                      ]
                    },
                    "$$subj"
                  ]
                }
              }
            }
          }
        },
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
                            cond: "$$cls.happened"
                          }
                        }
                      },
                      allAttended: {
                        $size: {
                          $filter: {
                            input: "$$subj.allclasses",
                            as: "cls",
                            cond: "$$cls.attended"
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      ]
    );

    // Second update: Add today's classes if applicable
    if (todayName === firstPeriod.day || todayName === secondPeriod.day) {
      const newClasses = [];
      
      if (todayName === firstPeriod.day) {
        newClasses.push({
          targetSubject: endDate ? firstOriginalSubject : secondOriginalSubject,
          classData: {
            date: currentDate,
            startTime: firstPeriod.startTime,
            endTime: firstPeriod.endTime,
            isHoliday: false,
            happened: true,
            attended: false,
            topicsCovered: [],
            temporarySubject: endDate ? secondOriginalSubject : null,
            exchangeEndDate: endDate ? new Date(endDate) : null
          }
        });
      }

      if (todayName === secondPeriod.day) {
        newClasses.push({
          targetSubject: endDate ? secondOriginalSubject : firstOriginalSubject,
          classData: {
            date: currentDate,
            startTime: secondPeriod.startTime,
            endTime: secondPeriod.endTime,
            isHoliday: false,
            happened: true,
            attended: false,
            topicsCovered: [],
            temporarySubject: endDate ? firstOriginalSubject : null,
            exchangeEndDate: endDate ? new Date(endDate) : null
          }
        });
      }

      for (const newClass of newClasses) {
        await ClassInfo.updateOne(
          { 
            userId: dbUser._id,
            "subject.name": newClass.targetSubject
          },
          {
            $addToSet: {
              "subject.$.allclasses": newClass.classData
            },
            $inc: {
              "subject.$.allHappened": 1
            }
          }
        );
      }
    }

    return NextResponse.json({ message: 'Periods exchanged successfully' });
  } catch (error) {
    console.error('Period exchange error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
