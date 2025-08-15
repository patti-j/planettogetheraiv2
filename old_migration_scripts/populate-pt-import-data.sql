-- Populate PT Import tables with comprehensive simulated data
-- This data represents a realistic pharmaceutical manufacturing environment

-- Clean existing data first
TRUNCATE TABLE pt_plants CASCADE;
TRUNCATE TABLE pt_departments CASCADE;
TRUNCATE TABLE pt_resources CASCADE;
TRUNCATE TABLE pt_capabilities CASCADE;
TRUNCATE TABLE pt_items CASCADE;
TRUNCATE TABLE pt_customers CASCADE;
TRUNCATE TABLE pt_warehouses CASCADE;
TRUNCATE TABLE pt_jobs CASCADE;

-- Insert Plants
INSERT INTO pt_plants (external_id, name, description, address, city, region, notes, user_fields) VALUES
('PLANT_001', 'Acme Pharma Main', 'Primary pharmaceutical manufacturing facility', '123 Industrial Blvd', 'Philadelphia', 'Northeast', 'FDA registered facility', '{"capacity": 50000, "certification": "FDA"}'),
('PLANT_002', 'Acme Pharma West', 'Secondary manufacturing and packaging facility', '456 Manufacturing Way', 'San Diego', 'West', 'Packaging and final assembly', '{"capacity": 30000, "certification": "FDA"}'),
('PLANT_003', 'Acme Pharma EU', 'European manufacturing facility', '789 Europa Street', 'Dublin', 'Europe', 'EU GMP certified', '{"capacity": 25000, "certification": "EMA"}');

-- Insert Departments
INSERT INTO pt_departments (external_id, plant_external_id, name, description, department_frozen_span_hrs, notes, user_fields) VALUES
('DEPT_MIX_001', 'PLANT_001', 'Mixing Department', 'Raw material blending and mixing operations', '24', 'Critical for tablet production', '{"shift_pattern": "24x7", "staff_count": 15}'),
('DEPT_PRESS_001', 'PLANT_001', 'Tablet Press', 'Tablet compression and forming', '16', 'High-speed tablet production', '{"shift_pattern": "2x8", "staff_count": 12}'),
('DEPT_COAT_001', 'PLANT_001', 'Coating Department', 'Film coating and enteric coating', '12', 'Specialized coating operations', '{"shift_pattern": "1x12", "staff_count": 8}'),
('DEPT_PACK_001', 'PLANT_001', 'Packaging', 'Primary and secondary packaging', '16', 'Automated packaging lines', '{"shift_pattern": "2x8", "staff_count": 20}'),
('DEPT_QC_001', 'PLANT_001', 'Quality Control', 'Testing and quality assurance', '24', 'Critical quality testing', '{"shift_pattern": "24x7", "staff_count": 10}'),
('DEPT_PACK_002', 'PLANT_002', 'Packaging West', 'Secondary packaging and distribution', '16', 'West coast packaging hub', '{"shift_pattern": "2x8", "staff_count": 18}'),
('DEPT_MIX_003', 'PLANT_003', 'Mixing EU', 'European mixing operations', '20', 'EU regulations compliance', '{"shift_pattern": "2x10", "staff_count": 12}');

-- Insert Capabilities
INSERT INTO pt_capabilities (external_id, name, description, notes, user_fields) VALUES
('CAP_MIX_BASIC', 'Basic Mixing', 'Basic powder blending operations', 'Entry level mixing capability', '{"skill_level": "basic", "training_hours": 40}'),
('CAP_MIX_ADV', 'Advanced Mixing', 'Complex formulation and high-shear mixing', 'Advanced mixing with specialized equipment', '{"skill_level": "advanced", "training_hours": 120}'),
('CAP_PRESS_OPER', 'Tablet Press Operation', 'Tablet compression machine operation', 'Certified tablet press operator', '{"skill_level": "intermediate", "training_hours": 80}'),
('CAP_COAT_SPEC', 'Coating Specialist', 'Film and enteric coating expertise', 'Specialized coating operations', '{"skill_level": "advanced", "training_hours": 160}'),
('CAP_QC_ANAL', 'QC Analysis', 'Quality control testing and analysis', 'Laboratory testing capabilities', '{"skill_level": "advanced", "training_hours": 200}'),
('CAP_MAINT_MECH', 'Mechanical Maintenance', 'Equipment maintenance and repair', 'Mechanical troubleshooting', '{"skill_level": "intermediate", "training_hours": 100}'),
('CAP_PACK_AUTO', 'Automated Packaging', 'Automated packaging line operation', 'High-speed packaging equipment', '{"skill_level": "intermediate", "training_hours": 60}');

-- Insert Resources
INSERT INTO pt_resources (external_id, plant_external_id, department_external_id, name, description, resource_type, status, capacity_units, cost_per_hour, setup_time_minutes, efficiency_percentage, availability_percentage, maintenance_schedule, operator_required, shift_pattern, notes, user_fields) VALUES
('RES_MIX_001', 'PLANT_001', 'DEPT_MIX_001', 'High Shear Mixer #1', 'V-shell blender with intensifier bar', 'Equipment', 'Active', 'batches/hour', '150', '45', '92', '85', 'weekly', 'true', '24x7', 'Primary mixing equipment', '{"capacity_kg": 500, "model": "HSM-500"}'),
('RES_MIX_002', 'PLANT_001', 'DEPT_MIX_001', 'High Shear Mixer #2', 'Backup V-shell blender', 'Equipment', 'Active', 'batches/hour', '150', '45', '88', '80', 'weekly', 'true', '24x7', 'Secondary mixing equipment', '{"capacity_kg": 500, "model": "HSM-500B"}'),
('RES_PRESS_001', 'PLANT_001', 'DEPT_PRESS_001', 'Tablet Press Line A', 'High-speed rotary tablet press', 'Equipment', 'Active', 'tablets/minute', '200', '90', '95', '90', 'daily', 'true', '2x8', 'Primary tablet production', '{"stations": 37, "max_pressure": "40KN"}'),
('RES_PRESS_002', 'PLANT_001', 'DEPT_PRESS_001', 'Tablet Press Line B', 'High-speed rotary tablet press', 'Equipment', 'Active', 'tablets/minute', '200', '90', '93', '88', 'daily', 'true', '2x8', 'Secondary tablet production', '{"stations": 37, "max_pressure": "40KN"}'),
('RES_COAT_001', 'PLANT_001', 'DEPT_COAT_001', 'Coating Pan #1', 'Perforated coating pan', 'Equipment', 'Active', 'batches/hour', '300', '120', '90', '85', 'weekly', 'true', '1x12', 'Film coating equipment', '{"capacity_kg": 200, "coating_type": "aqueous"}'),
('RES_PACK_001', 'PLANT_001', 'DEPT_PACK_001', 'Packaging Line 1', 'Automated blister packaging', 'Equipment', 'Active', 'blisters/minute', '180', '60', '94', '92', 'weekly', 'true', '2x8', 'Primary packaging', '{"speed_bpm": 400, "format": "PVC/ALU"}'),
('RES_PACK_002', 'PLANT_001', 'DEPT_PACK_001', 'Packaging Line 2', 'Bottle filling and capping', 'Equipment', 'Active', 'bottles/minute', '120', '30', '91', '89', 'weekly', 'true', '2x8', 'Bottle packaging', '{"speed_bpm": 200, "bottle_size": "100mL"}'),
('RES_QC_001', 'PLANT_001', 'DEPT_QC_001', 'HPLC System 1', 'High Performance Liquid Chromatography', 'Equipment', 'Active', 'samples/hour', '80', '15', '98', '95', 'monthly', 'true', '24x7', 'Analytical testing', '{"model": "Waters Alliance", "detector": "UV-VIS"}'),
('RES_OPER_001', 'PLANT_001', 'DEPT_MIX_001', 'John Smith', 'Senior Mixing Operator', 'Personnel', 'Active', 'hours/day', '35', '0', '100', '95', 'N/A', 'false', '24x7', 'Experienced operator', '{"certification": "FDA", "experience_years": 8}'),
('RES_OPER_002', 'PLANT_001', 'DEPT_PRESS_001', 'Sarah Johnson', 'Tablet Press Specialist', 'Personnel', 'Active', 'hours/day', '38', '0', '100', '98', 'N/A', 'false', '2x8', 'Lead press operator', '{"certification": "FDA", "experience_years": 12}');

-- Insert Items
INSERT INTO pt_items (external_id, name, description, batch_size, cost, item_type, source, notes, user_fields) VALUES
('ITEM_IBUPROFEN_200', 'Ibuprofen 200mg Tablet', 'Over-the-counter pain relief tablet', '50000', '0.025', 'Finished Good', 'Manufactured', 'Generic ibuprofen tablet', '{"api_content": "200mg", "dosage_form": "tablet"}'),
('ITEM_IBUPROFEN_400', 'Ibuprofen 400mg Tablet', 'Prescription strength pain relief', '30000', '0.045', 'Finished Good', 'Manufactured', 'Higher strength ibuprofen', '{"api_content": "400mg", "dosage_form": "tablet"}'),
('ITEM_ACETAMINOPHEN', 'Acetaminophen 500mg Tablet', 'Pain and fever relief tablet', '75000', '0.018', 'Finished Good', 'Manufactured', 'Generic acetaminophen', '{"api_content": "500mg", "dosage_form": "tablet"}'),
('ITEM_API_IBUPROFEN', 'Ibuprofen API', 'Active pharmaceutical ingredient', '1000', '125.50', 'Raw Material', 'Purchased', 'High purity API', '{"purity": "99.8%", "supplier": "ChemCorp"}'),
('ITEM_LACTOSE', 'Lactose Monohydrate', 'Tablet filler and binder', '25000', '2.80', 'Raw Material', 'Purchased', 'Pharmaceutical grade lactose', '{"grade": "Ph.Eur", "mesh_size": "200"}'),
('ITEM_MCC', 'Microcrystalline Cellulose', 'Tablet disintegrant and binder', '20000', '3.20', 'Raw Material', 'Purchased', 'Direct compression grade', '{"grade": "PH-102", "moisture": "5%"}'),
('ITEM_PVP', 'Polyvinylpyrrolidone K30', 'Tablet binder', '500', '18.75', 'Raw Material', 'Purchased', 'Pharmaceutical binder', '{"molecular_weight": "40000", "viscosity": "5.5-8.5"}');

-- Insert Customers
INSERT INTO pt_customers (external_id, name, description, customer_type, priority, region, notes, user_fields) VALUES
('CUST_PHARMACY_CHAIN', 'MegaPharm Chain', 'Large retail pharmacy chain', 'Retail', 'High', 'National', 'Major customer with 500+ stores', '{"stores": 523, "volume_annual": "50M"}'),
('CUST_HOSPITAL_GROUP', 'Regional Hospital Group', 'Hospital system covering 3 states', 'Healthcare', 'High', 'Northeast', 'Institutional healthcare customer', '{"hospitals": 15, "beds": 3500}'),
('CUST_WHOLESALER', 'PharmaDistrib Inc', 'Pharmaceutical wholesaler', 'Distributor', 'Medium', 'National', 'B2B distribution partner', '{"distribution_centers": 8, "coverage": "nationwide"}'),
('CUST_EXPORT', 'EuroMed Partners', 'European pharmaceutical distributor', 'Export', 'Medium', 'Europe', 'International export customer', '{"countries": 12, "regulatory": "EU-GMP"}');

-- Insert Warehouses
INSERT INTO pt_warehouses (external_id, name, description, warehouse_type, address, city, region, capacity, notes, user_fields) VALUES
('WH_MAIN_001', 'Main Raw Materials', 'Primary raw material storage', 'Raw Materials', '123 Industrial Blvd', 'Philadelphia', 'Northeast', '5000', 'Climate controlled storage', '{"temperature": "20-25C", "humidity": "45-65%"}'),
('WH_FG_001', 'Finished Goods - Main', 'Primary finished goods warehouse', 'Finished Goods', '125 Industrial Blvd', 'Philadelphia', 'Northeast', '10000', 'Automated storage system', '{"zones": 8, "automation": "AS/RS"}'),
('WH_QUARANTINE', 'Quarantine Storage', 'Quality hold and quarantine', 'Quarantine', '127 Industrial Blvd', 'Philadelphia', 'Northeast', '1000', 'Segregated storage areas', '{"security_level": "high", "access_controlled": true}'),
('WH_WEST_FG', 'West Coast Distribution', 'West coast finished goods', 'Distribution', '456 Manufacturing Way', 'San Diego', 'West', '8000', 'Distribution hub', '{"shipping_docks": 12, "rail_access": true}');

-- Insert Jobs (Production Orders)
INSERT INTO pt_jobs (external_id, name, description, due_date, customer_external_id, priority, status, make_to_stock_item_external_id, make_to_stock_item_qty, job_type, notes, user_fields) VALUES
('JOB_IBU200_001', 'Ibuprofen 200mg Batch #2501', 'Standard production batch', '2025-08-20 08:00:00', 'CUST_PHARMACY_CHAIN', 'High', 'Released', 'ITEM_IBUPROFEN_200', '50000', 'Production', 'Rush order for major customer', '{"batch_number": "IBU200-2501", "campaign": "Q3-2025"}'),
('JOB_IBU400_001', 'Ibuprofen 400mg Batch #1201', 'Prescription strength batch', '2025-08-22 16:00:00', 'CUST_HOSPITAL_GROUP', 'Medium', 'Released', 'ITEM_IBUPROFEN_400', '30000', 'Production', 'Hospital system order', '{"batch_number": "IBU400-1201", "campaign": "Q3-2025"}'),
('JOB_ACET_001', 'Acetaminophen 500mg Batch #3401', 'High volume acetaminophen production', '2025-08-25 12:00:00', 'CUST_WHOLESALER', 'Medium', 'Planned', 'ITEM_ACETAMINOPHEN', '75000', 'Production', 'Seasonal demand increase', '{"batch_number": "ACET-3401", "campaign": "Q3-2025"}'),
('JOB_IBU200_002', 'Ibuprofen 200mg Batch #2502', 'Follow-up production batch', '2025-08-27 08:00:00', 'CUST_EXPORT', 'Low', 'Planned', 'ITEM_IBUPROFEN_200', '50000', 'Production', 'Export order to Europe', '{"batch_number": "IBU200-2502", "campaign": "Q3-2025"}');

-- Insert Job Operations
INSERT INTO pt_job_operations (job_external_id, external_id, operation_name, description, sequence_number, operation_type, standard_duration_minutes, setup_time_minutes, department_external_id, notes, user_fields) VALUES
('JOB_IBU200_001', 'OP_MIX_001', 'Blending Operation', 'Blend API with excipients', '10', 'Mixing', '180', '45', 'DEPT_MIX_001', 'Critical blend uniformity', '{"blend_time": "15min", "speed": "10rpm"}'),
('JOB_IBU200_001', 'OP_PRESS_001', 'Tablet Compression', 'Compress blended material into tablets', '20', 'Compression', '240', '90', 'DEPT_PRESS_001', 'Monitor tablet hardness', '{"target_hardness": "8-12kp", "thickness": "4.5mm"}'),
('JOB_IBU200_001', 'OP_COAT_001', 'Film Coating', 'Apply protective film coating', '30', 'Coating', '300', '120', 'DEPT_COAT_001', 'Moisture protection coating', '{"coating_weight": "3%", "color": "white"}'),
('JOB_IBU200_001', 'OP_PACK_001', 'Primary Packaging', 'Blister packaging of tablets', '40', 'Packaging', '420', '60', 'DEPT_PACK_001', 'Tamper-evident packaging', '{"format": "10x10", "material": "PVC/ALU"}'),
('JOB_IBU400_001', 'OP_MIX_002', 'High Strength Blending', 'Blend higher concentration API', '10', 'Mixing', '210', '60', 'DEPT_MIX_001', 'Extended blend time for uniformity', '{"blend_time": "20min", "speed": "8rpm"}'),
('JOB_IBU400_001', 'OP_PRESS_002', 'High Strength Compression', 'Compress 400mg tablets', '20', 'Compression', '280', '120', 'DEPT_PRESS_001', 'Higher compression force required', '{"target_hardness": "10-15kp", "thickness": "5.2mm"}'),
('JOB_IBU400_001', 'OP_PACK_002', 'Prescription Packaging', 'Bottle packaging for prescription', '30', 'Packaging', '360', '45', 'DEPT_PACK_001', 'Child-resistant bottles', '{"bottle_size": "100ct", "cap_type": "CR"}');

-- Insert Job Resources (Resource assignments)
INSERT INTO pt_job_resources (job_external_id, operation_external_id, plant_external_id, department_external_id, resource_external_id, primary_resource, resource_qty, run_rate, setup_time, notes, user_fields) VALUES
('JOB_IBU200_001', 'OP_MIX_001', 'PLANT_001', 'DEPT_MIX_001', 'RES_MIX_001', 'true', '1', '0.33', '45', 'Primary mixer assignment', '{"efficiency": 92}'),
('JOB_IBU200_001', 'OP_MIX_001', 'PLANT_001', 'DEPT_MIX_001', 'RES_OPER_001', 'true', '1', '1.0', '0', 'Operator assignment', '{"shift": "day"}'),
('JOB_IBU200_001', 'OP_PRESS_001', 'PLANT_001', 'DEPT_PRESS_001', 'RES_PRESS_001', 'true', '1', '208', '90', 'Press line assignment', '{"target_speed": "208tpm"}'),
('JOB_IBU200_001', 'OP_PRESS_001', 'PLANT_001', 'DEPT_PRESS_001', 'RES_OPER_002', 'true', '1', '1.0', '0', 'Press operator', '{"certification": "validated"}'),
('JOB_IBU200_001', 'OP_COAT_001', 'PLANT_001', 'DEPT_COAT_001', 'RES_COAT_001', 'true', '1', '0.17', '120', 'Coating pan assignment', '{"coating_efficiency": 90}'),
('JOB_IBU200_001', 'OP_PACK_001', 'PLANT_001', 'DEPT_PACK_001', 'RES_PACK_001', 'true', '1', '119', '60', 'Blister line assignment', '{"speed_bpm": 400}');

-- Insert Job Materials (Bill of materials)
INSERT INTO pt_job_materials (job_external_id, operation_external_id, item_external_id, usage_type, quantity_per_batch, unit_of_measure, cost_per_unit, notes, user_fields) VALUES
('JOB_IBU200_001', 'OP_MIX_001', 'ITEM_API_IBUPROFEN', 'Input', '10.0', 'kg', '125.50', 'Active ingredient', '{"assay": "99.8%", "lot_tracking": true}'),
('JOB_IBU200_001', 'OP_MIX_001', 'ITEM_LACTOSE', 'Input', '25.0', 'kg', '2.80', 'Primary filler', '{"mesh_size": "200", "moisture": "4.5%"}'),
('JOB_IBU200_001', 'OP_MIX_001', 'ITEM_MCC', 'Input', '12.0', 'kg', '3.20', 'Disintegrant/binder', '{"grade": "PH-102", "bulk_density": "0.31"}'),
('JOB_IBU200_001', 'OP_MIX_001', 'ITEM_PVP', 'Input', '2.0', 'kg', '18.75', 'Binder solution', '{"concentration": "10%", "viscosity": "7.2"}'),
('JOB_IBU200_001', 'OP_PACK_001', 'ITEM_IBUPROFEN_200', 'Output', '50000', 'tablets', '0.025', 'Finished product', '{"yield_target": "98%", "shelf_life": "36months"}');

-- Insert Inventories
INSERT INTO pt_inventories (item_external_id, warehouse_external_id, on_hand_qty, safety_stock, max_inventory, lead_time_days, notes, user_fields) VALUES
('ITEM_API_IBUPROFEN', 'WH_MAIN_001', '500', '100', '1000', '45', 'Critical API inventory', '{"supplier": "ChemCorp", "reorder_point": 150}'),
('ITEM_LACTOSE', 'WH_MAIN_001', '50000', '10000', '100000', '14', 'High volume excipient', '{"supplier": "LactoCorp", "bulk_storage": true}'),
('ITEM_MCC', 'WH_MAIN_001', '30000', '5000', '75000', '21', 'Direct compression grade', '{"supplier": "CelluCorp", "storage_temp": "ambient"}'),
('ITEM_IBUPROFEN_200', 'WH_FG_001', '125000', '25000', '500000', '0', 'Finished goods stock', '{"expiry_tracking": true, "FIFO": true}'),
('ITEM_IBUPROFEN_400', 'WH_FG_001', '75000', '15000', '300000', '0', 'Prescription strength stock', '{"expiry_tracking": true, "FIFO": true}');

-- Insert Capacity Intervals (Shift schedules)
INSERT INTO pt_capacity_intervals (external_id, name, start_date_time, end_date_time, description, capacity_code, nbr_of_people, notes, user_fields) VALUES
('CAP_INT_DAY_001', 'Day Shift - Week 1', '2025-08-18 06:00:00', '2025-08-18 14:00:00', 'Standard day shift', 'DAY', '8', 'Regular production shift', '{"shift_type": "day", "overtime_available": true}'),
('CAP_INT_NIGHT_001', 'Night Shift - Week 1', '2025-08-18 22:00:00', '2025-08-19 06:00:00', 'Standard night shift', 'NIGHT', '6', 'Reduced crew night shift', '{"shift_type": "night", "supervisor_required": true}'),
('CAP_INT_WEEKEND', 'Weekend Maintenance', '2025-08-23 08:00:00', '2025-08-23 16:00:00', 'Weekend maintenance window', 'MAINT', '4', 'Preventive maintenance', '{"maintenance_type": "preventive", "equipment_shutdown": true}');

-- Insert Resource Capabilities (Skills assignments)
INSERT INTO pt_resource_capabilities (plant_external_id, department_external_id, resource_external_id, capability_external_id) VALUES
('PLANT_001', 'DEPT_MIX_001', 'RES_OPER_001', 'CAP_MIX_ADV'),
('PLANT_001', 'DEPT_MIX_001', 'RES_OPER_001', 'CAP_MIX_BASIC'),
('PLANT_001', 'DEPT_PRESS_001', 'RES_OPER_002', 'CAP_PRESS_OPER'),
('PLANT_001', 'DEPT_PRESS_001', 'RES_OPER_002', 'CAP_MAINT_MECH'),
('PLANT_001', 'DEPT_QC_001', 'RES_QC_001', 'CAP_QC_ANAL');

-- Insert Forecasts
INSERT INTO pt_forecasts (external_id, name, item_external_id, warehouse_external_id, forecast_date, forecast_qty) VALUES
('FORECAST_001', 'Q4 2025 Ibuprofen 200mg', 'ITEM_IBUPROFEN_200', 'WH_FG_001', '2025-10-01', '500000'),
('FORECAST_002', 'Q4 2025 Ibuprofen 400mg', 'ITEM_IBUPROFEN_400', 'WH_FG_001', '2025-10-01', '300000'),
('FORECAST_003', 'Q4 2025 Acetaminophen', 'ITEM_ACETAMINOPHEN', 'WH_FG_001', '2025-10-01', '750000');

-- Insert Sales Orders
INSERT INTO pt_sales_orders (external_id, customer_external_id, order_number, order_date, promised_date, priority, status, notes, user_fields) VALUES
('SO_001', 'CUST_PHARMACY_CHAIN', 'SO-2025-1001', '2025-08-15', '2025-08-25', 'High', 'Confirmed', 'Rush order - major promotion', '{"promotion": "back_to_school", "discount": "5%"}'),
('SO_002', 'CUST_HOSPITAL_GROUP', 'SO-2025-1002', '2025-08-16', '2025-08-30', 'Medium', 'Confirmed', 'Regular monthly order', '{"contract": "annual_2025", "terms": "NET30"}'),
('SO_003', 'CUST_EXPORT', 'SO-2025-1003', '2025-08-17', '2025-09-15', 'Low', 'Planning', 'Export order - long lead time', '{"shipping": "container", "incoterms": "FOB"}');

-- Insert Sales Order Lines
INSERT INTO pt_sales_order_lines (sales_order_external_id, line_number, item_external_id, quantity, price, total_amount) VALUES
('SO_001', '10', 'ITEM_IBUPROFEN_200', '100000', '0.045', '4500'),
('SO_001', '20', 'ITEM_ACETAMINOPHEN', '150000', '0.038', '5700'),
('SO_002', '10', 'ITEM_IBUPROFEN_400', '50000', '0.078', '3900'),
('SO_003', '10', 'ITEM_IBUPROFEN_200', '75000', '0.042', '3150');

COMMIT;