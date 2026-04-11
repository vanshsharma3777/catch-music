console.log("starting all workers")

import "./workers/storeToDb.worker"
import "./workers/downloadSongs.worker"

console.log("All workers started")