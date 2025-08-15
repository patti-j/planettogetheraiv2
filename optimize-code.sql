-- Create indexes for better query performance on PT tables
CREATE INDEX IF NOT EXISTS idx_ptjobs_status ON ptjobs(status);
CREATE INDEX IF NOT EXISTS idx_ptjobs_plant_id ON ptjobs(plant_id);
CREATE INDEX IF NOT EXISTS idx_ptjoboperations_job_id ON ptjoboperations(job_id);
CREATE INDEX IF NOT EXISTS idx_ptjoboperations_resource_id ON ptjoboperations(resource_id);
CREATE INDEX IF NOT EXISTS idx_ptjobactivities_job_operation_id ON ptjobactivities(job_operation_id);
CREATE INDEX IF NOT EXISTS idx_ptresources_plant_id ON ptresources(plant_id);
CREATE INDEX IF NOT EXISTS idx_ptresources_resource_type ON ptresources(resource_type);

-- Analyze tables for query optimization
ANALYZE ptjobs;
ANALYZE ptjoboperations;
ANALYZE ptjobactivities;
ANALYZE ptresources;
ANALYZE ptcustomers;
ANALYZE ptsalesorders;
ANALYZE ptmetrics;

SELECT 'Indexes created and tables analyzed' as status;
