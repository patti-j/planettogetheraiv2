-- Populate PT Publish Tables with Sample Data
-- Using correct enum values and column types

-- Clean up any previous test data
DELETE FROM pt_publish_job_activities WHERE instance_id = 'PHARMA-001';
DELETE FROM pt_publish_job_resources WHERE instance_id = 'PHARMA-001';
DELETE FROM pt_publish_job_operations WHERE instance_id = 'PHARMA-001';
DELETE FROM pt_publish_manufacturing_orders WHERE instance_id = 'PHARMA-001';
DELETE FROM pt_publish_jobs WHERE instance_id = 'PHARMA-001';

-- Insert Jobs with correct enum values
INSERT INTO pt_publish_jobs (
    publish_date, instance_id, job_id, external_id, name, description,
    priority, need_date_time, scheduled_status
)
VALUES
    (NOW(), 'PHARMA-001', 50001, 'PH-JOB-001', 'Ibuprofen Production', 'Production of 50,000 tablets',
     5, NOW() + INTERVAL '7 days', 'Scheduled'),
    (NOW(), 'PHARMA-001', 50002, 'PH-JOB-002', 'Acetaminophen Production', 'Production of 75,000 tablets',
     4, NOW() + INTERVAL '10 days', 'Scheduled'),
    (NOW(), 'PHARMA-001', 50003, 'PH-JOB-003', 'Vitamin C Production', 'Production of 30,000 tablets',
     3, NOW() + INTERVAL '14 days', 'Scheduled');

-- Insert Manufacturing Orders
INSERT INTO pt_publish_manufacturing_orders (
    publish_date, instance_id, job_id, manufacturing_order_id, external_id, name
)
VALUES
    (NOW(), 'PHARMA-001', 50001, 60001, 'PH-MO-001', 'Ibuprofen Batch A1'),
    (NOW(), 'PHARMA-001', 50002, 60002, 'PH-MO-002', 'Acetaminophen Batch B2'),
    (NOW(), 'PHARMA-001', 50003, 60003, 'PH-MO-003', 'Vitamin C Batch C3');

-- Insert Job Operations (scheduled_start and scheduled_end are TEXT columns)
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id, 
    job_id, manufacturing_order_id, operation_id,
    name, description,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, external_id
)
VALUES
    -- Ibuprofen operations
    (NOW(), 'PHARMA-001', 50001, 60001, 70001,
     'Material Prep', 'Prepare raw materials',
     '2025-08-22 08:00', '2025-08-22 10:00',
     50000, 0, 'PH-OP-001'),
     
    (NOW(), 'PHARMA-001', 50001, 60001, 70002,
     'Mixing', 'Mix ingredients',
     '2025-08-22 10:00', '2025-08-22 13:00',
     50000, 0, 'PH-OP-002'),
     
    (NOW(), 'PHARMA-001', 50001, 60001, 70003,
     'Compression', 'Tablet compression',
     '2025-08-22 13:00', '2025-08-22 17:00',
     50000, 0, 'PH-OP-003'),
     
    (NOW(), 'PHARMA-001', 50001, 60001, 70004,
     'Coating', 'Apply coating',
     '2025-08-22 17:00', '2025-08-22 20:00',
     50000, 0, 'PH-OP-004'),
     
    (NOW(), 'PHARMA-001', 50001, 60001, 70005,
     'Packaging', 'Package tablets',
     '2025-08-22 20:00', '2025-08-22 22:00',
     50000, 0, 'PH-OP-005'),
     
    -- Acetaminophen operations
    (NOW(), 'PHARMA-001', 50002, 60002, 70006,
     'Material Prep', 'Prepare raw materials',
     '2025-08-25 08:00', '2025-08-25 10:00',
     75000, 0, 'PH-OP-006'),
     
    (NOW(), 'PHARMA-001', 50002, 60002, 70007,
     'Blending', 'Blend ingredients',
     '2025-08-25 10:00', '2025-08-25 14:00',
     75000, 0, 'PH-OP-007'),
     
    (NOW(), 'PHARMA-001', 50002, 60002, 70008,
     'Tableting', 'Form tablets',
     '2025-08-25 14:00', '2025-08-25 19:00',
     75000, 0, 'PH-OP-008'),
     
    (NOW(), 'PHARMA-001', 50002, 60002, 70009,
     'Packaging', 'Package tablets',
     '2025-08-25 19:00', '2025-08-25 22:00',
     75000, 0, 'PH-OP-009'),
     
    -- Vitamin C operations
    (NOW(), 'PHARMA-001', 50003, 60003, 70010,
     'QC Check', 'Quality check materials',
     '2025-08-29 08:00', '2025-08-29 09:00',
     30000, 0, 'PH-OP-010'),
     
    (NOW(), 'PHARMA-001', 50003, 60003, 70011,
     'Mixing', 'Mix vitamin C powder',
     '2025-08-29 09:00', '2025-08-29 12:00',
     30000, 0, 'PH-OP-011'),
     
    (NOW(), 'PHARMA-001', 50003, 60003, 70012,
     'Compression', 'Compress tablets',
     '2025-08-29 12:00', '2025-08-29 16:00',
     30000, 0, 'PH-OP-012'),
     
    (NOW(), 'PHARMA-001', 50003, 60003, 70013,
     'Packaging', 'Package in bottles',
     '2025-08-29 16:00', '2025-08-29 18:00',
     30000, 0, 'PH-OP-013');

-- Insert Job Resources
INSERT INTO pt_publish_job_resources (
    publish_date, instance_id,
    job_id, manufacturing_order_id, operation_id, resource_requirement_id,
    description, external_id,
    usage_start, usage_end,
    is_primary, default_resource_id
)
SELECT 
    NOW(), 'PHARMA-001',
    o.job_id, o.manufacturing_order_id, o.operation_id,
    80000 + ROW_NUMBER() OVER (ORDER BY o.operation_id),
    'Resource for ' || o.name,
    'PH-RES-' || o.external_id,
    o.scheduled_start, o.scheduled_end,
    true,
    CASE 
        WHEN o.name LIKE '%Mix%' OR o.name LIKE '%Blend%' THEN 1
        WHEN o.name LIKE '%Compress%' OR o.name LIKE '%Tablet%' THEN 3
        WHEN o.name LIKE '%Coat%' THEN 5
        WHEN o.name LIKE '%Pack%' THEN 6
        WHEN o.name LIKE '%QC%' THEN 10
        ELSE 1
    END
FROM pt_publish_job_operations o
WHERE o.instance_id = 'PHARMA-001';

-- Insert Job Activities with correct enum values
INSERT INTO pt_publish_job_activities (
    publish_date, instance_id,
    job_id, manufacturing_order_id, operation_id, activity_id,
    external_id, production_status,
    required_finish_qty, reported_good_qty,
    percent_complete
)
SELECT
    NOW(), 'PHARMA-001',
    o.job_id, o.manufacturing_order_id, o.operation_id,
    90000 + ROW_NUMBER() OVER (ORDER BY o.operation_id),
    'PH-ACT-' || o.external_id,
    'Not Started'::pt_production_status,
    o.required_finish_qty, 0,
    0
FROM pt_publish_job_operations o
WHERE o.instance_id = 'PHARMA-001'
  AND o.job_id = 50001
LIMIT 5;

-- Verify the data
SELECT '=== Data Successfully Loaded ===' as status;
SELECT 'Jobs: ' || COUNT(*) as count FROM pt_publish_jobs WHERE instance_id = 'PHARMA-001';
SELECT 'Manufacturing Orders: ' || COUNT(*) as count FROM pt_publish_manufacturing_orders WHERE instance_id = 'PHARMA-001';
SELECT 'Job Operations: ' || COUNT(*) as count FROM pt_publish_job_operations WHERE instance_id = 'PHARMA-001';
SELECT 'Job Resources: ' || COUNT(*) as count FROM pt_publish_job_resources WHERE instance_id = 'PHARMA-001';
SELECT 'Job Activities: ' || COUNT(*) as count FROM pt_publish_job_activities WHERE instance_id = 'PHARMA-001';

-- Show sample data
SELECT '';
SELECT '=== Sample Job Schedule ===' as title;
SELECT 
    j.name as job,
    o.name as operation,
    o.scheduled_start as start_time,
    o.scheduled_end as end_time
FROM pt_publish_jobs j
JOIN pt_publish_job_operations o ON j.job_id = o.job_id AND j.instance_id = o.instance_id
WHERE j.instance_id = 'PHARMA-001'
ORDER BY o.scheduled_start
LIMIT 5;