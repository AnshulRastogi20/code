/**
 * API route for retrieving attendance statistics
 * GET: Fetches and calculates attendance percentages for all subjects
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ClassInfo } from "@/models/ClassInfo";
import { connectDB } from "@/lib/db";

export async function GET() {
    try {
        // Verify authentication and connect to database
        // Verify user authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Connect to database
        await connectDB();

        // Fetch and calculate attendance statistics
        // Fetch attendance record for the authenticated user
        const attendanceRecord = await ClassInfo.findOne({ userId: session.user._id });

        if (!attendanceRecord) {
            return NextResponse.json({ error: "No attendance record found" }, { status: 404 });
        }

        // Calculate attendance statistics for each subject
        const subjectsAttendance = attendanceRecord.subject.map((subject: any) => ({
            name: subject.name,
            total: subject.allHappened || 0,     // Total classes held
            attended: subject.allAttended || 0,   // Classes attended
            percentage: subject.allHappened ? (subject.allAttended / subject.allHappened) * 100 : 0  // Attendance percentage
        }));

        return NextResponse.json(subjectsAttendance);
    } catch (error) {
        // ...existing error handling...
        console.error("Error fetching attendance:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}
