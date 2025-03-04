import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import config from '../../config';
import './Settings.css';

/**
 * Settings page component
 * Allows users to configure moderation preferences
 */
const Settings = () => {
  const { session, userSettings, updateSettings } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState(null);
  const [categories, setCategories] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [apiKeyResult, setApiKeyResult] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState(null);
  const [editKeyName, setEditKeyName] = useState('');
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState(false);

  // Fetch API keys
  const fetchApiKeys = useCallback(async () => {
    try {
      setIsLoadingApiKeys(true);
      setError('');
      
      const response = await axios.get(
        `${config.api.baseUrl}${config.api.endpoints.apiKeys}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      setApiKeys(response.data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setError('Failed to fetch API keys. Please try again.');
    } finally {
      setIsLoadingApiKeys(false);
    }
  }, [session, setError]);

  // Fetch moderation categories and API keys on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories
        const categoriesResponse = await axios.get(
          `${config.api.baseUrl}${config.api.endpoints.moderationCategories}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );
        
        setCategories(categoriesResponse.data);
        
        // Fetch API keys using the dedicated function
        await fetchApiKeys();
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session, fetchApiKeys]);

  // Initialize form data when user settings are loaded
  useEffect(() => {
    if (userSettings) {
      setFormData({
        // Text moderation settings
        toxicity_threshold: userSettings.toxicity_threshold || 0.7,
        bias_threshold: userSettings.bias_threshold || 0.7,
        misinformation_threshold: userSettings.misinformation_threshold || 0.7,
        
        // Image moderation settings
        adult_threshold: userSettings.adult_threshold || 'POSSIBLE',
        violence_threshold: userSettings.violence_threshold || 'POSSIBLE',
        medical_threshold: userSettings.medical_threshold || 'LIKELY',
        spoof_threshold: userSettings.spoof_threshold || 'LIKELY',
        
        // General settings
        check_copyright: userSettings.check_copyright !== undefined ? userSettings.check_copyright : true,
        enabled_categories: userSettings.enabled_categories || [
          'toxicity', 'bias', 'misinformation', 'adult', 'violence'
        ],
        notifications_enabled: userSettings.notifications_enabled !== undefined ? userSettings.notifications_enabled : true,
        theme: userSettings.theme || theme
      });
    }
  }, [userSettings, theme]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (type === 'range') {
      setFormData({
        ...formData,
        [name]: parseFloat(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle category toggle
  const handleCategoryToggle = (category) => {
    const updatedCategories = [...formData.enabled_categories];
    
    if (updatedCategories.includes(category)) {
      // Remove category if already enabled
      const index = updatedCategories.indexOf(category);
      updatedCategories.splice(index, 1);
    } else {
      // Add category if not enabled
      updatedCategories.push(category);
    }
    
    setFormData({
      ...formData,
      enabled_categories: updatedCategories
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      
      // Update theme if changed
      if (formData.theme !== theme) {
        toggleTheme();
      }
      
      // Update user settings
      const { success, error } = await updateSettings(formData);
      
      if (success) {
        setSuccess('Settings updated successfully');
      } else {
        setError(error || 'Failed to update settings. Please try again.');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle API key creation
  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    
    if (!apiKeyName.trim()) {
      setError('API key name is required');
      return;
    }
    
    try {
      setIsCreatingApiKey(true);
      setError('');
      setSuccess('');
      setApiKeyResult(null);
      
      const response = await axios.post(
        `${config.api.baseUrl}${config.api.endpoints.userSettings}/api-key`,
        { name: apiKeyName },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      setApiKeyResult(response.data);
      setSuccess('API key created successfully');
      setApiKeyName(''); // Clear the input
      
      // Update API keys list from response if available
      if (response.data.apiKeys) {
        setApiKeys(response.data.apiKeys);
      } else {
        // Fallback to fetching API keys
        fetchApiKeys();
      }
    } catch (error) {
      console.error('API key creation error:', error);
      setError('Failed to create API key. Please try again.');
    } finally {
      setIsCreatingApiKey(false);
    }
  };
  
  // Handle API key edit
  const handleEditApiKey = (keyId, currentName) => {
    setEditingKeyId(keyId);
    setEditKeyName(currentName);
  };
  
  // Handle API key update
  const handleUpdateApiKey = async (keyId) => {
    if (!editKeyName.trim()) {
      setError('API key name is required');
      return;
    }
    
    try {
      setIsUpdatingKey(true);
      setError('');
      setSuccess('');
      
      await axios.put(
        `${config.api.baseUrl}${config.api.endpoints.updateApiKey.replace(':keyId', keyId)}`,
        { name: editKeyName },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      // Reset editing state
      setEditingKeyId(null);
      setEditKeyName('');
      setSuccess('API key updated successfully');
      
      // Refresh the API keys list
      fetchApiKeys();
    } catch (error) {
      console.error('API key update error:', error);
      setError('Failed to update API key. Please try again.');
    } finally {
      setIsUpdatingKey(false);
    }
  };
  
  // Handle API key deletion
  const handleDeleteApiKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeletingKey(true);
      setError('');
      setSuccess('');
      
      await axios.delete(
        `${config.api.baseUrl}${config.api.endpoints.deleteApiKey.replace(':keyId', keyId)}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      setSuccess('API key deleted successfully');
      
      // Refresh the API keys list
      fetchApiKeys();
    } catch (error) {
      console.error('API key deletion error:', error);
      setError('Failed to delete API key. Please try again.');
    } finally {
      setIsDeletingKey(false);
    }
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingKeyId(null);
    setEditKeyName('');
  };

  // Render loading state
  if (isLoading || !formData) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-description">
          Configure your content moderation preferences
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="settings-form">
        {/* Text Moderation Settings */}
        <div className="settings-section">
          <h2 className="section-title">Text Moderation Settings</h2>
          
          <div className="settings-group">
            <label htmlFor="toxicity_threshold" className="settings-label">
              Toxicity Sensitivity: {(formData.toxicity_threshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              id="toxicity_threshold"
              name="toxicity_threshold"
              min="0.1"
              max="0.9"
              step="0.1"
              value={formData.toxicity_threshold}
              onChange={handleInputChange}
              className="settings-slider"
            />
            <div className="slider-labels">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
          
          <div className="settings-group">
            <label htmlFor="bias_threshold" className="settings-label">
              Bias Sensitivity: {(formData.bias_threshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              id="bias_threshold"
              name="bias_threshold"
              min="0.1"
              max="0.9"
              step="0.1"
              value={formData.bias_threshold}
              onChange={handleInputChange}
              className="settings-slider"
            />
            <div className="slider-labels">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
          
          <div className="settings-group">
            <label htmlFor="misinformation_threshold" className="settings-label">
              Misinformation Sensitivity: {(formData.misinformation_threshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              id="misinformation_threshold"
              name="misinformation_threshold"
              min="0.1"
              max="0.9"
              step="0.1"
              value={formData.misinformation_threshold}
              onChange={handleInputChange}
              className="settings-slider"
            />
            <div className="slider-labels">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
        
        {/* Image Moderation Settings */}
        <div className="settings-section">
          <h2 className="section-title">Image Moderation Settings</h2>
          
          <div className="settings-group">
            <label htmlFor="adult_threshold" className="settings-label">
              Adult Content Sensitivity
            </label>
            <select
              id="adult_threshold"
              name="adult_threshold"
              value={formData.adult_threshold}
              onChange={handleInputChange}
              className="settings-select"
            >
              <option value="VERY_UNLIKELY">Very Low</option>
              <option value="UNLIKELY">Low</option>
              <option value="POSSIBLE">Medium</option>
              <option value="LIKELY">High</option>
              <option value="VERY_LIKELY">Very High</option>
            </select>
          </div>
          
          <div className="settings-group">
            <label htmlFor="violence_threshold" className="settings-label">
              Violence Sensitivity
            </label>
            <select
              id="violence_threshold"
              name="violence_threshold"
              value={formData.violence_threshold}
              onChange={handleInputChange}
              className="settings-select"
            >
              <option value="VERY_UNLIKELY">Very Low</option>
              <option value="UNLIKELY">Low</option>
              <option value="POSSIBLE">Medium</option>
              <option value="LIKELY">High</option>
              <option value="VERY_LIKELY">Very High</option>
            </select>
          </div>
          
          <div className="settings-group">
            <label htmlFor="medical_threshold" className="settings-label">
              Medical Content Sensitivity
            </label>
            <select
              id="medical_threshold"
              name="medical_threshold"
              value={formData.medical_threshold}
              onChange={handleInputChange}
              className="settings-select"
            >
              <option value="VERY_UNLIKELY">Very Low</option>
              <option value="UNLIKELY">Low</option>
              <option value="POSSIBLE">Medium</option>
              <option value="LIKELY">High</option>
              <option value="VERY_LIKELY">Very High</option>
            </select>
          </div>
          
          <div className="settings-group">
            <label htmlFor="spoof_threshold" className="settings-label">
              Spoof Content Sensitivity
            </label>
            <select
              id="spoof_threshold"
              name="spoof_threshold"
              value={formData.spoof_threshold}
              onChange={handleInputChange}
              className="settings-select"
            >
              <option value="VERY_UNLIKELY">Very Low</option>
              <option value="UNLIKELY">Low</option>
              <option value="POSSIBLE">Medium</option>
              <option value="LIKELY">High</option>
              <option value="VERY_LIKELY">Very High</option>
            </select>
          </div>
          
          <div className="settings-group checkbox-group">
            <label className="settings-label checkbox-label">
              <input
                type="checkbox"
                name="check_copyright"
                checked={formData.check_copyright}
                onChange={handleInputChange}
                className="settings-checkbox"
              />
              Check for copyright/logo detection
            </label>
          </div>
        </div>
        
        {/* Categories Settings */}
        {categories && (
          <div className="settings-section">
            <h2 className="section-title">Enabled Categories</h2>
            
            <div className="categories-container">
              <div className="category-column">
                <h3 className="category-column-title">Text Categories</h3>
                {categories.text.map(category => (
                  <div key={category.id} className="category-item">
                    <label className="settings-label checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.enabled_categories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="settings-checkbox"
                      />
                      {category.name}
                    </label>
                    <p className="category-description">{category.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="category-column">
                <h3 className="category-column-title">Image Categories</h3>
                {categories.image.map(category => (
                  <div key={category.id} className="category-item">
                    <label className="settings-label checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.enabled_categories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="settings-checkbox"
                      />
                      {category.name}
                    </label>
                    <p className="category-description">{category.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* General Settings */}
        <div className="settings-section">
          <h2 className="section-title">General Settings</h2>
          
          <div className="settings-group checkbox-group">
            <label className="settings-label checkbox-label">
              <input
                type="checkbox"
                name="notifications_enabled"
                checked={formData.notifications_enabled}
                onChange={handleInputChange}
                className="settings-checkbox"
              />
              Enable notifications
            </label>
          </div>
          
          <div className="settings-group">
            <label htmlFor="theme" className="settings-label">
              Theme
            </label>
            <select
              id="theme"
              name="theme"
              value={formData.theme}
              onChange={handleInputChange}
              className="settings-select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        
        {/* Form actions */}
        <div className="settings-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* API Key Section */}
      <div className="settings-section api-key-section">
        <h2 className="section-title">API Keys</h2>
        <p className="section-description">
          Create API keys to access the content moderation API from external applications.
          Each key is limited to 1 request per hour.
        </p>
        
        {apiKeyResult && (
          <div className="api-key-result">
            <h3>Your New API Key</h3>
            <p className="api-key-warning">
              Make sure to copy this key now. You won't be able to see it again!
            </p>
            <div className="api-key-display">
              <code>{apiKeyResult.apiKey.key}</code>
            </div>
            <div className="api-key-info">
              <p><strong>Name:</strong> {apiKeyResult.apiKey.name}</p>
              <p><strong>Rate Limit:</strong> {apiKeyResult.apiKey.rate_limit} request per hour</p>
              <p><strong>Created:</strong> {new Date(apiKeyResult.apiKey.created_at).toLocaleString()}</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setApiKeyResult(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        
        {!apiKeyResult && (
          <form onSubmit={handleCreateApiKey} className="api-key-form">
            <div className="settings-group">
              <label htmlFor="apiKeyName" className="settings-label">
                API Key Name
              </label>
              <input
                type="text"
                id="apiKeyName"
                value={apiKeyName}
                onChange={(e) => setApiKeyName(e.target.value)}
                placeholder="Enter a name for your API key"
                className="settings-input"
                required
              />
            </div>
            
            <div className="settings-actions">
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isCreatingApiKey}
              >
                {isCreatingApiKey ? 'Creating...' : 'Create API Key'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      {/* API Keys List */}
      <div className="settings-section api-key-section">
        <h2 className="section-title">Your API Keys</h2>
        <p className="section-description">
          Manage your existing API keys. You can edit the name or delete keys as needed.
        </p>
        
        {isLoadingApiKeys ? (
          <div className="api-keys-loading">
            <div className="loading-spinner"></div>
            <p>Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <p className="no-api-keys-message">You don't have any API keys yet.</p>
        ) : (
          <div className="api-keys-list">
            {apiKeys.map(key => (
              <div key={key.id} className="api-key-item">
                {editingKeyId === key.id ? (
                  <div className="api-key-edit-form">
                    <input
                      type="text"
                      value={editKeyName}
                      onChange={(e) => setEditKeyName(e.target.value)}
                      className="settings-input"
                      placeholder="Enter new name"
                    />
                    <div className="api-key-edit-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUpdateApiKey(key.id)}
                        disabled={isUpdatingKey}
                      >
                        {isUpdatingKey ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="api-key-content">
                    <div className="api-key-info">
                      <h4 className="api-key-name">{key.name}</h4>
                      <p className="api-key-details">
                        <span className="api-key-id">ID: {key.id.substring(0, 8)}...</span>
                        <span className="api-key-created">Created: {new Date(key.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div className="api-key-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleEditApiKey(key.id, key.name)}
                        title="Edit API key name"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-danger"
                        onClick={() => handleDeleteApiKey(key.id)}
                        disabled={isDeletingKey}
                        title="Delete API key"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;