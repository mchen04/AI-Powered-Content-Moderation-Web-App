const express = require('express');
const router = express.Router();
const externalApiController = require('../controllers/externalApiController');
const apiKeyMiddleware = require('../middleware/apiKey');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Stricter rate limiting for external API
const externalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each API key to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip, // Rate limit by API key
});

// Apply rate limiting to all external API routes
router.use(externalApiLimiter);

/**
 * @route POST /api/external/moderate-text
 * @desc Moderate text content using DeepSeek NLP (for external clients)
 * @access Private (requires API key)
 */
router.post('/moderate-text', apiKeyMiddleware.verifyApiKey, externalApiController.moderateText);

/**
 * @route POST /api/external/moderate-image
 * @desc Moderate image content using Google Cloud Vision (for external clients)
 * @access Private (requires API key)
 */
router.post('/moderate-image', 
  apiKeyMiddleware.verifyApiKey, 
  upload.single('image'), 
  externalApiController.moderateImage
);

/**
 * @route POST /api/external/moderate-image-url
 * @desc Moderate image from URL using Google Cloud Vision (for external clients)
 * @access Private (requires API key)
 */
router.post('/moderate-image-url', 
  apiKeyMiddleware.verifyApiKey, 
  externalApiController.moderateImageUrl
);

module.exports = router;