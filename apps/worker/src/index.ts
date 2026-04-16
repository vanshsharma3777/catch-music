import { serve } from "bun";

import "./workers/storeToDb.worker"
import "./workers/storeSongsToDb.worker"
import "./workers/storeAlbumsToDb.worker"

console.log("All workers started")

serve({
  port: Number(process.env.PORT) || 3001,
  fetch(req) {
    return new Response("Worker is running 🚀");
  },
});
