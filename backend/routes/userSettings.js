const express = require('express');
const router = express.Router();
const userSettingsController = require('../controllers/userSettingsController');
const authMiddleware = require('../middleware/auth');

/**
 * @route GET /api/settings
 * @desc Get user settings
 * @access Private (requires authentication)
 */
router.get('/', authMiddleware.verifyToken, userSettingsController.getUserSettings);

/**
 * @route PUT /api/settings
 * @desc Update user settings
 * @access Private (requires authentication)
 */
router.put('/', authMiddleware.verifyToken, userSettingsController.updateUserSettings);

/**
 * @route GET /api/settings/categories
 * @desc Get available moderation categories
 * @access Private (requires authentication)
 */
router.get('/categories', authMiddleware.verifyToken, userSettingsController.getModerationCategories);

module.exports = router;