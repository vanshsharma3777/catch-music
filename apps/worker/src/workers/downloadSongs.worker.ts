import { Worker } from "bullmq";
import { connection } from '@repo/queue'

export const downloadSong = new Worker(
    "downloadSongs",
    async (job)=>{
        console.log("Download songs worker working")
        const {downloadSongsUrls} = job.data
        console.log("downloadSongsUrl ," , downloadSongsUrls)
    },{
        connection
    }
)