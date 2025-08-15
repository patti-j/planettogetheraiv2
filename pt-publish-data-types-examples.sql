-- PT Publish Tables Data Type Examples
-- Showing all PostgreSQL data types used in the 61 tables

-- 1. SERIAL (Auto-incrementing integer for primary keys)
-- Example from pt_publish_jobs table:
INSERT INTO pt_publish_jobs (publish_date, instance_id, job_id, name) 
VALUES ('2025-08-15', '{550e8400-e29b-41d4-a716-446655440000}', 1001, 'Brew Batch #245');
-- The 'id' column auto-increments: 1, 2, 3, 4...

-- 2. TEXT (Variable-length character data)
-- Used for: names, descriptions, notes, external IDs, dates/times
INSERT INTO pt_publish_items (publish_date, instance_id, item_id, name, description, notes)
VALUES ('2025-08-15', '{550e8400-e29b-41d4-a716-446655440000}', 5001, 
        'Premium Lager', 
        'Our flagship premium lager beer with crisp, refreshing taste',
        'Best seller in summer months. Requires 4-week fermentation.');

-- 3. VARCHAR(n) (Fixed maximum length character data)
-- Used for: instance_id (38 chars), operation_code (256 chars)
INSERT INTO pt_publish_product_rules (publish_date, instance_id, item_id, plant_id, department_id, resource_id, operation_code)
VALUES ('2025-08-15', '{550e8400-e29b-41d4-a716-446655440000}', 5001, 1, 10, 100, 'BREW-FERM-001');

-- 4. BIGINT (Large integer values)
-- Used for: IDs, foreign keys, counts
INSERT INTO pt_publish_manufacturing_orders (publish_date, instance_id, job_id, manufacturing_order_id, current_path_id, cycles)
VALUES ('2025-08-15', '{550e8400-e29b-41d4-a716-446655440000}', 1001, 2001, 3001, 9999999999);

-- 5. INTEGER (Standard integer values)
-- Used for: priorities, counts, percentages, sequence numbers
INSERT INTO pt_publish_customers (publish_date, instance_id, customer_id, priority, resource_count)
VALUES ('2025-08-15', '{550e8400-e29b-41d4-a716-446655440000}', 7001, 1, 25);

-- 6. NUMERIC (Decimal numbers with precision)
-- Used for: quantities, costs, hours, percentages, measurements
INSERT INTO pt_publish_inventories (
    publish_date, instance_id, inventory_id, item_id, warehouse_id,
    lead_time_days, buffer_stock, safety_stock, on_hand_qty, buffer_penetration_percent
)
VALUES (
    '2025-08-15', '{550e8400-e29b-41d4-a716-446655440000}', 8001, 5001, 9001,
    7.5,        -- lead_time_days (decimal days)
    1000.75,    -- buffer_stock (decimal quantity)
    500.25,     -- safety_stock (decimal quantity)
    2500.50,    -- on_hand_qty (decimal quantity)
    45.67       -- buffer_penetration_percent (decimal percentage)
);

-- 7. BOOLEAN (True/False values)
-- Used for: flags, status indicators
INSERT INTO pt_publish_resources (
    publish_date, instance_id, plant_id, department_id, resource_id,
    active, bottleneck, constrained_resource, clean_between_batches, tank, pacemaker, dbr_constraint
)
VALUES (
    '2025-08-15', '{550e8400-e29b-41d4-a716-446655440000}', 1, 10, 100,
    TRUE,   -- active
    FALSE,  -- bottleneck
    TRUE,   -- constrained_resource
    TRUE,   -- clean_between_batches
    FALSE,  -- tank
    TRUE,   -- pacemaker
    FALSE   -- dbr_constraint
);

-- Complex example showing multiple data types in one table
INSERT INTO pt_publish_job_activities (
    -- Auto-increment ID (SERIAL)
    -- id is auto-generated
    
    -- TEXT fields for dates and strings
    publish_date, instance_id, external_id, production_status, locked,
    scheduled_start_date, scheduled_end_date,
    
    -- BIGINT fields for IDs
    job_id, manufacturing_order_id, operation_id, activity_id,
    
    -- NUMERIC fields for measurements
    required_finish_qty, reported_good_qty, reported_scrap_qty,
    scheduled_setup_hours, scheduled_run_hours, labor_cost, machine_cost,
    
    -- INTEGER fields for counts and percentages
    reported_cleanout_grade, percent_finished, split_id,
    
    -- BOOLEAN fields for flags
    zero_length, anchored, finished_internally, paused, scheduled, started, batched
)
VALUES (
    -- TEXT values
    '2025-08-15', '{550e8400-e29b-41d4-a716-446655440000}', 'EXT-ACT-001', 'In Progress', 'None',
    '2025-08-15 08:00:00', '2025-08-15 16:00:00',
    
    -- BIGINT values
    1001, 2001, 3001, 4001,
    
    -- NUMERIC values
    1000.50, 950.25, 10.25,
    0.5, 7.5, 125.50, 450.75,
    
    -- INTEGER values
    3, 95, 1,
    
    -- BOOLEAN values
    FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE
);

-- Data Type Summary:
-- 1. SERIAL       - Auto-incrementing primary keys (all 61 tables have 'id SERIAL PRIMARY KEY')
-- 2. TEXT         - Unlimited length text (names, descriptions, notes, dates stored as text)
-- 3. VARCHAR(38)  - Instance IDs (GUIDs)
-- 4. VARCHAR(256) - Operation codes
-- 5. BIGINT       - Large integers (IDs, foreign keys, large counts)
-- 6. INTEGER      - Standard integers (priorities, percentages, small counts)
-- 7. NUMERIC      - Decimal numbers (quantities, costs, hours, measurements)
-- 8. BOOLEAN      - True/False flags (status indicators, configuration flags)

-- Original SQL Server → PostgreSQL conversions:
-- nvarchar(max) → TEXT
-- nvarchar(38)  → VARCHAR(38)
-- nvarchar(256) → VARCHAR(256)
-- bigint        → BIGINT
-- int           → INTEGER
-- float         → NUMERIC
-- bit           → BOOLEAN
-- datetime      → TEXT (for import flexibility)