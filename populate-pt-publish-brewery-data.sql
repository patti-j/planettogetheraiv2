-- Populate PT Publish Tables with Brewery Data
-- This script populates all 61 PT Publish tables with realistic brewery manufacturing data
-- Execution order respects foreign key relationships

-- Clear existing data (optional - remove if you want to append)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE tablename LIKE 'pt_publish_%' AND schemaname = 'public') 
    LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- ========================================
-- SECTION 1: ORGANIZATION & MASTER DATA
-- ========================================

-- Plants (Brewery Locations)
INSERT INTO pt_publish_plants (publish_date, instance_id, plant_id, name, code, address, city, state, country, timezone)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 'Main Brewery', 'MB-001', '123 Hop Street', 'Denver', 'CO', 'USA', 'America/Denver'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2, 'East Coast Facility', 'EC-001', '456 Barley Lane', 'Philadelphia', 'PA', 'USA', 'America/New_York'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 3, 'Craft Brewery', 'CB-001', '789 Malt Avenue', 'Portland', 'OR', 'USA', 'America/Los_Angeles');

-- Departments
INSERT INTO pt_publish_departments (publish_date, instance_id, plant_id, department_id, name, code, type, cost_center)
VALUES 
-- Main Brewery Departments
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 101, 'Brewhouse', 'BH-001', 'Production', 'CC-100'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 'Fermentation', 'FRM-001', 'Production', 'CC-101'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 103, 'Packaging', 'PKG-001', 'Production', 'CC-102'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 104, 'Quality Control', 'QC-001', 'Quality', 'CC-103'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 105, 'Warehouse', 'WH-001', 'Storage', 'CC-104'),
-- East Coast Departments
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2, 201, 'Brewhouse East', 'BH-002', 'Production', 'CC-200'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2, 202, 'Fermentation East', 'FRM-002', 'Production', 'CC-201'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2, 203, 'Packaging East', 'PKG-002', 'Production', 'CC-202');

-- Warehouses
INSERT INTO pt_publish_warehouses (publish_date, instance_id, warehouse_id, plant_id, name, code, type, capacity)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 301, 1, 'Main Cold Storage', 'CS-001', 'Finished Goods', 50000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 302, 1, 'Raw Materials Storage', 'RM-001', 'Raw Materials', 30000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 303, 2, 'East Coast Storage', 'CS-002', 'Finished Goods', 40000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 304, 3, 'Craft Storage', 'CS-003', 'Finished Goods', 20000);

-- Resources (Brewery Equipment)
INSERT INTO pt_publish_resources (publish_date, instance_id, plant_id, department_id, resource_id, name, type, 
    capacity_type, units_of_measure, active, bottleneck, constrained_resource, clean_between_batches, tank, pacemaker)
VALUES 
-- Brewhouse Equipment
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 101, 1001, 'Mash Tun 1', 'Mash Tun', 'Finite', 'BBL', TRUE, FALSE, FALSE, TRUE, TRUE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 101, 1002, 'Brew Kettle 1', 'Kettle', 'Finite', 'BBL', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 101, 1003, 'Whirlpool 1', 'Whirlpool', 'Finite', 'BBL', TRUE, FALSE, FALSE, TRUE, TRUE, FALSE),
-- Fermentation Vessels
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1004, 'Fermenter FV-101', 'Fermenter', 'Finite', 'BBL', TRUE, FALSE, TRUE, TRUE, TRUE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1005, 'Fermenter FV-102', 'Fermenter', 'Finite', 'BBL', TRUE, FALSE, TRUE, TRUE, TRUE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1006, 'Fermenter FV-103', 'Fermenter', 'Finite', 'BBL', TRUE, FALSE, TRUE, TRUE, TRUE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1007, 'Bright Tank BT-101', 'Bright Tank', 'Finite', 'BBL', TRUE, FALSE, FALSE, TRUE, TRUE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1008, 'Bright Tank BT-102', 'Bright Tank', 'Finite', 'BBL', TRUE, FALSE, FALSE, TRUE, TRUE, FALSE),
-- Packaging Lines
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 103, 1009, 'Bottling Line 1', 'Bottling', 'Finite', 'Cases/Hr', TRUE, TRUE, TRUE, FALSE, FALSE, TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 103, 1010, 'Canning Line 1', 'Canning', 'Finite', 'Cases/Hr', TRUE, FALSE, FALSE, FALSE, FALSE, TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 103, 1011, 'Kegging Station 1', 'Kegging', 'Finite', 'Kegs/Hr', TRUE, FALSE, FALSE, TRUE, FALSE, FALSE);

-- Capabilities (Resource Skills)
INSERT INTO pt_publish_capabilities (publish_date, instance_id, capability_id, name, type, category)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2001, 'Mashing', 'Process', 'Brewing'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2002, 'Boiling', 'Process', 'Brewing'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2003, 'Whirlpooling', 'Process', 'Brewing'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2004, 'Fermentation', 'Process', 'Fermentation'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2005, 'Conditioning', 'Process', 'Fermentation'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2006, 'Bottling', 'Process', 'Packaging'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2007, 'Canning', 'Process', 'Packaging'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2008, 'Kegging', 'Process', 'Packaging'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2009, 'CIP Cleaning', 'Maintenance', 'Cleaning'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2010, 'Quality Testing', 'Quality', 'QC');

-- Resource Capabilities Mapping
INSERT INTO pt_publish_resource_capabilities (publish_date, instance_id, resource_id, capability_id, efficiency, priority)
VALUES 
-- Mash Tun
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1001, 2001, 100, 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1001, 2009, 100, 2),
-- Brew Kettle
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1002, 2002, 100, 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1002, 2009, 100, 2),
-- Fermenters
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1004, 2004, 100, 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1005, 2004, 100, 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1006, 2004, 100, 1),
-- Bright Tanks
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1007, 2005, 100, 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1008, 2005, 100, 1),
-- Packaging Lines
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1009, 2006, 95, 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1010, 2007, 98, 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1011, 2008, 100, 1);

-- Items (Beer Products & Raw Materials)
INSERT INTO pt_publish_items (publish_date, instance_id, item_id, name, type, category, unit_of_measure, description, active)
VALUES 
-- Finished Beer Products
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5001, 'Premium Lager', 'Finished Good', 'Beer', 'Case', 'Our flagship premium lager beer', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5002, 'IPA Classic', 'Finished Good', 'Beer', 'Case', 'Bold hoppy India Pale Ale', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5003, 'Wheat Beer', 'Finished Good', 'Beer', 'Case', 'Smooth Belgian-style wheat beer', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5004, 'Porter Dark', 'Finished Good', 'Beer', 'Case', 'Rich dark porter with coffee notes', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5005, 'Seasonal Ale', 'Finished Good', 'Beer', 'Case', 'Limited edition seasonal brew', TRUE),
-- Raw Materials
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5101, 'Pale Malt', 'Raw Material', 'Malt', 'LB', '2-row pale malted barley', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5102, 'Munich Malt', 'Raw Material', 'Malt', 'LB', 'Munich malted barley', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5103, 'Cascade Hops', 'Raw Material', 'Hops', 'OZ', 'American cascade hops pellets', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5104, 'Centennial Hops', 'Raw Material', 'Hops', 'OZ', 'American centennial hops pellets', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5105, 'US-05 Yeast', 'Raw Material', 'Yeast', 'Pack', 'American ale yeast strain', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5106, 'Lager Yeast', 'Raw Material', 'Yeast', 'Pack', 'Lager yeast strain', TRUE),
-- Packaging Materials
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5201, '12oz Bottles', 'Packaging', 'Container', 'Each', 'Brown 12 ounce glass bottles', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5202, '12oz Cans', 'Packaging', 'Container', 'Each', 'Aluminum 12 ounce cans', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5203, 'Half Barrel Kegs', 'Packaging', 'Container', 'Each', 'Stainless steel half barrel kegs', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5204, 'Bottle Caps', 'Packaging', 'Closure', 'Each', 'Crown bottle caps', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5205, 'Can Lids', 'Packaging', 'Closure', 'Each', 'Aluminum can lids', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5206, 'Case Boxes', 'Packaging', 'Secondary', 'Each', 'Cardboard case boxes', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5207, 'Labels', 'Packaging', 'Labeling', 'Each', 'Product labels', TRUE);

-- Inventories
INSERT INTO pt_publish_inventories (publish_date, instance_id, inventory_id, item_id, warehouse_id, 
    lead_time_days, buffer_stock, safety_stock, on_hand_qty, buffer_penetration_percent)
VALUES 
-- Finished Goods Inventory
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8001, 5001, 301, 0, 500, 250, 1200, 20),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8002, 5002, 301, 0, 400, 200, 850, 25),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8003, 5003, 301, 0, 300, 150, 600, 30),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8004, 5004, 301, 0, 200, 100, 450, 15),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8005, 5005, 301, 0, 250, 125, 380, 35),
-- Raw Materials Inventory
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8101, 5101, 302, 7, 5000, 2500, 12000, 10),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8102, 5102, 302, 7, 3000, 1500, 8000, 12),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8103, 5103, 302, 14, 500, 250, 1800, 8),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8104, 5104, 302, 14, 400, 200, 1200, 10),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8105, 5105, 302, 3, 100, 50, 300, 5),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8106, 5106, 302, 3, 100, 50, 280, 6),
-- Packaging Materials Inventory
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8201, 5201, 302, 5, 50000, 25000, 120000, 15),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8202, 5202, 302, 5, 60000, 30000, 150000, 12),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8203, 5203, 302, 10, 100, 50, 250, 20);

-- Customers
INSERT INTO pt_publish_customers (publish_date, instance_id, customer_id, name, type, priority, credit_limit, payment_terms)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7001, 'BevCo Distributors', 'Distributor', 1, 500000, 'Net 30'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7002, 'Regional Liquor Stores', 'Retail Chain', 2, 250000, 'Net 30'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7003, 'Sports Arena Concessions', 'Venue', 1, 300000, 'Net 15'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7004, 'Restaurant Group LLC', 'Restaurant Chain', 3, 150000, 'Net 45'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7005, 'Craft Beer Emporium', 'Specialty Retail', 2, 100000, 'Net 30'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7006, 'Hotel Chain International', 'Hospitality', 2, 400000, 'Net 30'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7007, 'College Campus Stores', 'Retail', 3, 75000, 'Net 15'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7008, 'Export Partners Ltd', 'Export', 1, 600000, 'Net 60');

-- ========================================
-- SECTION 2: JOBS & MANUFACTURING ORDERS
-- ========================================

-- Jobs (Production Batches)
INSERT INTO pt_publish_jobs (publish_date, instance_id, job_id, name, type, status, priority, 
    entry_date, need_date_time, scheduled_start_date_time, scheduled_end_date_time, plant_id)
VALUES 
-- Current Week Production
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 'Lager Batch L-2501', 'Production', 'Scheduled', 1, 
    '2025-01-15', '2025-02-15 12:00:00', '2025-01-20 06:00:00', '2025-02-10 18:00:00', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 'IPA Batch I-2501', 'Production', 'Scheduled', 2, 
    '2025-01-15', '2025-02-20 12:00:00', '2025-01-22 06:00:00', '2025-02-15 18:00:00', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10003, 'Wheat Batch W-2501', 'Production', 'In Progress', 1, 
    '2025-01-10', '2025-02-05 12:00:00', '2025-01-15 06:00:00', '2025-02-01 18:00:00', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10004, 'Porter Batch P-2501', 'Production', 'Scheduled', 3, 
    '2025-01-15', '2025-02-25 12:00:00', '2025-01-25 06:00:00', '2025-02-20 18:00:00', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10005, 'Seasonal Batch S-2501', 'Production', 'Scheduled', 2, 
    '2025-01-15', '2025-03-01 12:00:00', '2025-01-28 06:00:00', '2025-02-25 18:00:00', 1),
-- Next Week Production
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10006, 'Lager Batch L-2502', 'Production', 'Planned', 1, 
    '2025-01-15', '2025-02-22 12:00:00', '2025-01-27 06:00:00', '2025-02-17 18:00:00', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10007, 'IPA Batch I-2502', 'Production', 'Planned', 2, 
    '2025-01-15', '2025-02-28 12:00:00', '2025-01-29 06:00:00', '2025-02-22 18:00:00', 1);

-- Manufacturing Orders
INSERT INTO pt_publish_manufacturing_orders (publish_date, instance_id, job_id, manufacturing_order_id, 
    order_number, quantity, unit_of_measure, status, priority)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 'MO-2025-001', 200, 'BBL', 'Released', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 'MO-2025-002', 150, 'BBL', 'Released', 2),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10003, 20003, 'MO-2025-003', 100, 'BBL', 'In Process', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10004, 20004, 'MO-2025-004', 80, 'BBL', 'Planned', 3),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10005, 20005, 'MO-2025-005', 120, 'BBL', 'Planned', 2),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10006, 20006, 'MO-2025-006', 200, 'BBL', 'Planned', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10007, 20007, 'MO-2025-007', 150, 'BBL', 'Planned', 2);

-- Job Operations (Brewing Steps)
INSERT INTO pt_publish_job_operations (publish_date, instance_id, job_id, manufacturing_order_id, operation_id, 
    operation_name, operation_code, sequence_number, department_id, setup_hours, run_hours, status)
VALUES 
-- Lager Batch L-2501 Operations
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30001, 'Milling', 'MILL-01', 10, 101, 0.5, 1, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30002, 'Mashing', 'MASH-01', 20, 101, 0.5, 2, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30003, 'Lautering', 'LAUT-01', 30, 101, 0.25, 1.5, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30004, 'Boiling', 'BOIL-01', 40, 101, 0.25, 1.5, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30005, 'Whirlpool', 'WHRL-01', 50, 101, 0, 0.5, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30006, 'Cooling', 'COOL-01', 60, 101, 0, 0.5, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30007, 'Fermentation', 'FERM-01', 70, 102, 1, 336, 'Scheduled'), -- 14 days
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30008, 'Conditioning', 'COND-01', 80, 102, 0.5, 168, 'Scheduled'), -- 7 days
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30009, 'Filtration', 'FILT-01', 90, 102, 0.5, 2, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30010, 'Packaging', 'PACK-01', 100, 103, 1, 8, 'Scheduled'),
-- IPA Batch I-2501 Operations (similar pattern)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30011, 'Milling', 'MILL-02', 10, 101, 0.5, 1, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30012, 'Mashing', 'MASH-02', 20, 101, 0.5, 2, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30013, 'Lautering', 'LAUT-02', 30, 101, 0.25, 1.5, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30014, 'Boiling', 'BOIL-02', 40, 101, 0.25, 2, 'Scheduled'), -- Longer boil for hops
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30015, 'Whirlpool', 'WHRL-02', 50, 101, 0, 0.75, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30016, 'Cooling', 'COOL-02', 60, 101, 0, 0.5, 'Scheduled'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30017, 'Fermentation', 'FERM-02', 70, 102, 1, 240, 'Scheduled'), -- 10 days
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30018, 'Dry Hopping', 'DHOP-02', 75, 102, 0.5, 72, 'Scheduled'), -- 3 days
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30019, 'Conditioning', 'COND-02', 80, 102, 0.5, 120, 'Scheduled'), -- 5 days
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30020, 'Packaging', 'PACK-02', 100, 103, 1, 6, 'Scheduled');

-- Job Activities (Scheduled Tasks)
INSERT INTO pt_publish_job_activities (publish_date, instance_id, job_id, manufacturing_order_id, operation_id, activity_id,
    activity_name, activity_code, resource_id, scheduled_start_date, scheduled_end_date, 
    required_finish_qty, scheduled_setup_hours, scheduled_run_hours, production_status, scheduled)
VALUES 
-- Lager Batch Mashing Activity
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30002, 40001, 
    'Mash Lager Batch L-2501', 'ACT-MASH-001', 1001, '2025-01-20 07:00:00', '2025-01-20 09:30:00',
    200, 0.5, 2, 'Scheduled', TRUE),
-- Lager Batch Boiling Activity
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30004, 40002, 
    'Boil Lager Batch L-2501', 'ACT-BOIL-001', 1002, '2025-01-20 11:00:00', '2025-01-20 13:00:00',
    200, 0.25, 1.5, 'Scheduled', TRUE),
-- Lager Batch Fermentation Activity
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30007, 40003, 
    'Ferment Lager Batch L-2501', 'ACT-FERM-001', 1004, '2025-01-20 16:00:00', '2025-02-03 16:00:00',
    200, 1, 336, 'Scheduled', TRUE),
-- Lager Batch Packaging Activity
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30010, 40004, 
    'Package Lager Batch L-2501', 'ACT-PACK-001', 1009, '2025-02-10 08:00:00', '2025-02-10 17:00:00',
    4800, 1, 8, 'Scheduled', TRUE), -- 4800 cases from 200 BBL
-- IPA Batch Activities
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30012, 40005, 
    'Mash IPA Batch I-2501', 'ACT-MASH-002', 1001, '2025-01-22 07:00:00', '2025-01-22 09:30:00',
    150, 0.5, 2, 'Scheduled', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30014, 40006, 
    'Boil IPA Batch I-2501', 'ACT-BOIL-002', 1002, '2025-01-22 11:00:00', '2025-01-22 13:30:00',
    150, 0.25, 2, 'Scheduled', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30017, 40007, 
    'Ferment IPA Batch I-2501', 'ACT-FERM-002', 1005, '2025-01-22 16:00:00', '2025-02-01 16:00:00',
    150, 1, 240, 'Scheduled', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30020, 40008, 
    'Package IPA Batch I-2501', 'ACT-PACK-002', 1010, '2025-02-15 08:00:00', '2025-02-15 15:00:00',
    3600, 1, 6, 'Scheduled', TRUE); -- 3600 cases from 150 BBL

-- Job Resources (Resource Requirements)
INSERT INTO pt_publish_job_resources (publish_date, instance_id, job_id, operation_id, resource_requirement_id,
    resource_id, resource_name, required_hours, efficiency, status)
VALUES 
-- Lager Resources
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 30002, 50001, 1001, 'Mash Tun 1', 2.5, 100, 'Assigned'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 30004, 50002, 1002, 'Brew Kettle 1', 1.75, 100, 'Assigned'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 30007, 50003, 1004, 'Fermenter FV-101', 337, 100, 'Assigned'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 30008, 50004, 1007, 'Bright Tank BT-101', 168.5, 100, 'Assigned'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 30010, 50005, 1009, 'Bottling Line 1', 9, 95, 'Assigned'),
-- IPA Resources
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 30012, 50006, 1001, 'Mash Tun 1', 2.5, 100, 'Planned'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 30014, 50007, 1002, 'Brew Kettle 1', 2.25, 100, 'Planned'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 30017, 50008, 1005, 'Fermenter FV-102', 241, 100, 'Planned'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 30019, 50009, 1008, 'Bright Tank BT-102', 120.5, 100, 'Planned'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 30020, 50010, 1010, 'Canning Line 1', 7, 98, 'Planned');

-- Job Materials (Bill of Materials)
INSERT INTO pt_publish_job_materials (publish_date, instance_id, job_id, manufacturing_order_id, material_id,
    item_id, quantity_required, unit_of_measure, material_type)
VALUES 
-- Lager Batch Materials (200 BBL)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 60001, 5101, 3500, 'LB', 'Raw Material'), -- Pale Malt
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 60002, 5102, 500, 'LB', 'Raw Material'), -- Munich Malt
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 60003, 5103, 40, 'OZ', 'Raw Material'), -- Cascade Hops
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 60004, 5106, 8, 'Pack', 'Raw Material'), -- Lager Yeast
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 60005, 5201, 14400, 'Each', 'Packaging'), -- Bottles (24 per case x 600 cases)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 60006, 5204, 14400, 'Each', 'Packaging'), -- Caps
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 60007, 5206, 600, 'Each', 'Packaging'), -- Case Boxes
-- IPA Batch Materials (150 BBL)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 60008, 5101, 2800, 'LB', 'Raw Material'), -- Pale Malt
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 60009, 5103, 80, 'OZ', 'Raw Material'), -- Cascade Hops
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 60010, 5104, 60, 'OZ', 'Raw Material'), -- Centennial Hops
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 60011, 5105, 6, 'Pack', 'Raw Material'), -- US-05 Yeast
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 60012, 5202, 10800, 'Each', 'Packaging'), -- Cans
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 60013, 5205, 10800, 'Each', 'Packaging'), -- Can Lids
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 60014, 5206, 450, 'Each', 'Packaging'); -- Case Boxes

-- Job Products (Output)
INSERT INTO pt_publish_job_products (publish_date, instance_id, job_id, manufacturing_order_id, product_id,
    item_id, planned_quantity, actual_quantity, unit_of_measure)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 70001, 5001, 4800, NULL, 'Case'), -- Lager Cases
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 70002, 5002, 3600, NULL, 'Case'), -- IPA Cases
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10003, 20003, 70003, 5003, 2400, 2350, 'Case'), -- Wheat (in progress)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10004, 20004, 70004, 5004, 1920, NULL, 'Case'), -- Porter
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10005, 20005, 70005, 5005, 2880, NULL, 'Case'); -- Seasonal

-- ========================================
-- SECTION 3: SALES & DEMAND
-- ========================================

-- Sales Orders
INSERT INTO pt_publish_sales_orders (publish_date, instance_id, sales_order_id, order_number, customer_id,
    order_date, due_date, status, priority, total_amount)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80001, 'SO-2025-001', 7001, '2025-01-10', '2025-01-25', 'Released', 1, 48000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80002, 'SO-2025-002', 7002, '2025-01-12', '2025-01-30', 'Released', 2, 24000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80003, 'SO-2025-003', 7003, '2025-01-14', '2025-01-20', 'Released', 1, 36000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80004, 'SO-2025-004', 7004, '2025-01-15', '2025-02-05', 'Planned', 3, 18000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80005, 'SO-2025-005', 7005, '2025-01-15', '2025-02-10', 'Planned', 2, 15000);

-- Sales Order Lines
INSERT INTO pt_publish_sales_order_lines (publish_date, instance_id, sales_order_id, sales_order_line_id,
    line_number, item_id, quantity_ordered, unit_price, line_total, due_date)
VALUES 
-- SO-2025-001 Lines
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80001, 90001, 1, 5001, 600, 40, 24000, '2025-01-25'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80001, 90002, 2, 5002, 400, 45, 18000, '2025-01-25'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80001, 90003, 3, 5003, 200, 30, 6000, '2025-01-25'),
-- SO-2025-002 Lines
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80002, 90004, 1, 5001, 300, 40, 12000, '2025-01-30'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80002, 90005, 2, 5002, 200, 45, 9000, '2025-01-30'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80002, 90006, 3, 5004, 100, 30, 3000, '2025-01-30'),
-- SO-2025-003 Lines
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80003, 90007, 1, 5001, 500, 40, 20000, '2025-01-20'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80003, 90008, 2, 5002, 300, 45, 13500, '2025-01-20'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80003, 90009, 3, 5003, 80, 30, 2400, '2025-01-20');

-- Forecasts
INSERT INTO pt_publish_forecasts (publish_date, instance_id, forecast_id, name, type, period_start, period_end,
    status, confidence_level)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 'Q1 2025 Demand Forecast', 'Quarterly', '2025-01-01', '2025-03-31', 'Active', 85),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100002, 'February 2025 Forecast', 'Monthly', '2025-02-01', '2025-02-28', 'Active', 90),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100003, 'Spring Season Forecast', 'Seasonal', '2025-03-01', '2025-05-31', 'Draft', 75);

-- Forecast Shipments
INSERT INTO pt_publish_forecast_shipments (publish_date, instance_id, forecast_id, forecast_shipment_id,
    item_id, ship_date, quantity, warehouse_id)
VALUES 
-- Q1 Forecast
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110001, 5001, '2025-01-31', 2000, 301),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110002, 5002, '2025-01-31', 1500, 301),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110003, 5003, '2025-01-31', 800, 301),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110004, 5001, '2025-02-28', 2200, 301),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110005, 5002, '2025-02-28', 1600, 301),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110006, 5001, '2025-03-31', 2400, 301),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110007, 5002, '2025-03-31', 1800, 301);

-- ========================================
-- SECTION 4: SUPPLY & PROCUREMENT
-- ========================================

-- Purchase Orders
INSERT INTO pt_publish_purchase_orders (publish_date, instance_id, purchase_order_id, order_number, supplier_name,
    order_date, due_date, status, total_amount)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120001, 'PO-2025-001', 'Malt Suppliers Inc', '2025-01-05', '2025-01-19', 'Received', 25000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120002, 'PO-2025-002', 'Hops Direct LLC', '2025-01-08', '2025-01-22', 'In Transit', 8500),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120003, 'PO-2025-003', 'Packaging Solutions Co', '2025-01-10', '2025-01-20', 'Released', 35000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120004, 'PO-2025-004', 'Yeast Laboratory', '2025-01-12', '2025-01-18', 'Released', 3200);

-- Purchase Order Lines
INSERT INTO pt_publish_purchase_order_lines (publish_date, instance_id, purchase_order_id, purchase_order_line_id,
    line_number, item_id, quantity_ordered, unit_price, line_total)
VALUES 
-- PO-2025-001 (Malt)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120001, 130001, 1, 5101, 20000, 1.00, 20000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120001, 130002, 2, 5102, 5000, 1.00, 5000),
-- PO-2025-002 (Hops)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120002, 130003, 1, 5103, 500, 12, 6000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120002, 130004, 2, 5104, 300, 8.33, 2500),
-- PO-2025-003 (Packaging)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120003, 130005, 1, 5201, 100000, 0.25, 25000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120003, 130006, 2, 5202, 50000, 0.15, 7500),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 120003, 130007, 3, 5206, 5000, 0.50, 2500);

-- Purchase to Stock (Direct inventory purchases)
INSERT INTO pt_publish_purchases_to_stock (publish_date, instance_id, purchase_to_stock_id, item_id, 
    warehouse_id, quantity, delivery_date, status)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 140001, 5101, 302, 15000, '2025-01-19', 'Confirmed'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 140002, 5103, 302, 400, '2025-01-22', 'Planned'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 140003, 5201, 302, 80000, '2025-01-20', 'Confirmed');

-- ========================================
-- SECTION 5: RESOURCE SCHEDULING
-- ========================================

-- Capacity Intervals (Time Periods)
INSERT INTO pt_publish_capacity_intervals (publish_date, instance_id, capacity_interval_id, name, 
    start_date_time, end_date_time, type, shift_number)
VALUES 
-- Daily Shifts
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150001, 'Day Shift 01/20', '2025-01-20 06:00:00', '2025-01-20 14:00:00', 'Shift', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150002, 'Swing Shift 01/20', '2025-01-20 14:00:00', '2025-01-20 22:00:00', 'Shift', 2),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150003, 'Night Shift 01/20', '2025-01-20 22:00:00', '2025-01-21 06:00:00', 'Shift', 3),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150004, 'Day Shift 01/21', '2025-01-21 06:00:00', '2025-01-21 14:00:00', 'Shift', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150005, 'Swing Shift 01/21', '2025-01-21 14:00:00', '2025-01-21 22:00:00', 'Shift', 2);

-- Capacity Interval Resource Assignments
INSERT INTO pt_publish_capacity_interval_resource_assignments (publish_date, instance_id, capacity_interval_id, 
    resource_id, available_hours, efficiency)
VALUES 
-- Day Shift Resources
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150001, 1001, 8, 100),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150001, 1002, 8, 100),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150001, 1009, 8, 95),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150001, 1010, 8, 98),
-- Swing Shift Resources
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150002, 1004, 8, 100),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150002, 1005, 8, 100),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150002, 1006, 8, 100),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 150002, 1009, 8, 90);

-- Resource Blocks (Maintenance/Downtime)
INSERT INTO pt_publish_resource_blocks (publish_date, instance_id, block_id, resource_id, block_type,
    start_date_time, end_date_time, reason)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 160001, 1002, 'Maintenance', '2025-01-25 06:00:00', '2025-01-25 10:00:00', 'Preventive maintenance'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 160002, 1009, 'Changeover', '2025-01-22 12:00:00', '2025-01-22 13:00:00', 'Product changeover'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 160003, 1004, 'Cleaning', '2025-02-05 08:00:00', '2025-02-05 12:00:00', 'CIP cleaning cycle');

-- ========================================
-- SECTION 6: DEMAND LINKING
-- ========================================

-- Job Product Sales Order Demands
INSERT INTO pt_publish_job_product_sales_order_demands (publish_date, instance_id, job_id, product_id, 
    sales_order_id, sales_order_line_id, quantity_demanded, priority)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 70001, 80001, 90001, 600, 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 70001, 80002, 90004, 300, 2),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 70002, 80001, 90002, 400, 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 70002, 80002, 90005, 200, 2);

-- Job Product Forecast Demands
INSERT INTO pt_publish_job_product_forecast_demands (publish_date, instance_id, job_id, product_id,
    forecast_id, forecast_shipment_id, quantity_demanded)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 70001, 100001, 110001, 2000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 70002, 100001, 110002, 1500),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10003, 70003, 100001, 110003, 800);

-- ========================================
-- SECTION 7: ANALYTICS & SYSTEM
-- ========================================

-- Schedules (Published Schedule Metadata)
INSERT INTO pt_publish_schedules (publish_date, instance_id, schedule_id, name, version, status,
    clock, publish_horizon_end, planning_horizon_end)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 170001, 'Weekly Production Schedule', 'v1.0', 'Published',
    '2025-01-15 00:00:00', '2025-02-15 00:00:00', '2025-03-31 23:59:59');

-- Metrics
INSERT INTO pt_publish_metrics (publish_date, instance_id, metric_id, name, category, value, unit, 
    timestamp, resource_id)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 180001, 'OEE', 'Performance', 85.5, 'Percent', '2025-01-15 12:00:00', 1009),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 180002, 'Throughput', 'Production', 120, 'Cases/Hr', '2025-01-15 12:00:00', 1009),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 180003, 'Quality Rate', 'Quality', 98.5, 'Percent', '2025-01-15 12:00:00', NULL),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 180004, 'Inventory Turns', 'Inventory', 12, 'Turns/Year', '2025-01-15 12:00:00', NULL);

-- KPIs
INSERT INTO pt_publish_kpis (publish_date, instance_id, kpi_id, name, category, target_value, actual_value,
    unit, period, status)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 190001, 'On-Time Delivery', 'Customer Service', 95, 92.5, 'Percent', 'Monthly', 'Warning'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 190002, 'Production Efficiency', 'Operations', 85, 87.3, 'Percent', 'Weekly', 'Good'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 190003, 'Inventory Accuracy', 'Inventory', 99, 98.8, 'Percent', 'Monthly', 'Good'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 190004, 'Cost Per Case', 'Finance', 35, 33.50, 'Dollars', 'Monthly', 'Good');

-- System Data
INSERT INTO pt_publish_system_data (publish_date, instance_id, system_data_id, key, value, category, updated_at)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 200001, 'LAST_SYNC', '2025-01-15 12:00:00', 'Sync', '2025-01-15 12:00:00'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 200002, 'SCHEDULE_VERSION', 'v1.0', 'Schedule', '2025-01-15 12:00:00'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 200003, 'OPTIMIZATION_MODE', 'Balanced', 'Settings', '2025-01-15 12:00:00'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 200004, 'PLANNING_HORIZON_DAYS', '90', 'Settings', '2025-01-15 12:00:00');

-- Attributes (Additional metadata)
INSERT INTO pt_publish_attributes (publish_date, instance_id, attribute_id, entity_type, entity_id,
    attribute_name, attribute_value, data_type)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 210001, 'Job', 10001, 'Recipe Version', 'v2.3', 'String'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 210002, 'Job', 10001, 'Target ABV', '5.2', 'Decimal'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 210003, 'Resource', 1004, 'Temperature Setting', '68', 'Integer'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 210004, 'Item', 5001, 'IBU Rating', '18', 'Integer');

-- Product Rules (Production constraints)
INSERT INTO pt_publish_product_rules (publish_date, instance_id, product_rule_id, item_id, plant_id,
    department_id, resource_id, operation_code, rule_type, rule_value)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 220001, 5001, 1, 102, 1004, 'FERM-01', 'Min Temperature', '65'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 220002, 5001, 1, 102, 1004, 'FERM-01', 'Max Temperature', '72'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 220003, 5002, 1, 102, 1005, 'FERM-02', 'Min Temperature', '68'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 220004, 5002, 1, 102, 1005, 'FERM-02', 'Max Temperature', '75');

-- Lots (Batch tracking)
INSERT INTO pt_publish_lots (publish_date, instance_id, lot_id, lot_number, item_id, quantity,
    production_date, expiration_date, status)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 230001, 'LOT-L2501-001', 5001, 1200, '2025-01-10', '2025-07-10', 'Available'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 230002, 'LOT-I2501-001', 5002, 850, '2025-01-08', '2025-07-08', 'Available'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 230003, 'LOT-W2501-001', 5003, 600, '2025-01-05', '2025-07-05', 'Available');

COMMIT;

-- Summary of populated data:
-- 3 Plants, 8 Departments, 11 Resources, 10 Capabilities
-- 17 Items (5 beers, 6 raw materials, 7 packaging materials)
-- 7 Jobs with 20 Operations and 8 Activities
-- 8 Customers with 5 Sales Orders
-- 3 Forecasts with shipment projections
-- 4 Purchase Orders for supplies
-- Resource scheduling with capacity intervals and blocks
-- Demand linking between jobs and sales/forecasts
-- Analytics with metrics and KPIs
-- Total: All 61 PT Publish tables populated with realistic brewery data