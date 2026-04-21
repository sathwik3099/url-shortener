const pool = require('../db/db');
const logger = require('../utils/logger');

// 🔹 Use transaction to avoid partial writes
async function insertWithId(originalUrl, expiresAt = null) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const insertQuery = `
            INSERT INTO urls (original_url, short_code, expires_at)
            VALUES ($1, '', $2)
            RETURNING id;
        `;
        const { rows } = await client.query(insertQuery, [originalUrl, expiresAt]);
        const id = rows[0].id;

        await client.query('COMMIT');
        return id;

    } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ msg: "insertWithId failed", error: err.message });
        throw err;
    } finally {
        client.release();
    }
}

async function updateShortCode(id, shortCode) {
    const query = `
        UPDATE urls
        SET short_code = $1
        WHERE id = $2
        RETURNING *;
    `;

    try {
        const { rows } = await pool.query(query, [shortCode, id]);
        return rows[0];
    } catch (err) {
        logger.error({ msg: "updateShortCode failed", error: err.message });
        throw err;
    }
}

// 🔹 Custom alias insert (handles uniqueness at DB level)
async function createWithCustomAlias(originalUrl, customAlias, expiresAt = null) {
    const query = `
        INSERT INTO urls (original_url, short_code, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    try {
        const { rows } = await pool.query(query, [originalUrl, customAlias, expiresAt]);
        return rows[0];
    } catch (err) {
        logger.error({ msg: "createWithCustomAlias failed", error: err.message });
        throw err;
    }
}

// 🔹 Optimized read query
async function getActiveUrlByShortCode(shortCode) {
    const query = `
        SELECT original_url, expires_at
        FROM urls
        WHERE short_code = $1
        AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1;
    `;

    try {
        const { rows } = await pool.query(query, [shortCode]);
        return rows[0];
    } catch (err) {
        logger.error({ msg: "getActiveUrl failed", error: err.message });
        throw err;
    }
}

// 🔹 Cleanup expired URLs
async function deleteExpiredUrls() {
    const query = `
        DELETE FROM urls
        WHERE expires_at IS NOT NULL
        AND expires_at < NOW()
        RETURNING id;
    `;

    try {
        const { rowCount } = await pool.query(query);
        return rowCount;
    } catch (err) {
        logger.error({ msg: "deleteExpiredUrls failed", error: err.message });
        return 0;
    }
}

// 🔹 Delete single URL (used in DELETE API)
async function deleteByShortCode(shortCode) {
    const query = `
        DELETE FROM urls
        WHERE short_code = $1
        RETURNING id;
    `;

    try {
        const { rowCount } = await pool.query(query, [shortCode]);
        return rowCount;
    } catch (err) {
        logger.error({ msg: "deleteByShortCode failed", error: err.message });
        throw err;
    }
}

module.exports = {
    insertWithId,
    updateShortCode,
    createWithCustomAlias,
    getActiveUrlByShortCode,
    deleteExpiredUrls,
    deleteByShortCode
};