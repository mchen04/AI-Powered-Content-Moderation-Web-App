import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config';
import './TextModeration.css';

/**
 * TextModeration component
 * Handles text content moderation functionality
 */
const TextModeration = ({ categories, userSettings }) => {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { session } = useAuth();

  // Handle text input change
  const handleTextChange = (e) => {
    setText(e.target.value);
    
    // Clear previous results when input changes
    if (results) {
      setResults(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!text.trim()) {
      setError('Please enter some text to moderate');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Call API to moderate text
      const response = await axios.post(
        `${config.api.baseUrl}${config.api.endpoints.textModeration}`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      // Set results
      setResults(response.data);
    } catch (error) {
      console.error('Text moderation error:', error);
      setError('Failed to moderate text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear form and results
  const handleClear = () => {
    setText('');
    setResults(null);
    setError('');
  };

  // Render moderation results
  const renderResults = () => {
    if (!results) return null;
    
    const { flagged, moderation_results } = results;
    
    return (
      <div className={`moderation-results ${flagged ? 'flagged' : 'safe'}`}>
        <h3 className="results-title">
          {flagged ? 'Content Flagged' : 'Content Appears Safe'}
        </h3>
        
        <div className="results-summary">
          <p>
            {flagged
              ? 'The content has been flagged for the following reasons:'
              : 'No issues were detected in the provided content.'}
          </p>
        </div>
        
        {flagged && (
          <div className="category-results">
            {Object.entries(moderation_results).map(([category, result]) => (
              <div 
                key={category} 
                className={`category-item ${result.flagged ? 'flagged' : 'safe'}`}
              >
                <div className="category-header">
                  <h4 className="category-name">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h4>
                  <span className="category-score">
                    Score: {(result.score * 100).toFixed(1)}%
                  </span>
                </div>
                
                {result.flagged && result.explanation && (
                  <div className="category-explanation">
                    <p>{result.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="results-actions">
          <button 
            className="btn btn-outline"
            onClick={handleClear}
          >
            Analyze New Text
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="text-moderation">
      {/* Text moderation form */}
      {!results && (
        <form onSubmit={handleSubmit} className="moderation-form">
          {/* Error message */}
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="text-input" className="form-label">
              Enter text to analyze
            </label>
            <textarea
              id="text-input"
              className="form-input text-area"
              value={text}
              onChange={handleTextChange}
              placeholder="Enter text to check for toxicity, bias, or misinformation..."
              rows={6}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !text.trim()}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Text'}
            </button>
            
            {text && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Categories information */}
          <div className="categories-info">
            <h4>Categories being analyzed:</h4>
            <div className="categories-list">
              {categories.map(category => (
                <div key={category.id} className="category-badge">
                  {category.name}
                  <span className="category-tooltip">{category.description}</span>
                </div>
              ))}
            </div>
          </div>
        </form>
      )}
      
      {/* Results display */}
      {renderResults()}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analyzing text...</p>
        </div>
      )}
    </div>
  );
};

export default TextModeration;