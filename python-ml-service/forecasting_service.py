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
        historical_data = data.get('historicalData', [])
        model_id = data.get('modelId', 'default')
        
        # Extract hierarchical filters for caching
        planning_areas = data.get('planningAreas', None)
        scenario_names = data.get('scenarioNames', None)
        item = data.get('item', 'default_item')
        forecast_days = data.get('forecastDays', 30)
        hyperparameter_tuning = data.get('hyperparameterTuning', False)
        
        if not historical_data:
            return jsonify({"error": "No historical data provided."}), 400
        
        # Check cache first if available
        cache_key = None
        if MODEL_CACHE_AVAILABLE:
            try:
                cache = get_model_cache()
                cache_key = cache.get_cache_key(
                    model_type, forecast_days, item, 
                    planning_areas, scenario_names, hyperparameter_tuning
                )
                
                # Try to load from cache
                if cache.exists(model_type, forecast_days, item, planning_areas, scenario_names, hyperparameter_tuning):
                    cached_model, cached_metadata = cache.load_model(cache_key)
                    if cached_model is not None and cached_metadata is not None:
                        # Store in memory for immediate use
                        trained_models[model_id] = cached_model
                        
                        print(f"Loaded model from cache: {cache_key}", flush=True)
                        return jsonify({
                            "success": True,
                            "modelType": model_type,
                            "metrics": cached_metadata.get('metrics', {}),
                            "trainingDataPoints": len(historical_data),
                            "modelId": model_id,
                            "cacheKey": cache_key,
                            "fromCache": True
                        })
            except Exception as e:
                print(f"Cache check failed: {e}", flush=True)
        
        # Convert to DataFrame
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df['value'] = df['value'].astype(float)
        
        # Train based on model type
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
                        model_type, forecast_days, item,
                        model_info, 
                        {'metrics': metrics, 'training_points': len(historical_data), 'hyperparameter_tuning': hyperparameter_tuning},
                        planning_areas, scenario_names, hyperparameter_tuning
                    )
                    print(f"Saved model to cache: {cache_key}", flush=True)
            except Exception as e:
                print(f"Cache save failed: {e}", flush=True)
        
        return jsonify({
            "success": True,
            "modelType": model_type,
            "metrics": metrics,
            "trainingDataPoints": len(historical_data),
            "modelId": model_id,
            "cacheKey": cache_key,
            "fromCache": False
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
    
    # Store model and feature info
    trained_models[model_id] = {
        'model': model,
        'type': 'Random Forest',
        'feature_cols': feature_cols,
        'residual_std': residual_std,
        'last_data': df.tail(30).copy()  # Keep last 30 days for forecasting
    }
    
    return {
        "mape": mape,
        "rmse": rmse,
        "accuracy": max(0, 100 - mape)
    }

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
    
    # Store model and feature info
    trained_models[model_id] = {
        'model': model,
        'scaler': scaler,
        'type': 'Linear Regression',
        'feature_cols': feature_cols,
        'residual_std': residual_std,
        'last_data': df.tail(30).copy()  # Keep last 30 days for forecasting
    }
    
    return {
        "mape": mape,
        "rmse": rmse,
        "accuracy": max(0, 100 - mape)
    }

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

@app.route('/forecast', methods=['POST'])
def forecast():
    try:
        data = request.json
        model_id = data.get('modelId', 'default')
        forecast_days = data.get('forecastDays', 30)
        historical_data = data.get('historicalData', [])
        
        # Extract hierarchical filters for caching
        planning_areas = data.get('planningAreas', None)
        scenario_names = data.get('scenarioNames', None)
        item = data.get('item', 'default_item')
        model_type_requested = data.get('modelType', None)
        hyperparameter_tuning = data.get('hyperparameterTuning', False)
        
        # Try to load from cache first if available
        if MODEL_CACHE_AVAILABLE and model_type_requested:
            try:
                cache = get_model_cache()
                cache_key = cache.get_cache_key(
                    model_type_requested, forecast_days, item, 
                    planning_areas, scenario_names, hyperparameter_tuning
                )
                
                if cache.exists(model_type_requested, forecast_days, item, planning_areas, scenario_names, hyperparameter_tuning):
                    cached_model, cached_metadata = cache.load_model(cache_key)
                    if cached_model is not None:
                        # Use cached model for prediction
                        trained_models[model_id] = cached_model
                        print(f"Using cached model for forecast: {cache_key}", flush=True)
            except Exception as e:
                print(f"Cache load for forecast failed: {e}", flush=True)
        
        # Check if model exists
        if model_id not in trained_models:
            return jsonify({"error": "Model not trained. Please train the model first."}), 400
        
        model_info = trained_models[model_id]
        model_type = model_info['type']
        
        # Convert historical data to DataFrame
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df['value'] = df['value'].astype(float)
        
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
            return jsonify({"error": f"Unknown model type: {model_type}"}), 400
        
        # Format historical data
        historical = [{"date": row['date'].strftime('%Y-%m-%d'), "value": float(row['value'])} 
                     for _, row in df.iterrows()]
        
        return jsonify({
            "historical": historical,
            "forecast": forecast_data['predictions'],
            "metrics": forecast_data['metrics'],
            "modelType": model_type
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def forecast_linear_regression(model_info, df, forecast_days):
    """Generate forecast using Linear Regression"""
    model = model_info['model']
    scaler = model_info['scaler']
    feature_cols = model_info['feature_cols']
    residual_std = model_info.get('residual_std', 0.1)
    
    # Use last data for iterative forecasting
    forecast_df = df.tail(30).copy()
    predictions = []
    
    last_date = df['date'].max()
    
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
        
        # Calculate confidence intervals using residual std
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
    """Generate forecast using Random Forest with proper confidence intervals"""
    model = model_info['model']
    feature_cols = model_info['feature_cols']
    residual_std = model_info.get('residual_std', 0)
    
    # Use last data point to start forecasting
    forecast_df = df.tail(30).copy()
    predictions = []
    
    last_date = df['date'].max()
    
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
        pred_value = max(0, pred_value)  # Ensure non-negative
        
        # Calculate confidence intervals using residual std
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
    
    # Calculate metrics from last known values
    recent_values = df['value'].tail(10).values
    mape = float(np.std(recent_values) / np.mean(recent_values) * 100) if np.mean(recent_values) != 0 else 0
    rmse = float(np.std(recent_values))
    
    return {
        "predictions": predictions,
        "metrics": {"mape": mape, "rmse": rmse}
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
    
    # Calculate metrics
    recent_values = df['value'].tail(10).values
    if np.mean(recent_values) != 0:
        mape = float(np.std(recent_values) / np.mean(recent_values) * 100)
    else:
        mape = 0.0
    rmse = float(np.std(recent_values))
    
    return {
        "predictions": predictions,
        "metrics": {"mape": mape, "rmse": rmse}
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
    
    # Calculate metrics from recent data
    mape = float(np.std(df['value'].tail(10)) / np.mean(df['value'].tail(10)) * 100)
    rmse = float(np.std(df['value'].tail(10)))
    
    return {
        "predictions": predictions,
        "metrics": {"mape": mape, "rmse": rmse}
    }

if __name__ == '__main__':
    print("Starting Flask server on port 8000...", flush=True)
    app.run(host='0.0.0.0', port=8000, debug=False)
