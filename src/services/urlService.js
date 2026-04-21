const repo = require('../repositories/urlRepository');
const { encode } = require('../utils/base62');
const { isValidUrl, isValidAlias } = require('../utils/validator');
const cache = require('../cache/urlCache');
const analyticsQueue = require('../queue/analyticsQueue');
const logger = require('../utils/logger');

const HOT_THRESHOLD = 10;

// CREATE SHORT URL
async function shortenUrl({ originalUrl, customAlias, expiresAt }) {
    if (!originalUrl || !isValidUrl(originalUrl)) {
        throw new Error("INVALID_URL");
    }

    if (expiresAt && new Date(expiresAt) <= new Date()) {
        throw new Error("INVALID_EXPIRY");
    }

    // Custom Alias
    if (customAlias) {
        if (!isValidAlias(customAlias)) {
            throw new Error("INVALID_ALIAS");
        }

        try {
            const result = await repo.createWithCustomAlias(
                originalUrl,
                customAlias,
                expiresAt
            );
            return result;
        } catch (err) {
            if (err.code === '23505') {
                throw new Error("ALIAS_EXISTS");
            }
            throw err;
        }
    }

    // Auto-generated
    const id = await repo.insertWithId(originalUrl, expiresAt);
    const shortCode = encode(id);

    return await repo.updateShortCode(id, shortCode);
}

// GET ORIGINAL URL (CACHE + HOT OPTIMIZATION + ANALYTICS)
async function getOriginalUrl(shortCode) {
    if (!shortCode) throw new Error("INVALID_CODE");

    let url = await cache.get(shortCode);

    if (url) {
        // Hot key optimization
        try {
            const count = await cache.incrementHotCounter(shortCode);
            if (count >= HOT_THRESHOLD) {
                await cache.setHot(shortCode, url);
            }
        } catch (err) {
            logger.error({ msg: "Hot counter failed", error: err.message });
        }

        analyticsQueue.enqueue({ shortCode });
        return url.original_url;
    }

    // DB fallback
    url = await repo.getActiveUrlByShortCode(shortCode);

    if (!url) throw new Error("NOT_FOUND");

    await cache.set(shortCode, url);

    analyticsQueue.enqueue({ shortCode });

    return url.original_url;
}

// GET ANALYTICS (basic aggregation placeholder)
async function getAnalytics(shortCode) {
    if (!shortCode) throw new Error("INVALID_CODE");

    // Extend later if needed (aggregation query)
    return {
        message: "Analytics available via DB queries"
    };
}

// DELETE URL
async function deleteUrl(shortCode) {
    if (!shortCode) throw new Error("INVALID_CODE");

    const deleted = await repo.deleteByShortCode(shortCode);

    if (!deleted) throw new Error("NOT_FOUND");

    // Cache invalidation
    await cache.del(shortCode);

    return true;
}

module.exports = {
    shortenUrl,
    getOriginalUrl,
    getAnalytics,
    deleteUrl
};
