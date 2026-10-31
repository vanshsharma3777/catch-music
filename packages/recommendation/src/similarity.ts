import { eq, sql, ne } from "drizzle-orm";
import { db } from "@repo/db";
import { songEmbeddings } from "@repo/db";

export interface SimilarSong {
    songId: string;
    similarity: number;
}

export async function getSimilarSongs(
    songId: string,
    limit = 30
): Promise<SimilarSong[]> {
    const source = await db
        .select()
        .from(songEmbeddings)
        .where(eq(songEmbeddings.songId, songId))
        .limit(1);

    if (!source.length) return [];

    const embedding = source[0].embedding;

    const results = await db
        .select({
            songId: songEmbeddings.songId,
            similarity: sql<number>`
                1 - (${songEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector)
            `
        })
        .from(songEmbeddings)
        .where(ne(songEmbeddings.songId, songId))
        .orderBy(
            sql`${songEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector`
        )
        .limit(limit);

    return results.map(item => ({
        songId: item.songId,
        similarity: Number(item.similarity)
    }));
}