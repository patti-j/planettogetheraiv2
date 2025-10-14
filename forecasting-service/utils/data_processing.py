import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import streamlit as st
# Lazy imports for sklearn - only load when needed
import sqlalchemy
from sqlalchemy import create_engine, text
import pyodbc
import pymssql
import warnings
warnings.filterwarnings('ignore')

class DataProcessor:
    def __init__(self):
        self.selected_features = None
        self.feature_selector = None
        self.poly_features = None
        self.feature_importance_scores = None
    
    def load_data(self, uploaded_file):
        """Load and validate CSV data"""
        try:
            # Read CSV file
            df = pd.read_csv(uploaded_file)
            
            # Basic validation
            if df.empty:
                st.error("Uploaded file is empty")
                return None
            
            # Display basic info
            st.info(f"Data shape: {df.shape[0]} rows, {df.shape[1]} columns")
            
            return df
            
        except Exception as e:
            st.error(f"Error loading data: {str(e)}")
            return None
    
    def test_sql_connection(self, server, database, username, password, connection_type='sqlalchemy'):
        """Test SQL Server connection"""
        try:
            if connection_type == 'sqlalchemy':
                # Create connection string for SQLAlchemy with Azure SQL Server support
                from urllib.parse import quote_plus
                connection_string = f"mssql+pymssql://{quote_plus(username)}:{quote_plus(password)}@{server}:1433/{database}?charset=utf8"
                engine = create_engine(connection_string, connect_args={"timeout": 30})
                
                # Test connection with a simple query
                with engine.connect() as conn:
                    result = conn.execute(text("SELECT 1 as test"))
                    result.fetchone()
                
                return True, "Connection successful!"
                
            elif connection_type == 'pyodbc':
                # Use pyodbc for connection
                connection_string = f"DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes"
                conn = pyodbc.connect(connection_string, timeout=10)
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                conn.close()
                
                return True, "Connection successful!"
                
        except Exception as e:
            return False, f"Connection failed: {str(e)}"
    
    def load_data_from_sql(self, server, database, username, password, query, connection_type='sqlalchemy'):
        """Load data from SQL Server"""
        try:
            if connection_type == 'sqlalchemy':
                # Create connection string for SQLAlchemy with Azure SQL Server support
                from urllib.parse import quote_plus
                connection_string = f"mssql+pymssql://{quote_plus(username)}:{quote_plus(password)}@{server}:1433/{database}?charset=utf8"
                engine = create_engine(connection_string, connect_args={"timeout": 30})
                
                # Execute query and load data
                df = pd.read_sql(query, engine)
                
            elif connection_type == 'pyodbc':
                # Use pyodbc for connection
                connection_string = f"DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes"
                conn = pyodbc.connect(connection_string, timeout=30)
                
                # Execute query and load data
                df = pd.read_sql(query, conn)
                conn.close()
            else:
                st.error(f"Unsupported connection type: {connection_type}")
                return None
            
            # Basic validation
            if df.empty:
                st.error("Query returned no data")
                return None
            
            # Basic validation passed - data loaded successfully
            
            return df
            
        except Exception as e:
            st.error(f"Error loading data from SQL Server: {str(e)}")
            return None
    
    def get_table_list(self, server, database, username, password, connection_type='sqlalchemy'):
        """Get list of tables from SQL Server database"""
        try:
            if connection_type == 'sqlalchemy':
                connection_string = f"mssql+pymssql://{username}:{password}@{server}/{database}"
                engine = create_engine(connection_string)
                
                query = """
                SELECT TABLE_SCHEMA, TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_SCHEMA, TABLE_NAME
                """
                
                with engine.connect() as conn:
                    result = conn.execute(text(query))
                    tables = [(row[0], row[1]) for row in result.fetchall()]
                
            elif connection_type == 'pyodbc':
                connection_string = f"DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes"
                conn = pyodbc.connect(connection_string, timeout=10)
                cursor = conn.cursor()
                
                cursor.execute("""
                SELECT TABLE_SCHEMA, TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_SCHEMA, TABLE_NAME
                """)
                
                tables = [(row[0], row[1]) for row in cursor.fetchall()]
                conn.close()
            else:
                st.error(f"Unsupported connection type: {connection_type}")
                return []
            
            return tables
            
        except Exception as e:
            st.error(f"Error getting table list: {str(e)}")
            return []
    
    def get_table_preview(self, server, database, username, password, table_schema, table_name, connection_type='sqlalchemy', limit=100):
        """Get preview of table data"""
        try:
            query = f"SELECT TOP {limit} * FROM [{table_schema}].[{table_name}]"
            
            if connection_type == 'sqlalchemy':
                connection_string = f"mssql+pymssql://{username}:{password}@{server}/{database}"
                engine = create_engine(connection_string)
                df = pd.read_sql(query, engine)
                
            elif connection_type == 'pyodbc':
                connection_string = f"DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};TrustServerCertificate=yes"
                conn = pyodbc.connect(connection_string, timeout=10)
                df = pd.read_sql(query, conn)
                conn.close()
            else:
                st.error(f"Unsupported connection type: {connection_type}")
                return None
            
            return df
            
        except Exception as e:
            st.error(f"Error previewing table: {str(e)}")
            return None
    
    def prepare_time_series_data(self, df, date_col, target_col, feature_cols, interval):
        """Prepare time series data for modeling"""
        try:
            # Create a copy of the dataframe
            data = df.copy()
            
            # Convert date column to datetime
            data[date_col] = pd.to_datetime(data[date_col])
            
            # Sort by date
            data = data.sort_values(date_col).reset_index(drop=True)
            
            # Handle missing values
            data = self._handle_missing_values(data, target_col, feature_cols)
            
            # Resample data based on interval if needed
            if interval != "Daily":
                data = self._resample_data(data, date_col, target_col, feature_cols, interval)
            
            # Add time-based features
            data = self._add_time_features(data, date_col)
            
            # Apply automated feature engineering
            data, engineered_features = self._automated_feature_engineering(data, target_col, feature_cols)
            
            # Apply feature selection
            selected_data, selected_features = self._automated_feature_selection(data, target_col, engineered_features)
            
            # Store selected features for later use
            self.selected_features = selected_features
            
            # Validate final data
            if selected_data[target_col].isnull().any():
                st.warning("Target variable contains missing values after processing")
            
            st.info(f"✨ Feature Engineering: Created {len(engineered_features) - len(feature_cols)} new features")
            st.info(f"🎯 Feature Selection: Selected {len(selected_features)} best features from {len(engineered_features)} total")
            
            return selected_data
            
        except Exception as e:
            st.error(f"Error preparing time series data: {str(e)}")
            return None
    
    def _handle_missing_values(self, data, target_col, feature_cols):
        """Handle missing values in the dataset"""
        
        # For target variable, use forward fill then backward fill
        data[target_col] = data[target_col].ffill().bfill()
        
        # For feature columns, use mean imputation
        for col in feature_cols:
            if col in data.columns:
                if data[col].dtype in ['int64', 'float64']:
                    data[col] = data[col].fillna(data[col].mean())
                else:
                    data[col] = data[col].fillna(data[col].mode().iloc[0] if not data[col].mode().empty else 0)
        
        return data
    
    def _resample_data(self, data, date_col, target_col, feature_cols, interval):
        """Resample data to specified interval"""
        
        # Set date column as index
        data_indexed = data.set_index(date_col)
        
        # Define resampling frequency
        freq_map = {
            "Weekly": "W",
            "Monthly": "M",
            "Quarterly": "Q"
        }
        
        freq = freq_map.get(interval, "D")
        
        # Resample data - for univariate time series, only aggregate target
        if feature_cols:  # If additional features provided
            resampled_data = data_indexed.resample(freq).agg({
                target_col: 'sum',  # Sum for target variable (sales)
                **{col: 'mean' for col in feature_cols if col in data.columns}  # Average for features
            })
        else:  # Pure univariate time series
            resampled_data = data_indexed.resample(freq).agg({
                target_col: 'sum'  # Only sum the target variable
            })
        
        # Reset index
        resampled_data = resampled_data.reset_index()
        
        return resampled_data
    
    def _add_time_features(self, data, date_col):
        """Add time-based features"""
        
        # Extract date components
        data['year'] = data[date_col].dt.year
        data['month'] = data[date_col].dt.month
        data['day'] = data[date_col].dt.day
        data['dayofweek'] = data[date_col].dt.dayofweek
        data['quarter'] = data[date_col].dt.quarter
        
        # Add cyclical features
        data['month_sin'] = np.sin(2 * np.pi * data['month'] / 12)
        data['month_cos'] = np.cos(2 * np.pi * data['month'] / 12)
        data['dayofweek_sin'] = np.sin(2 * np.pi * data['dayofweek'] / 7)
        data['dayofweek_cos'] = np.cos(2 * np.pi * data['dayofweek'] / 7)
        
        return data
    
    def detect_outliers(self, data, target_col):
        """Detect outliers using IQR method"""
        
        Q1 = data[target_col].quantile(0.25)
        Q3 = data[target_col].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        outliers = data[(data[target_col] < lower_bound) | (data[target_col] > upper_bound)]
        
        return outliers
    
    def get_data_summary(self, data, target_col, date_col):
        """Generate data summary statistics"""
        
        summary = {
            'total_records': len(data),
            'date_range': {
                'start': data[date_col].min(),
                'end': data[date_col].max()
            },
            'target_stats': {
                'mean': data[target_col].mean(),
                'median': data[target_col].median(),
                'std': data[target_col].std(),
                'min': data[target_col].min(),
                'max': data[target_col].max()
            },
            'missing_values': data[target_col].isnull().sum(),
            'outliers_count': len(self.detect_outliers(data, target_col))
        }
        
        return summary
    
    def _automated_feature_engineering(self, data, target_col, original_features):
        """Create automated engineered features - simplified for univariate time series"""
        
        engineered_data = data.copy()
        all_features = original_features.copy() if original_features else []
        
        # For univariate time series, create basic lag and rolling features from target
        if not original_features:  # Pure univariate case
            # Create lag features from target variable
            for lag in [1, 7, 30]:  # 1 day, 1 week, 1 month lags
                if len(data) > lag:
                    lag_col = f"{target_col}_lag_{lag}"
                    engineered_data[lag_col] = data[target_col].shift(lag)
                    all_features.append(lag_col)
            
            # Rolling statistics from target
            for window in [7, 30]:  # 1 week, 1 month windows
                if len(data) > window:
                    # Rolling mean
                    mean_col = f"{target_col}_rolling_mean_{window}"
                    engineered_data[mean_col] = data[target_col].rolling(window=window, min_periods=1).mean()
                    all_features.append(mean_col)
                    
                    # Rolling standard deviation
                    std_col = f"{target_col}_rolling_std_{window}"
                    engineered_data[std_col] = data[target_col].rolling(window=window, min_periods=1).std().fillna(0)
                    all_features.append(std_col)
            
            return engineered_data, all_features
        
        # Original feature engineering for multivariate case
        
        # Multivariate case - lag features for time series patterns
        for col in original_features:
            if col in data.columns and data[col].dtype in ['int64', 'float64']:
                # Create lag features (1, 7 days)
                for lag in [1, 7]:
                    lag_col = f"{col}_lag_{lag}"
                    engineered_data[lag_col] = data[col].shift(lag)
                    all_features.append(lag_col)
                
                # Rolling statistics (7, 30 day windows)
                for window in [7, 30]:
                    if len(data) > window:
                        # Rolling mean
                        mean_col = f"{col}_rolling_mean_{window}"
                        engineered_data[mean_col] = data[col].rolling(window=window, min_periods=1).mean()
                        all_features.append(mean_col)
                        
                        # Rolling standard deviation
                        std_col = f"{col}_rolling_std_{window}"
                        engineered_data[std_col] = data[col].rolling(window=window, min_periods=1).std().fillna(0)
                        all_features.append(std_col)
        
        # 2. Polynomial features for non-linear relationships
        numeric_cols = [col for col in original_features if col in data.columns and data[col].dtype in ['int64', 'float64']]
        if len(numeric_cols) >= 2:
            # Create interaction features between top numeric columns
            for i, col1 in enumerate(numeric_cols[:3]):  # Limit to top 3 to avoid explosion
                for j, col2 in enumerate(numeric_cols[i+1:4]):  # Limit interactions
                    interaction_col = f"{col1}_x_{col2}"
                    engineered_data[interaction_col] = data[col1] * data[col2]
                    all_features.append(interaction_col)
                    
                    # Ratio features
                    ratio_col = f"{col1}_div_{col2}"
                    engineered_data[ratio_col] = data[col1] / (data[col2] + 1e-8)  # Avoid division by zero
                    all_features.append(ratio_col)
        
        # 3. Statistical transformation features
        for col in original_features:
            if col in data.columns and data[col].dtype in ['int64', 'float64']:
                # Log transformation (for positive values)
                if data[col].min() > 0:
                    log_col = f"{col}_log"
                    engineered_data[log_col] = np.log1p(data[col])
                    all_features.append(log_col)
                
                # Square root transformation
                if data[col].min() >= 0:
                    sqrt_col = f"{col}_sqrt"
                    engineered_data[sqrt_col] = np.sqrt(data[col])
                    all_features.append(sqrt_col)
                
                # Squared features
                squared_col = f"{col}_squared"
                engineered_data[squared_col] = data[col] ** 2
                all_features.append(squared_col)
        
        # 4. Seasonal decomposition features
        if len(data) > 30:  # Need sufficient data for seasonal patterns
            for col in original_features:
                if col in data.columns and data[col].dtype in ['int64', 'float64']:
                    # Weekly moving averages
                    weekly_ma = f"{col}_weekly_ma"
                    engineered_data[weekly_ma] = data[col].rolling(window=7, min_periods=1).mean()
                    all_features.append(weekly_ma)
                    
                    # Monthly moving averages
                    monthly_ma = f"{col}_monthly_ma"
                    engineered_data[monthly_ma] = data[col].rolling(window=30, min_periods=1).mean()
                    all_features.append(monthly_ma)
        
        # Fill NaN values created during feature engineering
        engineered_data = engineered_data.ffill().bfill().fillna(0)
        
        return engineered_data, all_features
    
    def _automated_feature_selection(self, data, target_col, feature_cols):
        """Automatically select the best features using multiple methods"""
        
        # Prepare feature matrix and target
        feature_data = data[feature_cols].copy()
        target_data = data[target_col].copy()
        
        # Remove any remaining NaN values
        feature_data = feature_data.fillna(0)
        target_data = target_data.fillna(target_data.mean())
        
        # Method 1: Correlation-based selection
        correlations = {}
        for col in feature_cols:
            if col in feature_data.columns:
                try:
                    corr = abs(feature_data[col].corr(target_data))
                    correlations[col] = corr if not np.isnan(corr) else 0
                except:
                    correlations[col] = 0
        
        # Method 2: Random Forest feature importance
        try:
            from sklearn.ensemble import RandomForestRegressor
            rf_selector = RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=-1)
            rf_selector.fit(feature_data, target_data)
            rf_importance = dict(zip(feature_cols, rf_selector.feature_importances_))
        except:
            rf_importance = {col: 0 for col in feature_cols}
        
        # Method 3: Statistical significance (F-score)
        try:
            k_best = min(20, len(feature_cols))  # Select top 20 or all if fewer
            from sklearn.feature_selection import SelectKBest, f_regression
            f_selector = SelectKBest(score_func=f_regression, k=k_best)
            f_selector.fit(feature_data, target_data)
            f_scores = dict(zip(feature_cols, f_selector.scores_))
        except:
            f_scores = {col: 0 for col in feature_cols}
        
        # Combine all selection methods with weights
        combined_scores = {}
        for col in feature_cols:
            # Normalize scores to 0-1 range
            corr_score = correlations.get(col, 0)
            rf_score = rf_importance.get(col, 0)
            f_score = f_scores.get(col, 0) / (max(f_scores.values()) + 1e-8)  # Normalize F-score
            
            # Weighted combination (correlation: 30%, RF importance: 40%, F-score: 30%)
            combined_scores[col] = 0.3 * corr_score + 0.4 * rf_score + 0.3 * f_score
        
        # Store feature importance scores
        self.feature_importance_scores = combined_scores
        
        # Select top features (at least 5, at most 15 or 80% of original features)
        min_features = min(5, len(feature_cols))
        max_features = min(15, int(0.8 * len(feature_cols)))
        num_features = max(min_features, min(max_features, len(feature_cols)))
        
        # Sort features by combined score and select top ones
        selected_features = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:num_features]
        selected_feature_names = [col for col, score in selected_features]
        
        # Always include the target column
        columns_to_keep = [target_col] + selected_feature_names
        selected_data = data[columns_to_keep].copy()
        
        return selected_data, selected_feature_names
    
    def get_feature_importance_report(self):
        """Get a report of feature importance scores"""
        if self.feature_importance_scores:
            importance_df = pd.DataFrame([
                {'Feature': feature, 'Importance Score': score}
                for feature, score in sorted(self.feature_importance_scores.items(), 
                                           key=lambda x: x[1], reverse=True)
            ])
            return importance_df
        return None
