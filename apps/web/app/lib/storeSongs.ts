import { storeSongsToDb } from "@repo/queue";

export async function storeSongs(songs: any) {
    console.log(" before Job added");
    await storeSongsToDb.add('storeSongsToDb', { songs });
    console.log("Job added");
}