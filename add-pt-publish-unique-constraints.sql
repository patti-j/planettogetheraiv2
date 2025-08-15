-- Add Unique Constraints and Foreign Keys for PT Publish Tables
-- First add unique constraints on business keys, then create foreign key relationships

BEGIN;

-- ========================================
-- STEP 1: ADD UNIQUE CONSTRAINTS ON BUSINESS KEYS
-- ========================================

-- These are the natural keys that should be unique and will be referenced by foreign keys

-- Core organizational tables
ALTER TABLE pt_publish_plants ADD CONSTRAINT uk_plant_id UNIQUE (plant_id);
ALTER TABLE pt_publish_departments ADD CONSTRAINT uk_department_id UNIQUE (department_id);
ALTER TABLE pt_publish_warehouses ADD CONSTRAINT uk_warehouse_id UNIQUE (warehouse_id);
ALTER TABLE pt_publish_resources ADD CONSTRAINT uk_resource_id UNIQUE (resource_id);
ALTER TABLE pt_publish_capabilities ADD CONSTRAINT uk_capability_id UNIQUE (capability_id);
ALTER TABLE pt_publish_customers ADD CONSTRAINT uk_customer_id UNIQUE (customer_id);

-- Item and inventory tables
ALTER TABLE pt_publish_items ADD CONSTRAINT uk_item_id UNIQUE (item_id);
ALTER TABLE pt_publish_inventories ADD CONSTRAINT uk_inventory_id UNIQUE (inventory_id);
ALTER TABLE pt_publish_lots ADD CONSTRAINT uk_lot_id UNIQUE (lot_id);

-- Job and manufacturing tables
ALTER TABLE pt_publish_jobs ADD CONSTRAINT uk_job_id UNIQUE (job_id);
ALTER TABLE pt_publish_manufacturing_orders ADD CONSTRAINT uk_manufacturing_order_id UNIQUE (manufacturing_order_id);
ALTER TABLE pt_publish_job_operations ADD CONSTRAINT uk_operation_id UNIQUE (operation_id);
ALTER TABLE pt_publish_job_activities ADD CONSTRAINT uk_activity_id UNIQUE (activity_id);
ALTER TABLE pt_publish_job_paths ADD CONSTRAINT uk_job_path_id UNIQUE (job_path_id);

-- Sales and demand tables
ALTER TABLE pt_publish_sales_orders ADD CONSTRAINT uk_sales_order_id UNIQUE (sales_order_id);
ALTER TABLE pt_publish_sales_order_lines ADD CONSTRAINT uk_sales_order_line_id UNIQUE (sales_order_line_id);
ALTER TABLE pt_publish_forecasts ADD CONSTRAINT uk_forecast_id UNIQUE (forecast_id);
ALTER TABLE pt_publish_forecast_shipments ADD CONSTRAINT uk_forecast_shipment_id UNIQUE (forecast_shipment_id);

-- Purchase and transfer tables
ALTER TABLE pt_publish_purchase_orders ADD CONSTRAINT uk_purchase_order_id UNIQUE (purchase_order_id);
ALTER TABLE pt_publish_purchase_order_lines ADD CONSTRAINT uk_purchase_order_line_id UNIQUE (purchase_order_line_id);
ALTER TABLE pt_publish_transfer_orders ADD CONSTRAINT uk_transfer_order_id UNIQUE (transfer_order_id);
ALTER TABLE pt_publish_transfer_order_distributions ADD CONSTRAINT uk_transfer_order_distribution_id UNIQUE (transfer_order_distribution_id);

-- Capacity and scheduling tables
ALTER TABLE pt_publish_capacity_intervals ADD CONSTRAINT uk_capacity_interval_id UNIQUE (capacity_interval_id);
ALTER TABLE pt_publish_schedules ADD CONSTRAINT uk_schedule_id UNIQUE (schedule_id);
ALTER TABLE pt_publish_resource_blocks ADD CONSTRAINT uk_resource_block_id UNIQUE (resource_block_id);

-- ========================================
-- STEP 2: CREATE FOREIGN KEY CONSTRAINTS
-- ========================================

-- Now we can safely create foreign key relationships using the unique business keys

-- Departments -> Plants
ALTER TABLE pt_publish_departments 
ADD CONSTRAINT fk_departments_plant 
FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Resources -> Plants & Departments  
ALTER TABLE pt_publish_resources 
ADD CONSTRAINT fk_resources_plant 
FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_resources 
ADD CONSTRAINT fk_resources_department 
FOREIGN KEY (department_id) REFERENCES pt_publish_departments(department_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Resource Capabilities -> Resources & Capabilities
ALTER TABLE pt_publish_resource_capabilities 
ADD CONSTRAINT fk_resource_capabilities_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_resource_capabilities 
ADD CONSTRAINT fk_resource_capabilities_capability 
FOREIGN KEY (capability_id) REFERENCES pt_publish_capabilities(capability_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Inventories -> Items & Warehouses
ALTER TABLE pt_publish_inventories 
ADD CONSTRAINT fk_inventories_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_inventories 
ADD CONSTRAINT fk_inventories_warehouse 
FOREIGN KEY (warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Lots -> Items
ALTER TABLE pt_publish_lots 
ADD CONSTRAINT fk_lots_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Manufacturing Orders -> Jobs
ALTER TABLE pt_publish_manufacturing_orders 
ADD CONSTRAINT fk_manufacturing_orders_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Job Operations -> Jobs & Manufacturing Orders
ALTER TABLE pt_publish_job_operations 
ADD CONSTRAINT fk_job_operations_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_job_operations 
ADD CONSTRAINT fk_job_operations_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Job Activities -> Jobs, Manufacturing Orders & Operations
ALTER TABLE pt_publish_job_activities 
ADD CONSTRAINT fk_job_activities_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_job_activities 
ADD CONSTRAINT fk_job_activities_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_job_activities 
ADD CONSTRAINT fk_job_activities_operation 
FOREIGN KEY (operation_id) REFERENCES pt_publish_job_operations(operation_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Job Resources -> Jobs (resource_id references pt_publish_resources)
ALTER TABLE pt_publish_job_resources 
ADD CONSTRAINT fk_job_resources_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Job Materials -> Jobs & Manufacturing Orders
ALTER TABLE pt_publish_job_materials 
ADD CONSTRAINT fk_job_materials_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_job_materials 
ADD CONSTRAINT fk_job_materials_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Job Products -> Jobs & Manufacturing Orders
ALTER TABLE pt_publish_job_products 
ADD CONSTRAINT fk_job_products_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_job_products 
ADD CONSTRAINT fk_job_products_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Job Operation Attributes -> Jobs, Manufacturing Orders & Operations
ALTER TABLE pt_publish_job_operation_attributes 
ADD CONSTRAINT fk_job_operation_attributes_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_job_operation_attributes 
ADD CONSTRAINT fk_job_operation_attributes_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_job_operation_attributes 
ADD CONSTRAINT fk_job_operation_attributes_operation 
FOREIGN KEY (operation_id) REFERENCES pt_publish_job_operations(operation_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Sales Orders -> Customers
ALTER TABLE pt_publish_sales_orders 
ADD CONSTRAINT fk_sales_orders_customer 
FOREIGN KEY (customer_id) REFERENCES pt_publish_customers(customer_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Sales Order Lines -> Sales Orders & Items
ALTER TABLE pt_publish_sales_order_lines 
ADD CONSTRAINT fk_sales_order_lines_order 
FOREIGN KEY (sales_order_id) REFERENCES pt_publish_sales_orders(sales_order_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_sales_order_lines 
ADD CONSTRAINT fk_sales_order_lines_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Forecast Shipments -> Forecasts
ALTER TABLE pt_publish_forecast_shipments 
ADD CONSTRAINT fk_forecast_shipments_forecast 
FOREIGN KEY (forecast_id) REFERENCES pt_publish_forecasts(forecast_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Purchase Order Lines -> Purchase Orders & Items
ALTER TABLE pt_publish_purchase_order_lines 
ADD CONSTRAINT fk_purchase_order_lines_order 
FOREIGN KEY (purchase_order_id) REFERENCES pt_publish_purchase_orders(purchase_order_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_purchase_order_lines 
ADD CONSTRAINT fk_purchase_order_lines_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Capacity Interval Resource Assignments -> Capacity Intervals & Resources
ALTER TABLE pt_publish_capacity_interval_resource_assignments 
ADD CONSTRAINT fk_capacity_interval_assignments_interval 
FOREIGN KEY (capacity_interval_id) REFERENCES pt_publish_capacity_intervals(capacity_interval_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_capacity_interval_resource_assignments 
ADD CONSTRAINT fk_capacity_interval_assignments_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Resource Blocks -> Resources
ALTER TABLE pt_publish_resource_blocks 
ADD CONSTRAINT fk_resource_blocks_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Product Rules -> Items, Plants, Departments & Resources
ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_plant 
FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_department 
FOREIGN KEY (department_id) REFERENCES pt_publish_departments(department_id) ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE CASCADE
ON UPDATE CASCADE;

-- Metrics -> Resources (optional relationship)
ALTER TABLE pt_publish_metrics 
ADD CONSTRAINT fk_metrics_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE SET NULL
ON UPDATE CASCADE;

-- ========================================
-- VERIFICATION
-- ========================================

-- Count unique constraints
SELECT 
    COUNT(*) as total_unique_constraints,
    'Unique constraints created' as status
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
AND table_name LIKE 'pt_publish_%';

-- Count foreign key constraints
SELECT 
    COUNT(*) as total_foreign_keys,
    'Foreign key constraints created' as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_name LIKE 'pt_publish_%';

-- Show sample of the relationships created
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name LIKE 'pt_publish_%'
ORDER BY tc.table_name
LIMIT 15;

COMMIT;

-- Show completion status
SELECT 'PT Publish unique constraints and foreign keys created successfully!' as status;