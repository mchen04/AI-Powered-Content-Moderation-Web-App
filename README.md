# ModeraAI

A comprehensive web application for moderating text and image content using AI technologies. This application leverages OpenAI for text analysis and Google Cloud Vision for image analysis to detect potentially harmful content.

## Demo Video

[![ModeraAI Demo](https://img.youtube.com/vi/eH3qMhRtl7o/0.jpg)](https://youtu.be/eH3qMhRtl7o)

Click the image above to watch the demo video.

## Features

- **Text Moderation**: Analyze text for toxicity, bias, and misinformation
- **Image Moderation**: Detect adult content, violence, and other concerning imagery in uploaded images or from URLs
- **User Dashboard**: View moderation history with filtering options
- **Customizable Settings**: Adjust sensitivity levels and enabled categories
- **External API**: Integrate content moderation into third-party applications
- **Authentication**: Secure user accounts with Supabase Auth
- **Dark/Light Mode**: Toggle between theme preferences

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Axios for API requests
- Supabase JS client for authentication
- React Dropzone for image uploads

### Backend
- Node.js with Express
- Supabase for database and authentication
- OpenAI API for text analysis
- Google Cloud Vision API for image analysis
- JWT-based authentication

### Database (Supabase)
- User accounts and authentication
- Moderation logs
- User settings
- API keys for external access

## Project Structure

The project is organized into two main folders:

### Frontend
```
frontend/
├── public/            # Static assets
└── src/
    ├── components/    # Reusable UI components
    ├── context/       # React context for state management
    ├── pages/         # Page components
    ├── services/      # API service utilities
    └── styles/        # CSS styles
```

### Backend
```
backend/
├── config/            # Configuration files
├── controllers/       # Request handlers
├── middleware/        # Authentication and validation
├── routes/            # API route definitions
├── services/          # External API integrations
└── utils/             # Helper utilities
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- OpenAI API key
- Google Cloud Vision API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/AI-Powered-Content-Moderation-Web-App.git
cd AI-Powered-Content-Moderation-Web-App
```

2. Install all dependencies at once
```bash
npm run install-all
```
This will install dependencies for the root project, backend, and frontend.

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
# API Keys
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

4. Set up Supabase
- Create a new Supabase project
- Run the SQL commands from `supabase-schema.sql` in the Supabase SQL editor
- This will set up the necessary tables with proper Row Level Security policies

5. Start both servers with a single command
```bash
npm start
```
This will concurrently run both the backend and frontend servers.

6. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run install-all`: Install dependencies for root, backend, and frontend
- `npm start`: Start both backend and frontend servers concurrently
- `npm run start:backend`: Start only the backend server
- `npm run start:frontend`: Start only the frontend server
- `npm run build`: Build the frontend for production
- `npm test`: Run tests for both backend and frontend

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `GET /api/auth/user`: Get current user information
- `POST /api/auth/logout`: Logout a user
- `POST /api/auth/refresh`: Refresh authentication token
- `POST /api/auth/reset-password`: Request password reset
- `POST /api/auth/reset-password/:token`: Reset password with token

### Text Moderation
- `POST /api/moderate-text`: Moderate text content
- `GET /api/moderate-text/history`: Get text moderation history

### Image Moderation
- `POST /api/moderate-image`: Moderate uploaded image
- `POST /api/moderate-image/url`: Moderate image from URL
- `GET /api/moderate-image/history`: Get image moderation history

### User Settings
- `GET /api/settings`: Get user settings
- `PUT /api/settings`: Update user settings
- `GET /api/settings/categories`: Get available moderation categories

### External API
- `POST /api/external/moderate-text`: Moderate text (requires API key)
- `POST /api/external/moderate-image`: Moderate image (requires API key)
- `POST /api/external/moderate-image-url`: Moderate image URL (requires API key)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for text analysis capabilities
- Google Cloud Vision for image analysis capabilities
- Supabase for database and authentication services
