-- Create missing PT Import tables based on pt-import-schema.ts
-- These tables are used for importing data from PlanetTogether APS system

-- Job Paths - Routing paths for manufacturing jobs
CREATE TABLE IF NOT EXISTS pt_job_paths (
  id SERIAL PRIMARY KEY,
  job_external_id TEXT,
  path_index TEXT,
  path_name TEXT,
  path_description TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Job Path Nodes - Individual steps/operations in a job path
CREATE TABLE IF NOT EXISTS pt_job_path_nodes (
  id SERIAL PRIMARY KEY,
  job_external_id TEXT,
  path_index TEXT,
  path_node_index TEXT,
  operation_external_id TEXT,
  sequence_number TEXT,
  operation_type TEXT,
  duration_minutes TEXT,
  setup_time_minutes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Job Products - Products produced by manufacturing jobs
CREATE TABLE IF NOT EXISTS pt_job_products (
  id SERIAL PRIMARY KEY,
  job_external_id TEXT,
  item_external_id TEXT,
  warehouse_external_id TEXT,
  quantity TEXT,
  qty_used TEXT,
  use_type TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Job Resource Capabilities - Required capabilities for job resources
CREATE TABLE IF NOT EXISTS pt_job_resource_capabilities (
  id SERIAL PRIMARY KEY,
  job_external_id TEXT,
  operation_external_id TEXT,
  capability_external_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Job Resources - Resources assigned to job operations
CREATE TABLE IF NOT EXISTS pt_job_resources (
  id SERIAL PRIMARY KEY,
  job_external_id TEXT,
  operation_external_id TEXT,
  plant_external_id TEXT,
  department_external_id TEXT,
  resource_external_id TEXT,
  primary_resource TEXT,
  resource_qty TEXT,
  run_rate TEXT,
  setup_time TEXT,
  helper_qty TEXT,
  utilization_effectiveness_percentage TEXT,
  setup_matrix_from_attribute_external_id TEXT,
  setup_matrix_to_attribute_external_id TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plants - Manufacturing facilities
CREATE TABLE IF NOT EXISTS pt_plants (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  name TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plant Warehouses - Storage facilities within plants
CREATE TABLE IF NOT EXISTS pt_plant_warehouses (
  id SERIAL PRIMARY KEY,
  plant_external_id TEXT,
  warehouse_external_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product Rules - Business rules for production planning
CREATE TABLE IF NOT EXISTS pt_product_rules (
  id SERIAL PRIMARY KEY,
  rule_name TEXT,
  rule_type TEXT,
  description TEXT,
  condition_expression TEXT,
  action_expression TEXT,
  priority_level TEXT,
  effective_date_start TEXT,
  effective_date_end TEXT,
  item_external_id TEXT,
  customer_external_id TEXT,
  plant_external_id TEXT,
  department_external_id TEXT,
  resource_external_id TEXT,
  operation_external_id TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Purchases to Stock - Purchase orders for inventory replenishment
CREATE TABLE IF NOT EXISTS pt_purchases_to_stock (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  name TEXT,
  description TEXT,
  item_external_id TEXT,
  warehouse_external_id TEXT,
  supplier_external_id TEXT,
  purchase_qty TEXT,
  unit_cost TEXT,
  total_cost TEXT,
  order_date TEXT,
  promised_date TEXT,
  received_date TEXT,
  status TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recurring Capacity Intervals - Repeating availability patterns
CREATE TABLE IF NOT EXISTS pt_recurring_capacity_intervals (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  name TEXT,
  description TEXT,
  recurrence_pattern TEXT,
  start_time TEXT,
  end_time TEXT,
  days_of_week TEXT,
  effective_date_start TEXT,
  effective_date_end TEXT,
  capacity_code TEXT,
  nbr_of_people TEXT,
  overtime TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resource Capabilities - Skills and capabilities of resources
CREATE TABLE IF NOT EXISTS pt_resource_capabilities (
  id SERIAL PRIMARY KEY,
  plant_external_id TEXT,
  department_external_id TEXT,
  resource_external_id TEXT,
  capability_external_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resource Connections - Relationships between resources
CREATE TABLE IF NOT EXISTS pt_resource_connections (
  id SERIAL PRIMARY KEY,
  from_plant_external_id TEXT,
  from_department_external_id TEXT,
  from_resource_external_id TEXT,
  to_plant_external_id TEXT,
  to_department_external_id TEXT,
  to_resource_external_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resource Connectors - Physical connections between resources
CREATE TABLE IF NOT EXISTS pt_resource_connectors (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  from_plant_external_id TEXT,
  from_department_external_id TEXT,
  from_resource_external_id TEXT,
  to_plant_external_id TEXT,
  to_department_external_id TEXT,
  to_resource_external_id TEXT,
  connector_type TEXT,
  transfer_time_minutes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resources - Manufacturing equipment and personnel
CREATE TABLE IF NOT EXISTS pt_resources (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  plant_external_id TEXT,
  department_external_id TEXT,
  name TEXT,
  description TEXT,
  resource_type TEXT,
  status TEXT,
  capacity_units TEXT,
  cost_per_hour TEXT,
  setup_time_minutes TEXT,
  efficiency_percentage TEXT,
  availability_percentage TEXT,
  maintenance_schedule TEXT,
  operator_required TEXT,
  shift_pattern TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sales Orders - Customer orders
CREATE TABLE IF NOT EXISTS pt_sales_orders (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  customer_external_id TEXT,
  order_number TEXT,
  order_date TEXT,
  promised_date TEXT,
  ship_date TEXT,
  priority TEXT,
  status TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sales Order Lines - Line items within sales orders
CREATE TABLE IF NOT EXISTS pt_sales_order_lines (
  id SERIAL PRIMARY KEY,
  sales_order_external_id TEXT,
  line_number TEXT,
  item_external_id TEXT,
  quantity TEXT,
  price TEXT,
  total_amount TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sales Order Line Distributions - Delivery distributions for order lines
CREATE TABLE IF NOT EXISTS pt_sales_order_line_distributions (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  sales_order_external_id TEXT,
  sales_order_line_external_id TEXT,
  item_external_id TEXT,
  warehouse_external_id TEXT,
  customer_external_id TEXT,
  distribution_qty TEXT,
  need_date TEXT,
  ship_date TEXT,
  priority TEXT,
  status TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transfer Orders - Internal transfers between facilities
CREATE TABLE IF NOT EXISTS pt_transfer_orders (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  from_warehouse_external_id TEXT,
  to_warehouse_external_id TEXT,
  transfer_date TEXT,
  status TEXT,
  priority TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transfer Order Distributions - Items being transferred
CREATE TABLE IF NOT EXISTS pt_transfer_order_distributions (
  id SERIAL PRIMARY KEY,
  transfer_order_external_id TEXT,
  item_external_id TEXT,
  from_warehouse_external_id TEXT,
  to_warehouse_external_id TEXT,
  transfer_qty TEXT,
  need_date TEXT,
  ship_date TEXT,
  received_date TEXT,
  status TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users - System users and planners
CREATE TABLE IF NOT EXISTS pt_users (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT,
  department TEXT,
  plant_external_id TEXT,
  is_active TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Warehouses - Storage facilities
CREATE TABLE IF NOT EXISTS pt_warehouses (
  id SERIAL PRIMARY KEY,
  external_id TEXT,
  name TEXT,
  description TEXT,
  warehouse_type TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  capacity TEXT,
  notes TEXT,
  user_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);