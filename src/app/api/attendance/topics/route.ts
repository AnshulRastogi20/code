import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ClassInfo } from "@/models/ClassInfo";
import { User } from "@/models/User";

export async function POST(req: Request) {
    try {
        // Initialize database and authenticate user
        await connectDB();
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { subjectName, topics, date } = await req.json();
        if (!subjectName || !date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get user
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(queryDate);
        nextDay.setDate(queryDate.getDate() + 1);

        // Find class info
        const classInfo = await ClassInfo.findOne({ 
            userId: user._id,
            "subject.name": subjectName
        });

        if (!classInfo) {
            return NextResponse.json({ error: "Class info not found" }, { status: 404 });
        }

        const subject = classInfo.subject.find((s: any) => s.name === subjectName);
        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        const todayClass = subject.allclasses.find((c: any) => {
            const classDate = new Date(c.date);
            return classDate >= queryDate && classDate < nextDay;
        });

        if (!todayClass) {
            return NextResponse.json({ error: "No class found for today" }, { status: 404 });
        }

        if (!todayClass.attended) {
            return NextResponse.json({ error: "Cannot add topics for unattended class" }, { status: 400 });
        }

        todayClass.topicsCovered = topics;
        await classInfo.save();

        return NextResponse.json({ 
            success: true,
            message: "Topics updated successfully",
            topics
        });

    } catch (error: any) {
        console.error("Topics route error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
