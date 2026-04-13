import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { db, downloadUrl, song } from "@repo/db";
import { eq } from "drizzle-orm";
import { authOptions } from "../../../lib/config/authOptions";

export async function GET( request: Request, { params }: { params: { singersId: string } }) {
    const {singersId}= await params
    console.log("singerId" , singersId)
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

    
    const songs = await db.select().from(song).where(eq(song.singerId, singersId))
    if(songs.length===0){
        return NextResponse.json({
            success:true,
            msg:"No song found"
        },{status:502})
    }

    const downloadUrlOfAllSongs = await Promise.all(
        songs.map(async (song)=>{
        const downloadUrls= await db.select().from(downloadUrl).where(eq(downloadUrl.songId , song.songId))
        return downloadUrls[0]
    })
    )
    console.log("downloadUrlOfAllSongs " , downloadUrlOfAllSongs )
    return NextResponse.json({
        success:true,
        songsLength: songs.length,
        downloadUrlOfAllSongsLength:downloadUrlOfAllSongs.length,
        songs,
        downloadUrlOfAllSongs
    })
}