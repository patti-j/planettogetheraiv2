import os
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field, validator
import uvicorn

# Lazy imports for heavy libraries
def get_data_processor():
    from utils.data_processing import DataProcessor
    return DataProcessor()

def get_forecaster():
    from forecast_simple import SimpleDemandForecaster
    return SimpleDemandForecaster()

app = FastAPI(
    title="Demand Forecasting API",
    description="API for generating demand forecasts from SQL Server data",
    version="1.0.0"
)

# Pydantic Models
class ForecastRequest(BaseModel):
    database_name: str = Field(..., description="Database profile name")
    schema_name: str = Field(default="dbo", description="Database schema", alias="schema")
    table: str = Field(..., description="Table name")
    date_col: str = Field(..., description="Date column name")
    item_col: str = Field(..., description="Item column name") 
    qty_col: str = Field(..., description="Quantity column name")
    item_id: str = Field(..., description="Specific item ID to forecast")
    model: str = Field(default="Random Forest", description="Model type")
    horizon_days: int = Field(default=30, ge=1, le=365, description="Forecast horizon in days")
    include_confidence: bool = Field(default=True, description="Include confidence intervals")
    
    # Hierarchical filter parameters
    planning_area_col: Optional[str] = Field(default=None, description="Planning area column name")
    planning_area_values: Optional[List[str]] = Field(default=None, description="Selected planning area values")
    scenario_name_col: Optional[str] = Field(default=None, description="Scenario name column name") 
    scenario_name_values: Optional[List[str]] = Field(default=None, description="Selected scenario name values")
    
    @validator('model')
    def validate_model(cls, v):
        allowed_models = ["Random Forest", "ARIMA", "Prophet"]
        if v not in allowed_models:
            raise ValueError(f"Model must be one of: {allowed_models}")
        return v

class ForecastResponse(BaseModel):
    status: str
    data: Dict[str, Any]

class ErrorResponse(BaseModel):
    status: str = "error"
    error: Dict[str, Any]

# Authentication
def get_api_key(x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key in X-API-Key header"
        )
    
    expected_key = os.getenv("API_KEY")
    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API key not configured on server"
        )
    
    if x_api_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return x_api_key

# Database Profile Management
def get_database_profile(database_name: str) -> Dict[str, str]:
    """Get database credentials from environment based on database name"""
    
    # Support any database name by mapping to the default SQL Server from secrets
    # This allows Power BI to use any database name and still connect
    server = os.getenv("SQL_SERVER")
    database = os.getenv("SQL_DATABASE")
    username = os.getenv("SQL_USERNAME") 
    password = os.getenv("SQL_PASSWORD")
    
    if not all([server, database, username, password]):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database credentials not configured"
        )
    
    return {
        "server": str(server),
        "database": str(database),
        "username": str(username),
        "password": str(password),
        "connection_type": "sqlalchemy"
    }

# Forecast Service
class ForecastService:
    def __init__(self):
        self.data_processor = None
        self.forecaster = None
    
    def _init_components(self):
        """Lazy initialization of heavy components"""
        if not self.data_processor:
            self.data_processor = get_data_processor()
        if not self.forecaster:
            self.forecaster = get_forecaster()
    
    async def generate_forecast(self, request: ForecastRequest, db_profile: Dict[str, str]) -> Dict[str, Any]:
        """Generate forecast for specified item"""
        self._init_components()
        
        try:
            # Test database connection
            connection_result = self.data_processor.test_sql_connection(
                db_profile["server"], db_profile["database"], 
                db_profile["username"], db_profile["password"], 
                db_profile["connection_type"]
            )
            
            if not connection_result or not connection_result[0]:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database connection failed"
                )
            
            # Query data for specific item with hierarchical filters
            def escape_sql_value(value):
                """Safely escape SQL string values by doubling single quotes"""
                return str(value).replace("'", "''")
            
            def escape_sql_identifier(identifier):
                """Safely escape SQL identifiers by bracketing and doubling closing brackets"""
                return f"[{str(identifier).replace(']', ']]')}]"
            
            full_table_name = f"{escape_sql_identifier(request.schema_name)}.{escape_sql_identifier(request.table)}"
            where_clauses = [f"{escape_sql_identifier(request.item_col)} = '{escape_sql_value(request.item_id)}'"]
            
            # Add planning area filter if specified
            if (request.planning_area_col and request.planning_area_values and 
                any(val for val in request.planning_area_values if val and val != "None (No Filter)")):
                valid_areas = [area for area in request.planning_area_values 
                              if area and area != "None (No Filter)"]
                if valid_areas:
                    escaped_areas = [escape_sql_value(area) for area in valid_areas]
                    planning_filter = "', '".join(escaped_areas)
                    where_clauses.append(f"{escape_sql_identifier(request.planning_area_col)} IN ('{planning_filter}')")
            
            # Add scenario name filter if specified
            if (request.scenario_name_col and request.scenario_name_values and 
                any(val for val in request.scenario_name_values if val and val != "None (No Filter)")):
                valid_scenarios = [scenario for scenario in request.scenario_name_values 
                                 if scenario and scenario != "None (No Filter)"]
                if valid_scenarios:
                    escaped_scenarios = [escape_sql_value(scenario) for scenario in valid_scenarios]
                    scenario_filter = "', '".join(escaped_scenarios)
                    where_clauses.append(f"{escape_sql_identifier(request.scenario_name_col)} IN ('{scenario_filter}')")
            
            where_clause = " AND ".join(where_clauses)
            
            item_query = f"""
            SELECT {escape_sql_identifier(request.date_col)}, SUM({escape_sql_identifier(request.qty_col)}) as total_quantity
            FROM {full_table_name}
            WHERE {where_clause}
            GROUP BY {escape_sql_identifier(request.date_col)}
            ORDER BY {escape_sql_identifier(request.date_col)}
            """
            
            item_df = self.data_processor.load_data_from_sql(
                db_profile["server"], db_profile["database"],
                db_profile["username"], db_profile["password"], 
                item_query, db_profile["connection_type"]
            )
            
            if item_df is None or item_df.empty:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No data found for item '{request.item_id}'"
                )
            
            # Warning for limited data, but proceed with forecasting
            data_quality_warning = None
            if len(item_df) < 5:
                data_quality_warning = f"Limited data: only {len(item_df)} records found. Forecast accuracy may be reduced."
            
            # Prepare data for forecasting
            sales_data = self.forecaster.prepare_sales_data(item_df, request.date_col, 'total_quantity')
            
            # Create features for Random Forest model
            if request.model == "Random Forest":
                feature_data, feature_cols = self.forecaster.create_lag_features(sales_data, 'total_quantity')
                # Train the model
                metrics = self.forecaster.train_random_forest(feature_data, 'total_quantity', feature_cols, request.horizon_days)
                # Generate forecast
                forecast_result = self.forecaster.forecast_demand(feature_data, request.date_col, 'total_quantity', feature_cols, request.horizon_days)
            elif request.model == "ARIMA":
                # Train ARIMA model
                metrics = self.forecaster.train_arima(sales_data, 'total_quantity', request.horizon_days)
                # Generate forecast  
                forecast_result = self.forecaster.forecast_demand(sales_data, request.date_col, 'total_quantity', [], request.horizon_days)
            elif request.model == "Prophet":
                # Train Prophet model
                metrics = self.forecaster.train_prophet(sales_data, request.date_col, 'total_quantity', request.horizon_days)
                # Generate forecast
                forecast_result = self.forecaster.forecast_demand(sales_data, request.date_col, 'total_quantity', [], request.horizon_days)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported model: {request.model}"
                )
            
            if not forecast_result or 'dates' not in forecast_result:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Forecast generation failed"
                )
            
            # Prepare detailed forecast table
            forecast_table = []
            for i, date in enumerate(forecast_result['dates']):
                row = {
                    "date": date.strftime("%Y-%m-%d"),
                    "predicted_demand": round(forecast_result['values'][i], 2),
                }
                
                if request.include_confidence and 'lower_bound' in forecast_result:
                    row["lower_bound"] = round(forecast_result['lower_bound'][i], 2)
                    row["upper_bound"] = round(forecast_result['upper_bound'][i], 2)
                
                forecast_table.append(row)
            
            # Prepare response
            response_data = {
                "metadata": {
                    "database_name": request.database_name,
                    "table": f"{request.schema_name}.{request.table}",
                    "item_id": request.item_id,
                    "model": request.model,
                    "horizon_days": request.horizon_days,
                    "generated_at": datetime.now().isoformat(),
                    "data_points": len(item_df),
                    "data_quality_warning": data_quality_warning,
                    "metrics": {
                        "MAE": round(metrics.get('MAE', 0), 2) if metrics else 0,
                        "RMSE": round(metrics.get('RMSE', 0), 2) if metrics else 0, 
                        "MAPE": round(metrics.get('MAPE', 0), 1) if metrics else 0
                    }
                },
                "forecast": forecast_table
            }
            
            return response_data
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Forecast generation error: {str(e)}"
            )

forecast_service = ForecastService()

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "demand-forecasting-api", "version": "1.0.0"}

@app.get("/models")
async def get_supported_models():
    """Get list of supported forecasting models"""
    return {
        "status": "ok",
        "data": {
            "models": ["Random Forest", "ARIMA", "Prophet"],
            "default": "Random Forest",
            "limits": {
                "max_horizon_days": 365,
                "min_data_points": 5
            }
        }
    }

@app.post("/items")
async def get_items_with_data(
    request: dict,
    api_key: str = Depends(get_api_key)
) -> dict:
    """Get list of items with sufficient data for forecasting"""
    
    try:
        # Get database profile
        db_profile = get_database_profile(request.get("database_name", "default"))
        
        # Initialize data processor
        data_processor = get_data_processor()
        
        # Test database connection
        connection_result = data_processor.test_sql_connection(
            db_profile["server"], db_profile["database"], 
            db_profile["username"], db_profile["password"], 
            db_profile["connection_type"]
        )
        
        if not connection_result or not connection_result[0]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Query to get items with their record counts
        schema_name = request.get("schema", "dbo")
        table = request.get("table", "")
        date_col = request.get("date_col", "")
        item_col = request.get("item_col", "")
        qty_col = request.get("qty_col", "")
        
        if not all([table, date_col, item_col, qty_col]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields: table, date_col, item_col, qty_col"
            )
        
        full_table_name = f"[{schema_name}].[{table}]"
        items_query = f"""
        SELECT {item_col}, 
               COUNT(*) as record_count,
               MIN({date_col}) as earliest_date,
               MAX({date_col}) as latest_date,
               SUM({qty_col}) as total_quantity
        FROM {full_table_name}
        GROUP BY {item_col}
        HAVING COUNT(*) >= 5
        ORDER BY COUNT(*) DESC
        """
        
        items_df = data_processor.load_data_from_sql(
            db_profile["server"], db_profile["database"],
            db_profile["username"], db_profile["password"], 
            items_query, db_profile["connection_type"]
        )
        
        if items_df is None or items_df.empty:
            return {
                "status": "ok",
                "data": {
                    "items": [],
                    "total_count": 0,
                    "message": "No items found with sufficient data (minimum 5 records)"
                }
            }
        
        # Convert to list of dictionaries
        items_list = []
        for _, row in items_df.iterrows():
            items_list.append({
                "item_id": str(row[item_col]),
                "record_count": int(row['record_count']),
                "earliest_date": str(row['earliest_date']),
                "latest_date": str(row['latest_date']),
                "total_quantity": float(row['total_quantity']),
                "suitable_for_forecast": True
            })
        
        return {
            "status": "ok",
            "data": {
                "items": items_list,
                "total_count": len(items_list),
                "message": f"Found {len(items_list)} items with sufficient data for forecasting"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving items: {str(e)}"
        )

@app.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(
    request: ForecastRequest,
    api_key: str = Depends(get_api_key)
) -> ForecastResponse:
    """Generate demand forecast for specified item"""
    
    try:
        # Get database profile
        db_profile = get_database_profile(request.database_name)
        
        # Generate forecast
        forecast_data = await forecast_service.generate_forecast(request, db_profile)
        
        return ForecastResponse(
            status="ok",
            data=forecast_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)