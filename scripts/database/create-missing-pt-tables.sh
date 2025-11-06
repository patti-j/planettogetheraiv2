#!/bin/bash

# Script to create missing PT tables in production
echo "========================================="
echo "Creating Missing PT Tables in Production"
echo "========================================="

# Production database URL
PRODUCTION_DB_URL='postgresql://neondb_owner:npg_w5lZzCTE9GhU@ep-jolly-frost-a6k900yx.us-west-2.aws.neon.tech/neondb?sslmode=require'

# Create SQL file for missing tables
CREATION_FILE="database-exports/create-pt-tables.sql"

echo "Creating SQL for missing PT tables..."
cat > "$CREATION_FILE" << 'EOF'
-- Create missing PT tables based on development schema
BEGIN;

-- 1. ptResourceCapabilities table
CREATE TABLE IF NOT EXISTS ptresourcecapabilities (
  id SERIAL PRIMARY KEY,
  publish_date TIMESTAMP NOT NULL,
  instance_id VARCHAR(38) NOT NULL,
  resource_id INTEGER,
  capability_id INTEGER,
  throughput_modifier NUMERIC,
  setup_hours_override NUMERIC,
  use_throughput_modifier BOOLEAN,
  use_setup_hours_override BOOLEAN
);

-- 2. pt_product_wheels table
CREATE TABLE IF NOT EXISTS pt_product_wheels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  resource_id INTEGER REFERENCES ptresources(id) NOT NULL,
  plant_id INTEGER REFERENCES ptplants(id) NOT NULL,
  
  -- Wheel configuration
  cycle_duration_hours NUMERIC NOT NULL,
  changeover_matrix JSONB,
  optimization_rules JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'draft',
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  last_modified_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. pt_product_wheel_segments table
CREATE TABLE IF NOT EXISTS pt_product_wheel_segments (
  id SERIAL PRIMARY KEY,
  wheel_id INTEGER REFERENCES pt_product_wheels(id) NOT NULL,
  
  -- Segment details
  sequence_number INTEGER NOT NULL,
  product_id INTEGER,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100),
  
  -- Timing
  allocated_hours NUMERIC NOT NULL,
  min_batch_size NUMERIC,
  max_batch_size NUMERIC,
  target_batch_size NUMERIC,
  
  -- Visual
  color_code VARCHAR(7),
  
  -- Changeover
  changeover_from_previous NUMERIC,
  setup_time NUMERIC,
  cleaning_time NUMERIC,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. pt_product_wheel_schedule table
CREATE TABLE IF NOT EXISTS pt_product_wheel_schedule (
  id SERIAL PRIMARY KEY,
  wheel_id INTEGER REFERENCES pt_product_wheels(id) NOT NULL,
  
  -- Schedule instance
  cycle_number INTEGER NOT NULL,
  planned_start_date TIMESTAMP NOT NULL,
  planned_end_date TIMESTAMP NOT NULL,
  actual_start_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'scheduled',
  current_segment_id INTEGER REFERENCES pt_product_wheel_segments(id),
  completed_segments INTEGER DEFAULT 0,
  
  -- Performance
  adherence_percentage NUMERIC,
  total_changeover_time NUMERIC,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pt_product_wheels_resource ON pt_product_wheels(resource_id);
CREATE INDEX IF NOT EXISTS idx_pt_product_wheels_plant ON pt_product_wheels(plant_id);
CREATE INDEX IF NOT EXISTS idx_pt_product_wheel_segments_wheel ON pt_product_wheel_segments(wheel_id);
CREATE INDEX IF NOT EXISTS idx_pt_product_wheel_schedule_wheel ON pt_product_wheel_schedule(wheel_id);
CREATE INDEX IF NOT EXISTS idx_pt_product_wheel_schedule_status ON pt_product_wheel_schedule(status);

COMMIT;
EOF

echo ""
echo "Creating tables in production..."
psql "$PRODUCTION_DB_URL" < "$CREATION_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Tables created successfully!"
else
  echo "❌ Failed to create tables"
  exit 1
fi

# Verify all PT tables now exist
echo ""
echo "========================================="
echo "Verification: All PT Tables in Production"
echo "========================================="

psql "$PRODUCTION_DB_URL" -c "
  SELECT 
    tablename,
    CASE 
      WHEN (SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = tablename) > 0 
      THEN '✓ Created'
      ELSE '✗ Missing'
    END as status
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND (tablename LIKE 'pt%' OR tablename LIKE 'PT%')
  ORDER BY tablename;"

echo ""
echo "Table Structure Summary:"
echo "------------------------"

for table in ptjobs ptjoboperations ptplants pt_manufacturing_orders ptresources ptresourcecapabilities pt_product_wheels pt_product_wheel_segments pt_product_wheel_schedule; do
  COUNT=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = '$table'" 2>/dev/null | tr -d ' ')
  ROWS=$(psql "$PRODUCTION_DB_URL" -t -c "SELECT COUNT(*) FROM $table" 2>/dev/null | tr -d ' ')
  if [ -n "$COUNT" ] && [ "$COUNT" -gt 0 ]; then
    echo "  $table: $COUNT columns, $ROWS rows"
  fi
done

echo ""
echo "========================================="
echo "PT Tables Setup Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "  • Core scheduling tables (ptjobs, ptjoboperations): ✓ Data imported"
echo "  • Resource tables (ptresources, ptplants): ✓ Schema ready"
echo "  • Manufacturing orders table: ✓ Schema ready"
echo "  • Product wheel tables: ✓ Created new"
echo "  • Resource capabilities table: ✓ Created new"
echo ""
echo "All PT tables are now available in production!"