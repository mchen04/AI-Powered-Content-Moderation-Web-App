const openaiService = require('../services/openaiService');
const supabaseService = require('../services/supabaseService');

/**
 * Controller for text moderation functionality
 */
const textModerationController = {
  /**
   * Moderate text content using OpenAI
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  moderateText: async (req, res) => {
    try {
      const { text } = req.body;
      const userId = req.user.id;
      
      // Validate input
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content is required' });
      }
      
      // Get user settings for moderation sensitivity
      const userSettings = await supabaseService.getUserSettings(userId);
      
      // Moderate text using OpenAI
      const moderationResults = await openaiService.moderateText(text, {
        toxicity_threshold: userSettings.toxicity_threshold,
        bias_threshold: userSettings.bias_threshold,
        misinformation_threshold: userSettings.misinformation_threshold,
        categories: userSettings.enabled_categories
      });
      
      // Save moderation log to Supabase
      await supabaseService.saveTextModerationLog(userId, moderationResults);
      
      // Return moderation results
      return res.status(200).json(moderationResults);
    } catch (error) {
      console.error('Text moderation error:', error);
      return res.status(500).json({ error: 'Failed to moderate text content' });
    }
  },
  
  /**
   * Get user's text moderation history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getTextModerationHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 10, flagged, from_date, to_date } = req.query;
      
      // Get moderation logs from Supabase
      const logs = await supabaseService.getModerationLogs(
        userId,
        {
          content_type: 'text',
          flagged: flagged === 'true',
          from_date,
          to_date
        },
        parseInt(page),
        parseInt(pageSize)
      );
      
      return res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching text moderation history:', error);
      return res.status(500).json({ error: 'Failed to fetch text moderation history' });
    }
  }
};

module.exports = textModerationController;