import streamlit as st
import pandas as pd
import numpy as np
import os
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
from utils.data_processing import DataProcessor
from forecast_simple import SimpleDemandForecaster

# Configure Streamlit page
st.set_page_config(
    page_title="Database Connection Tester",
    page_icon="🗄️",
    layout="wide",
    initial_sidebar_state="expanded"
)

def main():
    st.title("📈 Sales Demand Forecasting")
    st.markdown("Connect to your cloud SQL Server database to load sales data and forecast future demand")

    # Sidebar for SQL Server connection
    with st.sidebar:
        st.header("🗄️ SQL Server Connection")
        
        # Check for environment variables first
        env_server = os.getenv('SQL_SERVER')
        env_database = os.getenv('SQL_DATABASE')
        env_username = os.getenv('SQL_USERNAME')
        env_password = os.getenv('SQL_PASSWORD')
        
        if env_server and env_database and env_username and env_password:
            st.success("✅ Using environment variables for database connection")
            use_env = st.checkbox("Use environment variables", value=True)
            if use_env:
                server = env_server
                database = env_database
                username = env_username
                password = env_password
                
                # Show masked values
                st.text_input("Server", value=server, disabled=True)
                st.text_input("Database", value=database, disabled=True)
                st.text_input("Username", value=username, disabled=True)
                st.text_input("Password", value="••••••••", disabled=True, type="password")
            else:
                # Manual input
                server = st.text_input("Server", placeholder="your-server.database.windows.net")
                database = st.text_input("Database", placeholder="your-database")
                username = st.text_input("Username", placeholder="your-username")
                password = st.text_input("Password", type="password", placeholder="your-password")
        else:
            # Manual input if no environment variables
            if not any([env_server, env_database, env_username, env_password]):
                st.info("💡 Tip: Set environment variables SQL_SERVER, SQL_DATABASE, SQL_USERNAME, SQL_PASSWORD for secure credential storage")
            
            server = st.text_input("Server", value=env_server or "", placeholder="your-server.database.windows.net")
            database = st.text_input("Database", value=env_database or "", placeholder="your-database")
            username = st.text_input("Username", value=env_username or "", placeholder="your-username")
            password = st.text_input("Password", type="password", placeholder="your-password")
        
        connection_type = st.selectbox(
            "Connection Type", 
            ["sqlalchemy", "pyodbc"],
            index=None,
            help="SQLAlchemy is recommended for most cases",
            placeholder="Choose connection type..."
        )
        
        # Test connection button
        test_connection = st.button("🔍 Test Connection")
        
        # Query input
        st.subheader("📝 Data Query")
        query_option = st.radio(
            "Query Method",
            ["Select Table", "Custom Query"]
        )
        
        df = None
        data_processor = DataProcessor()
        
        if test_connection and server and database and username and password and connection_type:
            with st.spinner("Testing connection..."):
                connection_result = data_processor.test_sql_connection(
                    server, database, username, password, connection_type
                )
                if connection_result and len(connection_result) == 2:
                    success, message = connection_result
                else:
                    success, message = False, "Invalid connection response"
                if success:
                    st.success(message)
                    
                    # Get tables list
                    tables = data_processor.get_table_list(server, database, username, password, connection_type)
                    if tables:
                        st.success(f"Found {len(tables)} tables in database")
                    else:
                        st.warning("No tables found or unable to retrieve table list")
                else:
                    st.error(message)
        
        if query_option == "Select Table" and server and database and username and password and connection_type:
            # Get list of tables
            tables = data_processor.get_table_list(server, database, username, password, connection_type)
            if tables:
                table_options = [f"{schema}.{table}" for schema, table in tables]
                selected_table = st.selectbox("Select Table", table_options, index=None, placeholder="Choose a table...")
                
                if selected_table:
                    schema, table = selected_table.split('.', 1)
                    
                    # Show table preview
                    if st.button("👁️ Preview Table"):
                        with st.spinner("Loading table preview..."):
                            preview_df = data_processor.get_table_preview(
                                server, database, username, password, schema, table, connection_type
                            )
                            if preview_df is not None:
                                st.dataframe(preview_df.head(10))
                    
                    # Load full table
                    if st.button("📊 Load Table Data"):
                        with st.spinner("Loading table data..."):
                            query = f"SELECT * FROM [{schema}].[{table}]"
                            df = data_processor.load_data_from_sql(
                                server, database, username, password, query, connection_type
                            )
        
        elif query_option == "Custom Query":
            custom_query = st.text_area(
                "SQL Query",
                placeholder="SELECT date_column, target_column FROM your_table WHERE ...",
                height=100
            )
            
            if st.button("🚀 Execute Query") and custom_query.strip():
                if server and database and username and password and connection_type:
                    with st.spinner("Executing query..."):
                        df = data_processor.load_data_from_sql(
                            server, database, username, password, custom_query, connection_type
                        )
                else:
                    st.error("Please fill in all connection fields")

    if df is not None:
        # Display data information
        st.header("📊 Data Summary")
        
        # Basic info
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Rows", len(df))
        with col2:
            st.metric("Total Columns", len(df.columns))
        with col3:
            st.metric("Memory Usage", f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB")
        
        # Show data preview
        st.subheader("🔍 Data Preview")
        st.dataframe(df.head(20))
        
        # Column information
        st.subheader("📋 Column Information")
        column_info = []
        for col in df.columns:
            column_info.append({
                'Column': col,
                'Type': str(df[col].dtype),
                'Non-Null Count': df[col].count(),
                'Null Count': df[col].isnull().sum(),
                'Unique Values': df[col].nunique()
            })
        
        column_df = pd.DataFrame(column_info)
        st.dataframe(column_df)
        
        # Data download
        st.subheader("💾 Download Data")
        csv = df.to_csv(index=False)
        st.download_button(
            label="Download as CSV",
            data=csv,
            file_name='database_data.csv',
            mime='text/csv'
        )
        
        st.success("✅ Database connection and data loading successful!")
        
        # ADD FORECASTING SECTION
        st.header("🔮 Demand Forecasting")
        
        # Column selection for forecasting
        col1, col2 = st.columns(2)
        
        with col1:
            # Date column selection
            date_candidates = [col for col in df.columns if any(word in col.lower() for word in ['date', 'time', 'day', 'month', 'year', 'created', 'order'])]
            default_date = date_candidates[0] if date_candidates else df.columns[0]
            date_col = st.selectbox("📅 Select Date Column", df.columns, index=list(df.columns).index(default_date))
        
        with col2:
            # Target column selection (sales/demand)
            numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
            sales_candidates = [col for col in numeric_columns if any(word in col.lower() for word in ['quantity', 'amount', 'sales', 'sold', 'units', 'demand', 'volume'])]
            default_target = sales_candidates[0] if sales_candidates else numeric_columns[0] if numeric_columns else df.columns[1]
            target_col = st.selectbox("🎯 Select Sales/Demand Column", numeric_columns, index=numeric_columns.index(default_target) if default_target in numeric_columns else 0)
        
        # Forecasting parameters
        col3, col4 = st.columns(2)
        with col3:
            forecast_days = st.slider("📊 Forecast Period (days)", min_value=7, max_value=90, value=30)
        with col4:
            model_type = st.selectbox("🤖 Forecasting Model", ["Random Forest", "ARIMA", "Prophet"])
        
        # Generate forecast button
        if st.button("🚀 Generate Demand Forecast", type="primary"):
            if date_col and target_col:
                generate_demand_forecast(df, date_col, target_col, forecast_days, model_type)
            else:
                st.error("Please select both date and target columns")
        
    else:
        # Show SQL Server connection guide
        st.info("👆 Connect to your SQL Server database to begin")
        st.subheader("📋 SQL Server Connection Guide")
        st.markdown("""
        **Connection Steps:**
        1. Enter your SQL Server connection details in the sidebar
        2. Click "Test Connection" to verify connectivity  
        3. Choose to either:
           - **Select Table**: Browse and select from available tables
           - **Custom Query**: Write your own SQL query
        4. Load your data and verify it looks correct!
        
        **Expected Data Format:**
        - Date/Time column (properly formatted dates)
        - Target column (numeric values to forecast)
        - Optional: Additional feature columns
        """)
        
        # Show example query
        st.subheader("💡 Example Query")
        st.code("""
        SELECT 
            order_date as date,
            SUM(quantity_sold) as units_sold
        FROM sales_table 
        WHERE order_date >= '2023-01-01'
        GROUP BY order_date
        ORDER BY order_date
        """, language="sql")

def generate_demand_forecast(df, date_col, target_col, forecast_days, model_type):
    """Generate and display demand forecast"""
    
    try:
        with st.spinner(f"Training {model_type} model and generating forecast..."):
            # Initialize forecaster
            forecaster = SimpleDemandForecaster()
            
            # Prepare data
            sales_data = forecaster.prepare_sales_data(df, date_col, target_col)
            
            # Create lag features
            feature_data, feature_cols = forecaster.create_lag_features(sales_data, target_col)
            
            # Train selected model
            if model_type == "Random Forest":
                metrics = forecaster.train_random_forest(feature_data, target_col, feature_cols, forecast_days)
            elif model_type == "ARIMA":
                metrics = forecaster.train_arima(feature_data, target_col, forecast_days)
            elif model_type == "Prophet":
                metrics = forecaster.train_prophet(feature_data, date_col, target_col, forecast_days)
            
            # Generate forecast
            forecast_result = forecaster.forecast_demand(feature_data, date_col, target_col, feature_cols, forecast_days)
            
            # Display results
            display_forecast_results(sales_data, forecast_result, metrics, model_type, date_col, target_col)
            
    except ImportError as e:
        st.error(f"Missing required package for {model_type}: {str(e)}")
        st.info("Try using Random Forest model, which requires only basic libraries.")
    except Exception as e:
        st.error(f"Error generating forecast: {str(e)}")
        st.info("Please check your data format and try again.")

def display_forecast_results(historical_data, forecast_result, metrics, model_type, date_col, target_col):
    """Display forecast results with visualizations"""
    
    # Model performance metrics
    st.subheader(f"📊 {model_type} Model Performance")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("MAE (Mean Absolute Error)", f"{metrics['MAE']:.2f}")
    with col2:
        st.metric("RMSE (Root Mean Squared Error)", f"{metrics['RMSE']:.2f}")
    with col3:
        st.metric("MAPE (Mean Absolute Percentage Error)", f"{metrics['MAPE']:.1f}%")
    
    # Create forecast visualization
    st.subheader("📈 Demand Forecast Visualization")
    
    fig = go.Figure()
    
    # Historical data (last 60 days for better visualization)
    recent_data = historical_data.tail(60)
    fig.add_trace(go.Scatter(
        x=recent_data[date_col],
        y=recent_data[target_col],
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
        title=f'Sales Demand Forecast - {model_type}',
        xaxis_title='Date',
        yaxis_title='Demand',
        hovermode='x unified',
        height=500
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Forecast summary table
    st.subheader("📋 Forecast Summary")
    
    forecast_df = pd.DataFrame({
        'Date': forecast_result['dates'],
        'Predicted Demand': [round(x, 2) for x in forecast_result['values']],
        'Lower Bound': [round(x, 2) for x in forecast_result['lower_bound']],
        'Upper Bound': [round(x, 2) for x in forecast_result['upper_bound']]
    })
    
    st.dataframe(forecast_df)
    
    # Key insights
    st.subheader("💡 Key Insights")
    
    total_forecast = sum(forecast_result['values'])
    avg_daily = total_forecast / len(forecast_result['values'])
    historical_avg = historical_data[target_col].tail(30).mean()
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.metric("Total Forecasted Demand", f"{total_forecast:.0f}", f"{((total_forecast - historical_avg * len(forecast_result['values'])) / (historical_avg * len(forecast_result['values'])) * 100):+.1f}% vs historical")
    
    with col2:
        st.metric("Average Daily Demand", f"{avg_daily:.1f}", f"{((avg_daily - historical_avg) / historical_avg * 100):+.1f}% vs historical")
    
    # Download forecast
    st.subheader("💾 Download Forecast")
    csv = forecast_df.to_csv(index=False)
    st.download_button(
        label="Download Forecast as CSV",
        data=csv,
        file_name=f'demand_forecast_{datetime.now().strftime("%Y%m%d")}.csv',
        mime='text/csv'
    )

if __name__ == "__main__":
    main()