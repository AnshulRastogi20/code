/**
 * API route for fetching schedule information
 * GET: Retrieves class schedule for a specific date or current date
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ClassInfo } from '@/models/ClassInfo'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(req: Request) {
    try {
        // Initialize connection and verify authentication
        await connectDB()
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Parse date from query parameters or use current date
        const url = new URL(req.url)
        const date = url.searchParams.get('date') || new Date().toISOString()
        const queryDate = new Date(date)
        queryDate.setHours(0, 0, 0, 0)

        // Get user
        const user = await User.findOne({ email: session.user.email })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Find class information for the specified date
        const classInfo = await ClassInfo.findOne({ 
            userId: user._id,
            'subject.allclasses.date': {
                $gte: new Date(queryDate.setHours(0,0,0,0)),
                $lt: new Date(queryDate.setHours(23,59,59,999))
            }
        })

        // Return formatted schedule data
        return NextResponse.json({ 
            success: true,
            data: classInfo ? classInfo.subject : []
        })

    } catch (error: any) {
        // ...existing error handling...
        console.error('Schedule fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
