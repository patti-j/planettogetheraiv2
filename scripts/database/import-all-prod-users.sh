#!/bin/bash

# Script to import all 8 production users into development
echo "========================================="
echo "Importing All 8 Production Users"
echo "========================================="

# Database URL
DB_URL=$DATABASE_URL

# Create SQL script with all 8 production users
cat > /tmp/import-all-users.sql << 'EOF'
BEGIN;

-- Clear existing users to avoid conflicts
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequence
SELECT setval('users_id_seq', 1, false);

-- Insert all 8 production users with their actual data
INSERT INTO users (id, username, email, first_name, last_name, password_hash, is_active, active_role_id, avatar, job_title, department, phone_number, created_at, updated_at) 
VALUES 
  -- User 1: Kevin Burrell (CEO)
  (1, 'kevin_burrell', 'kevin.burrell@planettogether.com', 'Kevin', 'Burrell', 
   '$2b$10$xR6flI7qm6Eed2uY3VnPyeXWap/xDSAZe5Yjhgs6zwCuTey63dz4y', 
   true, 1, NULL, 'Chief Executive Officer', 'Executive', NULL, 
   '2025-08-27T16:50:34.843Z', NOW()),
   
  -- User 2: Production Manager
  (2, 'production_manager', 'pm@company.com', 'Production', 'Manager', 
   '$2b$10$xR6flI7qm6Eed2uY3VnPyeXWap/xDSAZe5Yjhgs6zwCuTey63dz4y', 
   true, 1, NULL, 'Production Manager', 'Operations', NULL, 
   '2025-08-03T18:35:29.789Z', NOW()),
   
  -- User 3: Anthony Nelson
  (3, 'anthony.nelson', 'anthony.nelson@planettogether.com', 'Anthony', 'Nelson', 
   '$2b$10$xR6flI7qm6Eed2uY3VnPyeXWap/xDSAZe5Yjhgs6zwCuTey63dz4y', 
   true, 1, NULL, 'Operations Director', 'Operations', NULL, 
   '2025-08-27T16:48:15.322Z', NOW()),
   
  -- User 4: Patti Jorgensen (COO)
  (4, 'patti', 'patti.jorgensen@planettogether.com', 'Patti', 'Jorgensen', 
   '$2b$10$xR6flI7qm6Eed2uY3VnPyeXWap/xDSAZe5Yjhgs6zwCuTey63dz4y', 
   true, 1, NULL, 'Chief Operating Officer', 'Executive', '555-0001', 
   '2025-08-03T18:35:29.789Z', NOW()),
   
  -- User 5: Jim Cerra (CTO)
  (5, 'Jim', 'jim.cerra@planettogether.com', 'Jim', 'Cerra', 
   '$2b$10$xR6flI7qm6Eed2uY3VnPyeXWap/xDSAZe5Yjhgs6zwCuTey63dz4y', 
   true, 1, NULL, 'Chief Technology Officer', 'Technology', NULL, 
   '2025-08-13T05:30:16.164Z', NOW()),
   
  -- User 6: Greg Heffernan (KPMG)
  (6, 'gheffernan', 'gheffernan@kpmg.com', 'Greg', 'Heffernan', 
   '$2b$10$xR6flI7qm6Eed2uY3VnPyeXWap/xDSAZe5Yjhgs6zwCuTey63dz4y', 
   true, 1, NULL, 'Senior Consultant', 'Consulting', NULL, 
   '2025-08-27T16:48:15.322Z', NOW()),
   
  -- User 7: Pouria (System Admin)
  (7, 'Pouria', 'pouria@admin.com', 'Pouria', 'Admin', 
   '$2b$10$xR6flI7qm6Eed2uY3VnPyeXWap/xDSAZe5Yjhgs6zwCuTey63dz4y', 
   true, 1, NULL, 'System Administrator', 'IT', NULL, 
   '2025-10-30T19:57:59.236Z', NOW()),
   
  -- User 8: Admin (System)
  (8, 'admin', 'admin@planettogether.com', 'Admin', 'User', 
   '$2b$10$xR6flI7qm6Eed2uY3VnPyeXWap/xDSAZe5Yjhgs6zwCuTey63dz4y', 
   true, 1, NULL, 'System Administrator', 'IT', NULL, 
   '2025-11-05T19:49:48.181Z', NOW());

-- Update sequence to continue from highest ID
SELECT setval('users_id_seq', GREATEST(8, (SELECT MAX(id) FROM users)));

-- Ensure Administrator role exists
INSERT INTO roles (id, name, description, is_active, is_system_role)
VALUES (1, 'Administrator', 'System administrator with full access', true, true)
ON CONFLICT (id) DO UPDATE 
SET is_active = true, is_system_role = true;

-- Assign Administrator role to all users
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
SELECT id, 1, NOW(), 1 FROM users
ON CONFLICT DO NOTHING;

-- Grant all permissions to Administrator role
DELETE FROM role_permissions WHERE role_id = 1;
INSERT INTO role_permissions (role_id, permission_id, granted_at)
SELECT 1, id, NOW() FROM permissions;

COMMIT;

-- Verification
\echo ''
\echo 'Import Complete!'
\echo '================'
\echo ''
\echo 'All 8 Production Users:'
SELECT id, username, email, 
       first_name || ' ' || last_name as full_name,
       COALESCE(job_title, 'N/A') as job_title,
       COALESCE(department, 'N/A') as department
FROM users 
ORDER BY id;

\echo ''
\echo 'Summary:'
SELECT 'Total Users' as metric, COUNT(*) as count FROM users
UNION ALL
SELECT 'Active Users' as metric, COUNT(*) as count FROM users WHERE is_active = true
UNION ALL
SELECT 'Users with Admin Role' as metric, COUNT(*) as count FROM users WHERE active_role_id = 1;
EOF

echo "Importing users from production..."
psql "$DB_URL" < /tmp/import-all-users.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ All 8 Users Imported Successfully!"
    echo "========================================="
    echo ""
    echo "Users imported:"
    echo "  1. kevin_burrell - CEO"
    echo "  2. production_manager - Production Manager"
    echo "  3. anthony.nelson - Operations Director"
    echo "  4. patti - COO"
    echo "  5. Jim - CTO"
    echo "  6. gheffernan - KPMG Consultant"
    echo "  7. Pouria - System Administrator"
    echo "  8. admin - System Admin"
    echo ""
    echo "All users can login with password: password123"
    echo "All users have full Administrator access"
    echo ""
else
    echo "❌ Import failed"
    exit 1
fi

# Clean up
rm -f /tmp/import-all-users.sql

echo "========================================="
echo "Import Complete!"
echo "========================================="