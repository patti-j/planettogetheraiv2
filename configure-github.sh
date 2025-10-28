#!/bin/bash

echo "🔧 Configuring GitHub remote with authenticated URL..."
echo ""

# Check if GITHUB_REPO_URL is set
if [ -z "$GITHUB_REPO_URL" ]; then
    echo "❌ Error: GITHUB_REPO_URL is not set in secrets"
    exit 1
fi

echo "✅ Found GITHUB_REPO_URL secret"
echo ""

# Remove existing origin if it exists
echo "Updating git remote configuration..."
git remote remove origin 2>/dev/null

# Add the authenticated origin
git remote add origin "$GITHUB_REPO_URL"

# Show the remotes (without exposing the token)
echo "Current git remotes:"
git remote -v | sed 's/ghp_[^ ]*/[TOKEN_HIDDEN]/g'
echo ""

# Test the connection without askpass
echo "Testing GitHub connection..."
export GIT_ASKPASS=""
export GIT_TERMINAL_PROMPT=0

if git ls-remote origin HEAD 2>/dev/null; then
    echo "✅ Successfully connected to GitHub!"
    echo ""
    
    # Try to fetch
    echo "Fetching latest from GitHub..."
    if git fetch origin 2>/dev/null; then
        echo "✅ Fetch successful!"
    else
        echo "⚠️  Could not fetch, but connection works"
    fi
else
    echo "❌ Connection failed. Please verify your token has 'repo' permissions"
fi

echo ""
echo "🎉 GitHub remote configuration complete!"
echo ""
echo "You can now use these commands:"
echo "  git push origin main     - Push changes to GitHub"
echo "  git pull origin main     - Pull latest from GitHub"
echo "  git fetch origin         - Fetch updates from GitHub"
echo ""
echo "To avoid askpass prompts, always use:"
echo "  GIT_ASKPASS='' git [command]"