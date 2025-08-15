-- =====================================================
-- COMPREHENSIVE MASTER DATA FIELD DESCRIPTIONS
-- Complete field descriptions for all master data tables
-- Generated: July 30, 2025
-- =====================================================

-- =====================================================
-- CORE MASTER DATA TABLES
-- =====================================================

-- Plants Table Comments (Manufacturing Facilities)
COMMENT ON TABLE plants IS 'Manufacturing facilities and production locations where manufacturing operations take place';
COMMENT ON COLUMN plants.id IS 'Unique identifier for each manufacturing plant';
COMMENT ON COLUMN plants.name IS 'Descriptive name of the manufacturing plant (e.g., "North Campus Plant", "Chemical Processing Facility")';
COMMENT ON COLUMN plants.location IS 'Physical location or city where the plant is located (e.g., "Chicago, IL", "Frankfurt, Germany")';
COMMENT ON COLUMN plants.address IS 'Complete physical address of the manufacturing plant including street, city, state, postal code';
COMMENT ON COLUMN plants.timezone IS 'Timezone identifier for plant operations (e.g., "America/Chicago", "Europe/Berlin") for scheduling accuracy';
COMMENT ON COLUMN plants.is_active IS 'Whether the plant is currently active and operational for manufacturing';
COMMENT ON COLUMN plants.created_at IS 'Timestamp when plant record was created in the system';

-- Resources Table Comments (Manufacturing Resources)
COMMENT ON TABLE resources IS 'Manufacturing resources including equipment, machinery, tools, and personnel used in production';
COMMENT ON COLUMN resources.id IS 'Unique identifier for each manufacturing resource';
COMMENT ON COLUMN resources.name IS 'Descriptive name of the resource (e.g., "Tablet Press #1", "HPLC Analyzer", "Production Supervisor")';
COMMENT ON COLUMN resources.type IS 'Type classification of resource (machine, equipment, tool, labor, vehicle, facility, utility)';
COMMENT ON COLUMN resources.status IS 'Current operational status (active, inactive, maintenance, down, reserved)';
COMMENT ON COLUMN resources.capabilities IS 'JSON array of capability IDs that this resource can perform (references capabilities table)';
COMMENT ON COLUMN resources.photo IS 'Base64 encoded photo or image data for visual identification of the resource';

-- Capabilities Table Comments (Resource Capabilities)
COMMENT ON TABLE capabilities IS 'Manufacturing capabilities and skills that resources can perform in production processes';
COMMENT ON COLUMN capabilities.id IS 'Unique identifier for each manufacturing capability';
COMMENT ON COLUMN capabilities.name IS 'Name of the manufacturing capability (e.g., "Tablet Pressing", "Quality Testing", "Chemical Mixing")';
COMMENT ON COLUMN capabilities.description IS 'Detailed description of what this capability involves and its requirements';

-- Customers Table Comments (Customer Master Data)
COMMENT ON TABLE customers IS 'Customer master data for managing relationships with clients who purchase manufactured products';
COMMENT ON COLUMN customers.id IS 'Unique identifier for each customer record';
COMMENT ON COLUMN customers.customer_code IS 'Unique business code for customer identification (e.g., "CUST-001", "PHARMA-ABC")';
COMMENT ON COLUMN customers.customer_name IS 'Official business name of the customer organization';
COMMENT ON COLUMN customers.customer_type IS 'Classification of customer type (individual, corporate, government, distributor, retailer)';
COMMENT ON COLUMN customers.contact_person IS 'Primary contact person name at the customer organization';
COMMENT ON COLUMN customers.email IS 'Primary email address for customer communications';
COMMENT ON COLUMN customers.phone IS 'Primary phone number for customer contact';
COMMENT ON COLUMN customers.address IS 'Complete business address of the customer including street, city, state, postal code';
COMMENT ON COLUMN customers.credit_limit IS 'Maximum credit limit allowed for this customer in base currency';
COMMENT ON COLUMN customers.payment_terms IS 'Standard payment terms for this customer (NET30, 2/10NET30, COD, etc.)';
COMMENT ON COLUMN customers.tax_id IS 'Tax identification number or VAT number for the customer';
COMMENT ON COLUMN customers.is_active IS 'Whether the customer is currently active for business transactions';
COMMENT ON COLUMN customers.created_at IS 'Timestamp when customer record was created';
COMMENT ON COLUMN customers.updated_at IS 'Timestamp of last customer record modification';

-- Vendors Table Comments (Supplier Master Data)
COMMENT ON TABLE vendors IS 'Vendor and supplier master data for managing relationships with material and service providers';
COMMENT ON COLUMN vendors.id IS 'Unique identifier for each vendor record';
COMMENT ON COLUMN vendors.vendor_code IS 'Unique business code for vendor identification (e.g., "VEND-001", "CHEM-SUPPLIER-ABC")';
COMMENT ON COLUMN vendors.vendor_name IS 'Official business name of the vendor organization';
COMMENT ON COLUMN vendors.vendor_type IS 'Classification of vendor type (material_supplier, service_provider, contractor, consultant)';
COMMENT ON COLUMN vendors.contact_person IS 'Primary contact person name at the vendor organization';
COMMENT ON COLUMN vendors.email IS 'Primary email address for vendor communications';
COMMENT ON COLUMN vendors.phone IS 'Primary phone number for vendor contact';
COMMENT ON COLUMN vendors.address IS 'Complete business address of the vendor including street, city, state, postal code';
COMMENT ON COLUMN vendors.payment_terms IS 'Standard payment terms with this vendor (NET30, 2/10NET30, etc.)';
COMMENT ON COLUMN vendors.credit_limit IS 'Credit limit or maximum order amount allowed with this vendor';
COMMENT ON COLUMN vendors.lead_time_days IS 'Standard lead time in days for orders from this vendor';
COMMENT ON COLUMN vendors.quality_rating IS 'Quality performance rating for this vendor (1-10 scale)';
COMMENT ON COLUMN vendors.delivery_rating IS 'Delivery performance rating for this vendor (1-10 scale)';
COMMENT ON COLUMN vendors.service_rating IS 'Service quality rating for this vendor (1-10 scale)';
COMMENT ON COLUMN vendors.vendor_category IS 'Strategic category classification (strategic, preferred, standard, limited)';
COMMENT ON COLUMN vendors.strategic_importance IS 'Strategic importance level (critical, high, medium, low)';
COMMENT ON COLUMN vendors.risk_level IS 'Risk assessment level (low, medium, high, critical)';
COMMENT ON COLUMN vendors.contract_start_date IS 'Contract effective start date for this vendor relationship';
COMMENT ON COLUMN vendors.contract_end_date IS 'Contract expiration date for this vendor relationship';
COMMENT ON COLUMN vendors.contract_type IS 'Type of contract agreement (blanket, spot, framework, master_agreement)';
COMMENT ON COLUMN vendors.minimum_order_amount IS 'Minimum order amount required by this vendor';
COMMENT ON COLUMN vendors.maximum_order_amount IS 'Maximum order amount allowed with this vendor';
COMMENT ON COLUMN vendors.freight_terms IS 'Freight payment terms (FOB_origin, FOB_destination, prepaid, collect)';
COMMENT ON COLUMN vendors.incoterms IS 'International commercial terms (EXW, FOB, CIF, DDP, etc.)';
COMMENT ON COLUMN vendors.currency_code IS 'Primary currency used for transactions with this vendor';
COMMENT ON COLUMN vendors.tax_id IS 'Tax identification number or VAT number for the vendor';
COMMENT ON COLUMN vendors.certifications IS 'JSON array of certifications held by vendor (ISO, FDA, etc.)';
COMMENT ON COLUMN vendors.capabilities IS 'JSON array describing vendor capabilities and specializations';
COMMENT ON COLUMN vendors.diversity_classification IS 'Diversity business classification (small_business, minority_owned, woman_owned, etc.)';
COMMENT ON COLUMN vendors.environmental_rating IS 'Environmental sustainability rating (1-10 scale)';
COMMENT ON COLUMN vendors.social_responsibility_rating IS 'Social responsibility rating (1-10 scale)';
COMMENT ON COLUMN vendors.geographic_region IS 'Geographic region classification (local, regional, national, international)';
COMMENT ON COLUMN vendors.time_zone IS 'Vendor primary timezone for communication and scheduling';
COMMENT ON COLUMN vendors.banking_information IS 'JSON object containing banking details for payments';
COMMENT ON COLUMN vendors.insurance_requirements IS 'JSON object describing required insurance coverage';
COMMENT ON COLUMN vendors.audit_frequency IS 'Required audit frequency for this vendor (annual, semi_annual, quarterly)';
COMMENT ON COLUMN vendors.last_audit_date IS 'Date of most recent vendor audit';
COMMENT ON COLUMN vendors.next_audit_date IS 'Scheduled date for next vendor audit';
COMMENT ON COLUMN vendors.business_continuity_plan IS 'Whether vendor has acceptable business continuity plan';
COMMENT ON COLUMN vendors.backup_vendor_id IS 'Reference to backup vendor for this supplier';
COMMENT ON COLUMN vendors.spend_category IS 'Procurement spend category classification';
COMMENT ON COLUMN vendors.edi_capable IS 'Whether vendor supports Electronic Data Interchange';
COMMENT ON COLUMN vendors.vmi_capable IS 'Whether vendor supports Vendor Managed Inventory';
COMMENT ON COLUMN vendors.consignment_eligible IS 'Whether vendor is eligible for consignment arrangements';
COMMENT ON COLUMN vendors.drop_ship_capable IS 'Whether vendor can drop ship directly to customers';
COMMENT ON COLUMN vendors.blanket_po_eligible IS 'Whether vendor is eligible for blanket purchase orders';
COMMENT ON COLUMN vendors.is_active IS 'Whether the vendor is currently active for business transactions';
COMMENT ON COLUMN vendors.created_by IS 'User ID who created this vendor record';
COMMENT ON COLUMN vendors.last_modified_by IS 'User ID who last modified this vendor record';
COMMENT ON COLUMN vendors.created_at IS 'Timestamp when vendor record was created';
COMMENT ON COLUMN vendors.last_modified_date IS 'Timestamp of last vendor record modification';
COMMENT ON COLUMN vendors.last_order_date IS 'Date of most recent purchase order placed with this vendor';

-- Items Table Comments (Item Master Data)
COMMENT ON TABLE items IS 'Item master data for all products, materials, and inventory items used in manufacturing';
COMMENT ON COLUMN items.id IS 'Unique identifier for each item record';
COMMENT ON COLUMN items.item_number IS 'Unique business identifier for the item (SKU, part number, product code)';
COMMENT ON COLUMN items.item_name IS 'Descriptive name of the item or product';
COMMENT ON COLUMN items.description IS 'Detailed description of the item including specifications and characteristics';
COMMENT ON COLUMN items.item_type IS 'Classification of item type (raw_material, component, finished_product, service, tool)';
COMMENT ON COLUMN items.category IS 'Item category classification for grouping and reporting';
COMMENT ON COLUMN items.subcategory IS 'Item subcategory for detailed classification within category';
COMMENT ON COLUMN items.unit_of_measure IS 'Primary unit of measure for this item (kg, liters, pieces, hours)';
COMMENT ON COLUMN items.alternate_unit_of_measure IS 'Secondary unit of measure for alternative ordering/usage';
COMMENT ON COLUMN items.conversion_factor IS 'Conversion factor between primary and alternate units of measure';
COMMENT ON COLUMN items.standard_cost IS 'Standard cost per unit in base currency for cost accounting';
COMMENT ON COLUMN items.average_cost IS 'Current average cost per unit based on recent transactions';
COMMENT ON COLUMN items.last_cost IS 'Most recent purchase cost per unit for this item';
COMMENT ON COLUMN items.target_margin IS 'Target gross margin percentage for pricing this item';
COMMENT ON COLUMN items.minimum_stock IS 'Minimum stock level that should be maintained';
COMMENT ON COLUMN items.maximum_stock IS 'Maximum stock level for inventory optimization';
COMMENT ON COLUMN items.reorder_point IS 'Stock level at which reorder should be triggered';
COMMENT ON COLUMN items.economic_order_quantity IS 'Optimal order quantity for cost efficiency';
COMMENT ON COLUMN items.minimum_order_quantity IS 'Minimum quantity that must be ordered at one time';
COMMENT ON COLUMN items.order_multiple IS 'Order quantity must be multiple of this value';
COMMENT ON COLUMN items.lead_time_days IS 'Standard lead time in days for procurement or production';
COMMENT ON COLUMN items.safety_stock IS 'Safety stock quantity to buffer against demand variability';
COMMENT ON COLUMN items.abc_classification IS 'ABC classification based on usage value (A=high, B=medium, C=low)';
COMMENT ON COLUMN items.xyz_classification IS 'XYZ classification based on demand variability (X=stable, Y=variable, Z=irregular)';
COMMENT ON COLUMN items.annual_usage IS 'Annual usage quantity for ABC/XYZ analysis';
COMMENT ON COLUMN items.demand_variability IS 'Measure of demand variability for inventory planning';
COMMENT ON COLUMN items.lifecycle_stage IS 'Product lifecycle stage (introduction, growth, maturity, decline, discontinued)';
COMMENT ON COLUMN items.phase_out_date IS 'Planned phase-out date for discontinued items';
COMMENT ON COLUMN items.replacement_item_id IS 'Reference to replacement item for discontinued products';
COMMENT ON COLUMN items.revision_level IS 'Current revision or version level of the item design';
COMMENT ON COLUMN items.release_date IS 'Date when item was released for production or sale';
COMMENT ON COLUMN items.weight IS 'Physical weight of one unit of the item';
COMMENT ON COLUMN items.weight_unit IS 'Unit of measure for weight (kg, lbs, grams)';
COMMENT ON COLUMN items.dimensions IS 'JSON object containing length, width, height, diameter measurements';
COMMENT ON COLUMN items.volume IS 'Volume of one unit of the item';
COMMENT ON COLUMN items.volume_unit IS 'Unit of measure for volume (liters, cubic_meters, gallons)';
COMMENT ON COLUMN items.shelf_life_days IS 'Shelf life in days for perishable items';
COMMENT ON COLUMN items.lot_controlled IS 'Whether this item requires lot tracking for traceability';
COMMENT ON COLUMN items.serial_controlled IS 'Whether this item requires serial number tracking';
COMMENT ON COLUMN items.quality_grade IS 'Quality grade classification (A, B, C, pharmaceutical, food_grade)';
COMMENT ON COLUMN items.requires_inspection IS 'Whether incoming material requires quality inspection';
COMMENT ON COLUMN items.hazardous_material IS 'Whether item is classified as hazardous material';
COMMENT ON COLUMN items.regulatory_class IS 'Regulatory classification (controlled, restricted, standard)';
COMMENT ON COLUMN items.un_code IS 'UN hazardous goods classification code if applicable';
COMMENT ON COLUMN items.cas_number IS 'Chemical Abstracts Service number for chemical substances';
COMMENT ON COLUMN items.storage_conditions IS 'JSON object describing required storage conditions (temperature, humidity, etc.)';
COMMENT ON COLUMN items.preferred_vendor_id IS 'Reference to preferred vendor for this item';
COMMENT ON COLUMN items.source_type IS 'Source type classification (make, buy, make_or_buy)';
COMMENT ON COLUMN items.buyer_code IS 'Code identifying the buyer responsible for this item';
COMMENT ON COLUMN items.planner_code IS 'Code identifying the planner responsible for this item';
COMMENT ON COLUMN items.sourcing_strategy IS 'Sourcing strategy (single_source, multi_source, strategic_source)';
COMMENT ON COLUMN items.make_vs_buy_decision IS 'Current make vs buy decision for this item';
COMMENT ON COLUMN items.commodity_code IS 'Commodity classification code for purchasing';
COMMENT ON COLUMN items.hts_code IS 'Harmonized Tariff Schedule code for international trade';
COMMENT ON COLUMN items.country_of_origin IS 'Country where the item is manufactured or sourced';
COMMENT ON COLUMN items.product_family IS 'Product family grouping for planning and analysis';
COMMENT ON COLUMN items.planning_method IS 'Planning method (MRP, reorder_point, kanban, forecast)';
COMMENT ON COLUMN items.planning_horizon IS 'Planning horizon in days for this item';
COMMENT ON COLUMN items.consumption_method IS 'Method for material consumption (backflush, pick_list, manual)';
COMMENT ON COLUMN items.backflush_flag IS 'Whether material is backflushed during production';
COMMENT ON COLUMN items.phantom_flag IS 'Whether item is a phantom (planning-only) bill of material';
COMMENT ON COLUMN items.critical_component IS 'Whether this is a critical component requiring special attention';
COMMENT ON COLUMN items.tags IS 'JSON array of tags for flexible categorization and search';
COMMENT ON COLUMN items.is_active IS 'Whether the item is currently active for transactions';
COMMENT ON COLUMN items.created_by IS 'User ID who created this item record';
COMMENT ON COLUMN items.last_modified_by IS 'User ID who last modified this item record';
COMMENT ON COLUMN items.created_at IS 'Timestamp when item record was created';
COMMENT ON COLUMN items.last_modified_date IS 'Timestamp of last item record modification';
COMMENT ON COLUMN items.last_count_date IS 'Date of most recent physical inventory count';
COMMENT ON COLUMN items.last_usage_date IS 'Date of most recent usage in production or sales';

-- =====================================================
-- ORGANIZATIONAL STRUCTURE TABLES
-- =====================================================

-- Departments Table Comments
COMMENT ON TABLE departments IS 'Organizational departments within manufacturing plants for structuring operations and responsibilities';
COMMENT ON COLUMN departments.id IS 'Unique identifier for each department';
COMMENT ON COLUMN departments.plant_id IS 'Reference to the plant that contains this department';
COMMENT ON COLUMN departments.department_code IS 'Unique business code for department identification';
COMMENT ON COLUMN departments.department_name IS 'Descriptive name of the department';
COMMENT ON COLUMN departments.department_type IS 'Type classification (production, quality_control, maintenance, engineering, administration)';
COMMENT ON COLUMN departments.manager IS 'Name of department manager or supervisor';
COMMENT ON COLUMN departments.cost_center IS 'Cost center code for financial tracking and reporting';
COMMENT ON COLUMN departments.budget_amount IS 'Annual budget allocation for this department';
COMMENT ON COLUMN departments.employee_count IS 'Number of employees assigned to this department';
COMMENT ON COLUMN departments.is_active IS 'Whether the department is currently active and operational';
COMMENT ON COLUMN departments.created_at IS 'Timestamp when department record was created';
COMMENT ON COLUMN departments.updated_at IS 'Timestamp of last department record modification';

-- Work Centers Table Comments
COMMENT ON TABLE work_centers IS 'Manufacturing work centers and production stations within departments';
COMMENT ON COLUMN work_centers.id IS 'Unique identifier for each work center';
COMMENT ON COLUMN work_centers.department_id IS 'Reference to the department that contains this work center';
COMMENT ON COLUMN work_centers.work_center_code IS 'Unique business code for work center identification';
COMMENT ON COLUMN work_centers.work_center_name IS 'Descriptive name of the work center';
COMMENT ON COLUMN work_centers.work_center_type IS 'Type classification (machine_center, assembly_station, inspection_point, packaging_line)';
COMMENT ON COLUMN work_centers.capacity IS 'Maximum production capacity per hour or shift';
COMMENT ON COLUMN work_centers.capacity_unit IS 'Unit of measure for capacity (units/hour, kg/hour, liters/hour)';
COMMENT ON COLUMN work_centers.efficiency IS 'Current efficiency percentage (0-100) of the work center';
COMMENT ON COLUMN work_centers.utilization IS 'Current utilization percentage (0-100) of available time';
COMMENT ON COLUMN work_centers.cost_per_hour IS 'Hourly cost rate for using this work center';
COMMENT ON COLUMN work_centers.setup_time IS 'Standard setup time in minutes for job changeovers';
COMMENT ON COLUMN work_centers.queue_time IS 'Standard queue time in minutes for jobs waiting at this work center';
COMMENT ON COLUMN work_centers.move_time IS 'Standard move time in minutes to transport materials to/from work center';
COMMENT ON COLUMN work_centers.calendar_id IS 'Reference to working calendar defining available hours';
COMMENT ON COLUMN work_centers.shift_pattern IS 'Shift pattern description (1_shift, 2_shift, 3_shift, continuous)';
COMMENT ON COLUMN work_centers.supervisor IS 'Name of work center supervisor or lead operator';
COMMENT ON COLUMN work_centers.is_active IS 'Whether the work center is currently active and available';
COMMENT ON COLUMN work_centers.created_at IS 'Timestamp when work center record was created';
COMMENT ON COLUMN work_centers.updated_at IS 'Timestamp of last work center record modification';

-- =====================================================
-- JUNCTION TABLES AND RELATIONSHIPS
-- =====================================================

-- Plant Resources Junction Table Comments
COMMENT ON TABLE plant_resources IS 'Many-to-many relationship between plants and resources showing resource allocation';
COMMENT ON COLUMN plant_resources.id IS 'Unique identifier for each plant-resource relationship';
COMMENT ON COLUMN plant_resources.plant_id IS 'Reference to the plant where resource is located';
COMMENT ON COLUMN plant_resources.resource_id IS 'Reference to the resource assigned to the plant';
COMMENT ON COLUMN plant_resources.is_primary IS 'Whether this is the primary plant assignment for this resource';
COMMENT ON COLUMN plant_resources.allocation_percentage IS 'Percentage of resource time allocated to this plant (0-100)';
COMMENT ON COLUMN plant_resources.effective_date IS 'Date when this resource allocation becomes effective';
COMMENT ON COLUMN plant_resources.end_date IS 'Date when this resource allocation ends (null for ongoing)';
COMMENT ON COLUMN plant_resources.cost_allocation_method IS 'Method for allocating resource costs (direct, percentage, usage_based)';
COMMENT ON COLUMN plant_resources.created_at IS 'Timestamp when plant-resource relationship was created';

-- Work Center Resources Junction Table Comments
COMMENT ON TABLE work_center_resources IS 'Many-to-many relationship between work centers and resources';
COMMENT ON COLUMN work_center_resources.id IS 'Unique identifier for each work center-resource relationship';
COMMENT ON COLUMN work_center_resources.work_center_id IS 'Reference to the work center using the resource';
COMMENT ON COLUMN work_center_resources.resource_id IS 'Reference to the resource assigned to the work center';
COMMENT ON COLUMN work_center_resources.is_primary IS 'Whether this is the primary work center for this resource';
COMMENT ON COLUMN work_center_resources.allocation_percentage IS 'Percentage of resource time allocated to this work center (0-100)';
COMMENT ON COLUMN work_center_resources.effective_date IS 'Date when this resource allocation becomes effective';
COMMENT ON COLUMN work_center_resources.end_date IS 'Date when this resource allocation ends (null for ongoing)';
COMMENT ON COLUMN work_center_resources.cost_allocation_method IS 'Method for allocating resource costs (direct, percentage, usage_based)';
COMMENT ON COLUMN work_center_resources.created_at IS 'Timestamp when work center-resource relationship was created';

-- Department Resources Junction Table Comments
COMMENT ON TABLE department_resources IS 'Many-to-many relationship between departments and resources';
COMMENT ON COLUMN department_resources.id IS 'Unique identifier for each department-resource relationship';
COMMENT ON COLUMN department_resources.department_id IS 'Reference to the department using the resource';
COMMENT ON COLUMN department_resources.resource_id IS 'Reference to the resource assigned to the department';
COMMENT ON COLUMN department_resources.is_primary IS 'Whether this is the primary department for this resource';
COMMENT ON COLUMN department_resources.allocation_percentage IS 'Percentage of resource time allocated to this department (0-100)';
COMMENT ON COLUMN department_resources.effective_date IS 'Date when this resource allocation becomes effective';
COMMENT ON COLUMN department_resources.end_date IS 'Date when this resource allocation ends (null for ongoing)';
COMMENT ON COLUMN department_resources.cost_allocation_method IS 'Method for allocating resource costs (direct, percentage, usage_based)';
COMMENT ON COLUMN department_resources.created_at IS 'Timestamp when department-resource relationship was created';

-- =====================================================
-- SYSTEM AND USER MANAGEMENT TABLES
-- =====================================================

-- Users Table Comments
COMMENT ON TABLE users IS 'System users with authentication credentials and role-based access control';
COMMENT ON COLUMN users.id IS 'Unique identifier for each user account';
COMMENT ON COLUMN users.username IS 'Unique username for login authentication';
COMMENT ON COLUMN users.password IS 'Encrypted password hash for secure authentication';
COMMENT ON COLUMN users.email IS 'User email address for notifications and communication';
COMMENT ON COLUMN users.first_name IS 'User first name for personalization';
COMMENT ON COLUMN users.last_name IS 'User last name for identification';
COMMENT ON COLUMN users.roles IS 'JSON array of user roles and permissions (admin, manager, operator, viewer)';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is currently active and can log in';
COMMENT ON COLUMN users.last_login IS 'Timestamp of user last successful login';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of last user account modification';

-- User Preferences Table Comments
COMMENT ON TABLE user_preferences IS 'Individual user interface and system preferences for personalization';
COMMENT ON COLUMN user_preferences.id IS 'Unique identifier for user preferences record';
COMMENT ON COLUMN user_preferences.user_id IS 'Reference to the user who owns these preferences';
COMMENT ON COLUMN user_preferences.theme IS 'UI theme preference (light, dark, auto, system)';
COMMENT ON COLUMN user_preferences.notifications_enabled IS 'Whether notifications are enabled for this user';
COMMENT ON COLUMN user_preferences.language IS 'Preferred language code for user interface (en, es, fr, de, etc.)';
COMMENT ON COLUMN user_preferences.timezone IS 'User timezone for date/time display and scheduling';
COMMENT ON COLUMN user_preferences.default_plant_id IS 'Default manufacturing plant for user operations and views';
COMMENT ON COLUMN user_preferences.date_format IS 'Preferred date format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)';
COMMENT ON COLUMN user_preferences.time_format IS 'Preferred time format (12_hour, 24_hour)';
COMMENT ON COLUMN user_preferences.number_format IS 'Preferred number format and decimal separator';
COMMENT ON COLUMN user_preferences.currency_symbol IS 'Preferred currency symbol for financial displays';
COMMENT ON COLUMN user_preferences.dashboard_layout IS 'JSON object defining user dashboard widget layout and preferences';
COMMENT ON COLUMN user_preferences.created_at IS 'Timestamp when preferences record was created';
COMMENT ON COLUMN user_preferences.updated_at IS 'Timestamp of last preferences modification';

-- Field Comments Table Comments (Database Documentation)
COMMENT ON TABLE field_comments IS 'Database field documentation and comments for schema understanding';
COMMENT ON COLUMN field_comments.id IS 'Unique identifier for each field comment record';
COMMENT ON COLUMN field_comments.table_name IS 'Name of the database table containing the field';
COMMENT ON COLUMN field_comments.column_name IS 'Name of the database column being documented';
COMMENT ON COLUMN field_comments.comment IS 'Detailed description and documentation for the database field';
COMMENT ON COLUMN field_comments.created_by IS 'User ID who created or imported this field comment';
COMMENT ON COLUMN field_comments.created_at IS 'Timestamp when field comment was created or imported';
COMMENT ON COLUMN field_comments.updated_at IS 'Timestamp of last field comment modification';

-- =====================================================
-- COMPLETE MASTER DATA COVERAGE
-- This SQL script provides comprehensive field descriptions
-- for all core master data tables used in manufacturing ERP:
-- - Core Manufacturing: plants, resources, capabilities
-- - Business Partners: customers, vendors
-- - Products: items (with comprehensive supply chain fields)
-- - Organization: departments, work_centers
-- - Relationships: plant_resources, work_center_resources, department_resources
-- - System: users, user_preferences, field_comments
-- =====================================================