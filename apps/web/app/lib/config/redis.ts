import { Redis } from "@upstash/redis";
console.log("UPSTASH_REDIS_REST_URL" ,process.env.UPSTASH_REDIS_REST_URL!,)
console.log("UPSTASH_REDIS_REST_TOKEN" ,process.env.UPSTASH_REDIS_REST_TOKEN!,)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
