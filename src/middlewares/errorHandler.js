const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
    // 🔥 Structured logging (include more context)
    logger.error({
        msg: "Request error",
        error: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    // 🔥 Map known errors → HTTP status
    const statusMap = {
        INVALID_URL: 400,
        INVALID_ALIAS: 400,
        INVALID_EXPIRY: 400,
        INVALID_CODE: 400,
        NOT_FOUND: 404,
        EXPIRED: 410,
        ALIAS_EXISTS: 409
    };

    // 🔥 Prefer explicit statusCode if present (future-proof)
    const status = err.statusCode || statusMap[err.message] || 500;

    // 🔥 Avoid leaking internal errors in production
    const isProduction = process.env.NODE_ENV === 'production';

    res.status(status).json({
        success: false,
        error: isProduction && status === 500
            ? "Internal server error"
            : err.message
    });
}

module.exports = errorHandler;