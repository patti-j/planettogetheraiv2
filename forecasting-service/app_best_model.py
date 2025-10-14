import streamlit as st
import pandas as pd
import numpy as np
import time
import os
import plotly.graph_objects as go
from models.simple_models import SimpleForecastingModels
from utils.data_processing import DataProcessor
from utils.visualization import Visualizer

# Configure Streamlit page
st.set_page_config(
    page_title="Time Series Forecasting Dashboard",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

def main():
    st.title("📈 Time Series Forecasting Dashboard")
    st.markdown("Connect to your SQL Server database to load time series data and get advanced forecasts with the **best performing model automatically selected**")

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
        # Automatic column detection for univariate forecasting
        with st.sidebar:
            st.header("📊 Data Configuration")
            
            # Look for common date column names
            date_candidates = [col for col in df.columns if any(word in col.lower() for word in ['date', 'time', 'day', 'month', 'year'])]
            units_candidates = [col for col in df.columns if any(word in col.lower() for word in ['units_sold', 'units', 'sales', 'sold', 'quantity'])]
            
            # Auto-select if obvious choices exist
            default_date = date_candidates[0] if date_candidates else df.columns[0]
            default_target = units_candidates[0] if units_candidates else df.columns[1] if len(df.columns) > 1 else df.columns[0]
            
            date_col = st.selectbox("Date Column", df.columns, index=list(df.columns).index(default_date) if default_date in df.columns else None, placeholder="Choose date column...")
            target_col = st.selectbox("Target Column", df.columns, index=list(df.columns).index(default_target) if default_target in df.columns else None, placeholder="Choose target column...")
            
            st.info("📊 Time series forecasting with your SQL Server data")
            
            st.subheader("🎯 Forecast Configuration")
            forecast_interval = st.selectbox(
                "Forecast Interval", 
                ["Daily", "Weekly", "Monthly", "Quarterly"],
                index=None,
                placeholder="Choose forecast interval..."
            )
            
            forecast_steps = st.slider(
                "Number of forecast steps", 
                min_value=1, 
                max_value=90, 
                value=30
            )
            
            # Model selection
            st.subheader("🤖 Model Configuration")
            selected_models = st.multiselect(
                "Select Models to Train",
                ["ARIMA", "Prophet", "Random Forest", "NeuralProphet", "DeepAR"],
                default=["ARIMA", "Prophet", "Random Forest", "DeepAR"]
            )
            
            hyperparameter_tuning = st.checkbox("Enable Hyperparameter Tuning", value=True)
            
            if st.button("🚀 Train Models & Find Best", type="primary"):
                if date_col and target_col and selected_models and forecast_interval:
                    train_and_find_best(
                        df, date_col, target_col, 
                        forecast_interval, forecast_steps, selected_models,
                        hyperparameter_tuning
                    )
                else:
                    st.error("Please select required columns and at least one model")
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
        4. Load your data and start forecasting!
        
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

def train_and_find_best(df, date_col, target_col, forecast_interval, forecast_steps, selected_models, hyperparameter_tuning):
    
    # Initialize processors
    data_processor = DataProcessor()
    forecasting_models = SimpleForecastingModels()
    visualizer = Visualizer()
    
    # Process data with robust cleaning
    with st.spinner("Processing data..."):
        processed_data = df.copy()
        processed_data[date_col] = pd.to_datetime(processed_data[date_col])
        processed_data = processed_data.sort_values(date_col).reset_index(drop=True)
        
        # Clean target column - remove infinite values and fill missing values
        processed_data[target_col] = processed_data[target_col].replace([np.inf, -np.inf], np.nan)
        processed_data[target_col] = processed_data[target_col].fillna(method='ffill').fillna(method='bfill')
        
        # If still has NaN, fill with mean
        if processed_data[target_col].isna().any():
            mean_val = processed_data[target_col].mean()
            if not np.isfinite(mean_val):
                mean_val = processed_data[target_col].median()
            processed_data[target_col] = processed_data[target_col].fillna(mean_val)
        
        # Data normalization for better model performance
        from sklearn.preprocessing import MinMaxScaler, StandardScaler
        
        # Store original stats for inverse transform
        original_mean = processed_data[target_col].mean()
        original_std = processed_data[target_col].std()
        original_min = processed_data[target_col].min()
        original_max = processed_data[target_col].max()
        
        # Apply standardization to stabilize training
        scaler = StandardScaler()
        processed_data[f'{target_col}_scaled'] = scaler.fit_transform(processed_data[[target_col]]).flatten()
        
        # Create optimized features based on scaled data
        scaled_col = f'{target_col}_scaled'
        
        # Multiple lag features with different patterns
        for lag in [1, 2, 3, 7]:
            processed_data[f'lag_{lag}'] = processed_data[scaled_col].shift(lag)
            
        # Trend and momentum indicators
        processed_data['ma_3'] = processed_data[scaled_col].rolling(3, min_periods=1).mean()
        processed_data['ma_7'] = processed_data[scaled_col].rolling(7, min_periods=1).mean()
        processed_data['trend_3'] = processed_data[scaled_col] - processed_data['ma_3']
        processed_data['momentum'] = processed_data[scaled_col].diff()
        
        # Fill any remaining NaN values with forward fill then mean
        for col in ['lag_1', 'lag_2', 'lag_3', 'lag_7', 'ma_3', 'ma_7', 'trend_3', 'momentum']:
            processed_data[col] = processed_data[col].fillna(method='ffill').fillna(processed_data[scaled_col].mean())
        
        # Store scaling info for later use
        try:
            processed_data['_scaler_mean'] = float(scaler.mean_[0]) if hasattr(scaler, 'mean_') and scaler.mean_ is not None and len(scaler.mean_) > 0 else 0.0
            processed_data['_scaler_scale'] = float(scaler.scale_[0]) if hasattr(scaler, 'scale_') and scaler.scale_ is not None and len(scaler.scale_) > 0 else 1.0
        except (IndexError, TypeError, AttributeError):
            processed_data['_scaler_mean'] = 0.0
            processed_data['_scaler_scale'] = 1.0
        
        # Final validation - ensure no infinite or NaN values
        for col in processed_data.select_dtypes(include=[np.number]).columns:
            if not np.isfinite(processed_data[col]).all():
                processed_data[col] = processed_data[col].replace([np.inf, -np.inf], 0).fillna(0)

    st.success("✅ Data processed successfully")
    
    # Split data for univariate forecasting
    train_size = int(len(processed_data) * 0.8)
    train_data = processed_data[:train_size]
    test_data = processed_data[train_size:]
    # Optimized feature set for better performance  
    feature_cols = ['lag_1', 'lag_2', 'lag_3', 'lag_7', 'ma_3', 'ma_7', 'trend_3', 'momentum']
    
    # Train models and find the best one
    results = {}
    
    with st.spinner("Training models and finding the best performer..."):
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        for i, model_name in enumerate(selected_models):
            try:
                progress = (i) / len(selected_models)
                progress_bar.progress(progress)
                status_text.text(f"Training {model_name}... ({i+1}/{len(selected_models)})")
                
                start_time = time.time()
                
                # Train model
                if model_name == "Random Forest":
                    model, params = forecasting_models.train_random_forest(
                        train_data, target_col, feature_cols, hyperparameter_tuning
                    )
                elif model_name == "ARIMA":
                    model, params = forecasting_models.train_arima(
                        train_data, target_col, hyperparameter_tuning
                    )
                elif model_name == "Prophet":
                    model, params = forecasting_models.train_prophet(
                        train_data, date_col, target_col, feature_cols, hyperparameter_tuning
                    )
                elif model_name == "NeuralProphet":
                    model, params = forecasting_models.train_neuralprophet(
                        train_data, date_col, target_col, feature_cols, hyperparameter_tuning
                    )
                    if model is None and "error" in params:
                        st.error(f"Error training {model_name}: {params['error']}")
                        continue
                elif model_name == "DeepAR":
                    model, params = forecasting_models.train_deepar(
                        train_data, date_col, target_col, feature_cols, hyperparameter_tuning
                    )
                else:
                    st.error(f"Unsupported model type: {model_name}")
                    continue
                
                # Check if model training was successful
                if model is None:
                    st.error(f"Failed to train {model_name}")
                    continue
                
                # Store training context for DeepAR (only if it's a custom model that supports it)
                if model_name == "DeepAR" and model is not None:
                    try:
                        # Only try to set training_context if the model seems to support it
                        if hasattr(model, '__dict__'):
                            model.training_context = {
                                'last_sequence': train_data[target_col].tail(getattr(model, 'sequence_length', 30)).values,
                                'stats': {
                                    'mean': train_data[target_col].mean(),
                                    'std': train_data[target_col].std(),
                                    'min': train_data[target_col].min(),
                                    'max': train_data[target_col].max()
                                }
                            }
                    except (AttributeError, TypeError):
                        # Ignore if the model doesn't support this attribute
                        pass
                
                # Generate predictions
                test_result = forecasting_models.predict_with_intervals(
                    model, model_name, test_data, target_col, feature_cols, date_col, train_data=train_data
                )
                test_predictions = test_result['predictions']
                
                # Generate future forecasts
                future_forecasts = forecasting_models.forecast_future(
                    model, model_name, processed_data, forecast_steps, 
                    target_col, feature_cols, date_col, forecast_interval
                )
                
                # Calculate accuracy metrics
                accuracy_metrics = forecasting_models.calculate_accuracy_metrics(
                    test_data[target_col].values, test_predictions
                )
                
                training_time = time.time() - start_time
                
                results[model_name] = {
                    'model': model,
                    'params': params,
                    'test_predictions': test_predictions,
                    'test_confidence_intervals': {
                        'lower': test_result['lower_bound'],
                        'upper': test_result['upper_bound'],
                        'confidence_level': test_result['confidence_level']
                    },
                    'future_forecasts': future_forecasts,
                    'accuracy_metrics': accuracy_metrics,
                    'training_time': training_time
                }
                
                st.success(f"✅ {model_name} completed in {training_time:.1f}s")
                
            except Exception as e:
                st.error(f"❌ Error training {model_name}: {str(e)}")
        
        progress_bar.progress(1.0)
        status_text.text("✅ All models trained!")
    
    # Add ensemble model for superior performance
    if len(results) >= 2:
        with st.spinner("Creating ensemble model for superior performance..."):
            try:
                # Create ensemble predictions by combining best models
                ensemble_predictions = []
                ensemble_weights = []
                
                # Weight models by inverse RMSE (better models get higher weight)
                for model_name, result in results.items():
                    rmse = result['accuracy_metrics']['RMSE']
                    weight = 1.0 / (rmse + 0.001)  # Add small epsilon to avoid division by zero
                    ensemble_weights.append(weight)
                    ensemble_predictions.append(result['test_predictions'])
                
                # Normalize weights
                total_weight = sum(ensemble_weights)
                ensemble_weights = [w / total_weight for w in ensemble_weights]
                
                # Create weighted ensemble predictions
                ensemble_pred = np.zeros_like(ensemble_predictions[0])
                for pred, weight in zip(ensemble_predictions, ensemble_weights):
                    ensemble_pred += weight * pred
                
                # Calculate ensemble accuracy
                ensemble_metrics = forecasting_models.calculate_accuracy_metrics(
                    test_data[target_col].values, ensemble_pred
                )
                
                # Create ensemble future forecasts
                ensemble_future_values = np.zeros(forecast_steps)
                for model_name, result in results.items():
                    weight = 1.0 / (result['accuracy_metrics']['RMSE'] + 0.001)
                    weight = weight / sum([1.0 / (r['accuracy_metrics']['RMSE'] + 0.001) for r in results.values()])
                    ensemble_future_values += weight * result['future_forecasts']['values']
                
                # Add ensemble to results
                results['Ensemble'] = {
                    'model': 'ensemble',
                    'params': {'weights': dict(zip(results.keys(), ensemble_weights))},
                    'test_predictions': ensemble_pred,
                    'test_confidence_intervals': {
                        'lower': ensemble_pred - 1.96 * np.std(ensemble_pred),
                        'upper': ensemble_pred + 1.96 * np.std(ensemble_pred),
                        'confidence_level': 0.95
                    },
                    'future_forecasts': {
                        'dates': list(results.values())[0]['future_forecasts']['dates'],
                        'values': ensemble_future_values
                    },
                    'accuracy_metrics': ensemble_metrics,
                    'training_time': 0.1
                }
                
                st.success("✅ Ensemble model created successfully!")
            except Exception as e:
                st.warning(f"Ensemble creation failed: {str(e)}")
    
    # Display results for BEST MODEL ONLY (including ensemble)
    if results:
        display_best_model_results(processed_data, train_data, test_data, results, target_col, date_col)

def display_best_model_results(processed_data, train_data, test_data, results, target_col, date_col):
    st.header("🏆 Best Model Results")
    
    # Find the best model automatically based on RMSE
    best_model_name = min(results.keys(), key=lambda x: results[x]['accuracy_metrics']['RMSE'])
    best_result = results[best_model_name]
    
    # Show the winner
    st.success(f"🏆 **Winner: {best_model_name}** - Best performing model!")
    st.info(f"**RMSE: {best_result['accuracy_metrics']['RMSE']:.4f}** (Lower is better)")
    
    # Show brief comparison table
    st.subheader("📊 All Models Comparison")
    comparison_data = []
    for model_name, result in results.items():
        metrics = result['accuracy_metrics']
        is_winner = model_name == best_model_name
        comparison_data.append({
            'Model': f"🏆 {model_name}" if is_winner else model_name,
            'MAE': f"{metrics['MAE']:.3f}",
            'RMSE': f"{metrics['RMSE']:.3f}",
            'MAPE': f"{metrics['MAPE']:.3f}%"
        })
    
    comparison_df = pd.DataFrame(comparison_data)
    st.dataframe(comparison_df, width='stretch')
    
    # Show detailed results for BEST MODEL ONLY
    st.subheader(f"📈 {best_model_name} - Detailed Forecast Analysis")
    
    # Main forecast plot
    fig = go.Figure()
    
    # Training data
    fig.add_trace(go.Scatter(
        x=train_data[date_col],
        y=train_data[target_col],
        mode='lines',
        name='Training Data',
        line=dict(color='blue', width=2)
    ))
    
    # Actual test data
    fig.add_trace(go.Scatter(
        x=test_data[date_col],
        y=test_data[target_col],
        mode='lines',
        name='Actual Test Data',
        line=dict(color='green', width=2)
    ))
    
    # Best model predictions
    fig.add_trace(go.Scatter(
        x=test_data[date_col],
        y=best_result['test_predictions'],
        mode='lines',
        name=f'{best_model_name} Predictions',
        line=dict(color='red', width=2, dash='dash')
    ))
    
    # Future forecasts
    fig.add_trace(go.Scatter(
        x=best_result['future_forecasts']['dates'],
        y=best_result['future_forecasts']['values'],
        mode='lines+markers',
        name=f'{best_model_name} Future Forecast',
        line=dict(color='orange', width=3),
        marker=dict(size=6)
    ))
    
    fig.update_layout(
        title=f'{best_model_name} - Complete Forecast Analysis',
        xaxis_title='Date',
        yaxis_title=target_col,
        height=600,
        hovermode='x unified',
        # Enable zooming and panning controls
        xaxis=dict(
            rangeslider=dict(visible=True),
            type="date",
            rangeselector=dict(
                buttons=list([
                    dict(count=7, label="7D", step="day", stepmode="backward"),
                    dict(count=30, label="30D", step="day", stepmode="backward"), 
                    dict(count=90, label="3M", step="day", stepmode="backward"),
                    dict(step="all")
                ])
            )
        ),
        dragmode='zoom'  # Enable zoom by default
    )
    
    # Add interaction controls above the chart
    col_control1, col_control2, col_control3 = st.columns([1, 1, 2])
    
    with col_control1:
        if st.button("🔍 Zoom Mode", key="zoom_main"):
            fig.update_layout(dragmode='zoom')
            st.rerun()
    
    with col_control2:
        if st.button("👋 Pan Mode", key="pan_main"):
            fig.update_layout(dragmode='pan')
            st.rerun()
    
    with col_control3:
        st.write("**Controls:** Use buttons to switch modes • Double-click chart to reset zoom")
    
    st.plotly_chart(fig, width='stretch')
    
    # Performance metrics
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Mean Absolute Error", f"{best_result['accuracy_metrics']['MAE']:.3f}")
    
    with col2:
        st.metric("Root Mean Square Error", f"{best_result['accuracy_metrics']['RMSE']:.3f}")
    
    with col3:
        st.metric("Mean Absolute Percentage Error", f"{best_result['accuracy_metrics']['MAPE']:.3f}%")
    
    # Add detailed comparison table with interactive model plots
    st.subheader("📊 Detailed Model Performance Comparison")
    st.info("👆 Click on any model name below to see its individual forecast plot in a popup!")
    
    detailed_comparison = []
    for model_name, result in results.items():
        metrics = result['accuracy_metrics']
        is_winner = model_name == best_model_name
        detailed_comparison.append({
            'Model': f"🏆 {model_name}" if is_winner else model_name,
            'MAE': f"{metrics['MAE']:.3f}",
            'RMSE': f"{metrics['RMSE']:.3f}",
            'MAPE': f"{metrics['MAPE']:.3f}%",
            'Training Time (s)': f"{result['training_time']:.1f}s"
        })
    
    detailed_df = pd.DataFrame(detailed_comparison)
    
    # Display performance comparison table
    st.dataframe(detailed_df, width='stretch')
    
    # Display expandable sections for each model (no page reload)
    st.subheader("🔍 Individual Model Analysis")
    st.info("👇 Click on any model below to expand and see its individual forecast plot!")
    
    for model_name in results.keys():
        clean_name = model_name.replace("🏆 ", "") if "🏆" in model_name else model_name
        result = results[clean_name]
        is_winner = model_name == best_model_name
        
        # Create expandable section for each model  
        with st.expander(f"📈 {clean_name} - View Individual Forecast Plot", expanded=is_winner):
            # Get model data from function parameters and result
            predictions = result['test_predictions']
            forecasts = result['future_forecasts']['values']
            forecast_dates = result['future_forecasts']['dates']
            
            # Create individual model plot
            fig_individual = go.Figure()
            
            # Training data
            fig_individual.add_trace(go.Scatter(
                x=train_data[date_col],
                y=train_data[target_col],
                mode='lines+markers',
                name='Training Data',
                line=dict(color='blue', width=2),
                marker=dict(size=4)
            ))
            
            # Actual test data
            fig_individual.add_trace(go.Scatter(
                x=test_data[date_col],
                y=test_data[target_col],
                mode='lines+markers',
                name='Actual (Test)', 
                line=dict(color='green', width=2),
                marker=dict(size=4)
            ))
            
            # Model predictions on test data
            fig_individual.add_trace(go.Scatter(
                x=test_data[date_col],
                y=predictions,
                mode='lines+markers',
                name=f'{clean_name} Predictions',
                line=dict(color='red', width=2, dash='dash'),
                marker=dict(size=4)
            ))
            
            # Future forecasts
            fig_individual.add_trace(go.Scatter(
                x=forecast_dates,
                y=forecasts,
                mode='lines+markers',
                name=f'{clean_name} Forecast',
                line=dict(color='orange', width=3),
                marker=dict(size=6)
            ))
            
            fig_individual.update_layout(
                title=f'{clean_name} - Complete Forecast Analysis',
                xaxis_title='Date',
                yaxis_title=target_col,
                height=500,
                hovermode='x unified',
                # Enable zooming and panning controls
                xaxis=dict(
                    rangeslider=dict(visible=True),
                    type="date",
                    rangeselector=dict(
                        buttons=list([
                            dict(count=7, label="7D", step="day", stepmode="backward"),
                            dict(count=30, label="30D", step="day", stepmode="backward"), 
                            dict(count=90, label="3M", step="day", stepmode="backward"),
                            dict(step="all")
                        ])
                    )
                ),
                dragmode='zoom'
            )
            
            # Add interaction controls for individual plots (unique keys)
            col_ind1, col_ind2, col_ind3 = st.columns([1, 1, 2])
            
            with col_ind1:
                # Using hash to ensure unique keys
                zoom_key = f"zoom_{clean_name}_{hash(clean_name) % 10000}"
                if st.button("🔍 Zoom", key=zoom_key):
                    fig_individual.update_layout(dragmode='zoom')
            
            with col_ind2:
                pan_key = f"pan_{clean_name}_{hash(clean_name) % 10000}"
                if st.button("👋 Pan", key=pan_key):
                    fig_individual.update_layout(dragmode='pan')
            
            with col_ind3:
                st.write("**Interactive:** Switch modes • Double-click to reset zoom")
            
            st.plotly_chart(fig_individual, width='stretch')
            
            # Show individual model metrics
            model_metrics = result['accuracy_metrics']
            col_a, col_b, col_c = st.columns(3)
            
            with col_a:
                st.metric(f"{clean_name} MAE", f"{model_metrics['MAE']:.3f}")
            
            with col_b:
                st.metric(f"{clean_name} RMSE", f"{model_metrics['RMSE']:.3f}")
            
            with col_c:
                st.metric(f"{clean_name} MAPE", f"{model_metrics['MAPE']:.3f}%")
    
    # Show why this model won with explanation of metrics
    st.info(f"🏆 **{best_model_name} won** because it achieved the lowest RMSE ({best_result['accuracy_metrics']['RMSE']:.3f}), indicating the best overall prediction accuracy.")
    
    st.subheader("📚 Understanding the Metrics")
    col_info1, col_info2, col_info3 = st.columns(3)
    
    with col_info1:
        st.write("**MAE (Mean Absolute Error)**")
        st.write("• Average absolute difference")
        st.write("• Easy to interpret")
        st.write("• Less sensitive to outliers")
    
    with col_info2:
        st.write("**RMSE (Root Mean Square Error)**")
        st.write("• **🏆 BEST for model selection**")
        st.write("• Penalizes large errors more")
        st.write("• More sensitive to outliers")
        st.write("• Standard metric for forecasting")
    
    with col_info3:
        st.write("**MAPE (Mean Absolute Percentage Error)**")
        st.write("• Percentage-based error")
        st.write("• Good for comparing different scales")
        st.write("• Can be misleading with small values")
    
    st.success("💡 **RMSE is the best metric** for selecting forecasting models because it heavily penalizes large prediction errors, which is crucial for time series accuracy!")

if __name__ == "__main__":
    main()