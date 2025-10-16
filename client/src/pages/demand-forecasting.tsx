import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Sparkles, Database, TrendingUp, Search } from "lucide-react";
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
  historical: Array<{ date: string; value: number }>;
  forecast: Array<{ date: string; value: number; lower: number; upper: number }>;
  metrics: {
    mape?: number;
    rmse?: number;
  };
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
  const planningAreaColumn = "PlanningAreaName";
  const [selectedPlanningAreas, setSelectedPlanningAreas] = useState<string[]>([]);
  const [planningAreaSearch, setPlanningAreaSearch] = useState<string>("");
  const scenarioColumn = "ScenarioName";
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [scenarioSearch, setScenarioSearch] = useState<string>("");
  
  // Training state
  const [isModelTrained, setIsModelTrained] = useState<boolean>(false);
  const [trainingMetrics, setTrainingMetrics] = useState<{ accuracy?: number; mape?: number; rmse?: number } | null>(null);

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

  // Fetch items for selected item column
  const { data: items } = useQuery<string[]>({
    queryKey: ["/api/forecasting/items", selectedTable?.schema, selectedTable?.name, itemColumn],
    enabled: !!selectedTable && !!itemColumn,
    queryFn: async () => {
      if (!selectedTable || !itemColumn) return [];
      const response = await fetch(`/api/forecasting/items/${selectedTable.schema}/${selectedTable.name}/${itemColumn}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
  });

  // Train model mutation
  const trainMutation = useMutation<{ metrics: { accuracy?: number; mape?: number; rmse?: number } }, Error, void>({
    mutationFn: async () => {
      const response = await fetch("/api/forecasting/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: selectedTable?.schema,
          table: selectedTable?.name,
          dateColumn,
          itemColumn,
          quantityColumn,
          selectedItem: selectedItems[0],
          modelType,
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
    },
    onSuccess: (data) => {
      setIsModelTrained(true);
      setTrainingMetrics(data.metrics);
      toast({
        title: "Model Trained Successfully",
        description: `${modelType} model trained with MAPE: ${data.metrics.mape?.toFixed(2)}%`,
      });
    },
    onError: (error) => {
      setIsModelTrained(false);
      setTrainingMetrics(null);
      toast({
        title: "Training Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Forecast mutation
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
          selectedItem: selectedItems[0], // Use first selected item for now
          forecastDays,
          modelType,
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
    onSuccess: () => {
      toast({
        title: "Forecast Complete",
        description: `Generated ${forecastDays}-day forecast successfully`,
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
    if (!selectedTable || !dateColumn || !itemColumn || !quantityColumn || selectedItems.length === 0) {
      toast({
        title: "Missing Configuration",
        description: "Please select all required fields",
        variant: "destructive",
      });
      return;
    }
    trainMutation.mutate();
  };

  const handleForecast = () => {
    if (!isModelTrained) {
      toast({
        title: "Model Not Trained",
        description: "Please train the model first before generating forecast",
        variant: "destructive",
      });
      return;
    }
    forecastMutation.mutate();
  };

  // Reset training state when configuration changes
  const resetTraining = () => {
    setIsModelTrained(false);
    setTrainingMetrics(null);
  };

  // Reset training when configuration changes
  useEffect(() => {
    resetTraining();
  }, [selectedTable, dateColumn, itemColumn, quantityColumn, selectedItems, modelType, selectedPlanningAreas, selectedScenarios]);

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

          {/* Planning Areas Multi-Select */}
          {planningAreaColumn && filteredPlanningAreas && filteredPlanningAreas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Planning Areas</Label>
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
            </div>
          )}

          {/* Scenarios Multi-Select */}
          {scenarioColumn && filteredScenarios && filteredScenarios.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Scenarios</Label>
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
            </div>
          )}

          {/* Items Multi-Select */}
          {itemColumn && items && items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Items</Label>
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
                <p className="text-xs text-muted-foreground">
                  {selectedItems.length} of {items.length} selected
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
          </div>

          <Button 
            onClick={handleForecast} 
            disabled={forecastMutation.isPending || selectedItems.length === 0}
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
        </CardContent>
      </Card>

      {/* Results Section */}
      {forecastMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Forecast Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Metrics */}
              {forecastMutation.data.metrics && (
                <div className="flex gap-4">
                  {forecastMutation.data.metrics.mape !== undefined && (
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">MAPE</div>
                      <div className="text-2xl font-bold">{forecastMutation.data.metrics.mape.toFixed(2)}%</div>
                    </div>
                  )}
                  {forecastMutation.data.metrics.rmse !== undefined && (
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">RMSE</div>
                      <div className="text-2xl font-bold">{forecastMutation.data.metrics.rmse.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Chart */}
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[...forecastMutation.data.historical, ...forecastMutation.data.forecast]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Actual/Forecast"
                      dot={false}
                    />
                    {forecastMutation.data.forecast.length > 0 && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="lower"
                          stroke="#82ca9d"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          name="Lower Bound"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="upper"
                          stroke="#ffc658"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          name="Upper Bound"
                          dot={false}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
