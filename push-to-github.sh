#!/bin/bash

# Script to push code to GitHub repository
# Repository: https://github.com/patti-j/planettogetherai.git

echo "Preparing to push code to GitHub..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Add the remote repository if not already added
if ! git remote | grep -q "origin"; then
    echo "Adding GitHub remote..."
    git remote add origin https://github.com/patti-j/planettogetherai.git
else
    echo "Remote 'origin' already exists"
fi

# Configure user (update with your details if needed)
git config user.name "patti-j"
git config user.email "patti.jorgensen@planettogether.com"

# Add all files
echo "Adding all files..."
git add .

# Create commit with descriptive message
echo "Creating commit..."
git commit -m "Enhanced Planning Overview with Strategic Alignment Framework

- Added comprehensive strategic planning framework to Planning Overview page
- Implemented 4 key business strategies: Cost Leadership, Customer Service Excellence, Innovation & Growth, Environmental Sustainability
- Each strategy includes objectives, KPIs, alignment check questions, and improvement actions
- Created visual alignment mapping showing how each planning step connects to strategic goals
- Added step-by-step guidance for implementing strategic alignment in daily planning activities
- Enhanced navigation with new Strategies tab in Planning Overview
- Updated replit.md with latest changes and strategic alignment features"

# Push to GitHub
echo "Pushing to GitHub..."
echo "You may be prompted for your GitHub username and password/token"
git push -u origin main

echo "Push complete! Your code is now on GitHub."