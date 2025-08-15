-- Populate PT Publish Tables with Sample Data
-- This script uses proper column names and avoids ID conflicts

-- Clear existing sample data (optional - comment out to keep existing)
DELETE FROM pt_publish_job_resources WHERE instance_id = 'PT-PROD-001';
DELETE FROM pt_publish_job_activities WHERE instance_id = 'PT-PROD-001';
DELETE FROM pt_publish_job_operations WHERE instance_id = 'PT-PROD-001';
DELETE FROM pt_publish_jobs WHERE instance_id = 'PT-PROD-001';
DELETE FROM pt_publish_manufacturing_orders WHERE instance_id = 'PT-PROD-001';

-- Insert Jobs (without explicit ID to avoid conflicts)
INSERT INTO pt_publish_jobs (
    publish_date, instance_id, job_id, external_id, name, description,
    priority, need_date_time, scheduled_status, classification, type
)
VALUES
    (NOW(), 'PT-PROD-001', 2001, 'JOB-2025-001', 'Ibuprofen Production Run', 'Production of 50,000 tablets of Ibuprofen 200mg',
     5, NOW() + INTERVAL '7 days', 'SCHEDULED', 'PRODUCTION', 'STANDARD'),
    (NOW(), 'PT-PROD-001', 2002, 'JOB-2025-002', 'Acetaminophen Production Run', 'Production of 75,000 tablets of Acetaminophen 500mg',
     4, NOW() + INTERVAL '10 days', 'SCHEDULED', 'PRODUCTION', 'STANDARD'),
    (NOW(), 'PT-PROD-001', 2003, 'JOB-2025-003', 'Vitamin C Production Run', 'Production of 30,000 tablets of Vitamin C 1000mg',
     3, NOW() + INTERVAL '14 days', 'SCHEDULED', 'PRODUCTION', 'STANDARD'),
    (NOW(), 'PT-PROD-001', 2004, 'JOB-2025-004', 'Amoxicillin Production Run', 'Production of 40,000 capsules of Amoxicillin 250mg',
     5, NOW() + INTERVAL '5 days', 'IN_PROGRESS', 'PRODUCTION', 'RUSH'),
    (NOW(), 'PT-PROD-001', 2005, 'JOB-2025-005', 'Aspirin Production Run', 'Production of 100,000 tablets of Aspirin 100mg',
     2, NOW() + INTERVAL '21 days', 'PLANNED', 'PRODUCTION', 'STANDARD');

-- Insert Manufacturing Orders
INSERT INTO pt_publish_manufacturing_orders (
    publish_date, instance_id, manufacturing_order_id, external_id, name, description
)
VALUES
    (NOW(), 'PT-PROD-001', 1001, 'MO-2025-001', 'Ibuprofen 200mg Batch A1', 'Manufacturing order for ibuprofen tablets'),
    (NOW(), 'PT-PROD-001', 1002, 'MO-2025-002', 'Acetaminophen 500mg Batch B2', 'Manufacturing order for acetaminophen tablets'),
    (NOW(), 'PT-PROD-001', 1003, 'MO-2025-003', 'Vitamin C 1000mg Batch C3', 'Manufacturing order for vitamin C tablets'),
    (NOW(), 'PT-PROD-001', 1004, 'MO-2025-004', 'Amoxicillin 250mg Batch D4', 'Manufacturing order for amoxicillin capsules'),
    (NOW(), 'PT-PROD-001', 1005, 'MO-2025-005', 'Aspirin 100mg Batch E5', 'Manufacturing order for aspirin tablets');

-- Insert Job Operations for Ibuprofen (Job ID 2001)
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id, 
    job_id, manufacturing_order_id, operation_id,
    name, description, 
    setup_hours, cycle_hrs, post_processing_hours,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, on_hold,
    external_id
)
VALUES
    (NOW(), 'PT-PROD-001', 
     2001, 1001, 1,
     'Weighing & Dispensing', 'Weigh and dispense raw materials',
     0.5, 1.0, 0.25,
     NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours',
     50000, 0, false,
     'OP-JOB1-001'),
    
    (NOW(), 'PT-PROD-001',
     2001, 1001, 2,
     'Mixing', 'Mix active ingredients with excipients',
     0.25, 2.0, 0.5,
     NOW() + INTERVAL '7 days 2 hours', NOW() + INTERVAL '7 days 5 hours',
     50000, 0, false,
     'OP-JOB1-002'),
     
    (NOW(), 'PT-PROD-001',
     2001, 1001, 3,
     'Granulation', 'Wet granulation process',
     0.5, 3.0, 1.0,
     NOW() + INTERVAL '7 days 5 hours', NOW() + INTERVAL '7 days 10 hours',
     50000, 0, false,
     'OP-JOB1-003'),
     
    (NOW(), 'PT-PROD-001',
     2001, 1001, 4,
     'Compression', 'Tablet compression',
     1.0, 4.0, 0.5,
     NOW() + INTERVAL '7 days 10 hours', NOW() + INTERVAL '7 days 16 hours',
     50000, 0, false,
     'OP-JOB1-004'),
     
    (NOW(), 'PT-PROD-001',
     2001, 1001, 5,
     'Coating', 'Film coating application',
     0.5, 3.0, 1.0,
     NOW() + INTERVAL '7 days 16 hours', NOW() + INTERVAL '7 days 21 hours',
     50000, 0, false,
     'OP-JOB1-005'),
     
    (NOW(), 'PT-PROD-001',
     2001, 1001, 6,
     'Packaging', 'Blister packaging and boxing',
     0.5, 2.0, 0.5,
     NOW() + INTERVAL '7 days 21 hours', NOW() + INTERVAL '8 days',
     50000, 0, false,
     'OP-JOB1-006');

-- Insert Job Operations for Acetaminophen (Job ID 2002)
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id,
    job_id, manufacturing_order_id, operation_id,
    name, description,
    setup_hours, cycle_hrs, post_processing_hours,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, on_hold,
    external_id
)
VALUES
    (NOW(), 'PT-PROD-001',
     2002, 1002, 1,
     'Material Preparation', 'Prepare and verify raw materials',
     0.75, 1.5, 0.25,
     NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 3 hours',
     75000, 0, false,
     'OP-JOB2-001'),
     
    (NOW(), 'PT-PROD-001',
     2002, 1002, 2,
     'Blending', 'Blend active and inactive ingredients',
     0.5, 2.5, 0.5,
     NOW() + INTERVAL '10 days 3 hours', NOW() + INTERVAL '10 days 7 hours',
     75000, 0, false,
     'OP-JOB2-002'),
     
    (NOW(), 'PT-PROD-001',
     2002, 1002, 3,
     'Tablet Formation', 'Direct compression tableting',
     1.0, 5.0, 0.5,
     NOW() + INTERVAL '10 days 7 hours', NOW() + INTERVAL '10 days 14 hours',
     75000, 0, false,
     'OP-JOB2-003'),
     
    (NOW(), 'PT-PROD-001',
     2002, 1002, 4,
     'Quality Testing', 'In-process quality control',
     0.25, 1.0, 0.25,
     NOW() + INTERVAL '10 days 14 hours', NOW() + INTERVAL '10 days 16 hours',
     75000, 0, false,
     'OP-JOB2-004'),
     
    (NOW(), 'PT-PROD-001',
     2002, 1002, 5,
     'Primary Packaging', 'Bottle filling and capping',
     0.5, 3.0, 0.5,
     NOW() + INTERVAL '10 days 16 hours', NOW() + INTERVAL '10 days 20 hours',
     75000, 0, false,
     'OP-JOB2-005');

-- Insert Job Operations for Vitamin C (Job ID 2003)
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id,
    job_id, manufacturing_order_id, operation_id,
    name, description,
    setup_hours, cycle_hrs, post_processing_hours,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, on_hold,
    external_id
)
VALUES
    (NOW(), 'PT-PROD-001',
     2003, 1003, 1,
     'Raw Material QC', 'Quality check of vitamin C powder',
     0.5, 0.5, 0.25,
     NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 2 hours',
     30000, 0, false,
     'OP-JOB3-001'),
     
    (NOW(), 'PT-PROD-001',
     2003, 1003, 2,
     'Mixing & Blending', 'Mix vitamin C with excipients',
     0.5, 2.0, 0.5,
     NOW() + INTERVAL '14 days 2 hours', NOW() + INTERVAL '14 days 5 hours',
     30000, 0, false,
     'OP-JOB3-002'),
     
    (NOW(), 'PT-PROD-001',
     2003, 1003, 3,
     'Compression', 'High-dose tablet compression',
     1.0, 3.0, 0.5,
     NOW() + INTERVAL '14 days 5 hours', NOW() + INTERVAL '14 days 10 hours',
     30000, 0, false,
     'OP-JOB3-003'),
     
    (NOW(), 'PT-PROD-001',
     2003, 1003, 4,
     'Packaging', 'Packaging in moisture-resistant containers',
     0.5, 2.0, 0.5,
     NOW() + INTERVAL '14 days 10 hours', NOW() + INTERVAL '14 days 13 hours',
     30000, 0, false,
     'OP-JOB3-004');

-- Insert Job Operations for Amoxicillin (Job ID 2004) - IN PROGRESS
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id,
    job_id, manufacturing_order_id, operation_id,
    name, description,
    setup_hours, cycle_hrs, post_processing_hours,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, on_hold,
    external_id
)
VALUES
    (NOW(), 'PT-PROD-001',
     2004, 1004, 1,
     'API Verification', 'Verify amoxicillin API quality',
     0.5, 1.0, 0.25,
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '22 hours',
     40000, 100, false,
     'OP-JOB4-001'),
     
    (NOW(), 'PT-PROD-001',
     2004, 1004, 2,
     'Powder Blending', 'Blend API with excipients',
     0.5, 2.0, 0.5,
     NOW() - INTERVAL '22 hours', NOW() - INTERVAL '19 hours',
     40000, 100, false,
     'OP-JOB4-002'),
     
    (NOW(), 'PT-PROD-001',
     2004, 1004, 3,
     'Encapsulation', 'Fill capsules with powder blend',
     1.0, 4.0, 0.5,
     NOW() - INTERVAL '19 hours', NOW() - INTERVAL '13 hours',
     40000, 65, false,
     'OP-JOB4-003'),
     
    (NOW(), 'PT-PROD-001',
     2004, 1004, 4,
     'Polishing', 'Capsule polishing and inspection',
     0.25, 1.0, 0.25,
     NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours',
     40000, 0, false,
     'OP-JOB4-004'),
     
    (NOW(), 'PT-PROD-001',
     2004, 1004, 5,
     'Packaging', 'Blister packaging with desiccant',
     0.5, 3.0, 0.5,
     NOW() + INTERVAL '4 hours', NOW() + INTERVAL '8 hours',
     40000, 0, false,
     'OP-JOB4-005');

-- Insert Job Operations for Aspirin (Job ID 2005)
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id,
    job_id, manufacturing_order_id, operation_id,
    name, description,
    setup_hours, cycle_hrs, post_processing_hours,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, on_hold,
    external_id
)
VALUES
    (NOW(), 'PT-PROD-001',
     2005, 1005, 1,
     'Raw Material Staging', 'Stage aspirin API and excipients',
     0.5, 0.75, 0.25,
     NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days 2 hours',
     100000, 0, false,
     'OP-JOB5-001'),
     
    (NOW(), 'PT-PROD-001',
     2005, 1005, 2,
     'Dry Mixing', 'Dry blend aspirin with binders',
     0.5, 3.0, 0.5,
     NOW() + INTERVAL '21 days 2 hours', NOW() + INTERVAL '21 days 6 hours',
     100000, 0, false,
     'OP-JOB5-002'),
     
    (NOW(), 'PT-PROD-001',
     2005, 1005, 3,
     'High-Speed Compression', 'High-volume tablet production',
     1.0, 6.0, 0.5,
     NOW() + INTERVAL '21 days 6 hours', NOW() + INTERVAL '21 days 14 hours',
     100000, 0, false,
     'OP-JOB5-003'),
     
    (NOW(), 'PT-PROD-001',
     2005, 1005, 4,
     'Enteric Coating', 'Apply enteric coating for stomach protection',
     0.75, 4.0, 1.0,
     NOW() + INTERVAL '21 days 14 hours', NOW() + INTERVAL '21 days 20 hours',
     100000, 0, false,
     'OP-JOB5-004'),
     
    (NOW(), 'PT-PROD-001',
     2005, 1005, 5,
     'Bulk Packaging', 'Bottle packaging in bulk containers',
     0.5, 3.0, 0.5,
     NOW() + INTERVAL '21 days 20 hours', NOW() + INTERVAL '22 days',
     100000, 0, false,
     'OP-JOB5-005');

-- Insert Job Resources for each operation
INSERT INTO pt_publish_job_resources (
    publish_date, instance_id,
    job_id, manufacturing_order_id, operation_id, resource_requirement_id,
    description, external_id,
    usage_start, usage_end,
    is_primary, default_resource_id
)
SELECT 
    NOW(), 'PT-PROD-001',
    o.job_id, o.manufacturing_order_id, o.operation_id, 
    ROW_NUMBER() OVER (ORDER BY o.id), -- Generate unique resource_requirement_id
    'Resource for ' || o.name, 
    'RES-' || o.external_id,
    o.scheduled_start::text, o.scheduled_end::text,
    true,
    CASE 
        WHEN o.name LIKE '%Mixing%' OR o.name LIKE '%Blending%' THEN 1
        WHEN o.name LIKE '%Granulation%' THEN 8
        WHEN o.name LIKE '%Compression%' OR o.name LIKE '%Tablet%' THEN 3
        WHEN o.name LIKE '%Coating%' THEN 5
        WHEN o.name LIKE '%Packaging%' THEN 6
        WHEN o.name LIKE '%Encapsulation%' THEN 9
        WHEN o.name LIKE '%QC%' OR o.name LIKE '%Testing%' THEN 10
        WHEN o.name LIKE '%Verification%' THEN 10
        ELSE 1
    END
FROM pt_publish_job_operations o
WHERE o.instance_id = 'PT-PROD-001';

-- Insert Job Activities for some operations
INSERT INTO pt_publish_job_activities (
    publish_date, instance_id, activity_id, external_id,
    operation_id, job_id,
    name, description, activity_type,
    scheduled_start_date, scheduled_end_date,
    production_status, percent_complete
)
SELECT
    NOW(), 'PT-PROD-001', 
    ROW_NUMBER() OVER (ORDER BY o.id) + 20000, -- Generate unique activity_id
    'ACT-' || o.external_id,
    o.operation_id, o.job_id,
    o.name || ' Activity', o.description, 
    CASE 
        WHEN o.name LIKE '%QC%' OR o.name LIKE '%Testing%' THEN 'QUALITY_CHECK'
        WHEN o.name LIKE '%Preparation%' OR o.name LIKE '%Staging%' THEN 'PREPARATION'
        ELSE 'PROCESSING'
    END,
    o.scheduled_start, o.scheduled_end,
    CASE 
        WHEN o.percent_finished = 100 THEN 'COMPLETED'
        WHEN o.percent_finished > 0 THEN 'IN_PROGRESS'
        ELSE 'SCHEDULED'
    END,
    o.percent_finished
FROM pt_publish_job_operations o
WHERE o.instance_id = 'PT-PROD-001'
  AND o.job_id IN (2001, 2004) -- Only create activities for selected jobs
LIMIT 15;

-- Verify the data was inserted
SELECT 'PT Publish Tables Population Summary:' as status;
SELECT 'Jobs: ' || COUNT(*) as count FROM pt_publish_jobs WHERE instance_id = 'PT-PROD-001';
SELECT 'Manufacturing Orders: ' || COUNT(*) as count FROM pt_publish_manufacturing_orders WHERE instance_id = 'PT-PROD-001';
SELECT 'Job Operations: ' || COUNT(*) as count FROM pt_publish_job_operations WHERE instance_id = 'PT-PROD-001';
SELECT 'Job Resources: ' || COUNT(*) as count FROM pt_publish_job_resources WHERE instance_id = 'PT-PROD-001';
SELECT 'Job Activities: ' || COUNT(*) as count FROM pt_publish_job_activities WHERE instance_id = 'PT-PROD-001';

-- Show sample of operations with resources
SELECT 
    j.name as job_name,
    o.name as operation_name,
    o.scheduled_start,
    o.percent_finished || '%' as progress,
    r.default_resource_id as resource_id
FROM pt_publish_jobs j
JOIN pt_publish_job_operations o ON j.job_id = o.job_id AND j.instance_id = o.instance_id
LEFT JOIN pt_publish_job_resources r ON o.operation_id = r.operation_id AND o.job_id = r.job_id AND o.instance_id = r.instance_id
WHERE j.instance_id = 'PT-PROD-001'
ORDER BY j.job_id, o.operation_id
LIMIT 10;