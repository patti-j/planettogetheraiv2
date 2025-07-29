-- Migration: Rename ingredients table to formulations and update all references
-- This migration renames the table and all column references consistently

-- Step 1: Rename the ingredients table to formulations
ALTER TABLE ingredients RENAME TO formulations;

-- Step 2: Rename the column names to match formulation terminology
ALTER TABLE formulations RENAME COLUMN ingredient_number TO formulation_number;
ALTER TABLE formulations RENAME COLUMN ingredient_name TO formulation_name;
ALTER TABLE formulations RENAME COLUMN ingredient_type TO formulation_type;

-- Step 3: Update the foreign key column in material_requirements table
ALTER TABLE material_requirements RENAME COLUMN ingredient_id TO formulation_id;

-- Step 4: Update the substitute column in material_requirements
ALTER TABLE material_requirements RENAME COLUMN substitute_ingredients TO substitute_formulations;

-- Step 5: Rename sequence if it exists (PostgreSQL auto-creates sequences for serial columns)
ALTER SEQUENCE IF EXISTS ingredients_id_seq RENAME TO formulations_id_seq;

-- Step 6: Update any indexes that reference the old table name
-- Note: PostgreSQL typically updates indexes automatically when renaming tables, but let's be explicit
DROP INDEX IF EXISTS ingredients_ingredient_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS formulations_formulation_number_key ON formulations(formulation_number);

COMMIT;