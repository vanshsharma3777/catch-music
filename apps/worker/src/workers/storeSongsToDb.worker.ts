
import { Worker } from "bullmq";
import { connection } from "@repo/queue";
import { saveSongEmbedding } from "@repo/recommendation";

import {
    db,
    downloadUrl,
    singer,
    song,
    songSinger,
} from "@repo/db";

import { eq, inArray } from "drizzle-orm";

interface Artist {
    id: string;
    name: string;
    url: string;
    image?: {
        quality: string;
        url: string;
    }[];
}

interface Music {
    id: string;
    name: string;
    type: string;
    duration: number;
    year: string;
    playCount?: number;
    releaseDate?: string;
    language: string;
    lyrics?: string;
    hasLyrics?: boolean;
    label: string;
    url: string;
    explicitContent?: boolean;

    album?: {
        id: string;
        name: string;
    };

    artists: {
        primary?: Artist[];
        featured?: Artist[];
    };

    downloadUrl?: {
        quality: string;
        url: string;
    }[];
}

interface Response {
    albumId?: string;
    songs: Music[];
}

export const storeSongsinDb = new Worker(
    "storeSongsToDb",

    async (job) => {
        console.log("store songs to db worker working");

        try {
            const { songs, albumId }: Response = job.data;

            console.log("albumId in worker", albumId);

            if (!songs || songs.length === 0) {
                console.log("No songs found");

                return {
                    success: false,
                    error: "Song not found",
                };
            }

            const uniqueSongs = Array.from(
                new Map(songs.map(s => [s.id, s])).values()
            );

            const allArtists = uniqueSongs.flatMap(music => [
                ...(music.artists?.primary ?? []),
                ...(music.artists?.featured ?? []),
            ]);

            const uniqueArtists = Array.from(
                new Map(
                    allArtists.map(artist => [artist.id, artist])
                ).values()
            );

            const result = await db.transaction(async (tx) => {


                const songIds = uniqueSongs.map(s => s.id);

                const existingSongs = await tx
                    .select({
                        songId: song.songId,
                    })
                    .from(song)
                    .where(inArray(song.songId, songIds));

                const existingSongIds = new Set(
                    existingSongs.map(s => s.songId)
                );

                const songsToInsert = uniqueSongs.filter(
                    music => !existingSongIds.has(music.id)
                );

                if (songsToInsert.length > 0) {

                    await tx
                        .insert(song)
                        .values(
                            songsToInsert.map(music => ({
                                songId: music.id,
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
                                isExplicit: music.explicitContent ?? false,
                                albumId: albumId
                                    ? String(albumId)
                                    : music.album?.id ?? null,
                                singerId: music.artists?.primary?.[0]?.id ?? null,
                            }))
                        )
                        .onConflictDoNothing();
                }

                console.log(
                    "Inserted songs:",
                    songsToInsert.length
                );

                if (uniqueArtists.length > 0) {

                    const artistIds = uniqueArtists.map(
                        artist => artist.id
                    );

                    const existingSingers = await tx
                        .select({
                            singerId: singer.singerId,
                        })
                        .from(singer)
                        .where(inArray(singer.singerId, artistIds));

                    const existingSingerIds = new Set(
                        existingSingers.map(s => s.singerId)
                    );

                    const singersToInsert = uniqueArtists.filter(
                        artist => !existingSingerIds.has(artist.id)
                    );

                    if (singersToInsert.length > 0) {

                        await tx
                            .insert(singer)
                            .values(
                                singersToInsert.map(artist => ({
                                    singerId: artist.id,
                                    name: artist.name,
                                    imageConfig: artist.image ?? [],
                                    url: artist.url,
                                }))
                            )
                            .onConflictDoNothing();
                    }

                    console.log(
                        "Inserted singers:",
                        singersToInsert.length
                    );
                }


                const relationships = uniqueSongs.flatMap(music => {

                    const artists = [
                        ...(music.artists?.primary ?? []),
                        ...(music.artists?.featured ?? []),
                    ];

                    return artists.map(artist => ({
                        songId: music.id,
                        singerId: artist.id,
                    }));
                });

                if (relationships.length > 0) {

                    await tx
                        .insert(songSinger)
                        .values(relationships)
                        .onConflictDoNothing();
                }

                console.log(
                    "Processed song-singer relationships:",
                    relationships.length
                );


                const downloadSongIds = uniqueSongs.map(
                    music => music.id
                );

                const existingDownloadUrls = await tx
                    .select({
                        songId: downloadUrl.songId,
                    })
                    .from(downloadUrl)
                    .where(inArray(downloadUrl.songId, downloadSongIds));

                const existingDownloadIds = new Set(
                    existingDownloadUrls.map(d => d.songId)
                );

                const downloadsToInsert = uniqueSongs.filter(
                    music =>
                        !existingDownloadIds.has(music.id) &&
                        music.downloadUrl?.length
                );

                if (downloadsToInsert.length > 0) {

                    await tx
                        .insert(downloadUrl)
                        .values(
                            downloadsToInsert.map(music => ({
                                songId: music.id,
                                downloadConfig: music.downloadUrl!.map(
                                    item => ({
                                        quality: item.quality,
                                        url: item.url,
                                    })
                                ),
                            }))
                        )
                        .onConflictDoNothing();
                }

                console.log(
                    "Inserted download URLs:",
                    downloadsToInsert.length
                );

                return {
                    songsInserted: songsToInsert.length,
                    singersInserted: uniqueArtists.length,
                    relationshipsProcessed: relationships.length,
                    downloadUrlsInserted: downloadsToInsert.length,
                };
            });

            console.log("Song storage completed:", result);
            await Promise.all(
    uniqueSongs.map(async (music) => {
        try {
            await saveSongEmbedding(music.id);
        } catch (error) {
            console.error(
                `Embedding generation failed for ${music.id}:`,
                error
            );
        }
    })
);
            return {
                success: true,
                ...result,
            };

        } catch (error: any) {

            console.error("Internal server error:", error);

            throw error;
        }
    },
    {
        connection,
    }
);