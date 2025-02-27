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

/**
 * @route GET /api/settings/api-keys
 * @desc Get user's API keys
 * @access Private (requires authentication)
 */
router.get('/api-keys', authMiddleware.verifyToken, userSettingsController.getUserApiKeys);

/**
 * @route POST /api/settings/api-key
 * @desc Create API key for external access
 * @access Private (requires authentication)
 */
router.post('/api-key', authMiddleware.verifyToken, userSettingsController.createApiKey);

/**
 * @route PUT /api/settings/api-key/:keyId
 * @desc Update API key
 * @access Private (requires authentication)
 */
router.put('/api-key/:keyId', authMiddleware.verifyToken, userSettingsController.updateApiKey);

/**
 * @route DELETE /api/settings/api-key/:keyId
 * @desc Delete API key
 * @access Private (requires authentication)
 */
router.delete('/api-key/:keyId', authMiddleware.verifyToken, userSettingsController.deleteApiKey);

module.exports = router;