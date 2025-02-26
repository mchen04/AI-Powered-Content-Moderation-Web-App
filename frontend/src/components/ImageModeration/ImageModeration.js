import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import config from '../../config';
import './ImageModeration.css';

/**
 * ImageModeration component
 * Handles image content moderation functionality
 */
const ImageModeration = ({ categories, userSettings }) => {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const { session } = useAuth();

  // Handle file drop
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    
    setImage(file);
    setError('');
    setResults(null);
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  // Handle URL input change
  const handleUrlChange = (e) => {
    setImageUrl(e.target.value);
    setImage(null);
    setImagePreview(null);
    setResults(null);
    setError('');
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setImage(null);
    setImageUrl('');
    setImagePreview(null);
    setResults(null);
    setError('');
  };

  // Handle form submission for image upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!image) {
      setError('Please select an image to moderate');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Create form data
      const formData = new FormData();
      formData.append('image', image);
      
      // Call API to moderate image
      const response = await axios.post(
        `${config.api.baseUrl}${config.api.endpoints.imageModeration}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Set results
      setResults(response.data);
    } catch (error) {
      console.error('Image moderation error:', error);
      setError('Failed to moderate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission for image URL
  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!imageUrl.trim()) {
      setError('Please enter an image URL to moderate');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Set image preview
      setImagePreview(imageUrl);
      
      // Call API to moderate image URL
      const response = await axios.post(
        `${config.api.baseUrl}${config.api.endpoints.imageUrlModeration}`,
        { imageUrl },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      // Set results
      setResults(response.data);
    } catch (error) {
      console.error('Image URL moderation error:', error);
      setError('Failed to moderate image URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear form and results
  const handleClear = () => {
    setImage(null);
    setImageUrl('');
    setImagePreview(null);
    setResults(null);
    setError('');
  };

  // Render moderation results
  const renderResults = () => {
    if (!results) return null;
    
    const { flagged, moderation_results, logo_detection, image_url } = results;
    
    return (
      <div className={`moderation-results ${flagged ? 'flagged' : 'safe'}`}>
        <div className="results-content">
          <div className="results-image">
            <img 
              src={image_url || imagePreview} 
              alt="Moderated content" 
              className="moderated-image"
            />
          </div>
          
          <div className="results-details">
            <h3 className="results-title">
              {flagged ? 'Content Flagged' : 'Content Appears Safe'}
            </h3>
            
            <div className="results-summary">
              <p>
                {flagged
                  ? 'The image has been flagged for the following reasons:'
                  : 'No issues were detected in the provided image.'}
              </p>
            </div>
            
            {/* Category results */}
            {Object.entries(moderation_results).length > 0 && (
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
                    <div className="category-likelihood">
                      Likelihood: {result.likelihood}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Logo detection results */}
            {logo_detection && logo_detection.length > 0 && (
              <div className="logo-results">
                <h4>Detected Logos/Brands:</h4>
                <ul className="logo-list">
                  {logo_detection.map((logo, index) => (
                    <li key={index} className="logo-item">
                      {logo.description} (Confidence: {(logo.confidence * 100).toFixed(1)}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="results-actions">
          <button 
            className="btn btn-outline"
            onClick={handleClear}
          >
            Analyze New Image
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="image-moderation">
      {/* Image moderation form */}
      {!results && (
        <>
          {/* Tab navigation */}
          <div className="image-tabs">
            <button
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => handleTabChange('upload')}
            >
              Upload Image
            </button>
            <button
              className={`tab-button ${activeTab === 'url' ? 'active' : ''}`}
              onClick={() => handleTabChange('url')}
            >
              Image URL
            </button>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          {/* Upload image tab */}
          {activeTab === 'upload' && (
            <form onSubmit={handleUploadSubmit} className="moderation-form">
              <div className="form-group">
                <label className="form-label">
                  Upload an image to analyze
                </label>
                
                <div 
                  {...getRootProps()} 
                  className={`dropzone ${isDragActive ? 'active' : ''} ${image ? 'has-file' : ''}`}
                >
                  <input {...getInputProps()} />
                  
                  {imagePreview ? (
                    <div className="image-preview-container">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="image-preview"
                      />
                      <div className="image-preview-overlay">
                        <span>Click or drag to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="dropzone-content">
                      <div className="dropzone-icon">📷</div>
                      <p>
                        {isDragActive
                          ? 'Drop the image here...'
                          : 'Drag & drop an image here, or click to select'}
                      </p>
                      <span className="dropzone-hint">
                        Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !image}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Image'}
                </button>
                
                {image && (
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
            </form>
          )}
          
          {/* Image URL tab */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="moderation-form">
              <div className="form-group">
                <label htmlFor="image-url" className="form-label">
                  Enter image URL to analyze
                </label>
                <input
                  id="image-url"
                  type="url"
                  className="form-input"
                  value={imageUrl}
                  onChange={handleUrlChange}
                  placeholder="https://example.com/image.jpg"
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !imageUrl.trim()}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Image URL'}
                </button>
                
                {imageUrl && (
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
            </form>
          )}
          
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
        </>
      )}
      
      {/* Results display */}
      {renderResults()}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analyzing image...</p>
        </div>
      )}
    </div>
  );
};

export default ImageModeration;