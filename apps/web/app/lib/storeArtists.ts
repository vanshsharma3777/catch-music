import { storeToDb } from "@repo/queue";

export async function storeArtists(responseId: string) {
    console.log("storeindb function working")
    await storeToDb.add('storeToDb', { responseId });
    console.log("ran worker store to db ")
}