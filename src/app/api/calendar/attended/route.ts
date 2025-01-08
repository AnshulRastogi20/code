/**
 * PATCH endpoint to update attendance status
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { User } from '@/models/User'
import { ClassInfo } from '@/models/ClassInfo'
import { Timetable } from '@/models/Timetable'
import { connectDB } from '@/lib/db'
import { authOptions } from '../../auth/[...nextauth]/options'
import type { allClasses, SubjectInfo } from '@/types'


export async function PATCH(req: Request) {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { subject, date, startTime, attended } = await req.json()
        const classDate = new Date(date)
        
        const user = await User.findOne({ email: session.user.email })
        
        // First find the document to ensure it exists
        const classInfo = await ClassInfo.findOne({ userId: user._id })
        if (!classInfo) {
            return NextResponse.json({ error: 'Class info not found' }, { status: 404 })
        }

        // Update the specific class attendance
        const result = await ClassInfo.findOneAndUpdate(
            {
                userId: user._id,
                'subject.name': subject,
                'subject.allclasses': {
                    $elemMatch: {
                        date: classDate,
                        startTime: startTime
                    }
                }
            },
            {
                $set: {
                    'subject.$[subj].allclasses.$[cls].attended': attended,
                    'subject.$[subj].allclasses.$[cls].happened': true
                }
            },
            {
                arrayFilters: [
                    { 'subj.name': subject },
                    { 
                        'cls.date': classDate,
                        'cls.startTime': startTime
                    }
                ],
                new: true,
                runValidators: true
            }
        )

        if (!result) {
            return NextResponse.json({ error: 'Failed to update attendance' }, { status: 400 })
        }

        // Update attendance counts
        const updatedSubject = result.subject.find((s:SubjectInfo) => s.name === subject)
        if (updatedSubject) {
            updatedSubject.allAttended = updatedSubject.allclasses.filter((c:allClasses) => c.attended).length
            await result.save()
        }

        const updatedClass = result.subject
            .find((s:SubjectInfo) => s.name === subject)
            ?.allclasses.find((c:allClasses) => 
                c.date.toDateString() === classDate.toDateString() && 
                c.startTime === startTime
            )

        return NextResponse.json({ 
            success: true, 
            data: { attended: updatedClass?.attended }
        })

    } catch (error) {
        console.error('Calendar Attendance API Error:', error)
        return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
    }
}