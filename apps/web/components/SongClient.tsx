'use client'

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { downloadSong } from "../app/lib/downloadSongs";
import { playOfflineSong } from "../app/lib/playOfflineMusic";


export default function SongClient() {
  const searchParams = useSearchParams();
  const singers = searchParams.get("singers")?.split(",") || [];

  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [allDownloadUrl, setAllDownloadUrl] = useState<any[]>([]);

  useEffect(() => {
    let interval: any;

    function getResponse() {
      interval = setInterval(async () => {
        console.log("[FETCH] polling...");

        const responses = await Promise.all(
          singers.map(async (sing) => {
            const res = await axios.get(`/api/getSongs/${sing}`);
            return res.data;
          })
        );

        const songs = responses.flatMap(r => r.songs).filter(Boolean);
        const downloadUrls = responses.flatMap(r => r.downloadUrlOfAllSongs).filter(Boolean);

        console.log("[FETCH] songs:", songs.length);
        console.log("[FETCH] urls:", downloadUrls.length);

        setAllSongs(songs);
        setAllDownloadUrl(downloadUrls);

        if (songs.length > 0 && downloadUrls.length > 0) {
          clearInterval(interval);
          console.log("[FETCH] stopped polling");
        }
      }, 5000);
    }

    getResponse();
    return () => clearInterval(interval);

  }, []);

  useEffect(() => {
    if (allDownloadUrl.length === 0 || allSongs.length === 0) {
      console.log("[DOWNLOAD] waiting...");
      return;
    }

    console.log("[DOWNLOAD] preparing songs");

    const songsToDownload = allDownloadUrl.map((song: any) => {
      const songsMatched = allSongs.find((s) => s?.songId === song.songId);

      if (!songsMatched) return null;

      return {
        songId: songsMatched.songId,
        singerId: songsMatched.singerId,
        name: songsMatched.name,
        url: song.downloadConfig.at(-1).url,
        image: songsMatched.image,
        duration: songsMatched.duration,
        label: songsMatched.label
      };
    }).filter(Boolean);

    console.log("[DOWNLOAD] sending to SW:", songsToDownload.length);

    downloadSong(songsToDownload);

  }, [allDownloadUrl]);

  return (
    <div>
      {allSongs.map((song) => (
        <div key={song.songId} className="flex items-center">
          <h1>{song.name}</h1>

          <button
            onClick={() => {
              console.log("[PLAY] clicked:", song.songId);
              playOfflineSong(song.songId);
            }}
            className="rounded-xl border-2 mx-3 px-5 py-1 my-2"
          >
            Play song
          </button>
        </div>
      ))}
    </div>
  );
}