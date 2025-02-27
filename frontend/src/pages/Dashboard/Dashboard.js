import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import config from '../../config';
import './Dashboard.css';

/**
 * Dashboard page component
 * Displays moderation history and analytics
 */
const Dashboard = () => {
  const { session } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    content_type: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // No auto-refresh - logs will only update on initial load or manual refresh

  // Fetch moderation logs on component mount, when filters/pagination change, or when lastRefresh changes
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Build query parameters
        const params = new URLSearchParams({
          page: pagination.page,
          pageSize: pagination.pageSize
        });
        
        // Add filters if they exist
        if (filters.content_type) {
          params.append('content_type', filters.content_type);
        }
        
        // Remove flagged filter to show all logs
        // if (filters.flagged !== '') {
        //   params.append('flagged', filters.flagged);
        // }
        
        // Determine endpoint based on content type
        let endpoint = '';
        if (filters.content_type === 'text') {
          endpoint = config.api.endpoints.textModerationHistory;
        } else if (filters.content_type === 'image') {
          endpoint = config.api.endpoints.imageModerationHistory;
        } else {
          // If no content type filter, fetch both and combine
          const textResponse = await axios.get(
            `${config.api.baseUrl}${config.api.endpoints.textModerationHistory}?${params.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            }
          );
          
          const imageResponse = await axios.get(
            `${config.api.baseUrl}${config.api.endpoints.imageModerationHistory}?${params.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            }
          );
          
          // Log the response data for debugging
          console.log('Text API response data:', textResponse.data);
          console.log('Image API response data:', imageResponse.data);
          
          // Combine and sort logs by date
          const combinedLogs = [
            ...textResponse.data.logs,
            ...imageResponse.data.logs
          ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          // Log the number of logs
          console.log(`Found ${combinedLogs.length} logs (${textResponse.data.logs.length} text, ${imageResponse.data.logs.length} image)`);
          
          console.log('Combined logs:', combinedLogs);
          
          // Check if any logs have flagged categories
          if (combinedLogs.length > 0) {
            console.log('Combined logs length:', combinedLogs.length);
            
            // Log each combined log entry for debugging
            combinedLogs.forEach((log, index) => {
              console.log(`Combined Log ${index + 1}:`, {
                id: log.id,
                content_type: log.content_type,
                content: log.content ? (log.content.length > 50 ? log.content.substring(0, 50) + '...' : log.content) : null,
                flagged: log.flagged,
                created_at: log.created_at
              });
              
              console.log(`Log ${log.id} flagged:`, log.flagged);
              if (log.moderation_results) {
                Object.entries(log.moderation_results).forEach(([category, result]) => {
                  console.log(`  Category ${category} flagged:`, result.flagged);
                });
              }
            });
          } else {
            console.log('No logs found in combined logs');
          }
          
          // Take only the first pageSize logs
          const paginatedLogs = combinedLogs.slice(0, pagination.pageSize);
          
          // Log before setting logs
          console.log('About to set logs state with combined logs:', paginatedLogs);
          
          setLogs(paginatedLogs);
          setPagination({
            ...pagination,
            total: textResponse.data.pagination.total + imageResponse.data.pagination.total,
            totalPages: Math.ceil((textResponse.data.pagination.total + imageResponse.data.pagination.total) / pagination.pageSize)
          });
          
          // Log after setting logs
          setTimeout(() => {
            console.log('Logs state after setting combined logs:', logs);
          }, 100);
          
          setIsLoading(false);
          return;
        }
        
        // Fetch logs for specific content type
        const response = await axios.get(
          `${config.api.baseUrl}${endpoint}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );
        
        // Log the response data for debugging
        console.log('API response data:', response.data);
        console.log('Logs from API:', response.data.logs);
        console.log('Logs length:', response.data.logs.length);
        
        // Log each log entry for debugging
        if (response.data.logs && response.data.logs.length > 0) {
          response.data.logs.forEach((log, index) => {
            console.log(`Log ${index + 1}:`, {
              id: log.id,
              content_type: log.content_type,
              content: log.content ? (log.content.length > 50 ? log.content.substring(0, 50) + '...' : log.content) : null,
              flagged: log.flagged,
              created_at: log.created_at
            });
          });
        } else {
          console.log('No logs found in API response');
        }
        
        // Check if any logs have flagged categories
        if (response.data.logs && response.data.logs.length > 0) {
          response.data.logs.forEach(log => {
            console.log(`Log ${log.id} flagged:`, log.flagged);
            if (log.moderation_results) {
              Object.entries(log.moderation_results).forEach(([category, result]) => {
                console.log(`  Category ${category} flagged:`, result.flagged);
              });
            }
          });
        }
        
        // Log before setting logs
        console.log('About to set logs state with:', response.data.logs);
        
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
        
        // Log after setting logs
        setTimeout(() => {
          console.log('Logs state after setting:', logs);
        }, 100);
      } catch (error) {
        console.error('Error fetching moderation logs:', error);
        setError('Failed to fetch moderation logs. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchLogs();
    }
  }, [session, pagination.page, pagination.pageSize, filters, lastRefresh]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Log the filter change
    console.log(`Filter changed: ${name} = ${value}`);
    console.log('Current filters:', filters);
    
    setFilters({
      ...filters,
      [name]: value
    });
    
    // Reset to first page when filters change
    setPagination({
      ...pagination,
      page: 1
    });
    
    // Log the updated filters
    console.log('Updated filters:', {...filters, [name]: value});
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Truncate text for display
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Render content preview
  const renderContentPreview = (log) => {
    if (log.content_type === 'text') {
      return <p className="content-text">{truncateText(log.content)}</p>;
    } else if (log.content_type === 'image') {
      return log.content ? (
        <img
          src={log.content}
          alt="Moderated content"
          className="content-image"
        />
      ) : (
        <div className="content-image-placeholder">
          {log.flagged
            ? "Image storage failed"
            : "Image not stored (safe content)"}
        </div>
      );
    }
    return null;
  };

  // Check if any category in the moderation results is flagged
  const hasFlaggedCategory = (log) => {
    if (!log.moderation_results) return false;
    
    // Log the moderation results for debugging
    console.log('Moderation results for log:', log.id, log.moderation_results);
    
    // Check each category and log its flagged status
    const hasAnyFlagged = Object.entries(log.moderation_results).some(([category, result]) => {
      console.log(`Category ${category} flagged:`, result.flagged);
      return result.flagged;
    });
    
    console.log('Has any flagged category:', hasAnyFlagged);
    return hasAnyFlagged;
  };

  // Render moderation results
  const renderModerationResults = (log) => {
    if (!log.moderation_results) return null;
    
    return (
      <div className="log-results">
        {Object.entries(log.moderation_results).map(([category, result]) => (
          <div
            key={category}
            className={`result-badge ${result.flagged ? 'flagged' : 'safe'}`}
          >
            {category}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Moderation Dashboard</h1>
        <p className="dashboard-description">
          View your content moderation history and analytics
        </p>
      </div>
      
      {/* Filters */}
      <div className="filters-section">
        <h2 className="section-title">Filters</h2>
        <div className="filters-form">
          <div className="filter-group">
            <label htmlFor="content_type" className="filter-label">Content Type</label>
            <select
              id="content_type"
              name="content_type"
              className="filter-select"
              value={filters.content_type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
            </select>
          </div>
          
          {/* Status filter removed to show all logs */}
          
          {/* Date filters removed as requested */}
        </div>
      </div>
      
      {/* Logs table */}
      <div className="logs-section">
        <div className="section-header">
          <h2 className="section-title">Moderation Logs</h2>
          <div className="refresh-container">
            <span className="last-updated">
              Last updated: {formatDate(lastRefresh)}
            </span>
            <button
              className="btn btn-secondary refresh-button"
              onClick={() => setLastRefresh(new Date())}
              title="Refresh logs"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading ? (
          <div className="logs-loading">
            <div className="loading-spinner"></div>
            <p>Loading moderation logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="logs-empty">
            <p>No moderation logs found. Try adjusting your filters or moderate some content.</p>
          </div>
        ) : (
          <>
            <div className="logs-table">
              {console.log('Mapping logs in render:', logs)}
              {logs.map((log) => (
                <div key={log.id} className={`log-card ${log.flagged || hasFlaggedCategory(log) ? 'flagged' : 'safe'}`}>
                  <div className="log-header">
                    <div className="log-type">
                      <span className={`type-badge ${log.content_type}`}>
                        {log.content_type === 'text' ? 'Text' : 'Image'}
                      </span>
                      <span className={`status-badge ${log.flagged || hasFlaggedCategory(log) ? 'flagged' : 'safe'}`}>
                        {log.flagged ? 'Flagged (Overall)' : hasFlaggedCategory(log) ? 'Flagged (Category)' : 'Safe'}
                      </span>
                    </div>
                    <div className="log-date">
                      {formatDate(log.created_at)}
                    </div>
                  </div>
                  
                  <div className="log-content">
                    {renderContentPreview(log)}
                  </div>
                  
                  <div className="log-footer">
                    {renderModerationResults(log)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
              >
                &laquo;
              </button>
              
              <button
                className="pagination-button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                &lsaquo;
              </button>
              
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button
                className="pagination-button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                &rsaquo;
              </button>
              
              <button
                className="pagination-button"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
              >
                &raquo;
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;