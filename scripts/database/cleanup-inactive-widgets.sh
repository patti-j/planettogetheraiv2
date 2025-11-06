#!/bin/bash

# Script to clean up inactive widgets
echo "========================================="
echo "Widget Cleanup Script"
echo "========================================="

# Database URL
DB_URL=$DATABASE_URL

# Create cleanup SQL
cat > /tmp/cleanup-widgets.sql << 'EOF'
-- Widget Cleanup Script
BEGIN;

-- First, let's see what we're dealing with
\echo 'Current Widget Statistics:'
\echo '=========================='
SELECT 
    COUNT(*) as total_widgets,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_widgets,
    SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_widgets
FROM widgets;

\echo ''
\echo 'Duplicate Analysis (Top 10 titles):'
SELECT title, COUNT(*) as count 
FROM widgets 
WHERE is_active = false
GROUP BY title 
ORDER BY COUNT(*) DESC 
LIMIT 10;

-- Create backup of active widgets before cleanup
\echo ''
\echo 'Backing up active widgets...'
CREATE TEMP TABLE active_widgets_backup AS 
SELECT * FROM widgets WHERE is_active = true;

-- Delete all inactive widgets
\echo ''
\echo 'Deleting inactive widgets...'
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
\echo 'Active Widgets Preserved:'
SELECT id, dashboard_id, type, title, created_at 
FROM widgets 
ORDER BY id;

COMMIT;

\echo ''
\echo '✅ Cleanup Complete!'
EOF

echo "Running cleanup in development database..."
psql "$DB_URL" < /tmp/cleanup-widgets.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: Widget cleanup completed!"
    
    # Final stats
    echo ""
    TOTAL=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM widgets" | tr -d ' ')
    ACTIVE=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM widgets WHERE is_active = true" | tr -d ' ')
    
    echo "Final Statistics:"
    echo "================="
    echo "  Total widgets remaining: $TOTAL"
    echo "  Active widgets: $ACTIVE"
    echo ""
else
    echo "❌ Cleanup failed"
    exit 1
fi

# Clean up temp files
rm -f /tmp/cleanup-widgets.sql

echo "========================================="
echo "Cleanup Complete!"
echo "========================================="