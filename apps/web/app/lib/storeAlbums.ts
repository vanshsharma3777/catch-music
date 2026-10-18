
import { storeAlbumsToDb } from "@repo/queue";

export async function storeAlbums(albums: any) {
    await storeAlbumsToDb.add('storeAlbumsToDb',  { albums } );

}
