import { album, db, singer, song , songSinger} from "@repo/db";
import { eq } from "drizzle-orm";

export async function getSongContext(songId: string) {

  const result = await db
    .select({
      songName: song.name,
      year: song.year,
      language: song.language,
      duration: song.duration,
      albumName: album.name,
      artistName: singer.name,
    })
    .from(song)
    .leftJoin(
      album,
      eq(song.albumId, album.albumId)
    )
    .leftJoin(
      songSinger,
      eq(song.songId, songSinger.songId)
    )
    .leftJoin(
      singer,
      eq(songSinger.singerId, singer.singerId)
    )
    .where(eq(song.songId, songId));

  if (!result.length) {
    throw new Error("Song not found");
  }

  const first = result[0];
  if (!first) {
    throw new Error("Song not found");
  }
  const artists = [
    ...new Set(
      result
        .map(row => row.artistName)
        .filter(Boolean)
    ),
  ];

  const context = `
        Song: ${first.songName}.
        Artists: ${artists.join(", ")}.
        Album: ${first.albumName ?? "Unknown"}.
        Language: ${first.language}.
        Release year: ${first.year}.
        Duration: ${first.duration} seconds.
    `;

  return context.trim();
}