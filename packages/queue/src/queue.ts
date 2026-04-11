import { Queue } from 'bullmq'

import { connection } from './redis'
export const storeToDb = new Queue("storeToDb", {
  connection
})
export const downloadSongs = new Queue("downloadSongs", {
  connection
})