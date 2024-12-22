/**
 * API route for updating attendance records
 * POST: Updates attendance status for a specific class and recalculates statistics
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ClassInfo } from "@/models/ClassInfo";
import { connectDB } from "@/lib/db";
import { ClassEntry, ClassInfoInterface, Period, SubjectInfo } from "@/types";

export async function POST(req: Request) {
  try {
    // Verify authentication and validate input
    await connectDB()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subjectName, attended, date, startTime } = await req.json()
    if (!subjectName || attended === undefined || !date || !startTime) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Convert date to UTC and find existing attendance record
    const queryDate = new Date(date)
    const startOfDay = new Date(Date.UTC(
        queryDate.getFullYear(),
        queryDate.getMonth(),
        queryDate.getDate(),
        0, 0, 0, 0
    ))
    const endOfDay = new Date(Date.UTC(
        queryDate.getFullYear(),
        queryDate.getMonth(),
        queryDate.getDate(),
        23, 59, 59, 999
    ))

    // First check if the subject exists for the user
    const subjectExists = await ClassInfo.findOne({
        userId: session.user._id,
        "subject.name": subjectName
    });

    if (!subjectExists) {
        console.log("Subject not found:", subjectName);
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // First find if there was a previous attendance state
    const previousState = await ClassInfo.findOne({
        userId: session.user._id,
        "subject.name": subjectName,
        "subject.allclasses": {
            $elemMatch: {
                date: {
                    $gte: new Date(startOfDay),
                    $lt: new Date(endOfDay)
                },
                startTime: startTime
            }
        }
    });

    const previousAttendance = previousState?.subject
        .find((s:SubjectInfo) => s.name === subjectName)
        ?.allclasses.find((c:Period) => 
            c.startTime === startTime && 
            new Date(c.date).toDateString() === queryDate.toDateString()
        )?.attended || false;

    // Only update counter if attendance state actually changed
    const shouldUpdateCounter = previousAttendance !== attended;
    const counterChange = shouldUpdateCounter ? (attended ? 1 : -1) : 0;

    // Update attendance status and recalculate statistics
    const result = await ClassInfo.findOneAndUpdate(
        {
            userId: session.user._id,
            "subject.name": subjectName,
            "subject.allclasses": {
                $elemMatch: {
                    date: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    },
                    startTime: startTime
                }
            }
        },
        {
            $set: {
                "subject.$[subj].allclasses.$[cls].attended": attended,
                "subject.$[subj].allclasses.$[cls].happened": true
            }
        },
        {
            arrayFilters: [
                { "subj.name": subjectName },
                {
                    "cls.date": {
                        $gte: startOfDay,
                        $lte: endOfDay
                    },
                    "cls.startTime": startTime
                }
            ],
            new: true
        }
    );

    if (!result) {
        console.log("Class not found for:", {
            date: queryDate,
            startTime,
            subjectName
        });
        return NextResponse.json({
            error: "Class not found for the given date and time",
            debug: {
                date: queryDate,
                startTime,
                subjectName
            }
        }, { status: 404 });
    }

    // Calculate new allAttended count
    const subject = result.subject.find((subj: SubjectInfo) => subj.name === subjectName);
    const allAttended = subject?.allclasses.filter((cls:Period) => cls.attended).length || 0;

    // Update the allAttended count
    await ClassInfo.updateOne(
        {
            userId: session.user._id,
            "subject.name": subjectName
        },
        {
            $set: {
                "subject.$.allAttended": allAttended
            }
        }
    );

    // Return updated attendance statistics
    return NextResponse.json({
        message: "Attendance updated successfully",
        allAttended: allAttended,
        allHappened: subject?.allclasses.length || 0
    });

  } catch (error) {
    // ...existing error handling...
    console.error("Attendance update error:", error);
    return NextResponse.json(
        { error: "Failed to update attendance" },
        { status: 500 }
    );
  }
}

