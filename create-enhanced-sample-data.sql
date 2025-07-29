-- Create sample data to demonstrate enhanced field modifications
-- Production Orders, Stocks, Resource Requirements, and Bills of Material

-- ==========================================
-- SAMPLE DATA FOR ENHANCED FIELDS
-- ==========================================

-- Create enhanced production order with parent-child relationship
INSERT INTO production_orders (
  order_number, name, description, customer_id, parent_order_id, order_category,
  priority, status, quantity, due_date, item_number, production_version_id, plant_id, customer
) VALUES 
  ('PO-PARENT-001', 'Master Production Order', 'Parent order for splitting into batches', 1, NULL, 'normal', 'high', 'released', 20000, NOW() + INTERVAL '45 days', 'TABLET-500MG', 1, 1, 'Legacy Customer Name'),
  ('PO-CHILD-001', 'Batch 1 - First Half', 'Child order split from parent', 1, 4378, 'normal', 'high', 'released', 10000, NOW() + INTERVAL '20 days', 'TABLET-500MG', 1, 1, 'Legacy Customer Name'),
  ('PO-CHILD-002', 'Batch 2 - Second Half', 'Child order split from parent', 1, 4378, 'normal', 'high', 'released', 10000, NOW() + INTERVAL '30 days', 'TABLET-500MG', 1, 1, 'Legacy Customer Name'),
  ('PO-REWORK-001', 'Quality Rework Order', 'Rework failed batch', 1, NULL, 'rework', 'urgent', 'released', 1500, NOW() + INTERVAL '7 days', 'TABLET-500MG', 1, 1, 'Legacy Customer Name'),
  ('PO-PROTO-001', 'New Formula Prototype', 'Prototype testing for R&D', 2, NULL, 'prototype', 'medium', 'released', 100, NOW() + INTERVAL '14 days', 'TABLET-NEW', 1, 1, 'Research Division')
ON CONFLICT (order_number) DO NOTHING;

-- Create enhanced stocks with allocation and transit tracking
INSERT INTO stocks (
  item_id, storage_location_id, quantity_on_hand, quantity_reserved, quantity_available,
  allocated_quantity, in_transit_quantity, cost_method, last_count_variance,
  unit_cost, total_value, minimum_level, maximum_level, status
) 
SELECT * FROM (VALUES
  (1, 1, 15000, 2000, 13000, 3000, 500, 'FIFO', 75, 125, 1875000, 2000, 20000, 'active'),
  (2, 1, 8000, 800, 7200, 1200, 200, 'LIFO', -25, 85, 680000, 1500, 12000, 'active'),
  (3, 1, 5000, 500, 4500, 750, 150, 'average', 10, 200, 1000000, 1000, 8000, 'active'),
  (4, 1, 12000, 1500, 10500, 2200, 300, 'FIFO', 50, 95, 1140000, 2500, 15000, 'active')
) AS new_stocks(item_id, storage_location_id, quantity_on_hand, quantity_reserved, quantity_available, allocated_quantity, in_transit_quantity, cost_method, last_count_variance, unit_cost, total_value, minimum_level, maximum_level, status)
WHERE NOT EXISTS (
  SELECT 1 FROM stocks 
  WHERE stocks.item_id = new_stocks.item_id 
  AND stocks.storage_location_id = new_stocks.storage_location_id
);

-- Create enhanced resource requirements with skill levels and certifications
INSERT INTO resource_requirements (
  recipe_phase_id, requirement_name, requirement_type, quantity, duration,
  skill_level, certification_required, alternate_resources, priority, notes
) VALUES 
  (1, 'Master Tablet Press Operator', 'primary', 1, 480, 'advanced', true, 
   '{"resourceIds": [1,2], "selectionCriteria": "FDA pharmaceutical certification required", "preferenceOrder": [1,2], "flexibilityLevel": "limited"}'::jsonb,
   'critical', 'Requires 5+ years pharmaceutical manufacturing experience and FDA certification'),
  (1, 'Quality Assurance Technician', 'quality', 1, 120, 'intermediate', true,
   '{"resourceIds": [3,4,5], "selectionCriteria": "HPLC and dissolution testing certified", "preferenceOrder": [3,4,5], "flexibilityLevel": "moderate"}'::jsonb,
   'high', 'Must have analytical chemistry background and QC certifications'),
  (2, 'Coating Specialist', 'primary', 1, 240, 'advanced', true,
   '{"resourceIds": [6,7], "selectionCriteria": "Film coating expertise required", "preferenceOrder": [6,7], "flexibilityLevel": "limited"}'::jsonb,
   'critical', 'Specialized in pharmaceutical film coating processes'),
  (2, 'Equipment Maintenance Tech', 'maintenance', 1, 60, 'basic', false,
   '{"resourceIds": [8,9,10], "selectionCriteria": "General mechanical skills", "preferenceOrder": [8,9,10], "flexibilityLevel": "high"}'::jsonb,
   'medium', 'General maintenance and equipment setup support')
ON CONFLICT DO NOTHING;

-- Create enhanced bills of material with yield factors and alternates
INSERT INTO bills_of_material (
  item_number, revision, description, effective_date, bom_type, standard_quantity, 
  scrap_factor, yield_factor, alternate_items, is_active
) VALUES 
  ('ENHANCED-TABLET-001', '3.0', 'Enhanced Tablet Formula with Improved Yield', NOW(), 'production', 1000, 2.5, 97.5,
   '[
     {
       "itemId": 101,
       "substitutionRatio": 1.0,
       "preferenceLevel": 1,
       "conditions": ["supplier shortage", "cost optimization"]
     },
     {
       "itemId": 102, 
       "substitutionRatio": 0.95,
       "preferenceLevel": 2,
       "conditions": ["quality equivalent approved", "regulatory accepted"]
     }
   ]'::jsonb, true),
  ('HIGH-YIELD-ADHESIVE', '2.5', 'Industrial Adhesive - High Yield Formula', NOW(), 'production', 500, 1.0, 99.0,
   '[
     {
       "itemId": 201,
       "substitutionRatio": 1.1,
       "preferenceLevel": 1,
       "conditions": ["cost reduction initiative", "improved performance"]
     }
   ]'::jsonb, true),
  ('PROTOTYPE-FORMULA', '1.0', 'Experimental R&D Formula', NOW(), 'engineering', 100, 5.0, 95.0,
   '[
     {
       "itemId": 301,
       "substitutionRatio": 0.9,
       "preferenceLevel": 1,
       "conditions": ["research phase", "variable composition allowed"]
     }
   ]'::jsonb, true)
ON CONFLICT (item_number, revision) DO NOTHING;

-- Update existing sample data to demonstrate enhancements
UPDATE production_orders 
SET customer_id = 1, order_category = 'normal'
WHERE order_number LIKE 'PO-%' AND customer_id IS NULL;

UPDATE stocks 
SET allocated_quantity = COALESCE(allocated_quantity, 0) + (quantity_on_hand * 0.1)::integer,
    in_transit_quantity = COALESCE(in_transit_quantity, 0) + (quantity_on_hand * 0.02)::integer,
    cost_method = CASE 
      WHEN id % 3 = 0 THEN 'FIFO'
      WHEN id % 3 = 1 THEN 'LIFO' 
      ELSE 'average'
    END,
    last_count_variance = (RANDOM() * 100 - 50)::integer
WHERE allocated_quantity IS NULL OR in_transit_quantity IS NULL;

UPDATE resource_requirements 
SET skill_level = CASE 
      WHEN priority = 'critical' THEN 'advanced'
      WHEN priority = 'high' THEN 'intermediate'
      ELSE 'basic'
    END,
    certification_required = (priority IN ('critical', 'high')),
    alternate_resources = CASE
      WHEN priority = 'critical' THEN '{"resourceIds": [1,2,3], "selectionCriteria": "Critical process requires certified operators", "preferenceOrder": [1,2,3], "flexibilityLevel": "limited"}'::jsonb
      WHEN priority = 'high' THEN '{"resourceIds": [4,5,6,7], "selectionCriteria": "High priority with moderate flexibility", "preferenceOrder": [4,5,6,7], "flexibilityLevel": "moderate"}'::jsonb
      ELSE '{"resourceIds": [8,9,10,11,12], "selectionCriteria": "Standard operations with high flexibility", "preferenceOrder": [8,9,10,11,12], "flexibilityLevel": "high"}'::jsonb
    END
WHERE skill_level IS NULL OR certification_required IS NULL;

UPDATE bills_of_material 
SET scrap_factor = COALESCE(scrap_factor, 0) + (RANDOM() * 3)::numeric(5,2),
    yield_factor = COALESCE(yield_factor, 100) - (RANDOM() * 5)::numeric(5,2),
    alternate_items = CASE
      WHEN bom_type = 'production' THEN '[{"itemId": 999, "substitutionRatio": 1.0, "preferenceLevel": 1, "conditions": ["standard alternate"]}]'::jsonb
      ELSE '[]'::jsonb
    END
WHERE scrap_factor IS NULL OR yield_factor IS NULL;