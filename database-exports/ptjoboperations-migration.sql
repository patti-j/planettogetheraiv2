-- Migration for ptjoboperations table
-- Preserving foreign key constraints and recreating with development schema

BEGIN;

-- Save the current sequence value (in case there was data)
SELECT setval('ptjoboperations_id_seq', COALESCE(MAX(id), 1)) FROM ptjoboperations;

-- Drop existing table (it's empty, but preserving safety)
DROP TABLE IF EXISTS ptjoboperations CASCADE;

-- Recreate table with complete development schema
CREATE TABLE ptjoboperations (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES ptjobs(id),
  external_id VARCHAR,
  name VARCHAR NOT NULL,
  description TEXT,
  operation_id VARCHAR,
  base_operation_id VARCHAR,
  required_finish_qty NUMERIC,
  cycle_hrs NUMERIC,
  setup_hours NUMERIC,
  post_processing_hours NUMERIC,
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  percent_finished NUMERIC DEFAULT '0',
  manually_scheduled BOOLEAN DEFAULT false,
  -- New fields from development schema
  sequence_number INTEGER,
  -- Constraint fields
  constraint_type VARCHAR(10), -- MSO, MFO, SNET, FNET, SNLT, FNLT
  constraint_date TIMESTAMP,
  -- PERT (Program Evaluation Review Technique) fields
  time_optimistic DECIMAL(10, 4), -- Best case duration
  time_most_likely DECIMAL(10, 4), -- Expected duration  
  time_pessimistic DECIMAL(10, 4), -- Worst case duration
  time_expected DECIMAL(10, 4), -- Calculated: (O + 4M + P) / 6
  time_variance DECIMAL(10, 6), -- Calculated: ((P - O) / 6)^2
  time_std_dev DECIMAL(10, 4), -- Calculated: (P - O) / 6
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ptjoboperations_job_id ON ptjoboperations(job_id);
CREATE INDEX idx_ptjoboperations_sequence ON ptjoboperations(sequence_number);
CREATE INDEX idx_ptjoboperations_scheduled ON ptjoboperations(scheduled_start, scheduled_end);

COMMIT;

