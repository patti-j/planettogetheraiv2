-- Populate PT Publish Tables with Brewery Sample Data
-- This script creates a pharmaceutical/brewery production scenario

-- First, verify what jobs already exist
SELECT 'Existing Jobs:' as info, COUNT(*) as count FROM pt_publish_jobs;

-- Insert new Jobs with unique job_ids
INSERT INTO pt_publish_jobs (
    publish_date, instance_id, job_id, external_id, name, description,
    priority, need_date_time, scheduled_status, classification, type
)
VALUES
    (NOW(), 'BREWERY-001', 20001, 'BRW-JOB-001', 'Ibuprofen Tablet Production', 'Batch production of 50,000 tablets of Ibuprofen 200mg',
     5, NOW() + INTERVAL '7 days', 'SCHEDULED', 'PRODUCTION', 'STANDARD'),
    (NOW(), 'BREWERY-001', 20002, 'BRW-JOB-002', 'Acetaminophen Tablet Production', 'Batch production of 75,000 tablets of Acetaminophen 500mg',
     4, NOW() + INTERVAL '10 days', 'SCHEDULED', 'PRODUCTION', 'STANDARD'),
    (NOW(), 'BREWERY-001', 20003, 'BRW-JOB-003', 'Vitamin C Tablet Production', 'Batch production of 30,000 tablets of Vitamin C 1000mg',
     3, NOW() + INTERVAL '14 days', 'SCHEDULED', 'PRODUCTION', 'STANDARD'),
    (NOW(), 'BREWERY-001', 20004, 'BRW-JOB-004', 'Amoxicillin Capsule Production', 'Batch production of 40,000 capsules of Amoxicillin 250mg',
     5, NOW() + INTERVAL '5 days', 'IN_PROGRESS', 'PRODUCTION', 'RUSH'),
    (NOW(), 'BREWERY-001', 20005, 'BRW-JOB-005', 'Aspirin Tablet Production', 'Batch production of 100,000 tablets of Aspirin 100mg',
     2, NOW() + INTERVAL '21 days', 'PLANNED', 'PRODUCTION', 'STANDARD')
ON CONFLICT DO NOTHING;

-- Insert Manufacturing Orders linked to the Jobs
INSERT INTO pt_publish_manufacturing_orders (
    publish_date, instance_id, job_id, manufacturing_order_id, external_id, name, description
)
VALUES
    (NOW(), 'BREWERY-001', 20001, 30001, 'BRW-MO-001', 'Ibuprofen 200mg Batch A1', 'Manufacturing order for ibuprofen tablets'),
    (NOW(), 'BREWERY-001', 20002, 30002, 'BRW-MO-002', 'Acetaminophen 500mg Batch B2', 'Manufacturing order for acetaminophen tablets'),
    (NOW(), 'BREWERY-001', 20003, 30003, 'BRW-MO-003', 'Vitamin C 1000mg Batch C3', 'Manufacturing order for vitamin C tablets'),
    (NOW(), 'BREWERY-001', 20004, 30004, 'BRW-MO-004', 'Amoxicillin 250mg Batch D4', 'Manufacturing order for amoxicillin capsules'),
    (NOW(), 'BREWERY-001', 20005, 30005, 'BRW-MO-005', 'Aspirin 100mg Batch E5', 'Manufacturing order for aspirin tablets')
ON CONFLICT DO NOTHING;

-- Insert Job Operations
-- Ibuprofen Production Operations
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
    -- Ibuprofen operations (Job 20001)
    (NOW(), 'BREWERY-001', 20001, 30001, 40001,
     'Weighing & Dispensing', 'Weigh and dispense raw materials',
     0.5, 1.0, 0.25,
     NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours',
     50000, 0, false, 'BRW-OP-001-01'),
     
    (NOW(), 'BREWERY-001', 20001, 30001, 40002,
     'Mixing', 'Mix active ingredients with excipients',
     0.25, 2.0, 0.5,
     NOW() + INTERVAL '7 days 2 hours', NOW() + INTERVAL '7 days 5 hours',
     50000, 0, false, 'BRW-OP-001-02'),
     
    (NOW(), 'BREWERY-001', 20001, 30001, 40003,
     'Granulation', 'Wet granulation process',
     0.5, 3.0, 1.0,
     NOW() + INTERVAL '7 days 5 hours', NOW() + INTERVAL '7 days 10 hours',
     50000, 0, false, 'BRW-OP-001-03'),
     
    (NOW(), 'BREWERY-001', 20001, 30001, 40004,
     'Compression', 'Tablet compression',
     1.0, 4.0, 0.5,
     NOW() + INTERVAL '7 days 10 hours', NOW() + INTERVAL '7 days 16 hours',
     50000, 0, false, 'BRW-OP-001-04'),
     
    (NOW(), 'BREWERY-001', 20001, 30001, 40005,
     'Coating', 'Film coating application',
     0.5, 3.0, 1.0,
     NOW() + INTERVAL '7 days 16 hours', NOW() + INTERVAL '7 days 21 hours',
     50000, 0, false, 'BRW-OP-001-05'),
     
    (NOW(), 'BREWERY-001', 20001, 30001, 40006,
     'Packaging', 'Blister packaging and boxing',
     0.5, 2.0, 0.5,
     NOW() + INTERVAL '7 days 21 hours', NOW() + INTERVAL '8 days',
     50000, 0, false, 'BRW-OP-001-06'),

    -- Acetaminophen operations (Job 20002)
    (NOW(), 'BREWERY-001', 20002, 30002, 40007,
     'Material Preparation', 'Prepare and verify raw materials',
     0.75, 1.5, 0.25,
     NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 3 hours',
     75000, 0, false, 'BRW-OP-002-01'),
     
    (NOW(), 'BREWERY-001', 20002, 30002, 40008,
     'Blending', 'Blend active and inactive ingredients',
     0.5, 2.5, 0.5,
     NOW() + INTERVAL '10 days 3 hours', NOW() + INTERVAL '10 days 7 hours',
     75000, 0, false, 'BRW-OP-002-02'),
     
    (NOW(), 'BREWERY-001', 20002, 30002, 40009,
     'Tablet Formation', 'Direct compression tableting',
     1.0, 5.0, 0.5,
     NOW() + INTERVAL '10 days 7 hours', NOW() + INTERVAL '10 days 14 hours',
     75000, 0, false, 'BRW-OP-002-03'),
     
    (NOW(), 'BREWERY-001', 20002, 30002, 40010,
     'Quality Testing', 'In-process quality control',
     0.25, 1.0, 0.25,
     NOW() + INTERVAL '10 days 14 hours', NOW() + INTERVAL '10 days 16 hours',
     75000, 0, false, 'BRW-OP-002-04'),
     
    (NOW(), 'BREWERY-001', 20002, 30002, 40011,
     'Primary Packaging', 'Bottle filling and capping',
     0.5, 3.0, 0.5,
     NOW() + INTERVAL '10 days 16 hours', NOW() + INTERVAL '10 days 20 hours',
     75000, 0, false, 'BRW-OP-002-05'),

    -- Vitamin C operations (Job 20003)
    (NOW(), 'BREWERY-001', 20003, 30003, 40012,
     'Raw Material QC', 'Quality check of vitamin C powder',
     0.5, 0.5, 0.25,
     NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 2 hours',
     30000, 0, false, 'BRW-OP-003-01'),
     
    (NOW(), 'BREWERY-001', 20003, 30003, 40013,
     'Mixing & Blending', 'Mix vitamin C with excipients',
     0.5, 2.0, 0.5,
     NOW() + INTERVAL '14 days 2 hours', NOW() + INTERVAL '14 days 5 hours',
     30000, 0, false, 'BRW-OP-003-02'),
     
    (NOW(), 'BREWERY-001', 20003, 30003, 40014,
     'Compression', 'High-dose tablet compression',
     1.0, 3.0, 0.5,
     NOW() + INTERVAL '14 days 5 hours', NOW() + INTERVAL '14 days 10 hours',
     30000, 0, false, 'BRW-OP-003-03'),
     
    (NOW(), 'BREWERY-001', 20003, 30003, 40015,
     'Packaging', 'Packaging in moisture-resistant containers',
     0.5, 2.0, 0.5,
     NOW() + INTERVAL '14 days 10 hours', NOW() + INTERVAL '14 days 13 hours',
     30000, 0, false, 'BRW-OP-003-04'),

    -- Amoxicillin operations (Job 20004) - IN PROGRESS
    (NOW(), 'BREWERY-001', 20004, 30004, 40016,
     'API Verification', 'Verify amoxicillin API quality',
     0.5, 1.0, 0.25,
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '22 hours',
     40000, 100, false, 'BRW-OP-004-01'),
     
    (NOW(), 'BREWERY-001', 20004, 30004, 40017,
     'Powder Blending', 'Blend API with excipients',
     0.5, 2.0, 0.5,
     NOW() - INTERVAL '22 hours', NOW() - INTERVAL '19 hours',
     40000, 100, false, 'BRW-OP-004-02'),
     
    (NOW(), 'BREWERY-001', 20004, 30004, 40018,
     'Encapsulation', 'Fill capsules with powder blend',
     1.0, 4.0, 0.5,
     NOW() - INTERVAL '19 hours', NOW() - INTERVAL '13 hours',
     40000, 65, false, 'BRW-OP-004-03'),
     
    (NOW(), 'BREWERY-001', 20004, 30004, 40019,
     'Polishing', 'Capsule polishing and inspection',
     0.25, 1.0, 0.25,
     NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours',
     40000, 0, false, 'BRW-OP-004-04'),
     
    (NOW(), 'BREWERY-001', 20004, 30004, 40020,
     'Packaging', 'Blister packaging with desiccant',
     0.5, 3.0, 0.5,
     NOW() + INTERVAL '4 hours', NOW() + INTERVAL '8 hours',
     40000, 0, false, 'BRW-OP-004-05');

-- Insert Job Resources
INSERT INTO pt_publish_job_resources (
    publish_date, instance_id,
    job_id, manufacturing_order_id, operation_id, resource_requirement_id,
    description, external_id,
    usage_start, usage_end,
    is_primary, default_resource_id
)
SELECT 
    NOW(), o.instance_id,
    o.job_id, o.manufacturing_order_id, o.operation_id, 
    50000 + ROW_NUMBER() OVER (ORDER BY o.operation_id), -- Generate unique resource_requirement_id
    'Resource for ' || o.name, 
    'BRW-RES-' || o.external_id,
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
WHERE o.instance_id = 'BREWERY-001';

-- Insert Job Activities (selected operations)
INSERT INTO pt_publish_job_activities (
    publish_date, instance_id, 
    job_id, manufacturing_order_id, operation_id, activity_id,
    external_id, production_status,
    required_finish_qty, reported_good_qty,
    percent_complete, scheduled_start_date, scheduled_end_date
)
SELECT
    NOW(), o.instance_id,
    o.job_id, o.manufacturing_order_id, o.operation_id,
    60000 + ROW_NUMBER() OVER (ORDER BY o.operation_id), -- Generate unique activity_id
    'BRW-ACT-' || o.external_id,
    CASE 
        WHEN o.percent_finished = 100 THEN 'COMPLETED'::pt_production_status
        WHEN o.percent_finished > 0 THEN 'IN_PROGRESS'::pt_production_status
        ELSE 'SCHEDULED'::pt_production_status
    END,
    o.required_finish_qty,
    (o.required_finish_qty * o.percent_finished / 100),
    o.percent_finished,
    o.scheduled_start, o.scheduled_end
FROM pt_publish_job_operations o
WHERE o.instance_id = 'BREWERY-001'
  AND o.job_id IN (20001, 20004) -- Only create activities for selected jobs
LIMIT 15;

-- Verify the data was inserted
SELECT '';
SELECT '=== PT Publish Tables Population Summary ===' as summary;
SELECT 'Jobs: ' || COUNT(*) as count FROM pt_publish_jobs WHERE instance_id = 'BREWERY-001';
SELECT 'Manufacturing Orders: ' || COUNT(*) as count FROM pt_publish_manufacturing_orders WHERE instance_id = 'BREWERY-001';
SELECT 'Job Operations: ' || COUNT(*) as count FROM pt_publish_job_operations WHERE instance_id = 'BREWERY-001';
SELECT 'Job Resources: ' || COUNT(*) as count FROM pt_publish_job_resources WHERE instance_id = 'BREWERY-001';
SELECT 'Job Activities: ' || COUNT(*) as count FROM pt_publish_job_activities WHERE instance_id = 'BREWERY-001';

-- Show sample of the data
SELECT '';
SELECT '=== Sample Production Schedule ===' as sample;
SELECT 
    j.name as job_name,
    o.name as operation_name,
    TO_CHAR(o.scheduled_start, 'MM/DD HH24:MI') as start_time,
    o.percent_finished || '%' as progress,
    CASE 
        WHEN o.percent_finished = 100 THEN 'Complete'
        WHEN o.percent_finished > 0 THEN 'In Progress'
        ELSE 'Scheduled'
    END as status
FROM pt_publish_jobs j
JOIN pt_publish_job_operations o ON j.job_id = o.job_id AND j.instance_id = o.instance_id
WHERE j.instance_id = 'BREWERY-001'
ORDER BY o.scheduled_start
LIMIT 10;