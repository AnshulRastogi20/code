// app/api/user/timetable/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { Preset } from '@/models/Preset';
import { Timetable } from '@/models/Timetable';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('No session or user:', session);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 409 });
    }

    const userId = new mongoose.Types.ObjectId(dbUser._id);
    const timetable = await Timetable.findOne({ userId: userId});
    
    if (!timetable) {
      return NextResponse.json({ error: 'No timetable found' }, { status: 408 });
    }

    return NextResponse.json(timetable);
  } catch (error) {
    console.error('Error in GET /api/user/timetable:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('No session or user:', session);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 409 });
    }
    
    console.log(session?.user.email)
    const userId = new mongoose.Types.ObjectId(dbUser._id);
    const body = await req.json();
    console.log('Received request body:', body);
    
    const { presetId } = body;
    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(presetId)) {
      return NextResponse.json({ 
        error: 'Invalid preset ID format',
        receivedId: presetId 
      }, { status: 400 });
    }

    const preset = await Preset.findById(presetId);

    if (!preset) {
      const allPresets = await Preset.find({});
      console.log('All available presets:', allPresets);
      
      return NextResponse.json({ 
        error: 'Preset not found',
        requestedId: presetId,
        availablePresets: allPresets.map(p => ({ id: p._id, name: p.name }))
      }, { status: 407 });
    }

    const presetIdtobeInserted = new mongoose.Types.ObjectId(preset._id);

    const timetable = await Timetable.findOneAndUpdate(
      { userId: userId },
      { 
        userId: userId,
        presetId: presetIdtobeInserted,
        schedule: preset.schedule
      },
      { new: true, upsert: true }
    );

    const timetableId = new mongoose.Types.ObjectId(timetable._id);

    await User.findByIdAndUpdate(
      userId,
      { 
        timetableId: timetableId,
        selectedPreset: preset.name
      },
      { new: true }
    );

    return NextResponse.json(timetable);
  } catch (error) {
    console.error('Timetable update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update timetable',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

