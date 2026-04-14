'use client'

import { singer } from "@repo/db";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter()
  const songs = [
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
  ]
  const [singers, setSingers] = useState<string[]>([])
  const [singersId, setSingersId] = useState<string[]>([])
  const [count, setCount] = useState<number>(0)
  console.log("count", count)
  console.log("singers", singers)
  useEffect(() => {
    const fetchArtists = async () => {
      if (count !== 1) return

      console.log("singers in eff", singers)

      const ids = await Promise.all(
        singers.map(async (singer) => {
          const res = await axios.post("/api/search/artists", {
            query: singer,
            limit: 10
          })
          console.log(res.data.data.id)
          return res.data.data.id
        })
      )

      setSingersId(ids)
    }

    fetchArtists()
  }, [singers, count])
  useEffect(() => {
    if (singersId.length === 1) {
      console.log(`/home?singers=${singersId.join(",")}`)
      router.push(`/home?singers=${singersId.join(",")}`)
    }
  }, [singersId])
  return (
    <div className="  grid text-white min-h-screen">
      <div className="flex justify-center ">
        <h1 className="text-4xl font-semibold shadow-black pt-5">Select your top 3 fav singers</h1>
      </div>
      <div className="grid-4 text-center mt-5 ">
        <button onClick={() => {
          setCount(count + 1)
          setSingers((prev) => {
            return [...prev, "arjit singh"]
          })
        }} className="rounded-xl border-green-900  border px-5 py-3 mx-2">Arjit Singh</button>
        <button onClick={() => {
          setCount(count + 1)
          setSingers((prev) => {
            return [...prev, "yo yo honey singh"]
          })
        }} className="rounded-xl border-green-900  border px-5 py-3 mx-2">Yo Yo Honey Singh</button>
        <button onClick={() => {
          setCount(count + 1)
          setSingers((prev) => {
            return [...prev, "Darshal ravel"]
          })
        }} className="rounded-xl border-green-900  border px-5 py-3 mx-2">Darshal Ravel</button>
        <button onClick={() => {
          setCount(count + 1)
          setSingers((prev) => {
            return [...prev, "badshah"]
          })
        }} className="rounded-xl border-green-900  border px-5 py-3 mx-2">Badshah</button>
        <button onClick={() => {
          setCount(count + 1)
          setSingers((prev) => {
            return [...prev, "kishor kumar"]
          })
        }} className="rounded-xl border-green-900  border px-5 py-3 mx-2">Kishor Kumar</button>
        <button onClick={() => {
          setCount(count + 1)
          setSingers((prev) => {
            return [...prev, "lata mangeshkar"]
          })
        }} className="rounded-xl border-green-900  border px-5 py-3 mx-2">Lata Mangeshkar</button>
      </div>
    </div>
  );
}