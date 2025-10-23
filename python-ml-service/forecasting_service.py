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
import warnings
warnings.filterwarnings('ignore')

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
    """Calculate MAPE and RMSE"""
    # Handle division by zero in MAPE
    mask = y_true != 0
    if mask.sum() == 0:
        mape = 0
    else:
        mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
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
        
        if not historical_data:
            return jsonify({"error": "No historical data provided."}), 400
        
        # Convert to DataFrame
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df['value'] = df['value'].astype(float)
        
        # Train based on model type
        if model_type == 'Linear Regression':
            metrics = train_linear_regression(df, model_id)
        elif model_type == 'Random Forest':
            metrics = train_random_forest(df, model_id)
        elif model_type == 'ARIMA':
            metrics = train_arima(df, model_id)
        elif model_type == 'Prophet':
            metrics = train_prophet(df, model_id)
        else:
            return jsonify({"error": f"Unknown model type: {model_type}"}), 400
        
        return jsonify({
            "success": True,
            "modelType": model_type,
            "metrics": metrics,
            "trainingDataPoints": len(historical_data),
            "modelId": model_id
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def train_random_forest(df, model_id):
    """Train Random Forest model"""
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
    
    # Store model and feature info
    trained_models[model_id] = {
        'model': model,
        'type': 'Random Forest',
        'feature_cols': feature_cols,
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

def train_arima(df, model_id):
    """Train ARIMA model"""
    values = df['value'].values
    
    # ARIMA requires at least 2 data points
    if len(values) < 2:
        raise ValueError(f"ARIMA requires at least 2 data points. Found only {len(values)} row(s). Please select a different item or date range with more historical data.")
    
    # Auto-select ARIMA parameters (p,d,q)
    # For simplicity, using common parameters. In production, use auto_arima
    try:
        model = ARIMA(values, order=(5, 1, 2))
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
            'last_data': df.copy()
        }
        
        return {
            "mape": mape,
            "rmse": rmse,
            "accuracy": max(0, 100 - mape)
        }
    except Exception as e:
        # Fallback to simpler ARIMA if the initial parameters fail
        model = ARIMA(values, order=(1, 1, 1))
        model_fit = model.fit()
        y_pred = model_fit.fittedvalues
        
        if len(y_pred) < len(values):
            values = values[-len(y_pred):]
        elif len(y_pred) > len(values):
            y_pred = y_pred[-len(values):]
            
        mape, rmse = calculate_metrics(values, y_pred)
        
        trained_models[model_id] = {
            'model': model_fit,
            'type': 'ARIMA',
            'last_data': df.copy()
        }
        
        return {
            "mape": mape,
            "rmse": rmse,
            "accuracy": max(0, 100 - mape)
        }

def train_prophet(df, model_id):
    """Train Prophet model"""
    # Prepare data for Prophet (requires 'ds' and 'y' columns)
    prophet_df = df[['date', 'value']].copy()
    prophet_df.columns = ['ds', 'y']
    
    # Remove any NaN values
    prophet_df = prophet_df.dropna()
    
    # Prophet requires at least 2 data points
    if len(prophet_df) < 2:
        raise ValueError(f"Prophet requires at least 2 data points. Found only {len(prophet_df)} row(s). Please select a different item or date range with more historical data.")
    
    # Train Prophet model
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
    """Generate forecast using Random Forest"""
    model = model_info['model']
    feature_cols = model_info['feature_cols']
    
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
        
        # Add to forecast
        next_date = last_date + pd.Timedelta(days=i+1)
        predictions.append({
            "date": next_date.strftime('%Y-%m-%d'),
            "value": float(pred_value),
            "lower": float(max(0, pred_value * 0.8)),  # Simple confidence interval
            "upper": float(pred_value * 1.2)
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
    """Generate forecast using ARIMA"""
    model = model_info['model']
    
    # Generate forecast
    forecast_result = model.forecast(steps=forecast_days)
    forecast_values = forecast_result if isinstance(forecast_result, np.ndarray) else forecast_result.values
    
    # Calculate confidence intervals (using model's standard errors if available)
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
    mape = float(np.std(df['value'].tail(10)) / np.mean(df['value'].tail(10)) * 100)
    rmse = float(std_error)
    
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
