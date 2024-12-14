import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { ClassInfo } from "@/models/ClassInfo";
import { connectDB } from "@/lib/db";

export async function POST(req: Request) {
    try {
        // Get the authenticated user session
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(session)
        // Connect to database
        await connectDB();

        // Parse request body
        const { periodIndex, attended, date } = await req.json();

        // Find the user's attendance record

        console.log('user id -- ' , session.user._id)

        let attendanceRecord = await ClassInfo.findOne({ userId: session.user._id });

        // If no record exists, return error
        if (!attendanceRecord) {
            return NextResponse.json({ error: "No attendance record found" }, { status: 404 });
        }
        console.log("record - ",attendanceRecord)
        console.log("\n\n\n\n\n")
        // Find the subject at the given period index
        const subject = attendanceRecord.subject[periodIndex];
        if (!subject) {
            return NextResponse.json({ error: "Invalid period index" }, { status: 400 });
        }
        console.log("subject -- ", subject)

        // Find the class for the given date
        const classIndex = subject.allclasses.findIndex(
            (cls: any) => new Date(cls.date).toDateString() === new Date(date).toDateString()
        );
    
        if (classIndex === -1) {
            return NextResponse.json({ error: "Class not found for the given date" }, { status: 411 });
        }

        // Check if the class is disabled
        if (subject.allclasses[classIndex].isHoliday) {
            return NextResponse.json({ error: "Cannot mark attendance for disabled class" }, { status: 400 });
        }

        // Update attendance status
        const previousAttendance = subject.allclasses[classIndex].attended;
        subject.allclasses[classIndex].attended = attended;
        subject.allclasses[classIndex].happened = true;

        // Update total attendance counts
        if (!previousAttendance && attended) {
            subject.allAttended = (subject.allAttended || 0) + 1;
        } else if (previousAttendance && !attended) {
            subject.allAttended = (subject.allAttended || 0) - 1;
        }

        // Update total classes happened if this is first time marking
        if (!subject.allclasses[classIndex].happened) {
            subject.allHappened = (subject.allHappened || 0) + 1;
        }

        // Save the changes
        await attendanceRecord.save();

        return NextResponse.json({
            message: "Attendance updated successfully",
            allAttended: subject.allAttended,
            allHappened: subject.allHappened
        });

    } catch (error) {
        console.error("Attendance update error:", error);
        return NextResponse.json(
            { error: "Failed to update attendance" },
            { status: 500 }
        );
    }
}