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
      
      // Fetch updated API keys list
      const apiKeys = await supabaseService.getUserApiKeys(userId);
      
      return res.status(201).json({
        message: 'API key created successfully',
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key,
          rate_limit: apiKey.rate_limit,
          is_active: apiKey.is_active,
          created_at: apiKey.created_at
        },
        apiKeys: apiKeys // Include the updated list of API keys
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      return res.status(500).json({ error: 'Failed to create API key' });
    }
  },

  /**
   * Get user's API keys
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserApiKeys: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user's API keys
      const apiKeys = await supabaseService.getUserApiKeys(userId);
      
      return res.status(200).json(apiKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return res.status(500).json({ error: 'Failed to fetch API keys' });
    }
  },

  /**
   * Update API key
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateApiKey: async (req, res) => {
    try {
      const userId = req.user.id;
      const { keyId } = req.params;
      const { name, is_active } = req.body;
      
      // Validate input
      if (!keyId) {
        return res.status(400).json({ error: 'API key ID is required' });
      }
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'API key name is required' });
      }
      
      // Update API key
      const updates = {
        name,
        is_active: is_active !== undefined ? is_active : true
      };
      
      const updatedKey = await supabaseService.updateApiKey(userId, keyId, updates);
      
      if (!updatedKey) {
        return res.status(404).json({ error: 'API key not found or does not belong to user' });
      }
      
      return res.status(200).json({
        message: 'API key updated successfully',
        apiKey: updatedKey
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      return res.status(500).json({ error: 'Failed to update API key' });
    }
  },

  /**
   * Delete API key
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteApiKey: async (req, res) => {
    try {
      const userId = req.user.id;
      const { keyId } = req.params;
      
      // Validate input
      if (!keyId) {
        return res.status(400).json({ error: 'API key ID is required' });
      }
      
      // Delete API key
      const success = await supabaseService.deleteApiKey(userId, keyId);
      
      if (!success) {
        return res.status(404).json({ error: 'API key not found or does not belong to user' });
      }
      
      return res.status(200).json({
        message: 'API key deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      return res.status(500).json({ error: 'Failed to delete API key' });
    }
  }
};

module.exports = userSettingsController;