import { Worker } from "bullmq";
import { connection, storeSongsToDb } from '@repo/queue'
import axios from "axios";
import { album, db } from "@repo/db";
import { inArray } from "drizzle-orm";

export const storeAlbumsInDb = new Worker(
    "storeAlbumsToDb",
    async (job) => {
        console.log("store albums to db worker working")
        try {
            const { albums } = job.data;
            console.log("responseId", albums)
            if (!albums) {
                const result = {
                    success: false,
                    error: "Data not found"
                }
                return result;
            }

            const checkAlbums = async () => {
                const albumsIds = albums.map((a: any) => a.id)

                const existingAlbums = await db
                    .select()
                    .from(album)
                    .where(inArray(album.albumId, albumsIds))

                const existingAlbumsIds = new Set(
                    existingAlbums.map((a: any) => a.albumId)
                )
                return albums.map((a: any) => {
                    if (existingAlbumsIds.has(a.id)) {
                        return null
                    }
                    return a
                })
            }

            const [songs, insertAlbums] = await Promise.all([
                Promise.all(albums.map(async (album: any) => {
                    const res = await axios.get(
                        `${process.env.JIO_SAVAAN}/api/search/songs?query=${album.name}&limit=1`
                    )
                    return res.data.data.results[0]
                })),
                checkAlbums()
            ])

            const filterAlbumsData = insertAlbums.filter(Boolean)
            if (filterAlbumsData.length === 0) {
                console.log("No album to insert , album alredy present in DB")
            }
            console.log("songs get from api call ", songs)

            const insertedAlbum = await Promise.all(filterAlbumsData.map(async (alb: any) => {
                const insertAlbum = await db.insert(album).values({
                    albumId: alb.id,
                    url: alb.url,
                    name: alb.name,
                    year: alb.year,
                    playCount: alb.playCount
                }).returning()

                return insertAlbum[0]
            }))

            console.log("inserted albums is " , insertedAlbum)
            if(insertedAlbum.length!==0){
                await Promise.all(
                songs.map(async (song: any) => {
                    let index =0;
                    console.log("calling song worker to save in db")
                    await storeSongsToDb.add("storeSongsToDb", { songs: [song] , albumId: insertedAlbum[index].albumId})
                    index+=1
                })


            )
            }


        } catch (error: any) {
            console.log("internal server error ")
            console.log("error ", error?.message)
        }
    }, {
    connection
}
)