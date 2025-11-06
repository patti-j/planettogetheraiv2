#!/bin/bash

# Fix user login issues for Patti and Jim with correct role IDs
echo "========================================="
echo "Fixing User Login Issues (Corrected)"
echo "========================================="

# Database URL
DB_URL=$DATABASE_URL

# Create SQL script to fix users
cat > /tmp/fix-users-correct.sql << 'EOF'
BEGIN;

-- First, let's add Patti if she doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'patti' OR email = 'patti.johnson@planettogether.com') THEN
        -- Add Patti as a new user with default password
        INSERT INTO users (username, email, first_name, last_name, password_hash, is_active, active_role_id, created_at, updated_at)
        VALUES (
            'patti',
            'patti.johnson@planettogether.com',
            'Patti',
            'Johnson',
            '$2b$10$5PJZvz8Xs2LmE2Smfphp3uW0IXsx9MDIG0U1ASANvWrLVq.KXjuG6', -- password: password123
            true,
            1, -- Administrator role (the only role we have)
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created user Patti with default password';
    END IF;
END $$;

-- Reset passwords for both Jim and admin to ensure they can login
UPDATE users 
SET password_hash = '$2b$10$5PJZvz8Xs2LmE2Smfphp3uW0IXsx9MDIG0U1ASANvWrLVq.KXjuG6', -- password: password123
    active_role_id = 1 -- Set administrator role
WHERE username IN ('Jim', 'admin');

-- Update Patti's password if she already exists
UPDATE users 
SET password_hash = '$2b$10$5PJZvz8Xs2LmE2Smfphp3uW0IXsx9MDIG0U1ASANvWrLVq.KXjuG6', -- password: password123
    active_role_id = 1
WHERE username = 'patti';

-- Add role assignments for all users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 1 -- Administrator role (the only one available)
FROM users u
WHERE u.username IN ('patti', 'Jim', 'admin')
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMIT;

-- Display updated users
\echo ''
\echo 'Updated Users:'
\echo '=============='
SELECT id, username, email, first_name || ' ' || last_name as full_name, 
       CASE 
         WHEN active_role_id = 1 THEN 'Administrator'
         ELSE 'Role ID: ' || COALESCE(active_role_id::text, 'None')
       END as active_role,
       is_active
FROM users 
ORDER BY id;

\echo ''
\echo 'User Role Assignments:'
\echo '====================='
SELECT u.username, r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON r.id = ur.role_id
ORDER BY u.username;

\echo ''
\echo '================================'
\echo 'Login Credentials (Development):'
\echo '================================'
\echo 'Username: admin    | Password: password123'
\echo 'Username: Jim      | Password: password123' 
\echo 'Username: patti    | Password: password123'
\echo ''
\echo 'All users have Administrator role'
\echo 'IMPORTANT: Please change these passwords after first login!'
EOF

echo "Fixing user accounts with correct role IDs..."
psql "$DB_URL" < /tmp/fix-users-correct.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: User accounts fixed!"
    echo ""
    # Test password verification
    echo "Testing password hash verification..."
    psql "$DB_URL" -t -c "SELECT username || ': hash valid' FROM users WHERE username IN ('admin', 'Jim', 'patti') AND password_hash = '\$2b\$10\$5PJZvz8Xs2LmE2Smfphp3uW0IXsx9MDIG0U1ASANvWrLVq.KXjuG6';"
    
    echo ""
    echo "========================================="
    echo "✅ Login Fix Complete!"
    echo "========================================="
    echo ""
    echo "All users can now login with:"
    echo "  Password: password123"
    echo ""
    echo "Available users:"
    psql "$DB_URL" -t -c "SELECT '  - ' || username || ' (' || first_name || ' ' || last_name || ')' FROM users ORDER BY id;"
    echo ""
    echo "⚠️  SECURITY: Change passwords after first login!"
    echo ""
else
    echo "❌ Failed to fix user accounts"
    exit 1
fi

# Clean up
rm -f /tmp/fix-users-correct.sql