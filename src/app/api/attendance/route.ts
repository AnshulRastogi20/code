import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { ClassInfo } from "@/models/ClassInfo";
import { connectDB } from "@/lib/db";
import { ClassEntry, SubjectInfo } from "@/types";

export async function POST(req: Request) {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { subjectName, attended, date, startTime } = await req.json()
        if (!subjectName || attended === undefined || !date || !startTime) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const queryDate = new Date(date)
        queryDate.setHours(0, 0, 0, 0)

        // Update specific class by subject, date AND startTime
        const result = await ClassInfo.findOneAndUpdate(
            {
                userId: session.user._id,
                "subject.name": subjectName,
                "subject.allclasses": {
                    $elemMatch: {
                        date: {
                            $gte: new Date(queryDate.setHours(0,0,0,0)),
                            $lt: new Date(queryDate.setHours(23,59,59,999))
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
                            $gte: new Date(queryDate.setHours(0,0,0,0)),
                            $lt: new Date(queryDate.setHours(23,59,59,999))
                        },
                        "cls.startTime": startTime
                    }
                ],
                new: true
            }
        )

        if (!result) {
            return NextResponse.json({ error: "Class not found for the given date and time" }, { status: 404 });
        }

        // Return updated statistics
        return NextResponse.json({
            message: "Attendance updated successfully",
            allAttended: result.subject.find((subj: SubjectInfo) => subj.name === subjectName)?.allAttended,
            allHappened: result.subject.find((subj: SubjectInfo) => subj.name === subjectName)?.allHappened
        });

    } catch (error) {
        console.error("Attendance update error:", error);
        return NextResponse.json(
            { error: "Failed to update attendance" },
            { status: 500 }
        );
    }
}