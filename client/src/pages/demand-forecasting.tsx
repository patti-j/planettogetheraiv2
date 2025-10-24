import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { Loader2, Sparkles, Database, TrendingUp, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [dateColumn, setDateColumn] = useState<string>("");
  const [itemColumn, setItemColumn] = useState<string>("");
  const [quantityColumn, setQuantityColumn] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState<string>("");
  const [forecastDays, setForecastDays] = useState<number>(30);
  
  // New: Model and filter selections
  const [modelType, setModelType] = useState<string>("Random Forest");
  const [hyperparameterTuning, setHyperparameterTuning] = useState<boolean>(false);
  const planningAreaColumn = "PlanningAreaName";
  const [selectedPlanningAreas, setSelectedPlanningAreas] = useState<string[]>([]);
  const [planningAreaSearch, setPlanningAreaSearch] = useState<string>("");
  const scenarioColumn = "ScenarioName";
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [scenarioSearch, setScenarioSearch] = useState<string>("");
  
  // Filter state for forecast visualization
  const [selectedForecastItem, setSelectedForecastItem] = useState<string>("Overall");
  const [forecastMode, setForecastMode] = useState<"separate" | "overall">("separate");
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
  
  // Validation errors
  const [planningAreaError, setPlanningAreaError] = useState<boolean>(false);
  const [scenarioError, setScenarioError] = useState<boolean>(false);
  const [itemError, setItemError] = useState<boolean>(false);

  // Fetch available tables
  const { data: tables, isLoading: tablesLoading } = useQuery<Table[]>({
    queryKey: ["/api/forecasting/tables"],
    queryFn: async () => {
      const response = await fetch("/api/forecasting/tables");
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json();
    },
  });

  // Fetch columns for selected table
  const { data: columns } = useQuery<Column[]>({
    queryKey: ["/api/forecasting/columns", selectedTable?.schema, selectedTable?.name],
    enabled: !!selectedTable,
    queryFn: async () => {
      if (!selectedTable) return [];
      const response = await fetch(`/api/forecasting/columns/${selectedTable.schema}/${selectedTable.name}`);
      if (!response.ok) throw new Error("Failed to fetch columns");
      return response.json();
    },
  });

  // Fetch planning area and scenario combinations
  const { data: planningScenarioCombinations } = useQuery<Array<{ planningArea: string; scenario: string }>>({
    queryKey: ["/api/forecasting/planning-scenario-combinations", selectedTable?.schema, selectedTable?.name],
    enabled: !!selectedTable,
    queryFn: async () => {
      if (!selectedTable) return [];
      const response = await fetch(`/api/forecasting/planning-scenario-combinations/${selectedTable.schema}/${selectedTable.name}`);
      if (!response.ok) throw new Error("Failed to fetch planning-scenario combinations");
      return response.json();
    },
  });

  // Extract unique planning areas and scenarios from combinations
  const planningAreas = planningScenarioCombinations 
    ? Array.from(new Set(planningScenarioCombinations.map(c => c.planningArea))).sort()
    : [];
  
  const scenarios = planningScenarioCombinations
    ? Array.from(new Set(planningScenarioCombinations.map(c => c.scenario))).sort()
    : [];

  // Filter scenarios based on selected planning areas
  const filteredScenarios = selectedPlanningAreas.length > 0
    ? Array.from(new Set(
        planningScenarioCombinations
          ?.filter(c => selectedPlanningAreas.includes(c.planningArea))
          .map(c => c.scenario)
      )).sort()
    : scenarios;

  // Filter planning areas based on selected scenarios
  const filteredPlanningAreas = selectedScenarios.length > 0
    ? Array.from(new Set(
        planningScenarioCombinations
          ?.filter(c => selectedScenarios.includes(c.scenario))
          .map(c => c.planningArea)
      )).sort()
    : planningAreas;

  // Fetch items for selected item column (filtered by planning areas and scenarios)
  const { data: items } = useQuery<string[]>({
    queryKey: ["/api/forecasting/items", selectedTable?.schema, selectedTable?.name, itemColumn, selectedPlanningAreas, selectedScenarios],
    enabled: !!selectedTable && !!itemColumn,
    queryFn: async () => {
      if (!selectedTable || !itemColumn) return [];
      
      // Build query parameters for filtering
      const params = new URLSearchParams();
      if (selectedPlanningAreas.length > 0) {
        params.set('planningAreas', selectedPlanningAreas.join(','));
      }
      if (selectedScenarios.length > 0) {
        params.set('scenarios', selectedScenarios.join(','));
      }
      
      const queryString = params.toString();
      const url = `/api/forecasting/items/${selectedTable.schema}/${selectedTable.name}/${itemColumn}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
  });

  // Train model mutation - updated to handle multiple items
  const trainMutation = useMutation<{ 
    overallMetrics?: { 
      accuracy?: number; 
      mape?: number; 
      rmse?: number;
      order?: any;
      seasonal_order?: any;
      [key: string]: any;
    };
    itemsResults?: {
      [itemName: string]: {
        success: boolean;
        metrics?: {
          mape?: number;
          rmse?: number;
          accuracy?: number;
        };
        error?: string;
      }
    };
    trainedItems?: number;
    trainedItemNames?: string[];
    modelId?: string; 
    modelType?: string;
  }, Error, void>({
    mutationFn: async () => {
      // Create abort controller for cancellation
      const controller = new AbortController();
      setAbortController(controller);
      
      // Set initial progress
      const startTime = Date.now();
      setTrainingProgress({
        currentItem: 0,
        totalItems: selectedItems.length,
        startTime,
        estimatedRemainingTime: selectedItems.length * 2000, // Estimate 2 seconds per item
      });
      
      try {
        const response = await fetch("/api/forecasting/train", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            schema: selectedTable?.schema,
            table: selectedTable?.name,
            dateColumn,
            itemColumn,
            quantityColumn,
            selectedItems,  // Send all selected items, not just the first one
            modelType,
            hyperparameterTuning,
            planningAreaColumn: planningAreaColumn || null,
            selectedPlanningAreas: selectedPlanningAreas.length > 0 ? selectedPlanningAreas : null,
            scenarioColumn: scenarioColumn || null,
            selectedScenarios: selectedScenarios.length > 0 ? selectedScenarios : null,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Training failed');
        }
        return await response.json();
      } finally {
        // Clean up progress and abort controller
        setTrainingProgress(null);
        setAbortController(null);
      }
    },
    onSuccess: (data) => {
      setIsModelTrained(true);
      setTrainingMetrics(data.overallMetrics || data.metrics);
      setItemsTrainingMetrics(data.itemsResults || null);
      if (data.modelId) {
        setModelId(data.modelId);
      }
      
      // Show success message with details about trained items
      if (data.trainedItems && data.trainedItemNames) {
        toast({
          title: "Models Trained Successfully",
          description: `Trained ${data.trainedItems} models for items: ${data.trainedItemNames.join(', ')}. Average MAPE: ${data.overallMetrics?.mape?.toFixed(2)}%`,
        });
      } else {
        toast({
          title: "Model Trained Successfully",
          description: `${data.modelType || modelType} model trained with MAPE: ${data.overallMetrics?.mape?.toFixed(2) || 'N/A'}%`,
        });
      }
    },
    onError: (error) => {
      setIsModelTrained(false);
      setTrainingMetrics(null);
      setItemsTrainingMetrics(null);
      setModelId(null);
      
      // Handle abort separately
      if (error.name === 'AbortError') {
        toast({
          title: "Training Stopped",
          description: "Training was cancelled by user",
        });
      } else {
        toast({
          title: "Training Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Forecast mutation - updated to handle multiple items
  const forecastMutation = useMutation<ForecastResult, Error, void>({
    mutationFn: async () => {
      const response = await fetch("/api/forecasting/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: selectedTable?.schema,
          table: selectedTable?.name,
          dateColumn,
          itemColumn,
          quantityColumn,
          selectedItems,  // Send all selected items
          forecastDays,
          modelType,
          modelId: modelId || undefined, // Send the stored modelId from training
          planningAreaColumn: planningAreaColumn || null,
          selectedPlanningAreas: selectedPlanningAreas.length > 0 ? selectedPlanningAreas : null,
          scenarioColumn: scenarioColumn || null,
          selectedScenarios: selectedScenarios.length > 0 ? selectedScenarios : null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Forecast failed');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Update the selected forecast item to "Overall" by default
      setSelectedForecastItem("Overall");
      
      const itemCount = data.forecastedItemNames?.length || 0;
      toast({
        title: "Forecast Complete",
        description: `Generated ${forecastDays}-day forecast for ${itemCount} item(s) successfully`,
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/forecasting"] });
    },
    onError: (error) => {
      toast({
        title: "Forecast Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTrain = () => {
    if (!selectedTable || !dateColumn || !itemColumn || !quantityColumn) {
      toast({
        title: "Missing Configuration",
        description: "Please select all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Clear all errors first
    setPlanningAreaError(false);
    setScenarioError(false);
    setItemError(false);
    
    // Validate required fields
    let hasError = false;
    
    if (selectedPlanningAreas.length === 0) {
      setPlanningAreaError(true);
      hasError = true;
    }
    
    if (selectedScenarios.length === 0) {
      setScenarioError(true);
      hasError = true;
    }
    
    if (selectedItems.length === 0) {
      setItemError(true);
      hasError = true;
    }
    
    if (hasError) {
      toast({
        title: "Required Fields Missing",
        description: "Please select at least one planning area, scenario, and item",
        variant: "destructive",
      });
      return;
    }
    
    trainMutation.mutate();
  };

  const handleForecast = () => {
    if (!isModelTrained || !modelId) {
      toast({
        title: "Model Not Trained",
        description: "Please train the model first before generating forecast",
        variant: "destructive",
      });
      return;
    }
    
    // Clear all errors first
    setPlanningAreaError(false);
    setScenarioError(false);
    setItemError(false);
    
    // Validate required fields
    let hasError = false;
    
    if (selectedPlanningAreas.length === 0) {
      setPlanningAreaError(true);
      hasError = true;
    }
    
    if (selectedScenarios.length === 0) {
      setScenarioError(true);
      hasError = true;
    }
    
    if (selectedItems.length === 0) {
      setItemError(true);
      hasError = true;
    }
    
    if (hasError) {
      toast({
        title: "Required Fields Missing",
        description: "Please select at least one planning area, scenario, and item",
        variant: "destructive",
      });
      return;
    }
    
    forecastMutation.mutate();
  };

  // Reset training when configuration changes
  useEffect(() => {
    setIsModelTrained(false);
    setTrainingMetrics(null);
    setModelId(null);
    setHyperparameterTuning(false);
    trainMutation.reset();
    forecastMutation.reset();
  }, [selectedTable, dateColumn, itemColumn, quantityColumn, selectedItems, modelType, selectedPlanningAreas, selectedScenarios]);

  // Clear validation errors when selections change
  useEffect(() => {
    if (selectedPlanningAreas.length > 0) {
      setPlanningAreaError(false);
    }
  }, [selectedPlanningAreas]);

  useEffect(() => {
    if (selectedScenarios.length > 0) {
      setScenarioError(false);
    }
  }, [selectedScenarios]);

  useEffect(() => {
    if (selectedItems.length > 0) {
      setItemError(false);
    }
  }, [selectedItems]);

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

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Source Configuration
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
                  const [schema, name] = value.split('.');
                  setSelectedTable({ schema, name });
                  setDateColumn("");
                  setItemColumn("");
                  setQuantityColumn("");
                  setSelectedItems([]);
                }}
                placeholder={tablesLoading ? "Loading..." : "Select table"}
                searchPlaceholder="Search tables..."
                data-testid="select-table"
              />
            </div>

            {/* Date Column */}
            <div className="space-y-2">
              <Label>Date Column</Label>
              <Combobox
                options={columns?.map((col) => ({
                  value: col.name,
                  label: `${col.name} (${col.type})`
                })) || []}
                value={dateColumn}
                onValueChange={setDateColumn}
                disabled={!selectedTable}
                placeholder="Select date column"
                searchPlaceholder="Search columns..."
                data-testid="select-date-column"
              />
            </div>

            {/* Item Column */}
            <div className="space-y-2">
              <Label>Item Column</Label>
              <Combobox
                options={columns?.map((col) => ({
                  value: col.name,
                  label: `${col.name} (${col.type})`
                })) || []}
                value={itemColumn}
                onValueChange={setItemColumn}
                disabled={!selectedTable}
                placeholder="Select item column"
                searchPlaceholder="Search columns..."
                data-testid="select-item-column"
              />
            </div>

            {/* Quantity Column */}
            <div className="space-y-2">
              <Label>Quantity Column</Label>
              <Combobox
                options={columns?.map((col) => ({
                  value: col.name,
                  label: `${col.name} (${col.type})`
                })) || []}
                value={quantityColumn}
                onValueChange={setQuantityColumn}
                disabled={!selectedTable}
                placeholder="Select quantity column"
                searchPlaceholder="Search columns..."
                data-testid="select-quantity-column"
              />
            </div>

            {/* Model Type Selection */}
            <div className="space-y-2">
              <Label>Model Type</Label>
              <Combobox
                options={[
                  { value: "Linear Regression", label: "Linear Regression" },
                  { value: "Random Forest", label: "Random Forest" },
                  { value: "ARIMA", label: "ARIMA" },
                  { value: "Prophet", label: "Prophet" }
                ]}
                value={modelType}
                onValueChange={setModelType}
                placeholder="Select forecasting model"
                searchPlaceholder="Search models..."
                data-testid="select-model-type"
              />
            </div>
          </div>

          {/* Hyperparameter Tuning Toggle - Only for ARIMA and Prophet */}
          {(modelType === "ARIMA" || modelType === "Prophet") && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="hyperparameter-tuning" className="text-base">
                  Enable Hyperparameter Tuning
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically tune model parameters for better accuracy (may take longer)
                </p>
              </div>
              <Switch
                id="hyperparameter-tuning"
                checked={hyperparameterTuning}
                onCheckedChange={setHyperparameterTuning}
                data-testid="switch-hyperparameter-tuning"
              />
            </div>
          )}

          {/* Planning Areas Multi-Select */}
          {planningAreaColumn && filteredPlanningAreas && filteredPlanningAreas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Planning Areas <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const filtered = filteredPlanningAreas.filter(area => 
                        area.toLowerCase().includes(planningAreaSearch.toLowerCase())
                      );
                      setSelectedPlanningAreas(filtered);
                    }}
                    data-testid="button-select-all-planning-areas"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlanningAreas([]);
                      setSelectedScenarios([]);
                    }}
                    data-testid="button-clear-all-planning-areas"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search planning areas..."
                  value={planningAreaSearch}
                  onChange={(e) => setPlanningAreaSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-planning-areas"
                />
              </div>
              <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-1">
                {filteredPlanningAreas
                  .filter(area => area.toLowerCase().includes(planningAreaSearch.toLowerCase()))
                  .map((area) => (
                    <label key={area} className="flex items-center space-x-2 cursor-pointer py-0.5">
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
                {filteredPlanningAreas.filter(area => area.toLowerCase().includes(planningAreaSearch.toLowerCase())).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No planning areas found</p>
                )}
              </div>
              {selectedPlanningAreas.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedPlanningAreas.length} of {filteredPlanningAreas.length} selected
                </p>
              )}
              {planningAreaError && (
                <p className="text-sm text-red-500" data-testid="error-planning-area">
                  Please select at least one planning area
                </p>
              )}
            </div>
          )}

          {/* Scenarios Multi-Select */}
          {scenarioColumn && filteredScenarios && filteredScenarios.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Scenarios <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const filtered = filteredScenarios.filter(scenario => 
                        scenario.toLowerCase().includes(scenarioSearch.toLowerCase())
                      );
                      setSelectedScenarios(filtered);
                    }}
                    data-testid="button-select-all-scenarios"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedScenarios([]);
                      setSelectedPlanningAreas([]);
                    }}
                    data-testid="button-clear-all-scenarios"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search scenarios..."
                  value={scenarioSearch}
                  onChange={(e) => setScenarioSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-scenarios"
                />
              </div>
              <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-1">
                {filteredScenarios
                  .filter(scenario => scenario.toLowerCase().includes(scenarioSearch.toLowerCase()))
                  .map((scenario) => (
                    <label key={scenario} className="flex items-center space-x-2 cursor-pointer py-0.5">
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
                {filteredScenarios.filter(scenario => scenario.toLowerCase().includes(scenarioSearch.toLowerCase())).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No scenarios found</p>
                )}
              </div>
              {selectedScenarios.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedScenarios.length} of {filteredScenarios.length} selected
                </p>
              )}
              {scenarioError && (
                <p className="text-sm text-red-500" data-testid="error-scenario">
                  Please select at least one scenario
                </p>
              )}
            </div>
          )}

          {/* Items Multi-Select */}
          {itemColumn && items && items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Items <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const filtered = items.filter(item => 
                        item.toLowerCase().includes(itemSearch.toLowerCase())
                      );
                      setSelectedItems(filtered);
                    }}
                    data-testid="button-select-all-items"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItems([])}
                    data-testid="button-clear-all-items"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-items"
                />
              </div>
              <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-1">
                {items
                  .filter(item => item.toLowerCase().includes(itemSearch.toLowerCase()))
                  .map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer py-0.5">
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
                {items.filter(item => item.toLowerCase().includes(itemSearch.toLowerCase())).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">No items found</p>
                )}
              </div>
              {selectedItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {selectedItems.length} of {items.length} selected
                  </p>
                  {selectedItems.length > 1000 && (
                    <div className="flex items-start gap-2 p-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-md">
                      <span className="text-orange-600 dark:text-orange-400">⚠️</span>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Warning: Training {selectedItems.length.toLocaleString()} items may take a very long time. 
                        Consider selecting fewer items for better performance. 
                        Estimated time: ~{Math.ceil(selectedItems.length * 2 / 60)} minutes.
                      </p>
                    </div>
                  )}
                </div>
              )}
              {itemError && (
                <p className="text-sm text-red-500" data-testid="error-item">
                  Please select at least one item
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Forecast Days */}
            <div className="space-y-2">
              <Label>Forecast Days</Label>
              <Input
                type="number"
                value={forecastDays}
                onChange={(e) => setForecastDays(parseInt(e.target.value) || 30)}
                min={1}
                max={365}
                data-testid="input-forecast-days"
              />
            </div>

            {/* Forecast Mode */}
            <div className="space-y-2">
              <Label>Forecast Mode</Label>
              <Select 
                value={forecastMode} 
                onValueChange={(value) => setForecastMode(value as "separate" | "overall")}
              >
                <SelectTrigger data-testid="select-forecast-mode">
                  <SelectValue placeholder="Select forecast mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="separate">
                    Separate forecast for each item
                  </SelectItem>
                  <SelectItem value="overall">
                    One overall forecast
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {forecastMode === "separate" 
                  ? "Each selected item will have its own forecast" 
                  : "All selected items will be aggregated into one forecast"}
              </p>
            </div>
          </div>

          {/* Training Metrics Display */}
          {itemsTrainingMetrics && Object.keys(itemsTrainingMetrics).length > 0 && (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              {/* Header with toggle button and summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {forecastMode === "overall" 
                      ? `Overall Training Results (${modelType})` 
                      : `Training Results per Item (${modelType})`}
                  </div>
                  {forecastMode === "separate" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTableExpanded(!isTableExpanded)}
                      className="gap-2"
                      data-testid="button-toggle-training-results"
                    >
                      {isTableExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show Details
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Summary Statistics - Always visible */}
                {trainingMetrics && (
                  <div className="p-3 bg-background rounded border">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Overall Summary</div>
                    <div className="flex gap-4 flex-wrap">
                      {trainingMetrics.mape !== undefined && (
                        <div>
                          <span className="text-xs text-muted-foreground">Avg MAPE: </span>
                          <span className="font-semibold">{trainingMetrics.mape.toFixed(2)}%</span>
                        </div>
                      )}
                      {trainingMetrics.rmse !== undefined && (
                        <div>
                          <span className="text-xs text-muted-foreground">Avg RMSE: </span>
                          <span className="font-semibold">{trainingMetrics.rmse.toFixed(2)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-muted-foreground">Total Items: </span>
                        <span className="font-semibold">{Object.keys(itemsTrainingMetrics).length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Collapsible Table Section - Only shown in separate mode */}
              {isTableExpanded && forecastMode === "separate" && (
                <div className="space-y-3">
                  {/* Search Box */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search items..."
                      value={itemSearchFilter}
                      onChange={(e) => setItemSearchFilter(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-training-results"
                    />
                  </div>
                  
                  {/* Individual Item Metrics Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Item</th>
                          <th className="text-right p-2">MAPE (%)</th>
                          <th className="text-right p-2">RMSE</th>
                          <th className="text-right p-2">MAE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(itemsTrainingMetrics)
                          .filter(([itemName]) => 
                            itemName.toLowerCase().includes(itemSearchFilter.toLowerCase())
                          )
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([itemName, itemResult]) => {
                            // Check if this item failed to train
                            if (itemResult.success === false) {
                              return (
                                <tr key={itemName} className="border-b hover:bg-muted/50">
                                  <td className="p-2 font-medium">{itemName}</td>
                                  <td colSpan={3} className="text-center p-2 text-muted-foreground">
                                    Failed: {itemResult.error || 'Training error'}
                                  </td>
                                </tr>
                              );
                            }
                            
                            // Handle both direct metrics and nested metrics structure
                            const metrics = itemResult.metrics || itemResult;
                            return (
                              <tr key={itemName} className="border-b hover:bg-muted/50">
                                <td className="p-2 font-medium">{itemName}</td>
                                <td className="text-right p-2">
                                  {metrics.mape !== undefined ? metrics.mape.toFixed(2) : 'N/A'}
                                </td>
                                <td className="text-right p-2">
                                  {metrics.rmse !== undefined ? metrics.rmse.toFixed(2) : 'N/A'}
                                </td>
                                <td className="text-right p-2">
                                  {metrics.mae !== undefined ? metrics.mae.toFixed(2) : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    
                    {/* No results message */}
                    {Object.entries(itemsTrainingMetrics)
                      .filter(([itemName]) => 
                        itemName.toLowerCase().includes(itemSearchFilter.toLowerCase())
                      ).length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        No items found matching "{itemSearchFilter}"
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Display Tuned Parameters when hyperparameter tuning is enabled */}
              {hyperparameterTuning && (modelType === "ARIMA" || modelType === "Prophet") && trainingMetrics && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-sm font-medium mb-2">Tuned Parameters</div>
                  <div className="space-y-2">
                    {modelType === "ARIMA" && (
                      <>
                        {trainingMetrics.order && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Order (p,d,q):</span>{" "}
                            <span className="font-mono">{JSON.stringify(trainingMetrics.order)}</span>
                          </div>
                        )}
                        {trainingMetrics.seasonal_order && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Seasonal Order (P,D,Q,s):</span>{" "}
                            <span className="font-mono">{JSON.stringify(trainingMetrics.seasonal_order)}</span>
                          </div>
                        )}
                      </>
                    )}
                    {modelType === "Prophet" && Object.keys(trainingMetrics).filter(key => 
                      !['mape', 'rmse', 'accuracy'].includes(key)
                    ).length > 0 && (
                      <div className="text-sm space-y-1">
                        {Object.entries(trainingMetrics).filter(([key]) => 
                          !['mape', 'rmse', 'accuracy', 'order', 'seasonal_order'].includes(key)
                        ).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>{" "}
                            <span className="font-mono">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Progress display */}
            {trainMutation.isPending && trainingProgress && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Training Progress</span>
                  <span className="text-muted-foreground">
                    {Math.min(Math.round((Date.now() - trainingProgress.startTime) / (trainingProgress.estimatedRemainingTime + (Date.now() - trainingProgress.startTime)) * 100), 99)}%
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(Math.round((Date.now() - trainingProgress.startTime) / (trainingProgress.estimatedRemainingTime + (Date.now() - trainingProgress.startTime)) * 100), 99)}%` 
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Processing {trainingProgress.totalItems} items</span>
                  <span>
                    Est. remaining: {Math.max(0, Math.ceil((trainingProgress.estimatedRemainingTime - (Date.now() - trainingProgress.startTime)) / 1000))}s
                  </span>
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={handleTrain} 
                disabled={trainMutation.isPending || selectedItems.length === 0}
                variant={isModelTrained ? "outline" : "default"}
                className="w-full md:w-auto"
                data-testid="button-train-model"
              >
                {trainMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Training Model...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isModelTrained ? "Retrain Model" : "Train Model"}
                  </>
                )}
              </Button>
              
              {/* Stop button - only show during training */}
              {trainMutation.isPending && abortController && (
                <Button
                  onClick={() => {
                    abortController.abort();
                    setAbortController(null);
                    setTrainingProgress(null);
                  }}
                  variant="destructive"
                  className="w-full md:w-auto"
                  data-testid="button-stop-training"
                >
                  Stop Training
                </Button>
              )}
              
              <Button 
              onClick={handleForecast} 
              disabled={forecastMutation.isPending || !isModelTrained || !modelId}
              className="w-full md:w-auto"
              data-testid="button-generate-forecast"
            >
              {forecastMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Forecast...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Forecast
                </>
              )}
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section - Overall Demand Forecast */}
      {forecastMutation.data && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-bold">
              {forecastMode === 'overall' ? 'Overall Demand Forecast' : 'Demand Forecast'}
              {forecastMutation.data.overall?.usingDedicatedModel && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (Aggregated Model)
                </span>
              )}
            </h2>
            
            {/* Item Selection based on mode */}
            {forecastMode === 'separate' ? (
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search items to view forecast..."
                    value={forecastSearchQuery}
                    onChange={(e) => setForecastSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                    data-testid="input-search-forecast-items"
                  />
                </div>
                <Select value={selectedForecastItem} onValueChange={setSelectedForecastItem}>
                  <SelectTrigger className="w-48 h-9" data-testid="select-forecast-item">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Overall">Overall (All Items)</SelectItem>
                    {selectedItems
                      .filter(item => item.toLowerCase().includes(forecastSearchQuery.toLowerCase()))
                      .map(item => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Aggregated forecast for all selected items
              </div>
            )}
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Items Included Card */}
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Items Included</div>
                <div className="text-3xl font-bold">
                  {forecastMutation.data.forecastedItemNames?.length || selectedItems.length}/{items?.length || 0}
                </div>
              </CardContent>
            </Card>

            {/* Average Daily Forecast Card */}
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Avg Daily Forecast</div>
                <div className="text-3xl font-bold">
                  {(() => {
                    // Get the current forecast data based on selected tab
                    const currentData = selectedForecastItem === 'Overall' 
                      ? forecastMutation.data.overall 
                      : forecastMutation.data.items?.[selectedForecastItem];
                    
                    if (!currentData?.forecast) return '0.0';
                    
                    const avgDaily = currentData.forecast.reduce((sum: number, d: any) => sum + d.value, 0) / currentData.forecast.length;
                    return avgDaily.toFixed(1);
                  })()}
                </div>
                {(() => {
                  // Get the current data based on selected tab
                  const currentData = selectedForecastItem === 'Overall' 
                    ? forecastMutation.data.overall 
                    : forecastMutation.data.items?.[selectedForecastItem];
                  
                  if (!currentData?.historical || !currentData?.forecast) return null;
                  
                  const historicalAvg = currentData.historical.reduce((sum: number, d: any) => sum + d.value, 0) / currentData.historical.length;
                  const forecastAvg = currentData.forecast.reduce((sum: number, d: any) => sum + d.value, 0) / currentData.forecast.length;
                  const percentChange = historicalAvg !== 0 ? ((forecastAvg - historicalAvg) / historicalAvg) * 100 : 0;
                  
                  return (
                    <div className={`text-sm mt-1 ${percentChange < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {percentChange > 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}%
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Total Forecast Card */}
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-2">Total {forecastDays}-Day Forecast</div>
                <div className="text-3xl font-bold">
                  {(() => {
                    const currentData = selectedForecastItem === 'Overall' 
                      ? forecastMutation.data.overall 
                      : forecastMutation.data.items?.[selectedForecastItem];
                    
                    if (!currentData?.forecast) return '0';
                    
                    return Math.round(currentData.forecast.reduce((sum: number, d: any) => sum + d.value, 0)).toLocaleString();
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Chart */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">
                  {selectedForecastItem === 'Overall' 
                    ? `Overall Demand Forecast - ${modelType} (${selectedItems.length} Items Combined)`
                    : `Demand Forecast - ${modelType} (${selectedForecastItem})`
                  }
                </CardTitle>
                <button 
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    // Download CSV functionality
                    const csv = [
                      ['Date', 'Historical', 'Forecast', 'Lower Bound', 'Upper Bound'],
                      ...forecastMutation.data.historical.map(d => [d.date, d.value, '', '', '']),
                      ...forecastMutation.data.forecast.map(d => [d.date, '', d.value, d.lower, d.upper])
                    ].map(row => row.join(',')).join('\n');
                    
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'forecast.csv';
                    a.click();
                  }}
                >
                  Download CSV
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      // Get data based on selected item (Overall or individual)
                      const currentData = selectedForecastItem === 'Overall' 
                        ? forecastMutation.data.overall 
                        : forecastMutation.data.items?.[selectedForecastItem];
                      
                      // Support legacy single-item forecast
                      const historicalData = currentData?.historical || forecastMutation.data.historical || [];
                      const forecastData = currentData?.forecast || forecastMutation.data.forecast || [];
                      
                      // Combine historical and forecast data with proper labeling
                      // Convert dates to timestamps for proper time scale
                      const historicalWithLabel = historicalData.map((d: any) => ({
                        ...d,
                        timestamp: new Date(d.date).getTime(),
                        historical: d.value,
                        forecast: null,
                        lower: null,
                        upper: null
                      }));
                      const forecastWithLabel = forecastData.map((d: any) => ({
                        ...d,
                        timestamp: new Date(d.date).getTime(),
                        historical: null,
                        forecast: d.value,
                        lower: d.lower,
                        upper: d.upper
                      }));
                      // Combine and sort by timestamp to ensure proper ordering
                      const combined = [...historicalWithLabel, ...forecastWithLabel];
                      return combined.sort((a, b) => a.timestamp - b.timestamp);
                    })()}
                    margin={{ top: 5, right: 30, left: 50, bottom: 50 }}
                  >
                    <defs>
                      <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="timestamp" 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      scale="time"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tickFormatter={(timestamp) => {
                        const date = new Date(timestamp);
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        const year = date.getFullYear().toString().slice(-2);
                        return `${month}/${day}/${year}`;
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      label={{ value: 'Units', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px'
                      }}
                      labelFormatter={(timestamp: number) => {
                        // Format the timestamp to a readable date
                        const date = new Date(timestamp);
                        return date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                      }}
                      formatter={(value: any) => value ? Math.round(value).toLocaleString() : '—'}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    
                    {/* Historical Data Line */}
                    <Line
                      type="linear"
                      dataKey="historical"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Historical Owned Demand"
                      dot={false}
                      connectNulls={false}
                      fillOpacity={1}
                      fill="url(#colorHistorical)"
                    />
                    
                    {/* Forecast Data Line with dots */}
                    <Line
                      type="linear"
                      dataKey="forecast"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Overall Demand Forecast"
                      dot={{ fill: '#EF4444', strokeWidth: 0, r: 3 }}
                      connectNulls={false}
                      fillOpacity={1}
                      fill="url(#colorForecast)"
                    />
                    
                    {/* Confidence Intervals */}
                    {(() => {
                      const currentData = selectedForecastItem === 'Overall' 
                        ? forecastMutation.data.overall 
                        : forecastMutation.data.items?.[selectedForecastItem];
                      
                      return currentData?.forecast?.length > 0 && (
                        <>
                          <Line
                            type="linear"
                            dataKey="lower"
                            stroke="#94A3B8"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            name="Lower Bound"
                            dot={false}
                            connectNulls={false}
                          />
                          <Line
                            type="linear"
                            dataKey="upper"
                            stroke="#94A3B8"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            name="Upper Bound"
                            dot={false}
                            connectNulls={false}
                          />
                        </>
                      );
                    })()}
                    
                    {/* Brush component for zooming */}
                    <Brush 
                      dataKey="date" 
                      height={30} 
                      stroke="#3B82F6"
                      fill="#E5E7EB"
                      fillOpacity={0.3}
                      startIndex={0}
                      endIndex={Math.min(30, (() => {
                        const currentData = selectedForecastItem === 'Overall' 
                          ? forecastMutation.data.overall 
                          : forecastMutation.data.items?.[selectedForecastItem];
                        const historicalData = currentData?.historical || forecastMutation.data.historical || [];
                        const forecastData = currentData?.forecast || forecastMutation.data.forecast || [];
                        return historicalData.length + forecastData.length - 1;
                      })())}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Chart Footer Info */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    {(() => {
                      const currentData = selectedForecastItem === 'Overall' 
                        ? forecastMutation.data.overall 
                        : forecastMutation.data.items?.[selectedForecastItem];
                      
                      const historicalData = currentData?.historical || forecastMutation.data.historical || [];
                      const forecastData = currentData?.forecast || forecastMutation.data.forecast || [];
                      
                      const startDate = historicalData[0]?.date;
                      const endDate = forecastData[forecastData.length - 1]?.date;
                      
                      return startDate && endDate ? `Date Range: ${startDate} to ${endDate}` : 'Date Range: N/A';
                    })()}
                  </div>
                  <div className="flex gap-4">
                    {(() => {
                      const currentData = selectedForecastItem === 'Overall' 
                        ? forecastMutation.data.overall 
                        : forecastMutation.data.items?.[selectedForecastItem];
                      
                      const metrics = currentData?.metrics || forecastMutation.data.metrics;
                      
                      return (
                        <>
                          {metrics?.mape !== undefined && (
                            <span>MAPE: {metrics.mape.toFixed(2)}%</span>
                          )}
                          {metrics?.rmse !== undefined && (
                            <span>RMSE: {metrics.rmse.toFixed(2)}</span>
                          )}
                          {metrics?.mae !== undefined && (
                            <span>MAE: {metrics.mae.toFixed(2)}</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
