import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import warnings
import time
warnings.filterwarnings('ignore')

from models.simple_models import SimpleForecastingModels
from utils.data_processing import DataProcessor
from utils.visualization import Visualizer

def main():
    st.set_page_config(
        page_title="Time Series Forecasting Dashboard",
        page_icon="📈",
        layout="wide"
    )
    
    st.title("🔮 Time Series Forecasting Dashboard")
    st.markdown("Upload your sales data and generate accurate forecasts using multiple algorithms")
    
    # Sidebar for model configuration
    with st.sidebar:
        st.header("⚙️ Configuration")
        
        # File upload
        uploaded_file = st.file_uploader(
            "Upload CSV file", 
            type=['csv'],
            help="Upload a CSV file with time series data"
        )
        
        if uploaded_file is not None:
            # Load and process data
            data_processor = DataProcessor()
            df = data_processor.load_data(uploaded_file)
            
            if df is not None:
                st.success(f"✅ Data loaded: {len(df)} rows")
                
                # Data configuration
                st.subheader("📊 Data Configuration")
                
                # Date column selection
                date_columns = df.select_dtypes(include=['datetime64', 'object']).columns.tolist()
                date_col = st.selectbox("Select Date Column", date_columns, index=None, placeholder="Choose date column...")
                
                # Target variable selection (auto-detect units_sold or let user select)
                numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
                
                if 'units_sold' in df.columns:
                    target_col = 'units_sold'
                    st.info(f"🎯 **Target:** {target_col} (auto-detected)")
                else:
                    target_col = st.selectbox("Select Target Variable (units sold)", numeric_columns, index=None, placeholder="Choose target column...")
                
                # For pure time series forecasting, no additional features needed
                feature_cols = []
                st.info("📈 **Mode:** Pure time series (date + target only)")
                
                # Forecasting configuration
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
                    default=["ARIMA", "Prophet", "Random Forest", "NeuralProphet", "DeepAR"]
                )
                
                hyperparameter_tuning = st.checkbox("Enable Hyperparameter Tuning", value=True)
                
                if st.button("🚀 Train Models & Forecast", type="primary"):
                    if date_col and target_col and selected_models and forecast_interval:
                        train_and_forecast(
                            df, date_col, target_col, [],  # Empty feature_cols for univariate
                            forecast_interval, forecast_steps, selected_models,
                            hyperparameter_tuning
                        )
                    else:
                        st.error("Please select required columns and at least one model")
            else:
                st.error("❌ Failed to load data. Please check your CSV format.")
        else:
            # Show sample data format
            st.info("👆 Please upload a CSV file to begin")
            st.subheader("📋 Expected CSV Format")
            sample_data = {
                'date': ['2025-01-01', '2025-01-02', '2025-01-03'],
                'units_sold': [67, 48, 44]
            }
            st.dataframe(pd.DataFrame(sample_data))

def train_and_forecast(df, date_col, target_col, feature_cols, 
                      forecast_interval, forecast_steps, selected_models, 
                      hyperparameter_tuning):
    
    # Initialize processors
    data_processor = DataProcessor()
    forecasting_models = SimpleForecastingModels()
    visualizer = Visualizer()
    
    # Process data
    with st.spinner("Processing data..."):
        # Simple data processing for univariate time series
        processed_data = df.copy()
        
        # Convert date column to datetime and sort
        processed_data[date_col] = pd.to_datetime(processed_data[date_col])
        processed_data = processed_data.sort_values(date_col).reset_index(drop=True)
        
        # Handle missing values in target column
        processed_data[target_col] = processed_data[target_col].fillna(method='ffill').fillna(method='bfill')
        
        # Add trend-helping features for better model performance
        processed_data[f'{target_col}_ma_7'] = processed_data[target_col].rolling(window=7, min_periods=1).mean()
        processed_data[f'{target_col}_ma_14'] = processed_data[target_col].rolling(window=14, min_periods=1).mean()
        processed_data[f'{target_col}_trend'] = processed_data[target_col] - processed_data[f'{target_col}_ma_7']
        processed_data[f'{target_col}_pct_change'] = processed_data[target_col].pct_change(periods=7).fillna(0) * 100
        
        # Keep essential columns plus trend features
        trend_features = [f'{target_col}_ma_7', f'{target_col}_ma_14', f'{target_col}_trend', f'{target_col}_pct_change']
        essential_cols = [date_col, target_col] + trend_features
        processed_data = processed_data[essential_cols]
        
        if processed_data is None:
            st.error("Failed to process data")
            return
    
    st.success("✅ Data processed successfully")
    
    # Display data overview
    col1, col2, col3 = st.columns(3)
    with col1:
        st.subheader("📈 Data Overview")
        st.dataframe(processed_data.head(10))
        
    with col2:
        st.subheader("📊 Data Statistics")
        st.dataframe(processed_data[target_col].describe())
        
    with col3:
        st.subheader("📊 Time Series Info")
        info_data = {
            'Records': [len(processed_data)],
            'Training Split': [f'{int(len(processed_data) * 0.8)} rows'],
            'Test Split': [f'{len(processed_data) - int(len(processed_data) * 0.8)} rows'],
            'Forecast Mode': ['Univariate']
        }
        st.dataframe(pd.DataFrame(info_data), width='stretch')
    
    # Split data for training and testing
    train_size = int(len(processed_data) * 0.8)
    train_data = processed_data[:train_size]
    test_data = processed_data[train_size:]
    
    # Update feature_cols to use trend features we created
    feature_cols = [f'{target_col}_ma_7', f'{target_col}_ma_14', f'{target_col}_trend', f'{target_col}_pct_change']
    
    # Train models and generate forecasts
    results = {}
    
    with st.spinner("Training models and generating forecasts..."):
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        for i, model_name in enumerate(selected_models):
            try:
                # Update progress
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
                    # Skip if NeuralProphet is not available
                    if model is None and "error" in params:
                        st.error(f"Error training {model_name}: {params['error']}")
                        continue
                elif model_name == "DeepAR":
                    model, params = forecasting_models.train_deepar(
                        train_data, date_col, target_col, feature_cols, hyperparameter_tuning
                    )
                
                # Store training context for sequence models like DeepAR
                if model_name == "DeepAR":
                    model.training_context = {
                        'last_sequence': train_data[target_col].tail(getattr(model, 'sequence_length', 30)).values,
                        'stats': {
                            'mean': train_data[target_col].mean(),
                            'std': train_data[target_col].std(),
                            'min': train_data[target_col].min(),
                            'max': train_data[target_col].max()
                        }
                    }
                
                # Generate predictions with confidence intervals for test set
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
        
        # Complete progress
        progress_bar.progress(1.0)
        status_text.text("✅ All models trained successfully!")
    
    # Display results
    if results:
        display_results(processed_data, train_data, test_data, results, 
                       target_col, date_col, visualizer, data_processor)

def display_results(processed_data, train_data, test_data, results, 
                   target_col, date_col, visualizer, data_processor):
    
    # Store data processor in session state for feature importance access
    if 'data_processor' not in st.session_state:
        st.session_state.data_processor = data_processor
    
    st.header("📈 Forecasting Results")
    
    # Automatically determine the best model based on RMSE
    best_model_name = min(results.keys(), key=lambda x: results[x]['accuracy_metrics']['RMSE'])
    best_result = results[best_model_name]
    
    # Show the winner prominently
    st.success(f"🏆 **Winner: {best_model_name}** - Best performing model (RMSE: {best_result['accuracy_metrics']['RMSE']:.4f})")
    
    # Show brief comparison for context
    st.subheader("📊 Model Performance Summary")
    comparison_data = []
    for model_name, result in results.items():
        metrics = result['accuracy_metrics']
        is_winner = model_name == best_model_name
        comparison_data.append({
            'Model': f"🏆 {model_name}" if is_winner else model_name,
            'MAE': round(metrics['MAE'], 4),
            'RMSE': round(metrics['RMSE'], 4),
            'MAPE': f"{round(metrics['MAPE'], 2)}%"
        })
    
    comparison_df = pd.DataFrame(comparison_data)
    st.dataframe(comparison_df, width='stretch')
    
    # Focus on the winning model only
    st.subheader(f"📈 {best_model_name} - Detailed Analysis")
    st.info(f"Displaying results for the best performing model: **{best_model_name}**")
    
    # Visualizations
    st.subheader("📊 Forecast Visualizations")
    
    # Create tabs focused on the best model only
    tab1, tab2, tab3 = st.tabs(["📈 Forecasts & Predictions", "📊 Confidence Intervals", "🔍 Model Details"])
    
    with tab1:
        # Show forecast visualization for BEST MODEL ONLY
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
            hovermode='x unified'
        )
        
        st.plotly_chart(fig, width='stretch')
        
    with tab2:
        # Confidence intervals for BEST MODEL ONLY
        st.subheader(f"🔮 {best_model_name} - Prediction Uncertainty")
        
        # Show confidence intervals for the winning model only
        if 'test_confidence_intervals' in best_result:
            ci_data = best_result['test_confidence_intervals']
                    
                    # Create confidence interval plot
                    fig = go.Figure()
                    
                    # Test data dates for x-axis
                    test_dates = test_data.reset_index()[date_col]
                    
                    # Add actual values
                    fig.add_trace(go.Scatter(
                        x=test_dates,
                        y=test_data[target_col].values,
                        mode='markers',
                        name='Actual',
                        marker=dict(color='black', size=4)
                    ))
                    
                    # Add predictions
                    fig.add_trace(go.Scatter(
                        x=test_dates,
                        y=result['test_predictions'],
                        mode='lines',
                        name='Predictions',
                        line=dict(color='blue')
                    ))
                    
                    # Add confidence interval as filled area
                    fig.add_trace(go.Scatter(
                        x=test_dates,
                        y=ci_data['upper'],
                        fill=None,
                        mode='lines',
                        line_color='rgba(0,100,80,0)',
                        showlegend=False
                    ))
                    
                    fig.add_trace(go.Scatter(
                        x=test_dates,
                        y=ci_data['lower'],
                        fill='tonexty',
                        mode='lines',
                        line_color='rgba(0,100,80,0)',
                        name=f'{int(ci_data["confidence_level"]*100)}% Confidence Interval',
                        fillcolor='rgba(0,100,80,0.2)'
                    ))
                    
                    fig.update_layout(
                        title=f'{model_name} - Predictions with {int(ci_data["confidence_level"]*100)}% Confidence Intervals',
                        xaxis_title='Date',
                        yaxis_title=target_col,
                        height=400
                    )
                    
                    st.plotly_chart(fig, width='stretch')
                    
                    # Show uncertainty metrics
                    uncertainty_width = np.mean(ci_data['upper'] - ci_data['lower'])
                    coverage = np.mean((test_data[target_col].values >= ci_data['lower']) & 
                                     (test_data[target_col].values <= ci_data['upper'])) * 100
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("Avg. Interval Width", f"{uncertainty_width:.2f}")
                    with col2:
                        st.metric("Coverage Rate", f"{coverage:.1f}%")
                else:
                    st.info("Confidence intervals not available for this model.")
    
    with tab3:
        # Model comparison visualization
        fig = visualizer.plot_model_comparison(results, test_data, target_col)
        st.plotly_chart(fig, width='stretch')
        
    with tab4:
        # Accuracy metrics visualization
        fig = visualizer.plot_accuracy_metrics(results)
        st.plotly_chart(fig, width='stretch')
        
    with tab5:
        # Feature Engineering Report
        st.subheader("🔧 Automated Feature Engineering Results")
        
        # Get data processor from session state or create new one
        if 'data_processor' in st.session_state:
            data_processor = st.session_state.data_processor
        else:
            data_processor = DataProcessor()  # Fallback
            
        # Feature importance report
        importance_df = data_processor.get_feature_importance_report()
        if importance_df is not None:
            st.subheader("📊 Top Selected Features")
            
            col1, col2 = st.columns(2)
            with col1:
                st.dataframe(importance_df, width='stretch')
                
            with col2:
                # Feature importance bar chart
                import plotly.express as px
                top_features = importance_df.head(10)
                fig = px.bar(
                    top_features, 
                    x='Importance Score', 
                    y='Feature',
                    orientation='h',
                    title="Top 10 Most Important Features",
                    color='Importance Score',
                    color_continuous_scale='viridis'
                )
                fig.update_layout(height=400)
                st.plotly_chart(fig, width='stretch')
            
            # Feature engineering summary
            st.subheader("⚙️ Feature Engineering Summary")
            
            engineered_features = [f for f in importance_df['Feature'] if any(suffix in f for suffix in ['_lag_', '_rolling_', '_x_', '_div_', '_log', '_sqrt', '_squared', '_weekly_', '_monthly_'])]
            original_features = [f for f in importance_df['Feature'] if f not in engineered_features and not any(time_feat in f for time_feat in ['year', 'month', 'day', 'dayofweek', 'quarter', '_sin', '_cos'])]
            time_features = [f for f in importance_df['Feature'] if any(time_feat in f for time_feat in ['year', 'month', 'day', 'dayofweek', 'quarter', '_sin', '_cos'])]
            
            summary_col1, summary_col2, summary_col3 = st.columns(3)
            with summary_col1:
                st.metric("Original Features", len(original_features))
                if original_features:
                    st.write("• " + "\n• ".join(original_features[:5]))
                    
            with summary_col2:
                st.metric("Time-based Features", len(time_features))
                if time_features:
                    st.write("• " + "\n• ".join(time_features[:5]))
                    
            with summary_col3:
                st.metric("Engineered Features", len(engineered_features))
                if engineered_features:
                    st.write("• " + "\n• ".join(engineered_features[:5]))
        else:
            st.info("Feature importance data not available. This is shown after running the forecasting models.")
    
    with tab6:
        # Detailed results for each model
        for model_name, result in results.items():
            with st.expander(f"📋 {model_name} Details"):
                col1, col2 = st.columns(2)
                
                with col1:
                    st.write("**Model Parameters:**")
                    st.json(result['params'])
                    
                with col2:
                    st.write("**Accuracy Metrics:**")
                    metrics = result['accuracy_metrics']
                    st.metric("MAE", round(metrics['MAE'], 4))
                    st.metric("RMSE", round(metrics['RMSE'], 4))
                    st.metric("MAPE", f"{round(metrics['MAPE'], 2)}%")
                
                st.write("**Future Forecasts:**")
                forecast_df = pd.DataFrame({
                    'Forecast_Date': result['future_forecasts']['dates'],
                    'Predicted_Value': result['future_forecasts']['values']
                })
                st.dataframe(forecast_df)
    
    # Export functionality
    st.subheader("💾 Export Results")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Export forecasts
        best_result = results[best_model_name]
        export_df = pd.DataFrame({
            'Date': best_result['future_forecasts']['dates'],
            'Forecast': best_result['future_forecasts']['values'],
            'Model': best_model_name
        })
        
        csv = export_df.to_csv(index=False)
        st.download_button(
            label="📥 Download Best Model Forecasts",
            data=csv,
            file_name=f"{best_model_name}_forecasts.csv",
            mime="text/csv"
        )
    
    with col2:
        # Export all results
        all_results = []
        for model_name, result in results.items():
            for i, (date, value) in enumerate(zip(result['future_forecasts']['dates'], 
                                                result['future_forecasts']['values'])):
                all_results.append({
                    'Date': date,
                    'Forecast': value,
                    'Model': model_name
                })
        
        all_results_df = pd.DataFrame(all_results)
        csv_all = all_results_df.to_csv(index=False)
        st.download_button(
            label="📥 Download All Model Forecasts",
            data=csv_all,
            file_name="all_model_forecasts.csv",
            mime="text/csv"
        )

if __name__ == "__main__":
    main()
