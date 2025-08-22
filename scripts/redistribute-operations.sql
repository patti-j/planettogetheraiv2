-- Script to redistribute operations across departments without overlaps
-- This script will assign operations sequentially to each department

WITH departments AS (
  SELECT external_id, ROW_NUMBER() OVER (ORDER BY external_id) as dept_num
  FROM ptdepartments
  ORDER BY external_id
),
operations_with_duration AS (
  SELECT 
    id,
    job_id,
    operation_id,
    name,
    description,
    COALESCE(CAST(setup_hours AS NUMERIC), 1) + 
    COALESCE(CAST(run_hrs AS NUMERIC), 3) + 
    COALESCE(CAST(post_processing_hours AS NUMERIC), 0.5) as total_hours,
    notes,
    publish_date,
    ROW_NUMBER() OVER (ORDER BY id) as op_num
  FROM ptjoboperations
),
operation_assignments AS (
  SELECT 
    o.id,
    o.job_id,
    o.operation_id,
    o.name,
    o.description,
    o.total_hours,
    o.notes,
    o.publish_date,
    o.op_num,
    d.external_id as new_dept,
    -- Assign operations to departments in round-robin fashion
    MOD(o.op_num - 1, 20) + 1 as assigned_dept_num,
    -- Calculate cumulative hours for each department
    SUM(o.total_hours) OVER (
      PARTITION BY MOD(o.op_num - 1, 20) + 1 
      ORDER BY o.op_num 
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as cumulative_hours
  FROM operations_with_duration o
  CROSS JOIN departments d
  WHERE d.dept_num = MOD(o.op_num - 1, 20) + 1
),
scheduled_operations AS (
  SELECT 
    id,
    job_id,
    operation_id,
    name,
    description,
    new_dept,
    total_hours,
    notes,
    publish_date,
    -- Start each operation after the previous one on the same department
    -- Start date: Aug 22, 2025 8:00 AM + cumulative hours from previous operations
    TIMESTAMP '2025-08-22 08:00:00' + 
      INTERVAL '1 hour' * (cumulative_hours - total_hours) as new_start,
    -- End date: start + duration
    TIMESTAMP '2025-08-22 08:00:00' + 
      INTERVAL '1 hour' * cumulative_hours as new_end
  FROM operation_assignments
)
UPDATE ptjoboperations jo
SET 
  scheduled_primary_work_center_external_id = so.new_dept,
  scheduled_start = so.new_start,
  scheduled_end = so.new_end
FROM scheduled_operations so
WHERE jo.id = so.id;