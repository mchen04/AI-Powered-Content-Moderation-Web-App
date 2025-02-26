const express = require('express');
const router = express.Router();
const imageModerationController = require('../controllers/imageModerationController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * @route POST /api/moderate-image
 * @desc Moderate image content using Google Cloud Vision
 * @access Private (requires authentication)
 */
router.post('/', 
  authMiddleware.verifyToken, 
  upload.single('image'), 
  imageModerationController.moderateImage
);

/**
 * @route POST /api/moderate-image/url
 * @desc Moderate image from URL using Google Cloud Vision
 * @access Private (requires authentication)
 */
router.post('/url', 
  authMiddleware.verifyToken, 
  imageModerationController.moderateImageUrl
);

/**
 * @route GET /api/moderate-image/history
 * @desc Get user's image moderation history
 * @access Private (requires authentication)
 */
router.get('/history', 
  authMiddleware.verifyToken, 
  imageModerationController.getImageModerationHistory
);

module.exports = router;