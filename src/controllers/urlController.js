const service = require('../services/urlService');
const { success } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// 🔹 POST /shorten
async function createShortUrl(req, res, next) {
    try {
        const { url, customAlias, expiresAt } = req.body;

        // 🔥 Basic request validation (controller-level guard)
        if (!url) {
            return res.status(400).json({
                success: false,
                error: "URL is required"
            });
        }

        const result = await service.shortenUrl({
            originalUrl: url,
            customAlias,
            expiresAt
        });

        return res.status(201).json(
            success({
                shortCode: result.short_code,
                originalUrl: result.original_url,
                expiresAt: result.expires_at
            })
        );
    } catch (err) {
        next(err);
    }
}

// 🔹 GET /:shortCode
async function redirectUrl(req, res, next) {
    try {
        const { shortCode } = req.params;

        if (!shortCode) {
            return res.status(400).json({
                success: false,
                error: "Short code is required"
            });
        }

        const originalUrl = await service.getOriginalUrl(shortCode);

        // 🔥 Optional: structured log for redirects (high-value metric)
        logger.info({
            msg: "Redirect",
            shortCode,
            ip: req.ip
        });

        // ⚠️ Redirect responses are NOT wrapped
        return res.redirect(302, originalUrl);

    } catch (err) {
        next(err);
    }
}

// 🔹 GET /analytics/:shortCode
async function getAnalytics(req, res, next) {
    try {
        const { shortCode } = req.params;

        if (!shortCode) {
            return res.status(400).json({
                success: false,
                error: "Short code is required"
            });
        }

        const analytics = await service.getAnalytics(shortCode);

        return res.status(200).json(
            success({
                shortCode,
                ...analytics
            })
        );
    } catch (err) {
        next(err);
    }
}

// 🔹 DELETE /:shortCode
async function deleteUrl(req, res, next) {
    try {
        const { shortCode } = req.params;

        if (!shortCode) {
            return res.status(400).json({
                success: false,
                error: "Short code is required"
            });
        }

        await service.deleteUrl(shortCode);

        return res.status(200).json(
            success({
                message: "URL deleted successfully"
            })
        );
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createShortUrl,
    redirectUrl,
    getAnalytics,
    deleteUrl
};