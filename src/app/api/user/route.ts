import { NextResponse } from 'next/server';
import { User } from '@/models/User';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const user = await User.findOne({ email });
    return NextResponse.json(user || {});
  } catch (error) {
    console.error('Start route error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch user' }, { status: 500 })
  }
}
