import { Worker } from "bullmq";
import { connection } from '@repo/queue'
import { db, downloadUrl, singer, song } from "@repo/db";
import { eq, inArray } from "drizzle-orm";


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



            const checkSongs = async () => {
                const songIds = songs.map((s: any) => s.id)

                const existingSongs = await db
                    .select()
                    .from(song)
                    .where(inArray(song.songId, songIds))

                const existingSongIds = new Set(
                    existingSongs.map((s: any) => s.songId)
                )
                return songs.map((s: any) => {
                    if (existingSongIds.has(s.id)) {
                        return null
                    }
                    return s
                })


            }
            const checkSingers = async () => {
                const singerIds = songs.map((s: any) => s.artists.primary[0].id)
                const existingSingers = await db
                    .select()
                    .from(singer)
                    .where(inArray(singer.singerId, singerIds))
                const existingSingerIds = new Set(
                    existingSingers.map((s: any) => s.singerId)
                ) 
                return songs.map((s: any) => {
                    if (existingSingerIds.has(
                        s.artists.primary[0].id
                    )) {
                        return null
                    }
                    return s
                })


            }
            const [songsToInsert, singersToInsert] = await Promise.all([
                checkSongs(),
                checkSingers()
            ])
            const filteredSongs = songsToInsert.filter(Boolean)
            if (filteredSongs.length === 0) {
                console.log("No song to insert , song alredy present in DB")
            }
            const filteredSinger = singersToInsert.filter(Boolean);
            if (filteredSinger.length === 0) {
                console.log("No singer to insert , singer alredy present in DB")
            }
            const [insertedSong, insertedSinger] = await Promise.all([
                Promise.all(filteredSongs.map(async (music: any) => {
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
                })),
                Promise.all(filteredSinger.map(async (sing: any) => {
                    const insertSinger = await db.insert(singer).values({
                        singerId: sing.artists.primary[0].id,
                        name: sing.artists.primary[0].name,
                        imageConfig: sing.artists?.primary?.[0]?.image?.map((img: any) => ({
                            quality: img.quality,
                            url: img.url
                        })) || [],
                        url: sing.url
                    }).returning()

                    return insertSinger
                }))

            ])

            const insertedSongDownloadUrl = await Promise.all(
                filteredSongs.map(async (music: any) => {
                    const insertSongUrl = await db.insert(downloadUrl).values({
                        songId: music.id,
                        downloadConfig: music.downloadUrl.map((url: any) => ({
                            quality: url.quality,
                            url: url.url
                        })) || [],
                    }).returning()

                    return insertSongUrl
                })
            )
            console.log("Inserted songs in DB", insertedSong.length)
            console.log("Inserted songs download url in DB", insertedSongDownloadUrl.length)
            console.log("Inserted Singer in DB", insertedSinger.length)
        } catch (error: any) {
            console.log("internal server error ")
            console.log("error ", error?.message)
        }
    }, {
    connection
}
)