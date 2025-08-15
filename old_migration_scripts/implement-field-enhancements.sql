-- Field Modifications for Existing Tables Implementation
-- This script adds the requested field enhancements to Production Orders, Stocks, Resource Requirements, and Bills of Material tables

-- ==========================================
-- PRODUCTION ORDERS TABLE ENHANCEMENTS
-- ==========================================

-- Add customerId foreign key (replacing customer text field)
ALTER TABLE production_orders 
ADD COLUMN customer_id INTEGER REFERENCES customers(id);

-- Add parentOrderId for order splitting/consolidation
ALTER TABLE production_orders 
ADD COLUMN parent_order_id INTEGER REFERENCES production_orders(id);

-- Add orderCategory (normal, rework, prototype, sample)
ALTER TABLE production_orders 
ADD COLUMN order_category TEXT NOT NULL DEFAULT 'normal' 
CHECK (order_category IN ('normal', 'rework', 'prototype', 'sample'));

-- ==========================================
-- STOCKS TABLE ENHANCEMENTS  
-- ==========================================

-- Add allocatedQuantity for planned allocations
ALTER TABLE stocks 
ADD COLUMN allocated_quantity INTEGER DEFAULT 0;

-- Add inTransitQuantity for goods in transit
ALTER TABLE stocks 
ADD COLUMN in_transit_quantity INTEGER DEFAULT 0;

-- Add costMethod (FIFO, LIFO, average)
ALTER TABLE stocks 
ADD COLUMN cost_method TEXT NOT NULL DEFAULT 'FIFO' 
CHECK (cost_method IN ('FIFO', 'LIFO', 'average'));

-- Add lastCountVariance for cycle counting
ALTER TABLE stocks 
ADD COLUMN last_count_variance INTEGER DEFAULT 0;

-- ==========================================
-- RESOURCE REQUIREMENTS TABLE ENHANCEMENTS
-- ==========================================

-- Add skillLevel required (basic, intermediate, advanced)
ALTER TABLE resource_requirements 
ADD COLUMN skill_level TEXT NOT NULL DEFAULT 'basic' 
CHECK (skill_level IN ('basic', 'intermediate', 'advanced'));

-- Add certificationRequired flag
ALTER TABLE resource_requirements 
ADD COLUMN certification_required BOOLEAN DEFAULT FALSE;

-- Add alternateResources JSONB for flexibility
ALTER TABLE resource_requirements 
ADD COLUMN alternate_resources JSONB DEFAULT '{}';

-- ==========================================
-- BILLS OF MATERIAL TABLE ENHANCEMENTS
-- ==========================================

-- Add scrapFactor for each component
ALTER TABLE bills_of_material 
ADD COLUMN scrap_factor NUMERIC(5,2) DEFAULT 0;

-- Add yieldFactor for each component
ALTER TABLE bills_of_material 
ADD COLUMN yield_factor NUMERIC(5,2) DEFAULT 100;

-- Change expiredDate to obsoleteDate for change management
ALTER TABLE bills_of_material 
RENAME COLUMN expired_date TO obsolete_date;

-- Add alternateItems JSONB for substitutions
ALTER TABLE bills_of_material 
ADD COLUMN alternate_items JSONB DEFAULT '[]';

-- ==========================================
-- CREATE SAMPLE DATA TO DEMONSTRATE ENHANCEMENTS
-- ==========================================

-- Sample customers for production orders
INSERT INTO customers (customer_code, customer_name, address, city, state, zip_code, country, phone, email, status) 
VALUES 
  ('CUST-001', 'Acme Pharmaceuticals Inc', '123 Industrial Blvd', 'Newark', 'NJ', '07102', 'USA', '+1-973-555-0100', 'orders@acmepharma.com', 'active'),
  ('CUST-002', 'Global Chemical Solutions', '456 Chemical Ave', 'Houston', 'TX', '77002', 'USA', '+1-713-555-0200', 'procurement@globalchem.com', 'active')
ON CONFLICT (customer_code) DO NOTHING;

-- Sample production orders with enhanced fields
INSERT INTO production_orders (
  order_number, name, description, customer_id, parent_order_id, order_category,
  priority, status, quantity, due_date, item_number, production_version_id, plant_id
) VALUES 
  ('PO-ENH-001', 'Enhanced Tablet Production - Normal', 'Standard production order with customer relationship', 1, NULL, 'normal', 'high', 'released', 10000, NOW() + INTERVAL '30 days', 'TABLET-500MG', 1, 1),
  ('PO-ENH-002', 'Rework Order - Quality Issues', 'Rework order for rejected batch', 1, 1, 'rework', 'urgent', 'released', 500, NOW() + INTERVAL '5 days', 'TABLET-500MG', 1, 1),
  ('PO-ENH-003', 'Prototype Development', 'New formula prototype testing', 2, NULL, 'prototype', 'medium', 'released', 100, NOW() + INTERVAL '14 days', 'TABLET-NEW', 1, 1)
ON CONFLICT (order_number) DO NOTHING;

-- Update existing stocks with enhanced inventory tracking
UPDATE stocks SET 
  allocated_quantity = 500,
  in_transit_quantity = 200,
  cost_method = 'FIFO',
  last_count_variance = -15
WHERE id = 1;

-- Sample stock records with enhanced fields
INSERT INTO stocks (
  item_id, storage_location_id, quantity_on_hand, quantity_reserved, quantity_available,
  allocated_quantity, in_transit_quantity, cost_method, last_count_variance,
  unit_cost, total_value, minimum_level, maximum_level, status
) VALUES 
  (1, 1, 5000, 1000, 4000, 1200, 300, 'FIFO', 25, 150, 750000, 1000, 10000, 'active'),
  (2, 2, 8000, 500, 7500, 800, 150, 'LIFO', -10, 75, 600000, 2000, 15000, 'active'),
  (3, 3, 3000, 200, 2800, 400, 100, 'average', 0, 200, 600000, 500, 5000, 'active')
ON CONFLICT (item_id, storage_location_id) DO NOTHING;

-- Update resource requirements with enhanced skill and certification tracking
UPDATE resource_requirements SET 
  skill_level = 'advanced',
  certification_required = true,
  alternate_resources = '{
    "resourceIds": [2, 3, 4],
    "selectionCriteria": "ISO certification required",
    "preferenceOrder": [2, 3, 4],
    "flexibilityLevel": "moderate"
  }'::jsonb
WHERE id = 1;

-- Sample resource requirements with enhanced fields
INSERT INTO resource_requirements (
  recipe_phase_id, requirement_name, requirement_type, quantity, duration,
  skill_level, certification_required, alternate_resources, priority, notes
) VALUES 
  (1, 'Certified Tablet Press Operator', 'primary', 1, 480, 'advanced', true, 
   '{"resourceIds": [1,2], "selectionCriteria": "FDA certification required", "preferenceOrder": [1,2], "flexibilityLevel": "limited"}'::jsonb,
   'critical', 'Requires specialized pharmaceutical manufacturing certification'),
  (2, 'Quality Control Technician', 'quality', 1, 120, 'intermediate', true,
   '{"resourceIds": [3,4,5], "selectionCriteria": "QC certification", "preferenceOrder": [3,4,5], "flexibilityLevel": "moderate"}'::jsonb,
   'high', 'Must have analytical testing certification')
ON CONFLICT DO NOTHING;

-- Update bills of material with enhanced yield and scrap tracking
UPDATE bills_of_material SET 
  scrap_factor = 2.5,
  yield_factor = 97.5,
  alternate_items = '[
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
      "conditions": ["quality equivalent approved"]
    }
  ]'::jsonb
WHERE id = 1;

-- Sample bills of material with enhanced change management
INSERT INTO bills_of_material (
  parent_item_id, revision, description, effective_date, obsolete_date,
  bom_type, standard_quantity, scrap_factor, yield_factor, alternate_items, is_active
) VALUES 
  (1, '2.0', 'Enhanced Tablet Formula - Rev 2.0', NOW(), NOW() + INTERVAL '365 days', 'production', 1000, 3.0, 97.0,
   '[{"itemId": 201, "substitutionRatio": 1.0, "preferenceLevel": 1, "conditions": ["approved substitute"]}]'::jsonb, true),
  (2, '1.5', 'Industrial Adhesive - Improved Yield', NOW(), NOW() + INTERVAL '180 days', 'production', 500, 1.5, 98.5,
   '[{"itemId": 301, "substitutionRatio": 1.1, "preferenceLevel": 1, "conditions": ["cost reduction initiative"]}]'::jsonb, true)
ON CONFLICT (parent_item_id, revision) DO NOTHING;

-- ==========================================
-- CREATE PERFORMANCE INDEXES
-- ==========================================

-- Production Orders indexes
CREATE INDEX IF NOT EXISTS production_orders_customer_id_idx ON production_orders(customer_id);
CREATE INDEX IF NOT EXISTS production_orders_parent_order_id_idx ON production_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS production_orders_order_category_idx ON production_orders(order_category);

-- Stocks indexes  
CREATE INDEX IF NOT EXISTS stocks_allocated_quantity_idx ON stocks(allocated_quantity);
CREATE INDEX IF NOT EXISTS stocks_in_transit_quantity_idx ON stocks(in_transit_quantity);
CREATE INDEX IF NOT EXISTS stocks_cost_method_idx ON stocks(cost_method);
CREATE INDEX IF NOT EXISTS stocks_last_count_variance_idx ON stocks(last_count_variance);

-- Resource Requirements indexes
CREATE INDEX IF NOT EXISTS resource_requirements_skill_level_idx ON resource_requirements(skill_level);
CREATE INDEX IF NOT EXISTS resource_requirements_certification_required_idx ON resource_requirements(certification_required);

-- Bills of Material indexes
CREATE INDEX IF NOT EXISTS bills_of_material_scrap_factor_idx ON bills_of_material(scrap_factor);
CREATE INDEX IF NOT EXISTS bills_of_material_yield_factor_idx ON bills_of_material(yield_factor);
CREATE INDEX IF NOT EXISTS bills_of_material_obsolete_date_idx ON bills_of_material(obsolete_date);

COMMIT;