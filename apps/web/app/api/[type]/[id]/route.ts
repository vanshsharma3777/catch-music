import { useSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { authOptions } from "../../../lib/config/authOptions";
import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest, context: { params: Promise<{ type: string, id: string }> }) {
    const { type, id } = await context.params
    if (!type || type.trim().length === 0 || !id || id.trim().length === 0) {
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
        console.log(`${process.env.JIO_SAVAAN}/api/${type}/${id}?songCount=3`)
        const res = await axios.get(`${process.env.JIO_SAVAAN}/api/${type}/${id}`)
        const data = res.data;
        console.log((data))
        console.log("data length :", data.data.length)
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