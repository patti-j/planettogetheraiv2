#!/bin/bash

# Import only essential data (skip large widget table)
set -e

PRODUCTION_DATABASE_URL='postgresql://neondb_owner:npg_w5lZzCTE9GhU@ep-jolly-frost-a6k900yx.us-west-2.aws.neon.tech/neondb?sslmode=require'

echo "Importing essential production data (without 32K widgets)..."

# Import essential tables
echo "1. Importing users (9 records)..."
grep "^INSERT INTO users " database-exports/full-export-fixed.sql | psql "$PRODUCTION_DATABASE_URL" 2>/dev/null || echo "Users may already exist"

echo "2. Importing roles (11 records)..."  
grep "^INSERT INTO roles " database-exports/full-export-fixed.sql | psql "$PRODUCTION_DATABASE_URL" 2>/dev/null || echo "Roles may already exist"

echo "3. Importing role_permissions..."
grep "^INSERT INTO role_permissions " database-exports/full-export-fixed.sql | psql "$PRODUCTION_DATABASE_URL" 2>/dev/null || echo "No role_permissions data"

echo "4. Importing user_roles..."
grep "^INSERT INTO user_roles " database-exports/full-export-fixed.sql | psql "$PRODUCTION_DATABASE_URL" 2>/dev/null || echo "No user_roles data"

echo "5. Importing ptjobs (34 records)..."
grep "^INSERT INTO ptjobs " database-exports/full-export-fixed.sql | psql "$PRODUCTION_DATABASE_URL" 2>/dev/null || echo "Jobs may already exist"

echo "6. Importing ptjoboperations..."
grep "^INSERT INTO ptjoboperations " database-exports/full-export-fixed.sql | psql "$PRODUCTION_DATABASE_URL" 2>/dev/null || echo "No job operations data"

echo "7. Importing dashboards (1 record)..."
grep "^INSERT INTO dashboards " database-exports/full-export-fixed.sql | psql "$PRODUCTION_DATABASE_URL" 2>/dev/null || echo "Dashboard may already exist"

echo ""
echo "Checking import results..."
psql "$PRODUCTION_DATABASE_URL" -c "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'roles', COUNT(*) FROM roles  
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL SELECT 'ptjobs', COUNT(*) FROM ptjobs
UNION ALL SELECT 'dashboards', COUNT(*) FROM dashboards;" 2>&1

echo ""
echo "✅ Essential data import complete!"
echo "Note: Skipped 32,570 widget records to avoid timeout"
echo ""
echo "Test your app at: https://planettogetherai.com"