import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { authOptions } from "../../../lib/config/authOptions";

export async function POST(request: NextRequest, context: { params: Promise<{ type: string }> }) {
    const { type } = await context.params
    if (!type || type.trim().length === 0) {
        return NextResponse.json({
            success: false,
            error: "Params not found!"
        }, { status: 401 })
    }
    console.log("params :", type)

    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({
            success: false,
            error: "Unauthorized!"
        }, { status: 400 })
    }

    try {
        const { query, limit, start } = await request.json();
        if (!query || query.trim().length === 0 || isNaN(limit) || isNaN(start)) {
            return NextResponse.json({
                success: false,
                error: "Query not found"
            }, { status: 401 })
        }

        const res = await axios.get(`${process.env.JIO_SAVAAN}/api/search/${type}?query=${encodeURIComponent(query.trim())}&limit=${limit}&start${start}`)
        const data = res.data;
        console.log((data))
        console.log("data length :", data.data.results.length)
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
        console.log("Error in /api/search :", error);
        return NextResponse.json({
            success: false,
            error: "internal server error"
        })
    }
}