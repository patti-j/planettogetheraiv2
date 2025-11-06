#!/bin/bash

# Comprehensive import script with complete column name fixes
echo "========================================="
echo "Importing Remaining Tables to Production"
echo "With Complete Column Name Conversion"
echo "========================================="

# Production database URL
PRODUCTION_DB_URL='postgresql://neondb_owner:npg_w5lZzCTE9GhU@ep-jolly-frost-a6k900yx.us-west-2.aws.neon.tech/neondb?sslmode=require'

# Source file
SOURCE_FILE="database-exports/production-import.sql"
TEMP_FILE="database-exports/temp-comprehensive-import.sql"

echo "Creating comprehensive fixed import file..."
> "$TEMP_FILE"

# First, create the schedule_versions table with more columns to handle the data
echo "Creating schedule_versions table..."
cat << 'EOF' >> "$TEMP_FILE"
CREATE TABLE IF NOT EXISTS schedule_versions (
  id SERIAL PRIMARY KEY,
  schedule_id VARCHAR(255),
  version_number INTEGER,
  version_tag VARCHAR(255),
  name VARCHAR(255),
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  schedule_data JSONB DEFAULT '{}'::jsonb
);

EOF

# Extract and fix dashboards table (already worked, just include it)
echo "Processing dashboards table..."
grep "^INSERT INTO dashboards " "$SOURCE_FILE" | sed '
  s/isDefault/is_default/g
  s/routeParams/route_params/g
  s/layoutConfig/layout_config/g
  s/queryParams/query_params/g
  s/refreshInterval/refresh_interval/g
  s/isPublic/is_public/g
  s/createdBy/created_by/g
  s/updatedAt/updated_at/g
  s/createdAt/created_at/g
' >> "$TEMP_FILE"

# Extract and fix user_preferences table with correct notification_settings
echo "Processing user_preferences table..."
grep "^INSERT INTO user_preferences " "$SOURCE_FILE" | sed '
  s/dashboardLayout/dashboard_layout/g
  s/notificationSettings/notification_settings/g
  s/uiSettings/ui_settings/g
  s/createdAt/created_at/g
  s/updatedAt/updated_at/g
' >> "$TEMP_FILE"

# Extract and fix ptjobs table - handling needDateTime -> need_date_time
echo "Processing ptjobs table..."
grep "^INSERT INTO ptjobs " "$SOURCE_FILE" | sed '
  s/externalId/external_id/g
  s/needDateTime/need_date_time/g
  s/scheduledStatus/scheduled_status/g
  s/createdAt/created_at/g
  s/updatedAt/updated_at/g
' | while IFS= read -r line; do
  # Extract the column list and values
  if echo "$line" | grep -q "INSERT INTO ptjobs ("; then
    # Extract the columns part
    columns=$(echo "$line" | sed -n 's/.*INSERT INTO ptjobs (\([^)]*\)).*/\1/p')
    # Extract the values part
    rest=$(echo "$line" | sed 's/.*INSERT INTO ptjobs ([^)]*) VALUES //')
    
    # Check if we have all the expected columns, if not, use simplified insert
    if echo "$columns" | grep -q "due_date\|release_date\|completion_date"; then
      # Too many columns for current production schema, use simplified insert
      echo "$line" | sed 's/ VALUES (.*) VALUES/ VALUES/' | \
        sed 's/(id, external_id, name, description, priority, need_date_time[^)]*)/\(id, external_id, name, description, priority, need_date_time, scheduled_status, created_at, updated_at\)/' | \
        awk -F'VALUES' '{
          # Extract values and keep only the ones we need
          split($2, vals, ", ");
          print $1 "VALUES (" vals[1] ", " vals[2] ", " vals[3] ", " vals[4] ", " vals[5] ", " vals[6] ", " vals[7] ", " vals[30] ", " vals[31] ")";
        }' 2>/dev/null || echo "$line"
    else
      echo "$line"
    fi
  else
    echo "$line"
  fi
done >> "$TEMP_FILE"

# Extract and fix ptjoboperations table
echo "Processing ptjoboperations table..."
grep "^INSERT INTO ptjoboperations " "$SOURCE_FILE" | sed '
  s/jobId/job_id/g
  s/operationNumber/operation_number/g
  s/operationDescription/operation_description/g
  s/operationStatus/operation_status/g
  s/resourceId/resource_id/g
  s/resourceName/resource_name/g
  s/workCenter/work_center/g
  s/setupTime/setup_time/g
  s/runTime/run_time/g
  s/createdAt/created_at/g
  s/updatedAt/updated_at/g
' | while IFS= read -r line; do
  # Similar simplification for ptjoboperations
  # Only keep the columns that exist in production
  echo "$line" | sed 's/(id, job_id[^)]*)/\(id, job_id, operation_number, operation_description, operation_status, resource_id, resource_name, work_center, setup_time, run_time, created_at, updated_at\)/'
done >> "$TEMP_FILE"

# Extract and fix agent_recommendations table
echo "Processing agent_recommendations table..."
grep "^INSERT INTO agent_recommendations " "$SOURCE_FILE" | sed '
  s/userId/user_id/g
  s/agentId/agent_id/g
  s/recommendationType/recommendation_type/g
  s/actionButton/action_button/g
  s/estimatedImpact/estimated_impact/g
  s/urgencyLevel/urgency_level/g
  s/showDetails/show_details/g
  s/isActionable/is_actionable/g
  s/actionEndpoint/action_endpoint/g
  s/actionPayload/action_payload/g
  s/isResolving/is_resolving/g
  s/resolutionProgress/resolution_progress/g
  s/resolutionStatus/resolution_status/g
  s/resolutionResult/resolution_result/g
  s/isRead/is_read/g
  s/isActioned/is_actioned/g
  s/actionedAt/actioned_at/g
  s/isDismissed/is_dismissed/g
  s/dismissedAt/dismissed_at/g
  s/expiresAt/expires_at/g
  s/createdAt/created_at/g
  s/updatedAt/updated_at/g
' >> "$TEMP_FILE"

# Extract and fix schedule_versions table with versionTag -> version_tag
echo "Processing schedule_versions table..."
grep "^INSERT INTO schedule_versions " "$SOURCE_FILE" | sed '
  s/scheduleId/schedule_id/g
  s/versionNumber/version_number/g
  s/versionTag/version_tag/g
  s/createdBy/created_by/g
  s/createdAt/created_at/g
  s/isActive/is_active/g
  s/scheduleData/schedule_data/g
' >> "$TEMP_FILE"

echo ""
echo "Starting import to production database..."
echo ""

# Import the fixed data
psql "$PRODUCTION_DB_URL" < "$TEMP_FILE" 2>&1 | grep -v "already exists" | head -50

echo ""
echo "Verifying imported data:"
echo "------------------------"

for TABLE in dashboards user_preferences ptjobs ptjoboperations agent_recommendations schedule_versions; do
  COUNT=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(*) FROM $TABLE" 2>/dev/null | tr -d ' ')
  if [ -n "$COUNT" ]; then
    if [ "$COUNT" -gt 0 ]; then
      echo "  ✓ $TABLE: $COUNT records"
    else
      echo "  ⚠ $TABLE: 0 records (check errors above)"
    fi
  fi
done

# Clean up temp file
# rm -f "$TEMP_FILE"

echo ""
echo "Note: Check $TEMP_FILE for debugging if needed"
echo ""
echo "========================================="
echo "Import Process Complete!"
echo "========================================="