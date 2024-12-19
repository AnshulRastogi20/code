import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ClassInfo } from "@/models/ClassInfo";
import { User } from "@/models/User";

export async function POST(req: Request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { subjectName, topics, date, startTime } = await req.json();
        if (!subjectName || !date || !startTime) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);

        // Update using findOneAndUpdate instead of save()
        const result = await ClassInfo.findOneAndUpdate(
            {
                userId: user._id,
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
                    "subject.$[subj].allclasses.$[cls].topicsCovered": topics ? topics.split(',').map((t:String) => t.trim()) : []
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
        );

        if (!result) {
            return NextResponse.json({ error: "Class not found" }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true,
            message: "Topics updated successfully",
            topics: topics ? topics.split(',').map((t:String) => t.trim()) : []
        });

    } catch (error: any) {
        console.error("Topics route error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
