const { client, isRedisAvailable } = require('./redisClient');
const logger = require('../utils/logger');

const PREFIX = "url:";
const HOT_PREFIX = "hot:";

const DEFAULT_TTL = 60 * 60; // 1 hour
const HOT_TTL = 24 * 60 * 60; // 24 hours
const HOT_COUNTER_TTL = 60 * 60; // 1 hour (important to avoid memory leak)

function buildKey(shortCode) {
    return `${PREFIX}${shortCode}`;
}

function buildHotKey(shortCode) {
    return `${HOT_PREFIX}${shortCode}`;
}

async function get(shortCode) {
    if (!isRedisAvailable()) return null;

    try {
        const data = await client.get(buildKey(shortCode));
        if (!data) return null;

        return JSON.parse(data);
    } catch (err) {
        logger.error({ msg: "Redis GET failed", error: err.message });
        return null; // fail-open
    }
}

async function set(shortCode, value, ttl = DEFAULT_TTL) {
    if (!isRedisAvailable()) return;

    try {
        await client.setEx(
            buildKey(shortCode),
            ttl,
            JSON.stringify(value)
        );
    } catch (err) {
        logger.error({ msg: "Redis SET failed", error: err.message });
    }
}

async function setHot(shortCode, value) {
    return set(shortCode, value, HOT_TTL);
}

async function del(shortCode) {
    if (!isRedisAvailable()) return;

    try {
        await client.del(buildKey(shortCode));
        await client.del(buildHotKey(shortCode)); // 🔥 also clear hot counter
    } catch (err) {
        logger.error({ msg: "Redis DEL failed", error: err.message });
    }
}

async function incrementHotCounter(shortCode) {
    if (!isRedisAvailable()) return 0;

    try {
        const key = buildHotKey(shortCode);

        const count = await client.incr(key);

        if (count === 1) {
            await client.expire(key, HOT_COUNTER_TTL);
        }

        return count;
    } catch (err) {
        logger.error({ msg: "Redis INCR failed", error: err.message });
        return 0;
    }
}

function isHot(count, threshold = 10) {
    return count >= threshold;
}

module.exports = {
    get,
    set,
    setHot,
    del,
    incrementHotCounter,
    isHot
};
