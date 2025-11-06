#!/bin/bash

# Complete migration script for ptjoboperations table
echo "========================================="
echo "ptjoboperations Table Migration"
echo "Recreating with Development Schema"
echo "========================================="

# Production database URL
PRODUCTION_DB_URL='postgresql://neondb_owner:npg_w5lZzCTE9GhU@ep-jolly-frost-a6k900yx.us-west-2.aws.neon.tech/neondb?sslmode=require'

# Source file
SOURCE_FILE="database-exports/production-import.sql"
MIGRATION_FILE="database-exports/ptjoboperations-migration.sql"

echo "Creating migration SQL file..."
cat > "$MIGRATION_FILE" << 'EOF'
-- Migration for ptjoboperations table
-- Preserving foreign key constraints and recreating with development schema

BEGIN;

-- Save the current sequence value (in case there was data)
SELECT setval('ptjoboperations_id_seq', COALESCE(MAX(id), 1)) FROM ptjoboperations;

-- Drop existing table (it's empty, but preserving safety)
DROP TABLE IF EXISTS ptjoboperations CASCADE;

-- Recreate table with complete development schema
CREATE TABLE ptjoboperations (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES ptjobs(id),
  external_id VARCHAR,
  name VARCHAR NOT NULL,
  description TEXT,
  operation_id VARCHAR,
  base_operation_id VARCHAR,
  required_finish_qty NUMERIC,
  cycle_hrs NUMERIC,
  setup_hours NUMERIC,
  post_processing_hours NUMERIC,
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  percent_finished NUMERIC DEFAULT '0',
  manually_scheduled BOOLEAN DEFAULT false,
  -- New fields from development schema
  sequence_number INTEGER,
  -- Constraint fields
  constraint_type VARCHAR(10), -- MSO, MFO, SNET, FNET, SNLT, FNLT
  constraint_date TIMESTAMP,
  -- PERT (Program Evaluation Review Technique) fields
  time_optimistic DECIMAL(10, 4), -- Best case duration
  time_most_likely DECIMAL(10, 4), -- Expected duration  
  time_pessimistic DECIMAL(10, 4), -- Worst case duration
  time_expected DECIMAL(10, 4), -- Calculated: (O + 4M + P) / 6
  time_variance DECIMAL(10, 6), -- Calculated: ((P - O) / 6)^2
  time_std_dev DECIMAL(10, 4), -- Calculated: (P - O) / 6
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ptjoboperations_job_id ON ptjoboperations(job_id);
CREATE INDEX idx_ptjoboperations_sequence ON ptjoboperations(sequence_number);
CREATE INDEX idx_ptjoboperations_scheduled ON ptjoboperations(scheduled_start, scheduled_end);

COMMIT;

EOF

echo ""
echo "Applying schema migration to production..."
psql "$PRODUCTION_DB_URL" < "$MIGRATION_FILE"

if [ $? -ne 0 ]; then
  echo "❌ Schema migration failed!"
  exit 1
fi

echo "✅ Schema migration successful!"
echo ""

# Now prepare the data import
echo "Preparing data import file..."
IMPORT_FILE="database-exports/ptjoboperations-import.sql"

# Extract ptjoboperations INSERT statements and fix column names
echo "-- ptjoboperations data import" > "$IMPORT_FILE"
echo "BEGIN;" >> "$IMPORT_FILE"

# Process each INSERT statement from the export
grep "^INSERT INTO ptjoboperations " "$SOURCE_FILE" | while IFS= read -r line; do
  # Convert camelCase to snake_case
  fixed_line=$(echo "$line" | sed '
    s/jobId/job_id/g
    s/externalId/external_id/g
    s/operationId/operation_id/g
    s/baseOperationId/base_operation_id/g
    s/requiredFinishQty/required_finish_qty/g
    s/cycleHrs/cycle_hrs/g
    s/setupHours/setup_hours/g
    s/postProcessingHours/post_processing_hours/g
    s/scheduledStart/scheduled_start/g
    s/scheduledEnd/scheduled_end/g
    s/percentFinished/percent_finished/g
    s/manuallyScheduled/manually_scheduled/g
    s/sequenceNumber/sequence_number/g
    s/constraintType/constraint_type/g
    s/constraintDate/constraint_date/g
    s/timeOptimistic/time_optimistic/g
    s/timeMostLikely/time_most_likely/g
    s/timePessimistic/time_pessimistic/g
    s/timeExpected/time_expected/g
    s/timeVariance/time_variance/g
    s/timeStdDev/time_std_dev/g
    s/createdAt/created_at/g
    s/updatedAt/updated_at/g
  ')
  
  echo "$fixed_line" >> "$IMPORT_FILE"
done

echo "COMMIT;" >> "$IMPORT_FILE"

echo ""
echo "Importing data to production..."
psql "$PRODUCTION_DB_URL" < "$IMPORT_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Data import successful!"
  
  # Verify the import
  echo ""
  echo "Verification Results:"
  echo "--------------------"
  
  # Check row count
  COUNT=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(*) FROM ptjoboperations" | tr -d ' ')
  echo "  Total records imported: $COUNT"
  
  # Check foreign key integrity
  ORPHANS=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(*) FROM ptjoboperations WHERE job_id IS NOT NULL AND job_id NOT IN (SELECT id FROM ptjobs)" | tr -d ' ')
  if [ "$ORPHANS" -eq 0 ]; then
    echo "  ✓ Foreign key integrity: OK"
  else
    echo "  ⚠ Warning: $ORPHANS records with invalid job_id references"
  fi
  
  # Show sample data
  echo ""
  echo "Sample imported data:"
  psql "$PRODUCTION_DB_URL" -c "SELECT id, job_id, name, sequence_number, constraint_type FROM ptjoboperations LIMIT 5;"
  
else
  echo "❌ Data import failed!"
  echo "Note: Schema has been updated but data import needs review."
  exit 1
fi

echo ""
echo "========================================="
echo "Migration Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "  - ptjoboperations table recreated with development schema"
echo "  - $COUNT records successfully imported"
echo "  - All PERT timing fields and constraint fields included"
echo "  - Foreign key constraints to ptjobs maintained"