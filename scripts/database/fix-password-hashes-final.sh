#!/bin/bash

# Fix password hashes with correct bcrypt hash for password123
echo "========================================="
echo "Fixing Password Hashes - Final Fix"
echo "========================================="

# Database URL
DB_URL=$DATABASE_URL

# This is a properly generated bcrypt hash for "password123"
# Generated and tested with bcryptjs
CORRECT_HASH='$2b$10$xR6flI7qm6Eed2uY3VnPyeXWap/xDSAZe5Yjhgs6zwCuTey63dz4y'

echo "Updating all user passwords with correct hash..."

# Update all users with the correct password hash
psql "$DB_URL" -c "
UPDATE users 
SET password_hash = '$CORRECT_HASH'
WHERE username IN ('admin', 'Jim', 'patti');"

if [ $? -eq 0 ]; then
    echo "✅ Password hashes updated successfully!"
    
    # Verify the update
    echo ""
    echo "Verification:"
    echo "============="
    psql "$DB_URL" -c "
    SELECT username, 
           CASE WHEN password_hash = '$CORRECT_HASH' 
                THEN '✅ Updated correctly' 
                ELSE '❌ Update failed' 
           END as status
    FROM users 
    WHERE username IN ('admin', 'Jim', 'patti')
    ORDER BY id;"
    
    echo ""
    echo "========================================="
    echo "✅ Password Fix Complete!"
    echo "========================================="
    echo ""
    echo "All users can now login with:"
    echo "  Password: password123"
    echo ""
    echo "Available users:"
    echo "  - admin"
    echo "  - Jim"
    echo "  - patti"
    echo ""
    echo "Test login at: http://localhost:5000"
    echo "========================================="
else
    echo "❌ Failed to update password hashes"
    exit 1
fi