require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const textModerationRoutes = require('./routes/textModeration');
const imageModerationRoutes = require('./routes/imageModeration');
const userSettingsRoutes = require('./routes/userSettings');
const externalApiRoutes = require('./routes/externalApi');
const authRoutes = require('./routes/auth');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
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

// Routes
app.use('/api/moderate-text', textModerationRoutes);
app.use('/api/moderate-image', imageModerationRoutes);
app.use('/api/settings', userSettingsRoutes);
app.use('/api/external', externalApiRoutes);
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Function to find an available port
const startServer = (port) => {
  const server = app.listen(port)
    .on('listening', () => {
      console.log(`Server running on port ${port}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        console.log(`Port ${port} is busy, trying port ${nextPort}`);
        server.close();
        startServer(nextPort);
      } else {
        console.error('Server error:', err);
      }
    });
  
  return server;
};

// Start server with port fallback
const server = startServer(PORT);

module.exports = app; // For testing purposes