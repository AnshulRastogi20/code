// app/api/presets/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { Preset } from '@/models/Preset';
import { seedPresets } from '@/app/scripts/seed-presets';

export async function GET() {
  try {
    await connectDB();
    await seedPresets();
    console.log("Fetching presets...");
    const presets = await Preset.find();
    return NextResponse.json(presets);
  } catch (error) {
    console.error('Error fetching presets:', error);
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    console.log('Received preset data:', data);

    // Validate the required fields
    if (!data.name || !data.schedule) {
      return NextResponse.json({ 
        error: 'Missing required fields: name and schedule are required' 
      }, { status: 400 });
    }

    // Validate schedule structure
    if (!Array.isArray(data.schedule)) {
      return NextResponse.json({ 
        error: 'Schedule must be an array' 
      }, { status: 400 });
    }

    // Create the preset with validated data
    const preset = await Preset.create({
      name: data.name,
      schedule: data.schedule,
      isDefault: false,
      createdBy: session.user.email,
      description: data.description || `Timetable preset created by ${session.user.email}`
    });

    console.log('Created preset:', preset);
    return NextResponse.json(preset);

  } catch (error) {
    console.error('Error creating preset:', error);
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: 'Failed to create preset',
        details: error.message 
      }, { status: 500 });
    }
    return NextResponse.json({ 
      error: 'Failed to create preset' 
    }, { status: 500 });
  }
}