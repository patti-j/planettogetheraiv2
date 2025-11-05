import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Database, FileSpreadsheet, Loader2 } from "lucide-react";

interface SqlTable {
  tableName: string;
  schemaName: string;
}

interface PowerBIWorkspace {
  id: string;
  name: string;
  isReadOnly: boolean;
  isOnDedicatedCapacity: boolean;
}

interface PowerBIDataset {
  id: string;
  name: string;
  isRefreshable?: boolean;
  storageMode?: string;
}

interface PowerBITable {
  name: string;
  columns?: any[];
  isHidden?: boolean;
}

interface DataSourceSelectorProps {
  sourceType: 'sql' | 'powerbi';
  onSourceTypeChange: (type: 'sql' | 'powerbi') => void;
  selectedTable: { tableName: string; schemaName: string } | null;
  onTableChange: (table: { tableName: string; schemaName: string } | null) => void;
  selectedWorkspace: string;
  onWorkspaceChange: (workspace: string) => void;
  selectedDataset: string;
  onDatasetChange: (dataset: string) => void;
  selectedPowerBITable: string;
  onPowerBITableChange: (table: string) => void;
}

export const DataSourceSelector = memo(({
  sourceType,
  onSourceTypeChange,
  selectedTable,
  onTableChange,
  selectedWorkspace,
  onWorkspaceChange,
  selectedDataset,
  onDatasetChange,
  selectedPowerBITable,
  onPowerBITableChange
}: DataSourceSelectorProps) => {
  
  // Fetch available tables for SQL Server
  const { data: sqlTables = [], isLoading: sqlTablesLoading } = useQuery<SqlTable[]>({
    queryKey: ['/api/sql-tables'],
    enabled: sourceType === 'sql',
  });

  // Fetch Power BI workspaces
  const { data: workspaces = [], isLoading: workspacesLoading, error: workspacesError } = useQuery<PowerBIWorkspace[]>({
    queryKey: ['/api/powerbi/workspaces'],
    enabled: sourceType === 'powerbi',
    retry: false
  });

  // Fetch datasets from selected workspace
  const { data: datasets = [], isLoading: datasetsLoading, error: datasetsError } = useQuery<PowerBIDataset[]>({
    queryKey: ['/api/powerbi/workspaces', selectedWorkspace, 'datasets'],
    queryFn: async () => {
      if (!selectedWorkspace) return [];
      const response = await fetch(`/api/powerbi/workspaces/${selectedWorkspace}/datasets`);
      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: sourceType === 'powerbi' && !!selectedWorkspace,
    retry: false
  });

  // Fetch tables from selected dataset
  const { data: powerBITables = [], isLoading: tablesLoading, error: tablesError } = useQuery<PowerBITable[]>({
    queryKey: ['/api/powerbi/workspaces', selectedWorkspace, 'datasets', selectedDataset, 'tables'],
    queryFn: async () => {
      if (!selectedWorkspace || !selectedDataset) return [];
      const response = await fetch(`/api/powerbi/workspaces/${selectedWorkspace}/datasets/${selectedDataset}/tables`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: sourceType === 'powerbi' && !!selectedWorkspace && !!selectedDataset,
    retry: false
  });

  // Reset downstream selections when upstream changes
  useEffect(() => {
    if (sourceType === 'powerbi') {
      // Reset dataset and table when workspace changes
      if (!selectedWorkspace) {
        onDatasetChange('');
        onPowerBITableChange('');
      }
    }
  }, [selectedWorkspace, sourceType, onDatasetChange, onPowerBITableChange]);

  useEffect(() => {
    if (sourceType === 'powerbi') {
      // Reset table when dataset changes
      if (!selectedDataset) {
        onPowerBITableChange('');
      }
    }
  }, [selectedDataset, sourceType, onPowerBITableChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Source</CardTitle>
        <CardDescription>
          Select the data source for your report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Source Type</Label>
          <div className="grid grid-cols-2 gap-4">
            {/* SQL Server Tile */}
            <div
              onClick={() => onSourceTypeChange('sql')}
              className={`
                relative cursor-pointer rounded-lg border-2 p-6 transition-all
                hover:shadow-md
                ${sourceType === 'sql' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/40'
                }
              `}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSourceTypeChange('sql')}
              data-testid="tile-sql"
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <Database 
                  className={`h-10 w-10 ${
                    sourceType === 'sql' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span className={`
                  text-sm font-medium
                  ${sourceType === 'sql' ? 'text-primary' : 'text-foreground'}
                `}>
                  SQL Server
                </span>
              </div>
            </div>

            {/* Power BI Tile */}
            <div
              onClick={() => onSourceTypeChange('powerbi')}
              className={`
                relative cursor-pointer rounded-lg border-2 p-6 transition-all
                hover:shadow-md
                ${sourceType === 'powerbi' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/40'
                }
              `}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSourceTypeChange('powerbi')}
              data-testid="tile-powerbi"
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <FileSpreadsheet 
                  className={`h-10 w-10 ${
                    sourceType === 'powerbi' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span className={`
                  text-sm font-medium
                  ${sourceType === 'powerbi' ? 'text-primary' : 'text-foreground'}
                `}>
                  Power BI
                </span>
              </div>
            </div>
          </div>
        </div>

        {sourceType === 'sql' && (
          <div className="space-y-2">
            <Label>Select Table</Label>
            <Select
              value={selectedTable ? `${selectedTable.schemaName}.${selectedTable.tableName}` : undefined}
              onValueChange={(value) => {
                const [schema, ...tableParts] = value.split('.');
                const tableName = tableParts.join('.');
                onTableChange({ schemaName: schema, tableName });
              }}
              data-testid="select-sql-table"
            >
              <SelectTrigger>
                {sqlTablesLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading tables...
                  </div>
                ) : (
                  <SelectValue placeholder="Select a table" />
                )}
              </SelectTrigger>
              <SelectContent>
                {sqlTables.map((table) => (
                  <SelectItem 
                    key={`${table.schemaName}.${table.tableName}`} 
                    value={`${table.schemaName}.${table.tableName}`}
                    data-testid={`select-item-${table.tableName}`}
                  >
                    {table.schemaName}.{table.tableName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {sourceType === 'powerbi' && (
          <div className="space-y-4">
            {/* Step 1: Workspace Selection */}
            <div className="space-y-2">
              <Label>Step 1: Select Workspace</Label>
              <Select
                value={selectedWorkspace}
                onValueChange={onWorkspaceChange}
                disabled={workspacesLoading}
                data-testid="select-workspace"
              >
                <SelectTrigger>
                  {workspacesLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading workspaces...
                    </div>
                  ) : workspacesError ? (
                    <SelectValue placeholder="Failed to load workspaces" />
                  ) : workspaces.length === 0 ? (
                    <SelectValue placeholder="No workspaces found" />
                  ) : (
                    <SelectValue placeholder="Select a workspace" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem 
                      key={workspace.id} 
                      value={workspace.id}
                      data-testid={`select-workspace-${workspace.id}`}
                    >
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workspacesError && (
                <p className="text-xs text-destructive">
                  Error loading workspaces. Please ensure Power BI authentication is configured.
                </p>
              )}
            </div>

            {/* Step 2: Dataset Selection */}
            <div className="space-y-2">
              <Label>Step 2: Select Dataset</Label>
              <Select
                value={selectedDataset}
                onValueChange={onDatasetChange}
                disabled={!selectedWorkspace || datasetsLoading}
                data-testid="select-dataset"
              >
                <SelectTrigger>
                  {!selectedWorkspace ? (
                    <SelectValue placeholder="Select workspace first" />
                  ) : datasetsLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading datasets...
                    </div>
                  ) : datasetsError ? (
                    <SelectValue placeholder="Failed to load datasets" />
                  ) : datasets.length === 0 ? (
                    <SelectValue placeholder="No datasets found in workspace" />
                  ) : (
                    <SelectValue placeholder="Select a dataset" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem 
                      key={dataset.id} 
                      value={dataset.id}
                      data-testid={`select-dataset-${dataset.id}`}
                    >
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {datasetsError && selectedWorkspace && (
                <p className="text-xs text-destructive">
                  Error loading datasets. Please check your permissions for this workspace.
                </p>
              )}
            </div>

            {/* Step 3: Table Selection */}
            <div className="space-y-2">
              <Label>Step 3: Select Table</Label>
              <Select
                value={selectedPowerBITable}
                onValueChange={onPowerBITableChange}
                disabled={!selectedDataset || tablesLoading}
                data-testid="select-powerbi-table"
              >
                <SelectTrigger>
                  {!selectedDataset ? (
                    <SelectValue placeholder="Select dataset first" />
                  ) : tablesLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading tables...
                    </div>
                  ) : tablesError ? (
                    <SelectValue placeholder="Failed to load tables" />
                  ) : powerBITables.length === 0 ? (
                    <SelectValue placeholder="No tables found in dataset" />
                  ) : (
                    <SelectValue placeholder="Select a table" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {powerBITables
                    .filter(table => !table.isHidden) // Filter out hidden tables
                    .map((table) => (
                      <SelectItem 
                        key={table.name} 
                        value={table.name}
                        data-testid={`select-powerbi-table-${table.name}`}
                      >
                        {table.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {tablesError && selectedDataset && (
                <p className="text-xs text-destructive">
                  Error loading tables. The dataset may not support table discovery.
                </p>
              )}
            </div>

            {/* Configuration Status */}
            {selectedWorkspace && selectedDataset && selectedPowerBITable && (
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-sm font-medium text-primary">Power BI Configuration Complete</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Workspace: {workspaces.find(w => w.id === selectedWorkspace)?.name || selectedWorkspace}
                </p>
                <p className="text-xs text-muted-foreground">
                  Dataset: {datasets.find(d => d.id === selectedDataset)?.name || selectedDataset}
                </p>
                <p className="text-xs text-muted-foreground">
                  Table: {selectedPowerBITable}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DataSourceSelector.displayName = 'DataSourceSelector';