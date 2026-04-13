'use client'

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { playOfflineSong } from "../lib/playOfflineMusic";
import { downloadSong } from "../lib/downloadSongs";


export default function song() {
    const searchParams = useSearchParams();
    const singers = searchParams.get("singers")?.split(",") || []
    const [allSongs, setAllSongs] = useState<any[]>([])
    const [allDownloadUrl, setAllDownloadUrl] = useState<any[]>([])
    useEffect(() => {
        let interval: any
        function getResponse() {
            interval = setInterval(async () => {
                const responses = await Promise.all(
                    singers.map(async (sing) => {
                        const res = await axios.get(`/api/getSongs/${sing}`)
                        return res.data
                    })
                )
                const songs = responses.flatMap(r => r.songs)
                console.log(responses)
                const downloadUrls = responses.flatMap(r => r.downloadUrlOfAllSongs)
                setAllSongs(songs)
                setAllDownloadUrl(downloadUrls)
                if (songs.length > 0) {
                    clearInterval(interval)
                    console.log("Stopped polling")
                }
            }, 5000)
        }
        getResponse()
        return () => clearInterval(interval)

    }, [])

    useEffect(() => {
        if (allDownloadUrl.length === 0) {
            console.log("download url length 0")
            return
        }
        console.log("download url length not 0")
        const songsToDownload = allDownloadUrl.map((song: any) => {
            const songsMatched = allSongs.find((s) => s.songId === song.songId)

            if (songsMatched.length === 0) return null

            return {
                songId: songsMatched.songId,
                singerId: songsMatched.singerId,
                songName: songsMatched.name,
                url: song.downloadConfig.at(-1).url,
                image: songsMatched.image,
                duration: songsMatched.duration,
                label: songsMatched.label
            }
        })
        downloadSong(songsToDownload)
    }, [allDownloadUrl])
    return (
        <div>
            <div>
                {allSongs.map((song) => (
                    <div key={song.id} className="flex items-center">
                        <h1>{song.name}</h1>
                        <button onClick={() => {
                            playOfflineSong(song.songId)
                        }} className="rounded-xl border-2 mx-3 px-5 py-1 my-2">Play song</button>
                    </div>
                ))}
            </div>
        </div>
    )
}