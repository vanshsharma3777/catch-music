import { Queue } from 'bullmq'

export const storeToDb = new Queue('storeToDb' ,{
    connection: {
    url:process.env.REDIS_URL
  }
})