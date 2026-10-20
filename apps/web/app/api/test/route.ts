import { NextResponse } from "next/server";

export default function GET(){
    return NextResponse.json({
        success:true,

    } , {status:200})
}