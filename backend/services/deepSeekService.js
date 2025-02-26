const axios = require('axios');

/**
 * Service for interacting with DeepSeek NLP API for text moderation
 */
class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = 'https://api.deepseek.com/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Moderate text content for toxicity, bias, and misinformation
   * @param {string} text - The text content to moderate
   * @param {Object} settings - User settings for moderation sensitivity
   * @returns {Promise<Object>} - Moderation results
   */
  async moderateText(text, settings = {}) {
    try {
      // Default settings if not provided
      const moderationSettings = {
        toxicity_threshold: settings.toxicity_threshold || 0.7,
        bias_threshold: settings.bias_threshold || 0.7,
        misinformation_threshold: settings.misinformation_threshold || 0.7,
        categories: settings.categories || ['toxicity', 'bias', 'misinformation']
      };

      // Construct the prompt for DeepSeek
      const prompt = `
        Please analyze the following text for content moderation:
        
        Text: "${text}"
        
        Analyze for the following categories: ${moderationSettings.categories.join(', ')}.
        
        For each category, provide:
        1. A boolean flag indicating if the content violates that category
        2. A confidence score between 0 and 1
        3. A brief explanation of why the content was flagged (if applicable)
        
        Return the results in a structured JSON format.
      `;

      // Call DeepSeek API
      const response = await this.client.post('/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a content moderation assistant that analyzes text for toxicity, bias, and misinformation.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Low temperature for more deterministic results
        response_format: { type: 'json_object' }
      });

      // Parse the response
      const result = JSON.parse(response.data.choices[0].message.content);
      
      // Process results based on user thresholds
      const processedResults = this._processResults(result, moderationSettings);
      
      return {
        original_text: text,
        moderation_results: processedResults,
        flagged: this._isFlagged(processedResults),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('DeepSeek API error:', error.response?.data || error.message);
      throw new Error('Failed to moderate text content');
    }
  }

  /**
   * Process raw API results based on user thresholds
   * @param {Object} results - Raw API results
   * @param {Object} settings - User settings
   * @returns {Object} - Processed results
   * @private
   */
  _processResults(results, settings) {
    const processed = {};
    
    // Process each category based on user thresholds
    if (results.toxicity && settings.categories.includes('toxicity')) {
      processed.toxicity = {
        flagged: results.toxicity.score >= settings.toxicity_threshold,
        score: results.toxicity.score,
        explanation: results.toxicity.explanation || null
      };
    }
    
    if (results.bias && settings.categories.includes('bias')) {
      processed.bias = {
        flagged: results.bias.score >= settings.bias_threshold,
        score: results.bias.score,
        explanation: results.bias.explanation || null
      };
    }
    
    if (results.misinformation && settings.categories.includes('misinformation')) {
      processed.misinformation = {
        flagged: results.misinformation.score >= settings.misinformation_threshold,
        score: results.misinformation.score,
        explanation: results.misinformation.explanation || null
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

module.exports = new DeepSeekService();