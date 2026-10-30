import next from "next";
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "../../../lib/getUser";

export async function GET( request: NextRequest, context: { params: Promise<{ songId: string }> },) {
    const  { songId} = await context.params;

    if(!songId || songId.length===0){
        return NextResponse.json({
            sucess:"false",
            error:"Song Id not found"
        },{status : 401})
    }

     const session = await getUser(request);
      const email = session?.user?.email;
      if (!session || !email) {
        return NextResponse.json({ success: false, error: "Unauthorized!" }, { status: 400 });
      }
}