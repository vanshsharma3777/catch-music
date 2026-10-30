import { saveSongEmbedding } from "../src/save-embedding";

async function main() {
    const songId = process.argv[2];

    if (!songId) {
        throw new Error("Please provide a song ID");
    }

    console.log("Generating embedding for:", songId);

    await saveSongEmbedding(songId);

    console.log("Embedding generation completed!");
}

main().catch(console.error);