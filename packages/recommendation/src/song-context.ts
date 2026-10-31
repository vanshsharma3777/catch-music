import { eq } from "drizzle-orm";
import { db } from "@repo/db";
import { song, album, songSinger, singer } from "@repo/db";

export async function getSongContext(songId: string): Promise<string | null> {
    const result = await db
        .select({
            name: song.name,
            language: song.language,
            year: song.year,
            duration: song.duration,
            albumName: album.name,
            singerName: singer.name
        })
        .from(song)
        .leftJoin(album, eq(song.albumId, album.albumId))
        .leftJoin(songSinger, eq(song.songId, songSinger.songId))
        .leftJoin(singer, eq(songSinger.singerId, singer.singerId))
        .where(eq(song.songId, songId));

    if (!result.length) return null;

    const first = result[0];

    const artists = result
        .map(item => item.singerName)
        .filter(Boolean);

    return [
        `Song: ${first.name}`,
        `Artists: ${[...new Set(artists)].join(", ")}`,
        `Album: ${first.albumName ?? ""}`,
        `Language: ${first.language ?? ""}`,
        `Year: ${first.year ?? ""}`,
        `Duration: ${first.duration ?? ""}`
    ].join(". ");
}