#!/bin/bash

# Script to grant full access to all users in development
echo "========================================="
echo "Granting Full Access to All Users"
echo "========================================="

# Database URL
DB_URL=$DATABASE_URL

# Create SQL script
cat > /tmp/grant-full-access.sql << 'EOF'
BEGIN;

-- Ensure all users have Administrator role (ID: 1)
UPDATE users 
SET active_role_id = 1 
WHERE active_role_id IS NULL OR active_role_id != 1;

-- Make sure Administrator role is fully active
UPDATE roles 
SET is_active = true,
    description = 'System administrator with full access to all features'
WHERE id = 1;

-- Ensure all users are assigned to Administrator role
INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
SELECT u.id, 1, NOW(), 1
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = 1
);

-- Create all possible permissions if they don't exist
DO $$
DECLARE
    features text[] := ARRAY[
        'dashboard', 'jobs', 'resources', 'plants', 'materials', 
        'inventory', 'scheduling', 'reports', 'settings', 'users',
        'algorithms', 'master-data', 'production-scheduler', 'smart-kpi',
        'workflow-automation', 'agents', 'alerts', 'recommendations',
        'global-control-tower', 'voice-chat', 'forecasting', 'paginated-reports',
        'scenario-planning', 'capacity-planning', 'optimization', 'analytics',
        'import', 'export', 'ai', 'max-ai', 'admin', 'system'
    ];
    actions text[] := ARRAY[
        'view', 'create', 'edit', 'delete', 'execute', 
        'publish', 'approve', 'configure', 'manage', 'admin'
    ];
    feat text;
    act text;
    perm_id integer;
BEGIN
    FOREACH feat IN ARRAY features LOOP
        FOREACH act IN ARRAY actions LOOP
            -- Insert permission if it doesn't exist
            INSERT INTO permissions (name, feature, action, description)
            VALUES (
                feat || ':' || act, 
                feat, 
                act, 
                act || ' ' || feat
            )
            ON CONFLICT (feature, action) DO NOTHING;
            
            -- Get the permission ID
            SELECT id INTO perm_id 
            FROM permissions 
            WHERE feature = feat AND action = act;
            
            -- Grant this permission to Administrator role
            INSERT INTO role_permissions (role_id, permission_id, granted_at)
            VALUES (1, perm_id, NOW())
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Additional system-wide permissions
INSERT INTO permissions (name, feature, action, description)
VALUES 
    ('system:full_access', 'system', 'full_access', 'Complete system access'),
    ('system:bypass_restrictions', 'system', 'bypass_restrictions', 'Bypass all restrictions'),
    ('system:debug', 'system', 'debug', 'Debug mode access')
ON CONFLICT (feature, action) DO NOTHING;

-- Grant these special permissions to Administrator
INSERT INTO role_permissions (role_id, permission_id, granted_at)
SELECT 1, id, NOW()
FROM permissions 
WHERE feature = 'system' AND action IN ('full_access', 'bypass_restrictions', 'debug')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Ensure all users are active
UPDATE users SET is_active = true;

COMMIT;

-- Verification
\echo ''
\echo 'Access Grant Summary:'
\echo '===================='
SELECT 'Total Users:' as metric, COUNT(*) as count FROM users WHERE is_active = true;
SELECT 'Users with Admin Role:' as metric, COUNT(*) as count FROM users WHERE active_role_id = 1;
SELECT 'Total Permissions:' as metric, COUNT(*) as count FROM permissions;
SELECT 'Admin Permissions:' as metric, COUNT(*) as count FROM role_permissions WHERE role_id = 1;

\echo ''
\echo 'User Access Status:'
\echo '==================='
SELECT u.username, 
       'Administrator' as role,
       'Full Access' as access_level,
       CASE WHEN u.is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM users u
ORDER BY u.id;

\echo ''
\echo 'Feature Access (Sample):'
\echo '======================='
SELECT DISTINCT feature, 
       COUNT(DISTINCT action) as available_actions
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 1
GROUP BY feature
ORDER BY feature
LIMIT 10;
EOF

echo "Granting full access to all users..."
psql "$DB_URL" < /tmp/grant-full-access.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: Full access granted!"
    
    # Final summary
    echo ""
    echo "========================================="
    echo "✅ All Users Have Full Access!"
    echo "========================================="
    echo ""
    echo "Current Users:"
    psql "$DB_URL" -t -c "SELECT '  - ' || username || ' (' || email || ')' FROM users ORDER BY id;"
    echo ""
    echo "Access Level: FULL ADMINISTRATOR"
    echo "  • All features unlocked"
    echo "  • All actions permitted"
    echo "  • No restrictions"
    echo ""
    echo "Users can access:"
    echo "  • Dashboards & Analytics"
    echo "  • Production Scheduling"
    echo "  • Resource Management"
    echo "  • AI Agents & Max AI"
    echo "  • Workflow Automation"
    echo "  • Global Control Tower"
    echo "  • All Reports & Exports"
    echo "  • System Settings"
    echo "  • And everything else!"
    echo ""
else
    echo "❌ Failed to grant access"
    exit 1
fi

# Clean up
rm -f /tmp/grant-full-access.sql

echo "========================================="
echo "Access Configuration Complete!"
echo "========================================="