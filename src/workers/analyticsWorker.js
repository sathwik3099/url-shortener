const queue = require('../queue/analyticsQueue');
const repo = require('../repositories/analyticsRepo');
const logger = require('../utils/logger');

const BATCH_SIZE = 100;
const INTERVAL_MS = 1000;

let isProcessing = false;

async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const batch = queue.dequeueBatch(BATCH_SIZE);

        if (batch.length > 0) {
            await repo.insertBatch(batch);

            logger.info({
                msg: "Analytics batch processed",
                size: batch.length
            });
        }
    } catch (err) {
        logger.error({
            msg: "Analytics worker error",
            error: err.message
        });
    } finally {
        isProcessing = false;
    }
}

// graceful shutdown support
function shutdown() {
    logger.info("Shutting down analytics worker...");
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// periodic worker
setInterval(processQueue, INTERVAL_MS);
