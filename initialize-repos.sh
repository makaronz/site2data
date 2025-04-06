#!/bin/bash

# Script to initialize Git repositories for both projects

echo "Initializing Git repositories for both projects..."

# Initialize site2data-general repository
echo "Initializing site2data-general repository..."
cd site2data-general
git init
git add .
git commit -m "Initial commit for site2data-general"
echo "site2data-general repository initialized!"
cd ..

# Initialize site2data-film repository
echo "Initializing site2data-film repository..."
cd site2data-film
git init
git add .
git commit -m "Initial commit for site2data-film"
echo "site2data-film repository initialized!"
cd ..

echo "Both repositories have been initialized!"
echo ""
echo "Next steps:"
echo "1. Create remote repositories on GitHub/GitLab/etc."
echo "2. Add the remote to each local repository:"
echo "   cd site2data-general"
echo "   git remote add origin <your-remote-url>"
echo "   git push -u origin main"
echo ""
echo "   cd ../site2data-film"
echo "   git remote add origin <your-remote-url>"
echo "   git push -u origin main"
echo ""
echo "Done!" 