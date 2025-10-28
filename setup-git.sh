#!/bin/bash

echo "Setting up GitHub remote..."

# First, let's add the origin remote
git remote add origin "https://${GITHUB_TOKEN}@github.com/patti-j/planettogetheraiv2.git" 2>/dev/null || {
    echo "Origin already exists, updating URL..."
    git remote set-url origin "https://${GITHUB_TOKEN}@github.com/patti-j/planettogetheraiv2.git"
}

echo "Remote added/updated successfully"
echo ""
echo "Current remotes:"
git remote -v | grep origin

echo ""
echo "To test the connection, run:"
echo "  GIT_ASKPASS='' git ls-remote origin HEAD"