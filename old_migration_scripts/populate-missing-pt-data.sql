-- Populate missing sample data for PT tables
-- This script populates empty or low-data PT tables with sample data

-- Start transaction
BEGIN;

-- Check and populate ptwarehouses if empty
INSERT INTO ptwarehouses (id, publish_date, instance_id, warehouse_id, external_id, name, description, plant_id)
SELECT 
  generate_series(1, 3),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(1001, 1003),
  'WH-' || generate_series(1001, 1003),
  'Warehouse ' || generate_series(1, 3),
  'Distribution warehouse ' || generate_series(1, 3),
  generate_series(1, 3)
WHERE NOT EXISTS (SELECT 1 FROM ptwarehouses LIMIT 1);

-- Check and populate ptcustomers if empty
INSERT INTO ptcustomers (id, publish_date, instance_id, customer_id, external_id, name, description, email, phone, address, city, state, country, postal_code)
SELECT 
  generate_series(1, 5),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(2001, 2005),
  'CUST-' || generate_series(2001, 2005),
  CASE generate_series
    WHEN 1 THEN 'Acme Corporation'
    WHEN 2 THEN 'Global Distributors Inc'
    WHEN 3 THEN 'Regional Retailers LLC'
    WHEN 4 THEN 'Industrial Supply Co'
    WHEN 5 THEN 'Manufacturing Partners'
  END,
  'Key customer account',
  'customer' || generate_series(1, 5) || '@example.com',
  '555-' || LPAD(generate_series(1000, 1004)::text, 4, '0'),
  generate_series(100, 104) || ' Business Blvd',
  'Chicago',
  'IL',
  'USA',
  '60601'
FROM generate_series(1, 5)
WHERE NOT EXISTS (SELECT 1 FROM ptcustomers LIMIT 1);

-- Check and populate ptdepartments if empty
INSERT INTO ptdepartments (id, publish_date, instance_id, department_id, external_id, name, description, plant_id, manager)
SELECT 
  generate_series(1, 4),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(3001, 3004),
  'DEPT-' || generate_series(3001, 3004),
  CASE generate_series
    WHEN 1 THEN 'Production'
    WHEN 2 THEN 'Quality Control'
    WHEN 3 THEN 'Maintenance'
    WHEN 4 THEN 'Packaging'
  END,
  CASE generate_series
    WHEN 1 THEN 'Main production department'
    WHEN 2 THEN 'Quality assurance and testing'
    WHEN 3 THEN 'Equipment maintenance and repair'
    WHEN 4 THEN 'Final packaging and shipping prep'
  END,
  ((generate_series(1, 4) - 1) % 3) + 1,
  CASE generate_series
    WHEN 1 THEN 'John Smith'
    WHEN 2 THEN 'Jane Doe'
    WHEN 3 THEN 'Mike Johnson'
    WHEN 4 THEN 'Sarah Williams'
  END
FROM generate_series(1, 4)
WHERE NOT EXISTS (SELECT 1 FROM ptdepartments LIMIT 1);

-- Check and populate ptitems if empty
INSERT INTO ptitems (id, publish_date, instance_id, item_id, external_id, name, description, item_type, unit_of_measure, cost, price, lead_time_days)
SELECT 
  generate_series(1, 10),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(4001, 4010),
  'ITEM-' || generate_series(4001, 4010),
  CASE (generate_series - 1) % 5
    WHEN 0 THEN 'Widget A'
    WHEN 1 THEN 'Component B'
    WHEN 2 THEN 'Assembly C'
    WHEN 3 THEN 'Part D'
    WHEN 4 THEN 'Product E'
  END || '-' || ((generate_series - 1) / 5 + 1),
  'Manufacturing item',
  CASE (generate_series - 1) % 3
    WHEN 0 THEN 'finished_good'
    WHEN 1 THEN 'raw_material'
    WHEN 2 THEN 'component'
  END,
  CASE (generate_series - 1) % 2
    WHEN 0 THEN 'EA'
    WHEN 1 THEN 'KG'
  END,
  ROUND((RANDOM() * 100 + 10)::numeric, 2),
  ROUND((RANDOM() * 200 + 50)::numeric, 2),
  (RANDOM() * 20 + 1)::integer
FROM generate_series(1, 10)
WHERE NOT EXISTS (SELECT 1 FROM ptitems LIMIT 1);

-- Check and populate ptinventories if empty
INSERT INTO ptinventories (id, publish_date, instance_id, inventory_id, item_id, warehouse_id, quantity_on_hand, quantity_available, quantity_allocated, reorder_point, reorder_quantity)
SELECT 
  generate_series(1, 15),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(5001, 5015),
  ((generate_series - 1) % 10) + 4001,
  ((generate_series - 1) % 3) + 1001,
  ROUND((RANDOM() * 1000 + 100)::numeric, 0),
  ROUND((RANDOM() * 800 + 50)::numeric, 0),
  ROUND((RANDOM() * 200)::numeric, 0),
  ROUND((RANDOM() * 100 + 50)::numeric, 0),
  ROUND((RANDOM() * 500 + 100)::numeric, 0)
FROM generate_series(1, 15)
WHERE NOT EXISTS (SELECT 1 FROM ptinventories LIMIT 1);

-- Check and populate ptcapabilities if empty
INSERT INTO ptcapabilities (id, publish_date, instance_id, capability_id, external_id, name, description, capability_type)
SELECT 
  generate_series(1, 6),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(6001, 6006),
  'CAP-' || generate_series(6001, 6006),
  CASE generate_series
    WHEN 1 THEN 'Welding'
    WHEN 2 THEN 'Assembly'
    WHEN 3 THEN 'Painting'
    WHEN 4 THEN 'CNC Machining'
    WHEN 5 THEN 'Quality Inspection'
    WHEN 6 THEN 'Packaging'
  END,
  CASE generate_series
    WHEN 1 THEN 'MIG/TIG welding capability'
    WHEN 2 THEN 'Manual and automated assembly'
    WHEN 3 THEN 'Powder coating and spray painting'
    WHEN 4 THEN '5-axis CNC machining'
    WHEN 5 THEN 'Dimensional and visual inspection'
    WHEN 6 THEN 'Automated packaging line'
  END,
  'skill'
FROM generate_series(1, 6)
WHERE NOT EXISTS (SELECT 1 FROM ptcapabilities LIMIT 1);

-- Check and populate ptmetrics if empty
INSERT INTO ptmetrics (id, publish_date, instance_id, metric_id, external_id, name, description, metric_type, unit, target_value, current_value)
SELECT 
  generate_series(1, 8),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(7001, 7008),
  'MET-' || generate_series(7001, 7008),
  CASE generate_series
    WHEN 1 THEN 'OEE'
    WHEN 2 THEN 'Cycle Time'
    WHEN 3 THEN 'Defect Rate'
    WHEN 4 THEN 'On-Time Delivery'
    WHEN 5 THEN 'Inventory Turns'
    WHEN 6 THEN 'Setup Time'
    WHEN 7 THEN 'Throughput'
    WHEN 8 THEN 'Utilization'
  END,
  CASE generate_series
    WHEN 1 THEN 'Overall Equipment Effectiveness'
    WHEN 2 THEN 'Average production cycle time'
    WHEN 3 THEN 'Quality defect percentage'
    WHEN 4 THEN 'Percentage of orders delivered on time'
    WHEN 5 THEN 'Inventory turnover ratio'
    WHEN 6 THEN 'Average changeover time'
    WHEN 7 THEN 'Units produced per hour'
    WHEN 8 THEN 'Resource utilization percentage'
  END,
  CASE generate_series
    WHEN 1 THEN 'percentage'
    WHEN 2 THEN 'time'
    WHEN 3 THEN 'percentage'
    WHEN 4 THEN 'percentage'
    WHEN 5 THEN 'ratio'
    WHEN 6 THEN 'time'
    WHEN 7 THEN 'rate'
    WHEN 8 THEN 'percentage'
  END,
  CASE generate_series
    WHEN 1 THEN '%'
    WHEN 2 THEN 'minutes'
    WHEN 3 THEN '%'
    WHEN 4 THEN '%'
    WHEN 5 THEN 'turns/year'
    WHEN 6 THEN 'minutes'
    WHEN 7 THEN 'units/hr'
    WHEN 8 THEN '%'
  END,
  CASE generate_series
    WHEN 1 THEN 85
    WHEN 2 THEN 30
    WHEN 3 THEN 2
    WHEN 4 THEN 95
    WHEN 5 THEN 12
    WHEN 6 THEN 15
    WHEN 7 THEN 100
    WHEN 8 THEN 80
  END,
  ROUND((CASE generate_series
    WHEN 1 THEN 75 + RANDOM() * 20
    WHEN 2 THEN 25 + RANDOM() * 15
    WHEN 3 THEN 1 + RANDOM() * 4
    WHEN 4 THEN 85 + RANDOM() * 15
    WHEN 5 THEN 8 + RANDOM() * 8
    WHEN 6 THEN 12 + RANDOM() * 10
    WHEN 7 THEN 80 + RANDOM() * 40
    WHEN 8 THEN 65 + RANDOM() * 30
  END)::numeric, 2)
FROM generate_series(1, 8)
WHERE NOT EXISTS (SELECT 1 FROM ptmetrics LIMIT 1);

-- Check and populate ptsalesorders if empty
INSERT INTO ptsalesorders (id, publish_date, instance_id, sales_order_id, external_id, order_number, customer_id, order_date, due_date, status, total_amount)
SELECT 
  generate_series(1, 10),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(8001, 8010),
  'SO-' || generate_series(8001, 8010),
  'SO-2025-' || LPAD(generate_series(1, 10)::text, 4, '0'),
  ((generate_series - 1) % 5) + 2001,
  NOW() - INTERVAL '30 days' + (generate_series * INTERVAL '3 days'),
  NOW() + (generate_series * INTERVAL '5 days'),
  CASE (generate_series - 1) % 4
    WHEN 0 THEN 'open'
    WHEN 1 THEN 'in_progress'
    WHEN 2 THEN 'shipped'
    WHEN 3 THEN 'completed'
  END,
  ROUND((RANDOM() * 50000 + 5000)::numeric, 2)
FROM generate_series(1, 10)
WHERE NOT EXISTS (SELECT 1 FROM ptsalesorders LIMIT 1);

-- Check and populate ptjobmaterials if empty
INSERT INTO ptjobmaterials (id, publish_date, instance_id, job_material_id, job_id, item_id, quantity_required, quantity_issued, quantity_remaining)
SELECT 
  generate_series(1, 20),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(9001, 9020),
  ((generate_series - 1) % 9) + 10001,
  ((generate_series - 1) % 10) + 4001,
  ROUND((RANDOM() * 100 + 10)::numeric, 2),
  ROUND((RANDOM() * 50)::numeric, 2),
  ROUND((RANDOM() * 50 + 10)::numeric, 2)
FROM generate_series(1, 20)
WHERE NOT EXISTS (SELECT 1 FROM ptjobmaterials LIMIT 1);

-- Check and populate ptjobresources if empty (links jobs/operations to resources)
INSERT INTO ptjobresources (id, publish_date, instance_id, job_resource_id, job_id, operation_id, resource_id, is_primary, setup_hours, run_hours)
SELECT 
  generate_series(1, 15),
  NOW(),
  'DEFAULT-INSTANCE',
  generate_series(10001, 10015),
  ((generate_series - 1) % 9) + 10001,
  ((generate_series - 1) % 13) + 47,
  ((generate_series - 1) % 14) + 201,
  CASE WHEN (generate_series % 3) = 1 THEN true ELSE false END,
  ROUND((RANDOM() * 2 + 0.5)::numeric, 2),
  ROUND((RANDOM() * 8 + 2)::numeric, 2)
FROM generate_series(1, 15)
WHERE NOT EXISTS (SELECT 1 FROM ptjobresources LIMIT 1);

COMMIT;

-- Verify the data population
SELECT 'Data Population Summary:' as info;
SELECT 'ptwarehouses: ' || COUNT(*) FROM ptwarehouses
UNION ALL SELECT 'ptcustomers: ' || COUNT(*) FROM ptcustomers
UNION ALL SELECT 'ptdepartments: ' || COUNT(*) FROM ptdepartments
UNION ALL SELECT 'ptitems: ' || COUNT(*) FROM ptitems
UNION ALL SELECT 'ptinventories: ' || COUNT(*) FROM ptinventories
UNION ALL SELECT 'ptcapabilities: ' || COUNT(*) FROM ptcapabilities
UNION ALL SELECT 'ptmetrics: ' || COUNT(*) FROM ptmetrics
UNION ALL SELECT 'ptsalesorders: ' || COUNT(*) FROM ptsalesorders
UNION ALL SELECT 'ptjobmaterials: ' || COUNT(*) FROM ptjobmaterials
UNION ALL SELECT 'ptjobresources: ' || COUNT(*) FROM ptjobresources;