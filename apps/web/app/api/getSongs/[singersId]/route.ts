import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { db, downloadUrl, song } from "@repo/db";
import { eq } from "drizzle-orm";
import { authOptions } from "../../../lib/config/authOptions";
import { redis } from "../../../lib/config/redis";

export async function GET( request: Request,{ params }: { params: { singersId: string } }) {
    const {singersId}  = await params
    console.log("redis url", process.env.UPSTASH_REDIS_REST_URL || "")
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({
            success: false,
            error: "Unauthenticated"
        }, { status: 400 })
    }
    if (singersId.length === 0) {
        return NextResponse.json({
            success: false,
            error: "Singers Id not found"
        }, { status: 501 })
    }
    let songs: any;
    songs = await redis.get(`singerId:${singersId}`)
    if (songs) {
        console.log("redis hit")
        console.log("songs from redis", songs)
    }
    if (!songs || songs.length === 0) {
        songs = await db.select().from(song).where(eq(song.singerId, singersId))
        if (songs.length === 0) {
            return NextResponse.json({
                success: true,
                msg: "No song found"
            }, { status: 502 })
        }
        console.log("redis miss")
        console.log("songs from db", songs)
    }

    const downloadUrlOfAllSongs = await Promise.all(
        songs.map(async (song: any) => {
            const downloadUrls = await db.select().from(downloadUrl).where(eq(downloadUrl.songId, song.songId))
            return downloadUrls[0]
        })
    )

    await redis.set(`singerId:${singersId}`, songs, { ex: 600 })
    console.log("downloadUrlOfAllSongs ", downloadUrlOfAllSongs)
    return NextResponse.json({
        success: true,
        songs,
        downloadUrlOfAllSongs
    })
}