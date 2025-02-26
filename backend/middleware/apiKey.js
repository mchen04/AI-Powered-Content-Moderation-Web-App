const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Middleware to verify API key for external API access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyApiKey = async (req, res, next) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Unauthorized: No API key provided' });
    }
    
    // Verify API key against Supabase
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_id, is_active, rate_limit')
      .eq('key', apiKey)
      .single();
    
    if (error || !data) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }
    
    // Check if API key is active
    if (!data.is_active) {
      return res.status(403).json({ error: 'Forbidden: API key is inactive' });
    }
    
    // Add API key info to request object
    req.apiKey = {
      userId: data.user_id,
      rateLimit: data.rate_limit
    };
    
    next();
  } catch (error) {
    console.error('API key middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  verifyApiKey
};