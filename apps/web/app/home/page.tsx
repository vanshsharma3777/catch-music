'use client'

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { playOfflineSong } from "../lib/playOfflineMusic";


export default  function song(){
    const searchParams = useSearchParams();
    const singers =   searchParams.get("singers")?.split(",") || []
    const [allSongs , setAllSongs] = useState<any[]>([])
    const [allDownloadUrl , setAllDownloadUrl] = useState<any[]>([])
    console.log("singers in jhome page" , singers)
    useEffect(()=>{
        async function getResponse(){
            await Promise.all(
                singers.map(async (sing)=>{
                    console.log("sing ", sing)
                    const res = await axios.get(`/api/getSongs/${sing}`)
                    console.log(res.data)
                    setAllDownloadUrl(res.data.downloadUrlOfAllSongs)
                    setAllSongs(res.data.songs)
                })
            )
        }
        getResponse()
    }, [allSongs])
    return(
        <div>
            <div>
            {allSongs.map((song)=>(
                <div key={song.id}>
                    <h1>{song.name}</h1>
                </div>
            ))}
            </div>
        </div>
    )
}