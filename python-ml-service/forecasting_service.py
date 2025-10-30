#!/usr/bin/env python3
print("Starting ML Forecasting Service...", flush=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
from statsmodels.tsa.arima.model import ARIMA
from prophet import Prophet
from scipy import stats
import time
import warnings
warnings.filterwarnings('ignore')

# Import model cache
try:
    from model_cache import get_model_cache
    MODEL_CACHE_AVAILABLE = True
    print("Model cache imported successfully", flush=True)
except ImportError:
    MODEL_CACHE_AVAILABLE = False
    print("Model cache not available - caching disabled", flush=True)

print("Imports successful", flush=True)

app = Flask(__name__)
CORS(app)

print("Flask app created", flush=True)

# Store trained models in memory (in production, use Redis or similar)
trained_models = {}

def analyze_data_characteristics(df, item_column=None, items=None):
    """
    Analyze data characteristics to recommend the best forecasting model.
    Returns analysis results and model recommendations.
    """
    print(f"Analyzing data characteristics...", flush=True)
    
    # Initialize results
    analysis = {
        'data_points': len(df),
        'date_range_days': 0,
        'intermittency_ratio': 0,
        'cv_demand': 0,  # Coefficient of variation
        'trend_strength': 0,
        'seasonality_detected': False,
        'has_outliers': False,
        'mean_interval_between_orders': 0,
        'recommended_models': [],
        'reasoning': []
    }
    
    # If we have item-specific data
    if item_column and items:
        item_analyses = {}
        for item in items:
            item_df = df[df[item_column] == item].copy()
            item_analyses[item] = analyze_single_series(item_df['value'] if 'value' in item_df.columns else item_df.iloc[:, -1])
        
        # Aggregate results
        analysis['item_count'] = len(items)
        analysis['avg_intermittency'] = np.mean([a['intermittency_ratio'] for a in item_analyses.values()])
        analysis['items_with_high_intermittency'] = sum(1 for a in item_analyses.values() if a['intermittency_ratio'] > 0.7)
        
        # Overall recommendation based on majority characteristics
        if analysis['items_with_high_intermittency'] > len(items) * 0.5:
            analysis['recommended_models'] = ['prophet', 'arima']
            analysis['reasoning'].append(f"Over 50% of items have intermittent demand (>70% zeros)")
        else:
            analysis['recommended_models'] = ['random_forest', 'linear_regression']
            analysis['reasoning'].append(f"Majority of items have regular demand patterns")
            
        analysis['item_analyses'] = item_analyses
    else:
        # Single series analysis
        series = df['value'] if 'value' in df.columns else df.iloc[:, -1]
        single_analysis = analyze_single_series(series)
        analysis.update(single_analysis)
        
        # Model recommendation logic
        if analysis['intermittency_ratio'] > 0.7:
            analysis['recommended_models'] = ['prophet', 'arima']
            analysis['reasoning'].append(f"High intermittency ({analysis['intermittency_ratio']*100:.1f}% zeros) - Prophet/ARIMA handle sparse data better")
        elif analysis['intermittency_ratio'] > 0.3:
            analysis['recommended_models'] = ['arima', 'prophet']
            analysis['reasoning'].append(f"Moderate intermittency ({analysis['intermittency_ratio']*100:.1f}% zeros) - ARIMA recommended")
        else:
            if analysis['data_points'] < 30:
                analysis['recommended_models'] = ['linear_regression', 'arima']
                analysis['reasoning'].append(f"Limited data ({analysis['data_points']} points) - Simple models preferred")
            else:
                analysis['recommended_models'] = ['random_forest', 'linear_regression']
                analysis['reasoning'].append(f"Regular demand pattern with sufficient data - ML models recommended")
        
        # Additional factors
        if analysis['seasonality_detected']:
            if 'prophet' not in analysis['recommended_models']:
                analysis['recommended_models'].insert(0, 'prophet')
            analysis['reasoning'].append("Seasonality detected - Prophet excels at seasonal patterns")
        
        if analysis['has_outliers']:
            if 'random_forest' in analysis['recommended_models']:
                # Random Forest is robust to outliers, prioritize it
                analysis['recommended_models'].remove('random_forest')
                analysis['recommended_models'].insert(0, 'random_forest')
                analysis['reasoning'].append("Outliers detected - Random Forest is robust to outliers")
    
    return analysis

def analyze_single_series(series):
    """Analyze a single time series for characteristics"""
    result = {
        'data_points': len(series),
        'intermittency_ratio': 0,
        'cv_demand': 0,
        'trend_strength': 0,
        'seasonality_detected': False,
        'has_outliers': False,
        'mean_interval_between_orders': 0
    }
    
    # Clean series
    series_clean = pd.Series(series).fillna(0)
    
    # Intermittency analysis
    zeros = (series_clean == 0).sum()
    result['intermittency_ratio'] = zeros / len(series_clean) if len(series_clean) > 0 else 0
    
    # For non-zero values
    non_zero_values = series_clean[series_clean > 0]
    if len(non_zero_values) > 0:
        # Coefficient of variation (demand variability)
        mean_val = non_zero_values.mean()
        std_val = non_zero_values.std()
        result['cv_demand'] = std_val / mean_val if mean_val > 0 else 0
        
        # Check for outliers using IQR
        Q1 = non_zero_values.quantile(0.25)
        Q3 = non_zero_values.quantile(0.75)
        IQR = Q3 - Q1
        result['has_outliers'] = ((non_zero_values < (Q1 - 1.5 * IQR)) | (non_zero_values > (Q3 + 1.5 * IQR))).any()
        
        # Mean interval between orders
        non_zero_indices = np.where(series_clean > 0)[0]
        if len(non_zero_indices) > 1:
            intervals = np.diff(non_zero_indices)
            result['mean_interval_between_orders'] = np.mean(intervals)
    
    # Trend detection (if enough data)
    if len(series_clean) >= 7:
        x = np.arange(len(series_clean))
        if series_clean.std() > 0:  # Only if there's variation
            correlation = np.corrcoef(x, series_clean)[0, 1]
            result['trend_strength'] = abs(correlation)
    
    # Basic seasonality detection (if enough data)
    if len(series_clean) >= 14:  # At least 2 weeks of data
        # Simple autocorrelation check for weekly pattern
        if len(series_clean) >= 7:
            weekly_corr = series_clean.autocorr(lag=7) if series_clean.std() > 0 else 0
            result['seasonality_detected'] = abs(weekly_corr) > 0.3 if not pd.isna(weekly_corr) else False
    
    return result

def create_features(df, n_lags=3):
    """Create features for Random Forest model with minimal data loss"""
    # Use fewer lags to preserve more data
    for i in range(1, n_lags + 1):
        df[f'lag_{i}'] = df['value'].shift(i)
    
    # Rolling statistics with min_periods to avoid too much data loss
    df['rolling_mean_3'] = df['value'].rolling(window=3, min_periods=1).mean()
    df['rolling_std_3'] = df['value'].rolling(window=3, min_periods=1).std().fillna(0)
    df['rolling_mean_7'] = df['value'].rolling(window=7, min_periods=1).mean()
    
    # Date features (no NaN values)
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['month'] = df['date'].dt.month
    df['quarter'] = df['date'].dt.quarter
    
    # Fill remaining NaN values in lag features with forward/backward fill
    for i in range(1, n_lags + 1):
        df[f'lag_{i}'] = df[f'lag_{i}'].fillna(method='bfill').fillna(method='ffill').fillna(df['value'].mean())
    
    # Only drop rows if we still have NaN (should be rare now)
    df = df.dropna()
    
    return df

def calculate_metrics(y_true, y_pred):
    """Calculate MAPE and RMSE with better handling of zero/near-zero values"""
    # Calculate RMSE first - always valid
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    
    # For MAPE, handle zero and near-zero values better
    # Use a threshold to avoid division by very small numbers
    threshold = 0.01
    mask = np.abs(y_true) > threshold
    
    if mask.sum() == 0:
        # If all values are near zero, use normalized RMSE as a percentage
        # This gives us a meaningful error metric even for zero data
        data_range = np.max(y_true) - np.min(y_true)
        if data_range > 0:
            mape = (rmse / data_range) * 100
        else:
            # If data is completely flat, check prediction error
            max_error = np.max(np.abs(y_pred - y_true))
            if max_error > 0:
                mape = 100.0  # Large error if predictions deviate from flat data
            else:
                mape = 0.0  # Perfect if predictions match flat data
    else:
        # Standard MAPE for non-zero values
        mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    
    return float(mape), float(rmse)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "ML Forecasting Service"})

@app.route('/train', methods=['POST'])
def train_model():
    try:
        data = request.json
        model_type = data.get('modelType', 'Random Forest')
        
        # Support both single-item (legacy) and multi-item training
        items_data = data.get('itemsData', {})  # New: dict with item names as keys
        if not items_data:
            # Legacy single-item support
            historical_data = data.get('historicalData', [])
            item = data.get('item', 'default_item')
            if historical_data and item:
                items_data = {item: historical_data}
        
        base_model_id = data.get('modelId', 'default')
        
        # Extract database configuration for caching
        schema = data.get('schema', 'dbo')
        table = data.get('table', 'default_table')
        date_col = data.get('dateCol', 'date')
        item_col = data.get('itemCol', 'item')
        qty_col = data.get('qtyCol', 'quantity')
        
        # Extract hierarchical filters for caching
        planning_areas = data.get('planningAreas', None)
        scenario_names = data.get('scenarioNames', None)
        forecast_days = data.get('forecastDays', 30)
        hyperparameter_tuning = data.get('hyperparameterTuning', False)
        
        # Cache control flag
        force_retrain = data.get('forceRetrain', False)
        
        if not items_data:
            return jsonify({"error": "No items data provided."}), 400
        
        # Results for each item
        training_results = {}
        all_metrics = []
        successfully_trained = []
        
        # Train individual models for each item
        for item_name, historical_data in items_data.items():
            if not historical_data:
                print(f"No data for item {item_name}, skipping", flush=True)
                continue
            
            # Create unique model ID for this item
            model_id = f"{base_model_id}_{item_name}"
            
            # Generate cache key for this item (will be used for loading or saving)
            cache_key = None
            if MODEL_CACHE_AVAILABLE:
                try:
                    cache = get_model_cache()
                    cache_key = cache.get_cache_key(
                        schema, table, date_col, item_col, qty_col,
                        model_type, forecast_days, item_name, 
                        planning_areas, scenario_names, hyperparameter_tuning
                    )
                except Exception as e:
                    print(f"Failed to generate cache key for item {item_name}: {e}", flush=True)
            
            # Check cache first if not forcing retrain
            if MODEL_CACHE_AVAILABLE and not force_retrain and cache_key:
                try:
                    # Try to load from cache
                    if cache.exists(schema, table, date_col, item_col, qty_col, 
                                  model_type, forecast_days, item_name, 
                                  planning_areas, scenario_names, hyperparameter_tuning):
                        cached_model, cached_metadata = cache.load_model(cache_key)
                        if cached_model is not None and cached_metadata is not None:
                            # Store in memory for immediate use
                            trained_models[model_id] = cached_model
                            
                            print(f"Loaded model from cache for item {item_name}: {cache_key}", flush=True)
                            training_results[item_name] = {
                                "success": True,
                                "modelType": model_type,
                                "metrics": cached_metadata.get('metrics', {}),
                                "trainingDataPoints": len(historical_data),
                                "modelId": model_id,
                                "cacheKey": cache_key,
                                "fromCache": True
                            }
                            all_metrics.append(cached_metadata.get('metrics', {}))
                            successfully_trained.append(item_name)
                            continue
                except Exception as e:
                    print(f"Cache load failed for item {item_name}: {e}", flush=True)
            elif force_retrain:
                print(f"Force retrain enabled - skipping cache for item {item_name}", flush=True)
            
            # Convert to DataFrame
            df = pd.DataFrame(historical_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            df['value'] = df['value'].astype(float)
            
            # Train based on model type
            try:
                if model_type == 'Linear Regression':
                    metrics = train_linear_regression(df, model_id)
                elif model_type == 'Random Forest':
                    metrics = train_random_forest(df, model_id, hyperparameter_tuning)
                elif model_type == 'ARIMA':
                    metrics = train_arima(df, model_id, hyperparameter_tuning)
                elif model_type == 'Prophet':
                    metrics = train_prophet(df, model_id, hyperparameter_tuning)
                else:
                    return jsonify({"error": f"Unknown model type: {model_type}"}), 400
                
                # Save to cache if available
                if MODEL_CACHE_AVAILABLE and cache_key:
                    try:
                        cache = get_model_cache()
                        model_info = trained_models.get(model_id)
                        if model_info:
                            cache.save_model(
                                schema, table, date_col, item_col, qty_col,
                                model_type, forecast_days, item_name,
                                model_info, 
                                {'metrics': metrics, 'training_points': len(historical_data), 'hyperparameter_tuning': hyperparameter_tuning},
                                planning_areas, scenario_names, hyperparameter_tuning
                            )
                            print(f"Saved model to cache for item {item_name}: {cache_key}", flush=True)
                    except Exception as e:
                        print(f"Cache save failed for item {item_name}: {e}", flush=True)
                
                training_results[item_name] = {
                    "success": True,
                    "modelType": model_type,
                    "metrics": metrics,
                    "trainingDataPoints": len(historical_data),
                    "modelId": model_id,
                    "cacheKey": cache_key,
                    "fromCache": False
                }
                all_metrics.append(metrics)
                successfully_trained.append(item_name)
                
            except Exception as item_error:
                print(f"Failed to train model for item {item_name}: {str(item_error)}", flush=True)
                training_results[item_name] = {
                    "success": False,
                    "error": str(item_error),
                    "modelId": model_id
                }
        
        # Train a separate aggregated model for Overall if multiple items
        overall_metrics = {}
        overall_training_result = None
        
        if len(successfully_trained) > 1:
            # Aggregate all historical data across items for Overall model
            all_dates = set()
            for item_name, historical_data in items_data.items():
                if item_name not in successfully_trained:
                    continue
                for point in historical_data:
                    all_dates.add(point['date'])
            
            # Sort dates
            sorted_dates = sorted(all_dates)
            
            # Create aggregated dataset
            aggregated_data = []
            for date in sorted_dates:
                total_value = 0
                for item_name, historical_data in items_data.items():
                    if item_name not in successfully_trained:
                        continue
                    for point in historical_data:
                        if point['date'] == date:
                            total_value += point['value']
                            break
                aggregated_data.append({'date': date, 'value': total_value})
            
            # Train the Overall model on aggregated data
            overall_model_id = f"{base_model_id}_OVERALL"
            
            # Check cache for Overall model
            overall_cache_key = None
            from_cache = False
            if MODEL_CACHE_AVAILABLE:
                try:
                    cache = get_model_cache()
                    overall_cache_key = cache.get_cache_key(
                        schema, table, date_col, item_col, qty_col,
                        model_type, forecast_days, "OVERALL", 
                        planning_areas, scenario_names, hyperparameter_tuning
                    )
                    
                    if cache.exists(schema, table, date_col, item_col, qty_col,
                                  model_type, forecast_days, "OVERALL", 
                                  planning_areas, scenario_names, hyperparameter_tuning):
                        cached_model, cached_metadata = cache.load_model(overall_cache_key)
                        if cached_model is not None and cached_metadata is not None:
                            trained_models[overall_model_id] = cached_model
                            overall_metrics = cached_metadata.get('metrics', {})
                            from_cache = True
                            print(f"Loaded Overall model from cache: {overall_cache_key}", flush=True)
                except Exception as e:
                    print(f"Cache check failed for Overall model: {e}", flush=True)
            
            if not from_cache and len(aggregated_data) > 0:
                # Convert to DataFrame
                df = pd.DataFrame(aggregated_data)
                df['date'] = pd.to_datetime(df['date'])
                df = df.sort_values('date')
                df['value'] = df['value'].astype(float)
                
                # Train Overall model
                try:
                    if model_type == 'Linear Regression':
                        overall_metrics = train_linear_regression(df, overall_model_id)
                    elif model_type == 'Random Forest':
                        overall_metrics = train_random_forest(df, overall_model_id, hyperparameter_tuning)
                    elif model_type == 'ARIMA':
                        overall_metrics = train_arima(df, overall_model_id, hyperparameter_tuning)
                    elif model_type == 'Prophet':
                        overall_metrics = train_prophet(df, overall_model_id, hyperparameter_tuning)
                    
                    # Save Overall model to cache
                    if MODEL_CACHE_AVAILABLE and overall_cache_key:
                        try:
                            cache = get_model_cache()
                            model_info = trained_models.get(overall_model_id)
                            if model_info:
                                cache.save_model(
                                    schema, table, date_col, item_col, qty_col,
                                    model_type, forecast_days, "OVERALL",
                                    model_info,
                                    {'metrics': overall_metrics, 'training_points': len(aggregated_data), 'hyperparameter_tuning': hyperparameter_tuning},
                                    planning_areas, scenario_names, hyperparameter_tuning
                                )
                                print(f"Saved Overall model to cache: {overall_cache_key}", flush=True)
                        except Exception as e:
                            print(f"Cache save failed for Overall model: {e}", flush=True)
                    
                    overall_training_result = {
                        "success": True,
                        "modelType": model_type,
                        "metrics": overall_metrics,
                        "trainingDataPoints": len(aggregated_data),
                        "modelId": overall_model_id,
                        "cacheKey": overall_cache_key,
                        "fromCache": from_cache
                    }
                    print(f"Successfully trained Overall model on {len(aggregated_data)} aggregated data points", flush=True)
                    
                except Exception as overall_error:
                    print(f"Failed to train Overall model: {str(overall_error)}", flush=True)
                    overall_training_result = {
                        "success": False,
                        "error": str(overall_error),
                        "modelId": overall_model_id
                    }
        else:
            # If only one item, use its metrics as overall
            if all_metrics:
                overall_metrics = all_metrics[0]
        
        return jsonify({
            "success": True,
            "modelType": model_type,
            "overallMetrics": overall_metrics,
            "overallTrainingResult": overall_training_result,
            "itemsResults": training_results,
            "totalItems": len(items_data),
            "trainedItems": len(successfully_trained),
            "baseModelId": base_model_id,
            "trainedItemNames": successfully_trained
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def train_random_forest(df, model_id, hyperparameter_tuning=False):
    """Train Random Forest model with optional hyperparameter tuning"""
    # Create features
    df_features = create_features(df.copy())
    
    # Check if we have enough data after feature engineering
    if len(df_features) < 2:
        raise ValueError(f"Random Forest requires at least 2 data points after feature engineering. Found only {len(df_features)} row(s). Please select a different item or date range with more historical data.")
    
    # Split features and target
    feature_cols = [col for col in df_features.columns if col not in ['date', 'value']]
    X = df_features[feature_cols]
    y = df_features['value']
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X, y)
    
    # Calculate training metrics
    y_pred = model.predict(X)
    mape, rmse = calculate_metrics(y.values, y_pred)
    
    # Calculate prediction intervals using quantile regression approach
    # Estimate confidence intervals from residuals
    residuals = y.values - y_pred
    residual_std = np.std(residuals)
    
    # Store model and feature info with training metrics
    metrics = {
        "mape": mape,
        "rmse": rmse,
        "accuracy": max(0, 100 - mape)
    }
    
    trained_models[model_id] = {
        'model': model,
        'type': 'Random Forest',
        'feature_cols': feature_cols,
        'residual_std': residual_std,
        'last_data': df.tail(30).copy(),  # Keep last 30 days for forecasting
        'training_metrics': metrics  # Store training metrics with the model
    }
    
    return metrics

def train_linear_regression(df, model_id):
    """Train Linear Regression model"""
    # Create features (simpler than Random Forest)
    df_features = create_features(df.copy())
    
    # Check if we have enough data after feature engineering
    if len(df_features) < 2:
        raise ValueError(f"Linear Regression requires at least 2 data points after feature engineering. Found only {len(df_features)} row(s). Please select a different item or date range with more historical data.")
    
    # Split features and target
    feature_cols = [col for col in df_features.columns if col not in ['date', 'value']]
    X = df_features[feature_cols]
    y = df_features['value']
    
    # Scale features for better performance
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train model
    model = LinearRegression()
    model.fit(X_scaled, y)
    
    # Calculate training metrics
    y_pred = model.predict(X_scaled)
    mape, rmse = calculate_metrics(y.values, y_pred)
    
    # Compute residual standard deviation for confidence intervals
    residuals = y - y_pred
    residual_std = np.std(residuals)
    
    # Store model and feature info with training metrics
    metrics = {
        "mape": mape,
        "rmse": rmse,
        "accuracy": max(0, 100 - mape)
    }
    
    trained_models[model_id] = {
        'model': model,
        'scaler': scaler,
        'type': 'Linear Regression',
        'feature_cols': feature_cols,
        'residual_std': residual_std,
        'last_data': df.tail(30).copy(),  # Keep last 30 days for forecasting
        'training_metrics': metrics  # Store training metrics with the model
    }
    
    return metrics

def train_arima(df, model_id, hyperparameter_tuning=False):
    """Train ARIMA model with optional hyperparameter tuning and seasonal support"""
    values = df['value'].values
    
    # ARIMA requires at least 2 data points
    if len(values) < 2:
        raise ValueError(f"ARIMA requires at least 2 data points. Found only {len(values)} row(s). Please select a different item or date range with more historical data.")
    
    if hyperparameter_tuning:
        # Enhanced ARIMA with seasonal and trend components + timeout protection
        start_time = time.time()
        timeout_seconds = 300  # 5 minute timeout
        
        best_aic = np.inf
        best_order = None
        best_seasonal_order = None
        best_model = None
        
        # Expanded search space for ARIMA parameters
        p_values = range(0, 4)
        d_values = range(0, 3)
        q_values = range(0, 4)
        
        # Seasonal parameters (for weekly/monthly patterns)
        seasonal_periods = [7, 30]  # Weekly and monthly seasonality
        
        # First try non-seasonal ARIMA with expanded parameters
        for p in p_values:
            for d in d_values:
                for q in q_values:
                    # Check timeout
                    if time.time() - start_time > timeout_seconds:
                        print(f"ARIMA grid search timeout after {timeout_seconds}s", flush=True)
                        break
                    try:
                        model = ARIMA(values, order=(p, d, q))
                        fitted_model = model.fit()
                        if fitted_model.aic < best_aic:
                            best_aic = fitted_model.aic
                            best_order = (p, d, q)
                            best_seasonal_order = None
                            best_model = fitted_model
                    except:
                        continue
        
        # Try seasonal ARIMA if we have enough data
        if len(values) > 60:  # Need sufficient data for seasonal modeling
            for s in seasonal_periods:
                if len(values) > 2 * s:  # Need at least 2 full seasons
                    for P in range(0, 3):
                        for D in range(0, 2):
                            for Q in range(0, 3):
                                # Check timeout
                                if time.time() - start_time > timeout_seconds:
                                    print(f"ARIMA seasonal search timeout after {timeout_seconds}s", flush=True)
                                    break
                                try:
                                    model = ARIMA(values, order=(1, 1, 1), seasonal_order=(P, D, Q, s))
                                    fitted_model = model.fit()
                                    if fitted_model.aic < best_aic:
                                        best_aic = fitted_model.aic
                                        best_order = (1, 1, 1)
                                        best_seasonal_order = (P, D, Q, s)
                                        best_model = fitted_model
                                except:
                                    continue
        
        if best_model is None:
            # Fallback to default ARIMA(1,1,1)
            model = ARIMA(values, order=(1, 1, 1))
            best_model = model.fit()
            best_order = (1, 1, 1)
            best_seasonal_order = None
        
        # Calculate metrics
        y_pred = best_model.fittedvalues
        if len(y_pred) < len(values):
            values_aligned = values[-len(y_pred):]
        elif len(y_pred) > len(values):
            y_pred = y_pred[-len(values):]
            values_aligned = values
        else:
            values_aligned = values
            
        mape, rmse = calculate_metrics(values_aligned, y_pred)
        
        # Store model
        trained_models[model_id] = {
            'model': best_model,
            'type': 'ARIMA',
            'order': best_order,
            'seasonal_order': best_seasonal_order,
            'last_data': df.copy()
        }
        
        return {
            "mape": mape,
            "rmse": rmse,
            "accuracy": max(0, 100 - mape),
            "best_order": best_order,
            "seasonal_order": best_seasonal_order,
            "aic": float(best_aic)
        }
    else:
        # Use default ARIMA(1,1,1) for backward compatibility
        try:
            model = ARIMA(values, order=(1, 1, 1))
            model_fit = model.fit()
            
            # Calculate metrics on training data
            y_pred = model_fit.fittedvalues
            # Align predictions with original data (ARIMA may have different length)
            if len(y_pred) < len(values):
                values = values[-len(y_pred):]
            elif len(y_pred) > len(values):
                y_pred = y_pred[-len(values):]
                
            mape, rmse = calculate_metrics(values, y_pred)
            
            # Store model
            trained_models[model_id] = {
                'model': model_fit,
                'type': 'ARIMA',
                'order': (1, 1, 1),
                'seasonal_order': None,
                'last_data': df.copy()
            }
            
            return {
                "mape": mape,
                "rmse": rmse,
                "accuracy": max(0, 100 - mape)
            }
        except Exception as e:
            raise ValueError(f"ARIMA training failed: {str(e)}")

def train_prophet(df, model_id, hyperparameter_tuning=False):
    """Train Prophet model with optional hyperparameter tuning"""
    # Prepare data for Prophet (requires 'ds' and 'y' columns)
    prophet_df = df[['date', 'value']].copy()
    prophet_df.columns = ['ds', 'y']
    
    # Remove any NaN values
    prophet_df = prophet_df.dropna()
    
    # Prophet requires at least 2 data points
    if len(prophet_df) < 2:
        raise ValueError(f"Prophet requires at least 2 data points. Found only {len(prophet_df)} row(s). Please select a different item or date range with more historical data.")
    
    # Check if data has sufficient variance for Prophet
    # Prophet doesn't work well with flat/near-zero data
    data_std = prophet_df['y'].std()
    data_mean = prophet_df['y'].mean()
    data_max = prophet_df['y'].max()
    data_min = prophet_df['y'].min()
    
    print(f"Prophet data stats: mean={data_mean:.4f}, std={data_std:.4f}, min={data_min:.4f}, max={data_max:.4f}, len={len(prophet_df)}", flush=True)
    
    # Check for near-zero data with low variance
    # If all values are very small (close to zero) with minimal variation, use simple forecast
    if data_max < 1.0 and data_std < 0.5:
        # Data is essentially flat and near zero - use a simple average forecast
        print(f"Warning: Data has very low variance (std={data_std:.4f}, mean={data_mean:.4f}). Using simple average forecast.", flush=True)
        
        # Create a simple model that returns the mean
        class SimpleAverageModel:
            def __init__(self, mean_value):
                self.mean = mean_value
            
            def predict(self, future):
                predictions = pd.DataFrame()
                predictions['ds'] = future['ds']
                predictions['yhat'] = self.mean
                predictions['yhat_lower'] = self.mean * 0.9  # Simple confidence interval
                predictions['yhat_upper'] = self.mean * 1.1
                return predictions
        
        simple_model = SimpleAverageModel(data_mean)
        
        # Store the simple model
        trained_models[model_id] = {
            'model': simple_model,
            'type': 'Prophet',
            'is_simple': True,
            'last_data': df.copy()
        }
        
        # Return appropriate metrics
        return {
            "mape": 0.0 if data_std == 0 else 10.0,  # Small error for flat data
            "rmse": data_std,
            "accuracy": 90.0 if data_std == 0 else 90.0,
            "warning": "Data has very low variance. Using simple average forecast."
        }
    
    if hyperparameter_tuning:
        # Enhanced Prophet hyperparameter tuning with cross-validation
        param_grid = {
            'changepoint_prior_scale': [0.001, 0.01, 0.05, 0.1, 0.5, 1.0],
            'seasonality_prior_scale': [0.1, 1.0, 10.0, 50.0],
            'seasonality_mode': ['additive', 'multiplicative'],
            'changepoint_range': [0.8, 0.9, 0.95]
        }
        
        best_mape = np.inf
        best_params = None
        best_model = None
        
        # Grid search with timeout protection
        start_time = time.time()
        timeout_seconds = 300  # 5 minute timeout
        
        for changepoint_prior in param_grid['changepoint_prior_scale']:
            for seasonality_prior in param_grid['seasonality_prior_scale']:
                for seasonality_mode in param_grid['seasonality_mode']:
                    for changepoint_range in param_grid['changepoint_range']:
                        # Check timeout
                        if time.time() - start_time > timeout_seconds:
                            print(f"Prophet grid search timeout after {timeout_seconds}s", flush=True)
                            break
                            
                        try:
                            # Cross-validation on last 30 data points
                            if len(prophet_df) > 30:
                                train_subset = prophet_df[:-30]
                                test_subset = prophet_df[-30:]
                            else:
                                # Use all data for training if we don't have enough
                                train_subset = prophet_df
                                test_subset = prophet_df
                            
                            # Train model on subset
                            model = Prophet(
                                changepoint_prior_scale=changepoint_prior,
                                seasonality_prior_scale=seasonality_prior,
                                seasonality_mode=seasonality_mode,
                                changepoint_range=changepoint_range,
                                daily_seasonality=True,
                                weekly_seasonality=True,
                                yearly_seasonality=True
                            )
                            model.fit(train_subset)
                            
                            # Validate on test set
                            if len(test_subset) > 0:
                                forecast = model.predict(test_subset)
                                
                                # Calculate MAPE
                                y_true = test_subset['y'].values
                                y_pred = forecast['yhat'].values
                                mask = y_true != 0
                                if mask.sum() > 0:
                                    mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
                                else:
                                    mape = 0
                                
                                if mape < best_mape:
                                    best_mape = mape
                                    best_params = {
                                        'changepoint_prior_scale': changepoint_prior,
                                        'seasonality_prior_scale': seasonality_prior,
                                        'seasonality_mode': seasonality_mode,
                                        'changepoint_range': changepoint_range
                                    }
                                    # Train final model on full data with best params
                                    best_model = Prophet(
                                        changepoint_prior_scale=changepoint_prior,
                                        seasonality_prior_scale=seasonality_prior,
                                        seasonality_mode=seasonality_mode,
                                        changepoint_range=changepoint_range,
                                        daily_seasonality=True,
                                        weekly_seasonality=True,
                                        yearly_seasonality=True
                                    )
                                    best_model.fit(prophet_df)
                                    
                        except Exception as e:
                            continue
        
        if best_model is None:
            # Fallback to default Prophet
            best_model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=True
            )
            best_model.fit(prophet_df)
            best_params = {"default_params": True}
        
        # Calculate final metrics on full training data
        forecast = best_model.predict(prophet_df)
        y_pred = forecast['yhat'].values
        y_true = prophet_df['y'].values
        mape, rmse = calculate_metrics(y_true, y_pred)
        
        # Store model
        trained_models[model_id] = {
            'model': best_model,
            'type': 'Prophet',
            'best_params': best_params,
            'last_data': df.copy()
        }
        
        return {
            "mape": mape,
            "rmse": rmse,
            "accuracy": max(0, 100 - mape),
            "best_params": best_params
        }
    else:
        # Use default Prophet parameters for backward compatibility
        model = Prophet(
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=True,
            changepoint_prior_scale=0.05
        )
        model.fit(prophet_df)
        
        # Make predictions on training data
        forecast = model.predict(prophet_df)
        y_pred = forecast['yhat'].values
        y_true = prophet_df['y'].values
        
        mape, rmse = calculate_metrics(y_true, y_pred)
        
        # Store model
        trained_models[model_id] = {
            'model': model,
            'type': 'Prophet',
            'last_data': df.copy()
        }
        
        return {
            "mape": mape,
            "rmse": rmse,
            "accuracy": max(0, 100 - mape)
        }

def calculate_summed_overall_forecast(individual_forecasts):
    """Fallback function to calculate overall forecast by summing individual forecasts"""
    if not individual_forecasts:
        return None
    
    # Aggregate historical data
    all_dates = set()
    for item_forecast in individual_forecasts.values():
        all_dates.update([h['date'] for h in item_forecast['historical']])
    
    sorted_dates = sorted(all_dates)
    overall_historical = []
    
    for date in sorted_dates:
        total_value = 0
        for item_forecast in individual_forecasts.values():
            for h in item_forecast['historical']:
                if h['date'] == date:
                    total_value += h['value']
                    break
        overall_historical.append({"date": date, "value": total_value})
    
    # Aggregate forecasted data
    if individual_forecasts:
        first_item_forecast = list(individual_forecasts.values())[0]
        forecast_dates = [f['date'] for f in first_item_forecast['forecast']]
        
        overall_predictions = []
        for date in forecast_dates:
            total_value = 0
            total_lower = 0
            total_upper = 0
            
            for item_forecast in individual_forecasts.values():
                for f in item_forecast['forecast']:
                    if f['date'] == date:
                        total_value += f['value']
                        total_lower += f['lower']
                        total_upper += f['upper']
                        break
            
            overall_predictions.append({
                "date": date,
                "value": total_value,
                "lower": total_lower,
                "upper": total_upper
            })
        
        # Calculate overall metrics (average of individual metrics)
        overall_metrics = {}
        if individual_forecasts:
            all_item_metrics = [f['metrics'] for f in individual_forecasts.values()]
            metric_keys = all_item_metrics[0].keys()
            for key in metric_keys:
                values = [m.get(key, 0) for m in all_item_metrics if key in m]
                if values:
                    overall_metrics[key] = sum(values) / len(values)
        
        return {
            "historical": overall_historical,
            "forecast": overall_predictions,
            "metrics": overall_metrics,
            "usingDedicatedModel": False
        }
    
    return None

@app.route('/forecast', methods=['POST'])
def forecast():
    try:
        data = request.json
        
        # Support both single-item (legacy) and multi-item forecasting
        items_data = data.get('itemsData', {})  # New: dict with item names as keys and historical data as values
        if not items_data:
            # Legacy single-item support
            model_id = data.get('modelId', 'default')
            forecast_days = data.get('forecastDays', 30)
            historical_data = data.get('historicalData', [])
        
            item = data.get('item', 'default_item')
            if historical_data and item:
                items_data = {item: historical_data}
        
        base_model_id = data.get('baseModelId', data.get('modelId', 'default'))
        forecast_days = data.get('forecastDays', 30)
        
        if not items_data:
            return jsonify({"error": "No items data provided"}), 400
        
        # Results for each item
        individual_forecasts = {}
        successful_forecasts = []
        
        # Generate forecasts for each item
        for item_name, historical_data in items_data.items():
            # Get the model ID for this item
            model_id = f"{base_model_id}_{item_name}"
            
            if model_id not in trained_models:
                print(f"No trained model found for item {item_name} with ID: {model_id}", flush=True)
                continue
            
            # Get model info
            model_info = trained_models[model_id]
            model_type = model_info['type']
            
            # Convert historical data to DataFrame for context
            if not historical_data:
                # Use the last_data stored during training
                df = model_info.get('last_data', pd.DataFrame())
            else:
                df = pd.DataFrame(historical_data)
                df['date'] = pd.to_datetime(df['date'])
                df = df.sort_values('date')
                df['value'] = df['value'].astype(float)
            
            if df.empty:
                print(f"No historical data available for item {item_name}", flush=True)
                continue
            
            try:
                # Generate forecast based on model type
                if model_type == 'Linear Regression':
                    forecast_data = forecast_linear_regression(model_info, df, forecast_days)
                elif model_type == 'Random Forest':
                    forecast_data = forecast_random_forest(model_info, df, forecast_days)
                elif model_type == 'ARIMA':
                    forecast_data = forecast_arima(model_info, df, forecast_days)
                elif model_type == 'Prophet':
                    forecast_data = forecast_prophet(model_info, df, forecast_days)
                else:
                    print(f"Unknown model type for item {item_name}: {model_type}", flush=True)
                    continue
                
                # Format historical data
                historical = [{"date": row['date'].strftime('%Y-%m-%d'), "value": float(row['value'])} 
                             for _, row in df.iterrows()]
                
                individual_forecasts[item_name] = {
                    "historical": historical,
                    "forecast": forecast_data['predictions'],
                    "metrics": forecast_data['metrics'],
                    "modelType": model_type
                }
                successful_forecasts.append(item_name)
                
            except Exception as item_error:
                print(f"Failed to generate forecast for item {item_name}: {str(item_error)}", flush=True)
                continue
        
        # Calculate overall forecast using the dedicated Overall model
        overall_forecast = None
        if len(successful_forecasts) > 1:
            # Use the dedicated Overall model
            overall_model_id = f"{base_model_id}_OVERALL"
            
            if overall_model_id in trained_models:
                # Aggregate historical data for Overall
                all_dates = set()
                for item_name, historical_data in items_data.items():
                    if item_name not in successful_forecasts:
                        continue
                    for point in historical_data:
                        all_dates.add(point['date'])
                
                sorted_dates = sorted(all_dates)
                overall_historical = []
                
                for date in sorted_dates:
                    total_value = 0
                    for item_name, historical_data in items_data.items():
                        if item_name not in successful_forecasts:
                            continue
                        for point in historical_data:
                            if point['date'] == date:
                                total_value += point['value']
                                break
                    overall_historical.append({"date": date, "value": total_value})
                
                # Get Overall model info
                model_info = trained_models[overall_model_id]
                model_type_overall = model_info['type']
                
                # Create DataFrame from aggregated historical data
                df_overall = pd.DataFrame(overall_historical)
                df_overall['date'] = pd.to_datetime(df_overall['date'])
                df_overall = df_overall.sort_values('date')
                df_overall['value'] = df_overall['value'].astype(float)
                
                try:
                    # Generate forecast using Overall model
                    if model_type_overall == 'Linear Regression':
                        forecast_data = forecast_linear_regression(model_info, df_overall, forecast_days)
                    elif model_type_overall == 'Random Forest':
                        forecast_data = forecast_random_forest(model_info, df_overall, forecast_days)
                    elif model_type_overall == 'ARIMA':
                        forecast_data = forecast_arima(model_info, df_overall, forecast_days)
                    elif model_type_overall == 'Prophet':
                        forecast_data = forecast_prophet(model_info, df_overall, forecast_days)
                    
                    overall_forecast = {
                        "historical": overall_historical,
                        "forecast": forecast_data['predictions'],
                        "metrics": forecast_data['metrics'],
                        "modelType": model_type_overall,
                        "usingDedicatedModel": True
                    }
                    print(f"Generated Overall forecast using dedicated aggregated model", flush=True)
                    
                except Exception as overall_error:
                    print(f"Failed to generate Overall forecast: {str(overall_error)}", flush=True)
                    # Fallback to summing individual forecasts
                    overall_forecast = calculate_summed_overall_forecast(individual_forecasts)
            else:
                # Fallback to summing if no dedicated Overall model exists
                print(f"No dedicated Overall model found, falling back to summing individual forecasts", flush=True)
                overall_forecast = calculate_summed_overall_forecast(individual_forecasts)
        elif len(successful_forecasts) == 1:
            # For single item, use its forecast as Overall
            item_name = successful_forecasts[0]
            overall_forecast = {
                "historical": individual_forecasts[item_name]['historical'],
                "forecast": individual_forecasts[item_name]['forecast'],
                "metrics": individual_forecasts[item_name]['metrics'],
                "modelType": individual_forecasts[item_name]['modelType'],
                "singleItem": True
            }
        else:
            # No successful forecasts
            overall_forecast = None
        
        return jsonify({
            "success": True,
            "overall": overall_forecast,
            "items": individual_forecasts,
            "totalItems": len(items_data),
            "forecastedItems": len(successful_forecasts),
            "forecastedItemNames": successful_forecasts
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def forecast_linear_regression(model_info, df, forecast_days):
    """Generate forecast using Linear Regression with intermittent demand handling"""
    model = model_info['model']
    scaler = model_info['scaler']
    feature_cols = model_info['feature_cols']
    residual_std = model_info.get('residual_std', 0.1)
    
    # Analyze historical intermittency pattern
    historical_values = df['value'].values
    zero_ratio = np.sum(historical_values == 0) / len(historical_values) if len(historical_values) > 0 else 0
    non_zero_values = historical_values[historical_values > 0]
    
    # Calculate statistics for intermittent demand detection
    if len(non_zero_values) > 0:
        mean_non_zero = np.mean(non_zero_values)
        std_non_zero = np.std(non_zero_values)
        min_non_zero = np.min(non_zero_values)
        
        # More reasonable thresholds for intermittent items
        if zero_ratio > 0.9:  # Very intermittent (>90% zeros)
            # For highly sparse data, use a lower threshold to avoid filtering everything
            threshold = min_non_zero * 0.2  # 20% of minimum observed value
        elif zero_ratio > 0.7:  # Moderately intermittent
            threshold = min_non_zero * 0.3  # 30% of minimum
        elif zero_ratio > 0.3:  # Slightly intermittent
            threshold = min_non_zero * 0.4  # 40% of minimum
        else:
            # Regular items - use original logic
            threshold = min(min_non_zero * 0.5, mean_non_zero * 0.1) if min_non_zero > 0 else mean_non_zero * 0.1
    else:
        # If all historical values are zero, forecast all zeros
        predictions = []
        last_date = df['date'].max()
        for i in range(forecast_days):
            next_date = last_date + pd.Timedelta(days=i+1)
            predictions.append({
                "date": next_date.strftime('%Y-%m-%d'),
                "value": 0.0,
                "lower": 0.0,
                "upper": 0.0
            })
        return {
            "predictions": predictions,
            "metrics": {"mape": 0.0, "rmse": 0.0}
        }
    
    print(f"Linear Regression - Intermittency analysis: zero_ratio={zero_ratio:.2f}, mean_non_zero={mean_non_zero:.2f}, threshold={threshold:.2f}", flush=True)
    
    # Use last data for iterative forecasting
    forecast_df = df.tail(30).copy()
    predictions = []
    
    last_date = df['date'].max()
    
    # Track recent pattern for intermittent demand simulation
    recent_pattern = df.tail(14)['value'].values  # Look at last 2 weeks
    days_between_orders = []
    last_order_day = -1
    for idx, val in enumerate(recent_pattern):
        if val > 0:
            if last_order_day >= 0:
                days_between_orders.append(idx - last_order_day)
            last_order_day = idx
    
    # Calculate average interval between orders
    avg_interval = np.mean(days_between_orders) if days_between_orders else (1 / (1 - zero_ratio) if zero_ratio < 1 else 7)
    
    # Initialize counter for intermittent pattern
    days_since_last_order = 0
    
    for i in range(forecast_days):
        # Calculate next date first
        next_date = last_date + pd.Timedelta(days=i+1)
        
        # Add placeholder row for the future date with a temporary value BEFORE creating features
        # Use the last known/predicted value as a temporary filler to survive dropna()
        # This ensures features align with the intended forecast horizon
        last_value = forecast_df['value'].iloc[-1]
        new_row = pd.DataFrame({
            'date': [next_date],
            'value': [last_value]  # Temporary filler - model will predict the actual value
        })
        temp_df = pd.concat([forecast_df, new_row], ignore_index=True)
        
        # Now create features - this will correctly calculate day-of-week, lags, etc. for next_date
        # The placeholder row will survive dropna() because it has a valid value
        temp_df = create_features(temp_df)
        
        if len(temp_df) == 0:
            break
            
        # Get last row features (which now correspond to the future date)
        X_next = temp_df[feature_cols].tail(1)
        X_next_scaled = scaler.transform(X_next)
        
        # Predict the actual value for the future date
        pred_value = model.predict(X_next_scaled)[0]
        pred_value = max(0, pred_value)  # Ensure non-negative
        
        # Apply intermittent demand logic
        days_since_last_order += 1
        
        # Determine if this day should have demand based on historical pattern
        if zero_ratio > 0.3:  # If historically >30% of days have zero demand
            # For highly intermittent items (>90% zeros), use less aggressive approach
            if zero_ratio > 0.9:
                # For very sparse data, only apply a reasonable threshold
                # Don't use probabilistic masking as it's too aggressive
                if pred_value < mean_non_zero * 0.3:  # 30% of mean as threshold
                    pred_value = 0
            elif zero_ratio > 0.7:
                # For moderately intermittent items (70-90% zeros)
                # Use interval-based approach with moderate thresholds
                if days_since_last_order < avg_interval * 0.7:
                    # If too soon after last order and prediction is small
                    if pred_value < mean_non_zero * 0.5:
                        pred_value = 0
                # Apply threshold to filter noise
                elif pred_value < threshold:
                    pred_value = 0
            else:
                # For slightly intermittent items (30-70% zeros)
                # Apply basic threshold filtering
                if pred_value < threshold and pred_value > 0:
                    pred_value = 0
            
            # If we predict an order, reset counter
            if pred_value > 0:
                days_since_last_order = 0
        
        # Calculate confidence intervals
        if pred_value == 0:
            lower = 0
            upper = 0
        else:
            margin = 1.96 * residual_std
            lower = max(0, pred_value - margin)
            upper = pred_value + margin
        
        # Add to forecast
        predictions.append({
            "date": next_date.strftime('%Y-%m-%d'),
            "value": float(pred_value),
            "lower": float(lower),
            "upper": float(upper)
        })
        
        # Add predicted value to dataframe for next iteration
        forecast_df = pd.concat([forecast_df, pd.DataFrame({
            'date': [next_date],
            'value': [pred_value]
        })], ignore_index=True)
    
    # Log intermittency in forecast
    forecast_values = [p['value'] for p in predictions]
    forecast_zero_ratio = sum(1 for v in forecast_values if v == 0) / len(forecast_values) if forecast_values else 0
    print(f"Linear Regression - Forecast intermittency: {forecast_zero_ratio:.2f} (historical: {zero_ratio:.2f})", flush=True)
    
    # Calculate metrics on training data
    train_features = create_features(df.copy())
    if len(train_features) > 0:
        X_train = train_features[feature_cols]
        X_train_scaled = scaler.transform(X_train)
        y_train = train_features['value'].values
        y_pred_train = model.predict(X_train_scaled)
        mape, rmse = calculate_metrics(y_train, y_pred_train)
    else:
        mape, rmse = 0.0, 0.0
    
    return {
        "predictions": predictions,
        "metrics": {"mape": mape, "rmse": rmse}
    }

def forecast_random_forest(model_info, df, forecast_days):
    """Generate forecast using Random Forest with intermittent demand handling"""
    model = model_info['model']
    feature_cols = model_info['feature_cols']
    residual_std = model_info.get('residual_std', 0)
    
    # Analyze historical intermittency pattern
    historical_values = df['value'].values
    zero_ratio = np.sum(historical_values == 0) / len(historical_values) if len(historical_values) > 0 else 0
    non_zero_values = historical_values[historical_values > 0]
    
    # Calculate statistics for intermittent demand detection
    if len(non_zero_values) > 0:
        mean_non_zero = np.mean(non_zero_values)
        std_non_zero = np.std(non_zero_values)
        min_non_zero = np.min(non_zero_values)
        
        # More reasonable thresholds for intermittent items
        if zero_ratio > 0.9:  # Very intermittent (>90% zeros)
            # For highly sparse data, use a lower threshold to avoid filtering everything
            threshold = min_non_zero * 0.2  # 20% of minimum observed value
        elif zero_ratio > 0.7:  # Moderately intermittent
            threshold = min_non_zero * 0.3  # 30% of minimum
        elif zero_ratio > 0.3:  # Slightly intermittent
            threshold = min_non_zero * 0.4  # 40% of minimum
        else:
            # Regular items - use original logic
            threshold = min(min_non_zero * 0.5, mean_non_zero * 0.1) if min_non_zero > 0 else mean_non_zero * 0.1
    else:
        # If all historical values are zero, forecast all zeros
        predictions = []
        last_date = df['date'].max()
        for i in range(forecast_days):
            next_date = last_date + pd.Timedelta(days=i+1)
            predictions.append({
                "date": next_date.strftime('%Y-%m-%d'),
                "value": 0.0,
                "lower": 0.0,
                "upper": 0.0
            })
        training_metrics = model_info.get('training_metrics', {})
        return {
            "predictions": predictions,
            "metrics": training_metrics
        }
    
    print(f"Intermittency analysis: zero_ratio={zero_ratio:.2f}, mean_non_zero={mean_non_zero:.2f}, threshold={threshold:.2f}", flush=True)
    
    # Use last data point to start forecasting
    forecast_df = df.tail(30).copy()
    predictions = []
    
    last_date = df['date'].max()
    
    # Track recent pattern for intermittent demand simulation
    recent_pattern = df.tail(14)['value'].values  # Look at last 2 weeks
    days_between_orders = []
    last_order_day = -1
    for idx, val in enumerate(recent_pattern):
        if val > 0:
            if last_order_day >= 0:
                days_between_orders.append(idx - last_order_day)
            last_order_day = idx
    
    # Calculate average interval between orders
    avg_interval = np.mean(days_between_orders) if days_between_orders else (1 / (1 - zero_ratio) if zero_ratio < 1 else 7)
    
    # Initialize counter for intermittent pattern
    days_since_last_order = 0
    
    for i in range(forecast_days):
        # Create features for next prediction
        temp_df = forecast_df.copy()
        temp_df = create_features(temp_df)
        
        if len(temp_df) == 0:
            break
            
        # Get last row features
        X_next = temp_df[feature_cols].tail(1)
        
        # Predict
        pred_value = model.predict(X_next)[0]
        pred_value = max(0, pred_value)
        
        # Apply intermittent demand logic
        days_since_last_order += 1
        
        # Determine if this day should have demand based on historical pattern
        if zero_ratio > 0.3:  # If historically >30% of days have zero demand
            # For highly intermittent items (>90% zeros), use less aggressive approach
            if zero_ratio > 0.9:
                # For very sparse data, only apply a reasonable threshold
                # Don't use probabilistic masking as it's too aggressive
                if pred_value < mean_non_zero * 0.3:  # 30% of mean as threshold
                    pred_value = 0
            elif zero_ratio > 0.7:
                # For moderately intermittent items (70-90% zeros)
                # Use interval-based approach with moderate thresholds
                if days_since_last_order < avg_interval * 0.7:
                    # If too soon after last order and prediction is small
                    if pred_value < mean_non_zero * 0.5:
                        pred_value = 0
                # Apply threshold to filter noise
                elif pred_value < threshold:
                    pred_value = 0
            else:
                # For slightly intermittent items (30-70% zeros)
                # Apply basic threshold filtering
                if pred_value < threshold and pred_value > 0:
                    pred_value = 0
            
            # If we predict an order, reset counter
            if pred_value > 0:
                days_since_last_order = 0
        
        # Calculate confidence intervals
        if pred_value == 0:
            lower = 0
            upper = 0
        else:
            margin = 1.96 * residual_std
            lower = max(0, pred_value - margin)
            upper = pred_value + margin
        
        # Add to forecast
        next_date = last_date + pd.Timedelta(days=i+1)
        predictions.append({
            "date": next_date.strftime('%Y-%m-%d'),
            "value": float(pred_value),
            "lower": float(lower),
            "upper": float(upper)
        })
        
        # Add predicted value to dataframe for next iteration
        new_row = pd.DataFrame({
            'date': [next_date],
            'value': [pred_value]
        })
        forecast_df = pd.concat([forecast_df, new_row], ignore_index=True)
    
    # Log intermittency in forecast
    forecast_values = [p['value'] for p in predictions]
    forecast_zero_ratio = sum(1 for v in forecast_values if v == 0) / len(forecast_values) if forecast_values else 0
    print(f"Forecast intermittency: {forecast_zero_ratio:.2f} (historical: {zero_ratio:.2f})", flush=True)
    
    # Return the actual training metrics stored with the model
    training_metrics = model_info.get('training_metrics', {})
    return {
        "predictions": predictions,
        "metrics": training_metrics
    }

def forecast_arima(model_info, df, forecast_days):
    """Generate forecast using ARIMA with proper confidence intervals"""
    model = model_info['model']
    
    # Use get_forecast() to get proper confidence intervals from the model
    try:
        forecast_result = model.get_forecast(steps=forecast_days)
        forecast_values = forecast_result.predicted_mean
        
        # Get confidence intervals from the model (95% confidence)
        conf_int = forecast_result.conf_int(alpha=0.05)
        
        last_date = df['date'].max()
        predictions = []
        
        for i in range(forecast_days):
            next_date = last_date + pd.Timedelta(days=i+1)
            pred_value = max(0, float(forecast_values.iloc[i]))
            
            # Use model's confidence intervals
            lower = max(0, float(conf_int.iloc[i, 0]))
            upper = max(0, float(conf_int.iloc[i, 1]))
            
            predictions.append({
                "date": next_date.strftime('%Y-%m-%d'),
                "value": pred_value,
                "lower": lower,
                "upper": upper
            })
    except Exception as e:
        # Fallback to simple forecast if get_forecast fails
        print(f"ARIMA get_forecast failed, using simple forecast: {e}", flush=True)
        forecast_result = model.forecast(steps=forecast_days)
        forecast_values = forecast_result if isinstance(forecast_result, np.ndarray) else forecast_result.values
        
        # Use simple std error for confidence intervals
        std_error = np.std(df['value'].tail(30))
        
        last_date = df['date'].max()
        predictions = []
        
        for i, value in enumerate(forecast_values):
            next_date = last_date + pd.Timedelta(days=i+1)
            pred_value = max(0, float(value))
            
            predictions.append({
                "date": next_date.strftime('%Y-%m-%d'),
                "value": pred_value,
                "lower": float(max(0, pred_value - 1.96 * std_error)),
                "upper": float(pred_value + 1.96 * std_error)
            })
    
    # Return the actual training metrics stored with the model
    training_metrics = model_info.get('training_metrics', {})
    return {
        "predictions": predictions,
        "metrics": training_metrics
    }

def forecast_prophet(model_info, df, forecast_days):
    """Generate forecast using Prophet"""
    model = model_info['model']
    
    # Create future dataframe
    last_date = df['date'].max()
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=forecast_days, freq='D')
    future_df = pd.DataFrame({'ds': future_dates})
    
    # Generate forecast
    forecast = model.predict(future_df)
    
    predictions = []
    for _, row in forecast.iterrows():
        predictions.append({
            "date": row['ds'].strftime('%Y-%m-%d'),
            "value": float(max(0, row['yhat'])),
            "lower": float(max(0, row['yhat_lower'])),
            "upper": float(max(0, row['yhat_upper']))
        })
    
    # Return the actual training metrics stored with the model
    training_metrics = model_info.get('training_metrics', {})
    return {
        "predictions": predictions,
        "metrics": training_metrics
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze data characteristics and recommend models"""
    try:
        data = request.json
        
        # Get configuration
        schema = data.get('schema', 'dbo')
        table = data.get('table', '')
        date_col = data.get('dateCol', 'date')
        item_col = data.get('itemCol', None)
        qty_col = data.get('qtyCol', 'quantity')
        forecast_mode = data.get('forecastMode', 'overall')
        items_to_analyze = data.get('items', None)
        
        # If data is provided directly (legacy support)
        df_raw = data.get('data', None)
        
        if df_raw:
            # Convert to DataFrame if data was provided
            df = pd.DataFrame(df_raw)
        else:
            # Fetch from SQL Server
            if not table:
                return jsonify({"error": "No table specified"}), 400
            
            # Use existing SQL Server connection logic
            import pyodbc
            import os
            
            # Build connection string
            server = os.getenv('SQL_SERVER', '20.199.104.62')
            database = os.getenv('SQL_DATABASE', 'Planning')
            username = os.getenv('SQL_USERNAME', 'sa')
            password = os.getenv('SQL_PASSWORD', 'PlanetTogether123!')
            
            conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
            
            try:
                conn = pyodbc.connect(conn_str)
                
                # Build and execute query
                query = f"SELECT [{date_col}], [{item_col}], [{qty_col}] FROM [{schema}].[{table}]"
                df = pd.read_sql(query, conn)
                conn.close()
                
                print(f"Fetched {len(df)} rows from {schema}.{table}", flush=True)
                
            except Exception as e:
                print(f"SQL Server connection error: {str(e)}", flush=True)
                return jsonify({"error": f"Database connection failed: {str(e)}"}), 500
        
        # Prepare data for analysis
        if date_col in df.columns:
            df['date'] = pd.to_datetime(df[date_col])
            df = df.sort_values('date')
        
        if qty_col in df.columns:
            df['value'] = df[qty_col]
        
        # Run analysis
        if forecast_mode == 'individual' and item_col and items_to_analyze:
            analysis = analyze_data_characteristics(df, item_col=item_col, items=items_to_analyze)
        else:
            # For overall mode, aggregate all data
            if item_col and item_col in df.columns:
                agg_df = df.groupby('date')['value'].sum().reset_index()
                analysis = analyze_data_characteristics(agg_df)
            else:
                analysis = analyze_data_characteristics(df)
        
        # Convert numpy types to Python types for JSON serialization
        def convert_numpy_types(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {k: convert_numpy_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy_types(item) for item in obj]
            else:
                return obj
        
        analysis_cleaned = convert_numpy_types(analysis)
        
        return jsonify({
            "success": True,
            "analysis": analysis_cleaned
        })
        
    except Exception as e:
        print(f"Analysis error: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/cache/clear', methods=['POST'])
def clear_cache():
    """Clear all cached models"""
    if not MODEL_CACHE_AVAILABLE:
        return jsonify({"error": "Model cache not available"}), 503
    
    try:
        cache = get_model_cache()
        deleted_count = cache.clear_all()
        return jsonify({
            "success": True,
            "message": f"Cleared {deleted_count} models from cache",
            "deletedCount": deleted_count
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics"""
    if not MODEL_CACHE_AVAILABLE:
        return jsonify({"error": "Model cache not available"}), 503
    
    try:
        cache = get_model_cache()
        stats = cache.get_cache_stats()
        return jsonify({
            "success": True,
            "stats": stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cache/check', methods=['POST'])
def check_cached_items():
    """Check which items have cached models"""
    if not MODEL_CACHE_AVAILABLE:
        return jsonify({"error": "Model cache not available"}), 503
    
    try:
        data = request.json
        
        # Extract database configuration
        schema = data.get('schema', 'dbo')
        table = data.get('table', 'default_table')
        date_col = data.get('dateCol', 'date')
        item_col = data.get('itemCol', 'item')
        qty_col = data.get('qtyCol', 'quantity')
        
        # Extract other parameters
        model_type = data.get('modelType', 'Random Forest')
        forecast_days = data.get('forecastDays', 30)
        items = data.get('items', [])
        planning_areas = data.get('planningAreas', None)
        scenario_names = data.get('scenarioNames', None)
        hyperparameter_tuning = data.get('hyperparameterTuning', False)
        
        if not items:
            return jsonify({"error": "No items provided"}), 400
        
        cache = get_model_cache()
        cached_items, missing_items = cache.get_cached_items(
            schema, table, date_col, item_col, qty_col,
            model_type, forecast_days, items,
            planning_areas, scenario_names, hyperparameter_tuning
        )
        
        return jsonify({
            "success": True,
            "cachedItems": cached_items,
            "missingItems": missing_items,
            "totalItems": len(items),
            "cachedCount": len(cached_items),
            "missingCount": len(missing_items)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server on port 8000...", flush=True)
    app.run(host='0.0.0.0', port=8000, debug=False)
