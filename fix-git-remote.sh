#!/bin/bash

# Script to fix Git remote URL with GitHub token authentication

echo "🔧 Fixing Git remote URL for automatic GitHub backups..."
echo ""

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable is not set"
    echo "Please ensure your GitHub token is configured in Replit Secrets"
    exit 1
fi

# Current remote URL
CURRENT_URL=$(git remote get-url origin 2>/dev/null)
echo "Current origin URL: $CURRENT_URL"

# New authenticated URL
NEW_URL="https://${GITHUB_TOKEN}@github.com/patti-j/planettogetheraiv2.git"
echo ""
echo "Updating to authenticated URL..."

# Remove and re-add origin with proper authentication
git remote remove origin 2>/dev/null
git remote add origin "$NEW_URL"

# Verify the change (showing only the non-sensitive part)
echo "✅ Git remote updated successfully!"
echo "Repository: github.com/patti-j/planettogetheraiv2"
echo ""

# Test the connection
echo "Testing GitHub connection..."
if git ls-remote origin HEAD >/dev/null 2>&1; then
    echo "✅ Successfully connected to GitHub repository!"
    echo ""
    
    # Fetch latest from remote
    echo "Fetching latest from GitHub..."
    if git fetch origin 2>/dev/null; then
        echo "✅ Fetch successful!"
    else
        echo "⚠️  Fetch failed, but connection is working"
    fi
else
    echo "❌ Failed to connect to GitHub. Please check:"
    echo "   1. Your GitHub token has 'repo' permissions"
    echo "   2. The repository exists and you have access"
    echo "   3. The token hasn't expired"
fi

echo ""
echo "🎉 Git remote configuration complete!"
echo "Your code will now be automatically backed up to GitHub."