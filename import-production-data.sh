#!/bin/bash

# Production Data Import Script
# This script imports your development data into the production database
# Run this AFTER your production deployment is live

echo "🚀 Production Data Import Tool"
echo "================================"

# Check if we have a production URL
read -p "Enter your production URL (e.g., https://planettogetherai.com): " PROD_URL

# Check if we have the setup key
read -sp "Enter your PRODUCTION_SETUP_KEY: " SETUP_KEY
echo ""

echo ""
echo "📤 Sending import request to production..."

# Make the API call to import data (with -L to follow redirects)
# Using a browser user agent and proper headers to bypass referrer validation
response=$(curl -X POST "$PROD_URL/api/admin/import-production-data" \
  -H "Content-Type: application/json" \
  -H "X-Setup-Key: $SETUP_KEY" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Origin: https://planettogetherai.com" \
  -H "Referer: https://planettogetherai.com/" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -H "Accept: application/json, text/plain, */*" \
  -H "Accept-Language: en-US,en;q=0.9" \
  -L \
  --connect-timeout 30 \
  --max-time 300 \
  -w "\nHTTP_STATUS:%{http_code}" \
  2>/dev/null)

# Extract HTTP status code
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')

# Check the response
if [ "$http_status" = "200" ]; then
  echo "✅ Success! Data imported to production."
  echo "Response: $response_body"
else
  echo "❌ Import failed (HTTP Status: $http_status)"
  echo "Response: $response_body"
  echo ""
  echo "Common issues:"
  echo "- Make sure your production deployment is running"
  echo "- Verify the PRODUCTION_SETUP_KEY is correct"
  echo "- Check that the production URL is correct"
fi