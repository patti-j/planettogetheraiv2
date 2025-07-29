-- Add recipe_id column to process_operations table
-- This establishes the required many-to-one relationship between process operations and recipes

-- Add the recipe_id column with foreign key constraint
ALTER TABLE process_operations 
ADD COLUMN IF NOT EXISTS recipe_id INTEGER REFERENCES recipes(id);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS process_operations_recipe_id_idx ON process_operations(recipe_id);

-- Update existing process operations to have recipe_id if possible
-- For now, we'll set it to NULL since we need proper data assignment logic
-- This will be handled by the application when creating new process operations

-- Optionally, you could populate with sample data like this:
-- UPDATE process_operations SET recipe_id = 1 WHERE id <= 10;
-- UPDATE process_operations SET recipe_id = 2 WHERE id > 10;

COMMIT;