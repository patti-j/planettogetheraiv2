#!/bin/bash

# Disable git askpass permanently for this session
export GIT_ASKPASS=""
export GIT_TERMINAL_PROMPT=0

echo "Testing GitHub connection with askpass disabled..."
git ls-remote origin HEAD

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Connection working!"
    echo ""
    echo "For future git commands in this shell, use:"
    echo "  git push origin main"
    echo "  git pull origin main"
    echo "  git fetch origin"
    echo ""
    echo "The askpass is now disabled for this session."
else
    echo "❌ Still having issues. Try the manual approach below."
fi