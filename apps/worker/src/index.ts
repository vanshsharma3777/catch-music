console.log("starting all workers")

import "./workers/storeToDb.worker"
import "./workers/storeSongsToDb.worker"

console.log("All workers started")