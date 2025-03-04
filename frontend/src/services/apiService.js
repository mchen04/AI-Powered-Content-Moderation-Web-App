import axios from 'axios';
import config from '../config';

/**
 * API Service for handling requests to the backend
 * Includes retry logic for different ports if the default port is unavailable
 */
class ApiService {
  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.endpoints = config.api.endpoints;
    this.maxRetries = 3;
    this.portIncrement = 1;
    this.currentRetry = 0;
  }

  /**
   * Create axios instance with authorization header
   * @param {string} token - Authentication token
   * @returns {Object} - Axios instance
   */
  createAxiosInstance(token) {
    // Create headers
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    // Log the current baseUrl for debugging
    console.log('API Service baseUrl:', this.baseUrl);
    
    // Create a custom axios instance
    const instance = axios.create({
      headers
    });
    
    // Add a request interceptor to handle URL construction
    instance.interceptors.request.use(config => {
      // If we have a baseUrl and the URL starts with a slash, combine them properly
      if (this.baseUrl && config.url && config.url.startsWith('/')) {
        // Remove the leading slash from the URL
        const url = config.url.substring(1);
        // Combine baseUrl and URL, ensuring no double slash
        const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
        config.url = `${baseUrl}/${url}`;
        // Remove baseURL to prevent axios from using it again
        delete config.baseURL;
        
        console.log('Constructed URL:', config.url);
      } else if (this.baseUrl) {
        // If URL doesn't start with slash, use baseURL normally
        config.baseURL = this.baseUrl;
      }
      
      return config;
    });
    
    return instance;
  }

  /**
   * Handle API error and retry with different port if needed
   * @param {Error} error - Axios error
   * @param {Function} requestFn - Original request function
   * @param {Array} args - Original request arguments
   * @returns {Promise} - Retry promise or rejected promise
   */
  async handleApiError(error, requestFn, args) {
    // If the error is a network error and we haven't exceeded max retries
    if (
      (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) &&
      this.currentRetry < this.maxRetries
    ) {
      this.currentRetry++;
      
      // Try the next port
      const currentPort = parseInt(this.baseUrl.split(':').pop(), 10);
      const nextPort = currentPort + this.portIncrement;
      this.baseUrl = this.baseUrl.replace(`:${currentPort}`, `:${nextPort}`);
      
      console.log(`Retrying with port ${nextPort}...`);
      
      // Retry the request
      return await requestFn(...args);
    }
    
    // Reset retry counter
    this.currentRetry = 0;
    
    // If we've exceeded max retries or it's not a network error, reject
    return Promise.reject(error);
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {string} token - Authentication token
   * @returns {Promise} - API response
   */
  async get(endpoint, params = {}, token = null) {
    try {
      const axiosInstance = this.createAxiosInstance(token);
      return await axiosInstance.get(endpoint, { params });
    } catch (error) {
      return this.handleApiError(error, this.get.bind(this), [endpoint, params, token]);
    }
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {string} token - Authentication token
   * @returns {Promise} - API response
   */
  async post(endpoint, data = {}, token = null) {
    try {
      const axiosInstance = this.createAxiosInstance(token);
      return await axiosInstance.post(endpoint, data);
    } catch (error) {
      return this.handleApiError(error, this.post.bind(this), [endpoint, data, token]);
    }
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {string} token - Authentication token
   * @returns {Promise} - API response
   */
  async put(endpoint, data = {}, token = null) {
    try {
      const axiosInstance = this.createAxiosInstance(token);
      return await axiosInstance.put(endpoint, data);
    } catch (error) {
      return this.handleApiError(error, this.put.bind(this), [endpoint, data, token]);
    }
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {string} token - Authentication token
   * @returns {Promise} - API response
   */
  async delete(endpoint, params = {}, token = null) {
    try {
      const axiosInstance = this.createAxiosInstance(token);
      return await axiosInstance.delete(endpoint, { params });
    } catch (error) {
      return this.handleApiError(error, this.delete.bind(this), [endpoint, params, token]);
    }
  }

  /**
   * Upload a file
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @param {string} token - Authentication token
   * @returns {Promise} - API response
   */
  async uploadFile(endpoint, formData, token = null) {
    try {
      const axiosInstance = this.createAxiosInstance(token);
      return await axiosInstance.post(endpoint, formData, {
        headers: {
          ...axiosInstance.defaults.headers,
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      return this.handleApiError(error, this.uploadFile.bind(this), [endpoint, formData, token]);
    }
  }
}

export default new ApiService();