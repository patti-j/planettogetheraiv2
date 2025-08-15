-- Add additional columns from old plants table to pt_publish_plants
ALTER TABLE pt_publish_plants
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8),
ADD COLUMN IF NOT EXISTS plant_type TEXT DEFAULT 'manufacturing',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS capacity JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS operational_metrics JSONB DEFAULT '{}';

-- Migrate data from old plants table to pt_publish_plants
-- First, insert new records for plants that don't exist
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
    timezone,
    latitude,
    longitude,
    plant_type,
    is_active,
    capacity,
    operational_metrics,
    notes
)
SELECT 
    NOW() as publish_date,
    'PHARMA-001' as instance_id,
    (ROW_NUMBER() OVER (ORDER BY p.id)) + (SELECT COALESCE(MAX(plant_id), 0) FROM pt_publish_plants) as plant_id,
    'PLANT-' || p.id as external_id,
    p.name,
    'Migrated from legacy plants table' as description,
    p.address,
    p.city,
    p.state,
    p.country,
    p.postal_code,
    p.timezone,
    p.latitude,
    p.longitude,
    p.plant_type,
    p.is_active,
    p.capacity,
    p.operational_metrics,
    'Plant migrated on ' || NOW()::date as notes
FROM plants p
WHERE NOT EXISTS (
    SELECT 1 
    FROM pt_publish_plants pp 
    WHERE pp.name = p.name
);

-- Update existing PT plants with location data if they match by name
UPDATE pt_publish_plants pp
SET 
    address = COALESCE(pp.address, p.address),
    city = COALESCE(pp.city, p.city),
    state = COALESCE(pp.state, p.state),
    country = COALESCE(pp.country, p.country),
    postal_code = COALESCE(pp.postal_code, p.postal_code),
    timezone = COALESCE(pp.timezone, p.timezone),
    latitude = COALESCE(pp.latitude, p.latitude),
    longitude = COALESCE(pp.longitude, p.longitude),
    plant_type = COALESCE(pp.plant_type, p.plant_type),
    is_active = COALESCE(pp.is_active, p.is_active),
    capacity = COALESCE(pp.capacity, p.capacity),
    operational_metrics = COALESCE(pp.operational_metrics, p.operational_metrics)
FROM plants p
WHERE pp.name LIKE '%' || SPLIT_PART(p.name, ' ', 1) || '%'
   OR p.name LIKE '%' || SPLIT_PART(pp.name, ' ', 1) || '%';

-- Verify the migration
SELECT 
    'PT Publish Plants After Migration' as status,
    COUNT(*) as total_plants,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as plants_with_address,
    COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as plants_with_coordinates
FROM pt_publish_plants;

-- Show the migrated data
SELECT 
    plant_id,
    name,
    city,
    state,
    country,
    timezone,
    is_active,
    plant_type
FROM pt_publish_plants
ORDER BY plant_id;

-- Drop the old plants table (no longer needed)
DROP TABLE IF EXISTS plants CASCADE;

-- Rename master_production_schedule table to preserve it
ALTER TABLE IF EXISTS master_production_schedule 
RENAME TO pt_master_production_schedule_legacy;

-- Verify the rename
SELECT 
    'Tables after migration:' as info,
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%plant%' OR table_name LIKE '%master_production%')
ORDER BY table_name;