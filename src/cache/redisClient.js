const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisAvailable = true;
let lastFailureTime = null;

const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                logger.error({ msg: "Redis retry limit reached", retries });
                redisAvailable = false;
                lastFailureTime = Date.now();
                return new Error("Retry attempts exhausted");
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

client.on('error', (err) => {
    logger.error({ msg: "Redis error", error: err.message });
    redisAvailable = false;
    lastFailureTime = Date.now();
});

client.on('ready', () => {
    logger.info("Redis ready");
    redisAvailable = true;
    lastFailureTime = null;
});

client.on('end', () => {
    logger.warn("Redis connection closed");
    redisAvailable = false;
});

async function connectRedis() {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
    } catch (err) {
        redisAvailable = false;
        lastFailureTime = Date.now();
        logger.error({ msg: "Redis connection failed", error: err.message });
    }
}

function isRedisAvailable() {
    // Try re-enabling Redis after cooldown (circuit breaker reset)
    if (!redisAvailable && lastFailureTime) {
        const COOLDOWN = 10000; // 10 sec

        if (Date.now() - lastFailureTime > COOLDOWN) {
            logger.info("Retrying Redis after cooldown...");
            redisAvailable = true;
        }
    }

    return redisAvailable;
}

module.exports = {
    client,
    connectRedis,
    isRedisAvailable
};
