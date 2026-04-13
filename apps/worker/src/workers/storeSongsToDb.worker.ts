import { Worker } from "bullmq";
import { connection } from '@repo/queue'
import { db, singer, song } from "@repo/db";
import { eq } from "drizzle-orm";


export const storeSongsinDb = new Worker(
    "storeSongsToDb",
    async (job) => {
        console.log("store songs to db worker working")
        try {
            const { songs } = job.data
            if (!songs || songs.length === 0) {
                console.log("no song found>")
                const result = {
                    success: false,
                    error: "Song not found"
                }
                return result;
            }
            const songsToInsert = await Promise.all(
                songs.map(async (s: any) => {
                    const existing = await db
                        .select()
                        .from(song)
                        .where(eq(song.songId, s.id))

                    if (existing.length > 0) {
                        return null
                    }
                    return s
                })
            )

            const filteredSongs = songsToInsert.filter(Boolean)
            if (filteredSongs.length === 0) {
                console.log("No song to insert , song alredy present in DB")
            }

            const insertedSong = await Promise.all(
                filteredSongs.map(async (music) => {
                    const insertSong = await db.insert(song).values({
                        songId: music.id,
                        singerId: music.artists.primary[0].id,
                        name: music.name,
                        type: music.type,
                        duration: music.duration,
                        year: music.year,
                        playCount: music.playCount,
                        releaseDate: music.releaseDate,
                        language: music.language,
                        hasLyrics: music.hasLyrics,
                        label: music.label,
                        url: music.url,
                        isExplicit: music.explicitContent
                    }).returning()

                    return insertSong
                })
            )
            console.log("Inserted songs in DB", insertedSong.length)

            const existingSinger = await Promise.all(
                songs.map(async (s: any) => {
                    const existing = await db
                        .select()
                        .from(singer)
                        .where(eq(singer.singerId, s.artists.primary[0].id))
                    if (existing.length > 0) {
                        return null
                    }
                    return s
                })
            )
            const filteredSinger = existingSinger.filter(Boolean);
            if (filteredSinger.length === 0) {
                console.log("No singer to insert , singer alredy present in DB")
            }
            const insertedSinger = await Promise.all(
                filteredSinger.map(async (sing) => {
                    const insertSong = await db.insert(singer).values({
                        singerId: sing.artists.primary[0].id,
                        name: sing.artists.primary[0].name,
                        imageConfig: sing.artists?.primary?.[0]?.image?.map((img: any) => ({
                            quality: img.quality,
                            url: img.url
                        })) || [],
                        url: sing.url
                    }).returning()

                    return insertSong
                })
            )
            console.log("Inserted Singer in DB", insertedSinger.length)
        } catch (error: any) {
            console.log("internal server error ")
            console.log("error ", error?.message)
        }
    }, {
    connection
}
)