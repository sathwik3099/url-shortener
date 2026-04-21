const logger = require('../utils/logger');

function requestLogger(req, res, next) {
    const start = process.hrtime.bigint(); // high-precision timer

    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6; // convert to ms

        logger.info({
            msg: "HTTP request",
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: durationMs.toFixed(2),
            ip: req.ip,
            userAgent: req.headers['user-agent'] || "unknown"
        });
    });

    // capture aborted requests as well
    res.on('close', () => {
        if (!res.writableEnded) {
            logger.warn({
                msg: "Request aborted",
                method: req.method,
                url: req.originalUrl,
                ip: req.ip
            });
        }
    });

    next();
}

module.exports = requestLogger;
