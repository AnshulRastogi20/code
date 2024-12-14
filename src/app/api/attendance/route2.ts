// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { connectDB } from '@/lib/db';
// import { ClassInfo } from '@/models/Class';
// import { authOptions } from '../auth/[...nextauth]/route';

// export async function GET() {
//   try {
//     const session = await getServerSession();
//     if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

//     await connectDB();
//     const attendance = await Attendance.find({ userId: session.user.email });
//     return NextResponse.json(attendance);
//   } catch (error) {
//     return NextResponse.json({ error: 'Server Error' }, { status: 500 });
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     await connectDB();
//     const { periodIndex, attended, date } = await req.json();

//     const attendance = await Attendance.findOneAndUpdate(
//       {
//         userEmail: session.user.email,
//         date: new Date(date),
//         periodIndex
//       },
//       {
//         $set: { attended }
//       },
//       { upsert: true, new: true }
//     );

//     return NextResponse.json(attendance);
//   } catch (error) {
//     console.error('Attendance error:', error);
//     return NextResponse.json({ error: 'Server error' }, { status: 500 });
//   }
// }