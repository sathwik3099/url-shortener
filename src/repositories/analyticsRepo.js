const pool = require('../db/db');
const logger = require('../utils/logger');

async function insertBatch(events) {
    if (!events || events.length === 0) return;

    const values = [];
    const placeholders = [];

    events.forEach((event, i) => {
        const idx = i * 2;
        placeholders.push(`($${idx + 1}, NOW())`);
        values.push(event.shortCode);
    });

    const query = `
        INSERT INTO url_analytics (short_code, clicked_at)
        VALUES ${placeholders.join(',')}
    `;

    try {
        await pool.query(query, values);
    } catch (err) {
        logger.error({
            msg: "Analytics batch insert failed",
            error: err.message,
            size: events.length
        });
    }
}

async function deleteOldAnalytics(days = 30) {
    const safeDays = parseInt(days, 10) || 30;

    const query = `
        DELETE FROM url_analytics
        WHERE clicked_at < NOW() - ($1 * INTERVAL '1 day')
    `;

    try {
        const { rowCount } = await pool.query(query, [safeDays]);
        return rowCount;
    } catch (err) {
        logger.error({
            msg: "Delete old analytics failed",
            error: err.message
        });
        return 0;
    }
}

module.exports = {
    insertBatch,
    deleteOldAnalytics
};