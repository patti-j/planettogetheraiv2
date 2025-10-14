import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Lazy import for heavy libraries
def get_sklearn_imports():
    """Lazy import sklearn to avoid startup delays"""
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import GridSearchCV, TimeSeriesSplit
    from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error
    return RandomForestRegressor, StandardScaler, GridSearchCV, TimeSeriesSplit, mean_absolute_error, mean_squared_error, mean_absolute_percentage_error

def get_arima_imports():
    """Lazy import ARIMA to avoid startup delays"""
    try:
        from statsmodels.tsa.arima.model import ARIMA
        return ARIMA, True
    except ImportError:
        return None, False

def get_prophet_imports():
    """Lazy import Prophet to avoid startup delays"""
    try:
        from prophet import Prophet
        return Prophet, True
    except ImportError:
        return None, False

class SimpleDemandForecaster:
    """Lightweight demand forecasting for sales orders"""
    
    def __init__(self):
        self.scaler = None
        self.model = None
        self.model_type = None
        
    def prepare_sales_data(self, df, date_col, target_col):
        """Prepare sales orders data for forecasting"""
        
        # Create a copy and ensure date column is datetime
        data = df.copy()
        data[date_col] = pd.to_datetime(data[date_col])
        
        # Aggregate by date if multiple entries per day
        daily_data = data.groupby(date_col)[target_col].sum().reset_index()
        daily_data = daily_data.sort_values(date_col).reset_index(drop=True)
        
        # Fill missing dates
        date_range = pd.date_range(start=daily_data[date_col].min(), 
                                 end=daily_data[date_col].max(), 
                                 freq='D')
        
        full_data = pd.DataFrame({date_col: date_range})
        full_data = full_data.merge(daily_data, on=date_col, how='left')
        full_data[target_col] = full_data[target_col].fillna(0)
        
        return full_data
    
    def create_lag_features(self, data, target_col, lags=[1, 7, 14, 30]):
        """Create lag features for demand forecasting"""
        
        # Ensure we have enough data
        if len(data) < 2:
            raise ValueError("Need at least 2 data points to create features")
        
        # Create a copy to avoid modifying original data
        feature_data = data.copy()
        
        # Create lag features
        for lag in lags:
            feature_data[f'lag_{lag}'] = feature_data[target_col].shift(lag)
            
        # Rolling averages with minimum periods
        feature_data['ma_7'] = feature_data[target_col].rolling(window=7, min_periods=1).mean()
        feature_data['ma_30'] = feature_data[target_col].rolling(window=30, min_periods=1).mean()
        
        # Trend indicators
        feature_data['trend_7'] = feature_data[target_col] - feature_data['ma_7']
        feature_data['momentum'] = feature_data[target_col].diff()
        
        # List of feature columns
        feature_cols = [f'lag_{lag}' for lag in lags] + ['ma_7', 'ma_30', 'trend_7', 'momentum']
        
        # Fill NaN values more carefully
        for col in feature_cols:
            if col in feature_data.columns:
                # Forward fill, then backward fill, then fill remaining with 0
                feature_data[col] = feature_data[col].fillna(method='ffill')
                feature_data[col] = feature_data[col].fillna(method='bfill')
                feature_data[col] = feature_data[col].fillna(0)
            
        return feature_data, feature_cols
    
    def train_random_forest(self, data, target_col, feature_cols, forecast_days=30):
        """Train Random Forest model for demand forecasting"""
        
        # Import sklearn components
        RandomForestRegressor, StandardScaler, GridSearchCV, TimeSeriesSplit, mae, mse, mape = get_sklearn_imports()
        
        # Prepare training data
        train_data = data.dropna()
        X = train_data[feature_cols].values
        y = train_data[target_col].values
        
        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model with basic hyperparameter tuning
        param_grid = {
            'n_estimators': [50, 100],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5]
        }
        
        rf = RandomForestRegressor(random_state=42)
        
        # Use time series split for validation
        tscv = TimeSeriesSplit(n_splits=3)
        grid_search = GridSearchCV(rf, param_grid, cv=tscv, scoring='neg_mean_squared_error', n_jobs=-1)
        grid_search.fit(X_scaled, y)
        
        self.model = grid_search.best_estimator_
        self.model_type = "Random Forest"
        
        # Calculate training metrics
        train_pred = self.model.predict(X_scaled)
        metrics = {
            'MAE': mae(y, train_pred),
            'RMSE': np.sqrt(mse(y, train_pred)),
            'MAPE': mape(y, train_pred) * 100
        }
        
        return metrics
    
    def train_arima(self, data, target_col, forecast_days=30):
        """Train ARIMA model for demand forecasting"""
        
        ARIMA, available = get_arima_imports()
        if not available:
            raise ImportError("ARIMA not available. Install statsmodels.")
        
        # Prepare time series
        ts_data = data[target_col].values
        
        # Auto ARIMA with basic parameter search
        best_aic = float('inf')
        best_model = None
        
        for p in [1, 2, 3]:
            for d in [0, 1]:
                for q in [1, 2, 3]:
                    try:
                        model = ARIMA(ts_data, order=(p, d, q))
                        fitted_model = model.fit()
                        if fitted_model.aic < best_aic:
                            best_aic = fitted_model.aic
                            best_model = fitted_model
                    except:
                        continue
        
        if best_model is None:
            # Fallback to simple ARIMA
            model = ARIMA(ts_data, order=(1, 1, 1))
            best_model = model.fit()
        
        self.model = best_model
        self.model_type = "ARIMA"
        
        # Calculate training metrics
        fitted_values = best_model.fittedvalues
        residuals = ts_data[1:] - fitted_values  # ARIMA starts from index 1
        
        mae_val = np.mean(np.abs(residuals))
        rmse_val = np.sqrt(np.mean(residuals**2))
        mape_val = np.mean(np.abs(residuals / ts_data[1:]) * 100)
        
        metrics = {
            'MAE': mae_val,
            'RMSE': rmse_val,
            'MAPE': mape_val
        }
        
        return metrics
    
    def train_prophet(self, data, date_col, target_col, forecast_days=30):
        """Train Prophet model for demand forecasting"""
        
        Prophet, available = get_prophet_imports()
        if not available:
            raise ImportError("Prophet not available. Install prophet.")
        
        # Prepare Prophet data format
        prophet_data = data[[date_col, target_col]].copy()
        prophet_data.columns = ['ds', 'y']
        
        # Initialize and train Prophet
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode='multiplicative'
        )
        
        model.fit(prophet_data)
        
        self.model = model
        self.model_type = "Prophet"
        
        # Calculate training metrics
        forecast = model.predict(prophet_data)
        y_true = prophet_data['y'].values
        y_pred = forecast['yhat'].values
        
        metrics = {
            'MAE': np.mean(np.abs(y_true - y_pred)),
            'RMSE': np.sqrt(np.mean((y_true - y_pred)**2)),
            'MAPE': np.mean(np.abs((y_true - y_pred) / y_true) * 100)
        }
        
        return metrics
    
    def forecast_demand(self, data, date_col, target_col, feature_cols, forecast_days=30, global_start_date=None):
        """Generate demand forecast"""
        
        if self.model is None:
            raise ValueError("Model not trained. Call train_* method first.")
        
        if self.model_type == "Random Forest":
            return self._forecast_rf(data, target_col, feature_cols, forecast_days, global_start_date)
        elif self.model_type == "ARIMA":
            return self._forecast_arima(data, date_col, forecast_days, global_start_date)
        elif self.model_type == "Prophet":
            return self._forecast_prophet(data, date_col, forecast_days, global_start_date)
        
    def _forecast_rf(self, data, target_col, feature_cols, forecast_days, global_start_date=None):
        """Random Forest forecasting"""
        
        # Ensure data is a DataFrame
        if not isinstance(data, pd.DataFrame):
            raise ValueError("Data must be a pandas DataFrame for Random Forest forecasting")
        
        predictions = []
        forecast_data = data.copy()
        
        # Get the date column (assume it's the first column)
        date_col_name = forecast_data.columns[0]
        
        # Use global start date if provided, otherwise fall back to filtered data's last date
        if global_start_date is not None:
            last_date = pd.to_datetime(global_start_date)
        else:
            last_date = pd.to_datetime(forecast_data[date_col_name].iloc[-1])
        
        for i in range(forecast_days):
            # Get last row features, ensure they exist
            if len(forecast_data) == 0:
                break
                
            try:
                # Get features for the last row
                last_features = forecast_data[feature_cols].iloc[-1:]
                
                # Check if we have valid features
                if last_features.isnull().any().any():
                    # Fill NaN values with 0
                    last_features = last_features.fillna(0)
                
                last_features_array = last_features.values
                
                # Ensure array shape is correct
                if last_features_array.shape[0] != 1 or last_features_array.shape[1] != len(feature_cols):
                    break
                    
                last_features_scaled = self.scaler.transform(last_features_array)
                
                # Predict next value
                pred = self.model.predict(last_features_scaled)[0]
                predictions.append(max(0, pred))  # Ensure non-negative demand
                
                # Create new row for next prediction
                new_date = last_date + timedelta(days=i+1)
                new_row = forecast_data.iloc[-1:].copy()
                new_row[date_col_name] = new_date
                new_row[target_col] = pred
                
                # Update lag features safely
                for col in feature_cols:
                    if 'lag_1' in col and len(forecast_data) >= 1:
                        new_row[col] = forecast_data[target_col].iloc[-1]
                    elif 'lag_7' in col and len(forecast_data) >= 7:
                        new_row[col] = forecast_data[target_col].iloc[-7]
                    elif 'ma_7' in col and len(forecast_data) >= 7:
                        new_row[col] = forecast_data[target_col].tail(7).mean()
                    elif 'ma_30' in col and len(forecast_data) >= 30:
                        new_row[col] = forecast_data[target_col].tail(30).mean()
                    else:
                        # Use last available value or 0
                        new_row[col] = forecast_data[col].iloc[-1] if len(forecast_data) > 0 else 0
                
                forecast_data = pd.concat([forecast_data, new_row], ignore_index=True)
                
            except Exception as e:
                # If any error occurs, stop forecasting
                print(f"Forecasting stopped at day {i}: {str(e)}")
                break
        
        # Create forecast dates
        start_date = last_date + timedelta(days=1)
        forecast_dates = pd.date_range(start=start_date, periods=len(predictions), freq='D')
        
        return {
            'dates': forecast_dates,
            'values': predictions,
            'lower_bound': [p * 0.8 for p in predictions],  # Simple confidence interval
            'upper_bound': [p * 1.2 for p in predictions]
        }
    
    def _forecast_arima(self, data, date_col, forecast_days, global_start_date=None):
        """ARIMA forecasting"""
        
        try:
            forecast = self.model.forecast(steps=forecast_days)
            forecast_obj = self.model.get_forecast(steps=forecast_days)
            conf_int = forecast_obj.conf_int()
            
            # Use global start date if provided, otherwise fall back to filtered data's last date
            if global_start_date is not None:
                last_date = pd.to_datetime(global_start_date)
            elif isinstance(data, pd.DataFrame):
                last_date = pd.to_datetime(data[date_col].iloc[-1])
            else:
                # Fallback: use current date
                last_date = pd.Timestamp.now().normalize()
            
            forecast_dates = pd.date_range(start=last_date + timedelta(days=1), periods=forecast_days, freq='D')
            
            # Handle confidence intervals safely
            if hasattr(conf_int, 'iloc'):
                lower_bound = [max(0, x) for x in conf_int.iloc[:, 0]]
                upper_bound = [max(0, x) for x in conf_int.iloc[:, 1]]
            else:
                # Fallback confidence intervals
                forecast_array = np.array(forecast)
                lower_bound = [max(0, x * 0.8) for x in forecast_array]
                upper_bound = [max(0, x * 1.2) for x in forecast_array]
            
            return {
                'dates': forecast_dates,
                'values': [max(0, x) for x in forecast],  # Ensure non-negative
                'lower_bound': lower_bound,
                'upper_bound': upper_bound
            }
            
        except Exception as e:
            # Fallback: simple forecast without confidence intervals
            print(f"ARIMA forecasting error: {str(e)}")
            
            # Use simple extrapolation as fallback
            if global_start_date is not None:
                last_date = pd.to_datetime(global_start_date)
            elif isinstance(data, pd.DataFrame):
                last_date = pd.to_datetime(data[date_col].iloc[-1])
            else:
                last_date = pd.Timestamp.now().normalize()
                
            if isinstance(data, pd.DataFrame):
                last_values = data.iloc[-7:, -1].values if len(data) >= 7 else [0]
            else:
                last_values = [0]
            
            forecast_dates = pd.date_range(start=last_date + timedelta(days=1), periods=forecast_days, freq='D')
            simple_forecast = [max(0, np.mean(last_values))] * forecast_days
            
            return {
                'dates': forecast_dates,
                'values': simple_forecast,
                'lower_bound': [x * 0.8 for x in simple_forecast],
                'upper_bound': [x * 1.2 for x in simple_forecast]
            }
    
    def _forecast_prophet(self, data, date_col, forecast_days, global_start_date=None):
        """Prophet forecasting"""
        
        # Create future dataframe
        if global_start_date is not None:
            # For Prophet, we need to create a custom future dataframe using the global start date
            global_start = pd.to_datetime(global_start_date)
            forecast_dates = pd.date_range(start=global_start + timedelta(days=1), periods=forecast_days, freq='D')
            future = pd.DataFrame({'ds': forecast_dates})
        else:
            # Use Prophet's default behavior (starts from last date in training data)
            future = self.model.make_future_dataframe(periods=forecast_days)
            
        forecast = self.model.predict(future)
        
        # Get only future predictions (last forecast_days rows)
        future_forecast = forecast.tail(forecast_days)
        
        return {
            'dates': pd.to_datetime(future_forecast['ds']),
            'values': [max(0, x) for x in future_forecast['yhat']],  # Ensure non-negative
            'lower_bound': [max(0, x) for x in future_forecast['yhat_lower']],
            'upper_bound': [max(0, x) for x in future_forecast['yhat_upper']]
        }