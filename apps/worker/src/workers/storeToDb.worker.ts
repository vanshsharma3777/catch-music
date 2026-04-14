import { db, downloadUrl, imageUrl, singer, song } from '@repo/db'
import axios from 'axios'
import { Worker } from 'bullmq'
import { connection } from '@repo/queue'
import { eq, inArray } from 'drizzle-orm'

export const storeInDb = new Worker(
    "storeToDb",
    async (job) => {
        console.log("worker working")
        try {
            const { responseId } = job.data;
            if (!responseId) {
                const result = {
                    success: false,
                    error: "Data not found"
                }
                return result;
            }
            
            const resSongs = await axios.get(`${process.env.JIO_SAVAAN}/api/artists?id=${responseId}`)
            const artistsData = resSongs.data.data

            const existingSinger = await db
                .select()
                .from(singer)
                .where(eq(singer.singerId, artistsData.id))
                .limit(1)
            let singerData;

            if (existingSinger.length === 0) {
                singerData = await db
                    .insert(singer)
                    .values({
                        singerId: artistsData.id,
                        name: artistsData.name,
                        imageConfig: [
                            {
                                quality: artistsData.image[0].quality,
                                url: artistsData.image[0].url,
                            },
                            {
                                quality: artistsData.image[1].quality,
                                url: artistsData.image[1].url,
                            },
                            {
                                quality: artistsData.image[2].quality,
                                url: artistsData.image[2].url,
                            }
                        ],
                        url: artistsData.url
                    })
                    .returning()
            }
            const songs = artistsData.topSongs.slice(0, 10)

            const songIds = songs.map((s: any) => s.id)
            console.log("songsids" , songIds)
            const existingSongs = await db
                .select()
                .from(song)
                .where(inArray(song.songId, songIds))

            const existingSongIds = new Set(
                existingSongs.map((s: any) => s.songId)
            )

            const songsToInsert = songs.filter(
                (s: any) => !existingSongIds.has(s.id)
            )
            console.log("Songs to insert:", songsToInsert.length)

            if (songsToInsert.length === 0) {
                console.log("All songs already exist")
                return
            }

            const insertedSongs = await db.insert(song).values(
                songsToInsert.map((music: any) => ({
                    songId: music.id,
                    singerId: artistsData.id,
                    name: music.name,
                    type: music.type,
                    duration: music.duration,
                    year: music.year,
                    playCount: music.playCount,
                    releaseDate: music.releaseDate,
                    language: music.language,
                    lyrics: music.lyrics,
                    hasLyrics: music.hasLyrics,
                    label: music.label,
                    url: music.url,
                    isExplicit: music.isExplicit
                }))
            ).returning()

            const insertedDownloadUrls = await db
                .insert(downloadUrl)
                .values(
                    songsToInsert.map((music: any) => ({
                        songId: music.id,
                        downloadConfig: music.downloadUrl.map((url: any) => ({
                            quality: url.quality,
                            url: url.url
                        }))
                    }))
                )
                .returning()

            const insertedImages = await db
                .insert(imageUrl)
                .values(
                    songsToInsert.map((music: any) => ({
                        songId: music.id,
                        imageConfig: music.image.map((img: any) => ({
                            quality: img.quality,
                            url: img.url
                        }))
                    }))
                )

            console.log("Inserted Songs:", insertedSongs.length)
            console.log("Inserted Download URLs:", insertedDownloadUrls.length)
            console.log("Inserted Images:", insertedImages.length)

        } catch (error: any) {
            console.log("internal server error in storeToDb worker")
            console.log("err", error.message)
            const result = {
                success: false,
                error: "Internal server error"
            }
            return result;
        }
    }, {
    connection
}
)