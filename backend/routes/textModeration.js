const express = require('express');
const router = express.Router();
const textModerationController = require('../controllers/textModerationController');
const authMiddleware = require('../middleware/auth');

/**
 * @route POST /api/moderate-text
 * @desc Moderate text content using DeepSeek NLP
 * @access Private (requires authentication)
 */
router.post('/', authMiddleware.verifyToken, textModerationController.moderateText);

/**
 * @route GET /api/moderate-text/history
 * @desc Get user's text moderation history
 * @access Private (requires authentication)
 */
router.get('/history', authMiddleware.verifyToken, textModerationController.getTextModerationHistory);

module.exports = router;