import { Suspense } from "react"
import SongClient from "../../components/SongClient"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading songs...</div>}>
      <SongClient />
    </Suspense>
  )
}