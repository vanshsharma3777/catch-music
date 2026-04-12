import { db, downloadUrl, imageUrl, singer, song } from '@repo/db'
import axios from 'axios'
import { Worker } from 'bullmq'
import { connection, downloadSongs } from '@repo/queue'
import { eq } from 'drizzle-orm'

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
            console.log(`${process.env.JIO_SAVAAN}/api/artists?id=${responseId}`)
            const resSongs = await axios.get(`${process.env.JIO_SAVAAN}/api/artists?id=${responseId}`)
            console.log("ress0ong", resSongs.data)
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
            console.log(artistsData.id)
            let downloadSongsUrls: any[] = [];
            await Promise.all(
                artistsData.topSongs.slice(0, 10).map(async (music: any) => {
                    const existingSong = await db
                        .select()
                        .from(song)
                        .where(eq(song.songId, music.id))
                        .limit(1)
                    if (existingSong.length === 0) {
                        await db.insert(song).values({
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
                        }).returning()

                        const downloadSongsUrl = await db.insert(downloadUrl).values({
                            songId: music.id,
                            downloadConfig: music.downloadUrl.map((url: any) => ({
                                quality: url.quality,
                                url: url.url
                            }))
                        }).returning()
                        downloadSongsUrls.push(downloadSongsUrl);

                        await db.insert(imageUrl).values({
                            songId: music.id,
                            imageConfig: music.image.map((url: any) => ({
                                quality: url.quality,
                                url: url.url
                            }))
                        })
                    }
                    })
                    
            )
            if (!singerData) {
                console.log("No singer found")
                const result = {
                    success: false,
                    error: "No singer found "
                }
                return result;
            }
            // start another worker to download these songs
            console.log("starting download songs worker")
            await downloadSongs.add('downloadSongs', { downloadSongsUrls: JSON.parse(JSON.stringify(downloadSongsUrls)) });

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