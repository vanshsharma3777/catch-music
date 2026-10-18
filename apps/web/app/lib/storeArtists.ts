import { storeToDb } from "@repo/queue";

export async function storeArtists(responseId: string) {

    await storeToDb.add('storeToDb', { responseId });

}
