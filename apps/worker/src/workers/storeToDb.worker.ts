
import {
    db,
    downloadUrl,
    imageUrl,
    singer,
    song,
    songSinger
} from "@repo/db";

import axios from "axios";
import { Worker } from "bullmq";
import { connection } from "@repo/queue";
import { eq, inArray } from "drizzle-orm";

console.log("hello world");

export const storeInDb = new Worker(
    "storeToDb",

    async (job) => {
        console.log("worker working");

        try {
            const { responseId } = job.data;

            if (!responseId) {
                return {
                    success: false,
                    error: "Data not found"
                };
            }

            const resSongs = await axios.get(
                `${process.env.JIO_SAVAAN}/api/artists?id=${responseId}`
            );

            const artistsData = resSongs.data.data;

            if (!artistsData) {
                throw new Error("Artist data not found");
            }

            // 2. Insert artist if not present
            await db
                .insert(singer)
                .values({
                    singerId: artistsData.id,
                    name: artistsData.name,
                    imageConfig: (artistsData.image ?? []).map(
                        (img: any) => ({
                            quality: img.quality,
                            url: img.url
                        })
                    ),
                    url: artistsData.url
                })
                .onConflictDoNothing();

            // 3. Get top 10 songs
            const songs = artistsData.topSongs?.slice(0, 10) ?? [];

            if (songs.length === 0) {
                return {
                    success: true,
                    message: "No top songs found"
                };
            }

            const songIds = songs.map((s: any) => s.id);

            // 4. Find existing songs
            const existingSongs = await db
                .select({
                    songId: song.songId
                })
                .from(song)
                .where(inArray(song.songId, songIds));

            const existingSongIds = new Set(
                existingSongs.map(s => s.songId)
            );

            const songsToInsert = songs.filter(
                (s: any) => !existingSongIds.has(s.id)
            );

            console.log("Songs to insert:", songsToInsert.length);

            // 5. Insert missing songs
            if (songsToInsert.length > 0) {
                const insertedSongs = await db
                    .insert(song)
                    .values(
                        songsToInsert.map((music: any) => ({
                            songId: music.id,
                            singerId: artistsData.id,
                            name: music.name,
                            type: music.type,
                            duration: music.duration ?? 0,
                            year: Number(music.year) || 0,
                            playCount: String(music.playCount ?? 0),
                            releaseDate: music.releaseDate
                                ? Number(music.releaseDate)
                                : null,
                            language: music.language,
                            lyrics: music.lyrics ?? null,
                            hasLyrics: music.hasLyrics ?? false,
                            label: music.label ?? "",
                            url: music.url,
                            isExplicit: music.explicitContent ?? false
                        }))
                    )
                    .onConflictDoNothing()
                    .returning();

                console.log("Inserted songs:", insertedSongs.length);
            }

            await db
                .insert(songSinger)
                .values(
                    songs.map((music: any) => ({
                        songId: music.id,
                        singerId: artistsData.id
                    }))
                )
                .onConflictDoNothing();

            console.log(
                "Song-singer relationships processed:",
                songs.length
            );

            // 7. Insert missing download URLs
            const existingDownloads = await db
                .select({
                    songId: downloadUrl.songId
                })
                .from(downloadUrl)
                .where(inArray(downloadUrl.songId, songIds));

            const existingDownloadIds = new Set(
                existingDownloads.map(d => d.songId)
            );

            const downloadsToInsert = songs.filter(
                (music: any) =>
                    !existingDownloadIds.has(music.id) &&
                    music.downloadUrl?.length
            );

            if (downloadsToInsert.length > 0) {
                const insertedDownloadUrls = await db
                    .insert(downloadUrl)
                    .values(
                        downloadsToInsert.map((music: any) => ({
                            songId: music.id,
                            downloadConfig: music.downloadUrl.map(
                                (url: any) => ({
                                    quality: url.quality,
                                    url: url.url
                                })
                            )
                        }))
                    )
                    .returning();

                console.log(
                    "Inserted Download URLs:",
                    insertedDownloadUrls.length
                );
            }

            const existingImages = await db
                .select({
                    songId: imageUrl.songId
                })
                .from(imageUrl)
                .where(inArray(imageUrl.songId, songIds));

            const existingImageIds = new Set(
                existingImages.map(img => img.songId)
            );

            const imagesToInsert = songs.filter(
                (music: any) =>
                    !existingImageIds.has(music.id) &&
                    music.image?.length
            );

            if (imagesToInsert.length > 0) {
                const insertedImages = await db
                    .insert(imageUrl)
                    .values(
                        imagesToInsert.map((music: any) => ({
                            songId: music.id,
                            imageConfig: music.image.map((img: any) => ({
                                quality: img.quality,
                                url: img.url
                            }))
                        }))
                    )
                    .returning();

                console.log(
                    "Inserted Images:",
                    insertedImages.length
                );
            }

            console.log("Artist songs storage completed");

            return {
                success: true,
                songsProcessed: songs.length,
                songsInserted: songsToInsert.length,
                relationshipsProcessed: songs.length
            };

        } catch (error: any) {
            console.error(
                "Internal server error in storeToDb worker",
                error
            );

            throw error;
        }
    },
    {
        connection
    }
);