#!/bin/bash

# Simple script to fix user login issues
echo "========================================="
echo "Fixing User Logins - Simple Approach"
echo "========================================="

# Database URL
DB_URL=$DATABASE_URL

# Step 1: Reset existing user passwords
echo "Step 1: Resetting passwords for existing users..."
psql "$DB_URL" -c "UPDATE users SET password_hash = '\$2b\$10\$5PJZvz8Xs2LmE2Smfphp3uW0IXsx9MDIG0U1ASANvWrLVq.KXjuG6', active_role_id = 1 WHERE username IN ('admin', 'Jim');"

# Step 2: Add Patti if she doesn't exist
echo "Step 2: Adding Patti..."
psql "$DB_URL" -c "
INSERT INTO users (username, email, first_name, last_name, password_hash, is_active, active_role_id)
SELECT 'patti', 'patti.johnson@planettogether.com', 'Patti', 'Johnson', 
       '\$2b\$10\$5PJZvz8Xs2LmE2Smfphp3uW0IXsx9MDIG0U1ASANvWrLVq.KXjuG6', true, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'patti');"

# Step 3: Add role assignments
echo "Step 3: Ensuring role assignments..."
psql "$DB_URL" -c "
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin', 'Jim', 'patti'));
INSERT INTO user_roles (user_id, role_id)
SELECT id, 1 FROM users WHERE username IN ('admin', 'Jim', 'patti');"

# Step 4: Verify the fix
echo ""
echo "Verification:"
echo "============="
psql "$DB_URL" -c "
SELECT u.id, u.username, u.email, u.first_name || ' ' || u.last_name as full_name,
       u.is_active, 
       CASE WHEN u.password_hash = '\$2b\$10\$5PJZvz8Xs2LmE2Smfphp3uW0IXsx9MDIG0U1ASANvWrLVq.KXjuG6' 
            THEN '✅ password123' 
            ELSE '❌ Unknown' 
       END as password_status
FROM users u
ORDER BY u.id;"

echo ""
echo "========================================="
echo "✅ Login Fix Complete!"
echo "========================================="
echo ""
echo "All users can now login with:"
echo "  Password: password123"
echo ""
echo "Test the login at: http://localhost:5000"
echo ""
echo "⚠️  SECURITY: Please change passwords after first login!"
echo "========================================="