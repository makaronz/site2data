#!/bin/bash

# This script helps test the Docker deployment locally

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "No .env file found. Creating one..."
    echo "Please enter your OpenAI API key:"
    read API_KEY
    echo "OPENAI_API_KEY=$API_KEY" > .env
    echo ".env file created with your API key."
else
    echo ".env file found."
fi

# Create downloaded_content directory if it doesn't exist
if [ ! -d downloaded_content ]; then
    echo "Creating downloaded_content directory..."
    mkdir -p downloaded_content
    echo "Directory created."
else
    echo "downloaded_content directory found."
fi

# Build and start the Docker containers
echo "Building and starting Docker containers..."
docker-compose up --build

# Note: The script will wait here until docker-compose is stopped with Ctrl+C
# After that, the following commands will execute

echo "Docker containers stopped."
echo "You can restart the containers with 'docker-compose up' (without --build if no files changed)."
