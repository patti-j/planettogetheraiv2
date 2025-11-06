-- Create missing PT tables based on development schema
BEGIN;

-- 1. ptResourceCapabilities table
CREATE TABLE IF NOT EXISTS ptresourcecapabilities (
  id SERIAL PRIMARY KEY,
  publish_date TIMESTAMP NOT NULL,
  instance_id VARCHAR(38) NOT NULL,
  resource_id INTEGER,
  capability_id INTEGER,
  throughput_modifier NUMERIC,
  setup_hours_override NUMERIC,
  use_throughput_modifier BOOLEAN,
  use_setup_hours_override BOOLEAN
);

-- 2. pt_product_wheels table
CREATE TABLE IF NOT EXISTS pt_product_wheels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  resource_id INTEGER REFERENCES ptresources(id) NOT NULL,
  plant_id INTEGER REFERENCES ptplants(id) NOT NULL,
  
  -- Wheel configuration
  cycle_duration_hours NUMERIC NOT NULL,
  changeover_matrix JSONB,
  optimization_rules JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'draft',
  
  -- Metadata
  created_by INTEGER REFERENCES users(id),
  last_modified_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. pt_product_wheel_segments table
CREATE TABLE IF NOT EXISTS pt_product_wheel_segments (
  id SERIAL PRIMARY KEY,
  wheel_id INTEGER REFERENCES pt_product_wheels(id) NOT NULL,
  
  -- Segment details
  sequence_number INTEGER NOT NULL,
  product_id INTEGER,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100),
  
  -- Timing
  allocated_hours NUMERIC NOT NULL,
  min_batch_size NUMERIC,
  max_batch_size NUMERIC,
  target_batch_size NUMERIC,
  
  -- Visual
  color_code VARCHAR(7),
  
  -- Changeover
  changeover_from_previous NUMERIC,
  setup_time NUMERIC,
  cleaning_time NUMERIC,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. pt_product_wheel_schedule table
CREATE TABLE IF NOT EXISTS pt_product_wheel_schedule (
  id SERIAL PRIMARY KEY,
  wheel_id INTEGER REFERENCES pt_product_wheels(id) NOT NULL,
  
  -- Schedule instance
  cycle_number INTEGER NOT NULL,
  planned_start_date TIMESTAMP NOT NULL,
  planned_end_date TIMESTAMP NOT NULL,
  actual_start_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'scheduled',
  current_segment_id INTEGER REFERENCES pt_product_wheel_segments(id),
  completed_segments INTEGER DEFAULT 0,
  
  -- Performance
  adherence_percentage NUMERIC,
  total_changeover_time NUMERIC,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pt_product_wheels_resource ON pt_product_wheels(resource_id);
CREATE INDEX IF NOT EXISTS idx_pt_product_wheels_plant ON pt_product_wheels(plant_id);
CREATE INDEX IF NOT EXISTS idx_pt_product_wheel_segments_wheel ON pt_product_wheel_segments(wheel_id);
CREATE INDEX IF NOT EXISTS idx_pt_product_wheel_schedule_wheel ON pt_product_wheel_schedule(wheel_id);
CREATE INDEX IF NOT EXISTS idx_pt_product_wheel_schedule_status ON pt_product_wheel_schedule(status);

COMMIT;
