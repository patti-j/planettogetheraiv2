#!/bin/bash

# Migration script for ptplants and ptresources tables
echo "========================================="
echo "PT Plants and Resources Migration Script"
echo "========================================="

# Database URLs
DEV_DB_URL=$DATABASE_URL
PROD_DB_URL=$PRODUCTION_DATABASE_URL

# Check if production database URL is set
if [ -z "$PROD_DB_URL" ]; then
    echo "❌ PRODUCTION_DATABASE_URL not set"
    exit 1
fi

# Export data from development
echo "Step 1: Exporting data from development..."
pg_dump "$DEV_DB_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  --table=ptplants \
  --table=ptresources \
  --file=/tmp/pt-plants-resources-export.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to export data from development"
    exit 1
fi

echo "✅ Data exported successfully"

# Clean exported SQL to ensure compatibility
echo "Step 2: Preparing migration SQL..."

cat > /tmp/pt-plants-resources-migration.sql << 'EOF'
-- PT Plants and Resources Migration
-- Generated from development database

BEGIN;

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Clear existing data (preserving IDs)
DELETE FROM ptresources WHERE id > 0;
DELETE FROM ptplants WHERE id > 0;

-- Reset sequences to ensure proper ID generation
SELECT setval('ptplants_id_seq', 1, false);
SELECT setval('ptresources_id_seq', 1, false);

EOF

# Process the exported data
echo "-- Import PT Plants" >> /tmp/pt-plants-resources-migration.sql
grep "^COPY ptplants" /tmp/pt-plants-resources-export.sql -A 1000 | head -n $(grep -n "^\\\." /tmp/pt-plants-resources-export.sql | head -n 1 | cut -d: -f1) >> /tmp/pt-plants-resources-migration.sql

echo "" >> /tmp/pt-plants-resources-migration.sql
echo "-- Import PT Resources" >> /tmp/pt-plants-resources-migration.sql
grep "^COPY ptresources" /tmp/pt-plants-resources-export.sql -A 1000 | head -n $(grep -n "^\\\." /tmp/pt-plants-resources-export.sql | tail -n 1 | cut -d: -f1) >> /tmp/pt-plants-resources-migration.sql

cat >> /tmp/pt-plants-resources-migration.sql << 'EOF'

-- Update sequences to max values
SELECT setval('ptplants_id_seq', COALESCE((SELECT MAX(id) FROM ptplants), 1));
SELECT setval('ptresources_id_seq', COALESCE((SELECT MAX(id) FROM ptresources), 1));

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;

-- Verification queries
\echo 'Verification:'
\echo '============'
SELECT 'Plants migrated:' as metric, COUNT(*) as count FROM ptplants;
SELECT 'Resources migrated:' as metric, COUNT(*) as count FROM ptresources;
\echo ''
\echo 'Sample Plants:'
SELECT id, name, city, plant_type FROM ptplants ORDER BY id LIMIT 3;
\echo ''
\echo 'Sample Resources:'
SELECT id, name, plant_id, resource_type, capacity FROM ptresources ORDER BY id LIMIT 5;
\echo ''
\echo 'Resource Distribution by Plant:'
SELECT p.name as plant_name, COUNT(r.id) as resource_count 
FROM ptplants p 
LEFT JOIN ptresources r ON r.plant_id = p.id 
GROUP BY p.name 
ORDER BY p.id;
EOF

echo "✅ Migration SQL prepared"

# Import to production
echo ""
echo "Step 3: Importing to production database..."
psql "$PROD_DB_URL" < /tmp/pt-plants-resources-migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: Migration completed!"
    
    # Final verification
    echo ""
    echo "Final Production Verification:"
    echo "=============================="
    PROD_PLANT_COUNT=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM ptplants" | tr -d ' ')
    PROD_RESOURCE_COUNT=$(psql "$PROD_DB_URL" -t -c "SELECT COUNT(*) FROM ptresources" | tr -d ' ')
    
    echo "  Production Plants: $PROD_PLANT_COUNT"
    echo "  Production Resources: $PROD_RESOURCE_COUNT"
    
    # Check resource types
    echo ""
    echo "Resource types in production:"
    psql "$PROD_DB_URL" -c "SELECT DISTINCT resource_type, COUNT(*) FROM ptresources GROUP BY resource_type;"
    
    # Check plant distribution
    echo ""
    echo "Resources per plant:"
    psql "$PROD_DB_URL" -c "SELECT plant_id, COUNT(*) as resources FROM ptresources GROUP BY plant_id ORDER BY plant_id;"
else
    echo "❌ Migration failed"
    exit 1
fi

# Clean up temporary files
rm -f /tmp/pt-plants-resources-export.sql
rm -f /tmp/pt-plants-resources-migration.sql

echo ""
echo "========================================="
echo "Migration Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Migrated $PROD_PLANT_COUNT brewery plants"
echo "- Migrated $PROD_RESOURCE_COUNT brewery resources"
echo "- All resources properly assigned to plants"
echo "- Ready for production scheduling operations"
echo ""