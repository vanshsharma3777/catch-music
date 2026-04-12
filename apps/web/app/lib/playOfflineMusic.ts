import { getSong } from "./indexDb"

export async function playOfflineSong(songId: string) {

  const song = await getSong(songId)

  if (!song) {
    console.log("Song not found offline")
    return
  }

  const audioUrl = URL.createObjectURL(song.blob)

  const audio = new Audio(audioUrl)

  audio.play()
}