#!/bin/bash

# Final comprehensive fix for ALL column name mismatches
echo "Creating final production-ready export..."

# Apply ALL column name fixes from camelCase to snake_case
sed -e 's/createdAt/created_at/g' \
    -e 's/updatedAt/updated_at/g' \
    -e 's/firstName/first_name/g' \
    -e 's/lastName/last_name/g' \
    -e 's/passwordHash/password_hash/g' \
    -e 's/isActive/is_active/g' \
    -e 's/activeRoleId/active_role_id/g' \
    -e 's/lastLogin/last_login/g' \
    -e 's/jobTitle/job_title/g' \
    -e 's/phoneNumber/phone_number/g' \
    -e 's/roleId/role_id/g' \
    -e 's/userId/user_id/g' \
    -e 's/permissionId/permission_id/g' \
    -e 's/assignedBy/assigned_by/g' \
    -e 's/assignedAt/assigned_at/g' \
    -e 's/dashboardId/dashboard_id/g' \
    -e 's/widgetType/widget_type/g' \
    -e 's/displayName/display_name/g' \
    -e 's/jobId/job_id/g' \
    -e 's/operationId/operation_id/g' \
    -e 's/startTime/start_time/g' \
    -e 's/endTime/end_time/g' \
    -e 's/dueDate/due_date/g' \
    -e 's/completedDate/completed_date/g' \
    database-exports/full-export-2025-11-05T20-14-35.sql \
    > database-exports/production-import.sql

echo "✅ Final export ready: database-exports/production-import.sql"
echo "Size: $(ls -lh database-exports/production-import.sql | awk '{print $5}')"

# Now import the essential data
echo ""
echo "Importing essential production data..."
PRODUCTION_DATABASE_URL='postgresql://neondb_owner:npg_w5lZzCTE9GhU@ep-jolly-frost-a6k900yx.us-west-2.aws.neon.tech/neondb?sslmode=require'

echo "1. Importing users..."
grep "^INSERT INTO users " database-exports/production-import.sql | psql "$PRODUCTION_DATABASE_URL" 2>&1 | grep -c "INSERT 0 1" || echo "0"

echo "2. Importing roles..."
grep "^INSERT INTO roles " database-exports/production-import.sql | psql "$PRODUCTION_DATABASE_URL" 2>&1 | grep -c "INSERT 0 1" || echo "0"

echo "3. Importing ptjobs..."
grep "^INSERT INTO ptjobs " database-exports/production-import.sql | psql "$PRODUCTION_DATABASE_URL" 2>&1 | grep -c "INSERT 0 1" || echo "0"

echo ""
echo "Checking final results..."
psql "$PRODUCTION_DATABASE_URL" -c "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'roles', COUNT(*) FROM roles
UNION ALL SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL SELECT 'ptjobs', COUNT(*) FROM ptjobs;"

echo ""
echo "✅ Import process complete!"