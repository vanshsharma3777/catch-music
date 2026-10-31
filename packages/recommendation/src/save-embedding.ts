import { eq } from "drizzle-orm";
import { db, songEmbeddings } from "@repo/db";
import { generateEmbedding } from "./embedding";
import { getSongContext } from "./song-context";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

export async function saveSongEmbedding(songId: string) {
    const existing = await db
        .select()
        .from(songEmbeddings)
        .where(eq(songEmbeddings.songId, songId))
        .limit(1);

    if (existing.length) return;

    const context = await getSongContext(songId);
    if (!context) return;

    const embedding = await generateEmbedding(context);

    await db.insert(songEmbeddings).values({
        songId,
        embedding,
        model: MODEL_NAME
    });
}