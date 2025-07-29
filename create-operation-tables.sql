-- Create the discrete_operations table
CREATE TABLE IF NOT EXISTS discrete_operations (
    id SERIAL PRIMARY KEY,
    production_order_id INTEGER REFERENCES production_orders(id),
    sequence_number INTEGER,
    operation_name TEXT NOT NULL,
    description TEXT,
    work_center_id INTEGER,
    assigned_resource_id INTEGER REFERENCES resources(id),
    standard_duration INTEGER,
    actual_duration INTEGER,
    setup_time INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'planned',
    priority INTEGER DEFAULT 5,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    scheduled_start_date TIMESTAMP,
    scheduled_end_date TIMESTAMP,
    completion_percentage INTEGER DEFAULT 0,
    quality_check_required BOOLEAN DEFAULT false,
    quality_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create the process_operations table  
CREATE TABLE IF NOT EXISTS process_operations (
    id SERIAL PRIMARY KEY,
    production_order_id INTEGER REFERENCES production_orders(id),
    recipe_phase_id INTEGER,
    sequence_number INTEGER,
    operation_name TEXT NOT NULL,
    description TEXT,
    assigned_resource_id INTEGER REFERENCES resources(id),
    standard_duration INTEGER,
    actual_duration INTEGER,
    setup_time INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'planned',
    priority INTEGER DEFAULT 5,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    scheduled_start_date TIMESTAMP,
    scheduled_end_date TIMESTAMP,
    completion_percentage INTEGER DEFAULT 0,
    quality_check_required BOOLEAN DEFAULT false,
    quality_status TEXT DEFAULT 'pending',
    temperature NUMERIC,
    pressure NUMERIC,
    ph_level NUMERIC,
    batch_size NUMERIC,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create the recipe_phases table referenced by process operations
CREATE TABLE IF NOT EXISTS recipe_phases (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER,
    phase_number INTEGER NOT NULL,
    phase_name TEXT NOT NULL,
    description TEXT,
    duration INTEGER,
    temperature NUMERIC,
    pressure NUMERIC,
    ph_level NUMERIC,
    instructions TEXT,
    quality_parameters JSONB DEFAULT '{}'::jsonb,
    equipment_required TEXT[],
    material_additions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints for discrete operations
ALTER TABLE discrete_operations ADD CONSTRAINT discrete_operations_work_center_id_fkey 
    FOREIGN KEY (work_center_id) REFERENCES work_centers(id);

-- Add foreign key constraints for process operations  
ALTER TABLE process_operations ADD CONSTRAINT process_operations_recipe_phase_id_fkey 
    FOREIGN KEY (recipe_phase_id) REFERENCES recipe_phases(id);

-- Add foreign key constraints for recipe phases
ALTER TABLE recipe_phases ADD CONSTRAINT recipe_phases_recipe_id_fkey 
    FOREIGN KEY (recipe_id) REFERENCES recipes(id);

-- Update resource_requirements table to reference both operation types
ALTER TABLE resource_requirements DROP CONSTRAINT IF EXISTS resource_requirements_operation_id_fkey;
ALTER TABLE resource_requirements ADD COLUMN IF NOT EXISTS discrete_operation_id INTEGER;
ALTER TABLE resource_requirements ADD COLUMN IF NOT EXISTS process_operation_id INTEGER;
ALTER TABLE resource_requirements ADD CONSTRAINT resource_requirements_discrete_operation_id_fkey 
    FOREIGN KEY (discrete_operation_id) REFERENCES discrete_operations(id);
ALTER TABLE resource_requirements ADD CONSTRAINT resource_requirements_process_operation_id_fkey 
    FOREIGN KEY (process_operation_id) REFERENCES process_operations(id);

-- Update dependencies table to reference both operation types
ALTER TABLE dependencies DROP CONSTRAINT IF EXISTS dependencies_from_operation_id_operations_id_fk;
ALTER TABLE dependencies DROP CONSTRAINT IF EXISTS dependencies_to_operation_id_operations_id_fk;
ALTER TABLE dependencies ADD COLUMN IF NOT EXISTS from_discrete_operation_id INTEGER;
ALTER TABLE dependencies ADD COLUMN IF NOT EXISTS to_discrete_operation_id INTEGER;
ALTER TABLE dependencies ADD COLUMN IF NOT EXISTS from_process_operation_id INTEGER;
ALTER TABLE dependencies ADD COLUMN IF NOT EXISTS to_process_operation_id INTEGER;
ALTER TABLE dependencies ADD CONSTRAINT dependencies_from_discrete_operation_id_fkey 
    FOREIGN KEY (from_discrete_operation_id) REFERENCES discrete_operations(id);
ALTER TABLE dependencies ADD CONSTRAINT dependencies_to_discrete_operation_id_fkey 
    FOREIGN KEY (to_discrete_operation_id) REFERENCES discrete_operations(id);
ALTER TABLE dependencies ADD CONSTRAINT dependencies_from_process_operation_id_fkey 
    FOREIGN KEY (from_process_operation_id) REFERENCES process_operations(id);
ALTER TABLE dependencies ADD CONSTRAINT dependencies_to_process_operation_id_fkey 
    FOREIGN KEY (to_process_operation_id) REFERENCES process_operations(id);

-- Drop old operation_id columns from dependencies
ALTER TABLE dependencies DROP COLUMN IF EXISTS from_operation_id;
ALTER TABLE dependencies DROP COLUMN IF EXISTS to_operation_id;
ALTER TABLE resource_requirements DROP COLUMN IF EXISTS operation_id;