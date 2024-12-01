// app/api/presets/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/db';
import { Preset } from '@/models/Preset';

export async function GET() {
  try {
    await connectDB();
    const presets = await Preset.find();
    return NextResponse.json(presets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    await connectDB();
    
    const preset = await Preset.create({
      ...data,
      createdBy: session.user.email
    });
    
    return NextResponse.json(preset);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 });
  }
}