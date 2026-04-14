import { getSong } from "./indexDb"

export async function playOfflineSong(songId: string) {

  const song = await getSong(songId)

  if (!song) {
    console.log("Song not found offline")
    return
  }
  console.log("[PLAYER] Playing:", song.name);

  const audio = new Audio(song.url)

  audio.play().catch((err) => {
    console.log("[PLAYER] Playback failed (maybe not cached):", err);
  });
}