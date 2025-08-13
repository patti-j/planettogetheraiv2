#!/bin/bash

echo "🚀 Preparing PlanetTogether for GitHub..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Remove any existing remote
git remote remove origin 2>/dev/null

# Add all files respecting .gitignore
echo "📝 Adding files to git (respecting .gitignore)..."
git add .

# Show what will be committed
echo ""
echo "📋 Files to be committed:"
git status --short

echo ""
echo "⚠️  Please verify that no sensitive files are being committed:"
echo "   - .env should NOT be listed (only .env.example)"
echo "   - .npmrc should NOT be listed (contains Bryntum credentials)"
echo "   - Database credentials should NOT appear in any files"
echo ""

read -p "Do you want to continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create initial commit
    echo "💾 Creating initial commit..."
    git commit -m "Initial commit: PlanetTogether Manufacturing ERP System"
    
    echo ""
    echo "✅ Repository is ready for GitHub!"
    echo ""
    echo "Next steps:"
    echo "1. Create a new repository on GitHub"
    echo "2. Add the remote: git remote add origin https://github.com/yourusername/planettogether-erp.git"
    echo "3. Push to GitHub: git push -u origin main"
    echo ""
    echo "📚 Documentation:"
    echo "   - README.md has been created with full project documentation"
    echo "   - .env.example shows all required environment variables"
    echo "   - .gitignore protects sensitive files"
else
    echo "❌ Aborted. No changes were made."
fi