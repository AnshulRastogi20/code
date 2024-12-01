// app/api/user/timetable/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Preset } from '@/models/Preset';
import { Timetable } from '@/models/Timetable';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const timetable = await Timetable.findOne({ userId: session.user.email });
    
    if (!timetable) {
      return NextResponse.json({ error: 'No timetable found' }, { status: 404 });
    }

    return NextResponse.json(timetable);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { presetId } = await req.json();
    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 });
    }

    await connectDB();
    
    // Get preset
    const preset = await Preset.findById(presetId);
    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    // Update or create timetable
    const timetable = await Timetable.findOneAndUpdate(
      { userId: session.user.email },
      { 
        userId: session.user.email,
        schedule: preset.schedule,
        presetId: preset._id
      },
      { new: true, upsert: true }
    );

    // Update user's timetable reference
    await User.findByIdAndUpdate(session.user.email, {
      timetableId: timetable._id
    });

    return NextResponse.json(timetable);
  } catch (error) {
    console.error('Timetable update error:', error);
    return NextResponse.json({ error: 'Failed to update timetable' }, { status: 500 });
  }
}