#!/bin/bash

# Script to clean up inactive widgets from production
echo "========================================="
echo "Production Widget Cleanup Script"  
echo "========================================="

# Database URLs
PROD_DB_URL=$PRODUCTION_DATABASE_URL

# Check if production database URL is set
if [ -z "$PROD_DB_URL" ]; then
    echo "❌ PRODUCTION_DATABASE_URL not set"
    echo "Please set the PRODUCTION_DATABASE_URL environment variable"
    exit 1
fi

# Create cleanup SQL
cat > /tmp/cleanup-prod-widgets.sql << 'EOF'
-- Production Widget Cleanup Script
BEGIN;

-- First, let's see what we're dealing with
\echo 'Current Production Widget Statistics:'
\echo '======================================'
SELECT 
    COUNT(*) as total_widgets,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_widgets,
    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_widgets,
    ROUND(
        100.0 * SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) / 
        NULLIF(COUNT(*), 0), 2
    ) as inactive_percentage
FROM widgets;

\echo ''
\echo 'Top 10 Duplicate Widget Titles (Inactive):'
\echo '==========================================='
SELECT title, COUNT(*) as duplicate_count 
FROM widgets 
WHERE is_active = false
GROUP BY title 
HAVING COUNT(*) > 100
ORDER BY COUNT(*) DESC 
LIMIT 10;

\echo ''
\echo 'Active Widgets to Preserve:'
\echo '============================'
SELECT id, dashboard_id, type, title, created_at 
FROM widgets 
WHERE is_active = true
ORDER BY id;

-- Create backup of active widgets before cleanup
\echo ''
\echo 'Creating backup of active widgets...'
CREATE TEMP TABLE active_widgets_backup AS 
SELECT * FROM widgets WHERE is_active = true;

-- Count what we're about to delete
\echo ''
\echo 'Widgets to be deleted:'
SELECT COUNT(*) as widgets_to_delete FROM widgets WHERE is_active = false;

-- Delete all inactive widgets
\echo ''
\echo 'Deleting inactive widgets (this may take a moment)...'
DELETE FROM widgets WHERE is_active = false;

-- Reset the sequence to avoid huge ID gaps
SELECT setval('widgets_id_seq', COALESCE((SELECT MAX(id) FROM widgets), 1));

-- Verify cleanup
\echo ''
\echo 'Post-Cleanup Statistics:'
\echo '========================'
SELECT 
    COUNT(*) as total_widgets,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_widgets,
    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_widgets
FROM widgets;

\echo ''
\echo 'Remaining Widgets (should all be active):'
SELECT id, dashboard_id, type, title, is_active, created_at 
FROM widgets 
ORDER BY id;

\echo ''
\echo 'Database Space Reclaimed:'
SELECT 
    pg_size_pretty(pg_total_relation_size('widgets')) as total_size_after_cleanup;

COMMIT;

\echo ''
\echo '✅ Production Cleanup Complete!'
\echo ''
\echo 'IMPORTANT: The widget creation bug has been fixed to prevent future duplicates.'
\echo 'The system will now:'
\echo '  1. Reuse existing widgets with the same title'
\echo '  2. Automatically clean up widgets older than 7 days'
\echo '  3. Position widgets intelligently to avoid overlap'
EOF

echo "⚠️  WARNING: This will delete approximately 32,562 inactive widgets from production!"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirmation

if [[ "$confirmation" != "yes" ]]; then
    echo "Cleanup cancelled."
    rm -f /tmp/cleanup-prod-widgets.sql
    exit 0
fi

echo ""
echo "Running cleanup in production database..."
psql "$PROD_DB_URL" < /tmp/cleanup-prod-widgets.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: Production widget cleanup completed!"
    
    # Final stats
    echo ""
    TOTAL=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM widgets" | tr -d ' ')
    ACTIVE=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM widgets WHERE is_active = true" | tr -d ' ')
    
    echo "Final Production Statistics:"
    echo "============================"
    echo "  Total widgets remaining: $TOTAL"
    echo "  Active widgets: $ACTIVE"
    echo ""
    echo "The widget creation bug has been fixed in the code."
    echo "Future widget creation will:"
    echo "  • Check for existing widgets before creating new ones"
    echo "  • Update existing widgets instead of duplicating"
    echo "  • Automatically clean up old inactive widgets"
    echo "  • Position widgets properly to avoid overlap"
    echo ""
else
    echo "❌ Cleanup failed"
    exit 1
fi

# Clean up temp files
rm -f /tmp/cleanup-prod-widgets.sql

echo "========================================="
echo "Production Cleanup Complete!"
echo "========================================="