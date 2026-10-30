import { db } from "@repo/db";
import { songEmbeddings } from "@repo/db";

import { generateEmbedding } from "./embedding";
import { getSongContext } from "./song-context";
import { eq } from "drizzle-orm";

export async function saveSongEmbedding(songId: string) {

    const existing = await db
        .select()
        .from(songEmbeddings)
        .where(eq(songEmbeddings.songId, songId))
        .limit(1);

    if (existing.length > 0) {
        console.log("Embedding already exists:", songId);
        return;
    }

    // 2. Generate song context
    const context = await getSongContext(songId);

    console.log("Song context:", context);

    // 3. Convert context into embedding
    const embedding = await generateEmbedding(context);

    console.log("Embedding dimensions:", embedding.length);

    // 4. Store in Neon
    await db.insert(songEmbeddings).values({
        songId,
        embedding,
        model: "Xenova/all-MiniLM-L6-v2",
    });

    console.log("Embedding saved:", songId);
}