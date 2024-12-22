// Import necessary dependencies
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Timetable } from '@/models/Timetable';
import { Preset } from '@/models/Preset';
import { authOptions } from '../../../auth/[...nextauth]/route';

/**
 * GET endpoint to fetch the currently active timetable for the authenticated user
 * Returns the preset details associated with the user's current timetable
 */
export async function GET() {
    try {
        // Initialize database connection
        await connectDB();
        // Get the current user's session
        const session = await getServerSession(authOptions);
        
        // Check if user is authenticated
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the user in the database
        const dbUser = await User.findOne({ email: session.user.email });
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Find the user's timetable
        const timetable = await Timetable.findOne({ userId: dbUser._id });
        if (!timetable) {
            return NextResponse.json(null);
        }

        // Find the preset associated with the timetable
        const preset = await Preset.findById(timetable.presetId);
        if (!preset) {
            return NextResponse.json(null);
        }

        // Return the preset details in a simplified format
        return NextResponse.json({
            _id: preset._id,
            name: preset.name,
            schedule: preset.schedule,
            createdBy: preset.createdBy
        });

    } catch (error) {
        console.error('Error in GET /api/user/timetable/current:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
