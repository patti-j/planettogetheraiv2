#!/bin/bash

# Production User Setup Script
# This script ensures Patti and Jim have full Administrator access in production
# Run this after deploying to production or when updating user permissions

echo "==============================================="
echo "🚀 PRODUCTION USER ACCESS SETUP"
echo "==============================================="
echo ""
echo "This script will ensure users 'patti' and 'Jim' have"
echo "full Administrator access in production."
echo ""

# Check if custom password is provided
if [ -z "$PRODUCTION_SETUP_KEY" ]; then
    echo "⚠️  No PRODUCTION_SETUP_KEY environment variable found."
    echo "   Using default password (change immediately after setup!)"
    echo ""
fi

# Set NODE_ENV to production if not already set
export NODE_ENV=${NODE_ENV:-production}

echo "Environment: $NODE_ENV"
echo ""
echo "Setting up production users..."
echo "----------------------------------------------"

# Run the TypeScript setup script
npx tsx scripts/database/ensure-production-users-access.ts

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "==============================================="
    echo "✅ PRODUCTION SETUP COMPLETE!"
    echo "==============================================="
    echo ""
    echo "Users with full access:"
    echo "  • patti@planettogether.com"
    echo "  • jim@planettogether.com"
    echo ""
    echo "⚠️  SECURITY REMINDER:"
    echo "  1. Change default passwords immediately"
    echo "  2. Set PRODUCTION_SETUP_KEY for custom password"
    echo "  3. Enable 2FA for these admin accounts"
    echo ""
    echo "==============================================="
else
    echo ""
    echo "❌ ERROR: Production setup failed!"
    echo "Please check the logs above for details."
    exit 1
fi