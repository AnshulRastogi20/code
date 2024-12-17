import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { ClassInfo } from "@/models/ClassInfo";
import { connectDB } from "@/lib/db";
import { ClassEntry, SubjectInfo } from "@/types";

export async function POST(req: Request) {
    try {
        // Verify user authentication using NextAuth session
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.log(session)
        // Connect to MongoDB database
        await connectDB();

        // Extract attendance marking parameters from request
        const { subjectName, attended, date } = await req.json();

        // Find the user's attendance record

        console.log('user id -- ' , session.user._id)

        let attendanceRecord = await ClassInfo.findOne({ userId: session.user._id });
        if (!attendanceRecord) {
            return NextResponse.json({ error: "No attendance record found" }, { status: 404 });
        }
        console.log("record - ",attendanceRecord)
        console.log("\n\n\n\n\n")
        // Find the specific subject in user's records
        const subject = attendanceRecord.subject.find((sub:SubjectInfo )=> sub.name === subjectName);
        
        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 400 });
        }
        console.log("subject -- ", subject)

        // Find the class for the specified date
        

        const classIndex: number = subject.allclasses.findIndex(
            (cls: ClassEntry) => new Date(cls.date).toDateString() === new Date(date).toDateString()
        );
    
        if (classIndex === -1) {
            return NextResponse.json({ error: "Class not found for the given date" }, { status: 411 });
        }

        // Prevent attendance marking for holidays
        if (subject.allclasses[classIndex].isHoliday) {
            return NextResponse.json({ error: "Cannot mark attendance for disabled class" }, { status: 400 });
        }

        // Store previous attendance state to track changes
        const previousAttendance = subject.allclasses[classIndex].attended;
        
        // Update attendance status for the specific class
        subject.allclasses[classIndex].attended = attended;
        subject.allclasses[classIndex].happened = true;

        // Update attendance statistics
        if (!previousAttendance && attended) {
            // When marking present for previously absent class
            subject.allAttended = (subject.allAttended || 0) + 1;
        } else if (previousAttendance && !attended) {
            // When marking absent for previously present class
            subject.allAttended = (subject.allAttended || 0) - 1;
        }

        // Increment total classes counter if this is first time marking
        if (!subject.allclasses[classIndex].happened) {
            subject.allHappened = (subject.allHappened || 0) + 1;
        }

        // Save updated attendance record
        await attendanceRecord.save();

        // Return updated statistics
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