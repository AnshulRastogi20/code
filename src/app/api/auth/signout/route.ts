import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth'
import { authOptions } from "../[...nextauth]/route";

export async function POST() {

    let session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        session = null;

        


    return NextResponse.json(
        { message: "Signout successful" },
        { status: 200 }
    );
}
