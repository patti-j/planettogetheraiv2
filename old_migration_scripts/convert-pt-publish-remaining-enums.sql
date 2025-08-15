-- Convert remaining PT Publish columns to proper PostgreSQL enum types
-- This script handles the remaining columns that would benefit from enum conversion

BEGIN;

-- ========================================
-- STEP 1: CREATE ADDITIONAL ENUM TYPES
-- ========================================

-- Priority Class enum (for text priority columns)
CREATE TYPE pt_priority_class AS ENUM (
    'Urgent',
    'High',
    'Normal',
    'Low',
    'Deferred'
);

-- Secondary Priority Type enum
CREATE TYPE pt_secondary_priority_type AS ENUM (
    'FIFO',
    'LIFO',
    'EDD',
    'SPT',
    'LPT',
    'Critical Ratio',
    'Slack Time',
    'Custom'
);

-- Color Code enum (common color codes used in manufacturing)
CREATE TYPE pt_color_code AS ENUM (
    'Red',
    'Yellow',
    'Green',
    'Blue',
    'Orange',
    'Purple',
    'Black',
    'White',
    'Gray',
    'Custom'
);

-- ========================================
-- STEP 2: ALTER COLUMNS TO USE NEW ENUM TYPES
-- ========================================

-- Resources - secondary_priority_type
ALTER TABLE pt_publish_resources 
ALTER COLUMN secondary_priority_type TYPE pt_secondary_priority_type 
USING CASE 
    WHEN secondary_priority_type IS NULL THEN NULL
    WHEN secondary_priority_type IN ('FIFO', 'LIFO', 'EDD', 'SPT', 'LPT', 'Critical Ratio', 'Slack Time', 'Custom') 
    THEN secondary_priority_type::pt_secondary_priority_type
    ELSE 'FIFO'::pt_secondary_priority_type
END;

-- Sales Orders - priority_class
ALTER TABLE pt_publish_sales_orders 
ALTER COLUMN priority_class TYPE pt_priority_class 
USING CASE 
    WHEN priority_class IS NULL THEN NULL
    WHEN priority_class IN ('Urgent', 'High', 'Normal', 'Low', 'Deferred') 
    THEN priority_class::pt_priority_class
    ELSE 'Normal'::pt_priority_class
END;

-- Convert color_code columns where appropriate
-- Note: We'll only convert if the data allows it, otherwise keep as text

-- Check if color_code values in customers table can be converted
DO $$
DECLARE
    non_standard_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT color_code) INTO non_standard_count
    FROM pt_publish_customers
    WHERE color_code IS NOT NULL 
    AND color_code NOT IN ('Red', 'Yellow', 'Green', 'Blue', 'Orange', 'Purple', 'Black', 'White', 'Gray');
    
    IF non_standard_count = 0 THEN
        -- Safe to convert
        ALTER TABLE pt_publish_customers 
        ALTER COLUMN color_code TYPE pt_color_code 
        USING CASE 
            WHEN color_code IS NULL THEN NULL
            WHEN color_code IN ('Red', 'Yellow', 'Green', 'Blue', 'Orange', 'Purple', 'Black', 'White', 'Gray') 
            THEN color_code::pt_color_code
            ELSE 'Custom'::pt_color_code
        END;
    END IF;
END $$;

-- Check if color_code values in jobs table can be converted
DO $$
DECLARE
    non_standard_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT color_code) INTO non_standard_count
    FROM pt_publish_jobs
    WHERE color_code IS NOT NULL 
    AND color_code NOT IN ('Red', 'Yellow', 'Green', 'Blue', 'Orange', 'Purple', 'Black', 'White', 'Gray');
    
    IF non_standard_count = 0 THEN
        -- Safe to convert
        ALTER TABLE pt_publish_jobs 
        ALTER COLUMN color_code TYPE pt_color_code 
        USING CASE 
            WHEN color_code IS NULL THEN NULL
            WHEN color_code IN ('Red', 'Yellow', 'Green', 'Blue', 'Orange', 'Purple', 'Black', 'White', 'Gray') 
            THEN color_code::pt_color_code
            ELSE 'Custom'::pt_color_code
        END;
    END IF;
END $$;

-- ========================================
-- STEP 3: CREATE CHECK CONSTRAINTS FOR INTEGER PRIORITY COLUMNS
-- Instead of enums, we'll add constraints to ensure valid ranges
-- ========================================

-- Add check constraints for priority columns (typically 1-100 or 1-10)
ALTER TABLE pt_publish_customers 
    ADD CONSTRAINT chk_customer_priority CHECK (priority IS NULL OR priority BETWEEN 1 AND 100);

ALTER TABLE pt_publish_forecasts 
    ADD CONSTRAINT chk_forecast_priority CHECK (priority IS NULL OR priority BETWEEN 1 AND 100);

ALTER TABLE pt_publish_inventories 
    ADD CONSTRAINT chk_safety_stock_priority CHECK (safety_stock_job_priority IS NULL OR safety_stock_job_priority BETWEEN 1 AND 100);

ALTER TABLE pt_publish_jobs 
    ADD CONSTRAINT chk_job_priority CHECK (priority IS NULL OR priority BETWEEN 1 AND 100);

ALTER TABLE pt_publish_sales_orders 
    ADD CONSTRAINT chk_sales_order_priority CHECK (priority IS NULL OR priority BETWEEN 1 AND 100);

ALTER TABLE pt_publish_sales_orders 
    ADD CONSTRAINT chk_customer_priority CHECK (customer_priority IS NULL OR customer_priority BETWEEN 1 AND 100);

ALTER TABLE pt_publish_transfer_orders 
    ADD CONSTRAINT chk_transfer_order_priority CHECK (priority IS NULL OR priority BETWEEN 1 AND 100);

-- Add check constraints for grade columns (typically 0-5 or 1-10)
ALTER TABLE pt_publish_job_activities 
    ADD CONSTRAINT chk_clean_out_grade CHECK (clean_out_grade IS NULL OR clean_out_grade BETWEEN 0 AND 10);

ALTER TABLE pt_publish_job_activities 
    ADD CONSTRAINT chk_reported_cleanout_grade CHECK (reported_cleanout_grade IS NULL OR reported_cleanout_grade BETWEEN 0 AND 10);

-- Add check constraint for BOM level (typically 0-10)
ALTER TABLE pt_publish_job_material_supplying_activities 
    ADD CONSTRAINT chk_supply_bom_level CHECK (supply_bom_level IS NULL OR supply_bom_level BETWEEN 0 AND 20);

ALTER TABLE pt_publish_jobs 
    ADD CONSTRAINT chk_low_level_code CHECK (low_level_code IS NULL OR low_level_code BETWEEN 0 AND 20);

-- ========================================
-- STEP 4: VERIFY CONVERSION
-- ========================================

-- Show all new enum types created
SELECT 
    t.typname AS enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('pt_priority_class', 'pt_secondary_priority_type', 'pt_color_code')
GROUP BY t.typname
ORDER BY t.typname;

-- Show columns that now use enum types (should be 25-26 total)
SELECT COUNT(*) AS total_enum_columns
FROM information_schema.columns c
WHERE c.table_schema = 'public'
AND c.table_name LIKE 'pt_publish_%'
AND c.udt_name LIKE 'pt_%';

-- Show check constraints added
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_schema = cc.constraint_schema 
    AND tc.constraint_name = cc.constraint_name
WHERE tc.table_name LIKE 'pt_publish_%'
AND tc.constraint_type = 'CHECK'
AND tc.constraint_name LIKE 'chk_%'
ORDER BY tc.table_name, tc.constraint_name;

COMMIT;

-- Summary
SELECT 'Additional PT Publish columns converted and constraints added!' AS status;