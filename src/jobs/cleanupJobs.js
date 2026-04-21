const cron = require('node-cron');
const urlRepo = require('../repositories/urlRepository');
const analyticsRepo = require('../repositories/analyticsRepo');
const logger = require('../utils/logger');

const ANALYTICS_RETENTION_DAYS = parseInt(process.env.ANALYTICS_RETENTION_DAYS, 10) || 30;

// Prevent overlapping runs 
let isUrlCleanupRunning = false;
let isAnalyticsCleanupRunning = false;

// Job 1: Delete expired URLs (every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
    if (isUrlCleanupRunning) {
        logger.warn("URL cleanup skipped (previous run still active)");
        return;
    }

    isUrlCleanupRunning = true;

    try {
        const deleted = await urlRepo.deleteExpiredUrls();
        logger.info({ msg: "Expired URLs cleaned", deleted });
    } catch (err) {
        logger.error({ msg: "Error deleting expired URLs", error: err.message });
    } finally {
        isUrlCleanupRunning = false;
    }
});

// Job 2: Clean old analytics (daily at midnight)
cron.schedule('0 0 * * *', async () => {
    if (isAnalyticsCleanupRunning) {
        logger.warn("Analytics cleanup skipped (previous run still active)");
        return;
    }

    isAnalyticsCleanupRunning = true;

    try {
        const deleted = await analyticsRepo.deleteOldAnalytics(ANALYTICS_RETENTION_DAYS);
        logger.info({ msg: "Old analytics cleaned", deleted, retentionDays: ANALYTICS_RETENTION_DAYS });
    } catch (err) {
        logger.error({ msg: "Error cleaning analytics", error: err.message });
    } finally {
        isAnalyticsCleanupRunning = false;
    }
});
