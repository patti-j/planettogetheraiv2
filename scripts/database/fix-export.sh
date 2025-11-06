#!/bin/bash

# Fix column name mismatches in export file
echo "Fixing column name mismatches in export file..."

# Create fixed version
sed 's/createdAt/created_at/g; s/updatedAt/updated_at/g' \
    database-exports/full-export-2025-11-05T20-14-35.sql \
    > database-exports/full-export-fixed.sql

echo "Fixed export created: database-exports/full-export-fixed.sql"
echo "Size: $(ls -lh database-exports/full-export-fixed.sql | awk '{print $5}')"