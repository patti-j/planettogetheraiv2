-- Populate PT Publish Tables with Brewery Data (Corrected Version)
-- Uses only columns that actually exist in the PT Publish tables

-- Clear existing data (optional)
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
-- SECTION 1: ORGANIZATION
-- ========================================

-- Plants (Brewery Locations)
INSERT INTO pt_publish_plants (publish_date, instance_id, plant_id, name, description, notes, 
    bottleneck_threshold, heavy_load_threshold, department_count, stable_days, daily_operating_expense, invested_capital)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 'Main Brewery Denver', 'Primary production facility', 'Flagship location with full brewing and packaging capabilities', 
    80, 90, 5, 30, 25000, 5000000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2, 'East Coast Brewery', 'Secondary production facility', 'Focus on East Coast distribution', 
    75, 85, 3, 30, 18000, 3500000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 3, 'Craft Brewery Portland', 'Specialty craft production', 'Small batch and seasonal beers', 
    70, 80, 2, 30, 12000, 2000000);

-- Departments
INSERT INTO pt_publish_departments (publish_date, instance_id, plant_id, department_id, name, description, notes)
VALUES 
-- Main Brewery Departments
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 101, 'Brewhouse', 'Brewing operations department', 'Handles mashing, boiling, and wort production'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 'Fermentation Cellar', 'Fermentation and conditioning', 'Temperature-controlled fermentation area'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 103, 'Packaging Hall', 'Bottling, canning, and kegging', 'Automated packaging lines'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 104, 'Quality Control Lab', 'Quality testing and analysis', 'Full testing capabilities'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 105, 'Warehouse', 'Storage and distribution', 'Climate-controlled storage'),
-- East Coast Departments
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2, 201, 'Brewhouse East', 'East coast brewing operations', 'Smaller capacity brewhouse'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2, 202, 'Fermentation East', 'East coast fermentation', 'Limited fermentation vessels'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2, 203, 'Packaging East', 'East coast packaging', 'Canning focus');

-- Warehouses
INSERT INTO pt_publish_warehouses (publish_date, instance_id, warehouse_id, name, description, notes)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 301, 'Main Cold Storage', 'Finished goods warehouse', 'Temperature controlled at 38F'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 302, 'Raw Materials Warehouse', 'Ingredient storage', 'Dry storage for grains and hops'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 303, 'East Coast Storage', 'East facility storage', 'Combined raw and finished goods'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 304, 'Portland Storage', 'Craft brewery storage', 'Small batch storage');

-- Resources (Brewery Equipment)
INSERT INTO pt_publish_resources (publish_date, instance_id, plant_id, department_id, resource_id, 
    name, description, notes, plant_name, department_name, active, bottleneck, constrained_resource, 
    clean_between_batches, tank, pacemaker, dbr_constraint)
VALUES 
-- Brewhouse Equipment
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 101, 1001, 
    'Mash Tun MT-01', '200 BBL Mash Tun', 'Primary mashing vessel', 'Main Brewery Denver', 'Brewhouse', 
    TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 101, 1002, 
    'Brew Kettle BK-01', '200 BBL Brew Kettle', 'Primary boiling vessel', 'Main Brewery Denver', 'Brewhouse', 
    TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 101, 1003, 
    'Whirlpool WP-01', '200 BBL Whirlpool', 'Hop separation vessel', 'Main Brewery Denver', 'Brewhouse', 
    TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE),
-- Fermentation Vessels
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1004, 
    'Fermenter FV-101', '400 BBL Fermenter', 'Unitank fermenter #1', 'Main Brewery Denver', 'Fermentation Cellar', 
    TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1005, 
    'Fermenter FV-102', '400 BBL Fermenter', 'Unitank fermenter #2', 'Main Brewery Denver', 'Fermentation Cellar', 
    TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1006, 
    'Fermenter FV-103', '400 BBL Fermenter', 'Unitank fermenter #3', 'Main Brewery Denver', 'Fermentation Cellar', 
    TRUE, FALSE, TRUE, TRUE, TRUE, FALSE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1007, 
    'Bright Tank BT-101', '300 BBL Bright Tank', 'Conditioning tank #1', 'Main Brewery Denver', 'Fermentation Cellar', 
    TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 102, 1008, 
    'Bright Tank BT-102', '300 BBL Bright Tank', 'Conditioning tank #2', 'Main Brewery Denver', 'Fermentation Cellar', 
    TRUE, FALSE, FALSE, TRUE, TRUE, FALSE, FALSE),
-- Packaging Lines
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 103, 1009, 
    'Bottling Line BL-01', 'High-speed bottling line', '600 bottles/minute capacity', 'Main Brewery Denver', 'Packaging Hall', 
    TRUE, TRUE, TRUE, FALSE, FALSE, TRUE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 103, 1010, 
    'Canning Line CL-01', 'High-speed canning line', '800 cans/minute capacity', 'Main Brewery Denver', 'Packaging Hall', 
    TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 103, 1011, 
    'Keg Line KL-01', 'Semi-automatic keg line', '60 kegs/hour capacity', 'Main Brewery Denver', 'Packaging Hall', 
    TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE);

-- Capabilities
INSERT INTO pt_publish_capabilities (publish_date, instance_id, capability_id, name, description, notes)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2001, 'Mashing', 'Grain mashing capability', 'Converting starches to sugars'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2002, 'Boiling', 'Wort boiling capability', 'Hop addition and sterilization'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2003, 'Whirlpooling', 'Trub separation', 'Removing hop particles and proteins'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2004, 'Fermentation', 'Primary fermentation', 'Converting sugars to alcohol'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2005, 'Conditioning', 'Beer conditioning', 'Maturation and clarification'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2006, 'Bottling', 'Bottle filling and capping', 'Glass bottle packaging'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2007, 'Canning', 'Can filling and seaming', 'Aluminum can packaging'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2008, 'Kegging', 'Keg filling', 'Draft beer packaging'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2009, 'CIP Cleaning', 'Clean-in-place', 'Automated cleaning process'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 2010, 'Quality Testing', 'Lab analysis', 'Quality control testing');

-- Resource Capabilities Mapping
INSERT INTO pt_publish_resource_capabilities (publish_date, instance_id, resource_id, capability_id)
VALUES 
-- Mash Tun capabilities
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1001, 2001),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1001, 2009),
-- Brew Kettle capabilities
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1002, 2002),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1002, 2009),
-- Whirlpool capabilities
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1003, 2003),
-- Fermenters capabilities
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1004, 2004),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1005, 2004),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1006, 2004),
-- Bright Tanks capabilities
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1007, 2005),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1008, 2005),
-- Packaging Lines capabilities
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1009, 2006),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1010, 2007),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 1011, 2008);

-- Items (Beer Products & Raw Materials)
INSERT INTO pt_publish_items (publish_date, instance_id, item_id, name, description, notes, 
    source, item_type, default_lead_time_days, batch_size)
VALUES 
-- Finished Beer Products
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5001, 'Premium Lager 12oz', 'Flagship premium lager in 12oz bottles', 'ABV 5.2%, IBU 18', 'Make', 'Finished Good', 21, 200),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5002, 'IPA Classic 12oz', 'Bold hoppy IPA in 12oz cans', 'ABV 6.5%, IBU 65', 'Make', 'Finished Good', 18, 150),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5003, 'Wheat Beer 12oz', 'Belgian-style wheat beer', 'ABV 4.8%, IBU 12', 'Make', 'Finished Good', 14, 100),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5004, 'Porter Dark 12oz', 'Rich dark porter', 'ABV 5.8%, IBU 25', 'Make', 'Finished Good', 21, 80),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5005, 'Seasonal Ale 12oz', 'Limited edition seasonal', 'Rotating seasonal recipe', 'Make', 'Finished Good', 14, 120),
-- Raw Materials
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5101, 'Pale Malt 2-Row', 'Base malted barley', 'Primary fermentable', 'Buy', 'Raw Material', 7, NULL),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5102, 'Munich Malt', 'Specialty malt', 'Adds body and flavor', 'Buy', 'Raw Material', 7, NULL),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5103, 'Cascade Hops', 'American hop variety', 'Citrus and floral notes', 'Buy', 'Raw Material', 14, NULL),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5104, 'Centennial Hops', 'American hop variety', 'Strong bittering hop', 'Buy', 'Raw Material', 14, NULL),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5105, 'US-05 Yeast', 'American ale yeast', 'Clean fermenting strain', 'Buy', 'Raw Material', 3, NULL),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5106, 'Lager Yeast W-34/70', 'German lager yeast', 'Clean lager strain', 'Buy', 'Raw Material', 3, NULL),
-- Packaging Materials
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5201, '12oz Brown Bottles', 'Glass bottles', 'Standard longneck', 'Buy', 'Packaging', 5, NULL),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5202, '12oz Aluminum Cans', 'Standard cans', 'Printed aluminum', 'Buy', 'Packaging', 5, NULL),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5203, 'Half Barrel Kegs', 'Stainless kegs', '15.5 gallon capacity', 'Buy', 'Packaging', 10, NULL);

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
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 8104, 5104, 302, 14, 400, 200, 1200, 10);

-- Customers
INSERT INTO pt_publish_customers (publish_date, instance_id, customer_id, name, description, notes, priority)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7001, 'BevCo Distributors', 'Major regional distributor', 'Handles 40% of volume', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7002, 'Regional Liquor Stores', 'Retail chain partnership', '120 store locations', 2),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7003, 'Sports Arena Concessions', 'Stadium and arena sales', 'High-volume seasonal', 1),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7004, 'Restaurant Group LLC', 'Restaurant chain', '45 locations', 3),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 7005, 'Craft Beer Emporium', 'Specialty retailer', 'Premium placement', 2);

-- ========================================
-- SECTION 2: JOBS & MANUFACTURING
-- ========================================

-- Jobs (Production Batches)
INSERT INTO pt_publish_jobs (publish_date, instance_id, job_id, type, priority, 
    entry_date, need_date_time, scheduled_start_date_time, scheduled_end_date_time,
    hot, cancelled, importance)
VALUES 
-- Current Production
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 'Production', 1, 
    '2025-01-15', '2025-02-15 12:00:00', '2025-01-20 06:00:00', '2025-02-10 18:00:00',
    FALSE, FALSE, 5),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 'Production', 2, 
    '2025-01-15', '2025-02-20 12:00:00', '2025-01-22 06:00:00', '2025-02-15 18:00:00',
    FALSE, FALSE, 4),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10003, 'Production', 1, 
    '2025-01-10', '2025-02-05 12:00:00', '2025-01-15 06:00:00', '2025-02-01 18:00:00',
    TRUE, FALSE, 5),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10004, 'Production', 3, 
    '2025-01-15', '2025-02-25 12:00:00', '2025-01-25 06:00:00', '2025-02-20 18:00:00',
    FALSE, FALSE, 3),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10005, 'Production', 2, 
    '2025-01-15', '2025-03-01 12:00:00', '2025-01-28 06:00:00', '2025-02-25 18:00:00',
    FALSE, FALSE, 4);

-- Manufacturing Orders
INSERT INTO pt_publish_manufacturing_orders (publish_date, instance_id, job_id, manufacturing_order_id)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10003, 20003),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10004, 20004),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10005, 20005);

-- Job Operations
INSERT INTO pt_publish_job_operations (publish_date, instance_id, job_id, manufacturing_order_id, operation_id, 
    setup_hours, run_hours)
VALUES 
-- Lager Batch Operations
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30001, 0.5, 1),     -- Milling
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30002, 0.5, 2),     -- Mashing
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30003, 0.25, 1.5),  -- Lautering
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30004, 0.25, 1.5),  -- Boiling
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30005, 0, 0.5),     -- Whirlpool
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30006, 0, 0.5),     -- Cooling
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30007, 1, 336),     -- Fermentation (14 days)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30008, 0.5, 168),   -- Conditioning (7 days)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30009, 0.5, 2),     -- Filtration
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30010, 1, 8),       -- Packaging
-- IPA Batch Operations
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30011, 0.5, 1),     -- Milling
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30012, 0.5, 2),     -- Mashing
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30013, 0.25, 1.5),  -- Lautering
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30014, 0.25, 2),    -- Boiling (longer for hops)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30015, 0, 0.75),    -- Whirlpool
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30016, 0, 0.5),     -- Cooling
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30017, 1, 240),     -- Fermentation (10 days)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30018, 0.5, 72),    -- Dry Hopping (3 days)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30019, 0.5, 120),   -- Conditioning (5 days)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30020, 1, 6);       -- Packaging

-- Job Activities
INSERT INTO pt_publish_job_activities (publish_date, instance_id, job_id, manufacturing_order_id, operation_id, activity_id,
    scheduled_start_date, scheduled_end_date, required_finish_qty, scheduled_setup_hours, scheduled_run_hours, 
    production_status, scheduled)
VALUES 
-- Lager Batch Activities
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30002, 40001, 
    '2025-01-20 07:00:00', '2025-01-20 09:30:00', 200, 0.5, 2, 'Scheduled', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30004, 40002, 
    '2025-01-20 11:00:00', '2025-01-20 13:00:00', 200, 0.25, 1.5, 'Scheduled', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30007, 40003, 
    '2025-01-20 16:00:00', '2025-02-03 16:00:00', 200, 1, 336, 'Scheduled', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 30010, 40004, 
    '2025-02-10 08:00:00', '2025-02-10 17:00:00', 4800, 1, 8, 'Scheduled', TRUE),
-- IPA Batch Activities
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30012, 40005, 
    '2025-01-22 07:00:00', '2025-01-22 09:30:00', 150, 0.5, 2, 'Scheduled', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30014, 40006, 
    '2025-01-22 11:00:00', '2025-01-22 13:30:00', 150, 0.25, 2, 'Scheduled', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30017, 40007, 
    '2025-01-22 16:00:00', '2025-02-01 16:00:00', 150, 1, 240, 'Scheduled', TRUE),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 30020, 40008, 
    '2025-02-15 08:00:00', '2025-02-15 15:00:00', 3600, 1, 6, 'Scheduled', TRUE);

-- Job Materials
INSERT INTO pt_publish_job_materials (publish_date, instance_id, job_id, manufacturing_order_id, item_id, quantity_required)
VALUES 
-- Lager Batch Materials (200 BBL)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 5101, 3500),  -- Pale Malt
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 5102, 500),   -- Munich Malt
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 5103, 40),    -- Cascade Hops
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 5106, 8),     -- Lager Yeast
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 5201, 14400), -- Bottles
-- IPA Batch Materials (150 BBL)
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 5101, 2800),  -- Pale Malt
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 5103, 80),    -- Cascade Hops
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 5104, 60),    -- Centennial Hops
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 5105, 6),     -- US-05 Yeast
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 5202, 10800); -- Cans

-- Job Products
INSERT INTO pt_publish_job_products (publish_date, instance_id, job_id, manufacturing_order_id, item_id)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10001, 20001, 5001),  -- Lager
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10002, 20002, 5002),  -- IPA
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10003, 20003, 5003),  -- Wheat
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10004, 20004, 5004),  -- Porter
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 10005, 20005, 5005);  -- Seasonal

-- ========================================
-- SECTION 3: SALES & DEMAND
-- ========================================

-- Sales Orders
INSERT INTO pt_publish_sales_orders (publish_date, instance_id, sales_order_id, customer_id, order_date, due_date)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80001, 7001, '2025-01-10', '2025-01-25'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80002, 7002, '2025-01-12', '2025-01-30'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80003, 7003, '2025-01-14', '2025-01-20'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80004, 7004, '2025-01-15', '2025-02-05'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80005, 7005, '2025-01-15', '2025-02-10');

-- Sales Order Lines
INSERT INTO pt_publish_sales_order_lines (publish_date, instance_id, sales_order_id, sales_order_line_id, item_id, quantity_ordered, due_date)
VALUES 
-- SO-80001 Lines
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80001, 90001, 5001, 600, '2025-01-25'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80001, 90002, 5002, 400, '2025-01-25'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80001, 90003, 5003, 200, '2025-01-25'),
-- SO-80002 Lines
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80002, 90004, 5001, 300, '2025-01-30'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80002, 90005, 5002, 200, '2025-01-30'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 80002, 90006, 5004, 100, '2025-01-30');

-- Forecasts
INSERT INTO pt_publish_forecasts (publish_date, instance_id, forecast_id, name, period_start, period_end)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 'Q1 2025 Demand Forecast', '2025-01-01', '2025-03-31'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100002, 'February 2025 Forecast', '2025-02-01', '2025-02-28'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100003, 'Spring Season Forecast', '2025-03-01', '2025-05-31');

-- Forecast Shipments
INSERT INTO pt_publish_forecast_shipments (publish_date, instance_id, forecast_id, forecast_shipment_id, ship_date, quantity)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110001, '2025-01-31', 2000),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110002, '2025-01-31', 1500),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110003, '2025-02-28', 2200),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110004, '2025-02-28', 1600),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 100001, 110005, '2025-03-31', 2400);

-- ========================================
-- SECTION 4: ANALYTICS
-- ========================================

-- Metrics
INSERT INTO pt_publish_metrics (publish_date, instance_id, name, category, value, unit, timestamp, resource_id)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 'OEE', 'Performance', 85.5, 'Percent', '2025-01-15 12:00:00', 1009),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 'Throughput', 'Production', 120, 'Cases/Hr', '2025-01-15 12:00:00', 1009),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 'Quality Rate', 'Quality', 98.5, 'Percent', '2025-01-15 12:00:00', NULL),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 'Inventory Turns', 'Inventory', 12, 'Turns/Year', '2025-01-15 12:00:00', NULL);

-- KPIs
INSERT INTO pt_publish_kpis (publish_date, instance_id, name, category, target_value, actual_value, unit, period, status)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 'On-Time Delivery', 'Customer Service', 95, 92.5, 'Percent', 'Monthly', 'Warning'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 'Production Efficiency', 'Operations', 85, 87.3, 'Percent', 'Weekly', 'Good'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 'Inventory Accuracy', 'Inventory', 99, 98.8, 'Percent', 'Monthly', 'Good'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 'Cost Per Case', 'Finance', 35, 33.50, 'Dollars', 'Monthly', 'Good');

-- Schedules
INSERT INTO pt_publish_schedules (publish_date, instance_id, name, version, status, clock, publish_horizon_end, planning_horizon_end)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 'Weekly Production Schedule', 'v1.0', 'Published', 
    '2025-01-15 00:00:00', '2025-02-15 00:00:00', '2025-03-31 23:59:59');

-- Product Rules
INSERT INTO pt_publish_product_rules (publish_date, instance_id, item_id, plant_id, department_id, resource_id, operation_code)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5001, 1, 102, 1004, 'FERM-01'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5002, 1, 102, 1005, 'FERM-02'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 5003, 1, 102, 1006, 'FERM-03');

-- Lots
INSERT INTO pt_publish_lots (publish_date, instance_id, lot_id, lot_number, item_id, quantity, production_date, expiration_date, status)
VALUES 
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 230001, 'LOT-L2501-001', 5001, 1200, '2025-01-10', '2025-07-10', 'Available'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 230002, 'LOT-I2501-001', 5002, 850, '2025-01-08', '2025-07-08', 'Available'),
('2025-01-15', '{550e8400-e29b-41d4-a716-446655440000}', 230003, 'LOT-W2501-001', 5003, 600, '2025-01-05', '2025-07-05', 'Available');

COMMIT;

-- Summary: Populated PT Publish tables with realistic brewery data
-- Using only columns that actually exist in the database schema