const { ImageAnnotatorClient } = require('@google-cloud/vision');
const axios = require('axios');

/**
 * Service for interacting with Google Cloud Vision API for image moderation
 */
class VisionService {
  constructor() {
    // Initialize with API key
    this.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    this.baseUrl = 'https://vision.googleapis.com/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      params: {
        key: this.apiKey
      }
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

      // Call Google Cloud Vision API using REST
      const response = await this.client.post('/images:annotate', {
        requests: [{
          image: {
            content: imageBuffer.toString('base64')
          },
          features: [
            { type: 'SAFE_SEARCH_DETECTION' },
            { type: 'LOGO_DETECTION', maxResults: 10 }
          ]
        }]
      });

      // Extract safe search annotation
      const safeSearchAnnotation = response.data.responses[0].safeSearchAnnotation;
      
      // Process results based on user thresholds
      const processedResults = this._processResults(safeSearchAnnotation, moderationSettings);
      
      // Check for logos or copyright issues if enabled
      let logoResults = null;
      if (settings.check_copyright && response.data.responses[0].logoAnnotations) {
        logoResults = response.data.responses[0].logoAnnotations.map(logo => ({
          description: logo.description,
          confidence: logo.score
        }));
      }
      
      return {
        moderation_results: processedResults,
        logo_detection: logoResults,
        flagged: this._isFlagged(processedResults),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Google Cloud Vision API error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        details: error.details
      });
      throw new Error(`Failed to moderate image content: ${error.message}`);
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
      // Default settings if not provided
      const moderationSettings = {
        adult_threshold: settings.adult_threshold || 'POSSIBLE',
        violence_threshold: settings.violence_threshold || 'POSSIBLE',
        medical_threshold: settings.medical_threshold || 'LIKELY',
        spoof_threshold: settings.spoof_threshold || 'LIKELY',
        categories: settings.categories || ['adult', 'violence', 'medical', 'spoof']
      };

      // Call Google Cloud Vision API using REST with image URL
      const response = await this.client.post('/images:annotate', {
        requests: [{
          image: {
            source: {
              imageUri: imageUrl
            }
          },
          features: [
            { type: 'SAFE_SEARCH_DETECTION' },
            { type: 'LOGO_DETECTION', maxResults: 10 }
          ]
        }]
      });

      // Extract safe search annotation
      const safeSearchAnnotation = response.data.responses[0].safeSearchAnnotation;
      
      // Process results based on user thresholds
      const processedResults = this._processResults(safeSearchAnnotation, moderationSettings);
      
      // Check for logos or copyright issues if enabled
      let logoResults = null;
      if (settings.check_copyright && response.data.responses[0].logoAnnotations) {
        logoResults = response.data.responses[0].logoAnnotations.map(logo => ({
          description: logo.description,
          confidence: logo.score
        }));
      }
      
      return {
        moderation_results: processedResults,
        logo_detection: logoResults,
        flagged: this._isFlagged(processedResults),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error moderating image from URL:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        details: error.details
      });
      throw new Error(`Failed to moderate image from URL: ${error.message}`);
    }
  }

  // Logo detection is now handled in the main API call

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