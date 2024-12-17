import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ClassInfo } from '@/models/ClassInfo'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { authOptions } from '../auth/[...nextauth]/route'
import { ClassEntry, SubjectInfo } from '@/types'

export async function POST(req: Request) {
    try {
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { subjectName, date } = await req.json()
        if (!subjectName || !date) {
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
            if (subject) {
                const classToUpdate = subject.allclasses.find(
                    (c: ClassEntry) => new Date(c.date).toISOString().split('T')[0] === 
                         today.toISOString().split('T')[0]
                )
                // console.log('Found class:', classToUpdate)
            }
        }

        // Simplified update query
        const result = await ClassInfo.findOneAndUpdate(
            {
                userId: user._id,
                "subject.name": subjectName
            },
            {
                $set: {
                    "subject.$[subj].allclasses.$[cls].happened": false,
                    "subject.$[subj].allclasses.$[cls].attended": false
                }
            },
            {
                arrayFilters: [
                    { "subj.name": subjectName },
                    { "cls.date": {
                        $gte: new Date(today.setHours(0,0,0,0)),
                        $lt: new Date(today.setHours(23,59,59,999))
                    }}
                ],
                new: true
            }
        )

        // console.log('Raw update result:', JSON.stringify(result, null, 2))

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

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Disable class route error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
