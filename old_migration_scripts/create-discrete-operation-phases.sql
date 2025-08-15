-- Create discrete_operation_phases table
CREATE TABLE IF NOT EXISTS discrete_operation_phases (
    id SERIAL PRIMARY KEY,
    discrete_operation_id INTEGER NOT NULL REFERENCES discrete_operations(id),
    phase_type TEXT CHECK (phase_type IN ('setup', 'run', 'cleanup', 'inspection', 'changeover', 'maintenance')) NOT NULL,
    phase_name TEXT NOT NULL,
    description TEXT,
    sequence_number INTEGER NOT NULL,
    standard_duration INTEGER NOT NULL, 
    actual_duration INTEGER,
    status TEXT CHECK (status IN ('pending', 'active', 'completed', 'skipped', 'on_hold')) NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    scheduled_start_time TIMESTAMP,
    scheduled_end_time TIMESTAMP,
    resource_requirements JSONB,
    skill_requirements TEXT[],
    instructions TEXT,
    quality_checkpoints JSONB,
    completion_criteria TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS discrete_operation_phases_discrete_operation_idx ON discrete_operation_phases(discrete_operation_id);
CREATE INDEX IF NOT EXISTS discrete_operation_phases_sequence_idx ON discrete_operation_phases(discrete_operation_id, sequence_number);
