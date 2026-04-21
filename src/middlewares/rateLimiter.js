const { client, isRedisAvailable } = require('../cache/redisClient');
const logger = require('../utils/logger');

const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

function getKey(ip) {
    return `rate_limit:${ip}`;
}

async function rateLimiter(req, res, next) {
    // 🔥 Fail-open if Redis unavailable
    if (!isRedisAvailable()) return next();

    const ip = req.ip;
    const key = getKey(ip);
    const now = Date.now();

    try {
        // 🔥 Use pipeline (MULTI) to reduce round trips
        const multi = client.multi();

        multi.zRemRangeByScore(key, 0, now - WINDOW_SIZE);
        multi.zCard(key);
        multi.zAdd(key, {
            score: now,
            value: `${now}-${Math.random()}`
        });
        multi.expire(key, 60);

        const results = await multi.exec();

        // results[1] = zCard result
        const currentCount = results[1];

        if (currentCount >= MAX_REQUESTS) {
            return res.status(429).json({
                success: false,
                error: "Too many requests. Try again later."
            });
        }

        next();

    } catch (err) {
        logger.error({
            msg: "Rate limiter error",
            error: err.message,
            ip
        });

        // 🔥 Fail-open (system should not break)
        next();
    }
}

module.exports = rateLimiter;