import { storeSongsToDb } from "@repo/queue";

export async function storeSongs(songs: any) {
    console.log(songs)
    await storeSongsToDb.add('storeSongsToDb ', { songs });
}