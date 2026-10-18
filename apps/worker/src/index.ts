import { serve } from "bun";

import "./workers/storeToDb.worker"
import "./workers/storeSongsToDb.worker"
import "./workers/storeAlbumsToDb.worker"

serve({
  port: Number(process.env.PORT) || 3001,
  fetch(req) {
    return new Response("Worker is running 🚀");
  },
});
