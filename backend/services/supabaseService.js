const { createClient } = require('@supabase/supabase-js');

/**
 * Service for interacting with Supabase for database operations
 */
class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  /**
   * Get user settings from Supabase
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - User settings
   */
  async getUserSettings(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      return data || this._getDefaultSettings(userId);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return this._getDefaultSettings(userId);
    }
  }

  /**
   * Update user settings in Supabase
   * @param {string} userId - The user ID
   * @param {Object} settings - The settings to update
   * @returns {Promise<Object>} - Updated settings
   */
  async updateUserSettings(userId, settings) {
    try {
      // Check if settings exist for this user
      const { data: existingSettings } = await this.supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      let result;
      
      if (existingSettings) {
        // Update existing settings
        const { data, error } = await this.supabase
          .from('user_settings')
          .update(settings)
          .eq('user_id', userId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new settings
        const { data, error } = await this.supabase
          .from('user_settings')
          .insert({ ...settings, user_id: userId })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      return result;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw new Error('Failed to update user settings');
    }
  }

  /**
   * Save text moderation log to Supabase
   * @param {string} userId - The user ID
   * @param {Object} moderationData - The moderation data to save
   * @returns {Promise<Object>} - Saved log entry
   */
  async saveTextModerationLog(userId, moderationData) {
    try {
      const logEntry = {
        user_id: userId,
        content_type: 'text',
        content: moderationData.original_text,
        moderation_results: moderationData.moderation_results,
        flagged: moderationData.flagged,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await this.supabase
        .from('moderation_logs')
        .insert(logEntry)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error saving text moderation log:', error);
      throw new Error('Failed to save text moderation log');
    }
  }

  /**
   * Save image moderation log to Supabase
   * @param {string} userId - The user ID
   * @param {Object} moderationData - The moderation data to save
   * @param {string} imageUrl - URL to the stored image (if applicable)
   * @returns {Promise<Object>} - Saved log entry
   */
  async saveImageModerationLog(userId, moderationData, imageUrl = null) {
    try {
      const logEntry = {
        user_id: userId,
        content_type: 'image',
        content: imageUrl,
        moderation_results: moderationData.moderation_results,
        logo_detection: moderationData.logo_detection,
        flagged: moderationData.flagged,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await this.supabase
        .from('moderation_logs')
        .insert(logEntry)
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error saving image moderation log:', error);
      throw new Error('Failed to save image moderation log');
    }
  }

  /**
   * Get moderation logs for a user
   * @param {string} userId - The user ID
   * @param {Object} filters - Optional filters (content_type, flagged, date range)
   * @param {number} page - Page number for pagination
   * @param {number} pageSize - Number of items per page
   * @returns {Promise<Object>} - Moderation logs with pagination info
   */
  async getModerationLogs(userId, filters = {}, page = 1, pageSize = 10) {
    try {
      let query = this.supabase
        .from('moderation_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Apply filters if provided
      if (filters.content_type) {
        query = query.eq('content_type', filters.content_type);
      }
      
      if (filters.flagged !== undefined) {
        query = query.eq('flagged', filters.flagged);
      }
      
      if (filters.from_date) {
        query = query.gte('created_at', filters.from_date);
      }
      
      if (filters.to_date) {
        query = query.lte('created_at', filters.to_date);
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        logs: data,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize)
        }
      };
    } catch (error) {
      console.error('Error fetching moderation logs:', error);
      throw new Error('Failed to fetch moderation logs');
    }
  }

  /**
   * Create API key for external access
   * @param {string} userId - The user ID
   * @param {string} name - Name/description for the API key
   * @param {number} rateLimit - Rate limit for this key (requests per minute)
   * @returns {Promise<Object>} - Created API key
   */
  async createApiKey(userId, name, rateLimit = 60) {
    try {
      // Generate a random API key
      const apiKey = this._generateApiKey();
      
      const { data, error } = await this.supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          key: apiKey,
          name,
          rate_limit: rateLimit,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw new Error('Failed to create API key');
    }
  }

  /**
   * Get default user settings
   * @param {string} userId - The user ID
   * @returns {Object} - Default settings
   * @private
   */
  _getDefaultSettings(userId) {
    return {
      user_id: userId,
      toxicity_threshold: 0.7,
      bias_threshold: 0.7,
      misinformation_threshold: 0.7,
      adult_threshold: 'POSSIBLE',
      violence_threshold: 'POSSIBLE',
      medical_threshold: 'LIKELY',
      spoof_threshold: 'LIKELY',
      check_copyright: true,
      enabled_categories: ['toxicity', 'bias', 'misinformation', 'adult', 'violence'],
      theme: 'light',
      notifications_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Generate a random API key
   * @returns {string} - Random API key
   * @private
   */
  _generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const segments = [16, 16, 16, 16];
    
    const key = segments.map(length => {
      let segment = '';
      for (let i = 0; i < length; i++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return segment;
    }).join('-');
    
    return key;
  }
}

module.exports = new SupabaseService();
