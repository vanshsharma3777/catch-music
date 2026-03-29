import { db, downloadUrl, imageUrl, singer, song } from '@repo/db'
import axios from 'axios'
import { Worker } from 'bullmq'
const storeInDb = new Worker(
    "storeToDb",
    async (job) => {
        console.log("wrker working")
        const { responseId } = job.data;
        console.log(`${process.env.JIO_SAVAAN}/api/artists?id=${responseId}`)
        const resSongs = await axios.get(`${process.env.JIO_SAVAAN}/api/artists?id=${responseId}`)
        console.log(resSongs.data.data)
        const artistsData = resSongs.data.data
        if (responseId) {
            const result = {
                success: false,
                error: "Data not found"
            }
            return result;
        }

        const singerData = await db.insert(singer).values({
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
        }).returning()

        await Promise.all(
            artistsData.topSongs.map(async (music: any) => {
                await db.insert(song).values({
                    songId: music.id,
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

                await db.insert(downloadUrl).values({
                    songId: music.id,
                    downloadConfig: music.downloadUrl.map((url: any) => ({
                        quality: url.quality,
                        url: url.url
                    }))
                })

                await db.insert(imageUrl).values({
                    songId: music.id,
                    imageConfig: music.image.map((url: any) => ({
                        quality: url.quality,
                        url: url.url
                    }))
                })
            })
        )
        console.log("singerdata ", singerData)
    },{
        connection: {
            url: process.env.REDIS_URL
        }
    },
)