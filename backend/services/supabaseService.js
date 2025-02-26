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
      // Check if the table exists first
      const { error: tableError } = await this.supabase
        .from('user_settings')
        .select('count')
        .limit(1);
      
      // If the table doesn't exist, return default settings
      if (tableError && tableError.code === '42P01') {
        console.log('User settings table does not exist, using default settings');
        return this._getDefaultSettings(userId);
      }
      
      // If the table exists, try to get the user's settings
      const { data, error } = await this.supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "No rows returned" which is fine, we'll use defaults
        console.error('Error fetching user settings:', error);
      }
      
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
      // Check if the table exists first
      const { error: tableError } = await this.supabase
        .from('user_settings')
        .select('count')
        .limit(1);
      
      // If the table doesn't exist, return default settings with updates applied
      if (tableError && tableError.code === '42P01') {
        console.log('User settings table does not exist, using default settings with updates');
        const defaultSettings = this._getDefaultSettings(userId);
        return { ...defaultSettings, ...settings };
      }
      
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
        
        if (error) {
          console.error('Error updating user settings:', error);
          return { ...this._getDefaultSettings(userId), ...settings };
        }
        result = data;
      } else {
        // Insert new settings
        const { data, error } = await this.supabase
          .from('user_settings')
          .insert({ ...settings, user_id: userId })
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting user settings:', error);
          return { ...this._getDefaultSettings(userId), ...settings };
        }
        result = data;
      }
      
      return result;
    } catch (error) {
      console.error('Error updating user settings:', error);
      // Return default settings with updates applied instead of throwing an error
      return { ...this._getDefaultSettings(userId), ...settings };
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
      // Check if the table exists first
      const { error: tableError } = await this.supabase
        .from('moderation_logs')
        .select('count')
        .limit(1);
      
      // If the table doesn't exist, return a mock response
      if (tableError && tableError.code === '42P01') {
        console.log('Moderation logs table does not exist, skipping log save');
        return this._createMockLogEntry(userId, 'text', moderationData);
      }
      
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
      
      if (error) {
        console.error('Error inserting text moderation log:', {
          error,
          message: error.message,
          code: error.code
        });
        return this._createMockLogEntry(userId, 'text', moderationData);
      }
      
      return data;
    } catch (error) {
      console.error('Error saving text moderation log:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Return a mock response to allow the moderation to work
      return this._createMockLogEntry(userId, 'text', moderationData);
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
      // Check if the table exists first
      const { error: tableError } = await this.supabase
        .from('moderation_logs')
        .select('count')
        .limit(1);
      
      // If the table doesn't exist, return a mock response
      if (tableError && tableError.code === '42P01') {
        console.log('Moderation logs table does not exist, skipping log save');
        return this._createMockLogEntry(userId, 'image', moderationData);
      }
      
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
      
      if (error) {
        console.error('Error inserting image moderation log:', {
          error,
          message: error.message,
          code: error.code
        });
        return this._createMockLogEntry(userId, 'image', moderationData);
      }
      
      return data;
    } catch (error) {
      console.error('Error saving image moderation log:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Return a mock response to allow the moderation to work
      return this._createMockLogEntry(userId, 'image', moderationData);
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
      // Check if the table exists first
      const { error: tableError } = await this.supabase
        .from('moderation_logs')
        .select('count')
        .limit(1);
      
      // If the table doesn't exist, return empty logs
      if (tableError && tableError.code === '42P01') {
        console.log('Moderation logs table does not exist, returning empty logs');
        return {
          logs: [],
          pagination: {
            total: 0,
            page,
            pageSize,
            totalPages: 0
          }
        };
      }
      
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
      
      if (error) {
        console.error('Error executing moderation logs query:', error);
        return {
          logs: [],
          pagination: {
            total: 0,
            page,
            pageSize,
            totalPages: 0
          }
        };
      }
      
      return {
        logs: data || [],
        pagination: {
          total: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      };
    } catch (error) {
      console.error('Error fetching moderation logs:', error);
      // Return empty logs instead of throwing an error
      return {
        logs: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          totalPages: 0
        }
      };
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

  /**
   * Create a mock log entry when database operations fail
   * @param {string} userId - The user ID
   * @param {string} contentType - The content type (text or image)
   * @param {Object} moderationData - The moderation data
   * @returns {Object} - Mock log entry
   * @private
   */
  _createMockLogEntry(userId, contentType, moderationData) {
    return {
      id: 'temp-id-' + Date.now(),
      user_id: userId,
      content_type: contentType,
      content: contentType === 'text' ? moderationData.original_text : null,
      moderation_results: moderationData.moderation_results,
      flagged: moderationData.flagged,
      created_at: new Date().toISOString()
    };
  }
}

module.exports = new SupabaseService();
