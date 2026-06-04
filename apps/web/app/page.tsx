'use client'

import { singer } from "@repo/db";
import axios, { Axios, isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter()
  const [singers, setSingers] = useState<string[]>([])
  const [singersId, setSingersId] = useState<string[]>([])
  const [count, setCount] = useState<number>(0)
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        if (count !== 1) return


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
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.status === 400) {
            console.log("Unauthenticated")
            router.replace("/api/auth/signin")
          }
        }
      }
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
    <div className="text-sec min-h-screen bg-primary hover:bg-primary-hover">
  Start Listening
</div>
  );
}