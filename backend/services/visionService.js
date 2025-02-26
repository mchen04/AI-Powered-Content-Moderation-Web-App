const { ImageAnnotatorClient } = require('@google-cloud/vision');
const axios = require('axios');

/**
 * Service for interacting with Google Cloud Vision API for image moderation
 */
class VisionService {
  constructor() {
    // Initialize Google Cloud Vision client
    this.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    this.client = new ImageAnnotatorClient({
      credentials: { client_email: null, private_key: null },
      projectId: 'content-moderation-app',
    });
  }

  /**
   * Moderate image content using Google Cloud Vision
   * @param {Buffer} imageBuffer - The image buffer to analyze
   * @param {Object} settings - User settings for moderation sensitivity
   * @returns {Promise<Object>} - Moderation results
   */
  async moderateImage(imageBuffer, settings = {}) {
    try {
      // Default settings if not provided
      const moderationSettings = {
        adult_threshold: settings.adult_threshold || 'POSSIBLE',
        violence_threshold: settings.violence_threshold || 'POSSIBLE',
        medical_threshold: settings.medical_threshold || 'LIKELY',
        spoof_threshold: settings.spoof_threshold || 'LIKELY',
        categories: settings.categories || ['adult', 'violence', 'medical', 'spoof']
      };

      // Call Google Cloud Vision API
      const [result] = await this.client.safeSearchDetection({
        image: { content: imageBuffer.toString('base64') },
        imageContext: {
          webDetectionParams: {
            includeGeoResults: false
          }
        }
      });

      const safeSearchAnnotation = result.safeSearchAnnotation;
      
      // Process results based on user thresholds
      const processedResults = this._processResults(safeSearchAnnotation, moderationSettings);
      
      // Check for logos or copyright issues if enabled
      let logoResults = null;
      if (settings.check_copyright) {
        logoResults = await this._detectLogos(imageBuffer);
      }
      
      return {
        moderation_results: processedResults,
        logo_detection: logoResults,
        flagged: this._isFlagged(processedResults),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Google Cloud Vision API error:', error);
      throw new Error('Failed to moderate image content');
    }
  }

  /**
   * Moderate image from URL using Google Cloud Vision
   * @param {string} imageUrl - The URL of the image to analyze
   * @param {Object} settings - User settings for moderation sensitivity
   * @returns {Promise<Object>} - Moderation results
   */
  async moderateImageUrl(imageUrl, settings = {}) {
    try {
      // Download image from URL
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');
      
      // Use the existing moderateImage method
      return this.moderateImage(imageBuffer, settings);
    } catch (error) {
      console.error('Error fetching image from URL:', error);
      throw new Error('Failed to fetch and moderate image from URL');
    }
  }

  /**
   * Detect logos in an image
   * @param {Buffer} imageBuffer - The image buffer to analyze
   * @returns {Promise<Array>} - Detected logos
   * @private
   */
  async _detectLogos(imageBuffer) {
    try {
      const [result] = await this.client.logoDetection({
        image: { content: imageBuffer.toString('base64') }
      });
      
      const logos = result.logoAnnotations || [];
      
      return logos.map(logo => ({
        description: logo.description,
        confidence: logo.score
      }));
    } catch (error) {
      console.error('Logo detection error:', error);
      return null;
    }
  }

  /**
   * Process raw API results based on user thresholds
   * @param {Object} annotation - Safe search annotation
   * @param {Object} settings - User settings
   * @returns {Object} - Processed results
   * @private
   */
  _processResults(annotation, settings) {
    const processed = {};
    const thresholdMap = {
      'VERY_UNLIKELY': 1,
      'UNLIKELY': 2,
      'POSSIBLE': 3,
      'LIKELY': 4,
      'VERY_LIKELY': 5
    };
    
    // Process each category based on user thresholds
    if (settings.categories.includes('adult')) {
      const threshold = thresholdMap[settings.adult_threshold];
      processed.adult = {
        flagged: thresholdMap[annotation.adult] >= threshold,
        likelihood: annotation.adult,
        score: thresholdMap[annotation.adult] / 5 // Normalize to 0-1
      };
    }
    
    if (settings.categories.includes('violence')) {
      const threshold = thresholdMap[settings.violence_threshold];
      processed.violence = {
        flagged: thresholdMap[annotation.violence] >= threshold,
        likelihood: annotation.violence,
        score: thresholdMap[annotation.violence] / 5 // Normalize to 0-1
      };
    }
    
    if (settings.categories.includes('medical')) {
      const threshold = thresholdMap[settings.medical_threshold];
      processed.medical = {
        flagged: thresholdMap[annotation.medical] >= threshold,
        likelihood: annotation.medical,
        score: thresholdMap[annotation.medical] / 5 // Normalize to 0-1
      };
    }
    
    if (settings.categories.includes('spoof')) {
      const threshold = thresholdMap[settings.spoof_threshold];
      processed.spoof = {
        flagged: thresholdMap[annotation.spoof] >= threshold,
        likelihood: annotation.spoof,
        score: thresholdMap[annotation.spoof] / 5 // Normalize to 0-1
      };
    }
    
    return processed;
  }

  /**
   * Check if any category was flagged
   * @param {Object} results - Processed results
   * @returns {boolean} - Whether content was flagged
   * @private
   */
  _isFlagged(results) {
    return Object.values(results).some(category => category.flagged);
  }
}

module.exports = new VisionService();