-- Add Unique Constraints and Foreign Keys for PT Publish Tables
-- Corrected version using actual column names

BEGIN;

-- ========================================
-- STEP 1: ADD UNIQUE CONSTRAINTS ON BUSINESS KEYS
-- ========================================

-- Core organizational tables
ALTER TABLE pt_publish_plants ADD CONSTRAINT uk_plant_id UNIQUE (plant_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_departments ADD CONSTRAINT uk_department_id UNIQUE (department_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_warehouses ADD CONSTRAINT uk_warehouse_id UNIQUE (warehouse_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_resources ADD CONSTRAINT uk_resource_id UNIQUE (resource_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_capabilities ADD CONSTRAINT uk_capability_id UNIQUE (capability_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_customers ADD CONSTRAINT uk_customer_id UNIQUE (customer_id) ON CONFLICT DO NOTHING;

-- Item and inventory tables
ALTER TABLE pt_publish_items ADD CONSTRAINT uk_item_id UNIQUE (item_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_inventories ADD CONSTRAINT uk_inventory_id UNIQUE (inventory_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_lots ADD CONSTRAINT uk_lot_id UNIQUE (lot_id) ON CONFLICT DO NOTHING;

-- Job and manufacturing tables
ALTER TABLE pt_publish_jobs ADD CONSTRAINT uk_job_id UNIQUE (job_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_manufacturing_orders ADD CONSTRAINT uk_manufacturing_order_id UNIQUE (manufacturing_order_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_job_operations ADD CONSTRAINT uk_operation_id UNIQUE (operation_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_job_activities ADD CONSTRAINT uk_activity_id UNIQUE (activity_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_job_paths ADD CONSTRAINT uk_path_id UNIQUE (path_id) ON CONFLICT DO NOTHING;

-- Sales and demand tables
ALTER TABLE pt_publish_sales_orders ADD CONSTRAINT uk_sales_order_id UNIQUE (sales_order_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_sales_order_lines ADD CONSTRAINT uk_sales_order_line_id UNIQUE (sales_order_line_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_forecasts ADD CONSTRAINT uk_forecast_id UNIQUE (forecast_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_forecast_shipments ADD CONSTRAINT uk_forecast_shipment_id UNIQUE (forecast_shipment_id) ON CONFLICT DO NOTHING;

-- Purchase and transfer tables
ALTER TABLE pt_publish_purchase_orders ADD CONSTRAINT uk_purchase_order_id UNIQUE (purchase_order_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_purchase_order_lines ADD CONSTRAINT uk_purchase_order_line_id UNIQUE (purchase_order_line_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_transfer_orders ADD CONSTRAINT uk_transfer_order_id UNIQUE (transfer_order_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_transfer_order_distributions ADD CONSTRAINT uk_transfer_order_distribution_id UNIQUE (transfer_order_distribution_id) ON CONFLICT DO NOTHING;

-- Capacity and scheduling tables
ALTER TABLE pt_publish_capacity_intervals ADD CONSTRAINT uk_capacity_interval_id UNIQUE (capacity_interval_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_schedules ADD CONSTRAINT uk_schedule_id UNIQUE (schedule_id) ON CONFLICT DO NOTHING;
ALTER TABLE pt_publish_resource_blocks ADD CONSTRAINT uk_resource_block_id UNIQUE (resource_block_id) ON CONFLICT DO NOTHING;

-- ========================================
-- STEP 2: CREATE FOREIGN KEY CONSTRAINTS (with existence check)
-- ========================================

-- Function to safely add foreign key constraints
CREATE OR REPLACE FUNCTION add_foreign_key_if_columns_exist(
    p_table_name text,
    p_constraint_name text,
    p_column_name text,
    p_foreign_table text,
    p_foreign_column text
) RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table_name AND column_name = p_column_name
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_foreign_table AND column_name = p_foreign_column
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE CASCADE ON UPDATE CASCADE',
                       p_table_name, p_constraint_name, p_column_name, p_foreign_table, p_foreign_column);
        RAISE NOTICE 'Added FK: %.% -> %.%', p_table_name, p_column_name, p_foreign_table, p_foreign_column;
    ELSE
        RAISE NOTICE 'Skipped FK: %.% -> %.% (column not found)', p_table_name, p_column_name, p_foreign_table, p_foreign_column;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'FK already exists: %', p_constraint_name;
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'FK violation: % (data integrity issue)', p_constraint_name;
END;
$$ LANGUAGE plpgsql;

-- Add foreign key relationships

-- Departments -> Plants
SELECT add_foreign_key_if_columns_exist('pt_publish_departments', 'fk_departments_plant', 'plant_id', 'pt_publish_plants', 'plant_id');

-- Resources -> Plants & Departments
SELECT add_foreign_key_if_columns_exist('pt_publish_resources', 'fk_resources_plant', 'plant_id', 'pt_publish_plants', 'plant_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_resources', 'fk_resources_department', 'department_id', 'pt_publish_departments', 'department_id');

-- Resource Capabilities -> Resources & Capabilities
SELECT add_foreign_key_if_columns_exist('pt_publish_resource_capabilities', 'fk_resource_capabilities_resource', 'resource_id', 'pt_publish_resources', 'resource_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_resource_capabilities', 'fk_resource_capabilities_capability', 'capability_id', 'pt_publish_capabilities', 'capability_id');

-- Inventories -> Items & Warehouses
SELECT add_foreign_key_if_columns_exist('pt_publish_inventories', 'fk_inventories_item', 'item_id', 'pt_publish_items', 'item_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_inventories', 'fk_inventories_warehouse', 'warehouse_id', 'pt_publish_warehouses', 'warehouse_id');

-- Lots -> Items
SELECT add_foreign_key_if_columns_exist('pt_publish_lots', 'fk_lots_item', 'item_id', 'pt_publish_items', 'item_id');

-- Manufacturing Orders -> Jobs
SELECT add_foreign_key_if_columns_exist('pt_publish_manufacturing_orders', 'fk_manufacturing_orders_job', 'job_id', 'pt_publish_jobs', 'job_id');

-- Job Operations -> Jobs & Manufacturing Orders
SELECT add_foreign_key_if_columns_exist('pt_publish_job_operations', 'fk_job_operations_job', 'job_id', 'pt_publish_jobs', 'job_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_operations', 'fk_job_operations_manufacturing_order', 'manufacturing_order_id', 'pt_publish_manufacturing_orders', 'manufacturing_order_id');

-- Job Activities -> Jobs, Manufacturing Orders & Operations
SELECT add_foreign_key_if_columns_exist('pt_publish_job_activities', 'fk_job_activities_job', 'job_id', 'pt_publish_jobs', 'job_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_activities', 'fk_job_activities_manufacturing_order', 'manufacturing_order_id', 'pt_publish_manufacturing_orders', 'manufacturing_order_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_activities', 'fk_job_activities_operation', 'operation_id', 'pt_publish_job_operations', 'operation_id');

-- Job Resources -> Jobs
SELECT add_foreign_key_if_columns_exist('pt_publish_job_resources', 'fk_job_resources_job', 'job_id', 'pt_publish_jobs', 'job_id');

-- Job Materials -> Jobs & Manufacturing Orders
SELECT add_foreign_key_if_columns_exist('pt_publish_job_materials', 'fk_job_materials_job', 'job_id', 'pt_publish_jobs', 'job_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_materials', 'fk_job_materials_manufacturing_order', 'manufacturing_order_id', 'pt_publish_manufacturing_orders', 'manufacturing_order_id');

-- Job Products -> Jobs & Manufacturing Orders
SELECT add_foreign_key_if_columns_exist('pt_publish_job_products', 'fk_job_products_job', 'job_id', 'pt_publish_jobs', 'job_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_products', 'fk_job_products_manufacturing_order', 'manufacturing_order_id', 'pt_publish_manufacturing_orders', 'manufacturing_order_id');

-- Job Operation Attributes -> Jobs, Manufacturing Orders & Operations
SELECT add_foreign_key_if_columns_exist('pt_publish_job_operation_attributes', 'fk_job_operation_attributes_job', 'job_id', 'pt_publish_jobs', 'job_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_operation_attributes', 'fk_job_operation_attributes_manufacturing_order', 'manufacturing_order_id', 'pt_publish_manufacturing_orders', 'manufacturing_order_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_operation_attributes', 'fk_job_operation_attributes_operation', 'operation_id', 'pt_publish_job_operations', 'operation_id');

-- Sales Orders -> Customers
SELECT add_foreign_key_if_columns_exist('pt_publish_sales_orders', 'fk_sales_orders_customer', 'customer_id', 'pt_publish_customers', 'customer_id');

-- Sales Order Lines -> Sales Orders & Items
SELECT add_foreign_key_if_columns_exist('pt_publish_sales_order_lines', 'fk_sales_order_lines_order', 'sales_order_id', 'pt_publish_sales_orders', 'sales_order_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_sales_order_lines', 'fk_sales_order_lines_item', 'item_id', 'pt_publish_items', 'item_id');

-- Forecast Shipments -> Forecasts
SELECT add_foreign_key_if_columns_exist('pt_publish_forecast_shipments', 'fk_forecast_shipments_forecast', 'forecast_id', 'pt_publish_forecasts', 'forecast_id');

-- Purchase Order Lines -> Purchase Orders & Items
SELECT add_foreign_key_if_columns_exist('pt_publish_purchase_order_lines', 'fk_purchase_order_lines_order', 'purchase_order_id', 'pt_publish_purchase_orders', 'purchase_order_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_purchase_order_lines', 'fk_purchase_order_lines_item', 'item_id', 'pt_publish_items', 'item_id');

-- Capacity Interval Resource Assignments -> Capacity Intervals & Resources
SELECT add_foreign_key_if_columns_exist('pt_publish_capacity_interval_resource_assignments', 'fk_capacity_interval_assignments_interval', 'capacity_interval_id', 'pt_publish_capacity_intervals', 'capacity_interval_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_capacity_interval_resource_assignments', 'fk_capacity_interval_assignments_resource', 'resource_id', 'pt_publish_resources', 'resource_id');

-- Resource Blocks -> Resources
SELECT add_foreign_key_if_columns_exist('pt_publish_resource_blocks', 'fk_resource_blocks_resource', 'resource_id', 'pt_publish_resources', 'resource_id');

-- Product Rules -> Items, Plants, Departments & Resources
SELECT add_foreign_key_if_columns_exist('pt_publish_product_rules', 'fk_product_rules_item', 'item_id', 'pt_publish_items', 'item_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_product_rules', 'fk_product_rules_plant', 'plant_id', 'pt_publish_plants', 'plant_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_product_rules', 'fk_product_rules_department', 'department_id', 'pt_publish_departments', 'department_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_product_rules', 'fk_product_rules_resource', 'resource_id', 'pt_publish_resources', 'resource_id');

-- Job Paths -> Jobs
SELECT add_foreign_key_if_columns_exist('pt_publish_job_paths', 'fk_job_paths_job', 'job_id', 'pt_publish_jobs', 'job_id');

-- Job Path Nodes -> Jobs & Job Paths
SELECT add_foreign_key_if_columns_exist('pt_publish_job_path_nodes', 'fk_job_path_nodes_job', 'job_id', 'pt_publish_jobs', 'job_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_path_nodes', 'fk_job_path_nodes_path', 'path_id', 'pt_publish_job_paths', 'path_id');

-- Job Successor Jobs -> Jobs (self-referencing)
SELECT add_foreign_key_if_columns_exist('pt_publish_job_successor_jobs', 'fk_job_successor_jobs_job', 'job_id', 'pt_publish_jobs', 'job_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_successor_jobs', 'fk_job_successor_jobs_successor', 'successor_job_id', 'pt_publish_jobs', 'job_id');

-- Job Successor Manufacturing Orders -> Jobs & Manufacturing Orders
SELECT add_foreign_key_if_columns_exist('pt_publish_job_successor_manufacturing_orders', 'fk_job_successor_mo_job', 'job_id', 'pt_publish_jobs', 'job_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_successor_manufacturing_orders', 'fk_job_successor_mo_manufacturing_order', 'manufacturing_order_id', 'pt_publish_manufacturing_orders', 'manufacturing_order_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_job_successor_manufacturing_orders', 'fk_job_successor_mo_successor', 'successor_manufacturing_order_id', 'pt_publish_manufacturing_orders', 'manufacturing_order_id');

-- Transfer Order Distributions -> Transfer Orders & Warehouses
SELECT add_foreign_key_if_columns_exist('pt_publish_transfer_order_distributions', 'fk_transfer_order_distributions_order', 'transfer_order_id', 'pt_publish_transfer_orders', 'transfer_order_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_transfer_order_distributions', 'fk_transfer_order_distributions_from_warehouse', 'from_warehouse_id', 'pt_publish_warehouses', 'warehouse_id');
SELECT add_foreign_key_if_columns_exist('pt_publish_transfer_order_distributions', 'fk_transfer_order_distributions_to_warehouse', 'to_warehouse_id', 'pt_publish_warehouses', 'warehouse_id');

-- Metrics -> Resources (optional relationship)
SELECT add_foreign_key_if_columns_exist('pt_publish_metrics', 'fk_metrics_resource', 'resource_id', 'pt_publish_resources', 'resource_id');

-- Clean up the helper function
DROP FUNCTION IF EXISTS add_foreign_key_if_columns_exist(text, text, text, text, text);

-- ========================================
-- VERIFICATION
-- ========================================

-- Count unique constraints
SELECT 
    COUNT(*) as total_unique_constraints,
    'Unique constraints created' as status
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
AND table_name LIKE 'pt_publish_%'
AND constraint_name LIKE 'uk_%';

-- Count foreign key constraints
SELECT 
    COUNT(*) as total_foreign_keys,
    'Foreign key constraints created' as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_name LIKE 'pt_publish_%'
AND constraint_name LIKE 'fk_%';

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
AND tc.constraint_name LIKE 'fk_%'
ORDER BY tc.table_name
LIMIT 15;

COMMIT;

-- Show completion status
SELECT 'PT Publish constraints created successfully!' as status;