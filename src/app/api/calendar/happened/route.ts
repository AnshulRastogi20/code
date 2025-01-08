import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { User } from '@/models/User'
import { ClassInfo } from '@/models/ClassInfo'
import { connectDB } from '@/lib/db'
import { authOptions } from '../../auth/[...nextauth]/options'
import type { SubjectInfo, allClasses } from '@/types'

export async function PATCH(req: Request) {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { subject, date, startTime, happened } = await req.json()
        const classDate = new Date(date)
        
        const user = await User.findOne({ email: session.user.email })
        const classInfo = await ClassInfo.findOne({ userId: user._id })
        
        if (!classInfo) {
            return NextResponse.json({ error: 'Class info not found' }, { status: 404 })
        }

        // If marking as not happened, ensure attended is also set to false
        const updateFields = {
            'subject.$[subj].allclasses.$[cls].happened': happened,
            ...(happened === false && { 'subject.$[subj].allclasses.$[cls].attended': false })
        }

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
                $set: updateFields
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
            return NextResponse.json({ error: 'Failed to update class status' }, { status: 400 })
        }

        // Update happened counts
        const updatedSubject = result.subject.find((s:SubjectInfo) => s.name === subject)
        if (updatedSubject) {
            updatedSubject.allHappened = updatedSubject.allclasses.filter((c:allClasses) => c.happened).length
            await result.save()
        }

        return NextResponse.json({ 
            success: true, 
            data: { 
                happened: happened,
                attended: happened ? undefined : false
            }
        })

    } catch (error) {
        console.error('Calendar Happened Status API Error:', error)
        return NextResponse.json({ error: 'Failed to update class status' }, { status: 500 })
    }
}
