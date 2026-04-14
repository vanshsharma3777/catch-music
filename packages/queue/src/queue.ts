import { Queue } from 'bullmq'

import { connection } from './redis'
export const storeToDb = new Queue("storeToDb", {
  connection
})
export const storeSongsToDb = new Queue("storeSongsToDb", {
  connection
})
export const storeAlbumsToDb = new Queue("storeAlbumsToDb", {
  connection
})