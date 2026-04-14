import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { authOptions } from "../../../lib/config/authOptions";
import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";
import { storeToDb } from "@repo/queue";
import { storeArtists } from "../../../lib/storeArtists";
import { storeSongs } from "../../../lib/storeSongs";

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

        const { query, limit } = await request.json();
        if (!query || query.trim().length === 0 || isNaN(limit)) {
            return NextResponse.json({
                success: false,
                error: "Query not found"
            }, { status: 401 })
        }
        console.log("came in /search/type")
        const res = await axios.get(`${process.env.JIO_SAVAAN}/api/search/${type}?query=${encodeURIComponent(query.trim())}&limit=${limit}`)
        const data = res.data;
        console.log((data))
        console.log("data length :", data.data.results.length)
        console.log(typeof (data))

        if (type === "artists") {
            storeArtists(data.data.results[0].id)
            return NextResponse.json({
                success: true,
                data: data.data.results[0],
            })
        } else if (type === "songs") {
            const finalSongs = data.data.results
            console.log("fial songs", finalSongs)
            storeSongs(finalSongs)
            return NextResponse.json({
                success: true,
                data: data.data.results,
            })
        }
        return NextResponse.json({
            success: true,
            data: data.data.results[0],
        })
    } catch (error: any) {
        console.log("Error in /api/search :", error);
        return NextResponse.json({
            success: false,
            error: "internal server error"
        })
    }
}