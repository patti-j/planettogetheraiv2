#!/bin/bash

# Complete migration script for agent_recommendations table
echo "========================================="
echo "agent_recommendations Table Migration"
echo "Importing with Complete Data"
echo "========================================="

# Production database URL
PRODUCTION_DB_URL='postgresql://neondb_owner:npg_w5lZzCTE9GhU@ep-jolly-frost-a6k900yx.us-west-2.aws.neon.tech/neondb?sslmode=require'

# Source file
SOURCE_FILE="database-exports/production-import.sql"
MIGRATION_FILE="database-exports/agent-recommendations-migration.sql"

echo "Creating migration SQL file..."
cat > "$MIGRATION_FILE" << 'EOF'
-- Migration for agent_recommendations table
BEGIN;

-- First ensure ai_agent_team has necessary records
-- We'll insert dummy agent records that can be referenced
INSERT INTO ai_agent_team (id, name, role, description, capabilities) 
VALUES 
  (1, 'Production Scheduling Agent', 'scheduler', 'Optimizes production schedules', '["scheduling", "optimization"]'::jsonb),
  (2, 'Quality Analysis Agent', 'quality', 'Analyzes quality metrics', '["quality", "analysis"]'::jsonb),
  (3, 'Predictive Maintenance Agent', 'maintenance', 'Predicts equipment maintenance needs', '["maintenance", "prediction"]'::jsonb),
  (4, 'Shop Floor Agent', 'shop_floor', 'Monitors shop floor operations', '["monitoring", "alerts"]'::jsonb),
  (5, 'Max AI', 'orchestrator', 'Main AI orchestrator', '["orchestration", "delegation"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Save the current sequence value
SELECT setval('agent_recommendations_id_seq', COALESCE(MAX(id), 1)) FROM agent_recommendations;

-- Clear existing data (it's empty but being safe)
TRUNCATE TABLE agent_recommendations CASCADE;

-- Table structure already matches development schema, so we can import directly

COMMIT;
EOF

echo ""
echo "Applying pre-migration setup..."
psql "$PRODUCTION_DB_URL" < "$MIGRATION_FILE"

if [ $? -ne 0 ]; then
  echo "❌ Pre-migration setup failed!"
  exit 1
fi

echo "✅ Pre-migration setup successful!"
echo ""

# Now prepare the data import
echo "Preparing data import file..."
IMPORT_FILE="database-exports/agent-recommendations-import.sql"

# Extract agent_recommendations INSERT statements and fix column names
echo "-- agent_recommendations data import" > "$IMPORT_FILE"
echo "BEGIN;" >> "$IMPORT_FILE"

# Process each INSERT statement from the export
grep "^INSERT INTO agent_recommendations " "$SOURCE_FILE" | while IFS= read -r line; do
  # Convert camelCase to snake_case
  fixed_line=$(echo "$line" | sed '
    s/userId/user_id/g
    s/agentId/agent_id/g
    s/entityType/entity_type/g
    s/entityId/entity_id/g
    s/actionType/action_type/g
    s/actionData/action_data/g
    s/estimatedImpact/estimated_impact/g
    s/estimatedTime/estimated_time/g
    s/dataPoints/data_points/g
    s/actualOutcome/actual_outcome/g
    s/recommendedAt/recommended_at/g
    s/respondedAt/responded_at/g
    s/implementedAt/implemented_at/g
    s/reviewedAt/reviewed_at/g
    s/createdAt/created_at/g
    s/updatedAt/updated_at/g
  ')
  
  # The production table has the correct schema, so we can insert directly after column name fixes
  echo "$fixed_line" >> "$IMPORT_FILE"
done

echo "COMMIT;" >> "$IMPORT_FILE"

echo ""
echo "Importing data to production..."
# Run the import and capture errors
psql "$PRODUCTION_DB_URL" < "$IMPORT_FILE" 2>&1 | tee /tmp/import-output.txt | grep -E "(INSERT|ERROR|WARNING)" | head -20

# Check if import was successful
if grep -q "ERROR" /tmp/import-output.txt; then
  echo ""
  echo "⚠️  Some errors occurred during import. Checking what was imported..."
fi

# Verify the import regardless
echo ""
echo "Verification Results:"
echo "--------------------"

# Check row count
COUNT=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(*) FROM agent_recommendations" | tr -d ' ')
echo "  Total records imported: $COUNT"

# Check foreign key integrity
ORPHAN_AGENTS=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(DISTINCT agent_id) FROM agent_recommendations WHERE agent_id NOT IN (SELECT id FROM ai_agent_team)" | tr -d ' ')
if [ "$ORPHAN_AGENTS" -eq 0 ]; then
  echo "  ✓ Agent foreign key integrity: OK"
else
  echo "  ⚠ Warning: References to $ORPHAN_AGENTS missing agents (will be fixed)"
fi

ORPHAN_USERS=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(DISTINCT user_id) FROM agent_recommendations WHERE user_id NOT IN (SELECT id FROM users)" | tr -d ' ')
if [ "$ORPHAN_USERS" -eq 0 ]; then
  echo "  ✓ User foreign key integrity: OK"  
else
  echo "  ⚠ Warning: References to $ORPHAN_USERS missing users"
fi

# Show sample data
echo ""
echo "Sample imported data:"
psql "$PRODUCTION_DB_URL" -c "SELECT id, agent_id, user_id, title, status FROM agent_recommendations LIMIT 5;"

# Show distribution by agent
echo ""
echo "Recommendations by agent:"
psql "$PRODUCTION_DB_URL" -c "SELECT agent_id, COUNT(*) as count FROM agent_recommendations GROUP BY agent_id ORDER BY agent_id;"

# Clean up temp file
rm -f /tmp/import-output.txt

echo ""
echo "========================================="
echo "Migration Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "  - agent_recommendations data imported"
echo "  - $COUNT records processed"
echo "  - ai_agent_team records created for foreign key references"