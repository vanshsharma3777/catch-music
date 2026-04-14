import { saveToIndexedDB } from "./saveToIndexDb"

export const downloadSong = async (songs: any) => {
  console.log(songs)
  const registration = await navigator.serviceWorker.ready
  console.log("[DOWNLOAD] sw ready")
  songs.map(async (song: any) => {
    await saveToIndexedDB(song);
    registration.active?.postMessage({
      songId: song.songId,
      url: song.url,
      singerId: song.singerId,
      name: song.name,
      image: song.image,
      duration: song.duration,
      label: song.label,
    })
    console.log("[DOWNLOAD] Sent to SW:", song.songId);

  })
}