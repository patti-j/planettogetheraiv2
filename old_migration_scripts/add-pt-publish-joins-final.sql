-- Add Unique Constraints and Foreign Keys for PT Publish Tables
-- Final working version

BEGIN;

-- ========================================
-- STEP 1: ADD UNIQUE CONSTRAINTS ON BUSINESS KEYS
-- ========================================

-- First, let's add unique constraints on the business key columns
-- These are needed before we can reference them with foreign keys

ALTER TABLE pt_publish_plants ADD CONSTRAINT uk_plant_id UNIQUE (plant_id);
ALTER TABLE pt_publish_departments ADD CONSTRAINT uk_department_id UNIQUE (department_id);
ALTER TABLE pt_publish_warehouses ADD CONSTRAINT uk_warehouse_id UNIQUE (warehouse_id);
ALTER TABLE pt_publish_resources ADD CONSTRAINT uk_resource_id UNIQUE (resource_id);
ALTER TABLE pt_publish_capabilities ADD CONSTRAINT uk_capability_id UNIQUE (capability_id);
ALTER TABLE pt_publish_customers ADD CONSTRAINT uk_customer_id UNIQUE (customer_id);
ALTER TABLE pt_publish_items ADD CONSTRAINT uk_item_id UNIQUE (item_id);
ALTER TABLE pt_publish_inventories ADD CONSTRAINT uk_inventory_id UNIQUE (inventory_id);
ALTER TABLE pt_publish_lots ADD CONSTRAINT uk_lot_id UNIQUE (lot_id);
ALTER TABLE pt_publish_jobs ADD CONSTRAINT uk_job_id UNIQUE (job_id);
ALTER TABLE pt_publish_manufacturing_orders ADD CONSTRAINT uk_manufacturing_order_id UNIQUE (manufacturing_order_id);
ALTER TABLE pt_publish_job_operations ADD CONSTRAINT uk_operation_id UNIQUE (operation_id);
ALTER TABLE pt_publish_job_activities ADD CONSTRAINT uk_activity_id UNIQUE (activity_id);
ALTER TABLE pt_publish_job_paths ADD CONSTRAINT uk_path_id UNIQUE (path_id);
ALTER TABLE pt_publish_sales_orders ADD CONSTRAINT uk_sales_order_id UNIQUE (sales_order_id);
ALTER TABLE pt_publish_sales_order_lines ADD CONSTRAINT uk_sales_order_line_id UNIQUE (sales_order_line_id);
ALTER TABLE pt_publish_forecasts ADD CONSTRAINT uk_forecast_id UNIQUE (forecast_id);
ALTER TABLE pt_publish_forecast_shipments ADD CONSTRAINT uk_forecast_shipment_id UNIQUE (forecast_shipment_id);
ALTER TABLE pt_publish_purchase_orders ADD CONSTRAINT uk_purchase_order_id UNIQUE (purchase_order_id);
ALTER TABLE pt_publish_purchase_order_lines ADD CONSTRAINT uk_purchase_order_line_id UNIQUE (purchase_order_line_id);
ALTER TABLE pt_publish_transfer_orders ADD CONSTRAINT uk_transfer_order_id UNIQUE (transfer_order_id);
ALTER TABLE pt_publish_transfer_order_distributions ADD CONSTRAINT uk_transfer_order_distribution_id UNIQUE (transfer_order_distribution_id);
ALTER TABLE pt_publish_capacity_intervals ADD CONSTRAINT uk_capacity_interval_id UNIQUE (capacity_interval_id);
ALTER TABLE pt_publish_schedules ADD CONSTRAINT uk_schedule_id UNIQUE (schedule_id);
ALTER TABLE pt_publish_resource_blocks ADD CONSTRAINT uk_resource_block_id UNIQUE (resource_block_id);

-- ========================================
-- STEP 2: CREATE FOREIGN KEY CONSTRAINTS
-- ========================================

-- Organization Hierarchy
ALTER TABLE pt_publish_departments 
ADD CONSTRAINT fk_departments_plant 
FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id);

ALTER TABLE pt_publish_resources 
ADD CONSTRAINT fk_resources_plant 
FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id);

ALTER TABLE pt_publish_resources 
ADD CONSTRAINT fk_resources_department 
FOREIGN KEY (department_id) REFERENCES pt_publish_departments(department_id);

-- Resource Capabilities
ALTER TABLE pt_publish_resource_capabilities 
ADD CONSTRAINT fk_resource_capabilities_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id);

ALTER TABLE pt_publish_resource_capabilities 
ADD CONSTRAINT fk_resource_capabilities_capability 
FOREIGN KEY (capability_id) REFERENCES pt_publish_capabilities(capability_id);

-- Inventory & Items
ALTER TABLE pt_publish_inventories 
ADD CONSTRAINT fk_inventories_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id);

ALTER TABLE pt_publish_inventories 
ADD CONSTRAINT fk_inventories_warehouse 
FOREIGN KEY (warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id);

ALTER TABLE pt_publish_lots 
ADD CONSTRAINT fk_lots_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id);

-- Jobs & Manufacturing
ALTER TABLE pt_publish_manufacturing_orders 
ADD CONSTRAINT fk_manufacturing_orders_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);

ALTER TABLE pt_publish_job_operations 
ADD CONSTRAINT fk_job_operations_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);

ALTER TABLE pt_publish_job_operations 
ADD CONSTRAINT fk_job_operations_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id);

ALTER TABLE pt_publish_job_activities 
ADD CONSTRAINT fk_job_activities_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);

ALTER TABLE pt_publish_job_activities 
ADD CONSTRAINT fk_job_activities_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id);

ALTER TABLE pt_publish_job_activities 
ADD CONSTRAINT fk_job_activities_operation 
FOREIGN KEY (operation_id) REFERENCES pt_publish_job_operations(operation_id);

ALTER TABLE pt_publish_job_resources 
ADD CONSTRAINT fk_job_resources_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);

ALTER TABLE pt_publish_job_materials 
ADD CONSTRAINT fk_job_materials_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);

ALTER TABLE pt_publish_job_materials 
ADD CONSTRAINT fk_job_materials_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id);

ALTER TABLE pt_publish_job_products 
ADD CONSTRAINT fk_job_products_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);

ALTER TABLE pt_publish_job_products 
ADD CONSTRAINT fk_job_products_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id);

-- Sales & Demand
ALTER TABLE pt_publish_sales_orders 
ADD CONSTRAINT fk_sales_orders_customer 
FOREIGN KEY (customer_id) REFERENCES pt_publish_customers(customer_id);

ALTER TABLE pt_publish_sales_order_lines 
ADD CONSTRAINT fk_sales_order_lines_order 
FOREIGN KEY (sales_order_id) REFERENCES pt_publish_sales_orders(sales_order_id);

ALTER TABLE pt_publish_sales_order_lines 
ADD CONSTRAINT fk_sales_order_lines_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id);

-- Forecasts
ALTER TABLE pt_publish_forecast_shipments 
ADD CONSTRAINT fk_forecast_shipments_forecast 
FOREIGN KEY (forecast_id) REFERENCES pt_publish_forecasts(forecast_id);

-- Purchasing
ALTER TABLE pt_publish_purchase_order_lines 
ADD CONSTRAINT fk_purchase_order_lines_order 
FOREIGN KEY (purchase_order_id) REFERENCES pt_publish_purchase_orders(purchase_order_id);

ALTER TABLE pt_publish_purchase_order_lines 
ADD CONSTRAINT fk_purchase_order_lines_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id);

-- Capacity & Resources
ALTER TABLE pt_publish_capacity_interval_resource_assignments 
ADD CONSTRAINT fk_capacity_interval_assignments_interval 
FOREIGN KEY (capacity_interval_id) REFERENCES pt_publish_capacity_intervals(capacity_interval_id);

ALTER TABLE pt_publish_capacity_interval_resource_assignments 
ADD CONSTRAINT fk_capacity_interval_assignments_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id);

ALTER TABLE pt_publish_resource_blocks 
ADD CONSTRAINT fk_resource_blocks_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id);

-- Product Rules
ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id);

ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_plant 
FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id);

ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_department 
FOREIGN KEY (department_id) REFERENCES pt_publish_departments(department_id);

ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id);

-- Job Paths
ALTER TABLE pt_publish_job_paths 
ADD CONSTRAINT fk_job_paths_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);

ALTER TABLE pt_publish_job_path_nodes 
ADD CONSTRAINT fk_job_path_nodes_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);

ALTER TABLE pt_publish_job_path_nodes 
ADD CONSTRAINT fk_job_path_nodes_path 
FOREIGN KEY (path_id) REFERENCES pt_publish_job_paths(path_id);

-- ========================================
-- VERIFICATION
-- ========================================

-- Count constraints created
SELECT 
    constraint_type,
    COUNT(*) as total_constraints
FROM information_schema.table_constraints
WHERE table_name LIKE 'pt_publish_%'
AND constraint_type IN ('UNIQUE', 'FOREIGN KEY')
GROUP BY constraint_type;

-- Show sample of foreign key relationships
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
LIMIT 20;

COMMIT;

-- Summary
SELECT 'PT Publish table joins successfully created!' as status;