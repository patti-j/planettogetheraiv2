#!/bin/bash

# Fix user login issues for Patti and Jim
echo "========================================="
echo "Fixing User Login Issues"
echo "========================================="

# Database URL
DB_URL=$DATABASE_URL

# Create SQL script to fix users
cat > /tmp/fix-users.sql << 'EOF'
BEGIN;

-- First, let's check if Patti exists
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
            11, -- Administrator role
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created user Patti with default password';
    END IF;
END $$;

-- Reset Jim's password to a known default
UPDATE users 
SET password_hash = '$2b$10$5PJZvz8Xs2LmE2Smfphp3uW0IXsx9MDIG0U1ASANvWrLVq.KXjuG6' -- password: password123
WHERE username = 'Jim';

-- Also ensure both users have proper roles assigned
-- Add administrator role for both users if not exists
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 11 -- Administrator role
FROM users u
WHERE u.username IN ('patti', 'Jim')
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = 11
);

COMMIT;

-- Display updated users
\echo ''
\echo 'Updated Users:'
\echo '=============='
SELECT id, username, email, first_name || ' ' || last_name as full_name, 
       CASE 
         WHEN active_role_id = 11 THEN 'Administrator'
         ELSE 'Role ID: ' || COALESCE(active_role_id::text, 'None')
       END as active_role,
       is_active
FROM users 
WHERE username IN ('patti', 'Jim', 'admin')
ORDER BY id;

\echo ''
\echo 'Login Credentials:'
\echo '=================='
\echo 'Username: admin    | Password: password123'
\echo 'Username: Jim      | Password: password123' 
\echo 'Username: patti    | Password: password123'
\echo ''
\echo 'IMPORTANT: Please change these passwords after first login!'
EOF

echo "Fixing user accounts..."
psql "$DB_URL" < /tmp/fix-users.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: User accounts fixed!"
    echo ""
    echo "========================================="
    echo "Login Instructions:"
    echo "========================================="
    echo ""
    echo "All users can now login with:"
    echo "  Default Password: password123"
    echo ""
    echo "Available users:"
    echo "  - admin (Admin User)"
    echo "  - Jim (Jim Cerra)"
    echo "  - patti (Patti Johnson)"
    echo ""
    echo "⚠️  IMPORTANT: Please change passwords after first login!"
    echo ""
else
    echo "❌ Failed to fix user accounts"
    exit 1
fi

# Clean up
rm -f /tmp/fix-users.sql

echo "========================================="
echo "User Fix Complete!"
echo "========================================="