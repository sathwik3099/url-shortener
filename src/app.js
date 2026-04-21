require('dotenv').config();
const express = require('express');
const app = express();

const logger = require('./utils/logger');

// Redis init
const { connectRedis } = require('./cache/redisClient');

// Middlewares
const requestLogger = require('./middlewares/requestLogger');
const rateLimiter = require('./middlewares/rateLimiter');

// Routes & handlers
const routes = require('./routes/urlRoutes');
const errorHandler = require('./middlewares/errorHandler');

// Trust proxy (for correct IP behind load balancers)
app.set('trust proxy', true);

// Background jobs (only if enabled)
if (process.env.RUN_CRON === 'true') {
    require('./jobs/cleanupJobs');
    logger.info("Cron jobs enabled");
}

// Analytics worker (background)
require('./workers/analyticsWorker');

// Middleware
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

// Routes
app.use('/', routes);

// Error handler
app.use(errorHandler);

// Start server after redis
async function startServer() {
    try {
        await connectRedis();
        logger.info("Redis connected");
    } catch (err) {
        logger.error({ msg: "Redis connection failed", error: err.message });
    }

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        logger.info({ msg: "Server started", port: PORT });
    });
}

startServer();
