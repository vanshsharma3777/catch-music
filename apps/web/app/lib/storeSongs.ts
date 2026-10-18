import { storeSongsToDb } from "@repo/queue";

export async function storeSongs(songs: any) {
    await storeSongsToDb.add('storeSongsToDb', { songs });
}
