-- Convert PT Publish columns to proper PostgreSQL enum types
-- This script creates enum types and converts existing text columns

BEGIN;

-- ========================================
-- STEP 1: CREATE ENUM TYPES
-- ========================================

-- Status/State Enums
CREATE TYPE pt_production_status AS ENUM (
    'Not Started',
    'In Progress',
    'Completed',
    'On Hold',
    'Cancelled',
    'Setup',
    'Running',
    'Cleanup',
    'Quality Check'
);

CREATE TYPE pt_scheduled_status AS ENUM (
    'Unscheduled',
    'Scheduled',
    'In Progress',
    'Completed',
    'Late',
    'On Time',
    'Early',
    'Cancelled'
);

CREATE TYPE pt_material_status AS ENUM (
    'Available',
    'Reserved',
    'In Use',
    'Consumed',
    'Quarantine',
    'Released',
    'Expired',
    'Rejected'
);

-- Type Enums
CREATE TYPE pt_interval_type AS ENUM (
    'Shift',
    'Break',
    'Maintenance',
    'Overtime',
    'Holiday',
    'Weekend',
    'Regular',
    'Special'
);

CREATE TYPE pt_customer_type AS ENUM (
    'Regular',
    'Priority',
    'VIP',
    'Internal',
    'External',
    'Contract',
    'Spot',
    'Trial'
);

CREATE TYPE pt_item_type AS ENUM (
    'Finished Good',
    'Raw Material',
    'Semi-Finished',
    'Component',
    'Packaging',
    'Consumable',
    'Tool',
    'By-Product',
    'Co-Product'
);

CREATE TYPE pt_job_type AS ENUM (
    'Production',
    'Rework',
    'Maintenance',
    'Setup',
    'Cleaning',
    'Quality',
    'Trial',
    'Development'
);

CREATE TYPE pt_constraint_type AS ENUM (
    'Hard',
    'Soft',
    'Preference',
    'Optional',
    'Critical',
    'Warning'
);

CREATE TYPE pt_requirement_type AS ENUM (
    'Mandatory',
    'Optional',
    'Alternative',
    'Conditional',
    'Preferred',
    'Backup'
);

CREATE TYPE pt_split_type AS ENUM (
    'None',
    'Auto',
    'Manual',
    'Batch',
    'Quantity',
    'Time',
    'Resource'
);

CREATE TYPE pt_overlap_type AS ENUM (
    'None',
    'Start-Start',
    'Start-Finish',
    'Finish-Start',
    'Finish-Finish',
    'Partial',
    'Full'
);

CREATE TYPE pt_shift_type AS ENUM (
    'Day',
    'Night',
    'Evening',
    'Weekend',
    'Rotating',
    'Fixed',
    'Flexible',
    'On-Call'
);

CREATE TYPE pt_attribute_type AS ENUM (
    'String',
    'Number',
    'Boolean',
    'Date',
    'DateTime',
    'List',
    'Range',
    'Color'
);

CREATE TYPE pt_recur_type AS ENUM (
    'Daily',
    'Weekly',
    'Monthly',
    'Yearly',
    'Custom',
    'Weekdays',
    'Weekends',
    'BiWeekly'
);

CREATE TYPE pt_buffer_type AS ENUM (
    'None',
    'Time',
    'Quantity',
    'Percentage',
    'Fixed',
    'Dynamic',
    'Safety'
);

CREATE TYPE pt_capacity_type AS ENUM (
    'Finite',
    'Infinite',
    'Limited',
    'Flexible',
    'Fixed',
    'Variable'
);

CREATE TYPE pt_scenario_type AS ENUM (
    'Baseline',
    'What-If',
    'Optimistic',
    'Pessimistic',
    'Most-Likely',
    'Simulation',
    'Actual'
);

-- Code Enums (These might have more variety, so using common patterns)
CREATE TYPE pt_abc_code AS ENUM (
    'A',
    'B',
    'C',
    'D',
    'E',
    'Not Assigned'
);

CREATE TYPE pt_priority_level AS ENUM (
    'Critical',
    'High',
    'Medium',
    'Low',
    'None'
);

CREATE TYPE pt_cleanout_grade AS ENUM (
    '0',
    '1',
    '2',
    '3',
    '4',
    '5'
);

CREATE TYPE pt_reporting_level AS ENUM (
    'Summary',
    'Detail',
    'Exception',
    'All',
    'None'
);

CREATE TYPE pt_classification AS ENUM (
    'Standard',
    'Custom',
    'Special',
    'Emergency',
    'Routine',
    'Project'
);

-- ========================================
-- STEP 2: ALTER COLUMNS TO USE ENUM TYPES
-- ========================================

-- Function to safely convert text to enum
CREATE OR REPLACE FUNCTION safe_cast_to_enum(
    p_value text,
    p_enum_name text,
    p_default text
) RETURNS text AS $$
BEGIN
    IF p_value IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Check if value exists in enum
    IF EXISTS (
        SELECT 1 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = p_enum_name
        AND e.enumlabel = p_value
    ) THEN
        RETURN p_value;
    ELSE
        RETURN p_default;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Capacity Intervals
ALTER TABLE pt_publish_capacity_intervals 
ALTER COLUMN interval_type TYPE pt_interval_type 
USING CASE 
    WHEN interval_type IS NULL THEN NULL
    WHEN interval_type IN ('Shift', 'Break', 'Maintenance', 'Overtime', 'Holiday', 'Weekend', 'Regular', 'Special') 
    THEN interval_type::pt_interval_type
    ELSE 'Regular'::pt_interval_type
END;

-- Customers
ALTER TABLE pt_publish_customers 
ALTER COLUMN abc_code TYPE pt_abc_code 
USING CASE 
    WHEN abc_code IS NULL THEN NULL
    WHEN abc_code IN ('A', 'B', 'C', 'D', 'E') THEN abc_code::pt_abc_code
    ELSE 'Not Assigned'::pt_abc_code
END;

ALTER TABLE pt_publish_customers 
ALTER COLUMN customer_type TYPE pt_customer_type 
USING CASE 
    WHEN customer_type IS NULL THEN NULL
    WHEN customer_type IN ('Regular', 'Priority', 'VIP', 'Internal', 'External', 'Contract', 'Spot', 'Trial') 
    THEN customer_type::pt_customer_type
    ELSE 'Regular'::pt_customer_type
END;

-- Items
ALTER TABLE pt_publish_items 
ALTER COLUMN item_type TYPE pt_item_type 
USING CASE 
    WHEN item_type IS NULL THEN NULL
    WHEN item_type IN ('Finished Good', 'Raw Material', 'Semi-Finished', 'Component', 'Packaging', 'Consumable', 'Tool', 'By-Product', 'Co-Product') 
    THEN item_type::pt_item_type
    ELSE 'Component'::pt_item_type
END;

-- Job Activities
ALTER TABLE pt_publish_job_activities 
ALTER COLUMN production_status TYPE pt_production_status 
USING CASE 
    WHEN production_status IS NULL THEN NULL
    WHEN production_status IN ('Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled', 'Setup', 'Running', 'Cleanup', 'Quality Check') 
    THEN production_status::pt_production_status
    ELSE 'Not Started'::pt_production_status
END;

-- Jobs
ALTER TABLE pt_publish_jobs 
ALTER COLUMN scheduled_status TYPE pt_scheduled_status 
USING CASE 
    WHEN scheduled_status IS NULL THEN NULL
    WHEN scheduled_status IN ('Unscheduled', 'Scheduled', 'In Progress', 'Completed', 'Late', 'On Time', 'Early', 'Cancelled') 
    THEN scheduled_status::pt_scheduled_status
    ELSE 'Unscheduled'::pt_scheduled_status
END;

ALTER TABLE pt_publish_jobs 
ALTER COLUMN type TYPE pt_job_type 
USING CASE 
    WHEN type IS NULL THEN NULL
    WHEN type IN ('Production', 'Rework', 'Maintenance', 'Setup', 'Cleaning', 'Quality', 'Trial', 'Development') 
    THEN type::pt_job_type
    ELSE 'Production'::pt_job_type
END;

ALTER TABLE pt_publish_jobs 
ALTER COLUMN classification TYPE pt_classification 
USING CASE 
    WHEN classification IS NULL THEN NULL
    WHEN classification IN ('Standard', 'Custom', 'Special', 'Emergency', 'Routine', 'Project') 
    THEN classification::pt_classification
    ELSE 'Standard'::pt_classification
END;

-- Job Materials
ALTER TABLE pt_publish_job_materials 
ALTER COLUMN constraint_type TYPE pt_constraint_type 
USING CASE 
    WHEN constraint_type IS NULL THEN NULL
    WHEN constraint_type IN ('Hard', 'Soft', 'Preference', 'Optional', 'Critical', 'Warning') 
    THEN constraint_type::pt_constraint_type
    ELSE 'Soft'::pt_constraint_type
END;

ALTER TABLE pt_publish_job_materials 
ALTER COLUMN requirement_type TYPE pt_requirement_type 
USING CASE 
    WHEN requirement_type IS NULL THEN NULL
    WHEN requirement_type IN ('Mandatory', 'Optional', 'Alternative', 'Conditional', 'Preferred', 'Backup') 
    THEN requirement_type::pt_requirement_type
    ELSE 'Mandatory'::pt_requirement_type
END;

-- Job Operations
ALTER TABLE pt_publish_job_operations 
ALTER COLUMN material_status TYPE pt_material_status 
USING CASE 
    WHEN material_status IS NULL THEN NULL
    WHEN material_status IN ('Available', 'Reserved', 'In Use', 'Consumed', 'Quarantine', 'Released', 'Expired', 'Rejected') 
    THEN material_status::pt_material_status
    ELSE 'Available'::pt_material_status
END;

ALTER TABLE pt_publish_job_operations 
ALTER COLUMN auto_split_type TYPE pt_split_type 
USING CASE 
    WHEN auto_split_type IS NULL THEN NULL
    WHEN auto_split_type IN ('None', 'Auto', 'Manual', 'Batch', 'Quantity', 'Time', 'Resource') 
    THEN auto_split_type::pt_split_type
    ELSE 'None'::pt_split_type
END;

ALTER TABLE pt_publish_job_operations 
ALTER COLUMN setup_split_type TYPE pt_split_type 
USING CASE 
    WHEN setup_split_type IS NULL THEN NULL
    WHEN setup_split_type IN ('None', 'Auto', 'Manual', 'Batch', 'Quantity', 'Time', 'Resource') 
    THEN setup_split_type::pt_split_type
    ELSE 'None'::pt_split_type
END;

-- Job Path Nodes
ALTER TABLE pt_publish_job_path_nodes 
ALTER COLUMN overlap_type TYPE pt_overlap_type 
USING CASE 
    WHEN overlap_type IS NULL THEN NULL
    WHEN overlap_type IN ('None', 'Start-Start', 'Start-Finish', 'Finish-Start', 'Finish-Finish', 'Partial', 'Full') 
    THEN overlap_type::pt_overlap_type
    ELSE 'None'::pt_overlap_type
END;

-- Job Resource Block Intervals
ALTER TABLE pt_publish_job_resource_block_intervals 
ALTER COLUMN shift_type TYPE pt_shift_type 
USING CASE 
    WHEN shift_type IS NULL THEN NULL
    WHEN shift_type IN ('Day', 'Night', 'Evening', 'Weekend', 'Rotating', 'Fixed', 'Flexible', 'On-Call') 
    THEN shift_type::pt_shift_type
    ELSE 'Day'::pt_shift_type
END;

-- PT Attributes
ALTER TABLE pt_publish_pt_attributes 
ALTER COLUMN attribute_type TYPE pt_attribute_type 
USING CASE 
    WHEN attribute_type IS NULL THEN NULL
    WHEN attribute_type IN ('String', 'Number', 'Boolean', 'Date', 'DateTime', 'List', 'Range', 'Color') 
    THEN attribute_type::pt_attribute_type
    ELSE 'String'::pt_attribute_type
END;

-- Recurring Capacity Intervals
ALTER TABLE pt_publish_recurring_capacity_intervals 
ALTER COLUMN interval_type TYPE pt_interval_type 
USING CASE 
    WHEN interval_type IS NULL THEN NULL
    WHEN interval_type IN ('Shift', 'Break', 'Maintenance', 'Overtime', 'Holiday', 'Weekend', 'Regular', 'Special') 
    THEN interval_type::pt_interval_type
    ELSE 'Regular'::pt_interval_type
END;

ALTER TABLE pt_publish_recurring_capacity_intervals 
ALTER COLUMN recur_type TYPE pt_recur_type 
USING CASE 
    WHEN recur_type IS NULL THEN NULL
    WHEN recur_type IN ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom', 'Weekdays', 'Weekends', 'BiWeekly') 
    THEN recur_type::pt_recur_type
    ELSE 'Daily'::pt_recur_type
END;

-- Resources
ALTER TABLE pt_publish_resources 
ALTER COLUMN buffer_type TYPE pt_buffer_type 
USING CASE 
    WHEN buffer_type IS NULL THEN NULL
    WHEN buffer_type IN ('None', 'Time', 'Quantity', 'Percentage', 'Fixed', 'Dynamic', 'Safety') 
    THEN buffer_type::pt_buffer_type
    ELSE 'None'::pt_buffer_type
END;

ALTER TABLE pt_publish_resources 
ALTER COLUMN capacity_type TYPE pt_capacity_type 
USING CASE 
    WHEN capacity_type IS NULL THEN NULL
    WHEN capacity_type IN ('Finite', 'Infinite', 'Limited', 'Flexible', 'Fixed', 'Variable') 
    THEN capacity_type::pt_capacity_type
    ELSE 'Finite'::pt_capacity_type
END;

ALTER TABLE pt_publish_resources 
ALTER COLUMN reporting_level TYPE pt_reporting_level 
USING CASE 
    WHEN reporting_level IS NULL THEN NULL
    WHEN reporting_level IN ('Summary', 'Detail', 'Exception', 'All', 'None') 
    THEN reporting_level::pt_reporting_level
    ELSE 'Summary'::pt_reporting_level
END;

-- Sales Orders
ALTER TABLE pt_publish_sales_orders 
ALTER COLUMN abc_code TYPE pt_abc_code 
USING CASE 
    WHEN abc_code IS NULL THEN NULL
    WHEN abc_code IN ('A', 'B', 'C', 'D', 'E') THEN abc_code::pt_abc_code
    ELSE 'Not Assigned'::pt_abc_code
END;

-- Schedules
ALTER TABLE pt_publish_schedules 
ALTER COLUMN scenario_type TYPE pt_scenario_type 
USING CASE 
    WHEN scenario_type IS NULL THEN NULL
    WHEN scenario_type IN ('Baseline', 'What-If', 'Optimistic', 'Pessimistic', 'Most-Likely', 'Simulation', 'Actual') 
    THEN scenario_type::pt_scenario_type
    ELSE 'Baseline'::pt_scenario_type
END;

-- Clean up the helper function
DROP FUNCTION IF EXISTS safe_cast_to_enum(text, text, text);

-- ========================================
-- STEP 3: VERIFY CONVERSION
-- ========================================

-- Show all enum types created
SELECT 
    t.typname AS enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE 'pt_%'
GROUP BY t.typname
ORDER BY t.typname;

-- Show columns that now use enum types
SELECT 
    c.table_name,
    c.column_name,
    c.udt_name AS enum_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
AND c.table_name LIKE 'pt_publish_%'
AND c.udt_name LIKE 'pt_%'
ORDER BY c.table_name, c.column_name;

COMMIT;

-- Summary
SELECT 'PT Publish columns successfully converted to enum types!' AS status;