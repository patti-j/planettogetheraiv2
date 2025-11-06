#!/bin/bash

# Generate PT Resources and Plants data
echo "========================================="
echo "Generating PT Resources and Plants Data"
echo "========================================="

# Development database
DEV_DB_URL=$DATABASE_URL

# SQL to generate brewery simulation data
cat > /tmp/generate-pt-data.sql << 'EOF'
-- Generate PT Plants and Resources data
BEGIN;

-- Clear existing data (if any)
TRUNCATE TABLE ptplants CASCADE;
TRUNCATE TABLE ptresources CASCADE;

-- 1. Create brewery plants
INSERT INTO ptplants (id, external_id, name, description, plant_type, is_active, publish_date, instance_id, plant_id)
VALUES 
  (1, 'PLANT-AMS-01', 'Amsterdam Brewery', 'Main European production facility', 'manufacturing', true, NOW(), 'BREW-SIM-001', 1),
  (2, 'PLANT-MIL-01', 'Milwaukee Brewery', 'North American production facility', 'manufacturing', true, NOW(), 'BREW-SIM-001', 2),
  (3, 'PLANT-MEX-01', 'Mexico City Brewery', 'Latin America production facility', 'manufacturing', true, NOW(), 'BREW-SIM-001', 3),
  (4, 'PLANT-SIN-01', 'Singapore Brewery', 'Asia Pacific production facility', 'manufacturing', true, NOW(), 'BREW-SIM-001', 4),
  (5, 'PLANT-JOH-01', 'Johannesburg Brewery', 'Africa production facility', 'manufacturing', true, NOW(), 'BREW-SIM-001', 5);

-- 2. Create brewery resources for Plant 1 (Amsterdam)
INSERT INTO ptresources (id, external_id, name, description, plant_id, resource_type, capacity, available_hours, efficiency, is_active, publish_date, instance_id, resource_id, department_id)
VALUES 
  -- Brewing Operations Resources
  (1, 'RES-PLANT-AMS-01-001', 'Mash Tun 1', 'Mashing - Capacity: 5000L', 1, 'machine', 5000, 24, 0.95, true, NOW(), 'BREW-SIM-001', 1, 1),
  (2, 'RES-PLANT-AMS-01-002', 'Brew Kettle 1', 'Boiling - Capacity: 5000L', 1, 'machine', 5000, 24, 0.95, true, NOW(), 'BREW-SIM-001', 2, 1),
  (3, 'RES-PLANT-AMS-01-003', 'Fermentation Tank 1', 'Fermenter - Capacity: 10000L', 1, 'machine', 10000, 24, 0.98, true, NOW(), 'BREW-SIM-001', 3, 1),
  (4, 'RES-PLANT-AMS-01-004', 'Fermentation Tank 2', 'Fermenter - Capacity: 10000L', 1, 'machine', 10000, 24, 0.98, true, NOW(), 'BREW-SIM-001', 4, 1),
  (5, 'RES-PLANT-AMS-01-005', 'Bright Tank 1', 'Conditioning - Capacity: 8000L', 1, 'machine', 8000, 24, 0.98, true, NOW(), 'BREW-SIM-001', 5, 1),
  
  -- Packaging Resources
  (6, 'RES-PLANT-AMS-01-006', 'Bottling Line 1', 'Bottling - Capacity: 2000 bottles/hr', 1, 'machine', 2000, 16, 0.85, true, NOW(), 'BREW-SIM-001', 6, 2),
  (7, 'RES-PLANT-AMS-01-007', 'Kegging Line 1', 'Kegging - Capacity: 100 kegs/hr', 1, 'machine', 100, 16, 0.90, true, NOW(), 'BREW-SIM-001', 7, 2),
  (8, 'RES-PLANT-AMS-01-008', 'Canning Line 1', 'Canning - Capacity: 3000 cans/hr', 1, 'machine', 3000, 16, 0.88, true, NOW(), 'BREW-SIM-001', 8, 2);

-- 3. Create resources for Plant 2 (Milwaukee)  
INSERT INTO ptresources (id, external_id, name, description, plant_id, resource_type, capacity, available_hours, efficiency, is_active, publish_date, instance_id, resource_id, department_id)
VALUES 
  (9, 'RES-PLANT-MIL-01-001', 'Mash Tun 1', 'Mashing - Capacity: 8000L', 2, 'machine', 8000, 24, 0.96, true, NOW(), 'BREW-SIM-001', 9, 5),
  (10, 'RES-PLANT-MIL-01-002', 'Brew Kettle 1', 'Boiling - Capacity: 8000L', 2, 'machine', 8000, 24, 0.96, true, NOW(), 'BREW-SIM-001', 10, 5),
  (11, 'RES-PLANT-MIL-01-003', 'Fermentation Tank 1', 'Fermenter - Capacity: 15000L', 2, 'machine', 15000, 24, 0.98, true, NOW(), 'BREW-SIM-001', 11, 5),
  (12, 'RES-PLANT-MIL-01-004', 'Fermentation Tank 2', 'Fermenter - Capacity: 15000L', 2, 'machine', 15000, 24, 0.98, true, NOW(), 'BREW-SIM-001', 12, 5),
  (13, 'RES-PLANT-MIL-01-005', 'Fermentation Tank 3', 'Fermenter - Capacity: 15000L', 2, 'machine', 15000, 24, 0.98, true, NOW(), 'BREW-SIM-001', 13, 5),
  (14, 'RES-PLANT-MIL-01-006', 'Bottling Line 1', 'Bottling - Capacity: 3000 bottles/hr', 2, 'machine', 3000, 20, 0.87, true, NOW(), 'BREW-SIM-001', 14, 6),
  (15, 'RES-PLANT-MIL-01-007', 'Canning Line 1', 'Canning - Capacity: 5000 cans/hr', 2, 'machine', 5000, 20, 0.90, true, NOW(), 'BREW-SIM-001', 15, 6);

-- Update sequences  
SELECT setval('ptplants_id_seq', GREATEST(5, (SELECT MAX(id) FROM ptplants)));
SELECT setval('ptresources_id_seq', GREATEST(15, (SELECT MAX(id) FROM ptresources)));

COMMIT;
EOF

echo "Generating data in development database..."
psql "$DEV_DB_URL" < /tmp/generate-pt-data.sql

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
else
  echo "❌ Failed to generate data"
  exit 1
fi

# Clean up
rm -f /tmp/generate-pt-data.sql

echo ""
echo "========================================="
echo "Data Generation Complete!"
echo "========================================="