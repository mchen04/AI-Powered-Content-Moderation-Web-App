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
     - **Build Command**: `npm run build`
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

## Troubleshooting

If you encounter issues during deployment:

1. **Check the build logs** in the Render dashboard for any errors
2. **Verify environment variables** are correctly set
3. **Check for port conflicts** - ensure the application is using the port provided by Render
4. **Review the application logs** for runtime errors

## Notes

- The application is configured to use relative URLs in production, so the frontend will automatically connect to the backend on the same domain
- Static assets are served from the `build` directory
- All routes are configured to fall back to `index.html` for the single-page application