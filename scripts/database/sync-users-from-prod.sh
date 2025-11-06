#!/bin/bash

# Script to sync users from production to development
echo "========================================="
echo "User Sync: Production → Development"
echo "========================================="

# Database URLs
DEV_DB_URL=$DATABASE_URL
PROD_DB_URL=$PRODUCTION_DATABASE_URL

# Check if production database URL is set
if [ -z "$PROD_DB_URL" ]; then
    echo "❌ PRODUCTION_DATABASE_URL not set"
    echo "Please set the PRODUCTION_DATABASE_URL environment variable first"
    exit 1
fi

# Export users from production
echo "Step 1: Exporting users from production..."

psql "$PROD_DB_URL" -c "\COPY (SELECT * FROM users ORDER BY id) TO '/tmp/prod-users.csv' WITH CSV HEADER;"
psql "$PROD_DB_URL" -c "\COPY (SELECT * FROM user_roles ORDER BY user_id, role_id) TO '/tmp/prod-user-roles.csv' WITH CSV HEADER;"

echo "✅ Users exported from production"

# Show what we're importing
echo ""
echo "Users to import:"
psql "$PROD_DB_URL" -c "SELECT id, username, email, first_name, last_name, active_role_id FROM users ORDER BY id;"

echo ""
echo "User roles to import:"
psql "$PROD_DB_URL" -c "SELECT ur.user_id, u.username, r.name as role_name 
FROM user_roles ur 
JOIN users u ON u.id = ur.user_id 
JOIN roles r ON r.id = ur.role_id 
ORDER BY ur.user_id, ur.role_id;"

# Create import script
cat > /tmp/import-users.sql << 'EOF'
BEGIN;

-- Temporarily disable triggers
SET session_replication_role = 'replica';

-- Clear existing users and their roles (preserving system structure)
DELETE FROM user_roles;
DELETE FROM users;

-- Reset the sequence
SELECT setval('users_id_seq', 1, false);

-- Import users from CSV
\COPY users FROM '/tmp/prod-users.csv' WITH CSV HEADER;

-- Import user roles
\COPY user_roles FROM '/tmp/prod-user-roles.csv' WITH CSV HEADER;

-- Update sequences to max values
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;

-- Verification
\echo ''
\echo 'Import Summary:'
\echo '==============='
SELECT 'Users imported:' as metric, COUNT(*) as count FROM users;
SELECT 'User role assignments:' as metric, COUNT(*) as count FROM user_roles;

\echo ''
\echo 'Users in Development:'
SELECT id, username, email, first_name || ' ' || last_name as full_name, 
       CASE 
         WHEN active_role_id = 11 THEN 'Administrator'
         WHEN active_role_id = 10 THEN 'Supply Chain Manager'
         WHEN active_role_id = 9 THEN 'Quality Manager'
         WHEN active_role_id = 8 THEN 'Inventory Manager'
         WHEN active_role_id = 7 THEN 'Maintenance Manager'
         WHEN active_role_id = 6 THEN 'Operations Manager'
         WHEN active_role_id = 5 THEN 'Production Supervisor'
         WHEN active_role_id = 4 THEN 'Production Planner'
         WHEN active_role_id = 3 THEN 'Shop Floor Operator'
         WHEN active_role_id = 2 THEN 'Scheduler'
         WHEN active_role_id = 1 THEN 'Viewer'
         ELSE 'No Active Role'
       END as active_role
FROM users 
ORDER BY id;

\echo ''
\echo 'Role Assignments:'
SELECT u.username, string_agg(r.name, ', ') as assigned_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON r.id = ur.role_id
GROUP BY u.id, u.username
ORDER BY u.id;
EOF

# Import to development
echo ""
echo "Step 2: Importing users to development..."
psql "$DEV_DB_URL" < /tmp/import-users.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: User sync completed!"
    
    # Final verification
    echo ""
    echo "Final Verification:"
    echo "==================="
    DEV_USER_COUNT=$(psql "$DEV_DB_URL" -t -c "SELECT COUNT(*) FROM users" | tr -d ' ')
    DEV_ROLE_COUNT=$(psql "$DEV_DB_URL" -t -c "SELECT COUNT(DISTINCT user_id) FROM user_roles" | tr -d ' ')
    
    echo "  Total users in development: $DEV_USER_COUNT"
    echo "  Users with role assignments: $DEV_ROLE_COUNT"
    
    # Show active roles distribution
    echo ""
    echo "Active role distribution:"
    psql "$DEV_DB_URL" -c "SELECT r.name as role_name, COUNT(u.id) as user_count 
    FROM roles r 
    LEFT JOIN users u ON u.active_role_id = r.id 
    WHERE u.id IS NOT NULL 
    GROUP BY r.name 
    ORDER BY user_count DESC;"
else
    echo "❌ Import failed"
    exit 1
fi

# Clean up temporary files
rm -f /tmp/prod-users.csv
rm -f /tmp/prod-user-roles.csv
rm -f /tmp/import-users.sql

echo ""
echo "========================================="
echo "User Sync Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Synced $DEV_USER_COUNT users from production"
echo "- All user roles preserved"
echo "- All passwords and settings maintained"
echo "- Development database now matches production users"
echo ""