const supabaseService = require('../services/supabaseService');

/**
 * Controller for user settings functionality
 */
const userSettingsController = {
  /**
   * Get user settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user settings from Supabase
      const settings = await supabaseService.getUserSettings(userId);
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  },
  
  /**
   * Update user settings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateUserSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const updatedSettings = req.body;
      
      // Validate settings
      if (!updatedSettings || typeof updatedSettings !== 'object') {
        return res.status(400).json({ error: 'Invalid settings data' });
      }
      
      // Add updated_at timestamp
      updatedSettings.updated_at = new Date().toISOString();
      
      // Update user settings in Supabase
      const settings = await supabaseService.updateUserSettings(userId, updatedSettings);
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error updating user settings:', error);
      return res.status(500).json({ error: 'Failed to update user settings' });
    }
  },
  
  /**
   * Get available moderation categories
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getModerationCategories: async (req, res) => {
    try {
      // Define available categories
      const categories = {
        text: [
          { id: 'toxicity', name: 'Toxicity', description: 'Detect rude, disrespectful, or unreasonable language' },
          { id: 'bias', name: 'Bias', description: 'Detect prejudiced or unfair content' },
          { id: 'misinformation', name: 'Misinformation', description: 'Detect false or misleading information' }
        ],
        image: [
          { id: 'adult', name: 'Adult Content', description: 'Detect adult or explicit content' },
          { id: 'violence', name: 'Violence', description: 'Detect violent content or imagery' },
          { id: 'medical', name: 'Medical', description: 'Detect medical imagery or content' },
          { id: 'spoof', name: 'Spoof', description: 'Detect spoofed or altered content' }
        ]
      };
      
      return res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching moderation categories:', error);
      return res.status(500).json({ error: 'Failed to fetch moderation categories' });
    }
  },
  
  /**
   * Create API key for external access
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createApiKey: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name } = req.body;
      
      // Validate input
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'API key name is required' });
      }
      
      // Set rate limit to 1 request per hour
      const rateLimit = 1;
      
      // Create API key
      const apiKey = await supabaseService.createApiKey(userId, name, rateLimit);
      
      return res.status(201).json({
        message: 'API key created successfully',
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key,
          rate_limit: apiKey.rate_limit,
          is_active: apiKey.is_active,
          created_at: apiKey.created_at
        }
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      return res.status(500).json({ error: 'Failed to create API key' });
    }
  }
};

module.exports = userSettingsController;