#!/bin/bash

# This script helps commit and push changes to your GitHub repository
# for deployment to cloud platforms

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git first."
    exit 1
fi

# Check if the current directory is a git repository
if [ ! -d .git ]; then
    echo "This directory is not a git repository."
    exit 1
fi

# Get the current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $BRANCH"

# Add all files
echo "Adding all files to git..."
git add .

# Commit changes
echo "Committing changes..."
read -p "Enter commit message: " COMMIT_MESSAGE
git commit -m "$COMMIT_MESSAGE"

# Push to remote repository
echo "Pushing to remote repository..."
git push origin $BRANCH

echo "Changes pushed successfully!"
echo "You can now deploy your application using the instructions in the deployment guides."
