import { useSession } from "next-auth/react";
import { authOptions } from "../../lib/config/authOptions";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { db, singer, song, users, } from "@repo/db";
import { eq } from "drizzle-orm";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({
            success: false,
            error: "Unauthorized!"
        }, { status: 400 })
    }

    try {
        const email = session.user?.email;
        if (!email) {
            return NextResponse.json({
                success: false,
                error: "User email not found! Login again"
            }, { status: 400 })
        }

        const existingUser = await db.select().from(users).where(eq(users.email, email))
        if (existingUser.length === 0) {
            console.log("User not found")
            return NextResponse.json({
                success: false,
                error: "User email not found! Login again"
            }, { status: 400 })
        }

        const { query } = await request.json();
        if (!query || query.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: "Query not found"
            }, { status: 401 })
        }

        const res = await axios.get(`${process.env.JIO_SAVAAN}/api/search?query=${encodeURIComponent(query.trim())}`)
        const data = res.data;
        
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
            success: false,
            error: "internal server error"
        })
    }
}