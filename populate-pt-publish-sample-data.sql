-- Populate PT Publish Tables with Sample Data
-- This script populates the PT Publish tables with sample brewery manufacturing data

-- Set the publish date for all records
DO $$ 
DECLARE 
    v_publish_date timestamp := CURRENT_TIMESTAMP;
BEGIN

-- Clear existing data (optional - remove if you want to append)
DELETE FROM pt_publish_job_activities;
DELETE FROM pt_publish_job_operations;
DELETE FROM pt_publish_jobs;
DELETE FROM pt_publish_manufacturing_orders;
DELETE FROM pt_publish_resources;

-- Insert PT Publish Resources (Brewery Equipment)
INSERT INTO pt_publish_resources (resource_id, name, type, capacity, unit_of_measure, status, efficiency_rating, location, department, cost_per_hour, publish_date)
VALUES
(1, 'Mash Tun #1', 'equipment', 5000, 'liters', 'available', 95.5, 'Brewhouse Floor 1', 'Brewing', 150.00, v_publish_date),
(2, 'Fermentation Tank A', 'equipment', 10000, 'liters', 'available', 98.0, 'Fermentation Hall A', 'Fermentation', 200.00, v_publish_date),
(3, 'Fermentation Tank B', 'equipment', 10000, 'liters', 'in_use', 97.5, 'Fermentation Hall A', 'Fermentation', 200.00, v_publish_date),
(4, 'Bottling Line 1', 'equipment', 2000, 'bottles/hour', 'available', 92.0, 'Packaging Area', 'Packaging', 300.00, v_publish_date),
(5, 'Keg Filling Station', 'equipment', 50, 'kegs/hour', 'maintenance', 90.0, 'Packaging Area', 'Packaging', 250.00, v_publish_date),
(6, 'Quality Lab Station', 'facility', 10, 'samples/hour', 'available', 99.0, 'QA Laboratory', 'Quality', 100.00, v_publish_date),
(7, 'Cold Storage Room 1', 'facility', 1000, 'pallets', 'available', 100.0, 'Warehouse', 'Storage', 50.00, v_publish_date),
(8, 'Brew Kettle #1', 'equipment', 6000, 'liters', 'available', 94.0, 'Brewhouse Floor 1', 'Brewing', 175.00, v_publish_date),
(9, 'Bright Tank 1', 'equipment', 8000, 'liters', 'available', 96.0, 'Conditioning Hall', 'Conditioning', 150.00, v_publish_date),
(10, 'CIP System', 'equipment', 1, 'system', 'available', 99.5, 'Utility Room', 'Maintenance', 75.00, v_publish_date);

-- Insert PT Publish Manufacturing Orders (Brewery Production Orders)
INSERT INTO pt_publish_manufacturing_orders (manufacturing_order_id, order_number, product_code, product_name, quantity, unit_of_measure, due_date, priority, status, customer_name, notes, entry_date, publish_date)
VALUES
(1, 'MO-2025-001', 'LAGER-500', 'Premium Lager 500ml', 10000, 'bottles', v_publish_date + interval '7 days', 5, 'released', 'Heineken Distribution', 'Regular production run', v_publish_date - interval '2 days', v_publish_date),
(2, 'MO-2025-002', 'IPA-330', 'Craft IPA 330ml', 5000, 'bottles', v_publish_date + interval '10 days', 3, 'planned', 'Regional Distributors', 'Special craft batch', v_publish_date - interval '1 day', v_publish_date),
(3, 'MO-2025-003', 'KEG-50L', 'Draft Beer 50L Keg', 100, 'kegs', v_publish_date + interval '5 days', 8, 'in_progress', 'Local Pubs Network', 'Urgent order for weekend', v_publish_date, v_publish_date),
(4, 'MO-2025-004', 'WHEAT-500', 'Wheat Beer 500ml', 8000, 'bottles', v_publish_date + interval '14 days', 4, 'planned', 'Supermarket Chain', 'Seasonal product', v_publish_date - interval '3 days', v_publish_date),
(5, 'MO-2025-005', 'PILSNER-330', 'Classic Pilsner 330ml', 15000, 'bottles', v_publish_date + interval '9 days', 6, 'released', 'Export Markets', 'International shipment', v_publish_date - interval '4 days', v_publish_date);

-- Insert PT Publish Jobs (Production Jobs linked to Manufacturing Orders)
INSERT INTO pt_publish_jobs (job_id, order_number, name, description, qty, scheduled, priority, status, need_date_time, scheduled_start_date_time, scheduled_end_date_time, manufacturing_order_id, percent_finished, notes, entry_date, publish_date)
VALUES
(1, 'JOB-2025-001', 'Lager Production Batch 1', 'Premium Lager brewing and packaging', 10000, true, 5, 'in_progress', v_publish_date + interval '7 days', v_publish_date + interval '1 day', v_publish_date + interval '6 days', 1, 25, 'Mashing phase complete', v_publish_date - interval '2 days', v_publish_date),
(2, 'JOB-2025-002', 'IPA Craft Batch', 'Craft IPA small batch production', 5000, true, 3, 'scheduled', v_publish_date + interval '10 days', v_publish_date + interval '3 days', v_publish_date + interval '9 days', 2, 0, 'Awaiting hop delivery', v_publish_date - interval '1 day', v_publish_date),
(3, 'JOB-2025-003', 'Keg Filling Order', 'Draft beer keg filling operation', 100, true, 8, 'in_progress', v_publish_date + interval '5 days', v_publish_date, v_publish_date + interval '4 days', 3, 50, 'Fermentation complete, conditioning started', v_publish_date, v_publish_date),
(4, 'JOB-2025-004', 'Wheat Beer Production', 'Wheat beer brewing process', 8000, false, 4, 'pending', v_publish_date + interval '14 days', NULL, NULL, 4, 0, 'Recipe finalization pending', v_publish_date - interval '3 days', v_publish_date),
(5, 'JOB-2025-005', 'Pilsner Export Batch', 'Classic Pilsner for export', 15000, true, 6, 'scheduled', v_publish_date + interval '9 days', v_publish_date + interval '2 days', v_publish_date + interval '8 days', 5, 0, 'Export documentation prepared', v_publish_date - interval '4 days', v_publish_date);

-- Insert PT Publish Job Operations (Brewing Process Steps)
INSERT INTO pt_publish_job_operations (job_operation_id, job_id, operation_number, name, description, resource_id, sequence_number, setup_time, run_time, time_unit, status, scheduled_start, scheduled_end, actual_start, actual_end, notes, publish_date)
VALUES
-- Job 1 Operations (Lager Production)
(1, 1, 'OP-001-01', 'Mashing', 'Grain mashing process', 1, 10, 30, 240, 'minutes', 'completed', v_publish_date + interval '1 day', v_publish_date + interval '1 day 4 hours', v_publish_date + interval '1 day', v_publish_date + interval '1 day 4 hours', 'Temperature maintained at 65°C', v_publish_date),
(2, 1, 'OP-001-02', 'Boiling', 'Wort boiling with hops', 8, 20, 15, 90, 'minutes', 'in_progress', v_publish_date + interval '1 day 5 hours', v_publish_date + interval '1 day 7 hours', v_publish_date + interval '1 day 5 hours', NULL, 'Hop addition on schedule', v_publish_date),
(3, 1, 'OP-001-03', 'Fermentation', 'Primary fermentation', 2, 30, 60, 10080, 'minutes', 'scheduled', v_publish_date + interval '2 days', v_publish_date + interval '9 days', NULL, NULL, '7 days fermentation planned', v_publish_date),
(4, 1, 'OP-001-04', 'Conditioning', 'Beer conditioning', 9, 40, 30, 7200, 'minutes', 'scheduled', v_publish_date + interval '9 days', v_publish_date + interval '14 days', NULL, NULL, 'Temperature controlled conditioning', v_publish_date),
(5, 1, 'OP-001-05', 'Bottling', 'Bottle filling and capping', 4, 50, 45, 300, 'minutes', 'scheduled', v_publish_date + interval '14 days', v_publish_date + interval '14 days 6 hours', NULL, NULL, 'Quality check every 100 bottles', v_publish_date),

-- Job 3 Operations (Keg Filling)
(6, 3, 'OP-003-01', 'Tank Transfer', 'Transfer to bright tank', 9, 10, 20, 60, 'minutes', 'completed', v_publish_date, v_publish_date + interval '1 hour 20 minutes', v_publish_date, v_publish_date + interval '1 hour 20 minutes', 'Transfer complete', v_publish_date),
(7, 3, 'OP-003-02', 'Carbonation', 'CO2 injection', 9, 20, 10, 120, 'minutes', 'in_progress', v_publish_date + interval '2 hours', v_publish_date + interval '4 hours', v_publish_date + interval '2 hours', NULL, 'Target: 2.5 volumes CO2', v_publish_date),
(8, 3, 'OP-003-03', 'Keg Filling', 'Fill and seal kegs', 5, 30, 30, 180, 'minutes', 'scheduled', v_publish_date + interval '1 day', v_publish_date + interval '1 day 3 hours', NULL, NULL, 'Equipment check required', v_publish_date),
(9, 3, 'OP-003-04', 'Quality Testing', 'Sample testing', 6, 40, 15, 30, 'minutes', 'scheduled', v_publish_date + interval '1 day 4 hours', v_publish_date + interval '1 day 5 hours', NULL, NULL, 'Lab analysis required', v_publish_date),
(10, 3, 'OP-003-05', 'Cold Storage', 'Move to cold storage', 7, 50, 10, 20, 'minutes', 'scheduled', v_publish_date + interval '1 day 6 hours', v_publish_date + interval '1 day 7 hours', NULL, NULL, 'Temperature: 2-4°C', v_publish_date);

-- Insert PT Publish Job Activities (Resource Activities)
INSERT INTO pt_publish_job_activities (job_activity_id, job_operation_id, resource_id, activity_type, scheduled_start, scheduled_end, actual_start, actual_end, status, operator_name, notes, publish_date)
VALUES
(1, 1, 1, 'setup', v_publish_date + interval '1 day', v_publish_date + interval '1 day 30 minutes', v_publish_date + interval '1 day', v_publish_date + interval '1 day 30 minutes', 'completed', 'John Smith', 'Equipment cleaned and ready', v_publish_date),
(2, 1, 1, 'production', v_publish_date + interval '1 day 30 minutes', v_publish_date + interval '1 day 4 hours', v_publish_date + interval '1 day 30 minutes', v_publish_date + interval '1 day 4 hours', 'completed', 'John Smith', 'Mashing complete', v_publish_date),
(3, 2, 8, 'setup', v_publish_date + interval '1 day 5 hours', v_publish_date + interval '1 day 5 hours 15 minutes', v_publish_date + interval '1 day 5 hours', NULL, 'in_progress', 'Mike Johnson', 'Preparing brew kettle', v_publish_date),
(4, 2, 8, 'production', v_publish_date + interval '1 day 5 hours 15 minutes', v_publish_date + interval '1 day 7 hours', NULL, NULL, 'scheduled', 'Mike Johnson', 'Boiling phase', v_publish_date),
(5, 6, 9, 'setup', v_publish_date, v_publish_date + interval '20 minutes', v_publish_date, v_publish_date + interval '20 minutes', 'completed', 'Sarah Chen', 'Tank prepared', v_publish_date),
(6, 6, 9, 'production', v_publish_date + interval '20 minutes', v_publish_date + interval '1 hour 20 minutes', v_publish_date + interval '20 minutes', v_publish_date + interval '1 hour 20 minutes', 'completed', 'Sarah Chen', 'Transfer successful', v_publish_date),
(7, 7, 9, 'setup', v_publish_date + interval '2 hours', v_publish_date + interval '2 hours 10 minutes', v_publish_date + interval '2 hours', v_publish_date + interval '2 hours 10 minutes', 'completed', 'Sarah Chen', 'CO2 system ready', v_publish_date),
(8, 7, 9, 'production', v_publish_date + interval '2 hours 10 minutes', v_publish_date + interval '4 hours', v_publish_date + interval '2 hours 10 minutes', NULL, 'in_progress', 'Sarah Chen', 'Carbonation in progress', v_publish_date),
(9, 3, 2, 'maintenance', v_publish_date + interval '8 hours', v_publish_date + interval '10 hours', NULL, NULL, 'scheduled', 'Tech Team', 'Scheduled cleaning', v_publish_date),
(10, 5, 4, 'quality_check', v_publish_date + interval '14 days 3 hours', v_publish_date + interval '14 days 3 hours 30 minutes', NULL, NULL, 'scheduled', 'QA Team', 'Random sampling', v_publish_date);

END $$;

-- Verify the data was inserted
SELECT 'PT Publish Resources' as table_name, COUNT(*) as record_count FROM pt_publish_resources
UNION ALL
SELECT 'PT Publish Manufacturing Orders', COUNT(*) FROM pt_publish_manufacturing_orders
UNION ALL
SELECT 'PT Publish Jobs', COUNT(*) FROM pt_publish_jobs
UNION ALL
SELECT 'PT Publish Job Operations', COUNT(*) FROM pt_publish_job_operations
UNION ALL
SELECT 'PT Publish Job Activities', COUNT(*) FROM pt_publish_job_activities;