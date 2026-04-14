export const downloadSong = async (songs: any) => {
  console.log(songs)
  const registration = await navigator.serviceWorker.ready
  console.log("started navigations")
  songs.map((song: any) => {
    registration.active?.postMessage({
      songId: song.songId,
      url: song.url,
      singerId: song.singerId,
      name: song.name,
      image: song.image,
      duration: song.duration,
      label: song.label,
    })
  })
}