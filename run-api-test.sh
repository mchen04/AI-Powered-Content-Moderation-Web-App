#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ModeraAI API Test Runner ===${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js to run this test.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm is not installed. Please install npm to run this test.${NC}"
    exit 1
fi

# Check if the backend server is running
echo -e "${BLUE}Checking if the backend server is running...${NC}"
if ! curl -s http://localhost:3003/api/health > /dev/null; then
    echo -e "${YELLOW}Warning: Backend server does not appear to be running on port 3003.${NC}"
    echo -e "${YELLOW}Make sure the server is running before proceeding.${NC}"
    
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Test aborted.${NC}"
        exit 1
    fi
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install --prefix . axios form-data

# Run the test
echo -e "${BLUE}Running API tests...${NC}"
node test-api.js

echo -e "${GREEN}Test script execution completed.${NC}"