import { useSession } from "next-auth/react";
import { authOptions } from "../../lib/config/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({
            success: false,
            error: "Unauthorized!"
        }, { status: 400 })
    }

    try {
        const { query } = await request.json();
        if (!query || query.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: "Query not found"
            }, { status: 401 })
        }

        const res = await axios.get(`${process.env.JIO_SAVAAN}/api/search?query=${encodeURIComponent(query.trim())}`)
        const data = res.data;
        console.log((data))
        console.log(typeof (data))

        if (!data) {
            return NextResponse.json({
                success: false,
                error: "Data not found"
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: data
        })
    } catch (error) {
        
        return NextResponse.json({
            success:false,
            error:"internal server error"
        })
    }
}