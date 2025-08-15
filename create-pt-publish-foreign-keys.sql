-- Create Foreign Key Constraints for PT Publish Tables
-- This script establishes all necessary joins between PT Publish tables

BEGIN;

-- ========================================
-- SECTION 1: ORGANIZATION HIERARCHY
-- ========================================

-- Departments -> Plants
ALTER TABLE pt_publish_departments 
ADD CONSTRAINT fk_departments_plant 
FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id) ON DELETE CASCADE;

-- Resources -> Plants & Departments
ALTER TABLE pt_publish_resources 
ADD CONSTRAINT fk_resources_plant 
FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_resources 
ADD CONSTRAINT fk_resources_department 
FOREIGN KEY (department_id) REFERENCES pt_publish_departments(department_id) ON DELETE CASCADE;

-- Resource Capabilities -> Resources & Capabilities
ALTER TABLE pt_publish_resource_capabilities 
ADD CONSTRAINT fk_resource_capabilities_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_resource_capabilities 
ADD CONSTRAINT fk_resource_capabilities_capability 
FOREIGN KEY (capability_id) REFERENCES pt_publish_capabilities(capability_id) ON DELETE CASCADE;

-- ========================================
-- SECTION 2: INVENTORY & ITEMS
-- ========================================

-- Inventories -> Items & Warehouses
ALTER TABLE pt_publish_inventories 
ADD CONSTRAINT fk_inventories_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_inventories 
ADD CONSTRAINT fk_inventories_warehouse 
FOREIGN KEY (warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id) ON DELETE CASCADE;

-- Lots -> Items
ALTER TABLE pt_publish_lots 
ADD CONSTRAINT fk_lots_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE;

-- ========================================
-- SECTION 3: JOBS & MANUFACTURING
-- ========================================

-- Manufacturing Orders -> Jobs
ALTER TABLE pt_publish_manufacturing_orders 
ADD CONSTRAINT fk_manufacturing_orders_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

-- Job Operations -> Jobs & Manufacturing Orders
ALTER TABLE pt_publish_job_operations 
ADD CONSTRAINT fk_job_operations_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_operations 
ADD CONSTRAINT fk_job_operations_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

-- Job Activities -> Jobs, Manufacturing Orders & Operations
ALTER TABLE pt_publish_job_activities 
ADD CONSTRAINT fk_job_activities_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_activities 
ADD CONSTRAINT fk_job_activities_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_activities 
ADD CONSTRAINT fk_job_activities_operation 
FOREIGN KEY (operation_id) REFERENCES pt_publish_job_operations(operation_id) ON DELETE CASCADE;

-- Job Resources -> Jobs & Resources
ALTER TABLE pt_publish_job_resources 
ADD CONSTRAINT fk_job_resources_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

-- Job Materials -> Jobs, Manufacturing Orders & Items
ALTER TABLE pt_publish_job_materials 
ADD CONSTRAINT fk_job_materials_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_materials 
ADD CONSTRAINT fk_job_materials_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

-- Job Products -> Jobs & Manufacturing Orders
ALTER TABLE pt_publish_job_products 
ADD CONSTRAINT fk_job_products_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_products 
ADD CONSTRAINT fk_job_products_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

-- Job Operation Attributes -> Jobs, Manufacturing Orders & Operations
ALTER TABLE pt_publish_job_operation_attributes 
ADD CONSTRAINT fk_job_operation_attributes_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_operation_attributes 
ADD CONSTRAINT fk_job_operation_attributes_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_operation_attributes 
ADD CONSTRAINT fk_job_operation_attributes_operation 
FOREIGN KEY (operation_id) REFERENCES pt_publish_job_operations(operation_id) ON DELETE CASCADE;

-- Job Successor Jobs -> Jobs (self-referencing)
ALTER TABLE pt_publish_job_successor_jobs 
ADD CONSTRAINT fk_job_successor_jobs_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_successor_jobs 
ADD CONSTRAINT fk_job_successor_jobs_successor 
FOREIGN KEY (successor_job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

-- Job Successor Manufacturing Orders -> Jobs & Manufacturing Orders
ALTER TABLE pt_publish_job_successor_manufacturing_orders 
ADD CONSTRAINT fk_job_successor_mo_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_successor_manufacturing_orders 
ADD CONSTRAINT fk_job_successor_mo_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_successor_manufacturing_orders 
ADD CONSTRAINT fk_job_successor_mo_successor 
FOREIGN KEY (successor_manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

-- Job Material Supplying Activities -> Jobs, Manufacturing Orders & Activities
ALTER TABLE pt_publish_job_material_supplying_activities 
ADD CONSTRAINT fk_job_material_supplying_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_material_supplying_activities 
ADD CONSTRAINT fk_job_material_supplying_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_material_supplying_activities 
ADD CONSTRAINT fk_job_material_supplying_operation 
FOREIGN KEY (operation_id) REFERENCES pt_publish_job_operations(operation_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_material_supplying_activities 
ADD CONSTRAINT fk_job_material_supplying_activity 
FOREIGN KEY (activity_id) REFERENCES pt_publish_job_activities(activity_id) ON DELETE CASCADE;

-- Job Activity Inventory Adjustments -> Jobs, Manufacturing Orders, Operations & Activities
ALTER TABLE pt_publish_job_activity_inventory_adjustments 
ADD CONSTRAINT fk_job_activity_inv_adj_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_activity_inventory_adjustments 
ADD CONSTRAINT fk_job_activity_inv_adj_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_activity_inventory_adjustments 
ADD CONSTRAINT fk_job_activity_inv_adj_operation 
FOREIGN KEY (operation_id) REFERENCES pt_publish_job_operations(operation_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_activity_inventory_adjustments 
ADD CONSTRAINT fk_job_activity_inv_adj_activity 
FOREIGN KEY (activity_id) REFERENCES pt_publish_job_activities(activity_id) ON DELETE CASCADE;

-- Job Status Changes -> Jobs
ALTER TABLE pt_publish_job_status_changes 
ADD CONSTRAINT fk_job_status_changes_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

-- Job Paths -> Jobs
ALTER TABLE pt_publish_job_paths 
ADD CONSTRAINT fk_job_paths_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

-- Job Path Nodes -> Jobs & Job Paths
ALTER TABLE pt_publish_job_path_nodes 
ADD CONSTRAINT fk_job_path_nodes_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_path_nodes 
ADD CONSTRAINT fk_job_path_nodes_path 
FOREIGN KEY (job_path_id) REFERENCES pt_publish_job_paths(job_path_id) ON DELETE CASCADE;

-- ========================================
-- SECTION 4: SALES & DEMAND
-- ========================================

-- Sales Orders -> Customers
ALTER TABLE pt_publish_sales_orders 
ADD CONSTRAINT fk_sales_orders_customer 
FOREIGN KEY (customer_id) REFERENCES pt_publish_customers(customer_id) ON DELETE CASCADE;

-- Sales Order Lines -> Sales Orders & Items
ALTER TABLE pt_publish_sales_order_lines 
ADD CONSTRAINT fk_sales_order_lines_order 
FOREIGN KEY (sales_order_id) REFERENCES pt_publish_sales_orders(sales_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_sales_order_lines 
ADD CONSTRAINT fk_sales_order_lines_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE;

-- Sales Order Line Distributions -> Sales Order Lines & Warehouses
ALTER TABLE pt_publish_sales_order_line_distributions 
ADD CONSTRAINT fk_so_line_distributions_order 
FOREIGN KEY (sales_order_id) REFERENCES pt_publish_sales_orders(sales_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_sales_order_line_distributions 
ADD CONSTRAINT fk_so_line_distributions_line 
FOREIGN KEY (sales_order_line_id) REFERENCES pt_publish_sales_order_lines(sales_order_line_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_sales_order_line_distributions 
ADD CONSTRAINT fk_so_line_distributions_warehouse 
FOREIGN KEY (warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id) ON DELETE CASCADE;

-- Job Product Sales Order Demands -> Jobs & Sales Order Lines
ALTER TABLE pt_publish_job_product_sales_order_demands 
ADD CONSTRAINT fk_job_product_so_demands_sales_order 
FOREIGN KEY (sales_order_id) REFERENCES pt_publish_sales_orders(sales_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_product_sales_order_demands 
ADD CONSTRAINT fk_job_product_so_demands_line 
FOREIGN KEY (sales_order_line_id) REFERENCES pt_publish_sales_order_lines(sales_order_line_id) ON DELETE CASCADE;

-- ========================================
-- SECTION 5: FORECASTS
-- ========================================

-- Forecast Shipments -> Forecasts
ALTER TABLE pt_publish_forecast_shipments 
ADD CONSTRAINT fk_forecast_shipments_forecast 
FOREIGN KEY (forecast_id) REFERENCES pt_publish_forecasts(forecast_id) ON DELETE CASCADE;

-- Forecast Shipment Inventory Adjustments -> Forecast Shipments
ALTER TABLE pt_publish_forecast_shipment_inventory_adjustments 
ADD CONSTRAINT fk_forecast_shipment_inv_adj_forecast 
FOREIGN KEY (forecast_id) REFERENCES pt_publish_forecasts(forecast_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_forecast_shipment_inventory_adjustments 
ADD CONSTRAINT fk_forecast_shipment_inv_adj_shipment 
FOREIGN KEY (forecast_shipment_id) REFERENCES pt_publish_forecast_shipments(forecast_shipment_id) ON DELETE CASCADE;

-- Job Product Forecast Demands -> Forecasts & Forecast Shipments
ALTER TABLE pt_publish_job_product_forecast_demands 
ADD CONSTRAINT fk_job_product_forecast_demands_forecast 
FOREIGN KEY (forecast_id) REFERENCES pt_publish_forecasts(forecast_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_product_forecast_demands 
ADD CONSTRAINT fk_job_product_forecast_demands_shipment 
FOREIGN KEY (forecast_shipment_id) REFERENCES pt_publish_forecast_shipments(forecast_shipment_id) ON DELETE CASCADE;

-- Job Product Deleted Demands -> Forecasts, Forecast Shipments, Sales Orders & Sales Order Lines
ALTER TABLE pt_publish_job_product_deleted_demands 
ADD CONSTRAINT fk_job_product_deleted_demands_forecast 
FOREIGN KEY (forecast_id) REFERENCES pt_publish_forecasts(forecast_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_product_deleted_demands 
ADD CONSTRAINT fk_job_product_deleted_demands_shipment 
FOREIGN KEY (forecast_shipment_id) REFERENCES pt_publish_forecast_shipments(forecast_shipment_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_product_deleted_demands 
ADD CONSTRAINT fk_job_product_deleted_demands_sales_order 
FOREIGN KEY (sales_order_id) REFERENCES pt_publish_sales_orders(sales_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_job_product_deleted_demands 
ADD CONSTRAINT fk_job_product_deleted_demands_line 
FOREIGN KEY (sales_order_line_id) REFERENCES pt_publish_sales_order_lines(sales_order_line_id) ON DELETE CASCADE;

-- ========================================
-- SECTION 6: PURCHASING
-- ========================================

-- Purchase Order Lines -> Purchase Orders & Items
ALTER TABLE pt_publish_purchase_order_lines 
ADD CONSTRAINT fk_purchase_order_lines_order 
FOREIGN KEY (purchase_order_id) REFERENCES pt_publish_purchase_orders(purchase_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_purchase_order_lines 
ADD CONSTRAINT fk_purchase_order_lines_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE;

-- Purchases to Stock -> Items & Warehouses
ALTER TABLE pt_publish_purchases_to_stock 
ADD CONSTRAINT fk_purchases_to_stock_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_purchases_to_stock 
ADD CONSTRAINT fk_purchases_to_stock_warehouse 
FOREIGN KEY (warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id) ON DELETE CASCADE;

-- ========================================
-- SECTION 7: TRANSFERS
-- ========================================

-- Transfer Order Distributions -> Transfer Orders & Warehouses
ALTER TABLE pt_publish_transfer_order_distributions 
ADD CONSTRAINT fk_transfer_order_distributions_order 
FOREIGN KEY (transfer_order_id) REFERENCES pt_publish_transfer_orders(transfer_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_transfer_order_distributions 
ADD CONSTRAINT fk_transfer_order_distributions_from_warehouse 
FOREIGN KEY (from_warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_transfer_order_distributions 
ADD CONSTRAINT fk_transfer_order_distributions_to_warehouse 
FOREIGN KEY (to_warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id) ON DELETE CASCADE;

-- Transfer Order Distribution Inventory Adjustments -> Transfer Orders & Transfer Order Distributions
ALTER TABLE pt_publish_transfer_order_distribution_inventory_adjustments 
ADD CONSTRAINT fk_transfer_inv_adj_order 
FOREIGN KEY (transfer_order_id) REFERENCES pt_publish_transfer_orders(transfer_order_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_transfer_order_distribution_inventory_adjustments 
ADD CONSTRAINT fk_transfer_inv_adj_distribution 
FOREIGN KEY (transfer_order_distribution_id) REFERENCES pt_publish_transfer_order_distributions(transfer_order_distribution_id) ON DELETE CASCADE;

-- ========================================
-- SECTION 8: CAPACITY & SCHEDULING
-- ========================================

-- Capacity Interval Resource Assignments -> Capacity Intervals & Resources
ALTER TABLE pt_publish_capacity_interval_resource_assignments 
ADD CONSTRAINT fk_capacity_interval_assignments_interval 
FOREIGN KEY (capacity_interval_id) REFERENCES pt_publish_capacity_intervals(capacity_interval_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_capacity_interval_resource_assignments 
ADD CONSTRAINT fk_capacity_interval_assignments_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE CASCADE;

-- Resource Blocks -> Resources
ALTER TABLE pt_publish_resource_blocks 
ADD CONSTRAINT fk_resource_blocks_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE CASCADE;

-- ========================================
-- SECTION 9: PRODUCT RULES & ALLOCATIONS
-- ========================================

-- Product Rules -> Items, Plants, Departments & Resources
ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_item 
FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_plant 
FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_department 
FOREIGN KEY (department_id) REFERENCES pt_publish_departments(department_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_product_rules 
ADD CONSTRAINT fk_product_rules_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE CASCADE;

-- Supply Allocations -> Jobs & Manufacturing Orders
ALTER TABLE pt_publish_supply_allocations 
ADD CONSTRAINT fk_supply_allocations_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

ALTER TABLE pt_publish_supply_allocations 
ADD CONSTRAINT fk_supply_allocations_manufacturing_order 
FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id) ON DELETE CASCADE;

-- Supply Allocation Rules -> Jobs
ALTER TABLE pt_publish_supply_allocation_rules 
ADD CONSTRAINT fk_supply_allocation_rules_job 
FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id) ON DELETE CASCADE;

-- ========================================
-- SECTION 10: METRICS & KPIs
-- ========================================

-- Metrics -> Resources (optional relationship)
ALTER TABLE pt_publish_metrics 
ADD CONSTRAINT fk_metrics_resource 
FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id) ON DELETE SET NULL;

-- ========================================
-- VERIFICATION
-- ========================================

-- Count the number of foreign key constraints created
SELECT 
    COUNT(*) as total_foreign_keys,
    'Foreign key constraints created successfully' as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_name LIKE 'pt_publish_%';

-- Show a sample of the foreign key relationships
SELECT 
    tc.table_name,
    tc.constraint_name,
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

-- Show completion status
SELECT 'All PT Publish foreign key constraints created successfully!' as status;