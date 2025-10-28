#!/bin/bash

echo "🔧 Testing GitHub connection with new credentials..."
echo ""

# Check if secrets are available
if [ -z "$GITHUB_REPO_URL" ]; then
    echo "❌ GITHUB_REPO_URL not found. Try running: source ~/.bashrc"
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not found. Try running: source ~/.bashrc"
    exit 1
fi

echo "✅ Secrets found in environment"
echo ""

# Update git remote with new URL
echo "Updating git remote..."
git remote remove origin 2>/dev/null
git remote add origin "$GITHUB_REPO_URL"
echo "✅ Remote updated"
echo ""

# Test the connection without askpass
echo "Testing connection to GitHub..."
export GIT_ASKPASS=""
export GIT_TERMINAL_PROMPT=0

if git ls-remote origin HEAD 2>/dev/null; then
    echo "✅ SUCCESS! GitHub connection is working!"
    echo ""
    echo "Fetching latest from GitHub..."
    git fetch origin 2>/dev/null && echo "✅ Fetch successful!"
    echo ""
    echo "🎉 Your GitHub authentication is fixed!"
    echo ""
    echo "You can now use these commands:"
    echo "  git push origin main"
    echo "  git pull origin main"
    echo "  git fetch origin"
    echo ""
    echo "Or with the gitfix wrapper:"
    echo "  ./gitfix push origin main"
    echo "  ./gitfix pull origin main"
else
    echo "❌ Connection failed. Please verify:"
    echo "   1. Your token has 'repo' permissions"
    echo "   2. The repository exists: github.com/patti-j/planettogetheraiv2"
    echo "   3. You have access to the repository"
fi