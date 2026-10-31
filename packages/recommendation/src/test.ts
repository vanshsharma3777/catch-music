import { getSimilarSongs } from "./similarity";

const songId = "AQElj-gb";

const results = await getSimilarSongs(songId, 10);

console.log("Similar songs:", results);