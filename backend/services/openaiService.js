const axios = require('axios');

/**
 * Service for interacting with OpenAI API for text moderation
 */
class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
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

      // Use OpenAI's moderation endpoint which is cost-effective and specifically designed for content moderation
      const moderationResponse = await this.client.post('/moderations', {
        input: text
      });

      const moderationResults = moderationResponse.data.results[0];
      
      // Check for misinformation if enabled
      let misinformationResult = null;
      if (settings.categories.includes('misinformation')) {
        misinformationResult = await this.checkMisinformation(text);
      }
      
      // Process the moderation results
      const processedResults = this._processResults(
        moderationResults,
        moderationSettings,
        misinformationResult
      );
      
      return {
        original_text: text,
        moderation_results: processedResults,
        flagged: this._isFlagged(processedResults),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('OpenAI API error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        stack: error.stack
      });
      throw new Error(`Failed to moderate text content: ${error.message}`);
    }
  }

  /**
   * Check text for misinformation using GPT model
   * @param {string} text - The text to check for misinformation
   * @returns {Promise<Object>} - Misinformation analysis results
   */
  async checkMisinformation(text) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a fact-checking assistant. Analyze the following text for potential misinformation,
            factual inaccuracies, or misleading claims. Provide a score from 0 to 1 where 0 means no misinformation
            and 1 means definite misinformation. Also provide a brief explanation of your reasoning.
            
            Format your response as a JSON object with the following structure:
            {
              "score": 0.7, // A number between 0 and 1
              "explanation": "Brief explanation of why this might contain misinformation"
            }`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1
      });

      // Parse the response to extract the JSON
      const content = response.data.choices[0].message.content;
      let result;
      
      try {
        // Try to parse the JSON from the response
        result = JSON.parse(content);
      } catch (e) {
        // If parsing fails, extract JSON using regex
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to default values
          result = { score: 0.3, explanation: "Unable to analyze for misinformation." };
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error checking misinformation:', error);
      // Return a default result if the API call fails
      return { score: 0.3, explanation: "Error analyzing for misinformation." };
    }
  }

  /**
   * Process results from OpenAI moderation API
   * @param {Object} moderationResults - Results from moderation API
   * @param {Object} settings - User settings
   * @param {Object} misinformationResult - Results from misinformation analysis
   * @returns {Object} - Processed results
   * @private
   */
  _processResults(moderationResults, settings, misinformationResult = null) {
    const processed = {};
    
    // Map OpenAI moderation categories to our application categories
    if (settings.categories.includes('toxicity')) {
      const toxicityScore = Math.max(
        moderationResults.categories.harassment || 0,
        moderationResults.categories.hate || 0,
        moderationResults.categories.self_harm || 0,
        moderationResults.categories.sexual || 0,
        moderationResults.categories.violence || 0
      );
      
      processed.toxicity = {
        flagged: toxicityScore >= settings.toxicity_threshold,
        score: toxicityScore,
        explanation: this._generateExplanation(moderationResults, 'toxicity')
      };
    }
    
    // For bias and misinformation, we'll use the harassment and hate scores as proxies
    // since OpenAI's moderation endpoint doesn't directly address these
    if (settings.categories.includes('bias')) {
      const biasScore = moderationResults.categories.hate || 0;
      
      processed.bias = {
        flagged: biasScore >= settings.bias_threshold,
        score: biasScore,
        explanation: biasScore >= settings.bias_threshold ?
          "Content may contain biased language or perspectives." : null
      };
    }
    
    if (settings.categories.includes('misinformation')) {
      // Use the misinformation analysis result if available
      if (misinformationResult) {
        const misinformationScore = misinformationResult.score;
        
        processed.misinformation = {
          flagged: misinformationScore >= settings.misinformation_threshold,
          score: misinformationScore,
          explanation: misinformationResult.explanation
        };
      } else {
        // Fallback to default behavior if no misinformation analysis is available
        const misinformationScore = 0.3; // Default lower score
        
        processed.misinformation = {
          flagged: misinformationScore >= settings.misinformation_threshold,
          score: misinformationScore,
          explanation: misinformationScore >= settings.misinformation_threshold ?
            "Content may contain potentially misleading information." : null
        };
      }
    }
    
    return processed;
  }
  
  /**
   * Generate explanation based on moderation results
   * @param {Object} moderationResults - Results from moderation API
   * @param {string} category - Category to generate explanation for
   * @returns {string|null} - Explanation or null if not flagged
   * @private
   */
  _generateExplanation(moderationResults, category) {
    const categories = moderationResults.categories;
    const explanations = [];
    
    if (category === 'toxicity') {
      if (categories.harassment) explanations.push("Content may contain harassment.");
      if (categories.hate) explanations.push("Content may contain hate speech.");
      if (categories.self_harm) explanations.push("Content may reference self-harm.");
      if (categories.sexual) explanations.push("Content may contain sexual content.");
      if (categories.violence) explanations.push("Content may contain violent content.");
    }
    
    return explanations.length > 0 ? explanations.join(" ") : null;
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

module.exports = new OpenAIService();