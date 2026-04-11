'use client'

import { getSong } from "./lib/indexDb"

export default function Home() {
   async function playOfflineSong(songId: string) {

  const song = await getSong(songId)

  if (!song) {
    console.log("Song not found offline")
    return
  }

  const audioUrl = URL.createObjectURL(song.blob)

  const audio = new Audio(audioUrl)

  audio.play()
}
  return (
    <div>
      <button
        onClick={async () => {

          const registration = await navigator.serviceWorker.ready

          registration.active?.postMessage([
            {
              songId: "song-1",
              url: "https://aac.saavncdn.com/924/bf55f4b915952daa8e3a15635a27ff74_320.mp4"
            },
            {
              songId: "song-2",
              url: "https://aac.saavncdn.com/310/ea6e707f74df2e637a6d29a78512d569_320.mp4"
            },
            {
              songId: "song-3",
              url: "https://aac.saavncdn.com/808/5c496bb498185f7b0148f1650a051d89_320.mp4"
            },
            {
              songId: "song-4",
              url: "https://aac.saavncdn.com/304/f31ba5ffe986d0feb95b3059ad05f4d5_320.mp4"
            }
          ])

        }}
      >
        Download Test Song
      </button>
      <br />
      <button onClick={() => playOfflineSong("song-1")}>
        Play Song 1 Offline
      </button>
        <br />
      <button onClick={() => playOfflineSong("song-2")}>
        Play Song 2 Offline
      </button>
      <br />
      <button onClick={() => playOfflineSong("song-3")}>
        Play Song 3 Offline
      </button>
      <br />
      <button onClick={() => playOfflineSong("song-4")}>
        Play Song 4 Offline
      </button>
    </div>
  );
}