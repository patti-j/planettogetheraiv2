# PT Publish Tables Summary
## Total: 61 Tables Created

### Core Manufacturing Tables (9)
- **pt_publish_jobs** - Master job/work order records
- **pt_publish_manufacturing_orders** - Manufacturing order details within jobs
- **pt_publish_job_operations** - Operations/steps within manufacturing orders
- **pt_publish_job_activities** - Activities within operations (setup, run, clean)
- **pt_publish_job_paths** - Routing paths through operations
- **pt_publish_job_path_nodes** - Connections between operations in paths
- **pt_publish_job_successor_manufacturing_orders** - Dependencies between orders
- **pt_publish_job_operation_attributes** - Custom attributes for operations
- **pt_publish_lots** - Lot tracking for materials

### Resource Management Tables (11)
- **pt_publish_resources** - Equipment/machines/work centers
- **pt_publish_resource_capabilities** - What resources can do
- **pt_publish_capabilities** - Capability definitions
- **pt_publish_job_resources** - Resource requirements for operations
- **pt_publish_job_resource_capabilities** - Required capabilities for jobs
- **pt_publish_job_resource_blocks** - Scheduled resource allocations
- **pt_publish_job_resource_block_intervals** - Time intervals for resource blocks
- **pt_publish_capacity_intervals** - Available capacity time slots
- **pt_publish_capacity_interval_resource_assignments** - Resources assigned to capacity
- **pt_publish_recurring_capacity_intervals** - Repeating capacity patterns
- **pt_publish_recurring_capacity_interval_recurrences** - Specific recurrence instances
- **pt_publish_recurring_capacity_interval_resource_assignments** - Resources for recurring capacity

### Material Management Tables (7)
- **pt_publish_items** - Item/product master data
- **pt_publish_inventories** - Inventory levels by item/warehouse
- **pt_publish_job_materials** - Material requirements for operations
- **pt_publish_job_material_supplying_activities** - Which activities supply materials
- **pt_publish_job_products** - Products output from operations
- **pt_publish_product_rules** - Production rules for items
- **pt_publish_pt_attributes** - Custom attributes for items/operations

### Demand Management Tables (14)
- **pt_publish_sales_orders** - Customer sales orders
- **pt_publish_sales_order_lines** - Line items on sales orders
- **pt_publish_sales_order_line_distributions** - Distribution of order lines
- **pt_publish_sales_order_distribution_inventory_adjustments** - Inventory adjustments
- **pt_publish_forecasts** - Demand forecasts
- **pt_publish_forecast_shipments** - Forecast shipment details
- **pt_publish_forecast_shipment_inventory_adjustments** - Forecast inventory adjustments
- **pt_publish_job_product_sales_order_demands** - Sales order demand for job products
- **pt_publish_job_product_forecast_demands** - Forecast demand for job products
- **pt_publish_job_product_safety_stock_demands** - Safety stock demands
- **pt_publish_job_product_transfer_order_demands** - Transfer order demands
- **pt_publish_job_product_deleted_demands** - Historical deleted demands
- **pt_publish_job_activity_inventory_adjustments** - Activity-based inventory adjustments
- **pt_publish_transfer_orders** - Inter-warehouse transfer orders
- **pt_publish_transfer_order_distributions** - Transfer order details
- **pt_publish_transfer_order_distribution_inventory_adjustments** - Transfer adjustments

### Supply Management Tables (7)
- **pt_publish_purchases_to_stock** - Purchase orders for inventory
- **pt_publish_purchase_to_stock_sales_order_demands** - PO to SO links
- **pt_publish_purchase_to_stock_forecast_demands** - PO to forecast links
- **pt_publish_purchase_to_stock_safety_stock_demands** - PO for safety stock
- **pt_publish_purchase_to_stock_transfer_order_demands** - PO for transfers
- **pt_publish_purchase_to_stock_deleted_demands** - Historical deleted PO demands
- **pt_publish_purchase_to_stock_inventory_adjustments** - PO inventory adjustments

### Organization Tables (6)
- **pt_publish_plants** - Manufacturing plants/facilities
- **pt_publish_departments** - Departments within plants
- **pt_publish_warehouses** - Storage locations
- **pt_publish_plant_warehouses** - Plant-warehouse associations
- **pt_publish_customers** - Customer master data
- **pt_publish_schedules** - Published schedule metadata

### Analytics & System Tables (4)
- **pt_publish_metrics** - System-wide performance metrics
- **pt_publish_kpis** - Key performance indicators
- **pt_publish_report_blocks** - Report configuration
- **pt_publish_system_data** - System configuration

## Key Features
- All tables include auto-incrementing `id` column (SERIAL PRIMARY KEY)
- Date/time fields stored as TEXT for reliable import from various sources
- Composite unique constraints preserve original PlanetTogether key relationships
- Proper indexes on foreign key columns for query performance
- Ready for brewery manufacturing data import

## Data Type Conversions from SQL Server
- `nvarchar(max)` → `TEXT`
- `nvarchar(38)` → `VARCHAR(38)`
- `bigint` → `BIGINT`
- `int` → `INTEGER`
- `float` → `NUMERIC`
- `bit` → `BOOLEAN`
- `datetime` → `TEXT`

## Next Steps
1. Import brewery data from PlanetTogether
2. Create views for common queries
3. Build API endpoints for accessing PT Publish data
4. Integrate with existing application features