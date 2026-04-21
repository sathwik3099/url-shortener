const logger = require('../utils/logger');

const queue = [];
const MAX_QUEUE_SIZE = 100000;

function enqueue(event) {
    if (queue.length >= MAX_QUEUE_SIZE) {
        logger.warn({ msg: "Analytics queue full, dropping event" });
        return;
    }

    queue.push(event);
}

function dequeueBatch(batchSize = 100) {
    if (queue.length === 0) return [];
    return queue.splice(0, batchSize);
}

function size() {
    return queue.length;
}

module.exports = {
    enqueue,
    dequeueBatch,
    size
};