#!/bin/bash

# Generate PT Resources and Plants data with correct schema
echo "========================================="
echo "Generating PT Resources and Plants Data"
echo "========================================="

# Development database
DEV_DB_URL=$DATABASE_URL

# SQL to generate brewery simulation data
cat > /tmp/generate-pt-data-fixed.sql << 'EOF'
-- Generate PT Plants and Resources data
BEGIN;

-- Clear existing data (if any)
TRUNCATE TABLE ptresources CASCADE;
TRUNCATE TABLE ptplants CASCADE;

-- 1. Create brewery plants (matching actual schema)
INSERT INTO ptplants (id, publish_date, instance_id, plant_id, name, description, plant_type, is_active, 
                      city, state, country, timezone, capacity, operational_metrics)
VALUES 
  (1, NOW(), 'BREW-SIM-001', 1, 'Amsterdam Brewery', 'Main European production facility', 'manufacturing', true, 
   'Amsterdam', 'North Holland', 'Netherlands', 'Europe/Amsterdam', '{"daily_capacity": "50000L"}'::jsonb, '{"efficiency": 0.95}'::jsonb),
  (2, NOW(), 'BREW-SIM-001', 2, 'Milwaukee Brewery', 'North American production facility', 'manufacturing', true,
   'Milwaukee', 'Wisconsin', 'USA', 'America/Chicago', '{"daily_capacity": "80000L"}'::jsonb, '{"efficiency": 0.96}'::jsonb),
  (3, NOW(), 'BREW-SIM-001', 3, 'Mexico City Brewery', 'Latin America production facility', 'manufacturing', true,
   'Mexico City', 'CDMX', 'Mexico', 'America/Mexico_City', '{"daily_capacity": "40000L"}'::jsonb, '{"efficiency": 0.94}'::jsonb),
  (4, NOW(), 'BREW-SIM-001', 4, 'Singapore Brewery', 'Asia Pacific production facility', 'manufacturing', true,
   'Singapore', 'Singapore', 'Singapore', 'Asia/Singapore', '{"daily_capacity": "60000L"}'::jsonb, '{"efficiency": 0.95}'::jsonb),
  (5, NOW(), 'BREW-SIM-001', 5, 'Johannesburg Brewery', 'Africa production facility', 'manufacturing', true,
   'Johannesburg', 'Gauteng', 'South Africa', 'Africa/Johannesburg', '{"daily_capacity": "35000L"}'::jsonb, '{"efficiency": 0.93}'::jsonb);

-- 2. Create brewery resources for Plant 1 (Amsterdam)
INSERT INTO ptresources (id, publish_date, instance_id, plant_id, department_id, resource_id, 
                        name, description, resource_type, capacity, available_hours, efficiency, is_active)
VALUES 
  -- Brewing Operations Resources
  (1, NOW(), 'BREW-SIM-001', 1, 1, 101, 'Mash Tun 1', 'Mashing equipment - Capacity: 5000L', 'machine', 5000, 24, 0.95, true),
  (2, NOW(), 'BREW-SIM-001', 1, 1, 102, 'Brew Kettle 1', 'Boiling vessel - Capacity: 5000L', 'machine', 5000, 24, 0.95, true),
  (3, NOW(), 'BREW-SIM-001', 1, 1, 103, 'Fermentation Tank 1', 'Primary fermenter - Capacity: 10000L', 'machine', 10000, 24, 0.98, true),
  (4, NOW(), 'BREW-SIM-001', 1, 1, 104, 'Fermentation Tank 2', 'Primary fermenter - Capacity: 10000L', 'machine', 10000, 24, 0.98, true),
  (5, NOW(), 'BREW-SIM-001', 1, 1, 105, 'Bright Tank 1', 'Conditioning tank - Capacity: 8000L', 'machine', 8000, 24, 0.98, true),
  
  -- Packaging Resources
  (6, NOW(), 'BREW-SIM-001', 1, 2, 106, 'Bottling Line 1', 'Bottling equipment - 2000 bottles/hr', 'machine', 2000, 16, 0.85, true),
  (7, NOW(), 'BREW-SIM-001', 1, 2, 107, 'Kegging Line 1', 'Kegging system - 100 kegs/hr', 'machine', 100, 16, 0.90, true),
  (8, NOW(), 'BREW-SIM-001', 1, 2, 108, 'Canning Line 1', 'Canning equipment - 3000 cans/hr', 'machine', 3000, 16, 0.88, true),
  
  -- Quality Control Resources
  (9, NOW(), 'BREW-SIM-001', 1, 3, 109, 'Lab Equipment 1', 'Quality testing lab', 'machine', 100, 24, 1.0, true),
  
  -- Maintenance Resources
  (10, NOW(), 'BREW-SIM-001', 1, 4, 110, 'CIP System 1', 'Clean-in-place system', 'machine', 1, 24, 1.0, true);

-- 3. Create resources for Plant 2 (Milwaukee)  
INSERT INTO ptresources (id, publish_date, instance_id, plant_id, department_id, resource_id, 
                        name, description, resource_type, capacity, available_hours, efficiency, is_active, bottleneck)
VALUES 
  (11, NOW(), 'BREW-SIM-001', 2, 5, 201, 'Mash Tun 1', 'Large mashing vessel - 8000L', 'machine', 8000, 24, 0.96, true, false),
  (12, NOW(), 'BREW-SIM-001', 2, 5, 202, 'Brew Kettle 1', 'Large boiling vessel - 8000L', 'machine', 8000, 24, 0.96, true, true),
  (13, NOW(), 'BREW-SIM-001', 2, 5, 203, 'Fermentation Tank 1', 'Large fermenter - 15000L', 'machine', 15000, 24, 0.98, true, false),
  (14, NOW(), 'BREW-SIM-001', 2, 5, 204, 'Fermentation Tank 2', 'Large fermenter - 15000L', 'machine', 15000, 24, 0.98, true, false),
  (15, NOW(), 'BREW-SIM-001', 2, 5, 205, 'Fermentation Tank 3', 'Large fermenter - 15000L', 'machine', 15000, 24, 0.98, true, false),
  (16, NOW(), 'BREW-SIM-001', 2, 6, 206, 'Bottling Line 1', 'High-speed bottling - 3000 bottles/hr', 'machine', 3000, 20, 0.87, true, false),
  (17, NOW(), 'BREW-SIM-001', 2, 6, 207, 'Canning Line 1', 'High-speed canning - 5000 cans/hr', 'machine', 5000, 20, 0.90, true, false),
  (18, NOW(), 'BREW-SIM-001', 2, 6, 208, 'Palletizer', 'Automated palletizing system', 'machine', 200, 20, 0.95, true, false);

-- 4. Create resources for Plant 3 (Mexico City)
INSERT INTO ptresources (id, publish_date, instance_id, plant_id, department_id, resource_id, 
                        name, description, resource_type, capacity, available_hours, efficiency, is_active)
VALUES 
  (19, NOW(), 'BREW-SIM-001', 3, 9, 301, 'Mash Tun 1', 'Standard mashing vessel - 4000L', 'machine', 4000, 24, 0.94, true),
  (20, NOW(), 'BREW-SIM-001', 3, 9, 302, 'Brew Kettle 1', 'Standard boiling vessel - 4000L', 'machine', 4000, 24, 0.94, true),
  (21, NOW(), 'BREW-SIM-001', 3, 9, 303, 'Fermentation Tank 1', 'Standard fermenter - 8000L', 'machine', 8000, 24, 0.97, true),
  (22, NOW(), 'BREW-SIM-001', 3, 9, 304, 'Fermentation Tank 2', 'Standard fermenter - 8000L', 'machine', 8000, 24, 0.97, true),
  (23, NOW(), 'BREW-SIM-001', 3, 10, 305, 'Bottling Line 1', 'Standard bottling - 1500 bottles/hr', 'machine', 1500, 16, 0.85, true);

-- Update sequences  
SELECT setval('ptplants_id_seq', GREATEST(5, (SELECT MAX(id) FROM ptplants)));
SELECT setval('ptresources_id_seq', GREATEST(23, (SELECT MAX(id) FROM ptresources)));

COMMIT;
EOF

echo "Generating data in development database..."
psql "$DEV_DB_URL" < /tmp/generate-pt-data-fixed.sql

if [ $? -eq 0 ]; then
  echo "✅ Data generated successfully in development!"
  
  # Verify the data
  echo ""
  echo "Verification:"
  echo "-------------"
  PLANT_COUNT=$(psql "$DEV_DB_URL" -t -c "SELECT COUNT(*) FROM ptplants" | tr -d ' ')
  RESOURCE_COUNT=$(psql "$DEV_DB_URL" -t -c "SELECT COUNT(*) FROM ptresources" | tr -d ' ')
  
  echo "  Plants created: $PLANT_COUNT"
  echo "  Resources created: $RESOURCE_COUNT"
  
  echo ""
  echo "Sample data:"
  psql "$DEV_DB_URL" -c "SELECT id, name, city, plant_type FROM ptplants ORDER BY id LIMIT 5;"
  echo ""
  psql "$DEV_DB_URL" -c "SELECT id, name, plant_id, resource_type, capacity FROM ptresources ORDER BY id LIMIT 5;"
else
  echo "❌ Failed to generate data"
  exit 1
fi

# Clean up
rm -f /tmp/generate-pt-data-fixed.sql

echo ""
echo "========================================="
echo "Data Generation Complete!"
echo "========================================="