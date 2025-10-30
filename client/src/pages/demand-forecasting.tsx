import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { Loader2, Sparkles, Database, TrendingUp, Search, ChevronDown, ChevronUp, RefreshCw, Trash2, Info, Download, FileText, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface Table {
  schema: string;
  name: string;
}

interface Column {
  name: string;
  type: string;
}

interface ForecastResult {
  overall?: {
    historical: Array<{ date: string; value: number }>;
    forecast: Array<{ date: string; value: number; lower: number; upper: number }>;
    metrics: {
      mape?: number;
      rmse?: number;
      mae?: number;
    };
  };
  items?: {
    [itemName: string]: {
      historical: Array<{ date: string; value: number }>;
      forecast: Array<{ date: string; value: number; lower: number; upper: number }>;
      metrics: {
        mape?: number;
        rmse?: number;
        mae?: number;
      };
      modelType?: string;
    };
  };
  // Legacy support for single-item forecast
  historical?: Array<{ date: string; value: number }>;
  forecast?: Array<{ date: string; value: number; lower: number; upper: number }>;
  metrics?: {
    mape?: number;
    rmse?: number;
  };
  success?: boolean;
  forecastedItemNames?: string[];
}


export default function DemandForecasting() {
  const { toast } = useToast();
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [dateColumn, setDateColumn] = useState<string>("");
  const [itemColumn, setItemColumn] = useState<string>("");
  const [quantityColumn, setQuantityColumn] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState<string>("");
  const [forecastDays, setForecastDays] = useState<number>(30);
  
  // New: Model and filter selections
  const [modelType, setModelType] = useState<string>("Prophet");
  const [hyperparameterTuning, setHyperparameterTuning] = useState<boolean>(false);
  const planningAreaColumn = "PlanningAreaName";
  const [selectedPlanningAreas, setSelectedPlanningAreas] = useState<string[]>([]);
  const [planningAreaSearch, setPlanningAreaSearch] = useState<string>("");
  const scenarioColumn = "ScenarioName";
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [scenarioSearch, setScenarioSearch] = useState<string>("");
  
  // Filter state for forecast visualization
  const [selectedForecastItem, setSelectedForecastItem] = useState<string>("");
  const [forecastMode, setForecastMode] = useState<"individual" | "overall">("overall");
  const [itemSearchQuery, setItemSearchQuery] = useState<string>("");
  const [forecastSearchQuery, setForecastSearchQuery] = useState<string>("");
  
  // Training state
  const [isModelTrained, setIsModelTrained] = useState<boolean>(false);
  const [trainingMetrics, setTrainingMetrics] = useState<{ 
    accuracy?: number; 
    mape?: number; 
    rmse?: number;
    order?: any;
    seasonal_order?: any;
    [key: string]: any;
  } | null>(null);
  const [itemsTrainingMetrics, setItemsTrainingMetrics] = useState<{
    [itemName: string]: {
      mape?: number;
      rmse?: number;
      mae?: number;
      accuracy?: number;
      success?: boolean;
      error?: string;
      metrics?: {
        mape?: number;
        rmse?: number;
        mae?: number;
      };
    }
  } | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  
  // Training results table state
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(false);
  const [itemSearchFilter, setItemSearchFilter] = useState<string>("");
  
  // Training progress state
  const [trainingProgress, setTrainingProgress] = useState<{
    currentItem: number;
    totalItems: number;
    startTime: number;
    estimatedRemainingTime: number;
  } | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Cache control state
  const [trainingMode, setTrainingMode] = useState<"smart" | "force_retrain">("smart");
  const [cacheStats, setCacheStats] = useState<{
    totalModels: number;
    totalSize: string;
    oldestModel: string;
    newestModel: string;
  } | null>(null);
  const [modelCacheInfo, setModelCacheInfo] = useState<{
    [itemName: string]: {
      exists: boolean;
      trainedAt?: string;
      dataPoints?: number;
      modelType?: string;
    }
  }>({});
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{
    table?: string;
    dateColumn?: string;
    itemColumn?: string;
    quantityColumn?: string;
    planningAreas?: string;
    scenarios?: string;
    items?: string;
  }>({});
  
  // Save forecast state
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [forecastName, setForecastName] = useState<string>("");
  const [forecastDescription, setForecastDescription] = useState<string>("");
  
  
  // Fetch SQL Server tables
  const { data: tablesData, isLoading: isLoadingTables } = useQuery({
    queryKey: ["/api/forecasting/tables"],
    enabled: true,
  });
  
  // Process tables data for Combobox
  const tables: Table[] = tablesData || [];

  // Set default table to 'publish.DASHt_SalesOrders' when tables are loaded
  useEffect(() => {
    if (tables && tables.length > 0 && !selectedTable) {
      const defaultTable = tables.find(
        (table: Table) => table.schema === "publish" && table.name === "DASHt_SalesOrders"
      );
      if (defaultTable) {
        console.log("Setting default table:", defaultTable);
        setSelectedTable(defaultTable);
      } else {
        console.log("Default table not found. Available tables:", tables.map((t: Table) => `${t.schema}.${t.name}`).slice(0, 10));
      }
    }
  }, [tables]);

  // Fetch columns when table is selected
  const { data: columnsData, isLoading: isLoadingColumns } = useQuery({
    queryKey: selectedTable 
      ? [`/api/forecasting/columns/${selectedTable.schema}/${selectedTable.name}`]
      : [],
    enabled: !!selectedTable,
  });
  const columns: Column[] = columnsData || [];

  // Fetch unique values for filters
  const { data: planningAreasData } = useQuery({
    queryKey: selectedTable && planningAreaColumn
      ? [`/api/forecasting/items/${selectedTable.schema}/${selectedTable.name}/${planningAreaColumn}`]
      : [],
    enabled: !!selectedTable && !!planningAreaColumn,
  });
  const planningAreas: string[] = planningAreasData || [];

  const { data: scenariosData } = useQuery({
    queryKey: selectedTable && scenarioColumn
      ? [`/api/forecasting/items/${selectedTable.schema}/${selectedTable.name}/${scenarioColumn}`]
      : [],
    enabled: !!selectedTable && !!scenarioColumn,
  });
  const scenarios: string[] = scenariosData || [];

  const { data: itemsData } = useQuery({
    queryKey: selectedTable && itemColumn
      ? [`/api/forecasting/items/${selectedTable.schema}/${selectedTable.name}/${itemColumn}?${new URLSearchParams({
          ...(selectedPlanningAreas.length > 0 && { planningAreas: selectedPlanningAreas.join(',') }),
          ...(selectedScenarios.length > 0 && { scenarios: selectedScenarios.join(',') })
        }).toString()}`]
      : [],
    enabled: !!selectedTable && !!itemColumn,
  });
  const items: string[] = itemsData || [];
  
  // Fetch cache statistics
  const { data: cacheStatsData } = useQuery({
    queryKey: ["/api/forecasting/cache/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  useEffect(() => {
    if (cacheStatsData) {
      setCacheStats(cacheStatsData);
    }
  }, [cacheStatsData]);
  
  const validateForm = () => {
    const errors: typeof validationErrors = {};
    
    if (!selectedTable) errors.table = "Please select a table";
    if (!dateColumn) errors.dateColumn = "Please select a date column";
    if (!itemColumn) errors.itemColumn = "Please select an item column";
    if (!quantityColumn) errors.quantityColumn = "Please select a quantity column";
    
    // Only require items selection for "individual" mode
    if (forecastMode === "individual" && selectedItems.length === 0) {
      errors.items = "Please select at least one item";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Train model mutation
  const trainMutation = useMutation({
    mutationFn: async ({ data, signal }: { data: any; signal?: AbortSignal }) => {
      const response = await apiRequest("POST", "/api/forecasting/train", data, signal);
      const result = await response.json();
      
      console.log("Training response from server:", result);
      return result;
    },
    onSuccess: (data) => {
      setIsModelTrained(true);
      setModelId(data.model_id || data.modelId);
      
      // Handle different response formats
      let metrics = {};
      
      // Build metrics object from itemsResults and overallMetrics
      if (data.itemsResults) {
        // Convert itemsResults to metrics format
        for (const [itemName, result] of Object.entries(data.itemsResults)) {
          if (result && typeof result === 'object' && 'metrics' in result) {
            metrics[itemName] = (result as any).metrics;
          }
        }
      }
      
      if (data.overallMetrics) {
        metrics['Overall'] = data.overallMetrics;
      }
      
      // If no metrics found in new format, check old format
      if (Object.keys(metrics).length === 0 && data.metrics) {
        metrics = data.metrics;
      }
      
      console.log("Training completed. Metrics:", metrics);
      
      // Store metrics based on forecast mode
      if (forecastMode === "overall") {
        // Only store overall metrics
        setTrainingMetrics(metrics.Overall || data.overallMetrics || {});
        setItemsTrainingMetrics(null);
      } else {
        // Store both overall and item-specific metrics
        const { Overall: overallMetrics, ...itemMetrics } = metrics;
        setTrainingMetrics(overallMetrics || data.overallMetrics || {});
        setItemsTrainingMetrics(itemMetrics || {});
      }
      
      // Count the number of items trained (excluding Overall)
      const metricsKeys = Object.keys(metrics);
      const itemCount = metricsKeys.filter(key => key !== 'Overall').length;
      
      toast({
        title: "Model Training Complete",
        description: forecastMode === "overall" 
          ? "Overall forecast model trained successfully"
          : itemCount > 0 
            ? `Successfully trained models for ${itemCount} item${itemCount > 1 ? 's' : ''} plus overall`
            : "Overall forecast model trained successfully",
      });
    },
    onError: (error: any) => {
      if (error.name !== 'AbortError') {
        toast({
          title: "Training Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      setTrainingProgress(null);
      setAbortController(null);
    },
  });

  // Generate forecast mutation  
  const forecastMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/forecasting/forecast", data);
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Forecast Generated",
          description: "Your demand forecast has been generated successfully.",
        });
        
        // Update selected forecast item to show the first available item
        if (data.forecastedItemNames && data.forecastedItemNames.length > 0) {
          setSelectedForecastItem("Overall");
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Forecast Failed", 
        description: error.message || "Failed to generate forecast",
        variant: "destructive",
      });
    },
  });
  
  // Save forecast mutation
  const saveForecastMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/forecasting/save-forecast", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Forecast saved successfully"
      });
      setShowSaveDialog(false);
      setForecastName("");
      setForecastDescription("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "Failed to save forecast"
      });
    }
  });
  

  // Auto-select first item when in individual mode and forecast is available
  useEffect(() => {
    if (forecastMode === "individual" && forecastMutation.data?.forecastedItemNames?.length > 0) {
      if (!selectedForecastItem || selectedForecastItem === "Overall") {
        setSelectedForecastItem(forecastMutation.data.forecastedItemNames[0]);
      }
    }
  }, [forecastMode, forecastMutation.data?.forecastedItemNames]);

  // Reset all progress when configuration changes
  useEffect(() => {
    // When any configuration changes, reset training and forecast state
    if (isModelTrained) {
      setIsModelTrained(false);
      setTrainingMetrics(null);
      setItemsTrainingMetrics(null);
      setModelId(null);
      // Clear forecast results
      forecastMutation.reset();
      // Clear selected forecast item
      setSelectedForecastItem("");
      
      // Notify user that their changes have reset the progress
      toast({
        title: "Configuration Changed",
        description: "Your changes have reset the training and forecast. Please retrain the model with the new configuration.",
        variant: "default",
      });
      
      console.log("Configuration changed - resetting training and forecast state");
    }
  }, [
    // Data source configuration
    selectedTable,
    dateColumn,
    itemColumn,
    quantityColumn,
    // Filters
    selectedPlanningAreas,
    selectedScenarios,
    selectedItems,
    // Model settings
    modelType,
    hyperparameterTuning,
    forecastMode,
    forecastDays
  ]);

  const handleTrain = async () => {
    console.log("handleTrain called");
    console.log("Forecast mode:", forecastMode);
    console.log("Selected items:", selectedItems);
    console.log("Items available:", items);
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Determine items to use based on mode and selection
    let itemsToTrain = selectedItems;
    if (forecastMode === "overall" && selectedItems.length === 0) {
      // In overall mode with no selection, use all items
      itemsToTrain = items || [];
    }
    
    // Warning for large selections
    const itemCount = itemsToTrain.length;
    
    if (itemCount > 1000) {
      const proceed = window.confirm(
        `You are about to train models for ${itemCount} items. This may take a significant amount of time. Do you want to proceed?`
      );
      if (!proceed) return;
    }
    
    // Create a new AbortController for this training session
    const controller = new AbortController();
    setAbortController(controller);
    
    // Set initial training progress
    if (forecastMode === "individual" && itemsToTrain.length > 0) {
      setTrainingProgress({
        currentItem: 0,
        totalItems: itemsToTrain.length,
        startTime: Date.now(),
        estimatedRemainingTime: itemsToTrain.length * 5000 // Estimate 5 seconds per item initially
      });
    }
    
    const trainingData = {
      schema: selectedTable!.schema,
      table: selectedTable!.name,
      dateColumn: dateColumn,
      itemColumn: itemColumn,
      quantityColumn: quantityColumn,
      selectedPlanningAreas: selectedPlanningAreas,
      selectedScenarios: selectedScenarios,
      selectedItems: itemsToTrain,
      modelType: modelType,
      hyperparameterTuning: hyperparameterTuning,
      planningAreaColumn: planningAreaColumn,
      scenarioColumn: scenarioColumn,
      forceRetrain: trainingMode === "force_retrain"
    };
    
    console.log("Training data being sent:", trainingData);
    
    try {
      // Pass both the data and abort signal to the mutation
      await trainMutation.mutateAsync({ 
        data: trainingData, 
        signal: controller.signal 
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Training was cancelled by user");
        toast({
          title: "Training Stopped",
          description: "Model training was stopped by user request.",
        });
      } else {
        console.error("Training error:", error);
      }
    } finally {
      setTrainingProgress(null);
      setAbortController(null);
    }
  };

  const handleForecast = async () => {
    if (!isModelTrained || !modelId) {
      toast({
        title: "No Model Trained",
        description: "Please train a model first before generating forecasts.",
        variant: "destructive",
      });
      return;
    }

    // Use the same items as training
    let itemsToForecast = selectedItems;
    if (forecastMode === "overall" && selectedItems.length === 0) {
      // In overall mode with no selection, use all items
      itemsToForecast = items || [];
    }

    await forecastMutation.mutateAsync({
      schema: selectedTable!.schema,
      table: selectedTable!.name,
      dateColumn: dateColumn,
      itemColumn: itemColumn,
      quantityColumn: quantityColumn,
      selectedPlanningAreas: selectedPlanningAreas,
      selectedScenarios: selectedScenarios,
      selectedItems: itemsToForecast,
      modelType: modelType,
      modelId: modelId,
      forecastDays: forecastDays,
      planningAreaColumn: planningAreaColumn,
      scenarioColumn: scenarioColumn
    });
  };
  
  const cancelTraining = () => {
    if (abortController) {
      // Show immediate feedback
      toast({
        title: "Stopping Training...",
        description: "Cancelling the training process. Please wait...",
      });
      
      // Abort the request
      abortController.abort();
      
      // Clean up state
      setTrainingProgress(null);
      setAbortController(null);
      
      // Clear any pending mutations
      if (trainMutation.isPending) {
        trainMutation.reset();
      }
    }
  };

  // Export chart functionality
  const exportChart = async () => {
    if (!chartRef.current) {
      toast({
        title: "Export Failed",
        description: "Chart element not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `forecast_${selectedForecastItem || 'overall'}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "Chart Exported",
        description: "The forecast chart has been downloaded as an image.",
      });
    } catch (error) {
      console.error('Failed to export chart:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export the chart. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Export training details for data science validation
  const exportTrainingDetails = () => {
    if (!trainingMetrics && !itemsTrainingMetrics) {
      toast({
        title: "Export Failed",
        description: "No training details available",
        variant: "destructive",
      });
      return;
    }

    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportVersion: "1.0",
          purpose: "Model Training Validation Report"
        },
        trainingConfiguration: {
          modelType: modelType,
          hyperparameterTuningEnabled: hyperparameterTuning,
          forecastMode: forecastMode,
          forecastDays: forecastDays,
          trainingTimestamp: new Date().toISOString(),
          cacheMode: trainingMode === "force_retrain" ? "Force Retrain All" : "Smart Training (Cache Enabled)"
        },
        dataConfiguration: {
          database: {
            schema: selectedTable?.schema,
            table: selectedTable?.name,
            dateColumn: dateColumn,
            itemColumn: itemColumn,
            quantityColumn: quantityColumn
          },
          filters: {
            planningAreas: selectedPlanningAreas,
            scenarios: selectedScenarios,
            selectedItems: forecastMode === "individual" ? selectedItems : "All Items (Aggregated)"
          }
        },
        modelHyperparameters: (() => {
          // Based on model type, include expected hyperparameters
          if (modelType === "Random Forest") {
            return {
              algorithm: "Random Forest Regressor",
              defaultParameters: {
                n_estimators: hyperparameterTuning ? "Tuned (50-200)" : 100,
                max_depth: hyperparameterTuning ? "Tuned (5-20)" : 10,
                min_samples_split: hyperparameterTuning ? "Tuned (2-10)" : 2,
                min_samples_leaf: hyperparameterTuning ? "Tuned (1-5)" : 1,
                max_features: "sqrt",
                random_state: 42,
                bootstrap: true
              },
              tuningDetails: hyperparameterTuning ? {
                method: "GridSearchCV",
                cv_folds: 5,
                scoring_metric: "neg_mean_absolute_error",
                parameter_grid: {
                  n_estimators: [50, 100, 200],
                  max_depth: [5, 10, 20],
                  min_samples_split: [2, 5, 10],
                  min_samples_leaf: [1, 2, 5]
                }
              } : null
            };
          } else if (modelType === "ARIMA") {
            return {
              algorithm: "ARIMA (AutoRegressive Integrated Moving Average)",
              defaultParameters: {
                order: hyperparameterTuning ? "Auto-selected" : "(1, 1, 1)",
                seasonal_order: hyperparameterTuning ? "Auto-selected" : "(0, 0, 0, 0)",
                trend: "c",
                method: "lbfgs",
                maxiter: 50,
                enforce_stationarity: true,
                enforce_invertibility: true
              },
              tuningDetails: hyperparameterTuning ? {
                method: "Auto-ARIMA",
                search_criteria: {
                  p_range: [0, 5],
                  d_range: [0, 2],
                  q_range: [0, 5],
                  seasonal: true,
                  stepwise: true,
                  suppress_warnings: true
                },
                information_criterion: "AIC"
              } : null
            };
          } else if (modelType === "Prophet") {
            return {
              algorithm: "Facebook Prophet",
              defaultParameters: {
                growth: "linear",
                changepoint_prior_scale: hyperparameterTuning ? "Tuned (0.001-0.5)" : 0.05,
                seasonality_prior_scale: hyperparameterTuning ? "Tuned (0.01-10)" : 10,
                holidays_prior_scale: 10,
                seasonality_mode: "additive",
                yearly_seasonality: "auto",
                weekly_seasonality: "auto",
                daily_seasonality: false,
                interval_width: 0.8
              },
              tuningDetails: hyperparameterTuning ? {
                method: "Cross-Validation Grid Search",
                parameter_grid: {
                  changepoint_prior_scale: [0.001, 0.01, 0.1, 0.5],
                  seasonality_prior_scale: [0.01, 0.1, 1.0, 10.0]
                },
                cv_horizon: "30 days",
                cv_period: "15 days",
                cv_initial: "90 days"
              } : null
            };
          } else if (modelType === "Linear Regression") {
            return {
              algorithm: "Linear Regression",
              defaultParameters: {
                fit_intercept: true,
                normalize: false,
                copy_X: true,
                n_jobs: -1,
                positive: false
              },
              featureEngineering: {
                time_features: ["day_of_week", "month", "quarter", "year"],
                lag_features: [1, 7, 14, 30],
                rolling_window_features: {
                  windows: [7, 14, 30],
                  aggregations: ["mean", "std", "min", "max"]
                }
              }
            };
          }
          return { algorithm: modelType, note: "Detailed parameters not available" };
        })(),
        performanceMetrics: {
          overall: trainingMetrics,
          perItem: forecastMode === "individual" ? itemsTrainingMetrics : null,
          evaluationMethod: "Time Series Split Validation",
          trainTestSplit: "80/20 temporal split"
        }
      };

      // Convert to JSON and download
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `model_training_details_${modelType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Training Details Exported",
        description: "Complete model configuration and hyperparameters have been exported for validation.",
      });
    } catch (error) {
      console.error('Failed to export training details:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export training details. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Export data to CSV
  const exportCSV = () => {
    if (!forecastMutation.data) {
      toast({
        title: "Export Failed",
        description: "No forecast data available",
        variant: "destructive",
      });
      return;
    }

    try {
      // Determine which item to export based on forecast mode
      let itemToShow = selectedForecastItem;
      
      if (forecastMode === "individual") {
        if (!itemToShow || itemToShow === "Overall") {
          itemToShow = forecastMutation.data.forecastedItemNames?.[0] || "";
        }
      } else {
        itemToShow = "Overall";
      }
      
      let csvData = [];
      let headers = ["Date", "Historical", "Forecast", "Lower Bound", "Upper Bound"];
      
      // Get data based on forecast mode and selected item
      let historical = [];
      let forecast = [];
      
      if (itemToShow === "Overall" && forecastMode === "overall" && forecastMutation.data.overall) {
        historical = forecastMutation.data.overall.historical;
        forecast = forecastMutation.data.overall.forecast;
      } else if (forecastMutation.data.items?.[itemToShow]) {
        const itemData = forecastMutation.data.items[itemToShow];
        historical = itemData.historical;
        forecast = itemData.forecast;
      } else if (forecastMutation.data.historical && forecastMutation.data.forecast) {
        // Legacy single-item format
        historical = forecastMutation.data.historical;
        forecast = forecastMutation.data.forecast;
      }
      
      // Combine historical and forecast data for CSV
      const allDates = new Set([
        ...historical.map((d: any) => d.date),
        ...forecast.map((d: any) => d.date)
      ]);
      
      // Create CSV rows
      const sortedDates = Array.from(allDates).sort();
      sortedDates.forEach(date => {
        const histItem = historical.find((h: any) => h.date === date);
        const fcstItem = forecast.find((f: any) => f.date === date);
        
        csvData.push([
          date,
          histItem ? histItem.value : "",
          fcstItem ? fcstItem.value : "",
          fcstItem ? fcstItem.lower : "",
          fcstItem ? fcstItem.upper : ""
        ]);
      });
      
      // Convert to CSV string
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.join(","))
      ].join("\n");
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `forecast_data_${itemToShow}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Data Exported",
        description: "The forecast data has been downloaded as a CSV file.",
      });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export the data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Filter items for search
  const filteredItems = items?.filter((item: string) =>
    item.toLowerCase().includes(itemSearch.toLowerCase())
  ) || [];
  
  const filteredPlanningAreas = planningAreas?.filter((area: string) =>
    area.toLowerCase().includes(planningAreaSearch.toLowerCase())
  ) || [];
  
  const filteredScenarios = scenarios?.filter((scenario: string) =>
    scenario.toLowerCase().includes(scenarioSearch.toLowerCase())
  ) || [];

  // Auto-select columns based on heuristics
  useEffect(() => {
    if (columns && columns.length > 0) {
      if (!dateColumn) {
        const dateCol = columns.find(c => 
          c.name.toLowerCase().includes('date') || 
          c.name.toLowerCase().includes('time')
        );
        if (dateCol) setDateColumn(dateCol.name);
      }
      if (!itemColumn) {
        const itemCol = columns.find(c => 
          c.name.toLowerCase().includes('item') || 
          c.name.toLowerCase().includes('product') ||
          c.name.toLowerCase().includes('sku')
        );
        if (itemCol) setItemColumn(itemCol.name);
      }
      if (!quantityColumn) {
        const qtyCol = columns.find(c => 
          c.name.toLowerCase().includes('qty') || 
          c.name.toLowerCase().includes('quantity') ||
          c.name.toLowerCase().includes('amount')
        );
        if (qtyCol) setQuantityColumn(qtyCol.name);
      }
    }
  }, [columns, dateColumn, itemColumn, quantityColumn]);

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Demand Forecasting
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered demand forecasting with SQL Server integration
          </p>
        </div>
      </div>

      {/* Configuration Section - Step 1 */}
      <Card className={isModelTrained ? "opacity-75" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-full">
                1
              </span>
              <Database className="w-5 h-5" />
              <span>Data Source Configuration</span>
              {selectedTable && dateColumn && itemColumn && quantityColumn && (
                <span className="ml-2 text-xs text-green-600">✓ Complete</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Table Selection */}
            <div className="space-y-2">
              <Label>Table</Label>
              <Combobox
                options={tables?.map((table) => ({
                  value: `${table.schema}.${table.name}`,
                  label: `${table.schema}.${table.name}`
                })) || []}
                value={selectedTable ? `${selectedTable.schema}.${selectedTable.name}` : ""}
                onValueChange={(value) => {
                  const [schema, name] = value.split(".");
                  setSelectedTable({ schema, name });
                }}
                placeholder="Select a table..."
                disabled={isLoadingTables}
              />
              {validationErrors.table && (
                <p className="text-sm text-red-500">{validationErrors.table}</p>
              )}
            </div>

            {/* Date Column */}
            <div className="space-y-2">
              <Label>Date Column</Label>
              <Combobox
                options={columns?.map((col) => ({
                  value: col.name,
                  label: col.name
                })) || []}
                value={dateColumn}
                onValueChange={setDateColumn}
                placeholder="Select date column..."
                disabled={!selectedTable || isLoadingColumns}
              />
              {validationErrors.dateColumn && (
                <p className="text-sm text-red-500">{validationErrors.dateColumn}</p>
              )}
            </div>

            {/* Item Column */}
            <div className="space-y-2">
              <Label>Item Column</Label>
              <Combobox
                options={columns?.map((col) => ({
                  value: col.name,
                  label: col.name
                })) || []}
                value={itemColumn}
                onValueChange={setItemColumn}
                placeholder="Select item column..."
                disabled={!selectedTable || isLoadingColumns}
              />
              {validationErrors.itemColumn && (
                <p className="text-sm text-red-500">{validationErrors.itemColumn}</p>
              )}
            </div>

            {/* Quantity Column */}
            <div className="space-y-2">
              <Label>Quantity Column</Label>
              <Combobox
                options={columns?.map((col) => ({
                  value: col.name,
                  label: col.name
                })) || []}
                value={quantityColumn}
                onValueChange={setQuantityColumn}
                placeholder="Select quantity column..."
                disabled={!selectedTable || isLoadingColumns}
              />
              {validationErrors.quantityColumn && (
                <p className="text-sm text-red-500">{validationErrors.quantityColumn}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Section - Step 2 - Only show when Step 1 is complete */}
      {!selectedTable || !dateColumn || !itemColumn || !quantityColumn ? (
        <Card className="mb-4 opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-gray-400 rounded-full">
                  2
                </span>
                <span className="text-gray-600">Filters</span>
                <span className="text-sm text-gray-500">(Complete Step 1 first)</span>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <Card className={isModelTrained ? "opacity-75" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-full">
                  2
                </span>
                <span>Filters</span>
                {(selectedPlanningAreas.length > 0 || selectedScenarios.length > 0 || selectedItems.length > 0) && (
                  <span className="ml-2 text-xs text-green-600">✓ Configured</span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Planning Area Filter */}
            <div className="space-y-2">
              <Label>Planning Areas</Label>
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                <div className="mb-2">
                  <Input
                    placeholder="Search planning areas..."
                    value={planningAreaSearch}
                    onChange={(e) => setPlanningAreaSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  {filteredPlanningAreas?.length > 0 ? (
                    <>
                      <div className="flex gap-2 mb-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPlanningAreas(filteredPlanningAreas)}
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPlanningAreas([])}
                        >
                          Clear All
                        </Button>
                      </div>
                      {filteredPlanningAreas.map((area: string) => (
                        <label key={area} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedPlanningAreas.includes(area)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlanningAreas([...selectedPlanningAreas, area]);
                              } else {
                                setSelectedPlanningAreas(selectedPlanningAreas.filter(a => a !== area));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{area}</span>
                        </label>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No planning areas available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Scenario Filter */}
            <div className="space-y-2">
              <Label>Scenarios</Label>
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                <div className="mb-2">
                  <Input
                    placeholder="Search scenarios..."
                    value={scenarioSearch}
                    onChange={(e) => setScenarioSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  {filteredScenarios?.length > 0 ? (
                    <>
                      <div className="flex gap-2 mb-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedScenarios(filteredScenarios)}
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedScenarios([])}
                        >
                          Clear All
                        </Button>
                      </div>
                      {filteredScenarios.map((scenario: string) => (
                        <label key={scenario} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedScenarios.includes(scenario)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScenarios([...selectedScenarios, scenario]);
                              } else {
                                setSelectedScenarios(selectedScenarios.filter(s => s !== scenario));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{scenario}</span>
                        </label>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No scenarios available</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Item Selection */}
            <div className="space-y-2">
              <Label>
                {forecastMode === "individual" 
                  ? `Items (${selectedItems.length} selected)`
                  : `Items (${selectedItems.length === 0 ? 'All' : selectedItems.length} selected)`}
              </Label>
            {validationErrors.items && (
              <p className="text-sm text-red-500">{validationErrors.items}</p>
            )}
            <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                <div className="mb-2">
                  <Input
                    placeholder="Search items..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  {filteredItems.length > 0 ? (
                    <>
                      <div className="flex gap-2 mb-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedItems(filteredItems)}
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedItems([])}
                        >
                          Clear All
                        </Button>
                      </div>
                      {filteredItems.map((item: string) => (
                        <label key={item} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, item]);
                              } else {
                                setSelectedItems(selectedItems.filter(i => i !== item));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{item}</span>
                        </label>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {itemColumn ? "No items found" : "Select an item column first"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Forecast Settings - Step 3 - Only show when Steps 1 & 2 are complete */}
      {!selectedTable || !dateColumn || !itemColumn || !quantityColumn ? (
        <Card className="mb-4 opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-gray-400 rounded-full">
                  3
                </span>
                <span className="text-gray-600">Model Configuration & Training</span>
                <span className="text-sm text-gray-500">(Complete Steps 1 & 2 first)</span>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full ${
                !selectedTable || !dateColumn || !itemColumn || !quantityColumn
                  ? "bg-gray-400"
                  : "bg-blue-600"
              }`}>
                3
              </span>
              <TrendingUp className="w-5 h-5" />
              <span>Model Configuration & Training</span>
              {isModelTrained && (
                <span className="ml-2 text-xs text-green-600">✓ Model Trained</span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main configuration row - 3 columns for dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Forecast Days */}
            <div className="space-y-2">
              <Label>Forecast Days</Label>
              <Input
                type="number"
                value={forecastDays}
                onChange={(e) => setForecastDays(parseInt(e.target.value) || 30)}
                min={1}
                max={365}
                placeholder="30"
              />
            </div>
            
            {/* Model Type */}
            <div className="space-y-2">
              <Label>Model Type</Label>
              <Combobox
                options={[
                  { value: "Random Forest", label: "Random Forest" },
                  { value: "ARIMA", label: "ARIMA" },
                  { value: "Prophet", label: "Prophet" },
                  { value: "Linear Regression", label: "Linear Regression" }
                ]}
                value={modelType}
                onValueChange={setModelType}
                placeholder="Select model..."
              />
            </div>
            
            {/* Forecast Mode */}
            <div className="space-y-2">
              <Label>Forecast Mode</Label>
              <Combobox
                options={[
                  { value: "individual", label: "Individual" },
                  { value: "overall", label: "Overall" }
                ]}
                value={forecastMode}
                onValueChange={(value) => setForecastMode(value as "individual" | "overall")}
                placeholder="Select mode..."
              />
            </div>
          </div>
          
          {/* Hyperparameter Tuning - separate row */}
          <div className="flex items-center space-x-2">
            <Switch
              id="hyperparameter-tuning"
              checked={hyperparameterTuning}
              onCheckedChange={setHyperparameterTuning}
            />
            <Label htmlFor="hyperparameter-tuning">
              Hyperparameter Tuning (Slower but more accurate)
            </Label>
          </div>

          {/* Model Information - Simplified */}
          {modelType && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">About {modelType}</AlertTitle>
              <AlertDescription className="text-blue-800 text-sm">
                {modelType === "Random Forest" && (
                  <p>💡 <strong>Use when:</strong> You have irregular, sporadic demand or items with unpredictable ordering patterns. Great for handling outliers and missing data.</p>
                )}
                {modelType === "ARIMA" && (
                  <p>💡 <strong>Use when:</strong> You have regular, predictable patterns with clear seasonality (weekly, monthly cycles). Best for short-term forecasts.</p>
                )}
                {modelType === "Prophet" && (
                  <p>💡 <strong>Use when:</strong> Your sales are affected by holidays, promotions, or special events. Good default choice for most business data.</p>
                )}
                {modelType === "Linear Regression" && (
                  <p>💡 <strong>Use when:</strong> You see a simple upward or downward trend. Quick baseline for comparison with more complex models.</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Training Mode Section - Only show for individual mode */}
          {forecastMode === "individual" && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Training Mode
                </h4>
                {cacheStats && (
                  <div className="text-sm text-gray-600">
                    {cacheStats.totalModels} models cached ({cacheStats.totalSize})
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Training Mode Selector */}
                <div className="space-y-2">
                  <Label>Training Mode</Label>
                  <Combobox
                    options={[
                      { 
                        value: "smart", 
                        label: "Train Only Missing",
                        description: "Only train items without any trained model found (helps save time)" 
                      },
                      { 
                        value: "force_retrain", 
                        label: "Train Everything",
                        description: "Train all items even with existing models (more up-to-date for increased accuracy)" 
                      }
                    ]}
                    value={trainingMode}
                    onValueChange={(value) => setTrainingMode(value as "smart" | "force_retrain")}
                    placeholder="Select training mode..."
                  />
                </div>
                
                {/* Cache Statistics */}
                {cacheStats && (
                  <div className="space-y-2">
                    <Label>Model Cache Information</Label>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>Oldest model: {cacheStats.oldestModel}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>Newest model: {cacheStats.newestModel}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Training Mode Info */}
              <div className="text-xs text-gray-600 italic">
                {trainingMode === "smart" && (
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Train Only Missing: Will only train items that don't have any cached models. This is the fastest option and saves time by reusing existing models.
                  </span>
                )}
                {trainingMode === "force_retrain" && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <Info className="w-3 h-3" />
                    Train Everything: Will retrain all items with the latest data from the database, replacing any existing models. Use this when data has changed significantly for better accuracy.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Training Progress */}
          {trainingProgress && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-md p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="font-semibold text-blue-900">Training in Progress</span>
                </div>
                <Button
                  size="default"
                  variant="destructive"
                  onClick={cancelTraining}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-4"
                >
                  <span className="mr-2">⛔</span>
                  Stop Training
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-medium">
                    Processing Item {trainingProgress.currentItem} of {trainingProgress.totalItems}
                  </span>
                  <span className="font-medium">
                    Est. time remaining: {Math.ceil(trainingProgress.estimatedRemainingTime / 1000)}s
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 shadow-sm"
                    style={{ 
                      width: `${(trainingProgress.currentItem / trainingProgress.totalItems) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 italic">
                  Tip: Training may take several minutes for large datasets. Click "Stop Training" to cancel at any time.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleTrain}
              disabled={trainMutation.isPending || !!trainingProgress}
            >
              {trainMutation.isPending || trainingProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Training Model...
                </>
              ) : (
                "Train Model"
              )}
            </Button>
            <Button
              onClick={handleForecast}
              disabled={!isModelTrained || forecastMutation.isPending}
              className={
                !isModelTrained || forecastMutation.isPending
                  ? "" // Default disabled styling
                  : "bg-green-600 hover:bg-green-700 text-white animate-pulse hover:animate-none"
              }
            >
              {forecastMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Forecast...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Forecast
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Training Results */}
      {isModelTrained && (trainingMetrics || itemsTrainingMetrics) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Training Results</span>
              <Button
                size="sm"
                variant="outline"
                onClick={exportTrainingDetails}
                title="Export complete training details for data science validation"
              >
                <FileText className="h-4 w-4 mr-1" />
                Export Training Details
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Overall Metrics - Only show for "overall" mode */}
            {forecastMode === "overall" && trainingMetrics && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-semibold mb-2">Overall Forecast Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {trainingMetrics.mape !== undefined && (
                    <div>
                      <span className="font-medium">MAPE:</span> {trainingMetrics.mape.toFixed(2)}%
                    </div>
                  )}
                  {trainingMetrics.rmse !== undefined && (
                    <div>
                      <span className="font-medium">RMSE:</span> {trainingMetrics.rmse.toFixed(2)}
                    </div>
                  )}
                  {trainingMetrics.mae !== undefined && (
                    <div>
                      <span className="font-medium">MAE:</span> {trainingMetrics.mae.toFixed(2)}
                    </div>
                  )}
                  {trainingMetrics.accuracy !== undefined && (
                    <div>
                      <span className="font-medium">Accuracy:</span> {trainingMetrics.accuracy.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Item-specific metrics - Only show for "individual" mode */}
            {forecastMode === "individual" && itemsTrainingMetrics && Object.keys(itemsTrainingMetrics).length > 0 && (
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => setIsTableExpanded(!isTableExpanded)}
                >
                  <h4 className="font-semibold">
                    Item-Level Metrics ({Object.keys(itemsTrainingMetrics).length} items)
                  </h4>
                  {isTableExpanded ? <ChevronUp /> : <ChevronDown />}
                </div>
                
                {isTableExpanded && (
                  <div className="mt-4">
                    <div className="mb-3">
                      <Input
                        placeholder="Search items..."
                        value={itemSearchFilter}
                        onChange={(e) => setItemSearchFilter(e.target.value)}
                        className="max-w-sm"
                        icon={<Search className="w-4 h-4" />}
                      />
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Item</th>
                            <th className="text-right p-2">MAPE (%)</th>
                            <th className="text-right p-2">RMSE</th>
                            <th className="text-right p-2">MAE</th>
                            <th className="text-center p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(itemsTrainingMetrics)
                            .filter(([itemName]) => 
                              itemName.toLowerCase().includes(itemSearchFilter.toLowerCase())
                            )
                            .map(([itemName, metrics]) => {
                              // Handle both direct metrics and nested metrics structure
                              const displayMetrics = metrics.metrics || metrics;
                              
                              if (metrics.success === false || metrics.error) {
                                return (
                                  <tr key={itemName} className="border-b hover:bg-muted/50">
                                    <td className="p-2 font-medium">{itemName}</td>
                                    <td colSpan={3} className="text-center p-2 text-muted-foreground">
                                      {metrics.error || "Training failed"}
                                    </td>
                                    <td className="text-center p-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Failed
                                      </span>
                                    </td>
                                  </tr>
                                );
                              }
                              
                              return (
                                <tr key={itemName} className="border-b hover:bg-muted/50">
                                  <td className="p-2 font-medium">{itemName}</td>
                                  <td className="text-right p-2">
                                    {displayMetrics.mape !== undefined ? displayMetrics.mape.toFixed(2) : '-'}
                                  </td>
                                  <td className="text-right p-2">
                                    {displayMetrics.rmse !== undefined ? displayMetrics.rmse.toFixed(2) : '-'}
                                  </td>
                                  <td className="text-right p-2">
                                    {displayMetrics.mae !== undefined ? displayMetrics.mae.toFixed(2) : '-'}
                                  </td>
                                  <td className="text-center p-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Success
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Forecast Results */}
      {forecastMutation.isSuccess && forecastMutation.data && (
        <div className="space-y-4">
          {/* Forecast Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {(() => {
                      let itemToShow = selectedForecastItem;
                      
                      // Handle item selection based on forecast mode
                      if (forecastMode === "individual") {
                        if (!itemToShow || itemToShow === "Overall") {
                          itemToShow = forecastMutation.data.forecastedItemNames?.[0] || "";
                        }
                      } else {
                        itemToShow = itemToShow || "Overall";
                      }
                      
                      const currentData = (itemToShow === "Overall" && forecastMode === "overall")
                        ? forecastMutation.data.overall 
                        : forecastMutation.data.items?.[itemToShow];
                      
                      if (!currentData?.forecast) return '0.0';
                      
                      const avgDaily = currentData.forecast.reduce((sum: number, d: any) => sum + d.value, 0) / currentData.forecast.length;
                      return avgDaily.toFixed(1);
                    })()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Avg Daily Forecast
                  </div>
                  {(() => {
                    let itemToShow = selectedForecastItem;
                    
                    // Handle item selection based on forecast mode
                    if (forecastMode === "individual") {
                      if (!itemToShow || itemToShow === "Overall") {
                        itemToShow = forecastMutation.data.forecastedItemNames?.[0] || "";
                      }
                    } else {
                      itemToShow = itemToShow || "Overall";
                    }
                    
                    const currentData = (itemToShow === "Overall" && forecastMode === "overall")
                      ? forecastMutation.data.overall 
                      : forecastMutation.data.items?.[itemToShow];
                    
                    if (!currentData?.historical || !currentData?.forecast) return null;
                    
                    const historicalAvg = currentData.historical.reduce((sum: number, d: any) => sum + d.value, 0) / currentData.historical.length;
                    const forecastAvg = currentData.forecast.reduce((sum: number, d: any) => sum + d.value, 0) / currentData.forecast.length;
                    const percentChange = ((forecastAvg - historicalAvg) / historicalAvg) * 100;
                    
                    return (
                      <div className={`text-sm mt-1 ${percentChange < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {percentChange > 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}%
                      </div>
                    );
                  })()}
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(() => {
                      let itemToShow = selectedForecastItem;
                      
                      // Handle item selection based on forecast mode
                      if (forecastMode === "individual") {
                        if (!itemToShow || itemToShow === "Overall") {
                          itemToShow = forecastMutation.data.forecastedItemNames?.[0] || "";
                        }
                      } else {
                        itemToShow = itemToShow || "Overall";
                      }
                      
                      const currentData = (itemToShow === "Overall" && forecastMode === "overall")
                        ? forecastMutation.data.overall 
                        : forecastMutation.data.items?.[itemToShow];
                      
                      if (!currentData?.forecast) return '0';
                      
                      return Math.round(currentData.forecast.reduce((sum: number, d: any) => sum + d.value, 0)).toLocaleString();
                    })()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Total {forecastDays} Day Forecast
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {forecastMode === "overall" 
                      ? (forecastMutation.data.forecastedItemNames?.length || 0)
                      : (forecastMutation.data.forecastedItemNames?.length || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {forecastMode === "overall" 
                      ? "Items Aggregated" 
                      : "Individual Items"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <span>Forecast Visualization</span>
                  <div className="flex items-center gap-2">
                    {/* Item selection - Show only for individual mode when we have forecasted items */}
                    {forecastMode === "individual" && forecastMutation.data.forecastedItemNames && forecastMutation.data.forecastedItemNames.length > 0 && (
                      <Combobox
                        options={
                          // Don't include "Overall" option in individual mode
                          (forecastMutation.data.forecastedItemNames || [])
                            .map((item: string) => ({
                              value: item,
                              label: item
                            }))
                        }
                        value={selectedForecastItem}
                        onValueChange={setSelectedForecastItem}
                        placeholder="Select item..."
                        className="w-64"
                      />
                    )}
                    {/* Save and Export buttons */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const timestamp = new Date().toISOString().split('T')[0];
                        const itemName = selectedForecastItem || "Overall";
                        setForecastName(`${itemName} Forecast - ${timestamp}`);
                        setShowSaveDialog(true);
                      }}
                      title="Save forecast to favorites"
                      disabled={!forecastMutation.data}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportChart}
                      title="Export chart as PNG image"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PNG
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportCSV}
                      title="Export data as CSV"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Determine which item to show based on forecast mode
                let itemToShow = selectedForecastItem;
                
                // If in individual mode and no item selected, use first available item
                if (forecastMode === "individual") {
                  if (!itemToShow || itemToShow === "Overall") {
                    itemToShow = forecastMutation.data.forecastedItemNames?.[0] || "";
                  }
                } else {
                  // In overall mode, default to "Overall"
                  itemToShow = itemToShow || "Overall";
                }
                
                let chartData: any[] = [];
                let metrics: any = {};
                
                // Get data based on forecast mode and selected item
                if (itemToShow === "Overall" && forecastMode === "overall" && forecastMutation.data.overall) {
                  const { historical, forecast } = forecastMutation.data.overall;
                  metrics = forecastMutation.data.overall.metrics || {};
                  
                  // Combine historical and forecast data
                  chartData = [
                    ...historical.map((d: any) => ({
                      date: new Date(d.date).getTime(),
                      historical: d.value
                    })),
                    ...forecast.map((d: any) => ({
                      date: new Date(d.date).getTime(),
                      forecast: d.value,
                      lower: d.lower,
                      upper: d.upper
                    }))
                  ];
                } else if (forecastMutation.data.items?.[itemToShow]) {
                  const itemData = forecastMutation.data.items[itemToShow];
                  const { historical, forecast } = itemData;
                  metrics = itemData.metrics || {};
                  
                  chartData = [
                    ...historical.map((d: any) => ({
                      date: new Date(d.date).getTime(),
                      historical: d.value
                    })),
                    ...forecast.map((d: any) => ({
                      date: new Date(d.date).getTime(),
                      forecast: d.value,
                      lower: d.lower,
                      upper: d.upper
                    }))
                  ];
                } else if (forecastMutation.data.historical && forecastMutation.data.forecast) {
                  // Legacy single-item format
                  const { historical, forecast } = forecastMutation.data;
                  metrics = forecastMutation.data.metrics || {};
                  
                  chartData = [
                    ...historical.map((d: any) => ({
                      date: new Date(d.date).getTime(),
                      historical: d.value
                    })),
                    ...forecast.map((d: any) => ({
                      date: new Date(d.date).getTime(),
                      forecast: d.value,
                      lower: d.lower,
                      upper: d.upper
                    }))
                  ];
                }
                
                if (chartData.length === 0) {
                  return (
                    <div className="text-center text-muted-foreground p-8">
                      No forecast data available for the selected item.
                    </div>
                  );
                }
                
                return (
                  <div ref={chartRef}>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          domain={['dataMin', 'dataMax']}
                          type="number"
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => {
                            const date = new Date(value as number);
                            return date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            });
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="historical"
                          stroke="#8884d8"
                          name="Historical"
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="forecast"
                          stroke="#82ca9d"
                          name="Forecast"
                          strokeWidth={2}
                          dot={false}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="lower"
                          stroke="#ffc658"
                          name="Lower Bound"
                          strokeDasharray="5 5"
                          dot={false}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="upper"
                          stroke="#ff7c7c"
                          name="Upper Bound"
                          strokeDasharray="5 5"
                          dot={false}
                          connectNulls
                        />
                        <Brush dataKey="date" height={30} stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                    
                    {/* Display Metrics */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-4 text-sm">
                        {metrics?.mape !== undefined && (
                          <span>MAPE: {metrics.mape.toFixed(2)}%</span>
                        )}
                        {metrics?.rmse !== undefined && (
                          <span>RMSE: {metrics.rmse.toFixed(2)}</span>
                        )}
                        {metrics?.mae !== undefined && (
                          <span>MAE: {metrics.mae.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Save Forecast Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Forecast to Favorites</DialogTitle>
            <DialogDescription>
              Save this forecast for easy access in Material Requirements Planning
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="forecast-name">Name</Label>
              <Input
                id="forecast-name"
                value={forecastName}
                onChange={(e) => setForecastName(e.target.value)}
                placeholder="Enter a name for this forecast"
              />
            </div>
            <div>
              <Label htmlFor="forecast-description">Description (Optional)</Label>
              <Input
                id="forecast-description"
                value={forecastDescription}
                onChange={(e) => setForecastDescription(e.target.value)}
                placeholder="Add a description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!forecastName.trim()) {
                  toast({
                    variant: "destructive",
                    title: "Name Required",
                    description: "Please enter a name for the forecast"
                  });
                  return;
                }
                
                // Prepare forecast data
                const forecastData = forecastMutation.data;
                const saveData = {
                  name: forecastName.trim(),
                  description: forecastDescription.trim(),
                  modelType,
                  forecastDays,
                  itemColumn,
                  quantityColumn,
                  dateColumn,
                  forecastedItems: forecastData?.forecastedItemNames || [],
                  planningAreas: selectedPlanningAreas,
                  scenarios: selectedScenarios,
                  forecastData: forecastData?.overall || forecastData,
                  itemForecasts: forecastData?.items,
                  metrics: forecastData?.overall?.metrics || forecastData?.metrics
                };
                
                saveForecastMutation.mutate(saveData);
              }}
              disabled={saveForecastMutation.isPending}
            >
              {saveForecastMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Forecast"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}