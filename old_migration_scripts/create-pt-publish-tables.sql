-- PT Publish Tables for Brewery Data
-- Total: 61 tables
-- Converted from SQL Server to PostgreSQL format

-- 1. Capabilities
CREATE TABLE IF NOT EXISTS pt_publish_capabilities (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    capability_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    notes TEXT,
    external_id TEXT,
    UNIQUE(capability_id, instance_id, publish_date)
);

-- 2. CapacityIntervalResourceAssignments
CREATE TABLE IF NOT EXISTS pt_publish_capacity_interval_resource_assignments (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    capacity_interval_id BIGINT NOT NULL,
    resource_id BIGINT NOT NULL,
    UNIQUE(publish_date, resource_id, capacity_interval_id, instance_id)
);

-- 3. CapacityIntervals
CREATE TABLE IF NOT EXISTS pt_publish_capacity_intervals (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    capacity_interval_id BIGINT NOT NULL,
    name TEXT,
    external_id TEXT,
    description TEXT,
    notes TEXT,
    duration_hrs NUMERIC,
    end_date_time TEXT,
    interval_type TEXT,
    nbr_of_people NUMERIC,
    start_date_time TEXT,
    can_start_activity BOOLEAN,
    used_for_setup BOOLEAN,
    used_for_run BOOLEAN,
    used_for_post_processing BOOLEAN,
    used_for_clean BOOLEAN,
    used_for_storage_post_processing BOOLEAN,
    overtime BOOLEAN,
    use_only_when_late BOOLEAN,
    capacity_code TEXT,
    UNIQUE(publish_date, capacity_interval_id, instance_id)
);

-- 4. Customers
CREATE TABLE IF NOT EXISTS pt_publish_customers (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    customer_id BIGINT NOT NULL,
    external_id TEXT,
    abc_code TEXT,
    color_code TEXT,
    priority INTEGER,
    region TEXT,
    group_code TEXT,
    name TEXT,
    customer_type TEXT,
    UNIQUE(publish_date, customer_id, instance_id)
);

-- 5. Departments
CREATE TABLE IF NOT EXISTS pt_publish_departments (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    plant_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    notes TEXT,
    external_id TEXT,
    plant_name TEXT,
    resource_count INTEGER,
    department_frozen_span_days NUMERIC,
    UNIQUE(publish_date, department_id, plant_id, instance_id)
);

-- 6. Forecasts
CREATE TABLE IF NOT EXISTS pt_publish_forecasts (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    inventory_id BIGINT,
    version TEXT NOT NULL,
    forecast_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    external_id TEXT,
    notes TEXT,
    customer TEXT,
    planner TEXT,
    priority INTEGER,
    sales_office TEXT,
    sales_person TEXT,
    UNIQUE(instance_id, publish_date, forecast_id)
);

-- 7. ForecastShipmentInventoryAdjustments
CREATE TABLE IF NOT EXISTS pt_publish_forecast_shipment_inventory_adjustments (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    inventory_id BIGINT NOT NULL,
    forecast_shipment_id BIGINT NOT NULL,
    adjustment_date TEXT,
    adjustment_qty NUMERIC,
    adjustment_reason TEXT,
    UNIQUE(publish_date, forecast_shipment_id, inventory_id, instance_id)
);

-- 8. ForecastShipments
CREATE TABLE IF NOT EXISTS pt_publish_forecast_shipments (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    forecast_id BIGINT,
    forecast_shipment_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    consumed_qty NUMERIC,
    consumption_details TEXT,
    UNIQUE(instance_id, publish_date, forecast_shipment_id)
);

-- 9. Inventories
CREATE TABLE IF NOT EXISTS pt_publish_inventories (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    item_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    inventory_id BIGINT NOT NULL,
    lead_time_days NUMERIC,
    buffer_stock NUMERIC,
    safety_stock NUMERIC,
    safety_stock_warning_level NUMERIC,
    on_hand_qty NUMERIC,
    planner_external_id TEXT,
    storage_capacity NUMERIC,
    safety_stock_job_priority INTEGER,
    forecast_consumption TEXT,
    mrp_processing TEXT,
    mrp_notes TEXT,
    template_job_id BIGINT,
    template_manufacturing_order_id BIGINT,
    have_template_manufacturing_order_id BOOLEAN,
    buffer_penetration_percent NUMERIC,
    material_allocation TEXT,
    prevent_shared_batch_overflow BOOLEAN,
    UNIQUE(publish_date, instance_id, inventory_id)
);

-- 10. Items
CREATE TABLE IF NOT EXISTS pt_publish_items (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    item_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    external_id TEXT,
    notes TEXT,
    source TEXT,
    item_type TEXT,
    default_lead_time_days NUMERIC,
    batch_size NUMERIC,
    batch_window_days NUMERIC,
    item_group TEXT,
    min_order_qty NUMERIC,
    max_order_qty NUMERIC,
    min_order_qty_roundup_limit NUMERIC,
    job_auto_split_qty NUMERIC,
    plan BOOLEAN,
    shelf_life_days NUMERIC,
    transfer_qty NUMERIC,
    rollup_attributes_to_parent BOOLEAN,
    cost NUMERIC,
    UNIQUE(publish_date, item_id, instance_id)
);

-- 11. JobActivities
CREATE TABLE IF NOT EXISTS pt_publish_job_activities (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    operation_id BIGINT NOT NULL,
    activity_id BIGINT NOT NULL,
    production_status TEXT,
    required_finish_qty NUMERIC,
    reported_good_qty NUMERIC,
    reported_scrap_qty NUMERIC,
    reported_run_hours NUMERIC,
    reported_setup_hours NUMERIC,
    reported_post_processing_hours NUMERIC,
    reported_clean_hrs NUMERIC,
    reported_cleanout_grade INTEGER,
    zero_length BOOLEAN,
    external_id TEXT,
    locked TEXT,
    anchored BOOLEAN,
    anchor_start_date TEXT,
    anchor_drift_hours NUMERIC,
    scheduled_start_date TEXT,
    scheduled_end_of_setup_date TEXT,
    scheduled_end_of_run_date TEXT,
    scheduled_end_date TEXT,
    scheduled_setup_hours NUMERIC,
    scheduled_run_hours NUMERIC,
    scheduled_post_processing_hours NUMERIC,
    reported_finish_date TEXT,
    finished_internally BOOLEAN,
    paused BOOLEAN,
    nbr_of_people NUMERIC,
    people_usage TEXT,
    comments TEXT,
    comments2 TEXT,
    expected_finish_qty NUMERIC,
    jit_start_date TEXT,
    scheduled BOOLEAN,
    work_content_hours NUMERIC,
    percent_finished INTEGER,
    bottleneck BOOLEAN,
    calendar_duration_hrs NUMERIC,
    end_of_run_date TEXT,
    expected_scrap_qty NUMERIC,
    labor_cost NUMERIC,
    late BOOLEAN,
    left_leeway_hrs NUMERIC,
    machine_cost NUMERIC,
    max_delay_required_start_by TEXT,
    max_delay_slack_days NUMERIC,
    max_delay_violation BOOLEAN,
    nbr_of_people_adjusted_work_content_hrs NUMERIC,
    queue_days NUMERIC,
    remaining_qty NUMERIC,
    reported_end_of_run_date TEXT,
    reported_material_post_processing_hrs NUMERIC,
    reported_start_date TEXT,
    required_start_qty NUMERIC,
    resources_used TEXT,
    resource_transfer_hrs NUMERIC,
    right_leeway_hrs NUMERIC,
    slack_days NUMERIC,
    split_id INTEGER,
    started BOOLEAN,
    timing TEXT,
    batched BOOLEAN,
    cycle_hrs NUMERIC,
    qty_per_cycle NUMERIC,
    setup_hrs NUMERIC,
    post_processing_hrs NUMERIC,
    clean_hrs NUMERIC,
    clean_out_grade INTEGER,
    planning_scrap_percent NUMERIC,
    cycle_span_manual_update_only BOOLEAN,
    qty_per_cycle_manual_update_only BOOLEAN,
    setup_time_manual_update_only BOOLEAN,
    post_process_manual_update_only BOOLEAN,
    clean_manual_update_only BOOLEAN,
    scrap_percent_manual_update_only BOOLEAN,
    optimization_score NUMERIC,
    optimization_score_details TEXT,
    scheduled_setup_zero_length BOOLEAN,
    scheduled_run_zero_length BOOLEAN,
    scheduled_post_processing_zero_length BOOLEAN,
    reported_start_of_processing_date TEXT,
    batch_amount NUMERIC,
    actual_resources_used TEXT,
    scheduled_clean_hours NUMERIC,
    UNIQUE(publish_date, activity_id, operation_id, manufacturing_order_id, job_id, instance_id)
);

-- 12. JobActivityInventoryAdjustments
CREATE TABLE IF NOT EXISTS pt_publish_job_activity_inventory_adjustments (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    inventory_id BIGINT NOT NULL,
    activity_id BIGINT NOT NULL,
    adjustment_date TEXT,
    adjustment_qty NUMERIC,
    adjustment_reason TEXT
);

-- 13. JobMaterials
CREATE TABLE IF NOT EXISTS pt_publish_job_materials (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    operation_id BIGINT NOT NULL,
    material_requirement_id BIGINT NOT NULL,
    external_id TEXT,
    allocated_for BOOLEAN,
    latest_source_date_time TEXT,
    constraint_type TEXT,
    issued_complete BOOLEAN,
    issued_qty NUMERIC,
    lead_time_days NUMERIC,
    material_name TEXT,
    material_description TEXT,
    source TEXT,
    total_cost NUMERIC,
    total_required_qty NUMERIC,
    min_source_qty NUMERIC,
    max_source_qty NUMERIC,
    material_sourcing TEXT,
    uom TEXT,
    buy_direct BOOLEAN,
    qty_from_lead_time NUMERIC,
    available BOOLEAN,
    planned BOOLEAN,
    requirement_type TEXT,
    supply TEXT,
    use_overlap_activities BOOLEAN,
    use_overlap_pos BOOLEAN,
    tank_storage_release_timing TEXT,
    multiple_warehouse_supply_allowed BOOLEAN,
    fixed_qty BOOLEAN,
    item_external_id TEXT,
    warehouse_external_id TEXT,
    allowed_lot_codes TEXT,
    allow_partial_supply BOOLEAN,
    planned_scrap_qty NUMERIC,
    min_age_hrs NUMERIC,
    shelf_life_penetration_percent NUMERIC,
    wip_duration_hrs NUMERIC,
    material_allocation TEXT,
    UNIQUE(publish_date, material_requirement_id, operation_id, manufacturing_order_id, job_id, instance_id)
);

-- 14. JobMaterialSupplyingActivities
CREATE TABLE IF NOT EXISTS pt_publish_job_material_supplying_activities (
    id SERIAL PRIMARY KEY,
    publish_date TEXT,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT,
    manufacturing_order_id BIGINT,
    operation_id BIGINT,
    material_requirement_id BIGINT,
    activity_id BIGINT,
    supplying_job_id BIGINT,
    supplying_manufacturing_order_id BIGINT,
    supplying_operation_id BIGINT,
    supplying_activity_id BIGINT,
    supplied_qty NUMERIC,
    supply_bom_level INTEGER
);

-- 15. JobOperationAttributes
CREATE TABLE IF NOT EXISTS pt_publish_job_operation_attributes (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38),
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    operation_id BIGINT NOT NULL,
    attribute_external_id TEXT,
    code TEXT,
    number NUMERIC,
    cost NUMERIC,
    duration_hrs NUMERIC,
    color_code TEXT
);

-- 16. JobOperations
CREATE TABLE IF NOT EXISTS pt_publish_job_operations (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    operation_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    setup_hours NUMERIC,
    required_start_qty NUMERIC,
    required_finish_qty NUMERIC,
    qty_per_cycle NUMERIC,
    minutes_per_cycle NUMERIC,
    post_processing_hours NUMERIC,
    overlap_transfer_qty NUMERIC,
    can_pause BOOLEAN,
    can_subcontract BOOLEAN,
    daily_carrying_cost NUMERIC,
    compatibility_code TEXT,
    batch_code TEXT,
    setup_number NUMERIC,
    deduct_scrap_from_required BOOLEAN,
    successor_processing TEXT,
    keep_successors_time_limit_hours NUMERIC,
    hold_until_date_time TEXT,
    hold_reason TEXT,
    omitted TEXT,
    finished BOOLEAN,
    on_hold BOOLEAN,
    is_rework BOOLEAN,
    planning_scrap_percent NUMERIC,
    uom TEXT,
    notes TEXT,
    auto_split BOOLEAN,
    whole_number_splits BOOLEAN,
    primary_resource_requirement_id BIGINT,
    setup_color_name TEXT,
    time_based_reporting BOOLEAN,
    external_id TEXT,
    scheduled BOOLEAN,
    scheduled_start TEXT,
    scheduled_end TEXT,
    need_date TEXT,
    locked TEXT,
    anchored TEXT,
    scheduled_primary_work_center_external_id TEXT,
    auto_report_progress BOOLEAN,
    expected_finish_qty NUMERIC,
    use_expected_finish_qty BOOLEAN,
    standard_hours NUMERIC,
    output_name TEXT,
    use_compatibility_code BOOLEAN,
    work_content_hours NUMERIC,
    percent_finished INTEGER,
    ms_project_predecessor_operations TEXT,
    attributes_summary TEXT,
    auto_finish BOOLEAN,
    bottleneck BOOLEAN,
    buy_direct_materials_list TEXT,
    buy_direct_materials_list_not_available TEXT,
    carrying_cost NUMERIC,
    cycles BIGINT,
    cycle_hrs NUMERIC,
    end_of_matl_post_proc_date TEXT,
    end_of_resource_transfer_time_date TEXT,
    end_of_run_date TEXT,
    expected_run_hours NUMERIC,
    expected_scrap_qty NUMERIC,
    expected_setup_hours NUMERIC,
    jit_start_date TEXT,
    keep_successors_time_limit_hrs NUMERIC,
    labor_cost NUMERIC,
    late BOOLEAN,
    latest_constraint TEXT,
    latest_constraint_date TEXT,
    latest_predecessor_finish TEXT,
    machine_cost NUMERIC,
    material_cost NUMERIC,
    material_list TEXT,
    materials_not_available TEXT,
    materials_not_planned TEXT,
    material_status TEXT,
    max_delay_required_start_by TEXT,
    products_list TEXT,
    remaining_finish_qty NUMERIC,
    reported_good_qty NUMERIC,
    reported_run_hours NUMERIC,
    reported_scrap_qty NUMERIC,
    reported_setup_hours NUMERIC,
    reported_post_processing_hours NUMERIC,
    required_capabilities TEXT,
    resources_used TEXT,
    run_hrs NUMERIC,
    scheduling_hours NUMERIC,
    setup_color TEXT,
    split BOOLEAN,
    standard_run_hrs NUMERIC,
    standard_setup_hrs NUMERIC,
    started BOOLEAN,
    stock_materials_list TEXT,
    stock_materials_list_awaiting_allocation TEXT,
    commit_start_date TEXT,
    commit_end_date TEXT,
    cycle_span_manual_update_only BOOLEAN,
    qty_per_cycle_manual_update_only BOOLEAN,
    setup_time_manual_update_only BOOLEAN,
    post_process_manual_update_only BOOLEAN,
    scrap_percent_manual_update_only BOOLEAN,
    materials_manual_update_only BOOLEAN,
    products_manual_update_only BOOLEAN,
    resource_requirements_manual_update_only BOOLEAN,
    storage_post_processing_hrs NUMERIC,
    current_buffer_penetration_percent NUMERIC,
    projected_buffer_penetration_percent NUMERIC,
    jit_start_date_buffer_days NUMERIC,
    dbr_jit_start_date TEXT,
    planned_scrap_qty NUMERIC,
    auto_split_type TEXT,
    min_auto_split_amount NUMERIC,
    max_auto_split_amount NUMERIC,
    setup_split_type TEXT,
    prevent_splits_from_incurring_setup BOOLEAN,
    prevent_splits_from_incurring_clean BOOLEAN,
    setup_code TEXT,
    UNIQUE(publish_date, operation_id, manufacturing_order_id, job_id, instance_id)
);

-- 17. JobPathNodes
CREATE TABLE IF NOT EXISTS pt_publish_job_path_nodes (
    id SERIAL PRIMARY KEY,
    publish_date TEXT,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT,
    manufacturing_order_id BIGINT,
    path_id BIGINT,
    predecessor_operation_id BIGINT,
    successor_operation_id BIGINT,
    usage_qty_per_cycle NUMERIC,
    max_delay_hrs NUMERIC,
    transfer_hrs NUMERIC,
    overlap_type TEXT,
    overlap_transfer_hrs NUMERIC,
    overlap_percent_complete NUMERIC,
    allow_manual_connector_violation BOOLEAN,
    transfer_during_predecessor_online_time BOOLEAN,
    transfer_start TEXT,
    transfer_end TEXT,
    overlap_setups BOOLEAN
);

-- 18. JobPaths
CREATE TABLE IF NOT EXISTS pt_publish_job_paths (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    path_id BIGINT NOT NULL,
    external_id TEXT,
    name TEXT,
    preference INTEGER,
    auto_use TEXT,
    auto_use_path_release_offset_days NUMERIC,
    UNIQUE(publish_date, path_id, manufacturing_order_id, job_id, instance_id)
);

-- 19. JobProductDeletedDemands
CREATE TABLE IF NOT EXISTS pt_publish_job_product_deleted_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_product_id BIGINT NOT NULL,
    job_operation_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    description TEXT NOT NULL,
    date_deleted TEXT NOT NULL,
    deleted_demand_id BIGINT NOT NULL,
    UNIQUE(publish_date, job_operation_id, job_product_id, instance_id, date_deleted, deleted_demand_id)
);

-- 20. JobProductForecastDemands
CREATE TABLE IF NOT EXISTS pt_publish_job_product_forecast_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_product_id BIGINT NOT NULL,
    job_operation_id BIGINT NOT NULL,
    forecast_shipment_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    UNIQUE(publish_date, forecast_shipment_id, job_operation_id, job_product_id, instance_id)
);

-- 21. JobProducts
CREATE TABLE IF NOT EXISTS pt_publish_job_products (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    operation_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    total_output_qty NUMERIC,
    completed_qty NUMERIC,
    item_id BIGINT,
    warehouse_id BIGINT,
    external_id TEXT,
    inventory_available_timing TEXT,
    store_in_tank BOOLEAN,
    set_warehouse_during_mrp BOOLEAN,
    material_post_processing_hrs NUMERIC,
    fixed_qty BOOLEAN,
    lot_code TEXT,
    UNIQUE(publish_date, product_id, operation_id, manufacturing_order_id, job_id, instance_id)
);

-- 22. JobProductSafetyStockDemands
CREATE TABLE IF NOT EXISTS pt_publish_job_product_safety_stock_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_product_id BIGINT NOT NULL,
    job_operation_id BIGINT NOT NULL,
    inventory_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    UNIQUE(publish_date, inventory_id, job_operation_id, job_product_id, instance_id)
);

-- 23. JobProductSalesOrderDemands
CREATE TABLE IF NOT EXISTS pt_publish_job_product_sales_order_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_product_id BIGINT NOT NULL,
    job_operation_id BIGINT NOT NULL,
    sales_order_distribution_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    UNIQUE(publish_date, sales_order_distribution_id, job_operation_id, job_product_id, instance_id)
);

-- 24. JobProductTransferOrderDemands
CREATE TABLE IF NOT EXISTS pt_publish_job_product_transfer_order_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_product_id BIGINT NOT NULL,
    job_operation_id BIGINT NOT NULL,
    transfer_order_distribution_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    UNIQUE(publish_date, transfer_order_distribution_id, job_operation_id, job_product_id, instance_id)
);

-- 25. JobResourceBlockIntervals
CREATE TABLE IF NOT EXISTS pt_publish_job_resource_block_intervals (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    operation_id BIGINT NOT NULL,
    activity_id BIGINT NOT NULL,
    block_id BIGINT NOT NULL,
    interval_index BIGINT NOT NULL,
    output_qty NUMERIC,
    shift_start TEXT,
    shift_end TEXT,
    shift_name TEXT,
    shift_description TEXT,
    shift_nbr_of_people NUMERIC,
    shift_type TEXT,
    setup_start TEXT,
    setup_end TEXT,
    run_start TEXT,
    run_end TEXT,
    post_processing_start TEXT,
    post_processing_end TEXT,
    scheduled_start TEXT,
    scheduled_end TEXT,
    UNIQUE(publish_date, interval_index, block_id, activity_id, operation_id, manufacturing_order_id, job_id, instance_id)
);

-- 26. JobResourceBlocks
CREATE TABLE IF NOT EXISTS pt_publish_job_resource_blocks (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    operation_id BIGINT NOT NULL,
    activity_id BIGINT NOT NULL,
    block_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    plant_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    resource_id BIGINT NOT NULL,
    scheduled_start TEXT,
    scheduled_end TEXT,
    locked BOOLEAN,
    sequence BIGINT,
    run_nbr BIGINT,
    resource_requirement_id BIGINT,
    duration_hrs NUMERIC,
    labor_cost NUMERIC,
    machine_cost NUMERIC,
    resource_requirement_index INTEGER,
    scheduled BOOLEAN,
    batched BOOLEAN,
    UNIQUE(batch_id, block_id, activity_id, operation_id, manufacturing_order_id, job_id, instance_id, publish_date)
);

-- 27. JobResourceCapabilities
CREATE TABLE IF NOT EXISTS pt_publish_job_resource_capabilities (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    operation_id BIGINT NOT NULL,
    resource_requirement_id BIGINT NOT NULL,
    capability_id BIGINT NOT NULL,
    capability_external_id TEXT,
    UNIQUE(publish_date, capability_id, resource_requirement_id, operation_id, manufacturing_order_id, job_id, instance_id)
);

-- 28. JobResources
CREATE TABLE IF NOT EXISTS pt_publish_job_resources (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    operation_id BIGINT NOT NULL,
    resource_requirement_id BIGINT NOT NULL,
    description TEXT,
    external_id TEXT,
    usage_start TEXT,
    usage_end TEXT,
    attention_percent INTEGER,
    is_primary BOOLEAN,
    default_resource_jit_limit_hrs NUMERIC,
    use_default_resource_jit_limit BOOLEAN,
    default_resource_id BIGINT,
    capacity_code TEXT,
    UNIQUE(publish_date, instance_id, job_id, manufacturing_order_id, operation_id, resource_requirement_id)
);

-- 29. Jobs
CREATE TABLE IF NOT EXISTS pt_publish_jobs (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    customers TEXT,
    entry_date TEXT,
    need_date_time TEXT,
    classification TEXT,
    commitment TEXT,
    hot BOOLEAN,
    hot_reason TEXT,
    importance INTEGER,
    cancelled BOOLEAN,
    late_penalty_cost NUMERIC,
    max_early_delivery_days NUMERIC,
    priority INTEGER,
    type TEXT,
    revenue NUMERIC,
    profit NUMERIC,
    scheduled BOOLEAN,
    scheduled_start_date_time TEXT,
    scheduled_end_date_time TEXT,
    lead_resource TEXT,
    starts_in_days INTEGER,
    lateness_days NUMERIC,
    late BOOLEAN,
    overdue BOOLEAN,
    description TEXT,
    notes TEXT,
    finished BOOLEAN,
    name TEXT,
    do_not_delete BOOLEAN,
    external_id TEXT,
    locked TEXT,
    anchored TEXT,
    order_number TEXT,
    on_hold TEXT,
    on_hold_reason TEXT,
    template BOOLEAN,
    customer_email TEXT,
    agent_email TEXT,
    do_not_schedule BOOLEAN,
    color_code TEXT,
    entry_method TEXT,
    hold_until TEXT,
    percent_finished INTEGER,
    scheduled_status TEXT,
    standard_hours NUMERIC,
    bottlenecks TEXT,
    can_span_plants BOOLEAN,
    commitment_preserved BOOLEAN,
    do_not_delete_preserved BOOLEAN,
    do_not_schedule_preserved BOOLEAN,
    earliest_delivery TEXT,
    entered_today BOOLEAN,
    expected_run_hours NUMERIC,
    expected_setup_hours NUMERIC,
    failed_to_schedule_reason TEXT,
    hold BOOLEAN,
    hold_reason TEXT,
    labor_cost NUMERIC,
    machine_cost NUMERIC,
    material_cost NUMERIC,
    overdue_days NUMERIC,
    percent_of_standard_hrs INTEGER,
    percent_over_standard_hrs INTEGER,
    product TEXT,
    product_description TEXT,
    qty NUMERIC,
    reported_run_hours NUMERIC,
    reported_setup_hours NUMERIC,
    scheduling_hours NUMERIC,
    started BOOLEAN,
    throughput NUMERIC,
    shipping_cost NUMERIC,
    expected_late_penalty_cost NUMERIC,
    subcontract_cost NUMERIC,
    total_cost NUMERIC,
    printed BOOLEAN,
    invoiced BOOLEAN,
    shipped TEXT,
    destination TEXT,
    reviewed BOOLEAN,
    percent_of_materials_available INTEGER,
    successor_order_numbers TEXT,
    resource_names TEXT,
    low_level_code INTEGER,
    UNIQUE(publish_date, job_id, instance_id)
);

-- 30. JobSuccessorManufacturingOrders
CREATE TABLE IF NOT EXISTS pt_publish_job_successor_manufacturing_orders (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    successor_job_id BIGINT,
    successor_manufacturing_order_id BIGINT,
    successor_path_id BIGINT,
    successor_operation_id BIGINT,
    transfer_hrs NUMERIC,
    usage_qty_per_cycle NUMERIC
);

-- 31. KPIs
CREATE TABLE IF NOT EXISTS pt_publish_kpis (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    calculator_name TEXT NOT NULL,
    current_value NUMERIC,
    calculator_id BIGINT NOT NULL,
    UNIQUE(publish_date, instance_id, calculator_id)
);

-- 32. Lots
CREATE TABLE IF NOT EXISTS pt_publish_lots (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    lot_id BIGINT NOT NULL,
    external_id TEXT,
    inventory_id BIGINT,
    lot_source TEXT,
    qty NUMERIC,
    production_date TEXT,
    code TEXT,
    limit_matl_src_to_eligible_lots BOOLEAN,
    UNIQUE(publish_date, instance_id, lot_id)
);

-- 33. ManufacturingOrders
CREATE TABLE IF NOT EXISTS pt_publish_manufacturing_orders (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    job_id BIGINT NOT NULL,
    manufacturing_order_id BIGINT NOT NULL,
    name TEXT,
    required_qty NUMERIC,
    expected_finish_qty NUMERIC,
    description TEXT,
    product_name TEXT,
    product_description TEXT,
    released BOOLEAN,
    release_date TEXT,
    notes TEXT,
    scheduled BOOLEAN,
    scheduled_start TEXT,
    scheduled_end TEXT,
    can_span_plants BOOLEAN,
    current_path_id BIGINT,
    default_path_id BIGINT,
    family TEXT,
    finished BOOLEAN,
    frozen TEXT,
    on_hold TEXT,
    hold_reason TEXT,
    late BOOLEAN,
    lateness_days NUMERIC,
    lead_time_days NUMERIC,
    locked TEXT,
    locked_plant_id BIGINT,
    uom TEXT,
    external_id TEXT,
    anchored TEXT,
    break_off_source_mo_name TEXT,
    copy_routing_from_template BOOLEAN,
    hold_until TEXT,
    is_break_off BOOLEAN,
    need_date TEXT,
    percent_finished INTEGER,
    product_color TEXT,
    use_mo_need_date BOOLEAN,
    standard_hours NUMERIC,
    bottlenecks TEXT,
    default_path_name TEXT,
    expected_run_hours NUMERIC,
    expected_setup_hours NUMERIC,
    hold BOOLEAN,
    is_released BOOLEAN,
    labor_cost NUMERIC,
    locked_plant_name TEXT,
    machine_cost NUMERIC,
    material_cost NUMERIC,
    mo_need_date BOOLEAN,
    preserve_required_qty BOOLEAN,
    release_date_time TEXT,
    reported_run_hours NUMERIC,
    reported_setup_hours NUMERIC,
    requested_qty NUMERIC,
    scheduling_hours NUMERIC,
    auto_join_group TEXT,
    split BOOLEAN,
    split_count INTEGER,
    split_from_manufacturing_order_id BIGINT,
    started BOOLEAN,
    lock_to_current_alternate_path BOOLEAN,
    dbr_shipping_buffer_override BIGINT,
    dbr_release_date TEXT,
    dbr_shipping_due_date TEXT,
    dbr_buffer_hrs NUMERIC,
    shipping_buffer_current_penetration_percent NUMERIC,
    shipping_buffer_projected_penetration_percent NUMERIC,
    drum_buffer_projected_penetration_percent NUMERIC,
    drum_buffer_current_penetration_percent NUMERIC,
    UNIQUE(publish_date, manufacturing_order_id, job_id, instance_id)
);

-- 34. Metrics
CREATE TABLE IF NOT EXISTS pt_publish_metrics (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    jobs_on_time_percent NUMERIC,
    jobs_overdue_percent NUMERIC,
    output_per_week NUMERIC,
    average_lead_time BIGINT,
    users_who_optimize INTEGER,
    sales_order_rev30 NUMERIC,
    sales_order_rev60 NUMERIC,
    sales_order_rev90 NUMERIC,
    sales_order_rev365 NUMERIC,
    sales_orders INTEGER,
    purchase_orders INTEGER,
    scheduled_jobs INTEGER,
    operations INTEGER,
    failed_to_schedule_jobs INTEGER,
    jobs_past_planning_horizon INTEGER,
    number_of_users INTEGER,
    last_manual_action_date TEXT,
    last_automatic_action_date TEXT,
    UNIQUE(publish_date, instance_id)
);

-- 35. Plants
CREATE TABLE IF NOT EXISTS pt_publish_plants (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    plant_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    notes TEXT,
    bottleneck_threshold NUMERIC,
    heavy_load_threshold NUMERIC,
    external_id TEXT,
    department_count INTEGER,
    stable_days NUMERIC,
    daily_operating_expense NUMERIC,
    invested_capital NUMERIC,
    annual_percentage_rate NUMERIC,
    UNIQUE(publish_date, plant_id, instance_id)
);

-- 36. PlantWarehouses
CREATE TABLE IF NOT EXISTS pt_publish_plant_warehouses (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    plant_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    UNIQUE(publish_date, warehouse_id, plant_id, instance_id)
);

-- 37. ProductRules
CREATE TABLE IF NOT EXISTS pt_publish_product_rules (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    item_id BIGINT NOT NULL,
    plant_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    resource_id BIGINT NOT NULL,
    operation_code VARCHAR(256) NOT NULL,
    setup_hrs NUMERIC,
    use_setup_hrs BOOLEAN,
    setup_scrap_qty NUMERIC,
    setup_scrap_percent NUMERIC,
    use_setup_scrap_qty BOOLEAN,
    use_setup_scrap_percent BOOLEAN,
    run_speed NUMERIC,
    use_run_speed BOOLEAN,
    run_scrap_percent NUMERIC,
    use_run_scrap_percent BOOLEAN,
    is_preferred_equipment BOOLEAN,
    UNIQUE(publish_date, instance_id, item_id, plant_id, department_id, resource_id, operation_code)
);

-- 38. PTAttributes
CREATE TABLE IF NOT EXISTS pt_publish_pt_attributes (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    attribute_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    notes TEXT,
    external_id TEXT,
    attribute_type TEXT,
    cost NUMERIC,
    duration_hrs NUMERIC,
    code TEXT,
    number NUMERIC,
    color_code TEXT,
    UNIQUE(publish_date, attribute_id, instance_id)
);

-- 39. PurchasesToStock
CREATE TABLE IF NOT EXISTS pt_publish_purchases_to_stock (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    purchase_to_stock_id BIGINT NOT NULL,
    supplier_external_id TEXT,
    inventory_id BIGINT NOT NULL,
    purchase_order_external_id TEXT,
    order_qty NUMERIC,
    order_date TEXT,
    expected_receipt_date TEXT,
    scheduled_receipt_date TEXT,
    actual_receipt_date TEXT,
    received_qty NUMERIC,
    shipped_qty NUMERIC,
    external_id TEXT,
    fixed_for_planning BOOLEAN,
    available BOOLEAN,
    firm BOOLEAN,
    closed BOOLEAN,
    UNIQUE(publish_date, purchase_to_stock_id, instance_id)
);

-- 40. PurchaseToStockDeletedDemands
CREATE TABLE IF NOT EXISTS pt_publish_purchase_to_stock_deleted_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    purchase_to_stock_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    description TEXT NOT NULL,
    date_deleted TEXT NOT NULL,
    deleted_demand_id BIGINT NOT NULL,
    UNIQUE(publish_date, purchase_to_stock_id, instance_id, date_deleted, deleted_demand_id)
);

-- 41. PurchaseToStockForecastDemands
CREATE TABLE IF NOT EXISTS pt_publish_purchase_to_stock_forecast_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    purchase_to_stock_id BIGINT NOT NULL,
    forecast_shipment_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    UNIQUE(publish_date, forecast_shipment_id, purchase_to_stock_id, instance_id)
);

-- 42. PurchaseToStockInventoryAdjustments
CREATE TABLE IF NOT EXISTS pt_publish_purchase_to_stock_inventory_adjustments (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    inventory_id BIGINT NOT NULL,
    purchase_to_stock_id BIGINT NOT NULL,
    adjustment_date TEXT,
    adjustment_qty NUMERIC,
    adjustment_reason TEXT,
    UNIQUE(publish_date, purchase_to_stock_id, inventory_id, instance_id)
);

-- 43. PurchaseToStockSafetyStockDemands
CREATE TABLE IF NOT EXISTS pt_publish_purchase_to_stock_safety_stock_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    purchase_to_stock_id BIGINT NOT NULL,
    inventory_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    UNIQUE(publish_date, inventory_id, purchase_to_stock_id, instance_id)
);

-- 44. PurchaseToStockSalesOrderDemands
CREATE TABLE IF NOT EXISTS pt_publish_purchase_to_stock_sales_order_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    purchase_to_stock_id BIGINT NOT NULL,
    sales_order_distribution_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    UNIQUE(publish_date, sales_order_distribution_id, purchase_to_stock_id, instance_id)
);

-- 45. PurchaseToStockTransferOrderDemands
CREATE TABLE IF NOT EXISTS pt_publish_purchase_to_stock_transfer_order_demands (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    purchase_to_stock_id BIGINT NOT NULL,
    transfer_order_distribution_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    notes TEXT,
    UNIQUE(publish_date, transfer_order_distribution_id, purchase_to_stock_id, instance_id)
);

-- 46. RecurringCapacityIntervalRecurrences
CREATE TABLE IF NOT EXISTS pt_publish_recurring_capacity_interval_recurrences (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    recurring_capacity_interval_id BIGINT NOT NULL,
    recurrence_id BIGINT NOT NULL,
    start_date_time TEXT,
    end_date_time TEXT,
    UNIQUE(publish_date, recurrence_id, recurring_capacity_interval_id, instance_id)
);

-- 47. RecurringCapacityIntervalResourceAssignments
CREATE TABLE IF NOT EXISTS pt_publish_recurring_capacity_interval_resource_assignments (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    recurring_capacity_interval_id BIGINT NOT NULL,
    resource_id BIGINT NOT NULL,
    UNIQUE(publish_date, resource_id, recurring_capacity_interval_id, instance_id)
);

-- 48. RecurringCapacityIntervals
CREATE TABLE IF NOT EXISTS pt_publish_recurring_capacity_intervals (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    recurring_capacity_interval_id BIGINT NOT NULL,
    name TEXT,
    external_id TEXT,
    description TEXT,
    notes TEXT,
    interval_type TEXT,
    duration_hrs NUMERIC,
    nbr_of_people NUMERIC,
    can_start_activity BOOLEAN,
    used_for_setup BOOLEAN,
    used_for_run BOOLEAN,
    used_for_post_processing BOOLEAN,
    used_for_clean BOOLEAN,
    used_for_storage_post_processing BOOLEAN,
    overtime BOOLEAN,
    use_only_when_late BOOLEAN,
    capacity_code TEXT,
    recur_forever BOOLEAN,
    recur_start_date TEXT,
    recur_end_date TEXT,
    recur_type TEXT,
    recurring_interval_rule TEXT,
    UNIQUE(publish_date, recurring_capacity_interval_id, instance_id)
);

-- 49. ReportBlocks
CREATE TABLE IF NOT EXISTS pt_publish_report_blocks (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    report_block_id BIGINT NOT NULL,
    report_name TEXT,
    included_columns TEXT,
    UNIQUE(publish_date, report_block_id, instance_id)
);

-- 50. ResourceCapabilities
CREATE TABLE IF NOT EXISTS pt_publish_resource_capabilities (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    resource_id BIGINT NOT NULL,
    capability_id BIGINT NOT NULL,
    throughput_modifier NUMERIC,
    setup_hours_override NUMERIC,
    use_throughput_modifier BOOLEAN,
    use_setup_hours_override BOOLEAN,
    UNIQUE(publish_date, capability_id, resource_id, instance_id)
);

-- 51. Resources
CREATE TABLE IF NOT EXISTS pt_publish_resources (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    plant_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    resource_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    notes TEXT,
    external_id TEXT,
    plant_name TEXT,
    department_name TEXT,
    active BOOLEAN,
    speed_factor NUMERIC,
    jit_limit_hrs NUMERIC,
    bottleneck BOOLEAN,
    constrained_resource BOOLEAN,
    secondary_priority_type TEXT,
    attribute_change_penalties TEXT,
    load_percent NUMERIC,
    last_selected_attribute_external_id TEXT,
    online_hrs NUMERIC,
    used_hrs NUMERIC,
    reporting_level TEXT,
    clean_between_batches BOOLEAN,
    can_clean_tanks BOOLEAN,
    scheduling_resolution_sec NUMERIC,
    capacity_type TEXT,
    constrained_capacity_hrs_per_day NUMERIC,
    constrained_capacity_hrs_per_week NUMERIC,
    constraint_usage TEXT,
    hourly_cost NUMERIC,
    setup_cost NUMERIC,
    people_per_crew NUMERIC,
    tank BOOLEAN,
    tank_capacity NUMERIC,
    pacemaker BOOLEAN,
    protect_level_hrs NUMERIC,
    buffer_type TEXT,
    dbr_constraint BOOLEAN,
    dbr_release_rule TEXT,
    dbr_buffer_hrs NUMERIC,
    finite_horizon_days NUMERIC,
    use_finite_horizon BOOLEAN,
    min_transfer_batch_hrs NUMERIC,
    UNIQUE(publish_date, resource_id, department_id, plant_id, instance_id)
);

-- 52. SalesOrderDistributionInventoryAdjustments
CREATE TABLE IF NOT EXISTS pt_publish_sales_order_distribution_inventory_adjustments (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    inventory_id BIGINT NOT NULL,
    sales_order_distribution_id BIGINT NOT NULL,
    adjustment_date TEXT,
    adjustment_qty NUMERIC,
    adjustment_reason TEXT,
    UNIQUE(publish_date, sales_order_distribution_id, inventory_id, instance_id)
);

-- 53. SalesOrderLineDistributions
CREATE TABLE IF NOT EXISTS pt_publish_sales_order_line_distributions (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    sales_order_line_id BIGINT NOT NULL,
    sales_order_distribution_id BIGINT NOT NULL,
    required_date TEXT,
    required_qty NUMERIC,
    consumed_qty NUMERIC,
    scheduled_ship_date TEXT,
    actual_ship_date TEXT,
    shipped_qty NUMERIC,
    warehouse_id BIGINT,
    UNIQUE(publish_date, instance_id, sales_order_distribution_id)
);

-- 54. SalesOrderLines
CREATE TABLE IF NOT EXISTS pt_publish_sales_order_lines (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    sales_order_id BIGINT NOT NULL,
    sales_order_line_id BIGINT NOT NULL,
    product_external_id TEXT,
    description TEXT,
    item_id BIGINT,
    UNIQUE(publish_date, sales_order_line_id, sales_order_id, instance_id)
);

-- 55. SalesOrders
CREATE TABLE IF NOT EXISTS pt_publish_sales_orders (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    sales_order_id BIGINT NOT NULL,
    customer_id BIGINT,
    name TEXT,
    description TEXT,
    external_id TEXT,
    notes TEXT,
    customer_priority INTEGER,
    firm BOOLEAN,
    customer_external_id TEXT,
    maintenance_method TEXT,
    region TEXT,
    priority INTEGER,
    ship_to_address TEXT,
    carrier TEXT,
    freight_cost NUMERIC,
    abc_code TEXT,
    product_group TEXT,
    priority_class TEXT,
    closed BOOLEAN,
    consignment_order BOOLEAN,
    UNIQUE(publish_date, sales_order_id, instance_id)
);

-- 56. Schedules
CREATE TABLE IF NOT EXISTS pt_publish_schedules (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    instance_name TEXT,
    instance_version TEXT,
    scenario_id BIGINT,
    scenario_name TEXT,
    scenario_description TEXT,
    publisher_user_id BIGINT,
    published_entire_schedule BOOLEAN,
    clock TEXT,
    publish_horizon_end TEXT,
    scenario_type TEXT,
    last_schedule_published BOOLEAN,
    last_production_schedule_published BOOLEAN,
    last_what_if_schedule_published BOOLEAN,
    last_net_change_production_schedule_published BOOLEAN,
    last_publish_for_scenario BOOLEAN,
    planning_horizon_end TEXT,
    time_zone_id TEXT,
    UNIQUE(instance_id, publish_date)
);

-- 57. SystemData
CREATE TABLE IF NOT EXISTS pt_publish_system_data (
    id SERIAL PRIMARY KEY,
    version VARCHAR(13),
    validate_db BOOLEAN,
    prepare_data BOOLEAN,
    clear_custom_tables BOOLEAN
);

-- 58. TransferOrderDistributionInventoryAdjustments
CREATE TABLE IF NOT EXISTS pt_publish_transfer_order_distribution_inventory_adjustments (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    inventory_id BIGINT NOT NULL,
    transfer_order_distribution_id BIGINT NOT NULL,
    adjustment_date TEXT,
    adjustment_qty NUMERIC,
    adjustment_reason TEXT,
    UNIQUE(publish_date, transfer_order_distribution_id, inventory_id, instance_id)
);

-- 59. TransferOrderDistributions
CREATE TABLE IF NOT EXISTS pt_publish_transfer_order_distributions (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    transfer_order_id BIGINT,
    transfer_order_distribution_id BIGINT NOT NULL,
    item_id BIGINT,
    from_warehouse_id BIGINT,
    to_warehouse_id BIGINT,
    qty_ordered NUMERIC,
    qty_shipped NUMERIC,
    qty_received NUMERIC,
    min_source_qty NUMERIC,
    max_source_qty NUMERIC,
    material_sourcing TEXT,
    material_allocation TEXT,
    scheduled_ship_date TEXT,
    scheduled_receive_date TEXT,
    closed BOOLEAN,
    UNIQUE(publish_date, instance_id, transfer_order_distribution_id)
);

-- 60. TransferOrders
CREATE TABLE IF NOT EXISTS pt_publish_transfer_orders (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    transfer_order_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    notes TEXT,
    external_id TEXT,
    firm BOOLEAN,
    priority INTEGER,
    closed BOOLEAN,
    maintenance_method TEXT,
    UNIQUE(publish_date, transfer_order_id, instance_id)
);

-- 61. Warehouses
CREATE TABLE IF NOT EXISTS pt_publish_warehouses (
    id SERIAL PRIMARY KEY,
    publish_date TEXT NOT NULL,
    instance_id VARCHAR(38) NOT NULL,
    warehouse_id BIGINT NOT NULL,
    name TEXT,
    description TEXT,
    external_id TEXT,
    nbr_of_docks INTEGER,
    notes TEXT,
    storage_capacity NUMERIC,
    annual_percentage_rate NUMERIC,
    tank_warehouse BOOLEAN,
    UNIQUE(publish_date, warehouse_id, instance_id)
);

-- Create indexes for foreign key relationships and common queries
CREATE INDEX idx_pt_publish_capacity_interval_resource_assignments_resource ON pt_publish_capacity_interval_resource_assignments(resource_id);
CREATE INDEX idx_pt_publish_capacity_interval_resource_assignments_interval ON pt_publish_capacity_interval_resource_assignments(capacity_interval_id);
CREATE INDEX idx_pt_publish_departments_plant ON pt_publish_departments(plant_id);
CREATE INDEX idx_pt_publish_forecasts_inventory ON pt_publish_forecasts(inventory_id);
CREATE INDEX idx_pt_publish_forecast_shipments_forecast ON pt_publish_forecast_shipments(forecast_id);
CREATE INDEX idx_pt_publish_inventories_item ON pt_publish_inventories(item_id);
CREATE INDEX idx_pt_publish_inventories_warehouse ON pt_publish_inventories(warehouse_id);
CREATE INDEX idx_pt_publish_job_activities_job ON pt_publish_job_activities(job_id);
CREATE INDEX idx_pt_publish_job_activities_operation ON pt_publish_job_activities(operation_id);
CREATE INDEX idx_pt_publish_job_materials_job ON pt_publish_job_materials(job_id);
CREATE INDEX idx_pt_publish_job_operations_job ON pt_publish_job_operations(job_id);
CREATE INDEX idx_pt_publish_job_products_job ON pt_publish_job_products(job_id);
CREATE INDEX idx_pt_publish_manufacturing_orders_job ON pt_publish_manufacturing_orders(job_id);
CREATE INDEX idx_pt_publish_plant_warehouses_plant ON pt_publish_plant_warehouses(plant_id);
CREATE INDEX idx_pt_publish_plant_warehouses_warehouse ON pt_publish_plant_warehouses(warehouse_id);
CREATE INDEX idx_pt_publish_resources_plant ON pt_publish_resources(plant_id);
CREATE INDEX idx_pt_publish_resources_department ON pt_publish_resources(department_id);
CREATE INDEX idx_pt_publish_sales_order_lines_sales_order ON pt_publish_sales_order_lines(sales_order_id);
CREATE INDEX idx_pt_publish_sales_orders_customer ON pt_publish_sales_orders(customer_id);