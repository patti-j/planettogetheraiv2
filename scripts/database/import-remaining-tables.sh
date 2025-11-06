#!/bin/bash

# Import remaining tables to production (excluding widgets)
# This script extracts specific tables from the production-import.sql and imports them

echo "========================================="
echo "Importing Remaining Tables to Production"
echo "========================================="

# Production database URL
PRODUCTION_DB_URL='postgresql://neondb_owner:npg_w5lZzCTE9GhU@ep-jolly-frost-a6k900yx.us-west-2.aws.neon.tech/neondb?sslmode=require'

# Tables to import (excluding those already imported and widgets)
TABLES_TO_IMPORT=(
  "dashboards"
  "user_preferences"
  "ptjobs"
  "ptjoboperations"
  "agent_recommendations"
  "schedule_versions"
)

# Source file
SOURCE_FILE="database-exports/production-import.sql"
TEMP_FILE="database-exports/temp-import.sql"

echo "Creating temporary import file..."
> "$TEMP_FILE"

# Extract data for each table
for TABLE in "${TABLES_TO_IMPORT[@]}"; do
  echo "Extracting data for table: $TABLE"
  
  # Extract INSERT statements for this table
  grep "^INSERT INTO $TABLE " "$SOURCE_FILE" >> "$TEMP_FILE" 2>/dev/null || echo "  No data found for $TABLE"
done

# Check if we have any data to import
if [ ! -s "$TEMP_FILE" ]; then
  echo "No data to import found in the export file."
  exit 0
fi

echo ""
echo "Tables to import:"
echo "-----------------"
for TABLE in "${TABLES_TO_IMPORT[@]}"; do
  COUNT=$(grep -c "^INSERT INTO $TABLE " "$TEMP_FILE" 2>/dev/null || echo "0")
  if [ "$COUNT" -gt 0 ]; then
    echo "  - $TABLE: $COUNT INSERT statements"
  fi
done

echo ""
echo "Starting import to production database..."
echo ""

# Import the data
psql "$PRODUCTION_DB_URL" < "$TEMP_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Import completed successfully!"
  
  # Verify the import
  echo ""
  echo "Verifying imported data:"
  echo "------------------------"
  
  for TABLE in "${TABLES_TO_IMPORT[@]}"; do
    COUNT=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(*) FROM $TABLE" 2>/dev/null | tr -d ' ')
    if [ -n "$COUNT" ] && [ "$COUNT" != "0" ]; then
      echo "  ✓ $TABLE: $COUNT records"
    fi
  done
else
  echo ""
  echo "❌ Import failed. Please check the error messages above."
  exit 1
fi

# Clean up temp file
rm -f "$TEMP_FILE"

echo ""
echo "========================================="
echo "Import Complete!"
echo "========================================="