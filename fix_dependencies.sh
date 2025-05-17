#!/bin/bash

# This script fixes npm dependency conflicts by reinstalling with --legacy-peer-deps flag

echo "Fixing npm dependencies..."

# Remove node_modules and package-lock.json
rm -rf node_modules
rm -f package-lock.json

# Reinstall dependencies with --legacy-peer-deps
npm install --legacy-peer-deps

echo "Dependencies fixed successfully!"

# Check if there are subdirectories with package.json
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo "Fixing frontend dependencies..."
  cd frontend
  rm -rf node_modules
  rm -f package-lock.json
  npm install --legacy-peer-deps
  cd ..
fi

if [ -d "backend" ] && [ -f "backend/package.json" ]; then
  echo "Fixing backend dependencies..."
  cd backend
  rm -rf node_modules
  rm -f package-lock.json
  npm install --legacy-peer-deps
  cd ..
fi

echo "All dependencies have been fixed!"
echo "You can now build and run the application." 