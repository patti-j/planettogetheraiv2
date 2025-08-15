-- Since we CANNOT modify PT Publish tables (critical constraint),
-- we'll create an extension table to store additional plant data

-- Create extension table for additional plant attributes
CREATE TABLE IF NOT EXISTS plant_extensions (
    id SERIAL PRIMARY KEY,
    plant_id BIGINT NOT NULL UNIQUE,  -- Links to pt_publish_plants.plant_id
    -- Location data from old plants table
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    timezone TEXT DEFAULT 'UTC',
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    -- Operational data
    plant_type TEXT DEFAULT 'manufacturing',
    is_active BOOLEAN DEFAULT true,
    capacity JSONB DEFAULT '{}',
    operational_metrics JSONB DEFAULT '{}',
    -- Metadata
    legacy_plant_id INTEGER,  -- Original ID from plants table
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_plant_extension_pt_plant 
        FOREIGN KEY (plant_id) 
        REFERENCES pt_publish_plants(plant_id)
);

-- Create index for performance
CREATE INDEX idx_plant_extensions_plant_id ON plant_extensions(plant_id);
CREATE INDEX idx_plant_extensions_legacy_id ON plant_extensions(legacy_plant_id);

-- Migrate existing plant data
INSERT INTO plant_extensions (
    plant_id,
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
    legacy_plant_id
)
SELECT 
    pp.plant_id,
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
    p.id as legacy_plant_id
FROM plants p
JOIN pt_publish_plants pp ON pp.external_id = 'PLANT-' || p.id
ON CONFLICT (plant_id) DO UPDATE SET
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    country = EXCLUDED.country,
    postal_code = EXCLUDED.postal_code,
    timezone = EXCLUDED.timezone,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    plant_type = EXCLUDED.plant_type,
    is_active = EXCLUDED.is_active,
    capacity = EXCLUDED.capacity,
    operational_metrics = EXCLUDED.operational_metrics,
    updated_at = NOW();

-- Create a view that combines PT Publish plants with extended data
CREATE OR REPLACE VIEW plants_complete AS
SELECT 
    pp.*,
    -- Extended attributes
    pe.address,
    pe.city,
    pe.state,
    pe.country,
    pe.postal_code,
    pe.timezone,
    pe.latitude,
    pe.longitude,
    pe.plant_type,
    pe.is_active,
    pe.capacity,
    pe.operational_metrics,
    pe.legacy_plant_id
FROM pt_publish_plants pp
LEFT JOIN plant_extensions pe ON pp.plant_id = pe.plant_id;

-- Verify the extension data
SELECT 
    'Plant Extensions Created' as status,
    COUNT(*) as total_extensions
FROM plant_extensions;

-- Show sample of complete plant data
SELECT 
    plant_id,
    name,
    city,
    state,
    timezone,
    is_active
FROM plants_complete
ORDER BY plant_id
LIMIT 5;