// Try to load .env from current directory first, then from parent directory
try {
  require('dotenv').config();
} catch (e) {
  try {
    require('dotenv').config({ path: '../.env' });
  } catch (e) {
    console.log('No .env file found, using environment variables');
  }
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const textModerationRoutes = require('./routes/textModeration');
const imageModerationRoutes = require('./routes/imageModeration');
const userSettingsRoutes = require('./routes/userSettings');
const externalApiRoutes = require('./routes/externalApi');
const authRoutes = require('./routes/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS options
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Allow requests from the frontend URL or any origin in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl} (path: ${req.path})`);
  next();
});

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Enable CORS with options
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Middleware to normalize paths with double slashes
app.use((req, res, next) => {
  // Store original values for debugging
  const originalUrl = req.url;
  const originalPath = req.path;
  
  // Check for double slashes at the beginning of the URL
  if (req.url.startsWith('//')) {
    console.log(`[DOUBLE SLASH] Original URL: ${originalUrl}, Path: ${originalPath}`);
    
    // Replace all instances of double slashes with single slashes
    req.url = req.url.replace(/\/+/g, '/');
    
    console.log(`[DOUBLE SLASH] Normalized URL: ${req.url}`);
    
    // For non-GET requests, we need to update the path as well
    if (req.method !== 'GET') {
      // Update req._parsedUrl to ensure path is updated
      req._parsedUrl.pathname = req._parsedUrl.pathname.replace(/\/+/g, '/');
      req._parsedUrl.path = req._parsedUrl.path.replace(/\/+/g, '/');
      req._parsedUrl.href = req._parsedUrl.href.replace(/\/+/g, '/');
      
      console.log(`[DOUBLE SLASH] Updated parsed URL:`, req._parsedUrl);
    }
  }
  
  next();
});

// Routes - ensure they work with all path formats
app.use(['/api/moderate-text', 'api/moderate-text', '//api/moderate-text'], textModerationRoutes);
app.use(['/api/moderate-image', 'api/moderate-image', '//api/moderate-image'], imageModerationRoutes);
app.use(['/api/settings', 'api/settings', '//api/settings'], userSettingsRoutes);
app.use(['/api/external', 'api/external', '//api/external'], externalApiRoutes);
app.use(['/api/auth', 'api/auth', '//api/auth'], authRoutes);

// Log all registered routes after setup
console.log('API Routes registered with these paths:');
console.log('Text moderation:', ['/api/moderate-text', 'api/moderate-text', '//api/moderate-text']);
console.log('Image moderation:', ['/api/moderate-image', 'api/moderate-image', '//api/moderate-image']);
console.log('Settings:', ['/api/settings', 'api/settings', '//api/settings']);
console.log('External API:', ['/api/external', 'api/external', '//api/external']);
console.log('Auth:', ['/api/auth', 'api/auth', '//api/auth']);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Test API endpoint that accepts both formats
app.get(['/api/test', 'api/test'], (req, res) => {
  res.status(200).json({
    message: 'API test endpoint is working',
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    headers: req.headers,
    query: req.query
  });
});

// Log all registered routes for debugging
console.log('Registered API routes:');
app._router.stack.forEach(middleware => {
  if (middleware.route) {
    // Routes registered directly on the app
    console.log(`${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    middleware.handle.stack.forEach(handler => {
      if (handler.route) {
        const path = handler.route.path;
        const methods = Object.keys(handler.route.methods)
          .filter(method => handler.route.methods[method])
          .join(', ').toUpperCase();
        console.log(`${methods} /api${path}`);
      }
    });
  }
});

// Check if we're running on Render
const isOnRender = process.env.RENDER === 'true';

// Always serve the test.html file for debugging
app.get('/test', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public/test.html'));
});

// Only serve static files and catch-all route in development or when not on Render
if (!isOnRender && process.env.NODE_ENV !== 'production') {
  // Serve static files from the React app - try multiple possible locations
  const fs = require('fs');
  const possibleStaticPaths = [
    path.resolve(__dirname, '../frontend/build'),
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../build'),
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), 'frontend/build'),
    path.resolve(__dirname, 'public') // Backend's own public directory as fallback
  ];

  // Find the first path that exists
  let staticPath = null;
  for (const pathToCheck of possibleStaticPaths) {
    console.log(`Checking for static files at: ${pathToCheck}`);
    if (fs.existsSync(pathToCheck)) {
      staticPath = pathToCheck;
      console.log(`✅ Found static files at: ${staticPath}`);
      break;
    }
  }

  if (staticPath) {
    app.use(express.static(staticPath));
    console.log(`Serving static files from: ${staticPath}`);
  } else {
    console.log('❌ No static files directory found!');
  }

  // IMPORTANT: This catch-all route must be AFTER all API routes
  // Any routes not caught by API routes will be handled by React
  app.get('*', (req, res) => {
    // Try to find index.html in multiple possible locations
    const possibleIndexPaths = [
      path.resolve(__dirname, '../frontend/build/index.html'),
      path.resolve(__dirname, '../public/index.html'),
      path.resolve(__dirname, '../build/index.html'),
      path.resolve(process.cwd(), 'public/index.html'),
      path.resolve(process.cwd(), 'frontend/build/index.html'),
      path.resolve(__dirname, 'public/index.html') // Backend's own public directory as fallback
    ];
    
    // Find the first path that exists
    let indexPath = null;
    for (const pathToCheck of possibleIndexPaths) {
      console.log(`Checking for index.html at: ${pathToCheck}`);
      if (fs.existsSync(pathToCheck)) {
        indexPath = pathToCheck;
        console.log(`✅ Found index.html at: ${indexPath}`);
        break;
      }
    }
    
    if (indexPath) {
      res.sendFile(indexPath);
    } else {
      console.log('❌ No index.html found in any location!');
      res.status(404).send(`
        <h1>Frontend build not found</h1>
        <p>Make sure the build process completed successfully.</p>
        <p>Current working directory: ${process.cwd()}</p>
        <p>Checked paths:</p>
        <ul>
          ${possibleIndexPaths.map(p => `<li>${p}</li>`).join('')}
        </ul>
      `);
    }
  });
} else {
  // In production on Render, just handle API routes and return 404 for all other routes
  console.log('Running in production mode on Render - not serving static files');
  
  // Add a catch-all route that returns 404 for non-API routes
  app.all('*', (req, res) => {
    // Get the original URL and path
    const originalUrl = req.originalUrl;
    const originalPath = req.path;
    
    // Handle double slashes in the path
    let normalizedPath = originalPath;
    if (normalizedPath.startsWith('//')) {
      normalizedPath = normalizedPath.replace('//', '/');
      console.log(`Normalized double-slash path: ${originalPath} -> ${normalizedPath}`);
      
      // Redirect to the normalized path for GET requests
      if (req.method === 'GET') {
        const redirectUrl = originalUrl.replace('//', '/');
        console.log(`Redirecting to: ${redirectUrl}`);
        return res.redirect(redirectUrl);
      }
    }
    
    // Handle paths without leading slash
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }
    
    // Only handle API routes, return 404 for all other routes
    if (!normalizedPath.startsWith('/api') && !normalizedPath.startsWith('/health')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'This is an API server. Frontend is deployed separately.',
        originalUrl,
        originalPath,
        normalizedPath
      });
    }
    
    // If we get here, it means the route wasn't handled by any of the API routes
    res.status(404).json({
      error: 'API endpoint not found',
      originalUrl,
      originalPath,
      normalizedPath,
      method: req.method
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

module.exports = app; // For testing purposes