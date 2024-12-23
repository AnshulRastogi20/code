/**
 * API route for retrieving attendance statistics
 * GET: Fetches and calculates attendance percentages for all subjects
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ClassInfo } from "@/models/ClassInfo";
import { connectDB } from "@/lib/db";

export async function GET(req: Request) {
    try {
        // Verify authentication and connect to database
        // Verify user authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Connect to database
        await connectDB();

        // Parse URL to get query parameters
        const url = new URL(req.url);
        const fromDate = url.searchParams.get('fromDate');
        const tillDate = url.searchParams.get('tillDate');

        // Fetch and calculate attendance statistics
        // Fetch attendance record for the authenticated user
        const attendanceRecord = await ClassInfo.findOne({ userId: session.user._id });

        if (!attendanceRecord) {
            return NextResponse.json({ error: "No attendance record found" }, { status: 404 });
        }

        // Calculate attendance statistics for each subject
        const subjectsAttendance = attendanceRecord.subject.map((subject: any) => {
            // Filter classes based on date range if provided
            const filteredClasses = subject.allclasses.filter((cls: any) => {
                if (!fromDate || !tillDate) return true;
                const classDate = new Date(cls.date);
                const start = new Date(fromDate);
                const end = new Date(tillDate);
                return classDate >= start && classDate <= end;
            });

            const happened = filteredClasses.filter((cls: any) => cls.happened).length;
            const attended = filteredClasses.filter((cls: any) => cls.attended).length;

            return {
                name: subject.name,
                total: happened,
                attended: attended,
                percentage: happened ? (attended / happened) * 100 : 0
            };
        });

        return NextResponse.json(subjectsAttendance);
    } catch (error) {
        // ...existing error handling...
        console.error("Error fetching attendance:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}
