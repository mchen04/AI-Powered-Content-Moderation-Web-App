# Deploying to Render

This document provides instructions for deploying this application to Render.

## Prerequisites

1. A Render account
2. Your environment variables ready (Supabase credentials, API keys, etc.)

## Deployment Steps

1. **Fork or clone the repository**

2. **Create a new Web Service on Render**
   - Sign in to your Render dashboard
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Use the following settings:
     - **Name**: content-moderation-app (or your preferred name)
     - **Environment**: Node
     - **Root Directory**: `backend` (This is crucial for monorepo structure)
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Configure Environment Variables**
   Add the following environment variables in the Render dashboard:
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `REACT_APP_NODE_ENV`: production
   - `REACT_APP_API_URL`: (leave empty for relative URLs)
   - Add any other required environment variables for your application:
     - Supabase URL and keys
     - OpenAI API key
     - Google Cloud Vision API key
     - Any other service credentials

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

## How It Works

The deployment is configured to use Render's **Root Directory** feature, which simplifies deployment for monorepo projects like this one.

1. **Root Directory Setting**:
   - We set the Root Directory to `backend`
   - This tells Render to treat the backend directory as the root of the application
   - Commands are executed from this directory
   - Only changes to files in this directory trigger auto-deployments

2. **Simplified Deployment**:
   - No need to worry about complex directory structures
   - No need to copy frontend files to the backend
   - The backend API runs as a standalone service

3. **API-Only Deployment**:
   - This deployment focuses on the backend API only
   - For a complete solution, you would:
     - Deploy the backend to Render as configured here
     - Deploy the frontend to a static hosting service like Netlify, Vercel, or Render's Static Site service
     - Configure the frontend to use the backend API URL

4. **Alternative Approach**:
   - If you want to serve the frontend from the same service, you would need to:
   - Build the frontend and copy the files to a directory the backend can serve
   - Configure the backend to serve these static files
   - This approach is more complex and prone to path-related issues

## Troubleshooting

If you encounter issues during deployment:

1. **Check the build logs** in the Render dashboard for any errors
2. **Verify environment variables** are correctly set
3. **Check for port conflicts** - ensure the application is using the port provided by Render
4. **Review the application logs** for runtime errors

### Common Issues and Solutions

#### 404 Errors / "Cannot GET /"

If you see "Cannot GET /" or 404 errors when accessing the deployed application:

1. **Check the build output** - Make sure the frontend build is being created successfully
   - Look for "Creating an optimized production build..." and "The build folder is ready to be deployed" in the logs
   - Verify that the `frontend/build` directory is being created

2. **Check the file paths** - The application is configured to look for frontend files in multiple locations:
   - `/frontend/build`
   - `/public`
   - `/build`
   - Backend's own `/public` directory (fallback)

3. **Verify static file serving** - The logs should show which directory is being used to serve static files
   - Look for "Found static files at: [path]" in the logs
   - If no static files are found, you'll see "No static files directory found!"

4. **Check the directory structure** - Run the check-dirs script to see the directory structure:
   ```
   node check-dirs.js
   ```

5. **Try accessing the API endpoints directly** - If the API endpoints work but the frontend doesn't, it's likely a static file serving issue
   - Try accessing `/health` to check if the API is working
   - Try accessing `/api/auth/login` to see if you get a proper API response (even if it's an error)

## Step-by-Step Deployment Guide

### 1. Deploy the Backend API

1. **Create a new Web Service on Render**
   - Sign in to your Render dashboard
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Use the following settings:
     - **Name**: content-moderation-api (or your preferred name)
     - **Root Directory**: `backend`
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

2. **Configure Environment Variables**
   - Add the following environment variables:
     ```
     NODE_ENV=production
     PORT=10000
     RENDER=true
     FRONTEND_URL=https://your-frontend-app.onrender.com
     
     # Supabase credentials
     SUPABASE_URL=your-supabase-url
     SUPABASE_ANON_KEY=your-supabase-anon-key
     SUPABASE_SERVICE_KEY=your-supabase-service-key
     
     # API keys for external services
     OPENAI_API_KEY=your-openai-api-key
     GOOGLE_CLOUD_VISION_API_KEY=your-google-cloud-vision-api-key
     ```

3. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend API
   - Note the URL of your deployed backend (e.g., `https://content-moderation-api.onrender.com`)

### 2. Deploy the Frontend

1. **Create a new Static Site on Render**
   - Sign in to your Render dashboard
   - Click "New" and select "Static Site"
   - Connect your GitHub repository
   - Use the following settings:
     - **Name**: content-moderation-frontend (or your preferred name)
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `build`

2. **Configure Environment Variables**
   - Add the following environment variables:
     ```
     REACT_APP_API_URL=https://your-backend-app.onrender.com
     REACT_APP_NODE_ENV=production
     
     # Supabase credentials (if needed on frontend)
     REACT_APP_SUPABASE_URL=your-supabase-url
     REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

3. **Deploy**
   - Click "Create Static Site"
   - Render will automatically build and deploy your frontend

## Notes

- This deployment approach separates the frontend and backend, which is a best practice for modern web applications
- The frontend is deployed as a static site, which is faster and more cost-effective
- The backend is deployed as a standalone API service
- In development mode, you can still run `npm run start:dev` from the root directory to start both the frontend and backend servers locally