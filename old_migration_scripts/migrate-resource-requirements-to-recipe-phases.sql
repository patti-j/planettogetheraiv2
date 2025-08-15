-- Migration: Update resource_requirements to link directly to recipe_phases (many-to-one relationship)
-- This removes the many-to-many junction table approach and establishes direct relationship

-- Step 1: Add recipe_phase_id column to resource_requirements table
ALTER TABLE resource_requirements 
ADD COLUMN recipe_phase_id INTEGER REFERENCES recipe_phases(id);

-- Step 2: Remove old operation references (if they exist)
-- Note: These columns may not exist if schema was already updated
ALTER TABLE resource_requirements 
DROP COLUMN IF EXISTS discrete_operation_id,
DROP COLUMN IF EXISTS process_operation_id;

-- Step 3: Drop the junction table since we're now using direct many-to-one relationship
-- Note: This will remove any existing many-to-many relationships
DROP TABLE IF EXISTS recipe_phase_resource_requirements;

-- Step 4: Create index for performance on the new foreign key
CREATE INDEX IF NOT EXISTS resource_requirements_recipe_phase_idx 
ON resource_requirements(recipe_phase_id);

-- Step 5: Make recipe_phase_id NOT NULL after data migration (if needed)
-- ALTER TABLE resource_requirements ALTER COLUMN recipe_phase_id SET NOT NULL;

COMMIT;