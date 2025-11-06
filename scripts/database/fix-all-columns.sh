#!/bin/bash

# Fix ALL column name mismatches from camelCase to snake_case
echo "Creating fully fixed export with all column names corrected..."

# Apply comprehensive column name fixes
sed -e 's/createdAt/created_at/g' \
    -e 's/updatedAt/updated_at/g' \
    -e 's/firstName/first_name/g' \
    -e 's/lastName/last_name/g' \
    -e 's/passwordHash/password_hash/g' \
    -e 's/isActive/is_active/g' \
    -e 's/activeRoleId/active_role_id/g' \
    -e 's/lastLogin/last_login/g' \
    -e 's/jobTitle/job_title/g' \
    -e 's/roleId/role_id/g' \
    -e 's/userId/user_id/g' \
    -e 's/permissionId/permission_id/g' \
    -e 's/assignedBy/assigned_by/g' \
    -e 's/assignedAt/assigned_at/g' \
    database-exports/full-export-2025-11-05T20-14-35.sql \
    > database-exports/full-export-production-ready.sql

echo "✅ Production-ready export created: database-exports/full-export-production-ready.sql"
echo "Size: $(ls -lh database-exports/full-export-production-ready.sql | awk '{print $5}')"