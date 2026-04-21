const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // 🔥 Connection pool tuning
    max: 20, // max concurrent connections
    idleTimeoutMillis: 30000, // close idle clients after 30s
    connectionTimeoutMillis: 5000, // fail fast if DB is unreachable

    // 🔥 Optional: SSL for production (safe fallback)
    ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false
});

// 🔹 Log successful connection (once)
pool.on('connect', () => {
    logger.info("PostgreSQL connected");
});

// 🔹 Log errors on idle clients
pool.on('error', (err) => {
    logger.error({
        msg: "Unexpected DB error",
        error: err.message
    });
});

// 🔹 Graceful shutdown (VERY IMPORTANT)
async function shutdown() {
    try {
        await pool.end();
        logger.info("PostgreSQL pool closed");
    } catch (err) {
        logger.error({
            msg: "Error closing DB pool",
            error: err.message
        });
    }
}

// 🔹 Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = pool;