#!/bin/bash

# Import remaining tables to production with column name fixes
echo "========================================="
echo "Importing Remaining Tables to Production"
echo "With Column Name Conversion"
echo "========================================="

# Production database URL
PRODUCTION_DB_URL='postgresql://neondb_owner:npg_w5lZzCTE9GhU@ep-jolly-frost-a6k900yx.us-west-2.aws.neon.tech/neondb?sslmode=require'

# Source file
SOURCE_FILE="database-exports/production-import.sql"
TEMP_FILE="database-exports/temp-fixed-import.sql"

echo "Creating fixed import file with snake_case column names..."
> "$TEMP_FILE"

# First, create the schedule_versions table if it doesn't exist
echo "Creating schedule_versions table if needed..."
cat << 'EOF' >> "$TEMP_FILE"
CREATE TABLE IF NOT EXISTS schedule_versions (
  id SERIAL PRIMARY KEY,
  schedule_id VARCHAR(255),
  version_number INTEGER,
  name VARCHAR(255),
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  schedule_data JSONB DEFAULT '{}'::jsonb
);

EOF

# Extract and fix dashboards table
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

# Extract and fix user_preferences table
echo "Processing user_preferences table..."
grep "^INSERT INTO user_preferences " "$SOURCE_FILE" | sed '
  s/user_id/user_id/g
  s/dashboardLayout/dashboard_layout/g
  s/dashboardLayouts/dashboard_layouts/g
  s/defaultDashboard/default_dashboard/g
  s/gridSettings/grid_settings/g
  s/notifications/notifications/g
  s/emailNotifications/email_notifications/g
  s/pushNotifications/push_notifications/g
  s/layoutDensity/layout_density/g
  s/collapsedSidebar/collapsed_sidebar/g
  s/defaultView/default_view/g
  s/schedulerConfig/scheduler_config/g
  s/createdAt/created_at/g
  s/updatedAt/updated_at/g
' >> "$TEMP_FILE"

# Extract and fix ptjobs table
echo "Processing ptjobs table..."
grep "^INSERT INTO ptjobs " "$SOURCE_FILE" | sed '
  s/externalId/external_id/g
  s/dueDate/due_date/g
  s/releaseDate/release_date/g
  s/completionDate/completion_date/g
  s/actualStart/actual_start/g
  s/actualEnd/actual_end/g
  s/plannedStart/planned_start/g
  s/plannedEnd/planned_end/g
  s/scheduledStart/scheduled_start/g
  s/scheduledEnd/scheduled_end/g
  s/customerId/customer_id/g
  s/customerName/customer_name/g
  s/productId/product_id/g
  s/productName/product_name/g
  s/materialId/material_id/g
  s/materialName/material_name/g
  s/orderType/order_type/g
  s/quantityOrdered/quantity_ordered/g
  s/quantityCompleted/quantity_completed/g
  s/quantityRemaining/quantity_remaining/g
  s/orderStatus/order_status/g
  s/setupTime/setup_time/g
  s/runTime/run_time/g
  s/totalTime/total_time/g
  s/resourceId/resource_id/g
  s/resourceName/resource_name/g
  s/resourceGroup/resource_group/g
  s/workCenter/work_center/g
  s/routingId/routing_id/g
  s/operationSequence/operation_sequence/g
  s/createdAt/created_at/g
  s/updatedAt/updated_at/g
  s/createdBy/created_by/g
  s/modifiedBy/modified_by/g
  s/isDeleted/is_deleted/g
  s/deletedAt/deleted_at/g
  s/deletedBy/deleted_by/g
' >> "$TEMP_FILE"

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
  s/waitTime/wait_time/g
  s/moveTime/move_time/g
  s/queueTime/queue_time/g
  s/totalTime/total_time/g
  s/plannedStart/planned_start/g
  s/plannedEnd/planned_end/g
  s/actualStart/actual_start/g
  s/actualEnd/actual_end/g
  s/scheduledStart/scheduled_start/g
  s/scheduledEnd/scheduled_end/g
  s/quantityScheduled/quantity_scheduled/g
  s/quantityCompleted/quantity_completed/g
  s/quantityRemaining/quantity_remaining/g
  s/predecessorOperations/predecessor_operations/g
  s/successorOperations/successor_operations/g
  s/isBottleneck/is_bottleneck/g
  s/isCriticalPath/is_critical_path/g
  s/sequenceNumber/sequence_number/g
  s/alternateResources/alternate_resources/g
  s/skillsRequired/skills_required/g
  s/createdAt/created_at/g
  s/updatedAt/updated_at/g
' >> "$TEMP_FILE"

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

# Extract and fix schedule_versions table
echo "Processing schedule_versions table..."
grep "^INSERT INTO schedule_versions " "$SOURCE_FILE" | sed '
  s/scheduleId/schedule_id/g
  s/versionNumber/version_number/g
  s/createdBy/created_by/g
  s/createdAt/created_at/g
  s/isActive/is_active/g
  s/scheduleData/schedule_data/g
' >> "$TEMP_FILE"

echo ""
echo "Starting import to production database..."
echo ""

# Import the fixed data
psql "$PRODUCTION_DB_URL" < "$TEMP_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Import completed successfully!"
  
  # Verify the import
  echo ""
  echo "Verifying imported data:"
  echo "------------------------"
  
  for TABLE in dashboards user_preferences ptjobs ptjoboperations agent_recommendations schedule_versions; do
    COUNT=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(*) FROM $TABLE" 2>/dev/null | tr -d ' ')
    if [ -n "$COUNT" ]; then
      echo "  ✓ $TABLE: $COUNT records"
    fi
  done
else
  echo ""
  echo "❌ Import failed. Please check the error messages above."
  exit 1
fi

# Clean up temp file
rm -f "$TEMP_FILE"

echo ""
echo "========================================="
echo "Import Complete!"
echo "========================================="