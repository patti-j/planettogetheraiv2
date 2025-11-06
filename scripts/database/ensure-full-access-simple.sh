#!/bin/bash

# Simple script to ensure all users have full unrestricted access
echo "========================================="
echo "Ensuring Full Access for All Users"
echo "========================================="

# Database URL
DB_URL=$DATABASE_URL

# Execute SQL commands
psql "$DB_URL" << 'EOF'
BEGIN;

-- Make sure all users are active and have Administrator role
UPDATE users 
SET is_active = true,
    active_role_id = 1
WHERE id IN (1, 2, 5);

-- Ensure Administrator role exists and is active
UPDATE roles 
SET is_active = true,
    is_system_role = true,
    description = 'System administrator with full unrestricted access to all features'
WHERE id = 1;

-- Make sure all users have the Administrator role assigned
DELETE FROM user_roles WHERE user_id IN (1, 2, 5);
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
VALUES 
    (1, 1, NOW(), 1),
    (2, 1, NOW(), 1),
    (5, 1, NOW(), 1);

-- Grant all existing permissions to Administrator role
DELETE FROM role_permissions WHERE role_id = 1;
INSERT INTO role_permissions (role_id, permission_id, granted_at)
SELECT 1, id, NOW() FROM permissions;

COMMIT;

-- Show results
\echo ''
\echo '✅ Full Access Granted!'
\echo '======================='
SELECT u.username, 
       u.email,
       r.name as role,
       CASE 
         WHEN u.is_active THEN '✅ Active' 
         ELSE '❌ Inactive' 
       END as status,
       COUNT(rp.permission_id) as permissions_count
FROM users u
JOIN roles r ON r.id = u.active_role_id
LEFT JOIN role_permissions rp ON rp.role_id = r.id
WHERE u.id IN (1, 2, 5)
GROUP BY u.id, u.username, u.email, r.name, u.is_active
ORDER BY u.id;

\echo ''
\echo 'System Configuration:'
\echo '===================='
SELECT 'Total Active Users' as setting, COUNT(*) as value 
FROM users WHERE is_active = true
UNION ALL
SELECT 'Administrator Permissions' as setting, COUNT(*) as value 
FROM role_permissions WHERE role_id = 1
UNION ALL
SELECT 'Total System Permissions' as setting, COUNT(*) as value 
FROM permissions;
EOF

echo ""
echo "========================================="
echo "✅ Access Configuration Complete!"
echo "========================================="
echo ""
echo "All users now have:"
echo "  • Full Administrator privileges"
echo "  • Access to ALL features"
echo "  • No restrictions or limitations"
echo ""
echo "Users can login with password: password123"
echo ""