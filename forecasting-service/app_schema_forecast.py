import streamlit as st
import os
import hashlib
import json
from pathlib import Path
# All other imports are lazy - only load when needed


def load_items_for_table(schema, table, item_col):
    """Load items list from database for specified table"""
    from utils.data_processing import DataProcessor
    
    # Get database connection details from session state
    server = st.session_state.get('server')
    database = st.session_state.get('database')
    username = st.session_state.get('username')
    password = st.session_state.get('password')
    connection_type = st.session_state.get('connection_type')
    
    if not all([server, database, username, password]):
        raise Exception("Missing database credentials")
    
    data_processor = DataProcessor()
    
    # Helper function for secure identifier escaping
    def escape_sql_identifier(identifier):
        """Safely escape SQL identifiers by bracketing and doubling closing brackets"""
        return f"[{str(identifier).replace(']', ']]')}]"
    
    # Helper function for secure value escaping
    def escape_sql_value(value):
        """Safely escape SQL string values by doubling single quotes"""
        return str(value).replace("'", "''")
    
    # Query to get distinct items with hierarchical filters applied
    full_table_name = f"{escape_sql_identifier(schema)}.{escape_sql_identifier(table)}"
    where_clauses = []
    
    # Add planning area filter if specified - use EXACT same keys as column_selection_interface.py
    planning_area_col_key = f"planning_area_{schema}_{table}"
    planning_area_col = st.session_state.get(planning_area_col_key, st.session_state.get('planning_area_col'))
    # Use EXACT same key pattern as column_selection_interface.py
    planning_area_str = str(planning_area_col) if planning_area_col else "none"
    planning_selections_key = f"selected_planning_areas_{schema}_{table}_{planning_area_str}"
    selected_planning_areas = st.session_state.get(planning_selections_key, [])
    if planning_area_col and selected_planning_areas:
        valid_areas = [area for area in selected_planning_areas if area is not None]
        if valid_areas:
            escaped_areas = [escape_sql_value(area) for area in valid_areas]
            planning_filter = "', '".join(escaped_areas)
            where_clauses.append(f"{escape_sql_identifier(planning_area_col)} IN ('{planning_filter}')")
    
    # Add scenario name filter if specified - use EXACT same keys as column_selection_interface.py
    scenario_name_col_key = f"scenario_name_{schema}_{table}"
    scenario_name_col = st.session_state.get(scenario_name_col_key, st.session_state.get('scenario_name_col'))
    # Use EXACT same key pattern as column_selection_interface.py
    scenario_name_str = str(scenario_name_col) if scenario_name_col else "none"
    scenario_selections_key = f"selected_scenario_names_{schema}_{table}_{scenario_name_str}"
    selected_scenario_names = st.session_state.get(scenario_selections_key, [])
    if scenario_name_col and selected_scenario_names:
        valid_scenarios = [scenario for scenario in selected_scenario_names if scenario is not None]
        if valid_scenarios:
            escaped_scenarios = [escape_sql_value(scenario) for scenario in valid_scenarios]
            scenario_filter = "', '".join(escaped_scenarios)
            where_clauses.append(f"{escape_sql_identifier(scenario_name_col)} IN ('{scenario_filter}')")
    
    # Build the final query
    if where_clauses:
        where_clause = " WHERE " + " AND ".join(where_clauses)
        item_query = f"SELECT DISTINCT {escape_sql_identifier(item_col)} FROM {full_table_name}{where_clause} ORDER BY {escape_sql_identifier(item_col)}"
    else:
        item_query = f"SELECT DISTINCT {escape_sql_identifier(item_col)} FROM {full_table_name} ORDER BY {escape_sql_identifier(item_col)}"
    
    items_df = data_processor.load_data_from_sql(
        server, database, username, password, item_query, connection_type or 'sqlalchemy'
    )
    
    if items_df is not None and not items_df.empty:
        items_list = items_df[item_col].tolist()
        
        # Set items list in session state for UI (use top-level key that UI expects)
        st.session_state['items_list'] = items_list
        
        # Also set in schema cache for consistency
        schema_key = f"schema_{schema}_{table}"
        if schema_key not in st.session_state:
            st.session_state[schema_key] = {}
        st.session_state[schema_key]['items_list'] = items_list


def get_global_max_date(server, database, username, password, connection_type, table_name, date_col):
    """Get the maximum date from the entire table without any filters"""
    try:
        import pandas as pd
        from utils.data_processing import DataProcessor
        
        # Escape the identifiers to prevent SQL injection
        def escape_sql_identifier(identifier):
            """Safely escape SQL identifiers by bracketing"""
            return f"[{identifier}]"
        
        data_processor = DataProcessor()
        
        # Query to get the maximum date from the entire table
        max_date_query = f"""
        SELECT MAX({escape_sql_identifier(date_col)}) as max_date
        FROM {table_name}
        """
        
        result_df = data_processor.load_data_from_sql(
            server, database, username, password, max_date_query, connection_type
        )
        
        if result_df is not None and not result_df.empty and 'max_date' in result_df.columns:
            max_date = result_df['max_date'].iloc[0]
            if max_date is not None:
                return pd.to_datetime(max_date)
    except Exception as e:
        st.warning(f"Could not get global max date: {e}")
    
    # Fallback to current date if query fails
    import pandas as pd
    return pd.Timestamp.now().normalize()

def get_hierarchy_filters(schema, table_name):
    """Get normalized hierarchical filters from session state using canonical key patterns"""
    
    # Get planning area column and selections
    planning_area_col_key = f"planning_area_{schema}_{table_name}"
    planning_area_col = st.session_state.get(planning_area_col_key, st.session_state.get('planning_area_col'))
    
    if planning_area_col:
        planning_area_str = str(planning_area_col)
        planning_selections_key = f"selected_planning_areas_{schema}_{table_name}_{planning_area_str}"
        selected_planning_areas = st.session_state.get(planning_selections_key, [])
        # Filter out None values
        selected_planning_areas = [area for area in selected_planning_areas 
                                 if area is not None]
    else:
        selected_planning_areas = []
    
    # Get scenario name column and selections  
    scenario_name_col_key = f"scenario_name_{schema}_{table_name}"
    scenario_name_col = st.session_state.get(scenario_name_col_key, st.session_state.get('scenario_name_col'))
    
    if scenario_name_col:
        scenario_name_str = str(scenario_name_col) 
        scenario_selections_key = f"selected_scenario_names_{schema}_{table_name}_{scenario_name_str}"
        selected_scenario_names = st.session_state.get(scenario_selections_key, [])
        # Filter out None values
        selected_scenario_names = [scenario for scenario in selected_scenario_names 
                                 if scenario is not None]
    else:
        selected_scenario_names = []
    
    # Sort for stability and remove duplicates
    selected_planning_areas = sorted(list(set(selected_planning_areas))) if selected_planning_areas else []
    selected_scenario_names = sorted(list(set(selected_scenario_names))) if selected_scenario_names else []
    
    return selected_planning_areas, selected_scenario_names

def check_cache_status_for_items(schema, table_name, date_col, item_col, qty_col, model_type, forecast_days, selected_items):
    """Check how many selected items have cached models using persistent cache"""
    from utils.model_cache import get_model_cache
    
    # Get hierarchical filters using canonical keys
    selected_planning_areas, selected_scenario_names = get_hierarchy_filters(schema, table_name)
    
    model_cache = get_model_cache()
    cached_items, missing_items = model_cache.get_cached_items(
        schema, table_name, date_col, item_col, qty_col, 
        model_type, forecast_days, selected_items,
        planning_areas=selected_planning_areas,
        scenario_names=selected_scenario_names
    )
    
    return len(cached_items), len(selected_items), cached_items, missing_items

# Configure Streamlit page
st.set_page_config(
    page_title="Item Demand Forecasting",
    layout="wide",
    initial_sidebar_state="expanded"
)

def apply_theme():
    """Apply custom CSS based on selected theme"""
    # Initialize theme in session state if not exists
    if 'theme_mode' not in st.session_state:
        st.session_state.theme_mode = 'light'
    
    # Theme colors
    themes = {
        'light': {
            'bg_color': '#ffffff',
            'secondary_bg': '#f0f2f6',
            'text_color': '#262730',
            'border_color': '#e6e9ef',
            'sidebar_bg': '#f0f2f6',
            'primary_color': '#1f77b4'
        },
        'dark': {
            'bg_color': '#0e1117',
            'secondary_bg': '#262730',
            'text_color': '#fafafa',
            'border_color': '#4a5568',
            'sidebar_bg': '#262730',
            'primary_color': '#ff6b6b'
        }
    }
    
    current_theme = themes[st.session_state.theme_mode]
    
    # Apply custom CSS
    st.markdown(f"""
    <style>
    .stApp {{
        background-color: {current_theme['bg_color']};
        color: {current_theme['text_color']};
    }}
    
    .stSidebar > div:first-child {{
        background-color: {current_theme['sidebar_bg']};
    }}
    
    .stSelectbox > div > div {{
        background-color: {current_theme['secondary_bg']};
        border-color: {current_theme['border_color']};
        min-height: 32px !important;
        height: 32px !important;
    }}
    
    .stSelectbox > div > div > div {{
        min-height: 32px !important;
        height: 32px !important;
        padding: 4px 8px !important;
        font-size: 14px !important;
    }}
    
    .stSelectbox label {{
        font-size: 14px !important;
        margin-bottom: 4px !important;
    }}
    
    .stMultiSelect > div > div {{
        min-height: 32px !important;
        padding: 4px 8px !important;
    }}
    
    .stMultiSelect label {{
        font-size: 14px !important;
        margin-bottom: 4px !important;
    }}
    
    .stTextInput > div > div > input {{
        background-color: {current_theme['secondary_bg']};
        color: {current_theme['text_color']};
        border-color: {current_theme['border_color']};
        min-height: 32px !important;
        height: 32px !important;
        padding: 4px 8px !important;
        font-size: 14px !important;
    }}
    
    .stTextInput label {{
        font-size: 14px !important;
        margin-bottom: 4px !important;
    }}
    
    .stExpander {{
        background-color: {current_theme['secondary_bg']};
        border-color: {current_theme['border_color']};
        font-size: 12px !important;
        margin: 8px 0 !important;
    }}
    
    .stExpander > div:first-child {{
        padding: 6px 12px !important;
        font-size: 12px !important;
        min-height: 28px !important;
    }}
    
    .stExpander > div:last-child {{
        padding: 4px 8px !important;
        font-size: 11px !important;
    }}
    
    /* Make expander content more compact */
    .stExpander div[data-testid="stVerticalBlock"] {{
        gap: 0.2rem !important;
    }}
    
    .stExpander .element-container {{
        margin-bottom: 0.1rem !important;
        margin-top: 0.1rem !important;
    }}
    
    .stAlert {{
        background-color: {current_theme['secondary_bg']};
        border-color: {current_theme['border_color']};
        font-size: 12px !important;
        padding: 6px 10px !important;
        margin: 6px 0 !important;
    }}
    
    .stButton > button {{
        background-color: {current_theme['primary_color']};
        color: white;
        border: none;
        font-size: 14px !important;
        padding: 6px 12px !important;
        min-height: 32px !important;
        height: 32px !important;
    }}
    
    /* Make buttons in expanders smaller and more minimal */
    .stExpander .stButton > button {{
        font-size: 11px !important;
        padding: 4px 8px !important;
        min-height: 24px !important;
        height: 24px !important;
        border-radius: 4px !important;
    }}
    
    .stCheckbox > label {{
        color: {current_theme['text_color']};
        font-size: 14px !important;
    }}
    
    /* Make checkboxes in expanders smaller */
    .stExpander .stCheckbox > label {{
        font-size: 11px !important;
        margin-bottom: 2px !important;
        margin-top: 2px !important;
    }}
    
    .stExpander .stCheckbox {{
        margin-bottom: 1px !important;
        margin-top: 1px !important;
    }}
    
    .stExpander .stCheckbox > div:first-child {{
        min-height: 18px !important;
        height: 18px !important;
    }}
    
    .stExpander .stCheckbox input[type="checkbox"] {{
        width: 14px !important;
        height: 14px !important;
    }}
    
    /* Overall typography - make everything smaller and more compact */
    h1 {{
        font-size: 1.8rem !important;
        margin-bottom: 0.5rem !important;
        margin-top: 0.5rem !important;
    }}
    
    h2 {{
        font-size: 1.4rem !important;
        margin-bottom: 0.5rem !important;
        margin-top: 0.5rem !important;
    }}
    
    h3 {{
        font-size: 1.2rem !important;
        margin-bottom: 0.4rem !important;
        margin-top: 0.4rem !important;
    }}
    
    .stMarkdown {{
        font-size: 14px !important;
        line-height: 1.4 !important;
    }}
    
    .stCaption {{
        font-size: 11px !important;
        margin-bottom: 2px !important;
        margin-top: 2px !important;
        color: {current_theme['text_color']} !important;
        opacity: 0.8;
    }}
    
    .stMetric {{
        background-color: {current_theme['secondary_bg']};
        padding: 8px 12px !important;
        border-radius: 4px;
        margin: 4px 0 !important;
    }}
    
    .stMetric > div {{
        font-size: 14px !important;
    }}
    
    .stMetric [data-testid="metric-container"] > div:first-child {{
        font-size: 14px !important;
    }}
    
    .stMetric [data-testid="metric-container"] > div:last-child {{
        font-size: 20px !important;
    }}
    
    .stDataFrame {{
        font-size: 13px !important;
    }}
    
    .stTabs [data-baseweb="tab-list"] {{
        gap: 8px !important;
    }}
    
    .stTabs [data-baseweb="tab"] {{
        font-size: 14px !important;
        padding: 6px 12px !important;
        min-height: 32px !important;
    }}
    
    .stSpinner > div {{
        font-size: 14px !important;
    }}
    
    .stProgress > div > div {{
        font-size: 13px !important;
    }}
    
    /* Reduce spacing between elements - make everything more compact */
    .block-container {{
        padding-top: 0.5rem !important;
        padding-bottom: 0.5rem !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
    }}
    
    .element-container {{
        margin-bottom: 0.3rem !important;
        margin-top: 0.2rem !important;
    }}
    
    /* Make columns more compact */
    .row-widget.stSelectbox {{
        margin-bottom: 0.3rem !important;
    }}
    
    .row-widget.stTextInput {{
        margin-bottom: 0.3rem !important;
    }}
    
    /* Additional compact styling for choose boxes */
    .stExpander .stCheckbox {{
        margin-bottom: 0.05rem !important;
        margin-top: 0.05rem !important;
        padding: 1px 0 !important;
    }}
    
    /* Standardized styling for radio buttons in expanders */
    .stExpander .stRadio {{
        margin-bottom: 0.05rem !important;
        margin-top: 0.05rem !important;
        padding: 1px 0 !important;
    }}
    
    /* Consistent font size and spacing for all option labels */
    .stExpander .stCheckbox label,
    .stExpander .stRadio label {{
        font-size: 13px !important;
        line-height: 1.3 !important;
        margin-bottom: 0.05rem !important;
    }}
    
    /* Consistent spacing for radio and checkbox containers */
    .stExpander .stRadio > div,
    .stExpander .stCheckbox > div {{
        margin-bottom: 0.1rem !important;
        margin-top: 0.1rem !important;
        gap: 0.1rem !important;
    }}
    
    /* Standardize radio button and checkbox input size */
    .stExpander .stRadio input[type="radio"],
    .stExpander .stCheckbox input[type="checkbox"] {{
        margin-right: 0.3rem !important;
        transform: scale(0.9) !important;
    }}
    
    .stExpander .stButton {{
        margin-bottom: 0.2rem !important;
        margin-top: 0.2rem !important;
    }}
    
    /* Make text in columns smaller */
    .stExpander .stColumns {{
        gap: 0.3rem !important;
    }}
    
    .stExpander .stColumn {{
        padding: 1px !important;
    }}
    
    
    /* Ensure select and multiselect inside expanders are also small */
    .stExpander .stSelectbox > div > div {{
        font-size: 11px !important;
        min-height: 24px !important;
        height: 24px !important;
    }}
    
    .stExpander .stMultiSelect > div > div {{
        font-size: 11px !important;
        min-height: 24px !important;
        height: 24px !important;
    }}
    
    .theme-switch {{
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 999;
        background: {current_theme['secondary_bg']};
        padding: 10px;
        border-radius: 10px;
        border: 1px solid {current_theme['border_color']};
    }}
    </style>
    """, unsafe_allow_html=True)

def main():
    # Apply theme first
    apply_theme()
    
    # Header with aligned title and theme toggle
    header_col1, header_col2 = st.columns([8, 2])
    
    with header_col1:
        st.title("Demand Forecasting")
        st.caption("Auto-connected to your SQL Server")
    
    with header_col2:
        # Theme toggle aligned with title
        current_theme = st.session_state.get('theme_mode', 'light')
        theme_icon = "🌙" if current_theme == 'light' else "☀️"
        theme_label = "Dark" if current_theme == 'light' else "Light"
        
        # Add some vertical spacing to align with title
        st.write("")  # Small spacer
        if st.button(f"{theme_icon} {theme_label} Mode", key="theme_toggle", help="Switch between light and dark theme"):
            st.session_state.theme_mode = 'dark' if current_theme == 'light' else 'light'
            st.rerun()

    # Load credentials from Replit secrets FIRST
    server = os.getenv('SQL_SERVER')
    database = os.getenv('SQL_DATABASE') 
    username = os.getenv('SQL_USERNAME')
    password = os.getenv('SQL_PASSWORD')
    connection_type = 'sqlalchemy'
    
    # Check if all credentials are available
    if not all([server, database, username, password]):
        st.error("Missing SQL credentials in Replit secrets. Please add: SQL_SERVER, SQL_DATABASE, SQL_USERNAME, SQL_PASSWORD")
        return
    
    # Store credentials in session state
    st.session_state.update({
        'server': server,
        'database': database, 
        'username': username,
        'password': password,
        'connection_type': connection_type
    })

    # Show connection status
    if 'connection_shown' not in st.session_state:
        st.success("Connected to SQL Server")
        st.session_state['connection_shown'] = True
    
    # Auto-load tables on startup
    if 'tables_loaded' not in st.session_state:
        show_available_tables(server, database, username, password, connection_type)
        st.session_state['tables_loaded'] = True
        
    # Show table selection if already connected
    if all(key in st.session_state for key in ['server', 'database', 'username', 'password']):
        # Divider removed
        show_table_selection()
        
    # Show table schema if table is selected (persistent step progression)
    if all(key in st.session_state for key in ['selected_schema', 'selected_table']):
        # Divider removed
        server = st.session_state['server']
        database = st.session_state['database']
        username = st.session_state['username']
        password = st.session_state['password']
        connection_type = st.session_state['connection_type']
        schema = st.session_state['selected_schema']
        table_name = st.session_state['selected_table']
        # Table schema display removed
        
        # Divider removed
        from column_selection_interface import show_column_selection_interface
        show_column_selection_interface(schema, table_name)

def show_available_tables(server, database, username, password, connection_type):
    """Show all available tables in the database"""
    
    from utils.data_processing import DataProcessor
    data_processor = DataProcessor()
    
    with st.spinner("Connecting to database and retrieving tables..."):
        # Test connection
        connection_result = data_processor.test_sql_connection(server, database, username, password, connection_type)
        
        if connection_result and len(connection_result) == 2:
            success, message = connection_result
            if not success:
                st.error(f"Connection failed: {message}")
                return
        else:
            st.error("Failed to test connection")
            return
        
        
        # Get list of tables
        tables = data_processor.get_table_list(server, database, username, password, connection_type)
        
        if not tables:
            st.error("No tables found in the database")
            return
        
        # Store tables in session state
        st.session_state['tables'] = tables

def show_table_selection():
    """Show table selection interface"""
    
    if 'tables' not in st.session_state:
        st.info("Click 'Connect & Show Tables' first to see available tables")
        return
    
    tables = st.session_state['tables']
    
    st.markdown(f"**Available Tables:** {len(tables)} found")
    
    # Create table selection
    table_options = [f"{schema}.{table}" for schema, table in tables]
    
    # Initialize or get current selection
    if 'selected_table_option' not in st.session_state:
        st.session_state['selected_table_option'] = ""
    
    selected_table = st.selectbox(
        "Select a Table for Forecasting", 
        table_options,
        index=table_options.index(st.session_state['selected_table_option']) if st.session_state['selected_table_option'] in table_options else None,
        key="table_selector",
        placeholder="Choose a table..."
    )
    
    # Update session state when selection changes
    if selected_table and selected_table != st.session_state.get('selected_table_option', ''):
        st.session_state['selected_table_option'] = selected_table
        
        # Extract schema and table name
        if '.' in selected_table:
            schema, table_name = selected_table.split('.', 1)
        else:
            schema, table_name = 'dbo', selected_table
        
        # Store selected table info
        st.session_state['selected_schema'] = schema
        st.session_state['selected_table'] = table_name
        
        # Set legacy keys for backward compatibility with forecast functions
        st.session_state['schema'] = schema
        st.session_state['table_name_only'] = table_name
        
        
        st.success(f"Selected: {selected_table}")
        st.rerun()
    
    # Show Columns functionality removed

# show_table_schema function removed
    

def generate_item_forecasts(server, database, username, password, connection_type, table_name,
                          date_col, item_col, qty_col, selected_items, forecast_days, model_type):
    """Generate forecasts for selected items (legacy function)"""
    
    from utils.data_processing import DataProcessor
    data_processor = DataProcessor()
    
    if len(selected_items) == 1:
        item = selected_items[0]
        st.subheader(f"{item}")
        forecast_single_item(data_processor, server, database, username, password, connection_type, 
                            table_name, date_col, item_col, qty_col, item, forecast_days, model_type)
    else:
        tabs = st.tabs([f"{item}" for item in selected_items])
        
        for i, item in enumerate(selected_items):
            with tabs[i]:
                forecast_single_item(data_processor, server, database, username, password, connection_type,
                                   table_name, date_col, item_col, qty_col, item, forecast_days, model_type)

def train_models_for_items(server, database, username, password, connection_type, table_name,
                          date_col, item_col, qty_col, selected_items, forecast_days, model_type,
                          schema, table_name_only):
    """Train models for all selected items immediately"""
    
    from utils.data_processing import DataProcessor
    from forecast_simple import SimpleDemandForecaster
    from utils.model_cache import get_model_cache
    from datetime import datetime
    
    # Get hierarchical filters using canonical keys
    selected_planning_areas, selected_scenario_names = get_hierarchy_filters(schema, table_name_only)
    
    data_processor = DataProcessor()
    model_cache = get_model_cache()
    
    trained_count = 0
    total_items = len(selected_items)
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    for i, item in enumerate(selected_items):
        try:
            progress = (i) / total_items
            progress_bar.progress(progress)
            status_text.text(f"Training {model_type} model for {item}... ({i+1}/{total_items})")
            
            # Get cache key for this item using persistent cache
            cache_key = model_cache.get_cache_key(
                schema, table_name_only, date_col, item_col, qty_col,
                model_type, forecast_days, item,
                planning_areas=selected_planning_areas,
                scenario_names=selected_scenario_names
            )
            
            # Load data for this item
            safe_item = str(item).replace("'", "''")
            item_query = f"""
            SELECT [{date_col}], SUM([{qty_col}]) as total_quantity
            FROM {table_name}
            WHERE [{item_col}] = '{safe_item}'
            GROUP BY [{date_col}]
            ORDER BY [{date_col}]
            """
            
            item_df = data_processor.load_data_from_sql(
                server, database, username, password, item_query, connection_type
            )
            
            if item_df is None or item_df.empty:
                # No data found for item (notification removed)
                continue
            
            # Train model for this item
            forecaster = SimpleDemandForecaster()
            
            # Initialize default metrics
            metrics = {'MAE': 0, 'RMSE': 0, 'MAPE': 0}
            
            # Prepare data
            sales_data = forecaster.prepare_sales_data(item_df, date_col, 'total_quantity')
            
            # Create lag features
            feature_data, feature_cols = forecaster.create_lag_features(sales_data, 'total_quantity')
            
            # Train selected model
            if model_type == "Random Forest":
                metrics = forecaster.train_random_forest(feature_data, 'total_quantity', feature_cols, forecast_days)
            elif model_type == "ARIMA":
                metrics = forecaster.train_arima(feature_data, 'total_quantity', forecast_days)
            elif model_type == "Prophet":
                try:
                    from prophet import Prophet
                    metrics = forecaster.train_prophet(feature_data, date_col, 'total_quantity', forecast_days)
                except ImportError:
                    st.error(f"Prophet not available for {item}. Skipping.")
                    continue
            
            # Prepare metadata for persistent cache
            metadata = {
                'mae': metrics.get('MAE', 0),
                'rmse': metrics.get('RMSE', 0),
                'mape': metrics.get('MAPE', 0),
                'data_points': len(item_df),
                'data_range_start': str(feature_data[date_col].min()),
                'date_range_end': str(feature_data[date_col].max()),
                'feature_cols': feature_cols,
                'model_type': model_type,
                'planning_areas': selected_planning_areas,
                'scenario_names': selected_scenario_names
            }
            
            # Save the model (and scaler for Random Forest) to persistent cache
            if model_type == "Random Forest":
                # Save model and scaler together as a dict
                model_data = {
                    'model': forecaster.model,
                    'scaler': forecaster.scaler
                }
                saved_key = model_cache.save_model(
                    schema, table_name_only, date_col, item_col, qty_col,
                    model_type, forecast_days, item, model_data, metadata,
                    planning_areas=selected_planning_areas,
                    scenario_names=selected_scenario_names
                )
            else:
                # For ARIMA and Prophet, just save the model
                saved_key = model_cache.save_model(
                    schema, table_name_only, date_col, item_col, qty_col,
                    model_type, forecast_days, item, forecaster.model, metadata,
                    planning_areas=selected_planning_areas,
                    scenario_names=selected_scenario_names
                )
            
            # Model saved to cache (notification removed)
            
            trained_count += 1
            
        except Exception as e:
            # Failed to train model (notification removed)
            continue
    
    # Complete progress
    progress_bar.progress(1.0)
    status_text.text(f"✅ Training complete! {trained_count}/{total_items} models trained successfully")
    
    # Clear progress elements after a moment
    import time
    time.sleep(1)
    progress_bar.empty()
    status_text.empty()
    
    return trained_count

def generate_item_forecasts_with_cache(server, database, username, password, connection_type, table_name,
                                     date_col, item_col, qty_col, selected_items, forecast_days, model_type,
                                     schema, table_name_only, use_cached):
    """Generate forecasts for selected items with intelligent caching"""
    
    from utils.data_processing import DataProcessor
    from utils.model_cache import get_model_cache
    
    # Get hierarchical filters using canonical keys
    selected_planning_areas, selected_scenario_names = get_hierarchy_filters(schema, table_name_only)
    
    data_processor = DataProcessor()
    model_cache = get_model_cache()
    
    # Check cache status using persistent cache
    if use_cached:
        cached_items, missing_items = model_cache.get_cached_items(
            schema, table_name_only, date_col, item_col, qty_col,
            model_type, forecast_days, selected_items,
            planning_areas=selected_planning_areas,
            scenario_names=selected_scenario_names
        )
        
        if missing_items:
            # Missing cached models (notification removed)
            # Train missing models automatically
            
            # Train missing models
            trained_count = train_models_for_items(
                server, database, username, password, connection_type, table_name,
                date_col, item_col, qty_col, missing_items, forecast_days, model_type,
                schema, table_name_only
            )
            
            # Training completed (notification removed)
            
            # Update cache status after training
            cached_items, missing_items = model_cache.get_cached_items(
                schema, table_name_only, date_col, item_col, qty_col,
                model_type, forecast_days, selected_items,
                planning_areas=selected_planning_areas,
                scenario_names=selected_scenario_names
            )
            
            # Still missing models (notification removed)
            
            # Filter out items that still don't have cached models
            available_items = [item for item in selected_items if item not in missing_items]
            
            if not available_items:
                # No items available for forecasting (notification removed)
                return
            
            # Update selected items to only include those with cached models
            selected_items = available_items
    
    # Generate forecasts for all items using cached models
    if len(selected_items) == 1:
        item = selected_items[0]
        st.subheader(f"{item}")
        forecast_single_item_with_cache(data_processor, server, database, username, password, connection_type, 
                                       table_name, date_col, item_col, qty_col, item, forecast_days, model_type,
                                       schema, table_name_only, use_cached)
    else:
        # Create tabs for multiple items
        
        # Create tabs with "Overall" as the first tab, followed by individual items
        tab_labels = ["Overall"] + [f"{item}" for item in selected_items]
        tabs = st.tabs(tab_labels)
        
        # Overall tab (first tab)
        with tabs[0]:
            forecast_overall_demand(data_processor, server, database, username, password, connection_type,
                                  table_name, date_col, item_col, qty_col, selected_items, forecast_days, model_type,
                                  schema, table_name_only, use_cached)
        
        # Individual item tabs (starting from index 1)
        for i, item in enumerate(selected_items):
            with tabs[i + 1]:  # +1 because Overall tab takes index 0
                forecast_single_item_with_cache(data_processor, server, database, username, password, connection_type,
                                               table_name, date_col, item_col, qty_col, item, forecast_days, model_type,
                                               schema, table_name_only, use_cached)

def forecast_overall_demand(data_processor, server, database, username, password, connection_type,
                           table_name, date_col, item_col, qty_col, selected_items, forecast_days, model_type,
                           schema, table_name_only, use_cached):
    """Generate and display overall aggregated demand forecast by summing individual item forecasts"""
    
    import pandas as pd
    import plotly.graph_objects as go
    from utils.model_cache import get_model_cache
    from forecast_simple import SimpleDemandForecaster
    
    st.subheader("Overall Demand Forecast")
    
    try:
        with st.spinner("Generating overall demand forecast..."):
            model_cache = get_model_cache()
            all_forecasts = []
            all_historical_data = []
            successful_items = []
            
            # Simplified approach: Use cached models to generate individual forecasts and sum them
            for item in selected_items:
                try:
                    # Check if we have a cached model for this item
                    if schema is None or table_name_only is None:
                        continue
                        
                    # Get hierarchical filters for cache key
                    cache_planning_areas, cache_scenario_names = get_hierarchy_filters(schema, table_name_only)
                    
                    # Cache existence check (debug info removed)
                    
                    if model_cache.exists(schema, table_name_only, date_col, item_col, qty_col, 
                                         model_type, forecast_days, item,
                                         planning_areas=cache_planning_areas,
                                         scenario_names=cache_scenario_names):
                        
                        # Load the same data as the individual tab would use
                        def escape_sql_value(value):
                            """Safely escape SQL string values by doubling single quotes"""
                            return str(value).replace("'", "''")
                        
                        where_clauses = [f"[{item_col}] = '{escape_sql_value(item)}'"]
                        
                        # Add hierarchical filters (same as individual tabs)
                        planning_area_col_key = f"planning_area_{schema}_{table_name_only}"
                        planning_area_col = st.session_state.get(planning_area_col_key, st.session_state.get('planning_area_col'))
                        # Use EXACT same key pattern as column_selection_interface.py
                        planning_area_str = str(planning_area_col) if planning_area_col else "none"
                        planning_selections_key = f"selected_planning_areas_{schema}_{table_name_only}_{planning_area_str}"
                        selected_planning_areas = st.session_state.get(planning_selections_key, [])
                        if planning_area_col and planning_area_col != "None (No Filter)" and selected_planning_areas:
                            valid_areas = [area for area in selected_planning_areas if area is not None and area != "None (No Filter)"]
                            if valid_areas:
                                escaped_areas = [escape_sql_value(area) for area in valid_areas]
                                planning_filter = "', '".join(escaped_areas)
                                where_clauses.append(f"[{planning_area_col}] IN ('{planning_filter}')")
                        
                        scenario_name_col_key = f"scenario_name_{schema}_{table_name_only}"
                        scenario_name_col = st.session_state.get(scenario_name_col_key, st.session_state.get('scenario_name_col'))
                        # Use EXACT same key pattern as column_selection_interface.py
                        scenario_name_str = str(scenario_name_col) if scenario_name_col else "none"
                        scenario_selections_key = f"selected_scenario_names_{schema}_{table_name_only}_{scenario_name_str}"
                        selected_scenario_names = st.session_state.get(scenario_selections_key, [])
                        if scenario_name_col and scenario_name_col != "None (No Filter)" and selected_scenario_names:
                            valid_scenarios = [scenario for scenario in selected_scenario_names if scenario is not None and scenario != "None (No Filter)"]
                            if valid_scenarios:
                                escaped_scenarios = [escape_sql_value(scenario) for scenario in valid_scenarios]
                                scenario_filter = "', '".join(escaped_scenarios)
                                where_clauses.append(f"[{scenario_name_col}] IN ('{scenario_filter}')")
                        
                        where_clause = " AND ".join(where_clauses)
                        
                        item_query = f"""
                        SELECT {date_col}, SUM({qty_col}) as total_quantity
                        FROM {table_name}
                        WHERE {where_clause}
                        GROUP BY {date_col}
                        ORDER BY {date_col}
                        """
                        
                        item_df = data_processor.load_data_from_sql(
                            server, database, username, password, item_query, connection_type
                        )
                        
                        if item_df is not None and not item_df.empty:
                            item_df['item'] = item
                            all_historical_data.append(item_df)
                            
                            # Load cached model
                            cache_key = model_cache.get_cache_key(
                                schema, table_name_only, date_col, item_col, qty_col,
                                model_type, forecast_days, item,
                                planning_areas=cache_planning_areas,
                                scenario_names=cache_scenario_names
                            )
                            
                            model, metadata = model_cache.load_model(cache_key)
                            
                            if model is not None:
                                forecaster = SimpleDemandForecaster()
                                
                                # Set up the cached model
                                if model_type == "Random Forest":
                                    if isinstance(model, dict) and 'model' in model and 'scaler' in model:
                                        forecaster.model = model['model']
                                        forecaster.scaler = model['scaler']
                                    else:
                                        forecaster.model = model
                                        forecaster.scaler = getattr(model, 'scaler', None)
                                else:
                                    forecaster.model = model
                                
                                forecaster.model_type = model_type
                                
                                # Generate forecast
                                sales_data = forecaster.prepare_sales_data(item_df, date_col, 'total_quantity')
                                feature_data, feature_cols = forecaster.create_lag_features(sales_data, 'total_quantity')
                                
                                try:
                                    # Use item-specific last date instead of global date
                                    forecast_result = forecaster.forecast_demand(feature_data, date_col, 'total_quantity', feature_cols, forecast_days, None)
                                    
                                    if forecast_result and 'dates' in forecast_result and 'values' in forecast_result:
                                        forecast_data = pd.DataFrame({
                                            date_col: pd.to_datetime(forecast_result['dates']),
                                            'forecast': forecast_result['values'],
                                            'item': item
                                        })
                                        all_forecasts.append(forecast_data)
                                        successful_items.append(item)
                                        
                                except Exception as e:
                                    st.warning(f"Could not generate forecast for {item}: {str(e)}")
                                    continue
                                    
                except Exception as e:
                    st.warning(f"Could not process {item}: {str(e)}")
                    continue
            
            if not all_historical_data or not all_forecasts:
                st.error("No forecast data available for overall demand")
                return
                
            # Combine all historical data
            combined_historical = pd.concat(all_historical_data, ignore_index=True)
            overall_historical = combined_historical.groupby(date_col)['total_quantity'].sum().reset_index()
            
            # Combine all forecasts with robust aggregation
            combined_forecasts = pd.concat(all_forecasts, ignore_index=True)
            
            # Create pivot table to verify aggregation
            forecast_pivot = combined_forecasts.pivot_table(
                index=date_col, 
                columns='item', 
                values='forecast', 
                aggfunc='sum', 
                fill_value=0
            )
            
            # Sum across items for overall forecast
            overall_forecast = pd.DataFrame({
                date_col: forecast_pivot.index,
                'forecast': forecast_pivot.sum(axis=1).values
            }).reset_index(drop=True)
            
            # Debug verification removed
            
            # Display summary metrics
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric(
                    label="Items Included", 
                    value=f"{len(successful_items)}/{len(selected_items)}"
                )
            
            with col2:
                last_actual = overall_historical['total_quantity'].iloc[-1] if not overall_historical.empty else 0
                avg_forecast = overall_forecast['forecast'].mean() if not overall_forecast.empty else 0
                change_pct = ((avg_forecast - last_actual) / last_actual * 100) if last_actual > 0 else 0
                st.metric(
                    label="Avg Daily Forecast",
                    value=f"{avg_forecast:.1f}",
                    delta=f"{change_pct:+.1f}%"
                )
            
            with col3:
                total_forecast = overall_forecast['forecast'].sum() if not overall_forecast.empty else 0
                st.metric(
                    label=f"Total {forecast_days}-Day Forecast",
                    value=f"{total_forecast:.0f}"
                )
            
            # Display included items
            if len(successful_items) < len(selected_items):
                excluded_items = [item for item in selected_items if item not in successful_items]
                # Excluded items notification removed
            
            # Included items notification removed
            
            # Create visualization
            fig = go.Figure()
            
            # Add historical data
            if not overall_historical.empty:
                fig.add_trace(go.Scatter(
                    x=overall_historical[date_col],
                    y=overall_historical['total_quantity'],
                    mode='lines',
                    name='Historical Overall Demand',
                    line=dict(color='blue', width=2)
                ))
            
            # Add forecast data
            if not overall_forecast.empty:
                fig.add_trace(go.Scatter(
                    x=overall_forecast[date_col],
                    y=overall_forecast['forecast'],
                    mode='lines+markers',
                    name='Overall Demand Forecast',
                    line=dict(color='red', width=3, dash='dash'),
                    marker=dict(size=6)
                ))
            
            fig.update_layout(
                title=f"Overall Demand Forecast - {model_type} ({len(successful_items)} Items Combined)",
                xaxis_title="Date",
                yaxis_title="Total Quantity",
                hovermode='x unified',
                showlegend=True,
                height=500
            )
            
            st.plotly_chart(fig, use_container_width=True)
            
            # Download option for overall forecast
            if not overall_forecast.empty:
                overall_forecast_csv = overall_forecast.to_csv(index=False)
                st.download_button(
                    label="Download Overall Forecast CSV",
                    data=overall_forecast_csv,
                    file_name=f"overall_demand_forecast_{model_type.lower().replace(' ', '_')}.csv",
                    mime="text/csv"
                )
                
    except Exception as e:
        st.error(f"Error generating overall demand forecast: {str(e)}")

def forecast_single_item(data_processor, server, database, username, password, connection_type,
                        table_name, date_col, item_col, qty_col, item, forecast_days, model_type):
    """Forecast demand for a single item (legacy function)"""
    
    try:
        with st.spinner(f"Loading data and generating forecast for {item}..."):
            # Query data for specific item with hierarchical filters
            def escape_sql_value(value):
                """Safely escape SQL string values by doubling single quotes"""
                return str(value).replace("'", "''")
            
            where_clauses = [f"[{item_col}] = '{escape_sql_value(item)}'"]
            
            # Add Step 1 & 2 filters - use EXACT same keys as column_selection_interface.py
            schema = st.session_state.get('schema') or st.session_state.get('selected_schema')
            table_name_only = st.session_state.get('table_name_only') or st.session_state.get('selected_table')
            planning_area_col_key = f"planning_area_{schema}_{table_name_only}"
            planning_area_col = st.session_state.get(planning_area_col_key, st.session_state.get('planning_area_col'))
            # Use EXACT same key pattern as column_selection_interface.py
            planning_area_str = str(planning_area_col) if planning_area_col else "none"
            planning_selections_key = f"selected_planning_areas_{schema}_{table_name_only}_{planning_area_str}"
            selected_planning_areas = st.session_state.get(planning_selections_key, [])
            if planning_area_col and planning_area_col != "None (No Filter)" and selected_planning_areas:
                # Filter out None values before processing
                valid_areas = [area for area in selected_planning_areas if area is not None and area != "None (No Filter)"]
                if valid_areas:
                    escaped_areas = [escape_sql_value(area) for area in valid_areas]
                    planning_filter = "', '".join(escaped_areas)
                    where_clauses.append(f"[{planning_area_col}] IN ('{planning_filter}')")
            
            # Add Scenario Name filter if selected - use EXACT same keys as column_selection_interface.py
            scenario_name_col_key = f"scenario_name_{schema}_{table_name_only}"
            scenario_name_col = st.session_state.get(scenario_name_col_key, st.session_state.get('scenario_name_col'))
            # Use EXACT same key pattern as column_selection_interface.py
            scenario_name_str = str(scenario_name_col) if scenario_name_col else "none"
            scenario_selections_key = f"selected_scenario_names_{schema}_{table_name_only}_{scenario_name_str}"
            selected_scenario_names = st.session_state.get(scenario_selections_key, [])
            if scenario_name_col and scenario_name_col != "None (No Filter)" and selected_scenario_names:
                # Filter out None values before processing
                valid_scenarios = [scenario for scenario in selected_scenario_names if scenario is not None and scenario != "None (No Filter)"]
                if valid_scenarios:
                    escaped_scenarios = [escape_sql_value(scenario) for scenario in valid_scenarios]
                    scenario_filter = "', '".join(escaped_scenarios)
                    where_clauses.append(f"[{scenario_name_col}] IN ('{scenario_filter}')")

            # Build the final WHERE clause
            where_clause = " AND ".join(where_clauses)
            
            # Build SELECT clause - include filter columns for display
            select_columns = [f"[{date_col}]", f"SUM([{qty_col}]) as total_quantity"]
            group_by_columns = [f"[{date_col}]"]
            
            # Add planning area column to SELECT and GROUP BY if it exists
            if planning_area_col:
                select_columns.append(f"[{planning_area_col}]")
                group_by_columns.append(f"[{planning_area_col}]")
                
            # Add scenario name column to SELECT and GROUP BY if it exists  
            if scenario_name_col:
                select_columns.append(f"[{scenario_name_col}]")
                group_by_columns.append(f"[{scenario_name_col}]")
            
            select_clause = ", ".join(select_columns)
            group_by_clause = ", ".join(group_by_columns)
            
            item_query = f"""
            SELECT {select_clause}
            FROM {table_name}
            WHERE {where_clause}
            GROUP BY {group_by_clause}
            ORDER BY [{date_col}]
            """
            
            # Store the query for debugging
            st.session_state['last_item_query'] = item_query
            
            item_df = data_processor.load_data_from_sql(
                server, database, username, password, item_query, connection_type
            )
            
            if item_df is None or item_df.empty:
                st.error(f"No data found for item: {item}")
                return
            
            if len(item_df) < 10:
                st.warning(f"Limited data: {len(item_df)} records")
            
            # Lazy import forecaster only when needed
            from forecast_simple import SimpleDemandForecaster
            forecaster = SimpleDemandForecaster()
            
            # Initialize default metrics
            metrics = {'MAE': 0, 'RMSE': 0, 'MAPE': 0}
            
            # Prepare data
            sales_data = forecaster.prepare_sales_data(item_df, date_col, 'total_quantity')
            
            # Create lag features
            feature_data, feature_cols = forecaster.create_lag_features(sales_data, 'total_quantity')
            
            # Train selected model
            if model_type == "Random Forest":
                metrics = forecaster.train_random_forest(feature_data, 'total_quantity', feature_cols, forecast_days)
            elif model_type == "ARIMA":
                metrics = forecaster.train_arima(feature_data, 'total_quantity', forecast_days)
            elif model_type == "Prophet":
                metrics = forecaster.train_prophet(feature_data, date_col, 'total_quantity', forecast_days)
            
            # Generate forecast with better error handling
            try:
                # Use item-specific last date instead of global date
                forecast_result = forecaster.forecast_demand(feature_data, date_col, 'total_quantity', feature_cols, forecast_days, None)
                
                if not forecast_result or 'values' not in forecast_result or len(forecast_result['values']) == 0:
                    st.error(f"Failed to generate forecast for {item}. The model could not produce valid predictions.")
                    return
                    
            except Exception as forecast_error:
                st.error(f"Forecast failed: {str(forecast_error)}")
                st.info("Try: Different model, more data, or different items")
                return
            
            # Display results
            display_item_forecast_results(sales_data, forecast_result, metrics, model_type, date_col, 'total_quantity', item)
            
    except ImportError as e:
        st.error(f"Missing package for {model_type}. Try Random Forest.")
    except Exception as e:
        st.error(f"Error: {str(e)}")
        st.info("Try: Different model or different items")

def forecast_single_item_with_cache(data_processor, server, database, username, password, connection_type,
                                   table_name, date_col, item_col, qty_col, item, forecast_days, model_type,
                                   schema, table_name_only, use_cached):
    """Forecast demand for a single item with intelligent caching"""
    
    try:
        from datetime import datetime
        from forecast_simple import SimpleDemandForecaster
        from utils.model_cache import get_model_cache
        
        model_cache = get_model_cache()
        
        # Get hierarchical filters for cache key (need to get them early before the data loading logic)
        cache_planning_areas, cache_scenario_names = get_hierarchy_filters(schema, table_name_only)
        
        # Get cache key for this specific item
        cache_key = model_cache.get_cache_key(
            schema, table_name_only, date_col, item_col, qty_col,
            model_type, forecast_days, item,
            planning_areas=cache_planning_areas,
            scenario_names=cache_scenario_names
        )
        
        # Load data
        with st.spinner(f"Loading data for {item}..."):
            # Build WHERE clause with filters using safe escaping (consistent with Overall tab)
            def escape_sql_value(value):
                """Safely escape SQL string values by doubling single quotes"""
                return str(value).replace("'", "''")
            
            where_clauses = [f"[{item_col}] = '{escape_sql_value(item)}'"]
            
            # Add Planning Area filter if selected - use EXACT same keys as column_selection_interface.py
            schema = st.session_state.get('schema')
            table_name_only = st.session_state.get('table_name_only')
            planning_area_col_key = f"planning_area_{schema}_{table_name_only}"
            planning_area_col = st.session_state.get(planning_area_col_key, st.session_state.get('planning_area_col'))
            # Use EXACT same key pattern as column_selection_interface.py
            planning_area_str = str(planning_area_col) if planning_area_col else "none"
            planning_selections_key = f"selected_planning_areas_{schema}_{table_name_only}_{planning_area_str}"
            selected_planning_areas = st.session_state.get(planning_selections_key, [])
            if planning_area_col and planning_area_col != "None (No Filter)" and selected_planning_areas:
                # Filter out None values before processing
                valid_areas = [area for area in selected_planning_areas if area is not None and area != "None (No Filter)"]
                if valid_areas:
                    escaped_areas = [escape_sql_value(area) for area in valid_areas]
                    planning_filter = "', '".join(escaped_areas)
                    where_clauses.append(f"[{planning_area_col}] IN ('{planning_filter}')")
            
            # Add Scenario Name filter if selected - use EXACT same keys as column_selection_interface.py
            scenario_name_col_key = f"scenario_name_{schema}_{table_name_only}"
            scenario_name_col = st.session_state.get(scenario_name_col_key, st.session_state.get('scenario_name_col'))
            # Use EXACT same key pattern as column_selection_interface.py
            scenario_name_str = str(scenario_name_col) if scenario_name_col else "none"
            scenario_selections_key = f"selected_scenario_names_{schema}_{table_name_only}_{scenario_name_str}"
            selected_scenario_names = st.session_state.get(scenario_selections_key, [])
            if scenario_name_col and scenario_name_col != "None (No Filter)" and selected_scenario_names:
                # Filter out None values before processing
                valid_scenarios = [scenario for scenario in selected_scenario_names if scenario is not None and scenario != "None (No Filter)"]
                if valid_scenarios:
                    escaped_scenarios = [escape_sql_value(scenario) for scenario in valid_scenarios]
                    scenario_filter = "', '".join(escaped_scenarios)
                    where_clauses.append(f"[{scenario_name_col}] IN ('{scenario_filter}')")
            
            where_clause = " AND ".join(where_clauses)
            
            # Build SELECT clause with filter columns for debugging
            select_columns = [date_col, f"SUM({qty_col}) as total_quantity"]
            group_by_columns = [date_col]
            
            # Add planning area column if it exists and is not "None"
            if planning_area_col:
                select_columns.append(planning_area_col)
                group_by_columns.append(planning_area_col)
            
            # Add scenario name column if it exists and is not "None"  
            if scenario_name_col:
                select_columns.append(scenario_name_col)
                group_by_columns.append(scenario_name_col)
            
            select_clause = ", ".join(select_columns)
            group_by_clause = ", ".join(group_by_columns)
            
            item_query = f"""
            SELECT {select_clause}
            FROM {table_name}
            WHERE {where_clause}
            GROUP BY {group_by_clause}
            ORDER BY {date_col}
            """
            
            # Store query for debugging
            st.session_state['last_item_query'] = item_query
            
            item_df = data_processor.load_data_from_sql(
                server, database, username, password, item_query, connection_type
            )
            
            if item_df is None or item_df.empty:
                st.error(f"No data found for item: {item}")
                return
            
            if len(item_df) < 10:
                st.warning(f"Limited data: {len(item_df)} records")
        
        # Check if using cached model (ensure schema and table_name_only are not None)
        # Cache existence check (debug info removed)
        
        if (use_cached and schema is not None and table_name_only is not None and 
            model_cache.exists(schema, table_name_only, date_col, item_col, qty_col,
                              model_type, forecast_days, item,
                              planning_areas=cache_planning_areas,
                              scenario_names=cache_scenario_names)):
            # Using cached model
            
            # Load cached model and metadata
            cached_model, metadata = model_cache.load_model(cache_key)
            
            if cached_model is None:
                st.error(f"Failed to load cached model for {item}")
                return
            
            # Create new forecaster and set up the cached model
            forecaster = SimpleDemandForecaster()
            
            # Set the cached model and model type  
            if model_type == "Random Forest":
                # Random Forest models are saved as dict with model and scaler
                if isinstance(cached_model, dict) and 'model' in cached_model and 'scaler' in cached_model:
                    forecaster.model = cached_model['model']
                    forecaster.scaler = cached_model['scaler']
                else:
                    # Fallback for older cache format
                    forecaster.model = cached_model
                    forecaster.scaler = getattr(cached_model, 'scaler', None)
            else:
                # ARIMA and Prophet models are saved directly
                forecaster.model = cached_model
            
            forecaster.model_type = model_type
            
            # Use cached metadata
            if metadata is not None:
                metrics = {
                    'MAE': metadata.get('mae', 0),
                    'RMSE': metadata.get('rmse', 0),
                    'MAPE': metadata.get('mape', 0)
                }
                feature_cols = metadata.get('feature_cols', [])
            else:
                metrics = {'MAE': 0, 'RMSE': 0, 'MAPE': 0}
                feature_cols = []
            
            # Generate forecast with cached model  
            with st.spinner(f"Generating forecast for {item}..."):
                try:
                    # Prepare data for forecasting
                    sales_data = forecaster.prepare_sales_data(item_df, date_col, 'total_quantity')
                    feature_data, _ = forecaster.create_lag_features(sales_data, 'total_quantity')
                    
                    # Use item-specific last date instead of global date
                    forecast_result = forecaster.forecast_demand(feature_data, date_col, 'total_quantity', feature_cols, forecast_days, None)
                    
                    if not forecast_result or 'values' not in forecast_result:
                        st.error(f"Failed to generate forecast for {item}.")
                        return
                        
                    # Forecast generated using cached model
                    
                except Exception as forecast_error:
                    st.error(f"Cached forecast failed: {str(forecast_error)}")
                    st.info("Try retraining the model")
                    return
        
        else:
            # Train new model
            # Training fresh model
            
            forecaster = SimpleDemandForecaster()
            
            # Initialize default metrics
            metrics = {'MAE': 0, 'RMSE': 0, 'MAPE': 0}
            
            with st.spinner(f"Training {model_type} model and generating forecast for {item}..."):
                # Prepare data
                sales_data = forecaster.prepare_sales_data(item_df, date_col, 'total_quantity')
                
                # Create lag features
                feature_data, feature_cols = forecaster.create_lag_features(sales_data, 'total_quantity')
                
                # Train selected model
                if model_type == "Random Forest":
                    metrics = forecaster.train_random_forest(feature_data, 'total_quantity', feature_cols, forecast_days)
                elif model_type == "ARIMA":
                    metrics = forecaster.train_arima(feature_data, 'total_quantity', forecast_days)
                elif model_type == "Prophet":
                    metrics = forecaster.train_prophet(feature_data, date_col, 'total_quantity', forecast_days)
                
                # Generate forecast
                try:
                    # Use item-specific last date instead of global date
                    forecast_result = forecaster.forecast_demand(feature_data, date_col, 'total_quantity', feature_cols, forecast_days, None)
                    
                    if not forecast_result or 'values' not in forecast_result:
                        st.error(f"Failed to generate forecast for {item}.")
                        return
                    
                    # Save to persistent cache
                    model_cache = get_model_cache()
                    
                    # Prepare metadata for persistent cache
                    metadata = {
                        'mae': metrics.get('MAE', 0),
                        'rmse': metrics.get('RMSE', 0), 
                        'mape': metrics.get('MAPE', 0),
                        'data_points': len(item_df),
                        'data_range_start': str(feature_data[date_col].min()),
                        'date_range_end': str(feature_data[date_col].max()),
                        'feature_cols': feature_cols,
                        'model_type': model_type,
                        'planning_areas': cache_planning_areas,
                        'scenario_names': cache_scenario_names
                    }
                    
                    # Save model to persistent cache
                    if model_type == "Random Forest":
                        # Save model and scaler together as a dict
                        model_data = {
                            'model': forecaster.model,
                            'scaler': forecaster.scaler
                        }
                        saved_key = model_cache.save_model(
                            schema, table_name_only, date_col, item_col, qty_col,
                            model_type, forecast_days, item, model_data, metadata,
                            planning_areas=cache_planning_areas,
                            scenario_names=cache_scenario_names
                        )
                    else:
                        # For ARIMA and Prophet, just save the model
                        saved_key = model_cache.save_model(
                            schema, table_name_only, date_col, item_col, qty_col,
                            model_type, forecast_days, item, forecaster.model, metadata,
                            planning_areas=cache_planning_areas,
                            scenario_names=cache_scenario_names
                        )
                    
                    # Model trained and cached for future use
                    
                except Exception as forecast_error:
                    st.error(f"Forecast failed: {str(forecast_error)}")
                    st.info("Try: Different model, more data, or different items")
                    return
        
        # Display results (same for both cached and fresh)
        display_item_forecast_results(sales_data if 'sales_data' in locals() else feature_data, 
                                    forecast_result, metrics, model_type, date_col, 'total_quantity', item)
        
        # Caching info (removed for clean interface)
            
    except ImportError as e:
        st.error(f"Missing package for {model_type}. Try Random Forest.")
    except Exception as e:
        st.error(f"Error: {str(e)}")
        st.info("Try: Different model or different items")

def display_item_forecast_results(historical_data, forecast_result, metrics, model_type, date_col, target_col, item_name):
    """Display forecast results for an item"""
    
    # Model performance metrics
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("MAE", f"{metrics['MAE']:.2f}")
    with col2:
        st.metric("RMSE", f"{metrics['RMSE']:.2f}")
    with col3:
        st.metric("MAPE", f"{metrics['MAPE']:.1f}%")
    
    # Create forecast visualization
    import plotly.graph_objects as go
    fig = go.Figure()
    
    # Historical data (show all filtered data, same as historical table)
    fig.add_trace(go.Scatter(
        x=historical_data[date_col],
        y=historical_data[target_col],
        mode='lines',
        name='Historical Demand',
        line=dict(color='blue', width=2)
    ))
    
    # Forecast
    fig.add_trace(go.Scatter(
        x=forecast_result['dates'],
        y=forecast_result['values'],
        mode='lines+markers',
        name='Forecast',
        line=dict(color='red', width=2, dash='dash')
    ))
    
    # Confidence intervals
    fig.add_trace(go.Scatter(
        x=list(forecast_result['dates']) + list(forecast_result['dates'][::-1]),
        y=list(forecast_result['upper_bound']) + list(forecast_result['lower_bound'][::-1]),
        fill='toself',
        fillcolor='rgba(255,0,0,0.2)',
        line=dict(color='rgba(255,255,255,0)'),
        hoverinfo="skip",
        showlegend=True,
        name='Confidence Interval'
    ))
    
    fig.update_layout(
        title=f'Demand Forecast for {item_name} - {model_type}',
        xaxis_title='Date',
        yaxis_title='Quantity',
        hovermode='x unified',
        height=500
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Key insights
    total_forecast = sum(forecast_result['values'])
    avg_daily = total_forecast / len(forecast_result['values'])
    historical_avg = historical_data[target_col].tail(30).mean()
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.metric("Total Forecasted Demand", f"{total_forecast:.0f}", 
                 f"{((total_forecast - historical_avg * len(forecast_result['values'])) / (historical_avg * len(forecast_result['values'])) * 100):+.1f}% vs historical")
    
    with col2:
        st.metric("Average Daily Demand", f"{avg_daily:.1f}", 
                 f"{((avg_daily - historical_avg) / historical_avg * 100):+.1f}% vs historical")
    
    
    # Forecast summary table
    import pandas as pd
    forecast_df = pd.DataFrame({
        'Date': forecast_result['dates'],
        'Predicted Demand': [round(x, 2) for x in forecast_result['values']],
        'Lower Bound': [round(x, 2) for x in forecast_result['lower_bound']],
        'Upper Bound': [round(x, 2) for x in forecast_result['upper_bound']]
    })
    
    with st.expander("📋 View Detailed Forecast Table"):
        st.dataframe(forecast_df)
        
        # Download forecast
        csv = forecast_df.to_csv(index=False)
        st.download_button(
            label=f"Download {item_name} Forecast CSV",
            data=csv,
            file_name=f'demand_forecast_{item_name}_{__import__("datetime").datetime.now().strftime("%Y%m%d")}.csv',
            mime='text/csv'
        )

if __name__ == "__main__":
    main()