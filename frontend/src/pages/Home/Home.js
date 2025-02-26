import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config';
import TextModeration from '../../components/TextModeration/TextModeration';
import ImageModeration from '../../components/ImageModeration/ImageModeration';
import './Home.css';

/**
 * Home page component
 * Main page for content moderation functionality
 */
const Home = () => {
  const { session, userSettings } = useAuth();
  const [activeTab, setActiveTab] = useState('text');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState(null);

  // Fetch moderation categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        
        const response = await axios.get(
          `${config.api.baseUrl}${config.api.endpoints.moderationCategories}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );
        
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching moderation categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchCategories();
    }
  }, [session]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Render loading state
  if (isLoading && !categories) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Loading moderation tools...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">AI-Powered Content Moderation</h1>
        <p className="home-description">
          Analyze text and images for potentially harmful content using advanced AI models.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="moderation-tabs">
        <button
          className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => handleTabChange('text')}
        >
          Text Moderation
        </button>
        <button
          className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => handleTabChange('image')}
        >
          Image Moderation
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'text' ? (
          <TextModeration 
            categories={categories?.text || []} 
            userSettings={userSettings}
          />
        ) : (
          <ImageModeration 
            categories={categories?.image || []} 
            userSettings={userSettings}
          />
        )}
      </div>

      {/* Information section */}
      <div className="info-section">
        <div className="info-card">
          <h3>About Content Moderation</h3>
          <p>
            Our AI-powered content moderation system uses DeepSeek NLP for text analysis and 
            Google Cloud Vision for image analysis to detect potentially harmful content.
          </p>
          <p>
            You can adjust sensitivity levels and enabled categories in your 
            <a href="/settings"> settings</a>.
          </p>
        </div>
        
        <div className="info-card">
          <h3>How It Works</h3>
          <ul>
            <li><strong>Text Moderation:</strong> Analyzes text for toxicity, bias, and misinformation.</li>
            <li><strong>Image Moderation:</strong> Detects adult content, violence, and other concerning imagery.</li>
            <li><strong>Dashboard:</strong> View your moderation history and analytics.</li>
            <li><strong>API Access:</strong> Integrate moderation into your own applications.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;