-- Migration script to handle operations table split
-- Step 1: Drop foreign key constraints that reference operations table

-- Drop constraints on disruptions table
ALTER TABLE disruptions DROP CONSTRAINT IF EXISTS disruptions_affected_operation_id_operations_id_fk;

-- Drop constraints on scheduling_results table  
ALTER TABLE scheduling_results DROP CONSTRAINT IF EXISTS scheduling_results_operation_id_operations_id_fk;

-- Drop constraints on scenario_operations table
ALTER TABLE scenario_operations DROP CONSTRAINT IF EXISTS scenario_operations_operation_id_operations_id_fk;

-- Step 2: Add new columns for discrete and process operations
ALTER TABLE disruptions ADD column IF NOT EXISTS affected_discrete_operation_id INTEGER;
ALTER TABLE disruptions ADD column IF NOT EXISTS affected_process_operation_id INTEGER;

ALTER TABLE scheduling_results ADD column IF NOT EXISTS discrete_operation_id INTEGER;
ALTER TABLE scheduling_results ADD column IF NOT EXISTS process_operation_id INTEGER;

ALTER TABLE scenario_operations ADD column IF NOT EXISTS discrete_operation_id INTEGER;
ALTER TABLE scenario_operations ADD column IF NOT EXISTS process_operation_id INTEGER;

-- Step 3: Migrate existing data (if operations table exists, copy to discrete_operations)
-- Note: This assumes we're treating existing operations as discrete operations
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'operations') THEN
        -- Copy data from operations to discrete_operations if discrete_operations table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'discrete_operations') THEN
            INSERT INTO discrete_operations 
            SELECT * FROM operations 
            ON CONFLICT (id) DO NOTHING;
            
            -- Update foreign key references
            UPDATE disruptions 
            SET affected_discrete_operation_id = affected_operation_id 
            WHERE affected_operation_id IS NOT NULL;
            
            UPDATE scheduling_results 
            SET discrete_operation_id = operation_id 
            WHERE operation_id IS NOT NULL;
            
            UPDATE scenario_operations 
            SET discrete_operation_id = operation_id 
            WHERE operation_id IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Step 4: Drop old columns
ALTER TABLE disruptions DROP COLUMN IF EXISTS affected_operation_id;
ALTER TABLE scheduling_results DROP COLUMN IF EXISTS operation_id;
ALTER TABLE scenario_operations DROP COLUMN IF EXISTS operation_id;

-- Step 5: Drop operations table if it exists
DROP TABLE IF EXISTS operations CASCADE;

-- Step 6: Add new foreign key constraints
ALTER TABLE disruptions ADD CONSTRAINT disruptions_affected_discrete_operation_id_fkey 
    FOREIGN KEY (affected_discrete_operation_id) REFERENCES discrete_operations(id);

ALTER TABLE disruptions ADD CONSTRAINT disruptions_affected_process_operation_id_fkey 
    FOREIGN KEY (affected_process_operation_id) REFERENCES process_operations(id);

ALTER TABLE scheduling_results ADD CONSTRAINT scheduling_results_discrete_operation_id_fkey 
    FOREIGN KEY (discrete_operation_id) REFERENCES discrete_operations(id);

ALTER TABLE scheduling_results ADD CONSTRAINT scheduling_results_process_operation_id_fkey 
    FOREIGN KEY (process_operation_id) REFERENCES process_operations(id);

ALTER TABLE scenario_operations ADD CONSTRAINT scenario_operations_discrete_operation_id_fkey 
    FOREIGN KEY (discrete_operation_id) REFERENCES discrete_operations(id);

ALTER TABLE scenario_operations ADD CONSTRAINT scenario_operations_process_operation_id_fkey 
    FOREIGN KEY (process_operation_id) REFERENCES process_operations(id);