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
    content_type: '',
    flagged: '',
    from_date: '',
    to_date: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch moderation logs on component mount and when filters/pagination change
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
        
        if (filters.flagged !== '') {
          params.append('flagged', filters.flagged);
        }
        
        if (filters.from_date) {
          params.append('from_date', filters.from_date);
        }
        
        if (filters.to_date) {
          params.append('to_date', filters.to_date);
        }
        
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
          
          // Combine and sort logs by date
          const combinedLogs = [
            ...textResponse.data.logs,
            ...imageResponse.data.logs
          ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          // Take only the first pageSize logs
          const paginatedLogs = combinedLogs.slice(0, pagination.pageSize);
          
          setLogs(paginatedLogs);
          setPagination({
            ...pagination,
            total: textResponse.data.pagination.total + imageResponse.data.pagination.total,
            totalPages: Math.ceil((textResponse.data.pagination.total + imageResponse.data.pagination.total) / pagination.pageSize)
          });
          
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
        
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
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
  }, [session, pagination.page, pagination.pageSize, filters]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    
    // Reset to first page when filters change
    setPagination({
      ...pagination,
      page: 1
    });
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
        <div className="content-image-placeholder">Image not available</div>
      );
    }
    return null;
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
          
          <div className="filter-group">
            <label htmlFor="flagged" className="filter-label">Status</label>
            <select
              id="flagged"
              name="flagged"
              className="filter-select"
              value={filters.flagged}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="true">Flagged</option>
              <option value="false">Safe</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="from_date" className="filter-label">From Date</label>
            <input
              type="date"
              id="from_date"
              name="from_date"
              className="filter-input"
              value={filters.from_date}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="to_date" className="filter-label">To Date</label>
            <input
              type="date"
              id="to_date"
              name="to_date"
              className="filter-input"
              value={filters.to_date}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>
      
      {/* Logs table */}
      <div className="logs-section">
        <h2 className="section-title">Moderation Logs</h2>
        
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
              {logs.map((log) => (
                <div key={log.id} className={`log-card ${log.flagged ? 'flagged' : 'safe'}`}>
                  <div className="log-header">
                    <div className="log-type">
                      <span className={`type-badge ${log.content_type}`}>
                        {log.content_type === 'text' ? 'Text' : 'Image'}
                      </span>
                      <span className={`status-badge ${log.flagged ? 'flagged' : 'safe'}`}>
                        {log.flagged ? 'Flagged' : 'Safe'}
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