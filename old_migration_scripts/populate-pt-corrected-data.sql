-- Populate PT Publish Tables with Sample Data
-- Simplified script without DO blocks for better compatibility

-- First, check what exists
SELECT 'Existing PT Jobs: ' || COUNT(*) FROM pt_publish_jobs;
SELECT 'Existing PT Manufacturing Orders: ' || COUNT(*) FROM pt_publish_manufacturing_orders;

-- Insert Jobs (using explicit IDs)
INSERT INTO pt_publish_jobs (
    id, publish_date, instance_id, job_id, external_id, name, description,
    priority, need_date_time, scheduled_status, classification, type
)
VALUES
    (101, NOW(), 'PT-PROD-001', 2001, 'JOB-2025-001', 'Ibuprofen Production Run', 'Production of 50,000 tablets of Ibuprofen 200mg',
     5, NOW() + INTERVAL '7 days', 'SCHEDULED', 'PRODUCTION', 'STANDARD'),
    (102, NOW(), 'PT-PROD-001', 2002, 'JOB-2025-002', 'Acetaminophen Production Run', 'Production of 75,000 tablets of Acetaminophen 500mg',
     4, NOW() + INTERVAL '10 days', 'SCHEDULED', 'PRODUCTION', 'STANDARD'),
    (103, NOW(), 'PT-PROD-001', 2003, 'JOB-2025-003', 'Vitamin C Production Run', 'Production of 30,000 tablets of Vitamin C 1000mg',
     3, NOW() + INTERVAL '14 days', 'SCHEDULED', 'PRODUCTION', 'STANDARD'),
    (104, NOW(), 'PT-PROD-001', 2004, 'JOB-2025-004', 'Amoxicillin Production Run', 'Production of 40,000 capsules of Amoxicillin 250mg',
     5, NOW() + INTERVAL '5 days', 'IN_PROGRESS', 'PRODUCTION', 'RUSH'),
    (105, NOW(), 'PT-PROD-001', 2005, 'JOB-2025-005', 'Aspirin Production Run', 'Production of 100,000 tablets of Aspirin 100mg',
     2, NOW() + INTERVAL '21 days', 'PLANNED', 'PRODUCTION', 'STANDARD')
ON CONFLICT (id) DO NOTHING;

-- Insert Manufacturing Orders (using explicit IDs)
INSERT INTO pt_publish_manufacturing_orders (
    id, publish_date, instance_id, manufacturing_order_id, external_id, name, description
)
VALUES
    (101, NOW(), 'PT-PROD-001', 1001, 'MO-2025-001', 'Ibuprofen 200mg Batch A1', 'Manufacturing order for ibuprofen tablets'),
    (102, NOW(), 'PT-PROD-001', 1002, 'MO-2025-002', 'Acetaminophen 500mg Batch B2', 'Manufacturing order for acetaminophen tablets'),
    (103, NOW(), 'PT-PROD-001', 1003, 'MO-2025-003', 'Vitamin C 1000mg Batch C3', 'Manufacturing order for vitamin C tablets'),
    (104, NOW(), 'PT-PROD-001', 1004, 'MO-2025-004', 'Amoxicillin 250mg Batch D4', 'Manufacturing order for amoxicillin capsules'),
    (105, NOW(), 'PT-PROD-001', 1005, 'MO-2025-005', 'Aspirin 100mg Batch E5', 'Manufacturing order for aspirin tablets')
ON CONFLICT (id) DO NOTHING;

-- Insert Job Operations for Job 1 (Ibuprofen)
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id, job_operation_id, external_id, 
    job_id, manufacturing_order_id, operation_id,
    name, description, 
    setup_hours, cycle_hrs, post_processing_hours,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, on_hold
)
VALUES
    (NOW(), 'PT-PROD-001', 10001, 'OP-JOB1-001', 
     101, 101, 1,
     'Weighing & Dispensing', 'Weigh and dispense raw materials',
     0.5, 1.0, 0.25,
     NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours',
     50000, 0, false),
    
    (NOW(), 'PT-PROD-001', 10002, 'OP-JOB1-002',
     101, 101, 2,
     'Mixing', 'Mix active ingredients with excipients',
     0.25, 2.0, 0.5,
     NOW() + INTERVAL '7 days 2 hours', NOW() + INTERVAL '7 days 5 hours',
     50000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10003, 'OP-JOB1-003',
     101, 101, 3,
     'Granulation', 'Wet granulation process',
     0.5, 3.0, 1.0,
     NOW() + INTERVAL '7 days 5 hours', NOW() + INTERVAL '7 days 10 hours',
     50000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10004, 'OP-JOB1-004',
     101, 101, 4,
     'Compression', 'Tablet compression',
     1.0, 4.0, 0.5,
     NOW() + INTERVAL '7 days 10 hours', NOW() + INTERVAL '7 days 16 hours',
     50000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10005, 'OP-JOB1-005',
     101, 101, 5,
     'Coating', 'Film coating application',
     0.5, 3.0, 1.0,
     NOW() + INTERVAL '7 days 16 hours', NOW() + INTERVAL '7 days 21 hours',
     50000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10006, 'OP-JOB1-006',
     101, 101, 6,
     'Packaging', 'Blister packaging and boxing',
     0.5, 2.0, 0.5,
     NOW() + INTERVAL '7 days 21 hours', NOW() + INTERVAL '8 days',
     50000, 0, false);

-- Insert Job Operations for Job 2 (Acetaminophen)
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id, job_operation_id, external_id,
    job_id, manufacturing_order_id, operation_id,
    name, description,
    setup_hours, cycle_hrs, post_processing_hours,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, on_hold
)
VALUES
    (NOW(), 'PT-PROD-001', 10007, 'OP-JOB2-001',
     102, 102, 1,
     'Material Preparation', 'Prepare and verify raw materials',
     0.75, 1.5, 0.25,
     NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 3 hours',
     75000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10008, 'OP-JOB2-002',
     102, 102, 2,
     'Blending', 'Blend active and inactive ingredients',
     0.5, 2.5, 0.5,
     NOW() + INTERVAL '10 days 3 hours', NOW() + INTERVAL '10 days 7 hours',
     75000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10009, 'OP-JOB2-003',
     102, 102, 3,
     'Tablet Formation', 'Direct compression tableting',
     1.0, 5.0, 0.5,
     NOW() + INTERVAL '10 days 7 hours', NOW() + INTERVAL '10 days 14 hours',
     75000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10010, 'OP-JOB2-004',
     102, 102, 4,
     'Quality Testing', 'In-process quality control',
     0.25, 1.0, 0.25,
     NOW() + INTERVAL '10 days 14 hours', NOW() + INTERVAL '10 days 16 hours',
     75000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10011, 'OP-JOB2-005',
     102, 102, 5,
     'Primary Packaging', 'Bottle filling and capping',
     0.5, 3.0, 0.5,
     NOW() + INTERVAL '10 days 16 hours', NOW() + INTERVAL '10 days 20 hours',
     75000, 0, false);

-- Insert Job Operations for Job 3 (Vitamin C)
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id, job_operation_id, external_id,
    job_id, manufacturing_order_id, operation_id,
    name, description,
    setup_hours, cycle_hrs, post_processing_hours,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, on_hold
)
VALUES
    (NOW(), 'PT-PROD-001', 10012, 'OP-JOB3-001',
     103, 103, 1,
     'Raw Material QC', 'Quality check of vitamin C powder',
     0.5, 0.5, 0.25,
     NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 2 hours',
     30000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10013, 'OP-JOB3-002',
     103, 103, 2,
     'Mixing & Blending', 'Mix vitamin C with excipients',
     0.5, 2.0, 0.5,
     NOW() + INTERVAL '14 days 2 hours', NOW() + INTERVAL '14 days 5 hours',
     30000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10014, 'OP-JOB3-003',
     103, 103, 3,
     'Compression', 'High-dose tablet compression',
     1.0, 3.0, 0.5,
     NOW() + INTERVAL '14 days 5 hours', NOW() + INTERVAL '14 days 10 hours',
     30000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10015, 'OP-JOB3-004',
     103, 103, 4,
     'Packaging', 'Packaging in moisture-resistant containers',
     0.5, 2.0, 0.5,
     NOW() + INTERVAL '14 days 10 hours', NOW() + INTERVAL '14 days 13 hours',
     30000, 0, false);

-- Insert Job Operations for Job 4 (Amoxicillin) - IN PROGRESS
INSERT INTO pt_publish_job_operations (
    publish_date, instance_id, job_operation_id, external_id,
    job_id, manufacturing_order_id, operation_id,
    name, description,
    setup_hours, cycle_hrs, post_processing_hours,
    scheduled_start, scheduled_end,
    required_finish_qty, percent_finished, on_hold
)
VALUES
    (NOW(), 'PT-PROD-001', 10016, 'OP-JOB4-001',
     104, 104, 1,
     'API Verification', 'Verify amoxicillin API quality',
     0.5, 1.0, 0.25,
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '22 hours',
     40000, 100, false),
     
    (NOW(), 'PT-PROD-001', 10017, 'OP-JOB4-002',
     104, 104, 2,
     'Powder Blending', 'Blend API with excipients',
     0.5, 2.0, 0.5,
     NOW() - INTERVAL '22 hours', NOW() - INTERVAL '19 hours',
     40000, 100, false),
     
    (NOW(), 'PT-PROD-001', 10018, 'OP-JOB4-003',
     104, 104, 3,
     'Encapsulation', 'Fill capsules with powder blend',
     1.0, 4.0, 0.5,
     NOW() - INTERVAL '19 hours', NOW() - INTERVAL '13 hours',
     40000, 65, false),
     
    (NOW(), 'PT-PROD-001', 10019, 'OP-JOB4-004',
     104, 104, 4,
     'Polishing', 'Capsule polishing and inspection',
     0.25, 1.0, 0.25,
     NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours',
     40000, 0, false),
     
    (NOW(), 'PT-PROD-001', 10020, 'OP-JOB4-005',
     104, 104, 5,
     'Packaging', 'Blister packaging with desiccant',
     0.5, 3.0, 0.5,
     NOW() + INTERVAL '4 hours', NOW() + INTERVAL '8 hours',
     40000, 0, false);

-- Insert Job Resources (get Operation IDs first)
INSERT INTO pt_publish_job_resources (
    publish_date, instance_id, job_resource_id, external_id,
    operation_id, job_id, default_resource_id,
    is_primary, usage_start, usage_end
)
SELECT 
    NOW(), 'PT-PROD-001', 30001, 'JR-OP' || o.id,
    o.id, o.job_id, 
    CASE 
        WHEN o.name LIKE '%Mixing%' OR o.name LIKE '%Blending%' THEN 1
        WHEN o.name LIKE '%Granulation%' THEN 8
        WHEN o.name LIKE '%Compression%' OR o.name LIKE '%Tablet%' THEN 3
        WHEN o.name LIKE '%Coating%' THEN 5
        WHEN o.name LIKE '%Packaging%' THEN 6
        WHEN o.name LIKE '%Encapsulation%' THEN 9
        ELSE 1
    END,
    true, o.scheduled_start, o.scheduled_end
FROM pt_publish_job_operations o
WHERE o.job_id IN (101, 102, 103, 104, 105)
LIMIT 10;

-- Verify the data was inserted
SELECT 'PT Publish Tables Population Summary:' as status;
SELECT 'Jobs: ' || COUNT(*) as count FROM pt_publish_jobs;
SELECT 'Manufacturing Orders: ' || COUNT(*) as count FROM pt_publish_manufacturing_orders;
SELECT 'Job Operations: ' || COUNT(*) as count FROM pt_publish_job_operations;
SELECT 'Job Resources: ' || COUNT(*) as count FROM pt_publish_job_resources;