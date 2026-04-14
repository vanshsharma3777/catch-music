
import { storeAlbumsToDb } from "@repo/queue";

export async function storeAlbums(albums: any) {
    console.log("albums ", albums)
    await storeAlbumsToDb.add('storeAlbumsToDb ',  { albums } );
    
}