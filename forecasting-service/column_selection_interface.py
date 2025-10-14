import streamlit as st
import hashlib
from datetime import datetime
# Cache functions are imported from app_schema_forecast.py for consistency


def _fetch_schema_data(schema, table_name):
    """Fetch table schema data from database"""
    try:
        from utils.data_processing import DataProcessor
        data_processor = DataProcessor()
        
        # Get connection details from session state
        server = st.session_state.get('server')
        database = st.session_state.get('database')
        username = st.session_state.get('username')
        password = st.session_state.get('password')
        connection_type = st.session_state.get('connection_type')
        
        if not all([server, database, username, password, connection_type]):
            return None
            
        # Helper function for safe SQL value escaping
        def escape_sql_value(value):
            """Safely escape SQL string values by doubling single quotes"""
            return str(value).replace("'", "''")
        
        # Query to get column information
        schema_query = f"""
        SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_DEFAULT,
            CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '{escape_sql_value(table_name)}' AND TABLE_SCHEMA = '{escape_sql_value(schema)}'
        ORDER BY ORDINAL_POSITION
        """
        
        schema_df = data_processor.load_data_from_sql(
            server, database, username, password, schema_query, connection_type
        )
        
        return schema_df
        
    except Exception:
        return None


def show_column_selection_interface(schema, table_name):
    """Show column selection interface that persists across reloads"""
    
    # Get schema data from session state or fetch it if not available
    schema_key = f"schema_{schema}_{table_name}"
    if schema_key not in st.session_state:
        # Fetch schema data if not cached
        schema_df = _fetch_schema_data(schema, table_name)
        if schema_df is None:
            st.error("Unable to load table schema. Please check your database connection.")
            return
        # Cache it for future use
        st.session_state[schema_key] = {'schema_df': schema_df}
    else:
        table_data = st.session_state[schema_key]
        schema_df = table_data['schema_df']
    
    # Column selection interface
    
    available_columns = schema_df['COLUMN_NAME'].tolist()
    
    col1, col2, col3 = st.columns(3, gap="small")
    
    with col1:
        st.caption("Date Column")
        date_candidates = [col for col in available_columns if any(word in col.lower() for word in ['date', 'time', 'day', 'month', 'year', 'created', 'order'])]
        
        # Prioritize last selected value (global), then heuristics
        saved_date_col = st.session_state.get('date_col')
        if saved_date_col and saved_date_col in available_columns:
            default_date_col = saved_date_col
        elif date_candidates:
            default_date_col = date_candidates[0]
        else:
            default_date_col = available_columns[0] if available_columns else None
        
        date_col_selection_key = f"date_col_selection_{schema}_{table_name}"
        if date_col_selection_key not in st.session_state:
            st.session_state[date_col_selection_key] = default_date_col
        
        with st.expander("Choose Date Column", expanded=True):
            search_date = st.text_input("Search Date Columns", key=f"search_date_{schema}_{table_name}", placeholder="Try: date, time, created...")
            
            # Filter columns based on search
            if search_date:
                filtered_date_cols = [col for col in available_columns if search_date.lower() in col.lower()]
            else:
                filtered_date_cols = available_columns
            
            # Get current selection index
            current_selection = st.session_state.get(date_col_selection_key, default_date_col)
            try:
                current_index = filtered_date_cols.index(current_selection) if current_selection in filtered_date_cols else 0
            except (ValueError, IndexError):
                current_index = 0
            
            # Single radio group for all options
            selected_date = st.radio(
                "Select Date Column",
                options=filtered_date_cols,
                index=current_index,
                key=f"date_radio_{schema}_{table_name}",
                label_visibility="collapsed"
            )
            
            if selected_date != st.session_state.get(date_col_selection_key):
                st.session_state[date_col_selection_key] = selected_date
                st.rerun()
        
        date_col = st.session_state.get(date_col_selection_key)
    
    with col2:
        st.caption("Item Column")
        item_candidates = [col for col in available_columns if any(word in col.lower() for word in ['item', 'product', 'sku', 'material', 'part', 'article'])]
        
        # Prioritize last selected value (global), then heuristics
        saved_item_col = st.session_state.get('item_col')
        if saved_item_col and saved_item_col in available_columns:
            default_item_col = saved_item_col
        elif item_candidates:
            default_item_col = item_candidates[0]
        else:
            default_item_col = available_columns[1] if len(available_columns) > 1 else available_columns[0] if available_columns else None
        
        item_col_selection_key = f"item_col_selection_{schema}_{table_name}"
        if item_col_selection_key not in st.session_state:
            st.session_state[item_col_selection_key] = default_item_col
        
        with st.expander("Choose Item Column", expanded=True):
            search_item = st.text_input("Search Item Columns", key=f"search_item_{schema}_{table_name}", placeholder="Try: item, product, sku...")
            
            # Filter columns based on search
            if search_item:
                filtered_item_cols = [col for col in available_columns if search_item.lower() in col.lower()]
            else:
                filtered_item_cols = available_columns
            
            # Get current selection index
            current_selection = st.session_state.get(item_col_selection_key, default_item_col)
            try:
                current_index = filtered_item_cols.index(current_selection) if current_selection in filtered_item_cols else 0
            except (ValueError, IndexError):
                current_index = 0
            
            # Single radio group for all options
            selected_item = st.radio(
                "Select Item Column",
                options=filtered_item_cols,
                index=current_index,
                key=f"item_radio_{schema}_{table_name}",
                label_visibility="collapsed"
            )
            
            if selected_item != st.session_state.get(item_col_selection_key):
                st.session_state[item_col_selection_key] = selected_item
                st.rerun()
        
        item_col = st.session_state.get(item_col_selection_key)
    
    with col3:
        st.caption("Quantity Column")
        
        # Get column data types to filter for numeric columns only
        schema_key = f"schema_{schema}_{table_name}"
        numeric_columns = []
        if schema_key in st.session_state:
            schema_df = st.session_state[schema_key]['schema_df']
            # Filter for numeric columns only (INT, FLOAT, DECIMAL, NUMERIC, MONEY, etc.)
            numeric_types = ['int', 'float', 'decimal', 'numeric', 'money', 'real', 'bigint', 'smallint', 'tinyint']
            numeric_columns = [
                row['COLUMN_NAME'] for _, row in schema_df.iterrows() 
                if any(num_type in row['DATA_TYPE'].lower() for num_type in numeric_types)
            ]
        
        # Prefer keyword-based candidates from numeric columns
        qty_candidates = [col for col in numeric_columns if any(word in col.lower() for word in ['qty', 'quantity', 'amount', 'volume', 'count', 'units'])]
        
        # If no numeric columns found, show all columns but warn user
        qty_options = numeric_columns if numeric_columns else available_columns
        
        qty_col_key = f"qty_col_{schema}_{table_name}"
        
        # Prioritize last selected value (global), then heuristics
        saved_qty_col = st.session_state.get('qty_col')
        if saved_qty_col and saved_qty_col in qty_options:
            default_qty_col = saved_qty_col
        elif qty_candidates:
            default_qty_col = qty_candidates[0] if qty_candidates[0] in qty_options else qty_options[0] if qty_options else None
        else:
            default_qty_col = qty_options[0] if qty_options else None
        
        qty_col_selection_key = f"qty_col_selection_{schema}_{table_name}"
        if qty_col_selection_key not in st.session_state:
            st.session_state[qty_col_selection_key] = default_qty_col
        
        with st.expander("Choose Quantity Column", expanded=True):
            search_qty = st.text_input("Search Quantity Columns", key=f"search_qty_{schema}_{table_name}", placeholder="Try: qty, amount, volume...")
            
            # Filter columns based on search
            if search_qty:
                filtered_qty_cols = [col for col in qty_options if search_qty.lower() in col.lower()]
            else:
                filtered_qty_cols = qty_options
            
            # Get current selection index
            current_selection = st.session_state.get(qty_col_selection_key, default_qty_col)
            try:
                current_index = filtered_qty_cols.index(current_selection) if current_selection in filtered_qty_cols else 0
            except (ValueError, IndexError):
                current_index = 0
            
            # Single radio group for all options
            if filtered_qty_cols:
                selected_qty = st.radio(
                    "Select Quantity Column",
                    options=filtered_qty_cols,
                    index=current_index,
                    key=f"qty_radio_{schema}_{table_name}",
                    label_visibility="collapsed"
                )
                
                if selected_qty != st.session_state.get(qty_col_selection_key):
                    st.session_state[qty_col_selection_key] = selected_qty
                    st.rerun()
        
        qty_col = st.session_state.get(qty_col_selection_key)
        
        # Show warning if no numeric columns available or if selected column might not be numeric
        if not numeric_columns:
            st.warning("No numeric columns detected. Please ensure the selected column contains numeric values for forecasting.")
        elif qty_col and qty_col not in numeric_columns:
            st.error(f"'{qty_col}' appears to be a text column. Please select a numeric column containing quantity values.")
        elif qty_col and qty_col in numeric_columns:
            pass  # Valid numeric column selected
    
    # Add planning area and scenario name column selectors
    # Divider removed
    
    filter_col1, filter_col2 = st.columns(2, gap="small")
    
    with filter_col1:
        st.caption("Planning Area")
        planning_candidates = [col for col in available_columns if any(word in col.lower() for word in ['planning', 'area', 'region', 'site', 'location', 'plant', 'facility'])]
        
        planning_options = available_columns
        planning_area_key = f"planning_area_{schema}_{table_name}"
        
        # Prioritize last selected value (global), then heuristics
        saved_planning_area = st.session_state.get('planning_area_col')
        if saved_planning_area and saved_planning_area in planning_options:
            default_planning_col = saved_planning_area
        elif planning_candidates:
            default_planning_col = planning_candidates[0]
        else:
            default_planning_col = planning_options[0] if planning_options else None
        
        planning_col_selection_key = f"planning_col_selection_{schema}_{table_name}"
        if planning_col_selection_key not in st.session_state:
            st.session_state[planning_col_selection_key] = default_planning_col
        
        with st.expander("Choose Planning Area Column", expanded=True):
            search_planning = st.text_input("Search Planning Area Columns", key=f"search_planning_{schema}_{table_name}", placeholder="Try: planning, area, region...")
            
            # Filter columns based on search
            if search_planning:
                filtered_planning_cols = [col for col in planning_options if search_planning.lower() in col.lower()]
            else:
                filtered_planning_cols = planning_options
            
            # Get current selection index
            current_selection = st.session_state.get(planning_col_selection_key, default_planning_col)
            try:
                current_index = filtered_planning_cols.index(current_selection) if current_selection in filtered_planning_cols else 0
            except (ValueError, IndexError):
                current_index = 0
            
            # Single radio group for all options
            if filtered_planning_cols:
                selected_planning = st.radio(
                    "Select Planning Area Column",
                    options=filtered_planning_cols,
                    index=current_index,
                    key=f"planning_radio_{schema}_{table_name}",
                    label_visibility="collapsed"
                )
                
                if selected_planning != st.session_state.get(planning_col_selection_key):
                    st.session_state[planning_col_selection_key] = selected_planning
                    st.rerun()
        
        planning_area_col = st.session_state.get(planning_col_selection_key)
    
    with filter_col2:
        st.caption("Scenario Name")
        scenario_candidates = [col for col in available_columns if any(word in col.lower() for word in ['scenario', 'name', 'version', 'plan', 'forecast', 'type'])]
        
        scenario_options = available_columns
        scenario_name_key = f"scenario_name_{schema}_{table_name}"
        
        # Prioritize last selected value (global), then heuristics
        saved_scenario_name = st.session_state.get('scenario_name_col')
        if saved_scenario_name and saved_scenario_name in scenario_options:
            default_scenario_col = saved_scenario_name
        elif scenario_candidates:
            default_scenario_col = scenario_candidates[0]
        else:
            default_scenario_col = scenario_options[0] if scenario_options else None
        
        scenario_col_selection_key = f"scenario_col_selection_{schema}_{table_name}"
        if scenario_col_selection_key not in st.session_state:
            st.session_state[scenario_col_selection_key] = default_scenario_col
        
        with st.expander("Choose Scenario Name Column", expanded=True):
            search_scenario = st.text_input("Search Scenario Name Columns", key=f"search_scenario_{schema}_{table_name}", placeholder="Try: scenario, name, version...")
            
            # Filter columns based on search
            if search_scenario:
                filtered_scenario_cols = [col for col in scenario_options if search_scenario.lower() in col.lower()]
            else:
                filtered_scenario_cols = scenario_options
            
            # Get current selection index
            current_selection = st.session_state.get(scenario_col_selection_key, default_scenario_col)
            try:
                current_index = filtered_scenario_cols.index(current_selection) if current_selection in filtered_scenario_cols else 0
            except (ValueError, IndexError):
                current_index = 0
            
            # Single radio group for all options
            if filtered_scenario_cols:
                selected_scenario = st.radio(
                    "Select Scenario Name Column",
                    options=filtered_scenario_cols,
                    index=current_index,
                    key=f"scenario_radio_{schema}_{table_name}",
                    label_visibility="collapsed"
                )
                
                if selected_scenario != st.session_state.get(scenario_col_selection_key):
                    st.session_state[scenario_col_selection_key] = selected_scenario
                    st.rerun()
        
        scenario_name_col = st.session_state.get(scenario_col_selection_key)

    # Helper functions for secure SQL construction (defined early to prevent NameError)
    def escape_sql_value(value):
        """Safely escape SQL string values by doubling single quotes"""
        return str(value).replace("'", "''")
    
    def escape_sql_identifier(identifier):
        """Safely escape SQL identifiers by bracketing and doubling closing brackets"""
        return f"[{str(identifier).replace(']', ']]')}]"

    # Divider removed
    col4, col5 = st.columns(2, gap="small")
    with col4:
        saved_forecast_days = st.session_state.get('forecast_days', 30)
        forecast_days = st.slider("Forecast Days", min_value=7, max_value=90, value=saved_forecast_days, key="forecast_days_slider")
    with col5:
        saved_model_type = st.session_state.get('model_type', 'Random Forest')
        model_options = ["Random Forest", "ARIMA", "Prophet"]
        default_model_index = model_options.index(saved_model_type) if saved_model_type in model_options else 0
        model_type = st.selectbox("Model", model_options, index=default_model_index, key="model_type_selector")
    
    # Validate required selections
    if not all([date_col, item_col, qty_col, model_type]):
        st.warning("⚠️ Please select all required columns (Date, Item, Quantity) and model type to proceed.")
        return
    
    # Additional validation for quantity column to prevent SQL errors
    schema_key = f"schema_{schema}_{table_name}"
    if schema_key in st.session_state:
        schema_df = st.session_state[schema_key]['schema_df']
        qty_col_info = schema_df[schema_df['COLUMN_NAME'] == qty_col]
        if not qty_col_info.empty:
            qty_data_type = qty_col_info.iloc[0]['DATA_TYPE'].lower()
            numeric_types = ['int', 'float', 'decimal', 'numeric', 'money', 'real', 'bigint', 'smallint', 'tinyint']
            if not any(num_type in qty_data_type for num_type in numeric_types):
                st.error(f"Cannot proceed: '{qty_col}' is a {qty_data_type} column, but forecasting requires a numeric column. Please select a different quantity column.")
                return
    
    # Store column selections in global session state for saving 
    st.session_state['date_col'] = date_col
    st.session_state['item_col'] = item_col 
    st.session_state['qty_col'] = qty_col
    st.session_state['model_type'] = model_type
    st.session_state['forecast_days'] = forecast_days
    st.session_state['selected_schema'] = schema
    st.session_state['selected_table'] = table_name
    
    # Store filter column selections
    st.session_state['planning_area_col'] = planning_area_col
    st.session_state['scenario_name_col'] = scenario_name_col
    
    # Note: Configuration persistence removed - only model caching is preserved
    
    # Clear any previous training state when parameters change (including hierarchical filters)
    params_key = f"params_{schema}_{table_name}"
    
    # Create comprehensive configuration fingerprint including all three hierarchical levels
    planning_area_str = str(planning_area_col) if planning_area_col else "none"
    scenario_name_str = str(scenario_name_col) if scenario_name_col else "none"
    planning_selections_key = f"selected_planning_areas_{schema}_{table_name}_{planning_area_str}"
    scenario_selections_key = f"selected_scenario_names_{schema}_{table_name}_{scenario_name_str}"
    
    selected_planning_areas = st.session_state.get(planning_selections_key, [])
    selected_scenario_names = st.session_state.get(scenario_selections_key, [])
    selected_items = st.session_state.get('selected_items', [])
    
    # Create sorted hashes for each hierarchical level
    planning_hash = hashlib.md5('_'.join(sorted(str(area) for area in selected_planning_areas)).encode()).hexdigest()[:8] if selected_planning_areas else 'none'
    scenario_hash = hashlib.md5('_'.join(sorted(str(scenario) for scenario in selected_scenario_names)).encode()).hexdigest()[:8] if selected_scenario_names else 'none'
    items_hash = hashlib.md5('_'.join(sorted(str(item) for item in selected_items)).encode()).hexdigest()[:8] if selected_items else 'none'
    
    # Complete configuration fingerprint including model settings and all hierarchical filter selections (including column names)
    column_hash = hashlib.md5(f"{planning_area_str}_{scenario_name_str}_{item_col}".encode()).hexdigest()[:8]
    current_params = f"{model_type}_{forecast_days}_{column_hash}_{planning_hash}_{scenario_hash}_{items_hash}"
    
    if st.session_state.get(params_key) != current_params:
        # Store previous params to detect what changed
        prev_params = st.session_state.get(params_key, "")
        st.session_state[params_key] = current_params
        
        # Only clear training state if core model parameters changed (not just scenario/planning area selections)
        prev_parts = prev_params.split('_') if prev_params else []
        curr_parts = current_params.split('_')
        
        # Check if only hierarchical filters changed (preserve training state for scenario switches)
        core_changed = False
        if len(prev_parts) >= 3 and len(curr_parts) >= 3:
            # Compare model_type, forecast_days, and column_hash (first 3 parts)
            core_changed = prev_parts[:3] != curr_parts[:3]
        else:
            core_changed = True  # First time or structure changed
        
        # Only clear training state if core parameters changed (model, forecast_days, columns)
        if core_changed:
            if 'training_step_completed' in st.session_state:
                del st.session_state['training_step_completed']
            if 'use_cached_model' in st.session_state:
                del st.session_state['use_cached_model']
        else:
            # Check if items changed - this should also trigger training invalidation
            prev_items_hash = prev_parts[5] if len(prev_parts) > 5 else ""
            curr_items_hash = curr_parts[5] if len(curr_parts) > 5 else ""
            if prev_items_hash != curr_items_hash:
                if 'training_step_completed' in st.session_state:
                    del st.session_state['training_step_completed']
                if 'use_cached_model' in st.session_state:
                    del st.session_state['use_cached_model']
    
    # State invalidation when filter columns change (include column names for proper isolation)
    prev_planning_col_key = f"prev_planning_col_{schema}_{table_name}"
    prev_scenario_col_key = f"prev_scenario_col_{schema}_{table_name}"
    
    if st.session_state.get(prev_planning_col_key) != planning_area_col:
        # Clear old planning area values and selections when column changes
        old_planning_col = st.session_state.get(prev_planning_col_key)
        if old_planning_col:
            old_planning_values_key = f"planning_area_values_{schema}_{table_name}_{old_planning_col}"
            old_planning_selections_key = f"selected_planning_areas_{schema}_{table_name}_{old_planning_col}"
            if old_planning_values_key in st.session_state:
                del st.session_state[old_planning_values_key]
            if old_planning_selections_key in st.session_state:
                del st.session_state[old_planning_selections_key]
        # Clear downstream states only for column changes (not value changes)
        if 'items_list' in st.session_state:
            del st.session_state['items_list']
        if 'selected_items' in st.session_state:
            del st.session_state['selected_items']
        # Reset training state for column changes
        if 'training_step_completed' in st.session_state:
            del st.session_state['training_step_completed']
        if 'use_cached_model' in st.session_state:
            del st.session_state['use_cached_model']
        st.session_state[prev_planning_col_key] = planning_area_col
    
    if st.session_state.get(prev_scenario_col_key) != scenario_name_col:
        # Clear old scenario name values and selections when column changes
        old_scenario_col = st.session_state.get(prev_scenario_col_key)
        if old_scenario_col:
            old_scenario_values_key = f"scenario_name_values_{schema}_{table_name}_{old_scenario_col}"
            old_scenario_selections_key = f"selected_scenario_names_{schema}_{table_name}_{old_scenario_col}"
            if old_scenario_values_key in st.session_state:
                del st.session_state[old_scenario_values_key]
            if old_scenario_selections_key in st.session_state:
                del st.session_state[old_scenario_selections_key]
        # Clear downstream states only for column changes (not value changes)
        if 'items_list' in st.session_state:
            del st.session_state['items_list']
        if 'selected_items' in st.session_state:
            del st.session_state['selected_items']
        # Reset training state for column changes
        if 'training_step_completed' in st.session_state:
            del st.session_state['training_step_completed']
        if 'use_cached_model' in st.session_state:
            del st.session_state['use_cached_model']
        st.session_state[prev_scenario_col_key] = scenario_name_col

    # Auto-load Planning Area values if column is selected (namespaced by column name)
    planning_values_key = f"planning_area_values_{schema}_{table_name}_{planning_area_col}"
    if planning_area_col and planning_values_key not in st.session_state:
        from utils.data_processing import DataProcessor
        data_processor = DataProcessor()
        server = st.session_state['server']
        database = st.session_state['database']
        username = st.session_state['username']
        password = st.session_state['password']
        connection_type = st.session_state['connection_type']
        
        with st.spinner("Loading planning areas..."):
            planning_query = f"SELECT DISTINCT {escape_sql_identifier(planning_area_col)} FROM {escape_sql_identifier(schema)}.{escape_sql_identifier(table_name)} WHERE {escape_sql_identifier(planning_area_col)} IS NOT NULL AND {escape_sql_identifier(planning_area_col)} != 'None (No Filter)' ORDER BY {escape_sql_identifier(planning_area_col)}"
            planning_df = data_processor.load_data_from_sql(
                server, database, username, password, planning_query, connection_type
            )
            if planning_df is not None and not planning_df.empty:
                planning_area_values = planning_df[planning_area_col].tolist()
                st.session_state[planning_values_key] = planning_area_values
                # Initialize with no selections by default (namespaced by column name)
                planning_selections_key = f"selected_planning_areas_{schema}_{table_name}_{planning_area_col}"
                if planning_selections_key not in st.session_state:
                    st.session_state[planning_selections_key] = []
                # Planning areas loaded

    # Auto-load Items when hierarchical conditions are met
    planning_selections_key = f"selected_planning_areas_{schema}_{table_name}_{planning_area_str}"
    scenario_selections_key = f"selected_scenario_names_{schema}_{table_name}_{scenario_name_str}"
    selected_planning_areas = st.session_state.get(planning_selections_key, [])
    selected_scenario_names = st.session_state.get(scenario_selections_key, [])
    
    # Check if we should auto-load items (simplified logic)
    should_load_items = True
    
    # Check hierarchical requirements
    if planning_area_col and not selected_planning_areas:
        should_load_items = False
    elif scenario_name_col and not selected_scenario_names:
        should_load_items = False
    
    # Auto-load items if conditions are met and not already loaded
    # Use simple 'items_list' key instead of complex namespaced key to avoid stalls
    if should_load_items and 'items_list' not in st.session_state:
        from utils.data_processing import DataProcessor
        
        data_processor = DataProcessor()
        server = st.session_state['server']
        database = st.session_state['database']
        username = st.session_state['username']
        password = st.session_state['password']
        connection_type = st.session_state['connection_type']
        
        with st.spinner("Auto-loading items..."):
            where_clauses = []
            
            # Add Planning Area filter if selected
            if planning_area_col and selected_planning_areas:
                escaped_areas = [escape_sql_value(area) for area in selected_planning_areas]
                planning_filter = "', '".join(escaped_areas)
                where_clauses.append(f"{escape_sql_identifier(planning_area_col)} IN ('{planning_filter}')")
            
            # Add Scenario Name filter if selected
            if scenario_name_col and selected_scenario_names:
                escaped_scenarios = [escape_sql_value(scenario) for scenario in selected_scenario_names]
                scenario_filter = "', '".join(escaped_scenarios)
                where_clauses.append(f"{escape_sql_identifier(scenario_name_col)} IN ('{scenario_filter}')")
            
            where_clause = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""
            
            items_query = f"SELECT DISTINCT {escape_sql_identifier(item_col)} FROM {escape_sql_identifier(schema)}.{escape_sql_identifier(table_name)}{where_clause} ORDER BY {escape_sql_identifier(item_col)}"
            items_df = data_processor.load_data_from_sql(
                server, database, username, password, items_query, connection_type
            )
            
            if items_df is not None and not items_df.empty:
                # Store items in simplified session state
                st.session_state['items_list'] = items_df[item_col].tolist()
                # Items loaded based on filters
            else:
                st.warning("⚠️ No items found with current filters")
    

    # Hierarchical Step 1: Planning Area Selector (Power BI style)
    planning_values_key = f"planning_area_values_{schema}_{table_name}_{planning_area_str}"
    planning_selections_key = f"selected_planning_areas_{schema}_{table_name}_{planning_area_str}"
    
    if planning_values_key in st.session_state and planning_area_col:
        planning_area_values = st.session_state[planning_values_key]
        selected_count = len(st.session_state.get(planning_selections_key, []))
        
        # Planning Areas with selection count
        col1, col2 = st.columns([4, 1], gap="small")
        with col1:
            st.caption("Planning Areas")
        with col2:
            st.caption(f"Selected: {selected_count}")
        
        # Dropdown expander for values 
        with st.expander("Choose Planning Areas", expanded=selected_count > 0):
            # Search box inside expander
            planning_search_key = f"planning_search_{schema}_{table_name}"
            planning_search_term = st.text_input(
                "Search Planning Areas", 
                key=planning_search_key, 
                placeholder="Type to search..."
            )
            
            # Filter planning areas based on search
            if planning_search_term:
                filtered_planning_areas = [area for area in planning_area_values if planning_search_term.lower() in str(area).lower()]
            else:
                filtered_planning_areas = planning_area_values
            
            # Select All / Clear All buttons inline
            col1, col2 = st.columns(2)
            with col1:
                if st.button("Select All", key=f"planning_select_all_{schema}_{table_name}"):
                    st.session_state[planning_selections_key] = filtered_planning_areas[:]
                    # Clear downstream values
                    scenario_values_key = f"scenario_name_values_{schema}_{table_name}_{scenario_name_str}"
                    scenario_selections_key = f"selected_scenario_names_{schema}_{table_name}_{scenario_name_str}"
                    if scenario_values_key in st.session_state:
                        del st.session_state[scenario_values_key]
                    if scenario_selections_key in st.session_state:
                        del st.session_state[scenario_selections_key]
                    if 'items_list' in st.session_state:
                        del st.session_state['items_list']
                    st.rerun()
            with col2:
                if st.button("Clear All", key=f"planning_clear_all_{schema}_{table_name}"):
                    st.session_state[planning_selections_key] = []
                    # Clear downstream values
                    scenario_values_key = f"scenario_name_values_{schema}_{table_name}_{scenario_name_str}"
                    scenario_selections_key = f"selected_scenario_names_{schema}_{table_name}_{scenario_name_str}"
                    if scenario_values_key in st.session_state:
                        del st.session_state[scenario_values_key]
                    if scenario_selections_key in st.session_state:
                        del st.session_state[scenario_selections_key]
                    if 'items_list' in st.session_state:
                        del st.session_state['items_list']
                    st.rerun()
            
            # Divider removed
            
            # Checkbox list as vertical list
            if len(filtered_planning_areas) > 0:
                for idx, area in enumerate(filtered_planning_areas[:50]):
                    is_selected = area in st.session_state.get(planning_selections_key, [])
                    
                    planning_changed = False
                    if st.checkbox(
                        str(area), 
                        value=is_selected, 
                        key=f"planning_checkbox_{schema}_{table_name}_{idx}_{area}"
                    ):
                        if area not in st.session_state.get(planning_selections_key, []):
                            if planning_selections_key not in st.session_state:
                                st.session_state[planning_selections_key] = []
                            st.session_state[planning_selections_key].append(area)
                            planning_changed = True
                    else:
                        if area in st.session_state.get(planning_selections_key, []):
                            st.session_state[planning_selections_key].remove(area)
                            planning_changed = True
                    
                    # Clear downstream when selection changes and trigger rerun
                    if planning_changed:
                        scenario_values_key = f"scenario_name_values_{schema}_{table_name}_{scenario_name_str}"
                        scenario_selections_key = f"selected_scenario_names_{schema}_{table_name}_{scenario_name_str}"
                        if scenario_values_key in st.session_state:
                            del st.session_state[scenario_values_key]
                        if scenario_selections_key in st.session_state:
                            del st.session_state[scenario_selections_key]
                        if 'items_list' in st.session_state:
                            del st.session_state['items_list']
                        st.rerun()
                
                if len(filtered_planning_areas) > 50:
                    st.info(f"Showing first 50 of {len(filtered_planning_areas)} areas")
            else:
                st.warning("No planning areas match your search")

    # Hierarchical Step 2: Scenario Name Selector (depends on Planning Area)
    selected_planning_areas = st.session_state.get(planning_selections_key, [])
    scenario_values_key = f"scenario_name_values_{schema}_{table_name}_{scenario_name_str}"
    scenario_selections_key = f"selected_scenario_names_{schema}_{table_name}_{scenario_name_str}"
    
    # Auto-load scenario values when planning areas are selected
    if (scenario_name_col and 
        selected_planning_areas and 
        scenario_values_key not in st.session_state):
        from utils.data_processing import DataProcessor
        data_processor = DataProcessor()
        server = st.session_state['server']
        database = st.session_state['database']
        username = st.session_state['username']
        password = st.session_state['password']
        connection_type = st.session_state['connection_type']
        
        with st.spinner("Loading scenario names..."):
            # Build filtered scenario query based on selected planning areas
            escaped_areas = [escape_sql_value(area) for area in selected_planning_areas]
            planning_filter = "', '".join(escaped_areas)
            scenario_query = f"SELECT DISTINCT {escape_sql_identifier(scenario_name_col)} FROM {escape_sql_identifier(schema)}.{escape_sql_identifier(table_name)} WHERE {escape_sql_identifier(planning_area_col)} IN ('{planning_filter}') AND {escape_sql_identifier(scenario_name_col)} IS NOT NULL AND {escape_sql_identifier(scenario_name_col)} != 'None (No Filter)' ORDER BY {escape_sql_identifier(scenario_name_col)}"
            scenario_df = data_processor.load_data_from_sql(
                server, database, username, password, scenario_query, connection_type
            )
            if scenario_df is not None and not scenario_df.empty:
                scenario_name_values = scenario_df[scenario_name_col].tolist()
                st.session_state[scenario_values_key] = scenario_name_values
                # Initialize with no selections by default
                if scenario_selections_key not in st.session_state:
                    st.session_state[scenario_selections_key] = []
                # Scenario names loaded

    # Hierarchical Step 2: Scenario Name Selector (Power BI style)
    # Only show Step 2 if planning areas are disabled OR there are actual planning area selections
    if scenario_name_col and (not planning_area_col or selected_planning_areas):
        scenario_selected_count = len(st.session_state.get(scenario_selections_key, []))
        
        # Scenario Names with selection count
        col1, col2 = st.columns([4, 1], gap="small")
        with col1:
            st.caption("Scenario Names")
        with col2:
            st.caption(f"Selected: {scenario_selected_count}")
        
        if scenario_values_key in st.session_state:
            scenario_name_values = st.session_state[scenario_values_key]
            
            # Dropdown expander for values
            with st.expander("Choose Scenario Names", expanded=scenario_selected_count > 0):
                # Search box inside expander
                scenario_search_key = f"scenario_search_{schema}_{table_name}"
                scenario_search_term = st.text_input(
                    "Search Scenario Names", 
                    key=scenario_search_key, 
                    placeholder="Type to search..."
                )
                
                # Filter scenario names based on search
                if scenario_search_term:
                    filtered_scenario_names = [scenario for scenario in scenario_name_values if scenario_search_term.lower() in str(scenario).lower()]
                else:
                    filtered_scenario_names = scenario_name_values
                
                # Select All / Clear All buttons inline
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Select All", key=f"scenario_select_all_{schema}_{table_name}"):
                        st.session_state[scenario_selections_key] = filtered_scenario_names[:]
                        # Clear items list when scenario changes
                        if 'items_list' in st.session_state:
                            del st.session_state['items_list']
                        st.rerun()
                with col2:
                    if st.button("Clear All", key=f"scenario_clear_all_{schema}_{table_name}"):
                        st.session_state[scenario_selections_key] = []
                        # Clear items list when scenario changes
                        if 'items_list' in st.session_state:
                            del st.session_state['items_list']
                        st.rerun()
                
                # Divider removed
                
                # Checkbox list as vertical list
                if len(filtered_scenario_names) > 0:
                    for idx, scenario in enumerate(filtered_scenario_names[:50]):
                        is_selected = scenario in st.session_state.get(scenario_selections_key, [])
                        
                        scenario_changed = False
                        if st.checkbox(
                            str(scenario), 
                            value=is_selected, 
                            key=f"scenario_checkbox_{schema}_{table_name}_{idx}_{scenario}"
                        ):
                            if scenario not in st.session_state.get(scenario_selections_key, []):
                                if scenario_selections_key not in st.session_state:
                                    st.session_state[scenario_selections_key] = []
                                st.session_state[scenario_selections_key].append(scenario)
                                scenario_changed = True
                        else:
                            if scenario in st.session_state.get(scenario_selections_key, []):
                                st.session_state[scenario_selections_key].remove(scenario)
                                scenario_changed = True
                        
                        # Mark items list for refresh when scenario selection changes
                        if scenario_changed:
                            # Mark items for refresh but preserve training state
                            st.session_state['items_need_refresh'] = True
                            if 'items_list' in st.session_state:
                                del st.session_state['items_list']
                            st.rerun()
                    
                    if len(filtered_scenario_names) > 50:
                        st.info(f"Showing first 50 of {len(filtered_scenario_names)} scenarios")
                else:
                    st.warning("No scenario names match your search")

    # Hierarchical Step 3: Item Selector (Power BI style)
    # Show Step 3 if conditions are met OR if user has already progressed to this step
    selected_scenario_names = st.session_state.get(scenario_selections_key, [])
    step2_conditions_met = (not planning_area_col or selected_planning_areas)
    step3_basic_conditions = (not scenario_name_col and step2_conditions_met) or (scenario_name_col and selected_scenario_names)
    
    # Enhanced logic: Show step 3 if basic conditions are met OR if user has already made progress
    user_has_progress = st.session_state.get('selected_items') or st.session_state.get('training_step_completed')
    show_step3 = step3_basic_conditions or user_has_progress
    
    selected_items = []
    if show_step3:
        # Initialize selection state - preserve existing selections
        if 'selected_items' not in st.session_state:
            st.session_state['selected_items'] = []
        
        selected_count = len(st.session_state['selected_items'])
        
        # Items with selection count
        col1, col2 = st.columns([4, 1], gap="small")
        with col1:
            st.caption("Items")
        with col2:
            st.caption(f"Selected: {selected_count}")
        
        # Show step 3 even if items_list is being refreshed
        if 'items_list' not in st.session_state:
            st.info("Loading items based on your filter selections...")
        else:
            # Dropdown expander for values
            with st.expander("Choose Items to Forecast", expanded=selected_count > 0):
                # Search box inside expander
                search_term = st.text_input("Search Items", key="items_search", placeholder="Type to search...")
                
                # Filter items based on search
                if search_term:
                    filtered_items = [item for item in st.session_state['items_list'] if search_term.lower() in str(item).lower()]
                else:
                    filtered_items = st.session_state['items_list']
                
                # Select All / Clear All buttons inline
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Select All", key="items_select_all"):
                        st.session_state['selected_items'] = filtered_items[:]
                        st.rerun()
                with col2:
                    if st.button("Clear All", key="items_clear_all"):
                        st.session_state['selected_items'] = []
                        st.rerun()
                
                # Divider removed
                
                # Checkbox list as vertical list
                if len(filtered_items) > 0:
                    for idx, item in enumerate(filtered_items[:50]):  # Limit to first 50 for performance
                        is_selected = item in st.session_state['selected_items']
                        
                        item_changed = False
                        if st.checkbox(
                            str(item), 
                            value=is_selected, 
                            key=f"item_checkbox_{schema}_{table_name}_{idx}_{item}"
                        ):
                            if item not in st.session_state['selected_items']:
                                st.session_state['selected_items'].append(item)
                                item_changed = True
                        else:
                            if item in st.session_state['selected_items']:
                                st.session_state['selected_items'].remove(item)
                                item_changed = True
                        
                        # Trigger rerun to update count
                        if item_changed:
                            st.rerun()
                    
                    if len(filtered_items) > 50:
                        st.info(f"Showing first 50 of {len(filtered_items)} items")
                else:
                    st.warning("No items match your search")
        
        selected_items = st.session_state['selected_items']

        # Step 1: Training Decision (only show if parameters are complete)
        if selected_items and not st.session_state.get('training_step_completed', False):
            # Divider removed
            st.markdown("### Model Training")
            
            # Check cache status using persistent cache
            from utils.model_cache import get_model_cache
            from app_schema_forecast import get_hierarchy_filters
            
            # Get hierarchical filters for accurate cache checking
            selected_planning_areas, selected_scenario_names = get_hierarchy_filters(schema, table_name)
            
            model_cache = get_model_cache()
            cache_info = model_cache.get_cache_info(
                schema, table_name, date_col, item_col, qty_col, 
                model_type, forecast_days, selected_items,
                planning_areas=selected_planning_areas,
                scenario_names=selected_scenario_names
            )
            
            cached_count = cache_info['cached_count']
            total_items = cache_info['total_items']
            cached_items = cache_info['cached_items']
            missing_items = cache_info['missing_items']
            
            if cached_count > 0:
                # Show both options when some cached models exist
                if cached_count == total_items:
                    st.info(f"Found trained {model_type} models for all {total_items} items")
                else:
                    st.info(f"Found trained {model_type} models for {cached_count}/{total_items} items")
                
                col_train1, col_train2 = st.columns(2)
                
                with col_train1:
                    if cached_count == total_items:
                        if st.button("⚡ Use Latest Trained", type="secondary", help="Use existing model for fast forecasting"):
                            st.session_state['use_cached_model'] = True
                            st.session_state['training_step_completed'] = True
                            # Ready to use cached models
                            st.rerun()
                    else:
                        st.info(f"⚠️ Only {cached_count}/{total_items} items have cached models")
                        if st.button("🔄 Train Missing Models", type="secondary", help=f"Train {total_items - cached_count} missing models"):
                            # Use missing items from cache info
                            if missing_items:
                                # Train only missing models
                                from app_schema_forecast import train_models_for_items
                                
                                server = st.session_state['server']
                                database = st.session_state['database']
                                username = st.session_state['username']
                                password = st.session_state['password']
                                connection_type = st.session_state['connection_type']
                                full_table_name = f"[{schema}].[{table_name}]"
                                
                                success = train_models_for_items(
                                    server, database, username, password, connection_type, full_table_name,
                                    date_col, item_col, qty_col, missing_items, forecast_days, model_type,
                                    schema, table_name
                                )
                                
                                if success:
                                    st.session_state['use_cached_model'] = True
                                    st.session_state['training_step_completed'] = True
                                    # All models ready
                                    st.rerun()
                                else:
                                    # Even if training failed, check if we have any cached models to work with
                                    st.error("Training failed")
                                    if cached_count > 0:
                                        st.warning(f"⚡ Can still forecast {cached_count} items with existing models")
                                        st.session_state['training_step_completed'] = True  # Allow forecasting with available models
                                        st.session_state['use_cached_model'] = True
                                        st.rerun()  # Refresh UI to show Generate Forecast button
                
                with col_train2:
                    if st.button("🔄 Retrain Models", type="secondary", help="Train fresh models for improved accuracy"):
                        # Train models immediately
                        from app_schema_forecast import train_models_for_items
                        
                        server = st.session_state['server']
                        database = st.session_state['database']
                        username = st.session_state['username']
                        password = st.session_state['password']
                        connection_type = st.session_state['connection_type']
                        full_table_name = f"[{schema}].[{table_name}]"
                        
                        success = train_models_for_items(
                            server, database, username, password, connection_type, full_table_name,
                            date_col, item_col, qty_col, selected_items, forecast_days, model_type,
                            schema, table_name
                        )
                        
                        if success:
                            st.session_state['use_cached_model'] = True  # Now use the newly trained models
                            st.session_state['training_step_completed'] = True
                            # Models trained successfully
                            st.rerun()
                        else:
                            # Even if training failed, check if we have any cached models to work with  
                            st.error("Training failed")
                            if cached_count > 0:
                                st.warning(f"⚡ Can still forecast {cached_count} items with existing models")
                                st.session_state['training_step_completed'] = True  # Allow forecasting with available models
                                st.session_state['use_cached_model'] = True
                                st.rerun()  # Refresh UI to show Generate Forecast button
            else:
                # Show option for when cached models exist but user hasn't made decision
                if cached_count > 0:
                    st.warning(f"⚡ Found {cached_count} trained models - choose an option above or forecast now!")
                    if st.button("Forecast With Available Models", type="primary", help=f"Generate forecasts using {cached_count} available models"):
                        st.session_state['use_cached_model'] = True
                        st.session_state['training_step_completed'] = True
                        st.success(f"Ready to forecast {cached_count} items!")
                        st.rerun()
                else:
                    # Only show train option when no cached model
                    st.info("🆕 No trained model found for this configuration")
                if st.button("🚀 Train Models", type="primary", help="Train new models for forecasting"):
                    # Train models immediately
                    from app_schema_forecast import train_models_for_items
                    
                    server = st.session_state['server']
                    database = st.session_state['database']
                    username = st.session_state['username']
                    password = st.session_state['password']
                    connection_type = st.session_state['connection_type']
                    full_table_name = f"[{schema}].[{table_name}]"
                    
                    success = train_models_for_items(
                        server, database, username, password, connection_type, full_table_name,
                        date_col, item_col, qty_col, selected_items, forecast_days, model_type,
                        schema, table_name
                    )
                    
                    if success:
                        st.session_state['use_cached_model'] = True  # Now use the newly trained models
                        st.session_state['training_step_completed'] = True
                        st.success("Models trained successfully!")
                        st.rerun()
                    else:
                        st.error("Training failed")
                        # Note: This case is for when no cached models exist, so no fallback available
        
        # Step 2: Generate Forecast (only show after training decision is made)
        elif selected_items and st.session_state.get('training_step_completed', False):
            # Divider removed
            
            # Show current training decision
            if st.session_state.get('use_cached_model', False):
                st.success("⚡ Ready to generate forecasts with trained models")
            else:
                st.success("🔄 Ready to generate forecasts with fresh models")
            
            col_forecast1, col_forecast2 = st.columns([3, 1])
            
            with col_forecast1:
                if st.button("Generate Forecast", type="primary"):
                    from app_schema_forecast import generate_item_forecasts_with_cache
                    
                    # Use the full table reference
                    full_table_name = f"[{schema}].[{table_name}]"
                    server = st.session_state['server']
                    database = st.session_state['database']
                    username = st.session_state['username']
                    password = st.session_state['password']
                    connection_type = st.session_state['connection_type']
                    
                    use_cached = st.session_state.get('use_cached_model', False)
                    
                    generate_item_forecasts_with_cache(
                        server, database, username, password, connection_type, full_table_name,
                        date_col, item_col, qty_col, selected_items, forecast_days, model_type,
                        schema, table_name, use_cached
                    )
            
            with col_forecast2:
                if st.button("🔄 Change Training"):
                    # Reset training state to go back to training options
                    st.session_state['training_step_completed'] = False
                    if 'use_cached_model' in st.session_state:
                        del st.session_state['use_cached_model']
                    # Force immediate rerun to show training options
                    st.rerun()
        
        elif selected_items and not st.session_state.get('training_step_completed', False):
            # This handles the case where training_step_completed is False but training options didn't show
            # (fallback to ensure training options are always visible when needed)
            # Divider removed
            st.markdown("### Model Training")
            st.info("⚠️ Training configuration reset. Please select your training option:")
            
            # Simplified training options as fallback
            col_simple1, col_simple2 = st.columns(2)
            with col_simple1:
                if st.button("⚡ Use Cached Models", type="secondary"):
                    st.session_state['use_cached_model'] = True
                    st.session_state['training_step_completed'] = True
                    st.rerun()
            with col_simple2:
                if st.button("🔄 Train Fresh Models", type="primary"):
                    st.session_state['use_cached_model'] = False
                    st.session_state['training_step_completed'] = True
                    st.rerun()
        elif selected_items:
            st.info("👆 Configure training options above to continue")
        else:
            st.info("👆 Select items first to see training options")