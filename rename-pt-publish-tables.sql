-- Rename all PT Publish tables to use shorter names
-- From pt_publish_* to pt*

-- Jobs
ALTER TABLE IF EXISTS pt_publish_jobs RENAME TO ptJobs;

-- Resources
ALTER TABLE IF EXISTS pt_publish_resources RENAME TO ptResources;

-- Manufacturing Orders
ALTER TABLE IF EXISTS pt_publish_manufacturing_orders RENAME TO ptManufacturingOrders;

-- Job Operations
ALTER TABLE IF EXISTS pt_publish_job_operations RENAME TO ptJobOperations;

-- Capabilities
ALTER TABLE IF EXISTS pt_publish_capabilities RENAME TO ptCapabilities;

-- Metrics
ALTER TABLE IF EXISTS pt_publish_metrics RENAME TO ptMetrics;

-- Other PT Publish tables that may exist
ALTER TABLE IF EXISTS pt_publish_job_activities RENAME TO ptJobActivities;
ALTER TABLE IF EXISTS pt_publish_job_resources RENAME TO ptJobResources;
ALTER TABLE IF EXISTS pt_publish_job_materials RENAME TO ptJobMaterials;
ALTER TABLE IF EXISTS pt_publish_job_products RENAME TO ptJobProducts;
ALTER TABLE IF EXISTS pt_publish_job_paths RENAME TO ptJobPaths;
ALTER TABLE IF EXISTS pt_publish_job_path_nodes RENAME TO ptJobPathNodes;
ALTER TABLE IF EXISTS pt_publish_job_operation_attributes RENAME TO ptJobOperationAttributes;
ALTER TABLE IF EXISTS pt_publish_job_resource_blocks RENAME TO ptJobResourceBlocks;
ALTER TABLE IF EXISTS pt_publish_job_resource_block_intervals RENAME TO ptJobResourceBlockIntervals;
ALTER TABLE IF EXISTS pt_publish_job_resource_capabilities RENAME TO ptJobResourceCapabilities;
ALTER TABLE IF EXISTS pt_publish_job_successor_manufacturing_orders RENAME TO ptJobSuccessorManufacturingOrders;
ALTER TABLE IF EXISTS pt_publish_job_activity_inventory_adjustments RENAME TO ptJobActivityInventoryAdjustments;
ALTER TABLE IF EXISTS pt_publish_job_material_supplying_activities RENAME TO ptJobMaterialSupplyingActivities;
ALTER TABLE IF EXISTS pt_publish_job_product_sales_order_demands RENAME TO ptJobProductSalesOrderDemands;
ALTER TABLE IF EXISTS pt_publish_job_product_forecast_demands RENAME TO ptJobProductForecastDemands;
ALTER TABLE IF EXISTS pt_publish_job_product_safety_stock_demands RENAME TO ptJobProductSafetyStockDemands;
ALTER TABLE IF EXISTS pt_publish_job_product_deleted_demands RENAME TO ptJobProductDeletedDemands;
ALTER TABLE IF EXISTS pt_publish_job_product_transfer_order_demands RENAME TO ptJobProductTransferOrderDemands;

-- Plants and Departments
ALTER TABLE IF EXISTS pt_publish_plants RENAME TO ptPlants;
ALTER TABLE IF EXISTS pt_publish_departments RENAME TO ptDepartments;
ALTER TABLE IF EXISTS pt_publish_plant_warehouses RENAME TO ptPlantWarehouses;

-- Resource related
ALTER TABLE IF EXISTS pt_publish_resource_capabilities RENAME TO ptResourceCapabilities;

-- Inventory and Items
ALTER TABLE IF EXISTS pt_publish_inventories RENAME TO ptInventories;
ALTER TABLE IF EXISTS pt_publish_items RENAME TO ptItems;
ALTER TABLE IF EXISTS pt_publish_lots RENAME TO ptLots;

-- Sales and Orders
ALTER TABLE IF EXISTS pt_publish_sales_orders RENAME TO ptSalesOrders;
ALTER TABLE IF EXISTS pt_publish_sales_order_lines RENAME TO ptSalesOrderLines;
ALTER TABLE IF EXISTS pt_publish_sales_order_line_distributions RENAME TO ptSalesOrderLineDistributions;
ALTER TABLE IF EXISTS pt_publish_sales_order_distribution_inventory_adjustments RENAME TO ptSalesOrderDistributionInventoryAdjustments;

-- Transfers and Purchases
ALTER TABLE IF EXISTS pt_publish_transfer_orders RENAME TO ptTransferOrders;
ALTER TABLE IF EXISTS pt_publish_transfer_order_distributions RENAME TO ptTransferOrderDistributions;
ALTER TABLE IF EXISTS pt_publish_transfer_order_distribution_inventory_adjustments RENAME TO ptTransferOrderDistributionInventoryAdjustments;
ALTER TABLE IF EXISTS pt_publish_purchases_to_stock RENAME TO ptPurchasesToStock;
ALTER TABLE IF EXISTS pt_publish_purchase_to_stock_inventory_adjustments RENAME TO ptPurchaseToStockInventoryAdjustments;
ALTER TABLE IF EXISTS pt_publish_purchase_to_stock_sales_order_demands RENAME TO ptPurchaseToStockSalesOrderDemands;
ALTER TABLE IF EXISTS pt_publish_purchase_to_stock_forecast_demands RENAME TO ptPurchaseToStockForecastDemands;
ALTER TABLE IF EXISTS pt_publish_purchase_to_stock_safety_stock_demands RENAME TO ptPurchaseToStockSafetyStockDemands;
ALTER TABLE IF EXISTS pt_publish_purchase_to_stock_deleted_demands RENAME TO ptPurchaseToStockDeletedDemands;
ALTER TABLE IF EXISTS pt_publish_purchase_to_stock_transfer_order_demands RENAME TO ptPurchaseToStockTransferOrderDemands;

-- Forecasts
ALTER TABLE IF EXISTS pt_publish_forecasts RENAME TO ptForecasts;
ALTER TABLE IF EXISTS pt_publish_forecast_shipments RENAME TO ptForecastShipments;
ALTER TABLE IF EXISTS pt_publish_forecast_shipment_inventory_adjustments RENAME TO ptForecastShipmentInventoryAdjustments;

-- Capacity and Scheduling
ALTER TABLE IF EXISTS pt_publish_capacity_intervals RENAME TO ptCapacityIntervals;
ALTER TABLE IF EXISTS pt_publish_capacity_interval_resource_assignments RENAME TO ptCapacityIntervalResourceAssignments;
ALTER TABLE IF EXISTS pt_publish_recurring_capacity_intervals RENAME TO ptRecurringCapacityIntervals;
ALTER TABLE IF EXISTS pt_publish_recurring_capacity_interval_recurrences RENAME TO ptRecurringCapacityIntervalRecurrences;
ALTER TABLE IF EXISTS pt_publish_recurring_capacity_interval_resource_assignments RENAME TO ptRecurringCapacityIntervalResourceAssignments;
ALTER TABLE IF EXISTS pt_publish_schedules RENAME TO ptSchedules;

-- Warehouses
ALTER TABLE IF EXISTS pt_publish_warehouses RENAME TO ptWarehouses;

-- Other
ALTER TABLE IF EXISTS pt_publish_customers RENAME TO ptCustomers;
ALTER TABLE IF EXISTS pt_publish_product_rules RENAME TO ptProductRules;
ALTER TABLE IF EXISTS pt_publish_pt_attributes RENAME TO ptAttributes;
ALTER TABLE IF EXISTS pt_publish_report_blocks RENAME TO ptReportBlocks;
ALTER TABLE IF EXISTS pt_publish_system_data RENAME TO ptSystemData;
ALTER TABLE IF EXISTS pt_publish_kpis RENAME TO ptKpis;