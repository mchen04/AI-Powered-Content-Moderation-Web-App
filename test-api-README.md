# ModeraAI API Test Script

This script tests the functionality of the ModeraAI API endpoints, including both authenticated and external API endpoints.

## Features

- Tests user authentication (register, login)
- Tests text moderation
- Tests image URL moderation
- Tests API key generation
- Tests external API endpoints with API key

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- ModeraAI backend server running on port 3003 (default)

## Installation

1. Install dependencies:

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

## Usage

Run the test script:

```bash
npm test
```

Or with node directly:

```bash
node test-api.js
```

## Configuration

You can modify the following variables in the script:

- `API_BASE_URL`: The base URL of the API (default: http://localhost:3003)
- `TEST_USER`: Test user credentials
- `TEST_TEXT`: Sample text for moderation testing
- `TEST_IMAGE_URL`: Sample image URL for moderation testing

## Test Flow

1. Register a new user (or use existing if already registered)
2. Login to get authentication token
3. Get current user information
4. Test text moderation with authentication
5. Test image URL moderation with authentication
6. Generate or retrieve API key
7. Test external API text moderation with API key
8. Test external API image URL moderation with API key

## Output

The script provides colored console output to indicate:
- Steps being executed (cyan)
- Successful operations (green)
- Warnings (yellow)
- Errors (red)
- Results (magenta)

## Troubleshooting

If you encounter errors:

1. Make sure the backend server is running on the correct port
2. Check that the database is properly set up
3. Verify that the API endpoints match those in the script
4. Check for any network issues or firewall restrictions

## Note

This script is for testing purposes only and should not be used in production environments.