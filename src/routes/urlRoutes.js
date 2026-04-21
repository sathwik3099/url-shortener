const express = require('express');
const router = express.Router();
const controller = require('../controllers/urlController');

// Create short URL
router.post('/shorten', controller.createShortUrl);

// Analytics -> must come before /:shortCode
router.get('/analytics/:shortCode', controller.getAnalytics);

// Delete URL
router.delete('/:shortCode', controller.deleteUrl);

// Redirect (keep LAST to avoid route conflicts)
router.get('/:shortCode', controller.redirectUrl);

module.exports = router;
