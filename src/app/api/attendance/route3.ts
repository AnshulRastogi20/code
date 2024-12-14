// import { NextRequest, NextResponse } from "next/server";
// import { ClassInfo } from "@/models/Class";
// import { connectDB } from '@/lib/db';

// connectDB();

// export async function PUT(request: NextRequest) {
//     try {
//         const body = await request.json();
//         const { userId, subjectIndex, classIndex, action } = body;

//         if (!userId || subjectIndex === undefined || classIndex === undefined || !action) {
//             return NextResponse.json(
//                 { error: "Missing required fields" },
//                 { status: 400 }
//             );
//         }

//         const attendance = await Class.findOne({ userId });
//         if (!attendance) {
//             return NextResponse.json(
//                 { error: "Attendance record not found" },
//                 { status: 404 }
//             );
//         }

//         const subject = attendance.subject[subjectIndex];
//         const targetClass = subject.allclasses[classIndex];

//         switch (action) {
//             case 'enableClass':
//                 targetClass.happened = true;
//                 break;
//             case 'disableClass':
//                 targetClass.happened = false;
//                 targetClass.attended = false;
//                 break;
//             case 'markAttended':
//                 if (!targetClass.happened) {
//                     return NextResponse.json(
//                         { error: "Cannot mark attendance for disabled class" },
//                         { status: 400 }
//                     );
//                 }
//                 targetClass.attended = true;
//                 break;
//             default:
//                 return NextResponse.json(
//                     { error: "Invalid action" },
//                     { status: 400 }
//                 );
//         }

//         // Update allHappened and allAttended counts
//         const allClasses = subject.allclasses;
//         interface Class {
//             happened: boolean;
//             attended: boolean;
//         }

//         interface Subject {
//             allclasses: Class[];
//             allHappened: number;
//             allAttended: number;
//         }

//                 subject.allHappened = allClasses.filter((c: Class) => c.happened).length;
//         subject.allAttended = allClasses.filter((c: Class) => c.attended).length;

//         await attendance.save();

//         return NextResponse.json({
//             message: "Updated successfully",
//             allHappened: subject.allHappened,
//             allAttended: subject.allAttended
//         });

//     } catch (error: any) {
//         return NextResponse.json(
//             { error: error.message },
//             { status: 500 }
//         );
//     }
// }