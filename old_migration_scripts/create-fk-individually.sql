-- Create foreign keys individually (non-transactional)
-- Organization hierarchy
ALTER TABLE pt_publish_departments ADD CONSTRAINT fk_departments_plant FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id);
ALTER TABLE pt_publish_resources ADD CONSTRAINT fk_resources_plant FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id);
ALTER TABLE pt_publish_resources ADD CONSTRAINT fk_resources_department FOREIGN KEY (department_id) REFERENCES pt_publish_departments(department_id);

-- Resource capabilities
ALTER TABLE pt_publish_resource_capabilities ADD CONSTRAINT fk_resource_capabilities_resource FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id);
ALTER TABLE pt_publish_resource_capabilities ADD CONSTRAINT fk_resource_capabilities_capability FOREIGN KEY (capability_id) REFERENCES pt_publish_capabilities(capability_id);

-- Inventory
ALTER TABLE pt_publish_inventories ADD CONSTRAINT fk_inventories_item FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id);
ALTER TABLE pt_publish_inventories ADD CONSTRAINT fk_inventories_warehouse FOREIGN KEY (warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id);

-- Jobs and Manufacturing
ALTER TABLE pt_publish_manufacturing_orders ADD CONSTRAINT fk_manufacturing_orders_job FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);
ALTER TABLE pt_publish_job_operations ADD CONSTRAINT fk_job_operations_job FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);
ALTER TABLE pt_publish_job_operations ADD CONSTRAINT fk_job_operations_manufacturing_order FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id);
ALTER TABLE pt_publish_job_activities ADD CONSTRAINT fk_job_activities_job FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);
ALTER TABLE pt_publish_job_activities ADD CONSTRAINT fk_job_activities_manufacturing_order FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id);
ALTER TABLE pt_publish_job_resources ADD CONSTRAINT fk_job_resources_job FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);
ALTER TABLE pt_publish_job_materials ADD CONSTRAINT fk_job_materials_job FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);
ALTER TABLE pt_publish_job_materials ADD CONSTRAINT fk_job_materials_manufacturing_order FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id);
ALTER TABLE pt_publish_job_products ADD CONSTRAINT fk_job_products_job FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);
ALTER TABLE pt_publish_job_products ADD CONSTRAINT fk_job_products_manufacturing_order FOREIGN KEY (manufacturing_order_id) REFERENCES pt_publish_manufacturing_orders(manufacturing_order_id);
ALTER TABLE pt_publish_job_paths ADD CONSTRAINT fk_job_paths_job FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);

-- Sales
ALTER TABLE pt_publish_sales_orders ADD CONSTRAINT fk_sales_orders_customer FOREIGN KEY (customer_id) REFERENCES pt_publish_customers(customer_id);
ALTER TABLE pt_publish_sales_order_lines ADD CONSTRAINT fk_sales_order_lines_order FOREIGN KEY (sales_order_id) REFERENCES pt_publish_sales_orders(sales_order_id);
ALTER TABLE pt_publish_sales_order_lines ADD CONSTRAINT fk_sales_order_lines_item FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id);

-- Forecasts
ALTER TABLE pt_publish_forecast_shipments ADD CONSTRAINT fk_forecast_shipments_forecast FOREIGN KEY (forecast_id) REFERENCES pt_publish_forecasts(forecast_id);

-- Product Rules
ALTER TABLE pt_publish_product_rules ADD CONSTRAINT fk_product_rules_item FOREIGN KEY (item_id) REFERENCES pt_publish_items(item_id);
ALTER TABLE pt_publish_product_rules ADD CONSTRAINT fk_product_rules_plant FOREIGN KEY (plant_id) REFERENCES pt_publish_plants(plant_id);
ALTER TABLE pt_publish_product_rules ADD CONSTRAINT fk_product_rules_department FOREIGN KEY (department_id) REFERENCES pt_publish_departments(department_id);
ALTER TABLE pt_publish_product_rules ADD CONSTRAINT fk_product_rules_resource FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id);

-- Capacity
ALTER TABLE pt_publish_capacity_interval_resource_assignments ADD CONSTRAINT fk_capacity_interval_assignments_interval FOREIGN KEY (capacity_interval_id) REFERENCES pt_publish_capacity_intervals(capacity_interval_id);
ALTER TABLE pt_publish_capacity_interval_resource_assignments ADD CONSTRAINT fk_capacity_interval_assignments_resource FOREIGN KEY (resource_id) REFERENCES pt_publish_resources(resource_id);

-- Transfers
ALTER TABLE pt_publish_transfer_order_distributions ADD CONSTRAINT fk_transfer_order_distributions_order FOREIGN KEY (transfer_order_id) REFERENCES pt_publish_transfer_orders(transfer_order_id);
ALTER TABLE pt_publish_transfer_order_distributions ADD CONSTRAINT fk_transfer_order_distributions_from_warehouse FOREIGN KEY (from_warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id);
ALTER TABLE pt_publish_transfer_order_distributions ADD CONSTRAINT fk_transfer_order_distributions_to_warehouse FOREIGN KEY (to_warehouse_id) REFERENCES pt_publish_warehouses(warehouse_id);

-- Job Path Nodes
ALTER TABLE pt_publish_job_path_nodes ADD CONSTRAINT fk_job_path_nodes_job FOREIGN KEY (job_id) REFERENCES pt_publish_jobs(job_id);
ALTER TABLE pt_publish_job_path_nodes ADD CONSTRAINT fk_job_path_nodes_path FOREIGN KEY (path_id) REFERENCES pt_publish_job_paths(path_id);
