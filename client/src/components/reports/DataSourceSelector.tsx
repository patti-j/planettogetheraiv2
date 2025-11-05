import { memo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Database, FileSpreadsheet, Loader2 } from "lucide-react";

interface SqlTable {
  tableName: string;
  schemaName: string;
}

interface PowerBiDataset {
  id: string;
  name: string;
}

interface DataSourceSelectorProps {
  sourceType: 'sql' | 'powerbi';
  onSourceTypeChange: (type: 'sql' | 'powerbi') => void;
  selectedTable: { tableName: string; schemaName: string } | null;
  onTableChange: (table: { tableName: string; schemaName: string } | null) => void;
  selectedDataset: string;
  onDatasetChange: (dataset: string) => void;
}

export const DataSourceSelector = memo(({
  sourceType,
  onSourceTypeChange,
  selectedTable,
  onTableChange,
  selectedDataset,
  onDatasetChange
}: DataSourceSelectorProps) => {
  const [workspaceName, setWorkspaceName] = useState('');
  
  // Fetch available tables for SQL Server
  const { data: tables = [], isLoading: tablesLoading } = useQuery<SqlTable[]>({
    queryKey: ['/api/sql-tables'],
    enabled: sourceType === 'sql',
  });

  // Fetch available datasets for Power BI with workspace parameter
  const { data: datasets = [], isLoading: datasetsLoading, error: datasetsError } = useQuery<PowerBiDataset[]>({
    queryKey: ['/api/powerbi/datasets', workspaceName],
    queryFn: async () => {
      const response = await fetch(`/api/powerbi/datasets?workspace=${encodeURIComponent(workspaceName)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: sourceType === 'powerbi' && workspaceName.trim().length > 0,
    retry: false
  });

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
              data-testid="select-table"
            >
              <SelectTrigger>
                {tablesLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading tables...
                  </div>
                ) : (
                  <SelectValue placeholder="Select a table" />
                )}
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
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
            {/* Workspace Name Input */}
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                type="text"
                placeholder="Enter Power BI workspace name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                data-testid="input-workspace-name"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Power BI workspace name to load available datasets
              </p>
            </div>

            {/* Dataset Selection */}
            <div className="space-y-2">
              <Label>Select Dataset</Label>
              <Select
                value={selectedDataset}
                onValueChange={onDatasetChange}
                disabled={!workspaceName.trim() || datasetsLoading}
                data-testid="select-dataset"
              >
                <SelectTrigger>
                  {!workspaceName.trim() ? (
                    <SelectValue placeholder="Enter workspace name first" />
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
                      data-testid={`select-item-${dataset.id}`}
                    >
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {datasetsError && (
                <p className="text-xs text-destructive">
                  Error loading datasets. Please check the workspace name and try again.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DataSourceSelector.displayName = 'DataSourceSelector';