#!/bin/bash

# Script to initialize Git repositories for both projects

echo "Initializing Git repositories for both projects..."

# Initialize ai-cinehub-general repository
echo "Initializing ai-cinehub-general repository..."
cd ai-cinehub-general
git init
git add .
git commit -m "Initial commit for ai-cinehub-general"
echo "ai-cinehub-general repository initialized!"
cd ..

# Initialize ai-cinehub-film repository
echo "Initializing ai-cinehub-film repository..."
cd ai-cinehub-film
git init
git add .
git commit -m "Initial commit for ai-cinehub-film"
echo "ai-cinehub-film repository initialized!"
cd ..

echo "Both repositories have been initialized!"
echo ""
echo "Next steps:"
echo "1. Create remote repositories on GitHub/GitLab/etc."
echo "2. Add the remote to each local repository:"
echo "   cd ai-cinehub-general"
echo "   git remote add origin <your-remote-url>"
echo "   git push -u origin main"
echo ""
echo "   cd ../ai-cinehub-film"
echo "   git remote add origin <your-remote-url>"
echo "   git push -u origin main"
echo ""
echo "Done!" 