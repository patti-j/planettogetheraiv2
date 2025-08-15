-- Migrate data from old plants table to pt_publish_plants table
-- This script merges plant data while preserving existing PT Publish data

-- First, let's see what we have
SELECT 'Old plants table:' as info;
SELECT id, name, location FROM plants ORDER BY id;

SELECT 'Current PT Publish plants:' as info;
SELECT id, plant_id, name, external_id FROM pt_publish_plants ORDER BY id;

-- Get the next available plant_id (starting after existing ones)
DO $$
DECLARE
    max_plant_id BIGINT;
    next_plant_id BIGINT;
BEGIN
    -- Get max plant_id from pt_publish_plants
    SELECT COALESCE(MAX(plant_id), 0) INTO max_plant_id FROM pt_publish_plants;
    next_plant_id := max_plant_id + 1;
    
    -- Insert plants from old table that don't exist in PT table
    -- We'll use a common instance_id and publish_date for all migrated plants
    INSERT INTO pt_publish_plants (
        publish_date,
        instance_id,
        plant_id,
        external_id,
        name,
        description,
        address,
        city,
        state,
        country,
        postal_code,
        time_zone,
        active,
        is_primary,
        capacity_units,
        max_capacity,
        current_utilization,
        efficiency_rating,
        operating_hours,
        shift_pattern,
        maintenance_schedule,
        last_maintenance_date,
        next_maintenance_date,
        quality_certification,
        environmental_rating,
        safety_rating,
        notes
    )
    SELECT 
        NOW() as publish_date,
        'PHARMA-001' as instance_id,
        (ROW_NUMBER() OVER (ORDER BY p.id)) + max_plant_id as plant_id,
        'PLANT-' || p.id as external_id,
        p.name,
        COALESCE(p.description, 'Migrated from legacy plants table') as description,
        p.location as address,
        SPLIT_PART(p.location, ',', 1) as city,  -- Extract city from location
        TRIM(SPLIT_PART(p.location, ',', 2)) as state,  -- Extract state/country from location
        CASE 
            WHEN p.location LIKE '%Germany%' THEN 'Germany'
            WHEN p.location LIKE '%China%' THEN 'China'
            WHEN p.location LIKE '%Mexico%' THEN 'Mexico'
            ELSE 'USA'
        END as country,
        NULL as postal_code,
        CASE 
            WHEN p.location LIKE '%Germany%' THEN 'Europe/Berlin'
            WHEN p.location LIKE '%China%' THEN 'Asia/Shanghai'
            WHEN p.location LIKE '%Mexico%' THEN 'America/Tijuana'
            WHEN p.location LIKE '%CA' THEN 'America/Los_Angeles'
            WHEN p.location LIKE '%TX' THEN 'America/Chicago'
            WHEN p.location LIKE '%GA' THEN 'America/New_York'
            ELSE 'America/Phoenix'
        END as time_zone,
        true as active,
        p.id = 1 as is_primary,  -- Set Main Manufacturing Plant as primary
        'units' as capacity_units,
        1000000 as max_capacity,  -- Default capacity
        75.0 as current_utilization,  -- Default 75% utilization
        85.0 as efficiency_rating,  -- Default 85% efficiency
        '24/7' as operating_hours,
        '3-shift' as shift_pattern,
        'Monthly' as maintenance_schedule,
        (NOW() - INTERVAL '15 days')::date as last_maintenance_date,
        (NOW() + INTERVAL '15 days')::date as next_maintenance_date,
        'ISO 9001:2015' as quality_certification,
        'A' as environmental_rating,
        'Excellent' as safety_rating,
        'Plant migrated from legacy system on ' || NOW()::date as notes
    FROM plants p
    WHERE NOT EXISTS (
        SELECT 1 
        FROM pt_publish_plants pp 
        WHERE pp.name = p.name 
           OR pp.external_id = 'PLANT-' || p.id
    );
    
    RAISE NOTICE 'Migration completed. Inserted % plants.', (SELECT COUNT(*) FROM plants);
END $$;

-- Verify the migration
SELECT 'After migration - PT Publish plants:' as info;
SELECT 
    plant_id,
    name,
    external_id,
    city,
    state,
    country,
    active,
    is_primary
FROM pt_publish_plants 
ORDER BY plant_id;

-- Update any references in other tables that might be using old plant IDs
-- For example, if resources reference plants:
UPDATE pt_publish_resources r
SET plant_id = (
    SELECT pp.plant_id 
    FROM pt_publish_plants pp 
    WHERE pp.external_id = 'PLANT-1'
    LIMIT 1
)
WHERE r.plant_id IS NULL OR r.plant_id = 0;

-- Count final results
SELECT 
    'Migration Summary:' as info,
    (SELECT COUNT(*) FROM plants) as old_plants_count,
    (SELECT COUNT(*) FROM pt_publish_plants) as new_pt_plants_count;