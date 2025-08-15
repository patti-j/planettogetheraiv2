-- Safe Migration Script: Convert PT Publish date/time columns from TEXT to TIMESTAMP
-- This script only converts columns that actually exist

BEGIN;

-- Show current status
SELECT 'Starting safe datetime column migration for PT Publish tables...' as status;

-- Create a function to safely alter columns if they exist
CREATE OR REPLACE FUNCTION safe_alter_column_to_timestamp(p_table_name text, p_column_name text) 
RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        WHERE c.table_name = p_table_name 
        AND c.column_name = p_column_name
        AND c.data_type = 'text'
    ) THEN
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE TIMESTAMP USING NULLIF(%I, '''')::TIMESTAMP', 
                       p_table_name, p_column_name, p_column_name);
        RAISE NOTICE 'Converted %.% to TIMESTAMP', p_table_name, p_column_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Convert all existing date/time columns
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT DISTINCT table_name, column_name
        FROM information_schema.columns
        WHERE table_name LIKE 'pt_publish_%'
        AND (column_name LIKE '%date%' OR column_name LIKE '%time%')
        AND data_type = 'text'
        ORDER BY table_name, column_name
    LOOP
        PERFORM safe_alter_column_to_timestamp(r.table_name, r.column_name);
    END LOOP;
END $$;

-- Drop the helper function
DROP FUNCTION IF EXISTS safe_alter_column_to_timestamp(text, text);

-- Verify the conversion
SELECT 
    COUNT(*) as total_datetime_columns,
    'Successfully converted to TIMESTAMP' as status
FROM information_schema.columns
WHERE table_name LIKE 'pt_publish_%'
AND (column_name LIKE '%date%' OR column_name LIKE '%time%')
AND data_type = 'timestamp without time zone';

-- Show which columns were converted
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name LIKE 'pt_publish_%'
AND (column_name LIKE '%date%' OR column_name LIKE '%time%')
AND data_type = 'timestamp without time zone'
ORDER BY table_name, column_name
LIMIT 20;

COMMIT;

-- Show completion status
SELECT 'Safe DateTime column migration completed successfully!' as status;