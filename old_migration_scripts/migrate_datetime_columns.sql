-- Migration Script: Convert PT Publish date/time columns from TEXT to TIMESTAMP
-- This script converts all date/time columns in PT Publish tables from TEXT to TIMESTAMP

BEGIN;

-- Show current status
SELECT 'Starting datetime column migration for PT Publish tables...' as status;

-- Convert all date/time columns to TIMESTAMP
-- Note: Using NULLIF to handle empty strings and preserve NULL values

ALTER TABLE pt_publish_capabilities ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_capacity_interval_resource_assignments ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_capacity_intervals ALTER COLUMN end_date_time TYPE TIMESTAMP USING NULLIF(end_date_time, '')::TIMESTAMP;
ALTER TABLE pt_publish_capacity_intervals ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_capacity_intervals ALTER COLUMN start_date_time TYPE TIMESTAMP USING NULLIF(start_date_time, '')::TIMESTAMP;
ALTER TABLE pt_publish_customers ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_departments ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_forecast_shipment_inventory_adjustments ALTER COLUMN adjustment_date TYPE TIMESTAMP USING NULLIF(adjustment_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_forecast_shipment_inventory_adjustments ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_forecast_shipments ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_forecast_shipments ALTER COLUMN required_date TYPE TIMESTAMP USING NULLIF(required_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_forecasts ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_inventories ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_items ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN anchor_start_date TYPE TIMESTAMP USING NULLIF(anchor_start_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN end_of_run_date TYPE TIMESTAMP USING NULLIF(end_of_run_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN jit_start_date TYPE TIMESTAMP USING NULLIF(jit_start_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN reported_end_of_run_date TYPE TIMESTAMP USING NULLIF(reported_end_of_run_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN reported_finish_date TYPE TIMESTAMP USING NULLIF(reported_finish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN reported_start_date TYPE TIMESTAMP USING NULLIF(reported_start_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN reported_start_of_processing_date TYPE TIMESTAMP USING NULLIF(reported_start_of_processing_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN scheduled_end_date TYPE TIMESTAMP USING NULLIF(scheduled_end_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN scheduled_end_of_run_date TYPE TIMESTAMP USING NULLIF(scheduled_end_of_run_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN scheduled_end_of_setup_date TYPE TIMESTAMP USING NULLIF(scheduled_end_of_setup_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activities ALTER COLUMN scheduled_start_date TYPE TIMESTAMP USING NULLIF(scheduled_start_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activity_inventory_adjustments ALTER COLUMN adjustment_date TYPE TIMESTAMP USING NULLIF(adjustment_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_activity_inventory_adjustments ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_material_supplying_activities ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_materials ALTER COLUMN latest_source_date_time TYPE TIMESTAMP USING NULLIF(latest_source_date_time, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_materials ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operation_attributes ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN commit_end_date TYPE TIMESTAMP USING NULLIF(commit_end_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN commit_start_date TYPE TIMESTAMP USING NULLIF(commit_start_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN dbr_jit_start_date TYPE TIMESTAMP USING NULLIF(dbr_jit_start_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN end_of_matl_post_proc_date TYPE TIMESTAMP USING NULLIF(end_of_matl_post_proc_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN end_of_resource_transfer_time_date TYPE TIMESTAMP USING NULLIF(end_of_resource_transfer_time_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN end_of_run_date TYPE TIMESTAMP USING NULLIF(end_of_run_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN hold_until_date_time TYPE TIMESTAMP USING NULLIF(hold_until_date_time, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN jit_start_date TYPE TIMESTAMP USING NULLIF(jit_start_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN latest_constraint_date TYPE TIMESTAMP USING NULLIF(latest_constraint_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN need_date TYPE TIMESTAMP USING NULLIF(need_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN reported_end_of_run_date TYPE TIMESTAMP USING NULLIF(reported_end_of_run_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN reported_finish_date TYPE TIMESTAMP USING NULLIF(reported_finish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN reported_start_date TYPE TIMESTAMP USING NULLIF(reported_start_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN reported_start_of_processing_date TYPE TIMESTAMP USING NULLIF(reported_start_of_processing_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN scheduled_end_date TYPE TIMESTAMP USING NULLIF(scheduled_end_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN scheduled_end_of_run_date TYPE TIMESTAMP USING NULLIF(scheduled_end_of_run_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN scheduled_end_of_setup_date TYPE TIMESTAMP USING NULLIF(scheduled_end_of_setup_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN scheduled_start_date TYPE TIMESTAMP USING NULLIF(scheduled_start_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN scheduled_start_of_setup_date TYPE TIMESTAMP USING NULLIF(scheduled_start_of_setup_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN start_of_matl_post_proc_date TYPE TIMESTAMP USING NULLIF(start_of_matl_post_proc_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_operations ALTER COLUMN start_of_resource_transfer_time_date TYPE TIMESTAMP USING NULLIF(start_of_resource_transfer_time_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_path_nodes ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_paths ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_product_deleted_demands ALTER COLUMN date_deleted TYPE TIMESTAMP USING NULLIF(date_deleted, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_product_deleted_demands ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_product_deleted_demands ALTER COLUMN required_date TYPE TIMESTAMP USING NULLIF(required_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_product_forecast_demands ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_product_forecast_demands ALTER COLUMN required_date TYPE TIMESTAMP USING NULLIF(required_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_product_sales_order_demands ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_product_sales_order_demands ALTER COLUMN required_date TYPE TIMESTAMP USING NULLIF(required_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_products ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_resources ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_status_changes ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_status_changes ALTER COLUMN status_change_date TYPE TIMESTAMP USING NULLIF(status_change_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_successor_jobs ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_job_successor_manufacturing_orders ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_jobs ALTER COLUMN entry_date TYPE TIMESTAMP USING NULLIF(entry_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_jobs ALTER COLUMN need_date_time TYPE TIMESTAMP USING NULLIF(need_date_time, '')::TIMESTAMP;
ALTER TABLE pt_publish_jobs ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_jobs ALTER COLUMN scheduled_end_date_time TYPE TIMESTAMP USING NULLIF(scheduled_end_date_time, '')::TIMESTAMP;
ALTER TABLE pt_publish_jobs ALTER COLUMN scheduled_start_date_time TYPE TIMESTAMP USING NULLIF(scheduled_start_date_time, '')::TIMESTAMP;
ALTER TABLE pt_publish_kpis ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_lots ALTER COLUMN expiration_date TYPE TIMESTAMP USING NULLIF(expiration_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_lots ALTER COLUMN production_date TYPE TIMESTAMP USING NULLIF(production_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_lots ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_manufacturing_orders ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_metrics ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_metrics ALTER COLUMN timestamp TYPE TIMESTAMP USING NULLIF(timestamp, '')::TIMESTAMP;
ALTER TABLE pt_publish_plants ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_product_rules ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_purchase_order_lines ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_purchase_order_lines ALTER COLUMN required_date TYPE TIMESTAMP USING NULLIF(required_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_purchase_orders ALTER COLUMN date_ordered TYPE TIMESTAMP USING NULLIF(date_ordered, '')::TIMESTAMP;
ALTER TABLE pt_publish_purchase_orders ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_purchases_to_stock ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_resource_blocks ALTER COLUMN end_date_time TYPE TIMESTAMP USING NULLIF(end_date_time, '')::TIMESTAMP;
ALTER TABLE pt_publish_resource_blocks ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_resource_blocks ALTER COLUMN start_date_time TYPE TIMESTAMP USING NULLIF(start_date_time, '')::TIMESTAMP;
ALTER TABLE pt_publish_resource_capabilities ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_resources ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_sales_order_lines ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_sales_orders ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_schedules ALTER COLUMN clock TYPE TIMESTAMP USING NULLIF(clock, '')::TIMESTAMP;
ALTER TABLE pt_publish_schedules ALTER COLUMN planning_horizon_end TYPE TIMESTAMP USING NULLIF(planning_horizon_end, '')::TIMESTAMP;
ALTER TABLE pt_publish_schedules ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_schedules ALTER COLUMN publish_horizon_end TYPE TIMESTAMP USING NULLIF(publish_horizon_end, '')::TIMESTAMP;
ALTER TABLE pt_publish_supply_allocation_rules ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_supply_allocations ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_system_data ALTER COLUMN export_date TYPE TIMESTAMP USING NULLIF(export_date, '')::TIMESTAMP;
ALTER TABLE pt_publish_warehouses ALTER COLUMN publish_date TYPE TIMESTAMP USING NULLIF(publish_date, '')::TIMESTAMP;

-- Additional columns that may have been missed (due date columns)
ALTER TABLE pt_publish_sales_orders ALTER COLUMN due_date TYPE TIMESTAMP USING NULLIF(due_date, '')::TIMESTAMP IF EXISTS;
ALTER TABLE pt_publish_sales_order_lines ALTER COLUMN due_date TYPE TIMESTAMP USING NULLIF(due_date, '')::TIMESTAMP IF EXISTS;

-- Verify the conversion
SELECT 
    COUNT(*) as total_datetime_columns,
    'Successfully converted to TIMESTAMP' as status
FROM information_schema.columns
WHERE table_name LIKE 'pt_publish_%'
AND (column_name LIKE '%date%' OR column_name LIKE '%time%')
AND data_type = 'timestamp without time zone';

COMMIT;

-- Show completion status
SELECT 'DateTime column migration completed successfully!' as status;