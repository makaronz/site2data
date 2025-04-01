#!/bin/bash

# This script installs system dependencies required for the application
# Run this script on your server if needed

# Update package lists
apt-get update

# Install pdftotext (part of poppler-utils)
apt-get install -y poppler-utils

echo "System dependencies installed successfully!"
