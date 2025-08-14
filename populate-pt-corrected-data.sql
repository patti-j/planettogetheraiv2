-- Populate PT Import tables with corrected column mappings
-- Based on actual table structures in the database

-- Insert Job Operations with correct column names
INSERT INTO pt_job_operations (job_external_id, external_id, name, description, operation_sequence, standard_run_hrs, standard_setup_hrs, notes, user_fields) VALUES
('JOB_IBU200_001', 'OP_MIX_001', 'Blending Operation', 'Blend API with excipients', 10, '3.0', '0.75', 'Critical blend uniformity', '{"blend_time": "15min", "speed": "10rpm"}'),
('JOB_IBU200_001', 'OP_PRESS_001', 'Tablet Compression', 'Compress blended material into tablets', 20, '4.0', '1.5', 'Monitor tablet hardness', '{"target_hardness": "8-12kp", "thickness": "4.5mm"}'),
('JOB_IBU200_001', 'OP_COAT_001', 'Film Coating', 'Apply protective film coating', 30, '5.0', '2.0', 'Moisture protection coating', '{"coating_weight": "3%", "color": "white"}'),
('JOB_IBU200_001', 'OP_PACK_001', 'Primary Packaging', 'Blister packaging of tablets', 40, '7.0', '1.0', 'Tamper-evident packaging', '{"format": "10x10", "material": "PVC/ALU"}'),
('JOB_IBU400_001', 'OP_MIX_002', 'High Strength Blending', 'Blend higher concentration API', 10, '3.5', '1.0', 'Extended blend time for uniformity', '{"blend_time": "20min", "speed": "8rpm"}'),
('JOB_IBU400_001', 'OP_PRESS_002', 'High Strength Compression', 'Compress 400mg tablets', 20, '4.67', '2.0', 'Higher compression force required', '{"target_hardness": "10-15kp", "thickness": "5.2mm"}'),
('JOB_IBU400_001', 'OP_PACK_002', 'Prescription Packaging', 'Bottle packaging for prescription', 30, '6.0', '0.75', 'Child-resistant bottles', '{"bottle_size": "100ct", "cap_type": "CR"}');

-- Insert Job Resources with correct column names (remove notes column)
INSERT INTO pt_job_resources (job_external_id, operation_external_id, plant_external_id, department_external_id, resource_external_id, primary_resource, resource_qty, run_rate, setup_time, user_fields) VALUES
('JOB_IBU200_001', 'OP_MIX_001', 'PLANT_001', 'DEPT_MIX_001', 'RES_MIX_001', 'true', '1', '0.33', '45', '{"efficiency": 92, "notes": "Primary mixer assignment"}'),
('JOB_IBU200_001', 'OP_MIX_001', 'PLANT_001', 'DEPT_MIX_001', 'RES_OPER_001', 'true', '1', '1.0', '0', '{"shift": "day", "notes": "Operator assignment"}'),
('JOB_IBU200_001', 'OP_PRESS_001', 'PLANT_001', 'DEPT_PRESS_001', 'RES_PRESS_001', 'true', '1', '208', '90', '{"target_speed": "208tpm", "notes": "Press line assignment"}'),
('JOB_IBU200_001', 'OP_PRESS_001', 'PLANT_001', 'DEPT_PRESS_001', 'RES_OPER_002', 'true', '1', '1.0', '0', '{"certification": "validated", "notes": "Press operator"}'),
('JOB_IBU200_001', 'OP_COAT_001', 'PLANT_001', 'DEPT_COAT_001', 'RES_COAT_001', 'true', '1', '0.17', '120', '{"coating_efficiency": 90, "notes": "Coating pan assignment"}'),
('JOB_IBU200_001', 'OP_PACK_001', 'PLANT_001', 'DEPT_PACK_001', 'RES_PACK_001', 'true', '1', '119', '60', '{"speed_bpm": 400, "notes": "Blister line assignment"}');

-- Insert Job Materials with correct column names
INSERT INTO pt_job_materials (job_external_id, op_external_id, item_external_id, warehouse_external_id, total_required_qty, uom, total_cost) VALUES
('JOB_IBU200_001', 'OP_MIX_001', 'ITEM_API_IBUPROFEN', 'WH_MAIN_001', '10.0', 'kg', '1255.00'),
('JOB_IBU200_001', 'OP_MIX_001', 'ITEM_LACTOSE', 'WH_MAIN_001', '25.0', 'kg', '70.00'),
('JOB_IBU200_001', 'OP_MIX_001', 'ITEM_MCC', 'WH_MAIN_001', '12.0', 'kg', '38.40'),
('JOB_IBU200_001', 'OP_MIX_001', 'ITEM_PVP', 'WH_MAIN_001', '2.0', 'kg', '37.50'),
('JOB_IBU200_001', 'OP_PACK_001', 'ITEM_IBUPROFEN_200', 'WH_FG_001', '50000', 'tablets', '1250.00');

-- Insert Inventories with correct column names (remove notes column)
INSERT INTO pt_inventories (item_external_id, warehouse_external_id, on_hand_qty, safety_stock, max_inventory, lead_time_days) VALUES
('ITEM_API_IBUPROFEN', 'WH_MAIN_001', '500', '100', '1000', '45'),
('ITEM_LACTOSE', 'WH_MAIN_001', '50000', '10000', '100000', '14'),
('ITEM_MCC', 'WH_MAIN_001', '30000', '5000', '75000', '21'),
('ITEM_IBUPROFEN_200', 'WH_FG_001', '125000', '25000', '500000', '0'),
('ITEM_IBUPROFEN_400', 'WH_FG_001', '75000', '15000', '300000', '0');

-- Additional PT Import tables data
-- Insert Job Activities (work orders tracking)
INSERT INTO pt_job_activities (job_external_id, operation_external_id, activity_name, description, status, start_date_time, end_date_time, user_fields) VALUES
('JOB_IBU200_001', 'OP_MIX_001', 'Material Preparation', 'Prepare and stage raw materials', 'Completed', '2025-08-18 08:00:00', '2025-08-18 08:30:00', '{"operator": "John Smith", "verified": true}'),
('JOB_IBU200_001', 'OP_MIX_001', 'Blending Process', 'Execute blending operation', 'In Progress', '2025-08-18 08:30:00', null, '{"blend_speed": "10rpm", "temperature": "22C"}'),
('JOB_IBU200_001', 'OP_PRESS_001', 'Press Setup', 'Setup tablet press for production', 'Planned', null, null, '{"tooling": "8mm_round", "target_weight": "320mg"}');

-- Insert Job Path information
INSERT INTO pt_job_paths (job_external_id, path_index, path_name, path_description, user_fields) VALUES
('JOB_IBU200_001', '1', 'Standard Tablet Path', 'Standard manufacturing path for solid dosage forms', '{"path_type": "primary", "yield_target": "98%"}'),
('JOB_IBU400_001', '1', 'High Strength Path', 'Manufacturing path for higher strength tablets', '{"path_type": "primary", "yield_target": "97%"}');

-- Insert Job Path Nodes
INSERT INTO pt_job_path_nodes (job_external_id, path_index, path_node_index, operation_external_id, sequence_number, operation_type, duration_minutes, setup_time_minutes, user_fields) VALUES
('JOB_IBU200_001', '1', '1', 'OP_MIX_001', '10', 'Mixing', '180', '45', '{"critical_path": true}'),
('JOB_IBU200_001', '1', '2', 'OP_PRESS_001', '20', 'Compression', '240', '90', '{"critical_path": true}'),
('JOB_IBU200_001', '1', '3', 'OP_COAT_001', '30', 'Coating', '300', '120', '{"critical_path": false}'),
('JOB_IBU200_001', '1', '4', 'OP_PACK_001', '40', 'Packaging', '420', '60', '{"critical_path": false}');

-- Insert Job Products
INSERT INTO pt_job_products (job_external_id, item_external_id, warehouse_external_id, quantity, qty_used, use_type, user_fields) VALUES
('JOB_IBU200_001', 'ITEM_IBUPROFEN_200', 'WH_FG_001', '50000', '0', 'Output', '{"yield_expected": "98%", "quality_grade": "A"}'),
('JOB_IBU400_001', 'ITEM_IBUPROFEN_400', 'WH_FG_001', '30000', '0', 'Output', '{"yield_expected": "97%", "quality_grade": "A"}');

-- Insert Users
INSERT INTO pt_users (external_id, username, first_name, last_name, email, role, department, plant_external_id, is_active, user_fields) VALUES
('USER_001', 'jsmith', 'John', 'Smith', 'john.smith@acmepharma.com', 'Production Supervisor', 'Manufacturing', 'PLANT_001', 'true', '{"security_clearance": "high", "certifications": ["GMP", "FDA"]}'),
('USER_002', 'sjohnson', 'Sarah', 'Johnson', 'sarah.johnson@acmepharma.com', 'Quality Manager', 'Quality Control', 'PLANT_001', 'true', '{"security_clearance": "high", "certifications": ["GMP", "FDA", "ISO"]}'),
('USER_003', 'mbrown', 'Mike', 'Brown', 'mike.brown@acmepharma.com', 'Maintenance Engineer', 'Engineering', 'PLANT_001', 'true', '{"security_clearance": "medium", "certifications": ["Mechanical", "Electrical"]}');

-- Insert Sales Order Line Distributions
INSERT INTO pt_sales_order_line_distributions (external_id, sales_order_external_id, sales_order_line_external_id, item_external_id, warehouse_external_id, customer_external_id, distribution_qty, need_date, priority, status, user_fields) VALUES
('SOLD_001', 'SO_001', 'SOL_001', 'ITEM_IBUPROFEN_200', 'WH_FG_001', 'CUST_PHARMACY_CHAIN', '100000', '2025-08-25 00:00:00', 'High', 'Confirmed', '{"shipping_method": "ground", "special_handling": false}'),
('SOLD_002', 'SO_002', 'SOL_002', 'ITEM_IBUPROFEN_400', 'WH_FG_001', 'CUST_HOSPITAL_GROUP', '50000', '2025-08-30 00:00:00', 'Medium', 'Confirmed', '{"shipping_method": "next_day", "special_handling": true}');

-- Insert Transfer Orders
INSERT INTO pt_transfer_orders (external_id, from_warehouse_external_id, to_warehouse_external_id, transfer_date, status, priority, user_fields) VALUES
('TO_001', 'WH_FG_001', 'WH_WEST_FG', '2025-08-20', 'Planned', 'Medium', '{"reason": "stock_balancing", "truck_number": "TRK001"}'),
('TO_002', 'WH_MAIN_001', 'WH_FG_001', '2025-08-19', 'In Transit', 'High', '{"reason": "production_supply", "urgent": true}');

-- Insert Transfer Order Distributions
INSERT INTO pt_transfer_order_distributions (transfer_order_external_id, item_external_id, from_warehouse_external_id, to_warehouse_external_id, transfer_qty, need_date, status, user_fields) VALUES
('TO_001', 'ITEM_IBUPROFEN_200', 'WH_FG_001', 'WH_WEST_FG', '25000', '2025-08-20 00:00:00', 'Planned', '{"priority": "normal", "packaging": "case"}'),
('TO_002', 'ITEM_LACTOSE', 'WH_MAIN_001', 'WH_FG_001', '5000', '2025-08-19 00:00:00', 'In Transit', '{"priority": "urgent", "lot_number": "LAC2025081"}');

COMMIT;