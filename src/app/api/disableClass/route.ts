import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ClassInfo } from '@/models/ClassInfo'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { authOptions } from '../auth/[...nextauth]/options'
import {ClassEntry, SubjectInfo } from '@/types'

export async function POST(req: Request) {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { subjectName, date, startTime, isDisabled } = await req.json()
        if (!subjectName || !date || !startTime || isDisabled === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get user
        const user = await User.findOne({ email: session.user.email })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 444 })
        }

        const today = new Date(date)
        today.setHours(0, 0, 0, 0)

        // Debug logs
        // console.log('Query parameters:', {
        //     userId: user._id,
        //     subjectName,
        //     date: today,
        //     dateString: today.toISOString()
        // })

        // First find the exact document and class we're trying to update
        const debugDoc = await ClassInfo.findOne({ userId: user._id })
        if (debugDoc) {
            const subject = debugDoc.subject.find((s:SubjectInfo) => s.name === subjectName)
            console.log('Found subject:', subject?.name)
        }

        // Simplified update query
        const result = await ClassInfo.findOneAndUpdate(
            {
                userId: user._id,
                "subject.name": subjectName,
            },
            {
                $set: {
                    "subject.$[subj].allclasses.$[cls].happened": !isDisabled, // Set to true when enabling
                    "subject.$[subj].allclasses.$[cls].attended": false,
                    "subject.$[subj].allclasses.$[cls].topicsCovered": isDisabled ? [] : undefined // Only clear topics when disabling
                }
            },
            {
                arrayFilters: [
                    { "subj.name": subjectName },
                    { 
                        "cls.date": {
                            $gte: new Date(today.setHours(0,0,0,0)),
                            $lt: new Date(today.setHours(23,59,59,999))
                        },
                        "cls.startTime": startTime
                    }
                ],
                new: true
            }
        )

        if (!result) {
            const debug = await ClassInfo.findOne({ userId: user._id })
            return NextResponse.json({ 
                error: 'Class not found',
                debug: {
                    userId: user._id,
                    subjectName,
                    date: today.toISOString(),
                    dateQuery: {
                        start: new Date(today.setHours(0,0,0,0)).toISOString(),
                        end: new Date(today.setHours(23,59,59,999)).toISOString()
                    },
                    existingSubjects: debug?.subject.map((s:SubjectInfo)=> ({
                        name: s.name,
                        classDates: s.allclasses.map(c => c.date)
                    }))
                }
            }, { status: 404 })
        }

        // Calculate new counts for the subject
        const subject = result.subject.find((s: SubjectInfo) => s.name === subjectName);
        const allHappened = subject?.allclasses.filter((cls: ClassEntry) => cls.happened).length || 0;
        const allAttended = subject?.allclasses.filter((cls: ClassEntry) => cls.attended).length || 0;

        // Update the counts
        await ClassInfo.updateOne(
            {
                userId: user._id,
                "subject.name": subjectName
            },
            {
                $set: {
                    "subject.$.allHappened": allHappened,
                    "subject.$.allAttended": allAttended
                }
            }
        );

        return NextResponse.json({ 
            success: true,
            allHappened,
            allAttended
        })

    } catch (error) {
        console.error('Disable class route error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 })
    }
}
