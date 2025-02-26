const visionService = require('../services/visionService');
const supabaseService = require('../services/supabaseService');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for storage
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Controller for image moderation functionality
 */
const imageModerationController = {
  /**
   * Moderate uploaded image using Google Cloud Vision
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  moderateImage: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Check if image was uploaded
      if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
      }
      
      // Get user settings for moderation sensitivity
      const userSettings = await supabaseService.getUserSettings(userId);
      
      // Moderate image using Google Cloud Vision
      const moderationResults = await visionService.moderateImage(req.file.buffer, {
        adult_threshold: userSettings.adult_threshold,
        violence_threshold: userSettings.violence_threshold,
        medical_threshold: userSettings.medical_threshold,
        spoof_threshold: userSettings.spoof_threshold,
        check_copyright: userSettings.check_copyright,
        categories: userSettings.enabled_categories
      });
      
      // Store image in Supabase Storage if flagged content is detected
      let imageUrl = null;
      if (moderationResults.flagged) {
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `${userId}-${timestamp}.jpg`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('moderated-images')
          .upload(`${userId}/${filename}`, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });
        
        if (!error) {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('moderated-images')
            .getPublicUrl(`${userId}/${filename}`);
          
          imageUrl = urlData.publicUrl;
        }
      }
      
      // Save moderation log to Supabase
      await supabaseService.saveImageModerationLog(userId, moderationResults, imageUrl);
      
      // Return moderation results
      return res.status(200).json({
        ...moderationResults,
        image_url: imageUrl
      });
    } catch (error) {
      console.error('Image moderation error:', error);
      return res.status(500).json({ error: 'Failed to moderate image content' });
    }
  },
  
  /**
   * Moderate image from URL using Google Cloud Vision
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  moderateImageUrl: async (req, res) => {
    try {
      const { imageUrl } = req.body;
      const userId = req.user.id;
      
      // Validate input
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ error: 'Image URL is required' });
      }
      
      // Get user settings for moderation sensitivity
      const userSettings = await supabaseService.getUserSettings(userId);
      
      // Moderate image using Google Cloud Vision
      const moderationResults = await visionService.moderateImageUrl(imageUrl, {
        adult_threshold: userSettings.adult_threshold,
        violence_threshold: userSettings.violence_threshold,
        medical_threshold: userSettings.medical_threshold,
        spoof_threshold: userSettings.spoof_threshold,
        check_copyright: userSettings.check_copyright,
        categories: userSettings.enabled_categories
      });
      
      // Save moderation log to Supabase
      await supabaseService.saveImageModerationLog(userId, moderationResults, imageUrl);
      
      // Return moderation results
      return res.status(200).json({
        ...moderationResults,
        image_url: imageUrl
      });
    } catch (error) {
      console.error('Image URL moderation error:', error);
      return res.status(500).json({ error: 'Failed to moderate image from URL' });
    }
  },
  
  /**
   * Get user's image moderation history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getImageModerationHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, pageSize = 10, flagged, from_date, to_date } = req.query;
      
      // Get moderation logs from Supabase
      const logs = await supabaseService.getModerationLogs(
        userId,
        {
          content_type: 'image',
          flagged: flagged === 'true',
          from_date,
          to_date
        },
        parseInt(page),
        parseInt(pageSize)
      );
      
      return res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching image moderation history:', error);
      return res.status(500).json({ error: 'Failed to fetch image moderation history' });
    }
  }
};

module.exports = imageModerationController;