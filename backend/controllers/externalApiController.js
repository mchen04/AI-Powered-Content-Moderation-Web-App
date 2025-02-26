const openaiService = require('../services/openaiService');
const visionService = require('../services/visionService');
const supabaseService = require('../services/supabaseService');

/**
 * Controller for external API functionality
 */
const externalApiController = {
  /**
   * Moderate text content using OpenAI (for external clients)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  moderateText: async (req, res) => {
    try {
      const { text, settings } = req.body;
      const userId = req.apiKey.userId;
      
      // Validate input
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content is required' });
      }
      
      // Get user settings for moderation sensitivity
      const userSettings = await supabaseService.getUserSettings(userId);
      
      // Merge default settings with any provided settings
      const moderationSettings = {
        toxicity_threshold: settings?.toxicity_threshold || userSettings.toxicity_threshold,
        bias_threshold: settings?.bias_threshold || userSettings.bias_threshold,
        misinformation_threshold: settings?.misinformation_threshold || userSettings.misinformation_threshold,
        categories: settings?.categories || userSettings.enabled_categories
      };
      
      // Moderate text using OpenAI
      const moderationResults = await openaiService.moderateText(text, moderationSettings);
      
      // Save moderation log to Supabase
      await supabaseService.saveTextModerationLog(userId, moderationResults);
      
      // Return moderation results
      return res.status(200).json(moderationResults);
    } catch (error) {
      console.error('External API text moderation error:', error);
      return res.status(500).json({ error: 'Failed to moderate text content' });
    }
  },
  
  /**
   * Moderate image content using Google Cloud Vision (for external clients)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  moderateImage: async (req, res) => {
    try {
      const { settings } = req.body;
      const userId = req.apiKey.userId;
      
      // Check if image was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
      }
      
      // Get user settings for moderation sensitivity
      const userSettings = await supabaseService.getUserSettings(userId);
      
      // Merge default settings with any provided settings
      const moderationSettings = {
        adult_threshold: settings?.adult_threshold || userSettings.adult_threshold,
        violence_threshold: settings?.violence_threshold || userSettings.violence_threshold,
        medical_threshold: settings?.medical_threshold || userSettings.medical_threshold,
        spoof_threshold: settings?.spoof_threshold || userSettings.spoof_threshold,
        check_copyright: settings?.check_copyright !== undefined ? settings.check_copyright : userSettings.check_copyright,
        categories: settings?.categories || userSettings.enabled_categories
      };
      
      // Moderate image using Google Cloud Vision
      const moderationResults = await visionService.moderateImage(req.file.buffer, moderationSettings);
      
      // Save moderation log to Supabase
      await supabaseService.saveImageModerationLog(userId, moderationResults);
      
      // Return moderation results
      return res.status(200).json(moderationResults);
    } catch (error) {
      console.error('External API image moderation error:', error);
      return res.status(500).json({ error: 'Failed to moderate image content' });
    }
  },
  
  /**
   * Moderate image from URL using Google Cloud Vision (for external clients)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  moderateImageUrl: async (req, res) => {
    try {
      const { imageUrl, settings } = req.body;
      const userId = req.apiKey.userId;
      
      // Validate input
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ error: 'Image URL is required' });
      }
      
      // Get user settings for moderation sensitivity
      const userSettings = await supabaseService.getUserSettings(userId);
      
      // Merge default settings with any provided settings
      const moderationSettings = {
        adult_threshold: settings?.adult_threshold || userSettings.adult_threshold,
        violence_threshold: settings?.violence_threshold || userSettings.violence_threshold,
        medical_threshold: settings?.medical_threshold || userSettings.medical_threshold,
        spoof_threshold: settings?.spoof_threshold || userSettings.spoof_threshold,
        check_copyright: settings?.check_copyright !== undefined ? settings.check_copyright : userSettings.check_copyright,
        categories: settings?.categories || userSettings.enabled_categories
      };
      
      // Moderate image using Google Cloud Vision
      const moderationResults = await visionService.moderateImageUrl(imageUrl, moderationSettings);
      
      // Save moderation log to Supabase
      await supabaseService.saveImageModerationLog(userId, moderationResults, imageUrl);
      
      // Return moderation results
      return res.status(200).json(moderationResults);
    } catch (error) {
      console.error('External API image URL moderation error:', error);
      return res.status(500).json({ error: 'Failed to moderate image from URL' });
    }
  }
};

module.exports = externalApiController;