import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  // Fetch available tables for SQL Server
  const { data: tables = [], isLoading: tablesLoading } = useQuery<SqlTable[]>({
    queryKey: ['/api/sql-tables'],
    enabled: sourceType === 'sql',
  });

  // Fetch available datasets for Power BI
  const { data: datasets = [], isLoading: datasetsLoading } = useQuery<PowerBiDataset[]>({
    queryKey: ['/api/powerbi/datasets'],
    enabled: sourceType === 'powerbi',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Source</CardTitle>
        <CardDescription>
          Select the data source for your report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label>Source Type</Label>
          <RadioGroup
            value={sourceType}
            onValueChange={(value) => onSourceTypeChange(value as 'sql' | 'powerbi')}
            data-testid="radio-source-type"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sql" id="sql-source" data-testid="radio-sql" />
              <label htmlFor="sql-source" className="flex items-center cursor-pointer">
                <Database className="mr-2 h-4 w-4" />
                SQL Server
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="powerbi" id="powerbi-source" data-testid="radio-powerbi" />
              <label htmlFor="powerbi-source" className="flex items-center cursor-pointer">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Power BI
              </label>
            </div>
          </RadioGroup>
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
                    Loading...
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
          <div className="space-y-2">
            <Label>Select Dataset</Label>
            <Select
              value={selectedDataset}
              onValueChange={onDatasetChange}
              data-testid="select-dataset"
            >
              <SelectTrigger>
                {datasetsLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </div>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
});

DataSourceSelector.displayName = 'DataSourceSelector';