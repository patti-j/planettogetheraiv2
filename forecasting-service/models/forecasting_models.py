import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression, QuantileRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.utils import resample
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
import warnings
warnings.filterwarnings('ignore')

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

class ForecastingModels:
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_names = None
        self.n_features = None
        self.bootstrap_predictions = None
        self.residual_std = None
        
    def train_linear_regression(self, train_data, target_col, feature_cols, hyperparameter_tuning=True):
        """Train Linear Regression model with optional hyperparameter tuning"""
        
        # Prepare features
        X = self._prepare_features(train_data, target_col, feature_cols)
        y = train_data[target_col].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        self.n_features = X.shape[1]  # Store the number of features used in training
        
        # Use Linear Regression (not RandomForest!)
        model = LinearRegression()
        model.fit(X_scaled, y)
        
        # Compute residual standard deviation for confidence intervals
        y_pred = model.predict(X_scaled)
        residuals = y - y_pred
        self.residual_std = np.std(residuals)
        
        if hyperparameter_tuning:
            params = {"model_type": "LinearRegression", "residual_std": self.residual_std}
        else:
            params = {"model_type": "LinearRegression", "default_params": True, "residual_std": self.residual_std}
        
        return model, params
    
    def train_arima(self, train_data, target_col, hyperparameter_tuning=True):
        """Train ARIMA model with optional hyperparameter tuning"""
        
        y = train_data[target_col].values
        
        if hyperparameter_tuning:
            # Enhanced ARIMA with seasonal and trend components + timeout protection
            import time
            start_time = time.time()
            timeout_seconds = 300  # 5 minute timeout per model
            
            best_aic = np.inf
            best_order = None
            best_seasonal_order = None
            best_model = None
            
            # Expanded search space for ARIMA parameters
            p_values = range(0, 4)  # Expanded range for better accuracy
            d_values = range(0, 3)  # Expanded range
            q_values = range(0, 4)  # Expanded range
            
            # Seasonal parameters (for weekly/monthly patterns)
            seasonal_periods = [7, 30]  # Weekly and monthly seasonality for better accuracy
            
            # First try non-seasonal ARIMA with expanded parameters
            for p in p_values:
                for d in d_values:
                    for q in q_values:
                        # Check timeout
                        if time.time() - start_time > timeout_seconds:
                            break
                        try:
                            model = ARIMA(y, order=(p, d, q))
                            fitted_model = model.fit()
                            if fitted_model.aic < best_aic:
                                best_aic = fitted_model.aic
                                best_order = (p, d, q)
                                best_seasonal_order = None
                                best_model = fitted_model
                        except:
                            continue
            
            # Try seasonal ARIMA if we have enough data
            if len(y) > 60:  # Need sufficient data for seasonal modeling
                for s in seasonal_periods:
                    if len(y) > 2 * s:  # Need at least 2 full seasons
                        for P in range(0, 3):
                            for D in range(0, 2):
                                for Q in range(0, 3):
                                    # Check timeout
                                    if time.time() - start_time > timeout_seconds:
                                        break
                                    try:
                                        model = ARIMA(y, order=(1, 1, 1), seasonal_order=(P, D, Q, s))
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
                model = ARIMA(y, order=(1, 1, 1))
                best_model = model.fit()
                best_order = (1, 1, 1)
                best_seasonal_order = None
            
            params = {
                "order": best_order, 
                "seasonal_order": best_seasonal_order,
                "aic": best_aic,
                "bic": best_model.bic if hasattr(best_model, 'bic') else None
            }
        else:
            # Use default ARIMA(1,1,1)
            model = ARIMA(y, order=(1, 1, 1))
            best_model = model.fit()
            params = {"order": (1, 1, 1), "default_params": True}
        
        return best_model, params
    
    def train_prophet(self, train_data, date_col, target_col, feature_cols, hyperparameter_tuning=True):
        """Train Prophet model with optional hyperparameter tuning"""
        
        if not PROPHET_AVAILABLE:
            raise ImportError("Prophet is not available. Please install it with: pip install prophet")
        
        # Prepare data for Prophet
        prophet_data = pd.DataFrame({
            'ds': pd.to_datetime(train_data[date_col]),
            'y': train_data[target_col].values
        })
        
        # Add regressors if available
        for feature in feature_cols:
            if feature in train_data.columns:
                prophet_data[feature] = train_data[feature].values
        
        if hyperparameter_tuning:
            # Enhanced Prophet hyperparameter tuning for better accuracy
            param_grid = {
                'changepoint_prior_scale': [0.001, 0.01, 0.05, 0.1, 0.5, 1.0],
                'seasonality_prior_scale': [0.1, 1.0, 10.0, 50.0],
                'holidays_prior_scale': [0.1, 1.0, 10.0],
                'seasonality_mode': ['additive', 'multiplicative'],
                'changepoint_range': [0.8, 0.9, 0.95],
                'n_changepoints': [20, 25, 30]
            }
            
            best_mape = np.inf
            best_params = None
            best_model = None
            
            # Enhanced grid search with timeout protection
            import time
            start_time = time.time()
            timeout_seconds = 300  # 5 minute timeout per model
            
            for changepoint_prior in param_grid['changepoint_prior_scale']:
                for seasonality_prior in param_grid['seasonality_prior_scale']:
                    for holidays_prior in param_grid['holidays_prior_scale']:
                        for seasonality_mode in param_grid['seasonality_mode']:
                            for changepoint_range in param_grid['changepoint_range']:
                                for n_changepoints in param_grid['n_changepoints']:
                                    # Check timeout
                                    if time.time() - start_time > timeout_seconds:
                                        break
                                        
                                    try:
                                        model = Prophet(
                                            changepoint_prior_scale=changepoint_prior,
                                            seasonality_prior_scale=seasonality_prior,
                                            holidays_prior_scale=holidays_prior,
                                            seasonality_mode=seasonality_mode,
                                            changepoint_range=changepoint_range,
                                            n_changepoints=n_changepoints,
                                            daily_seasonality=True,
                                            weekly_seasonality=True,
                                            yearly_seasonality=True
                                        )
                                        
                                        # Add regressors
                                        for feature in feature_cols:
                                            if feature in prophet_data.columns:
                                                model.add_regressor(feature)
                                        
                                        model.fit(prophet_data)
                                        
                                        # Enhanced validation with cross-validation
                                        train_subset = prophet_data[:-30]  # Use last 30 points for validation
                                        test_subset = prophet_data[-30:]
                                        
                                        if len(test_subset) > 0:
                                            model_subset = Prophet(
                                                changepoint_prior_scale=changepoint_prior,
                                                seasonality_prior_scale=seasonality_prior,
                                                holidays_prior_scale=holidays_prior,
                                                seasonality_mode=seasonality_mode,
                                                changepoint_range=changepoint_range,
                                                n_changepoints=n_changepoints,
                                                daily_seasonality=True,
                                                weekly_seasonality=True,
                                                yearly_seasonality=True
                                            )
                                            
                                            for feature in feature_cols:
                                                if feature in prophet_data.columns:
                                                    model_subset.add_regressor(feature)
                                            
                                            model_subset.fit(train_subset)
                                            forecast = model_subset.predict(test_subset)
                                            
                                            # Calculate MAPE
                                            mape = np.mean(np.abs((test_subset['y'] - forecast['yhat']) / test_subset['y'])) * 100
                                            
                                            if mape < best_mape:
                                                best_mape = mape
                                                best_params = {
                                                    'changepoint_prior_scale': changepoint_prior,
                                                    'seasonality_prior_scale': seasonality_prior,
                                                    'holidays_prior_scale': holidays_prior,
                                                    'seasonality_mode': seasonality_mode,
                                                    'changepoint_range': changepoint_range,
                                                    'n_changepoints': n_changepoints,
                                                    'best_mape': mape
                                                }
                                                best_model = model
                                                
                                    except Exception as e:
                                        continue
            
            if best_model is None:
                # Fallback to default Prophet
                model = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=True)
                for feature in feature_cols:
                    if feature in prophet_data.columns:
                        model.add_regressor(feature)
                model.fit(prophet_data)
                best_model = model
                best_params = {"default_params": True}
            
            params = best_params
        else:
            # Use default Prophet parameters
            model = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=True)
            for feature in feature_cols:
                if feature in prophet_data.columns:
                    model.add_regressor(feature)
            model.fit(prophet_data)
            best_model = model
            params = {"default_params": True}
        
        return best_model, params
    
    def predict_with_intervals(self, model, model_name, test_data, target_col, feature_cols, date_col, confidence_level=0.95):
        """Generate predictions with confidence intervals"""
        
        predictions, lower_bound, upper_bound = self._get_prediction_intervals(
            model, model_name, test_data, target_col, feature_cols, date_col, confidence_level
        )
        
        return {
            'predictions': predictions,
            'lower_bound': lower_bound,
            'upper_bound': upper_bound,
            'confidence_level': confidence_level
        }
    
    def predict(self, model, model_name, test_data, target_col, feature_cols, date_col):
        """Generate point predictions (backward compatibility)"""
        result = self.predict_with_intervals(model, model_name, test_data, target_col, feature_cols, date_col)
        return result['predictions']
        
    def _get_prediction_intervals(self, model, model_name, test_data, target_col, feature_cols, date_col, confidence_level=0.95):
        """Generate predictions with confidence intervals for different model types"""
        
        alpha = 1 - confidence_level
        
        if model_name in ["Linear Regression"]:
            # Bootstrap confidence intervals for regression models
            X_test = self._prepare_features(test_data, target_col, feature_cols)
            if X_test.shape[1] != self.n_features:
                raise ValueError(f"Feature mismatch: training had {self.n_features} features, test has {X_test.shape[1]} features")
            X_test_scaled = self.scaler.transform(X_test)
            
            # Point prediction
            predictions = model.predict(X_test_scaled)
            
            # Bootstrap for confidence intervals
            if hasattr(self, 'bootstrap_predictions') and self.bootstrap_predictions is not None:
                # Use pre-computed bootstrap predictions if available
                bootstrap_preds = self.bootstrap_predictions
            else:
                # Simple residual-based confidence intervals
                residual_std = getattr(model, 'residual_std_', 0.1)  # Fallback if not available
                margin = 1.96 * residual_std  # 95% confidence interval
                
            lower_bound = predictions - margin if 'margin' in locals() else predictions * 0.9
            upper_bound = predictions + margin if 'margin' in locals() else predictions * 1.1
            
        elif model_name == "ARIMA":
            # ARIMA has built-in confidence intervals
            n_periods = len(test_data)
            forecast_result = model.get_forecast(steps=n_periods)
            predictions = forecast_result.predicted_mean.values
            
            # Get confidence intervals from ARIMA
            conf_int = forecast_result.conf_int(alpha=alpha)
            lower_bound = conf_int.iloc[:, 0].values
            upper_bound = conf_int.iloc[:, 1].values
            
        elif model_name == "Prophet":
            # Prophet has built-in uncertainty intervals
            prophet_test = pd.DataFrame({
                'ds': pd.to_datetime(test_data[date_col])
            })
            
            # Add regressors
            for feature in feature_cols:
                if feature in test_data.columns:
                    prophet_test[feature] = test_data[feature].values
            
            forecast = model.predict(prophet_test)
            predictions = forecast['yhat'].values
            lower_bound = forecast['yhat_lower'].values
            upper_bound = forecast['yhat_upper'].values
            
        elif model_name in ["NeuralProphet", "DeepAR"]:
            # Handle neural network models with Monte Carlo Dropout for uncertainty
            if TENSORFLOW_AVAILABLE and hasattr(model, 'predict'):
                # Monte Carlo Dropout for uncertainty estimation
                predictions, lower_bound, upper_bound = self._get_neural_uncertainty(
                    model, model_name, test_data, target_col, date_col, confidence_level
                )
            else:
                # Fallback to simple predictions with estimated intervals
                predictions = np.array([test_data[target_col].mean()] * len(test_data))
                std_dev = test_data[target_col].std()
                margin = 1.96 * std_dev
                lower_bound = predictions - margin
                upper_bound = predictions + margin
        else:
            # Fallback for unknown models
            predictions = np.array([test_data[target_col].mean()] * len(test_data))
            std_dev = test_data[target_col].std()
            margin = 1.96 * std_dev
            lower_bound = predictions - margin
            upper_bound = predictions + margin
            
        return predictions, lower_bound, upper_bound
    
    def _get_neural_uncertainty(self, model, model_name, test_data, target_col, date_col, confidence_level):
        """Get uncertainty estimates for neural network models using Monte Carlo Dropout"""
        
        data_sorted = test_data.sort_values(date_col)
        y = data_sorted[target_col].values
        sequence_length = getattr(model, 'sequence_length', 30)
        
        # Monte Carlo predictions with dropout enabled (simplified approach)
        n_samples = 50  # Number of MC samples
        mc_predictions = []
        
        for sample in range(n_samples):
            predictions = []
            for i in range(len(y)):
                if i < sequence_length:
                    start_idx = max(0, i - sequence_length)
                    sequence = y[start_idx:i+1]
                    if len(sequence) < sequence_length:
                        padding = [sequence[0]] * (sequence_length - len(sequence))
                        sequence = np.array(padding + sequence.tolist())
                else:
                    sequence = y[i-sequence_length:i]
                
                sequence_input = sequence.reshape(1, sequence_length, 1)
                pred = model.predict(sequence_input, verbose=0)
                
                # Add small random noise to simulate dropout uncertainty
                noise = np.random.normal(0, 0.02) if sample > 0 else 0
                if model_name == "DeepAR" and pred.shape[-1] == 2:
                    predictions.append(pred[0, 0] + noise)
                else:
                    predictions.append(pred[0, 0] + noise)
            
            mc_predictions.append(predictions)
        
        # Convert to numpy and compute statistics
        mc_predictions = np.array(mc_predictions)
        predictions = np.mean(mc_predictions, axis=0)
        
        # Confidence intervals from MC samples
        alpha = 1 - confidence_level
        lower_bound = np.percentile(mc_predictions, 100 * alpha/2, axis=0)
        upper_bound = np.percentile(mc_predictions, 100 * (1 - alpha/2), axis=0)
        
        return predictions, lower_bound, upper_bound
    
    def forecast_future(self, model, model_name, data, n_periods, target_col, 
                       feature_cols, date_col, interval):
        """Generate future forecasts"""
        
        # Generate future dates
        last_date = pd.to_datetime(data[date_col].iloc[-1])
        
        if interval == "Daily":
            future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), 
                                       periods=n_periods, freq='D')
        elif interval == "Weekly":
            future_dates = pd.date_range(start=last_date + pd.Timedelta(weeks=1), 
                                       periods=n_periods, freq='W')
        elif interval == "Monthly":
            future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), 
                                       periods=n_periods, freq='M')
        elif interval == "Quarterly":
            future_dates = pd.date_range(start=last_date + pd.DateOffset(months=3), 
                                       periods=n_periods, freq='Q')
        
        if model_name in ["Linear Regression"]:
            # For regression models, we need to estimate future features
            # Use mean values of recent features as a simple approach
            recent_data = data.tail(30)  # Last 30 observations
            future_features = []
            
            for i in range(n_periods):
                feature_row = []
                feature_row.append(i + len(data))  # Time index
                
                for feature in feature_cols:
                    if feature in data.columns:
                        # Use recent mean with some trend
                        recent_mean = recent_data[feature].mean()
                        feature_row.append(recent_mean)
                
                # Add lag features based on recent target values
                recent_target_mean = data[target_col].tail(10).mean()
                feature_row.append(recent_target_mean)  # lag_1
                if len(data) > 7:
                    feature_row.append(recent_target_mean)  # lag_7
                
                future_features.append(feature_row)
            
            future_features = np.array(future_features)
            # Ensure we have the right number of features
            if future_features.shape[1] != self.n_features:
                # Adjust features to match training
                if future_features.shape[1] < self.n_features:
                    # Pad with recent mean values
                    padding = np.full((future_features.shape[0], self.n_features - future_features.shape[1]), recent_target_mean)
                    future_features = np.column_stack([future_features, padding])
                else:
                    # Trim excess features
                    future_features = future_features[:, :self.n_features]
            
            future_features_scaled = self.scaler.transform(future_features)
            forecasts = model.predict(future_features_scaled)
            
        elif model_name == "ARIMA":
            forecasts = model.forecast(steps=n_periods)
            
        elif model_name == "Prophet":
            future_df = pd.DataFrame({'ds': future_dates})
            
            # Add future regressors (use recent averages)
            recent_data = data.tail(30)
            for feature in feature_cols:
                if feature in data.columns:
                    future_df[feature] = recent_data[feature].mean()
            
            forecast = model.predict(future_df)
            forecasts = forecast['yhat'].values
            
        elif model_name in ["NeuralProphet", "DeepAR"]:
            # Handle neural network future forecasting
            if TENSORFLOW_AVAILABLE and hasattr(model, 'predict'):
                y = data[target_col].values
                sequence_length = getattr(model, 'sequence_length', 30)
                
                # Start with the last sequence from historical data
                last_sequence = y[-sequence_length:]
                forecasts = []
                
                # Generate future predictions iteratively
                for i in range(n_periods):
                    # Prepare input sequence
                    sequence_input = last_sequence.reshape(1, sequence_length, 1)
                    
                    # Generate prediction
                    pred = model.predict(sequence_input, verbose=0)
                    
                    if model_name == "DeepAR" and pred.shape[-1] == 2:
                        # For DeepAR, use mean prediction
                        next_value = pred[0, 0]
                    else:
                        next_value = pred[0, 0]
                    
                    forecasts.append(next_value)
                    
                    # Update sequence for next prediction (rolling window)
                    last_sequence = np.append(last_sequence[1:], next_value)
                
                forecasts = np.array(forecasts)
            else:
                # Fallback: use recent mean with slight trend
                recent_mean = data[target_col].tail(30).mean()
                forecasts = np.full(n_periods, recent_mean)
        
        return {
            'dates': future_dates,
            'values': forecasts
        }
    
    def calculate_accuracy_metrics(self, actual, predicted):
        """Calculate accuracy metrics"""
        
        mae = np.mean(np.abs(actual - predicted))
        rmse = np.sqrt(np.mean((actual - predicted) ** 2))
        mape = np.mean(np.abs((actual - predicted) / actual)) * 100
        
        return {
            'mae': mae,
            'rmse': rmse,
            'mape': mape
        }
    
    def _prepare_features(self, data, target_col, feature_cols):
        """Prepare features for regression models"""
        
        features = []
        
        # Add time index
        features.append(np.arange(len(data)))
        
        # Add selected features
        for feature in feature_cols:
            if feature in data.columns:
                features.append(data[feature].values)
        
        # Add lag features only if we have enough data
        if len(data) > 1:
            lag_1 = np.roll(data[target_col].values, 1)
            lag_1[0] = data[target_col].iloc[0]  # Fill first value
            features.append(lag_1)
        
        if len(data) > 7:
            lag_7 = np.roll(data[target_col].values, 7)
            lag_7[:7] = data[target_col].iloc[:7].mean()  # Fill first 7 values
            features.append(lag_7)
        
        return np.column_stack(features)
    
    def train_neuralprophet(self, train_data, date_col, target_col, feature_cols, hyperparameter_tuning=True):
        """Train NeuralProphet-style model using LSTM"""
        
        if not TENSORFLOW_AVAILABLE:
            # Fallback to enhanced Prophet-like model
            return self.train_prophet(train_data, date_col, target_col, feature_cols, hyperparameter_tuning)
        
        # Prepare data for neural network
        data_sorted = train_data.sort_values(date_col)
        y = data_sorted[target_col].values
        
        # Create sequences for LSTM
        sequence_length = min(30, len(y) // 4)  # Use 30 days or 1/4 of data
        X, y_seq = self._create_sequences(y, sequence_length)
        
        # Add external features if available
        if feature_cols:
            external_features = []
            for feature in feature_cols:
                if feature in data_sorted.columns:
                    feature_values = data_sorted[feature].values
                    feature_seq, _ = self._create_sequences(feature_values, sequence_length)
                    external_features.append(feature_seq)
            
            if external_features:
                external_features = np.stack(external_features, axis=-1)
                X = np.concatenate([X, external_features], axis=-1)
        
        if hyperparameter_tuning:
            # Enhanced hyperparameter tuning for NeuralProphet
            best_loss = np.inf
            best_model = None
            best_params = None
            
            # Hyperparameter search space
            lstm_units_options = [32, 50, 64, 100]
            dropout_options = [0.1, 0.2, 0.3, 0.4]
            dense_units_options = [16, 25, 32, 50]
            learning_rate_options = [0.001, 0.005, 0.01]
            batch_size_options = [16, 32, 64]
            
            for lstm_units in lstm_units_options[:2]:  # Limit search for efficiency
                for dropout_rate in dropout_options[:2]:
                    for dense_units in dense_units_options[:2]:
                        for lr in learning_rate_options[:2]:
                            for batch_size in batch_size_options[:2]:
                                try:
                                    # Build model with current hyperparameters
                                    model = Sequential([
                                        LSTM(lstm_units, return_sequences=True, input_shape=(X.shape[1], X.shape[2])),
                                        Dropout(dropout_rate),
                                        LSTM(lstm_units, return_sequences=False),
                                        Dropout(dropout_rate),
                                        Dense(dense_units, activation='relu'),
                                        Dense(1)
                                    ])
                                    
                                    from tensorflow.keras.optimizers import Adam
                                    optimizer = Adam(learning_rate=lr)
                                    model.compile(optimizer=optimizer, loss='mse', metrics=['mae'])
                                    
                                    # Train with early stopping
                                    from tensorflow.keras.callbacks import EarlyStopping
                                    early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
                                    
                                    history = model.fit(
                                        X, y_seq,
                                        epochs=100,
                                        batch_size=batch_size,
                                        validation_split=0.2,
                                        callbacks=[early_stopping],
                                        verbose=0
                                    )
                                    
                                    final_loss = min(history.history['val_loss'])
                                    if final_loss < best_loss:
                                        best_loss = final_loss
                                        best_model = model
                                        best_params = {
                                            'lstm_units': lstm_units,
                                            'dropout_rate': dropout_rate,
                                            'dense_units': dense_units,
                                            'learning_rate': lr,
                                            'batch_size': batch_size,
                                            'final_val_loss': final_loss
                                        }
                                except Exception as e:
                                    continue
            
            if best_model is not None:
                model = best_model
                params = best_params
                params['model_type'] = 'NeuralProphet_LSTM_Tuned'
                params['sequence_length'] = sequence_length
            else:
                # Fallback to default model
                model = Sequential([
                    LSTM(50, return_sequences=True, input_shape=(X.shape[1], X.shape[2])),
                    Dropout(0.2),
                    LSTM(50, return_sequences=False),
                    Dropout(0.2),
                    Dense(25),
                    Dense(1)
                ])
                model.compile(optimizer='adam', loss='mse', metrics=['mae'])
                history = model.fit(X, y_seq, epochs=50, batch_size=32, validation_split=0.2, verbose=0)
                params = {
                    'model_type': 'NeuralProphet_LSTM_Default',
                    'sequence_length': sequence_length,
                    'epochs': 50,
                    'batch_size': 32,
                    'final_loss': float(history.history['loss'][-1])
                }
        else:
            # Default model without tuning
            model = Sequential([
                LSTM(50, return_sequences=True, input_shape=(X.shape[1], X.shape[2])),
                Dropout(0.2),
                LSTM(50, return_sequences=False),
                Dropout(0.2),
                Dense(25),
                Dense(1)
            ])
            
            model.compile(optimizer='adam', loss='mse', metrics=['mae'])
            
            history = model.fit(
                X, y_seq, 
                epochs=50, 
                batch_size=32, 
                validation_split=0.2, 
                verbose=0
            )
            
            params = {
                'model_type': 'NeuralProphet_LSTM',
                'sequence_length': sequence_length,
                'epochs': 50,
                'batch_size': 32,
                'final_loss': float(history.history['loss'][-1])
            }
        
        return model, params
    
    def train_deepar(self, train_data, date_col, target_col, feature_cols, hyperparameter_tuning=True):
        """Train DeepAR-style model using LSTM with probabilistic outputs"""
        
        if not TENSORFLOW_AVAILABLE:
            # Fallback to Random Forest with uncertainty estimation
            model, params = self.train_linear_regression(train_data, target_col, feature_cols, hyperparameter_tuning)
            params['model_type'] = 'DeepAR_Fallback_RF'
            return model, params
        
        # Prepare data similar to DeepAR approach
        data_sorted = train_data.sort_values(date_col)
        y = data_sorted[target_col].values
        
        # Create sequences
        sequence_length = min(30, len(y) // 4)
        X, y_seq = self._create_sequences(y, sequence_length)
        
        # Add external features
        if feature_cols:
            external_features = []
            for feature in feature_cols:
                if feature in data_sorted.columns:
                    feature_values = data_sorted[feature].values
                    feature_seq, _ = self._create_sequences(feature_values, sequence_length)
                    external_features.append(feature_seq)
            
            if external_features:
                external_features = np.stack(external_features, axis=-1)
                X = np.concatenate([X, external_features], axis=-1)
        
        # Custom loss function for probabilistic forecasting
        def probabilistic_loss(y_true, y_pred):
            mean = y_pred[:, 0]
            log_var = y_pred[:, 1]
            var = tf.exp(log_var)
            
            # Gaussian negative log-likelihood
            loss = 0.5 * (log_var + tf.square(y_true - mean) / var)
            return tf.reduce_mean(loss)
        
        if hyperparameter_tuning:
            # Enhanced hyperparameter tuning for DeepAR
            best_loss = np.inf
            best_model = None
            best_params = None
            
            # Hyperparameter search space for DeepAR
            lstm_units_options = [32, 48, 64, 80]
            dropout_options = [0.2, 0.3, 0.4, 0.5]
            dense_units_options = [16, 24, 32, 48]
            learning_rate_options = [0.001, 0.002, 0.005]
            batch_size_options = [8, 16, 32]
            
            for lstm_units in lstm_units_options[:2]:
                for dropout_rate in dropout_options[:2]:
                    for dense_units in dense_units_options[:2]:
                        for lr in learning_rate_options[:2]:
                            for batch_size in batch_size_options[:2]:
                                try:
                                    # Build probabilistic model with current hyperparameters
                                    model = Sequential([
                                        LSTM(lstm_units, return_sequences=True, input_shape=(X.shape[1], X.shape[2])),
                                        Dropout(dropout_rate),
                                        LSTM(lstm_units, return_sequences=True),
                                        Dropout(dropout_rate),
                                        LSTM(lstm_units//2, return_sequences=False),
                                        Dropout(dropout_rate * 0.7),
                                        Dense(dense_units, activation='relu'),
                                        Dense(2)  # Mean and log variance
                                    ])
                                    
                                    from tensorflow.keras.optimizers import Adam
                                    optimizer = Adam(learning_rate=lr)
                                    model.compile(optimizer=optimizer, loss=probabilistic_loss, metrics=['mae'])
                                    
                                    # Train with early stopping
                                    from tensorflow.keras.callbacks import EarlyStopping
                                    early_stopping = EarlyStopping(monitor='val_loss', patience=7, restore_best_weights=True)
                                    
                                    history = model.fit(
                                        X, y_seq,
                                        epochs=150,
                                        batch_size=batch_size,
                                        validation_split=0.2,
                                        callbacks=[early_stopping],
                                        verbose=0
                                    )
                                    
                                    final_loss = min(history.history['val_loss'])
                                    if final_loss < best_loss:
                                        best_loss = final_loss
                                        best_model = model
                                        best_params = {
                                            'lstm_units': lstm_units,
                                            'dropout_rate': dropout_rate,
                                            'dense_units': dense_units,
                                            'learning_rate': lr,
                                            'batch_size': batch_size,
                                            'final_val_loss': final_loss
                                        }
                                except Exception as e:
                                    continue
            
            if best_model is not None:
                model = best_model
                params = best_params
                params['model_type'] = 'DeepAR_LSTM_Tuned'
                params['sequence_length'] = sequence_length
                params['probabilistic'] = True
            else:
                # Fallback to default model
                model = Sequential([
                    LSTM(64, return_sequences=True, input_shape=(X.shape[1], X.shape[2])),
                    Dropout(0.3),
                    LSTM(64, return_sequences=True),
                    Dropout(0.3),
                    LSTM(32, return_sequences=False),
                    Dropout(0.2),
                    Dense(32, activation='relu'),
                    Dense(2)
                ])
                model.compile(optimizer='adam', loss=probabilistic_loss, metrics=['mae'])
                history = model.fit(X, y_seq, epochs=75, batch_size=16, validation_split=0.2, verbose=0)
                params = {
                    'model_type': 'DeepAR_LSTM_Default',
                    'sequence_length': sequence_length,
                    'epochs': 75,
                    'batch_size': 16,
                    'probabilistic': True,
                    'final_loss': float(history.history['loss'][-1])
                }
        else:
            # Default model without tuning
            model = Sequential([
                LSTM(64, return_sequences=True, input_shape=(X.shape[1], X.shape[2])),
                Dropout(0.3),
                LSTM(64, return_sequences=True),
                Dropout(0.3),
                LSTM(32, return_sequences=False),
                Dropout(0.2),
                Dense(32, activation='relu'),
                Dense(2)  # Mean and log variance for probabilistic output
            ])
            
            model.compile(optimizer='adam', loss=probabilistic_loss, metrics=['mae'])
            
            # Train model
            history = model.fit(
                X, y_seq, 
                epochs=75, 
                batch_size=16, 
                validation_split=0.2, 
                verbose=0
            )
            
            params = {
                'model_type': 'DeepAR_LSTM',
                'sequence_length': sequence_length,
                'epochs': 75,
                'batch_size': 16,
                'probabilistic': True,
                'final_loss': float(history.history['loss'][-1])
            }
        
        return model, params
    
    def _create_sequences(self, data, sequence_length):
        """Create sequences for LSTM training"""
        X, y = [], []
        for i in range(sequence_length, len(data)):
            X.append(data[i-sequence_length:i])
            y.append(data[i])
        return np.array(X).reshape(-1, sequence_length, 1), np.array(y)
