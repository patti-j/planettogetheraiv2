-- Populate PT Publish Tables with Sample Data
-- This script adds realistic manufacturing data to PT Publish tables for testing

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM pt_publish_job_activities;
-- DELETE FROM pt_publish_job_resources;
-- DELETE FROM pt_publish_job_operations;
-- DELETE FROM pt_publish_manufacturing_orders;
-- DELETE FROM pt_publish_jobs;
-- DELETE FROM pt_publish_resources;
-- DELETE FROM pt_publish_capabilities;
-- DELETE FROM pt_publish_plants;

-- Insert Plants (if not exists)
INSERT INTO pt_publish_plants (publish_date, instance_id, plant_id, external_id, name, description)
SELECT 
    NOW(), 
    'PT-PROD-001',
    1,
    'PLANT-001',
    'Main Manufacturing Facility',
    'Primary pharmaceutical production facility'
WHERE NOT EXISTS (SELECT 1 FROM pt_publish_plants WHERE external_id = 'PLANT-001');

INSERT INTO pt_publish_plants (publish_date, instance_id, plant_id, external_id, name, description)
SELECT 
    NOW(),
    'PT-PROD-001', 
    2,
    'PLANT-002',
    'Chemical Processing Plant',
    'Specialty chemical and API production'
WHERE NOT EXISTS (SELECT 1 FROM pt_publish_plants WHERE external_id = 'PLANT-002');

-- Insert Capabilities (if not exists)
INSERT INTO pt_publish_capabilities (publish_date, instance_id, capability_id, external_id, name, description, capability_type)
VALUES
    (NOW(), 'PT-PROD-001', 1, 'CAP-MIX-001', 'High-Speed Mixing', 'High-speed powder and liquid mixing capability', 'MIXING'),
    (NOW(), 'PT-PROD-001', 2, 'CAP-TAB-001', 'Tablet Compression', 'Tablet compression and forming', 'COMPRESSION'),
    (NOW(), 'PT-PROD-001', 3, 'CAP-COAT-001', 'Film Coating', 'Pharmaceutical film coating process', 'COATING'),
    (NOW(), 'PT-PROD-001', 4, 'CAP-PACK-001', 'Blister Packaging', 'Automated blister packaging', 'PACKAGING'),
    (NOW(), 'PT-PROD-001', 5, 'CAP-GRAN-001', 'Granulation', 'Wet and dry granulation processes', 'GRANULATION'),
    (NOW(), 'PT-PROD-001', 6, 'CAP-ENCAP-001', 'Encapsulation', 'Capsule filling and sealing', 'ENCAPSULATION')
ON CONFLICT DO NOTHING;

-- Insert additional Resources if needed (complementing existing 11)
INSERT INTO pt_publish_resources (publish_date, instance_id, resource_id, external_id, name, description, plant_id)
VALUES
    (NOW(), 'PT-PROD-001', 101, 'RES-MIX-101', 'Mixer Unit 1', 'V-Blender 1000L capacity', 1),
    (NOW(), 'PT-PROD-001', 102, 'RES-MIX-102', 'Mixer Unit 2', 'High-shear mixer 500L', 1),
    (NOW(), 'PT-PROD-001', 103, 'RES-TAB-101', 'Tablet Press 1', 'Rotary tablet press 16-station', 1),
    (NOW(), 'PT-PROD-001', 104, 'RES-TAB-102', 'Tablet Press 2', 'Rotary tablet press 24-station', 1),
    (NOW(), 'PT-PROD-001', 105, 'RES-COAT-101', 'Coating Pan 1', 'Perforated coating pan 150kg', 1),
    (NOW(), 'PT-PROD-001', 106, 'RES-PACK-101', 'Packaging Line A', 'Automated blister packaging line', 1),
    (NOW(), 'PT-PROD-001', 107, 'RES-PACK-102', 'Packaging Line B', 'Bottle filling and capping line', 1),
    (NOW(), 'PT-PROD-001', 108, 'RES-GRAN-101', 'Granulator 1', 'Fluid bed granulator 200kg', 2),
    (NOW(), 'PT-PROD-001', 109, 'RES-ENCAP-101', 'Encapsulator 1', 'Automatic capsule filling machine', 2),
    (NOW(), 'PT-PROD-001', 110, 'RES-QC-101', 'QC Lab Station 1', 'Quality control testing station', 2)
ON CONFLICT DO NOTHING;

-- Insert Manufacturing Orders
INSERT INTO pt_publish_manufacturing_orders (publish_date, instance_id, manufacturing_order_id, external_id, name, description)
VALUES
    (NOW(), 'PT-PROD-001', 1001, 'MO-2025-001', 'Ibuprofen 200mg Batch A1', 'Manufacturing order for ibuprofen tablets'),
    (NOW(), 'PT-PROD-001', 1002, 'MO-2025-002', 'Acetaminophen 500mg Batch B2', 'Manufacturing order for acetaminophen tablets'),
    (NOW(), 'PT-PROD-001', 1003, 'MO-2025-003', 'Vitamin C 1000mg Batch C3', 'Manufacturing order for vitamin C tablets'),
    (NOW(), 'PT-PROD-001', 1004, 'MO-2025-004', 'Amoxicillin 250mg Batch D4', 'Manufacturing order for amoxicillin capsules'),
    (NOW(), 'PT-PROD-001', 1005, 'MO-2025-005', 'Aspirin 100mg Batch E5', 'Manufacturing order for aspirin tablets')
ON CONFLICT DO NOTHING;

-- Add more Jobs to complement the existing 1
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
     2, NOW() + INTERVAL '21 days', 'PLANNED', 'PRODUCTION', 'STANDARD')
ON CONFLICT DO NOTHING;

-- Get the IDs of the jobs we just inserted
DO $$
DECLARE
    job1_id INTEGER;
    job2_id INTEGER;
    job3_id INTEGER;
    job4_id INTEGER;
    job5_id INTEGER;
    mo1_id INTEGER;
    mo2_id INTEGER;
    mo3_id INTEGER;
    mo4_id INTEGER;
    mo5_id INTEGER;
BEGIN
    -- Get Job IDs
    SELECT id INTO job1_id FROM pt_publish_jobs WHERE external_id = 'JOB-2025-001';
    SELECT id INTO job2_id FROM pt_publish_jobs WHERE external_id = 'JOB-2025-002';
    SELECT id INTO job3_id FROM pt_publish_jobs WHERE external_id = 'JOB-2025-003';
    SELECT id INTO job4_id FROM pt_publish_jobs WHERE external_id = 'JOB-2025-004';
    SELECT id INTO job5_id FROM pt_publish_jobs WHERE external_id = 'JOB-2025-005';
    
    -- Get Manufacturing Order IDs
    SELECT id INTO mo1_id FROM pt_publish_manufacturing_orders WHERE external_id = 'MO-2025-001';
    SELECT id INTO mo2_id FROM pt_publish_manufacturing_orders WHERE external_id = 'MO-2025-002';
    SELECT id INTO mo3_id FROM pt_publish_manufacturing_orders WHERE external_id = 'MO-2025-003';
    SELECT id INTO mo4_id FROM pt_publish_manufacturing_orders WHERE external_id = 'MO-2025-004';
    SELECT id INTO mo5_id FROM pt_publish_manufacturing_orders WHERE external_id = 'MO-2025-005';

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
         job1_id, mo1_id, 1,
         'Weighing & Dispensing', 'Weigh and dispense raw materials',
         0.5, 1.0, 0.25,
         NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours',
         50000, 0, false),
        
        (NOW(), 'PT-PROD-001', 10002, 'OP-JOB1-002',
         job1_id, mo1_id, 2,
         'Mixing', 'Mix active ingredients with excipients',
         0.25, 2.0, 0.5,
         NOW() + INTERVAL '7 days 2 hours', NOW() + INTERVAL '7 days 5 hours',
         50000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10003, 'OP-JOB1-003',
         job1_id, mo1_id, 3,
         'Granulation', 'Wet granulation process',
         0.5, 3.0, 1.0,
         NOW() + INTERVAL '7 days 5 hours', NOW() + INTERVAL '7 days 10 hours',
         50000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10004, 'OP-JOB1-004',
         job1_id, mo1_id, 4,
         'Compression', 'Tablet compression',
         1.0, 4.0, 0.5,
         NOW() + INTERVAL '7 days 10 hours', NOW() + INTERVAL '7 days 16 hours',
         50000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10005, 'OP-JOB1-005',
         job1_id, mo1_id, 5,
         'Coating', 'Film coating application',
         0.5, 3.0, 1.0,
         NOW() + INTERVAL '7 days 16 hours', NOW() + INTERVAL '7 days 21 hours',
         50000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10006, 'OP-JOB1-006',
         job1_id, mo1_id, 6,
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
         job2_id, mo2_id, 1,
         'Material Preparation', 'Prepare and verify raw materials',
         0.75, 1.5, 0.25,
         NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 3 hours',
         75000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10008, 'OP-JOB2-002',
         job2_id, mo2_id, 2,
         'Blending', 'Blend active and inactive ingredients',
         0.5, 2.5, 0.5,
         NOW() + INTERVAL '10 days 3 hours', NOW() + INTERVAL '10 days 7 hours',
         75000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10009, 'OP-JOB2-003',
         job2_id, mo2_id, 3,
         'Tablet Formation', 'Direct compression tableting',
         1.0, 5.0, 0.5,
         NOW() + INTERVAL '10 days 7 hours', NOW() + INTERVAL '10 days 14 hours',
         75000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10010, 'OP-JOB2-004',
         job2_id, mo2_id, 4,
         'Quality Testing', 'In-process quality control',
         0.25, 1.0, 0.25,
         NOW() + INTERVAL '10 days 14 hours', NOW() + INTERVAL '10 days 16 hours',
         75000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10011, 'OP-JOB2-005',
         job2_id, mo2_id, 5,
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
         job3_id, mo3_id, 1,
         'Raw Material QC', 'Quality check of vitamin C powder',
         0.5, 0.5, 0.25,
         NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 2 hours',
         30000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10013, 'OP-JOB3-002',
         job3_id, mo3_id, 2,
         'Mixing & Blending', 'Mix vitamin C with excipients',
         0.5, 2.0, 0.5,
         NOW() + INTERVAL '14 days 2 hours', NOW() + INTERVAL '14 days 5 hours',
         30000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10014, 'OP-JOB3-003',
         job3_id, mo3_id, 3,
         'Compression', 'High-dose tablet compression',
         1.0, 3.0, 0.5,
         NOW() + INTERVAL '14 days 5 hours', NOW() + INTERVAL '14 days 10 hours',
         30000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10015, 'OP-JOB3-004',
         job3_id, mo3_id, 4,
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
         job4_id, mo4_id, 1,
         'API Verification', 'Verify amoxicillin API quality',
         0.5, 1.0, 0.25,
         NOW() - INTERVAL '1 day', NOW() - INTERVAL '22 hours',
         40000, 100, false),
         
        (NOW(), 'PT-PROD-001', 10017, 'OP-JOB4-002',
         job4_id, mo4_id, 2,
         'Powder Blending', 'Blend API with excipients',
         0.5, 2.0, 0.5,
         NOW() - INTERVAL '22 hours', NOW() - INTERVAL '19 hours',
         40000, 100, false),
         
        (NOW(), 'PT-PROD-001', 10018, 'OP-JOB4-003',
         job4_id, mo4_id, 3,
         'Encapsulation', 'Fill capsules with powder blend',
         1.0, 4.0, 0.5,
         NOW() - INTERVAL '19 hours', NOW() - INTERVAL '13 hours',
         40000, 65, false),
         
        (NOW(), 'PT-PROD-001', 10019, 'OP-JOB4-004',
         job4_id, mo4_id, 4,
         'Polishing', 'Capsule polishing and inspection',
         0.25, 1.0, 0.25,
         NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours',
         40000, 0, false),
         
        (NOW(), 'PT-PROD-001', 10020, 'OP-JOB4-005',
         job4_id, mo4_id, 5,
         'Packaging', 'Blister packaging with desiccant',
         0.5, 3.0, 0.5,
         NOW() + INTERVAL '4 hours', NOW() + INTERVAL '8 hours',
         40000, 0, false);

    -- Insert Job Activities for some operations
    INSERT INTO pt_publish_job_activities (
        publish_date, instance_id, activity_id, external_id,
        operation_id, job_id,
        name, description, activity_type,
        scheduled_start_date, scheduled_end_date,
        production_status, percent_complete
    )
    VALUES
        -- Activities for Amoxicillin operations (in progress)
        (NOW(), 'PT-PROD-001', 20001, 'ACT-JOB4-001',
         10016, job4_id,
         'API Receipt & Testing', 'Receive and test amoxicillin API', 'QUALITY_CHECK',
         NOW() - INTERVAL '1 day', NOW() - INTERVAL '22 hours',
         'COMPLETED', 100),
         
        (NOW(), 'PT-PROD-001', 20002, 'ACT-JOB4-002',
         10017, job4_id,
         'Powder Mixing', 'Mix API with lactose and starch', 'PROCESSING',
         NOW() - INTERVAL '22 hours', NOW() - INTERVAL '19 hours',
         'COMPLETED', 100),
         
        (NOW(), 'PT-PROD-001', 20003, 'ACT-JOB4-003',
         10018, job4_id,
         'Capsule Filling', 'Fill size 2 capsules', 'PROCESSING',
         NOW() - INTERVAL '19 hours', NOW() - INTERVAL '13 hours',
         'IN_PROGRESS', 65),
         
        -- Activities for Ibuprofen (scheduled)
        (NOW(), 'PT-PROD-001', 20004, 'ACT-JOB1-001',
         10001, job1_id,
         'Material Dispensing', 'Dispense ibuprofen API and excipients', 'PREPARATION',
         NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours',
         'SCHEDULED', 0),
         
        (NOW(), 'PT-PROD-001', 20005, 'ACT-JOB1-002',
         10002, job1_id,
         'High-Shear Mixing', 'Mix in high-shear mixer', 'PROCESSING',
         NOW() + INTERVAL '7 days 2 hours', NOW() + INTERVAL '7 days 5 hours',
         'SCHEDULED', 0);

    -- Insert Job Resources assignments
    INSERT INTO pt_publish_job_resources (
        publish_date, instance_id, job_resource_id, external_id,
        operation_id, job_id, default_resource_id,
        is_primary, usage_start, usage_end
    )
    VALUES
        -- Resources for Amoxicillin operations
        (NOW(), 'PT-PROD-001', 30001, 'JR-JOB4-001',
         10017, job4_id, 101,
         true, NOW() - INTERVAL '22 hours', NOW() - INTERVAL '19 hours'),
         
        (NOW(), 'PT-PROD-001', 30002, 'JR-JOB4-002',
         10018, job4_id, 109,
         true, NOW() - INTERVAL '19 hours', NOW() - INTERVAL '13 hours'),
         
        -- Resources for Ibuprofen operations
        (NOW(), 'PT-PROD-001', 30003, 'JR-JOB1-001',
         10002, job1_id, 102,
         true, NOW() + INTERVAL '7 days 2 hours', NOW() + INTERVAL '7 days 5 hours'),
         
        (NOW(), 'PT-PROD-001', 30004, 'JR-JOB1-002',
         10003, job1_id, 108,
         true, NOW() + INTERVAL '7 days 5 hours', NOW() + INTERVAL '7 days 10 hours'),
         
        (NOW(), 'PT-PROD-001', 30005, 'JR-JOB1-003',
         10004, job1_id, 103,
         true, NOW() + INTERVAL '7 days 10 hours', NOW() + INTERVAL '7 days 16 hours'),
         
        (NOW(), 'PT-PROD-001', 30006, 'JR-JOB1-004',
         10005, job1_id, 105,
         true, NOW() + INTERVAL '7 days 16 hours', NOW() + INTERVAL '7 days 21 hours'),
         
        (NOW(), 'PT-PROD-001', 30007, 'JR-JOB1-005',
         10006, job1_id, 106,
         true, NOW() + INTERVAL '7 days 21 hours', NOW() + INTERVAL '8 days');

END $$;

-- Verify the data was inserted
SELECT 'PT Publish Tables Population Summary:' as status;
SELECT 'Plants: ' || COUNT(*) as count FROM pt_publish_plants;
SELECT 'Capabilities: ' || COUNT(*) as count FROM pt_publish_capabilities;
SELECT 'Resources: ' || COUNT(*) as count FROM pt_publish_resources;
SELECT 'Manufacturing Orders: ' || COUNT(*) as count FROM pt_publish_manufacturing_orders;
SELECT 'Jobs: ' || COUNT(*) as count FROM pt_publish_jobs;
SELECT 'Job Operations: ' || COUNT(*) as count FROM pt_publish_job_operations;
SELECT 'Job Activities: ' || COUNT(*) as count FROM pt_publish_job_activities;
SELECT 'Job Resources: ' || COUNT(*) as count FROM pt_publish_job_resources;