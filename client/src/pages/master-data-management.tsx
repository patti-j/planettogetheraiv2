import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EditableDataGrid } from '@/components/editable-data-grid';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/contexts/NavigationContext';
import { 
  Database, 
  Table, 
  Sparkles, 
  Upload, 
  Download, 
  RefreshCw, 
  Settings,
  Loader2,
  AlertCircle,
  Check,
  X,
  Bot,
  FileSpreadsheet,
  Layers,
  Factory,
  Package,
  Users,
  Truck,
  ClipboardList,
  Wrench,
  GitBranch,
  Beaker
} from 'lucide-react';

// Master data table definitions with metadata
const masterDataTables = [
  {
    id: 'plants',
    name: 'Plants',
    description: 'Manufacturing facilities and locations',
    icon: Factory,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'location', header: 'Location', type: 'text' as const },
      { key: 'address', header: 'Address', type: 'text' as const },
      { key: 'timezone', header: 'Timezone', type: 'text' as const, required: true },
      { key: 'isActive', header: 'Active', type: 'boolean' as const },
    ]
  },
  {
    id: 'resources',
    name: 'Resources',
    description: 'Equipment, machines, and production resources',
    icon: Wrench,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'type', header: 'Type', type: 'text' as const, required: true },
      { key: 'status', header: 'Status', type: 'select' as const, 
        options: [
          { value: 'active', label: 'Active' },
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'inactive', label: 'Inactive' }
        ]
      },
      { key: 'capabilities', header: 'Capabilities', type: 'json' as const },
      { key: 'isDrum', header: 'Is Drum', type: 'boolean' as const },
    ]
  },
  {
    id: 'workCenters',
    name: 'Work Centers',
    description: 'Production work centers and stations',
    icon: Layers,
    category: 'Core',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'name', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'type', header: 'Type', type: 'text' as const },
      { key: 'plantId', header: 'Plant ID', type: 'number' as const },
      { key: 'capacity', header: 'Capacity', type: 'number' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
      { key: 'costPerHour', header: 'Cost/Hour', type: 'number' as const },
    ]
  },
  {
    id: 'items',
    name: 'Items',
    description: 'Products, materials, and inventory items',
    icon: Package,
    category: 'Inventory',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'itemNumber', header: 'Item Number', type: 'text' as const, required: true },
      { key: 'itemName', header: 'Name', type: 'text' as const, required: true },
      { key: 'description', header: 'Description', type: 'text' as const },
      { key: 'itemType', header: 'Type', type: 'select' as const,
        options: [
          { value: 'finished_good', label: 'Finished Good' },
          { value: 'raw_material', label: 'Raw Material' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'consumable', label: 'Consumable' }
        ]
      },
      { key: 'unitOfMeasure', header: 'UOM', type: 'text' as const },
      { key: 'standardCost', header: 'Std Cost', type: 'number' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
    ]
  },
  {
    id: 'customers',
    name: 'Customers',
    description: 'Customer accounts and information',
    icon: Users,
    category: 'Business',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'customerNumber', header: 'Customer #', type: 'text' as const, required: true },
      { key: 'customerName', header: 'Name', type: 'text' as const, required: true },
      { key: 'customerType', header: 'Type', type: 'select' as const,
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'preferred', label: 'Preferred' },
          { value: 'key_account', label: 'Key Account' },
          { value: 'distributor', label: 'Distributor' }
        ]
      },
      { key: 'contactEmail', header: 'Email', type: 'text' as const },
      { key: 'contactPhone', header: 'Phone', type: 'text' as const },
      { key: 'creditLimit', header: 'Credit Limit', type: 'number' as const },
      { key: 'accountStatus', header: 'Status', type: 'text' as const },
    ]
  },
  {
    id: 'vendors',
    name: 'Vendors',
    description: 'Suppliers and vendor information',
    icon: Truck,
    category: 'Business',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'vendorNumber', header: 'Vendor #', type: 'text' as const, required: true },
      { key: 'vendorName', header: 'Name', type: 'text' as const, required: true },
      { key: 'vendorType', header: 'Type', type: 'text' as const },
      { key: 'contactEmail', header: 'Email', type: 'text' as const },
      { key: 'contactPhone', header: 'Phone', type: 'text' as const },
      { key: 'paymentTerms', header: 'Payment Terms', type: 'text' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
    ]
  },
  {
    id: 'billsOfMaterial',
    name: 'Bills of Material',
    description: 'Product structure and component lists',
    icon: ClipboardList,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'bomNumber', header: 'BOM Number', type: 'text' as const, required: true },
      { key: 'productItemNumber', header: 'Product', type: 'text' as const, required: true },
      { key: 'version', header: 'Version', type: 'text' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
      { key: 'effectiveDate', header: 'Effective Date', type: 'date' as const },
      { key: 'endDate', header: 'End Date', type: 'date' as const },
    ]
  },
  {
    id: 'routings',
    name: 'Routings',
    description: 'Manufacturing process sequences',
    icon: GitBranch,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'routingNumber', header: 'Routing #', type: 'text' as const, required: true },
      { key: 'productItemNumber', header: 'Product', type: 'text' as const, required: true },
      { key: 'version', header: 'Version', type: 'text' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
      { key: 'totalCycleTime', header: 'Cycle Time', type: 'number' as const },
    ]
  },
  {
    id: 'recipes',
    name: 'Recipes',
    description: 'Process manufacturing formulas',
    icon: Beaker,
    category: 'Production',
    columns: [
      { key: 'id', header: 'ID', type: 'number' as const, editable: false },
      { key: 'recipeNumber', header: 'Recipe #', type: 'text' as const, required: true },
      { key: 'recipeName', header: 'Name', type: 'text' as const, required: true },
      { key: 'productItemNumber', header: 'Product', type: 'text' as const, required: true },
      { key: 'recipeVersion', header: 'Version', type: 'text' as const },
      { key: 'recipeType', header: 'Type', type: 'text' as const },
      { key: 'status', header: 'Status', type: 'text' as const },
      { key: 'batchSize', header: 'Batch Size', type: 'number' as const },
    ]
  }
];

export default function MasterDataManagement() {
  const [selectedTable, setSelectedTable] = useState('resources');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { addRecentPage } = useNavigation();

  // Register this page in recent pages when component mounts
  useEffect(() => {
    addRecentPage('/master-data', 'Master Data Management', 'Database');
  }, []);

  // Get the current table configuration
  const currentTableConfig = masterDataTables.find(t => t.id === selectedTable);

  // Fetch data for the selected table
  const { data: tableData = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/master-data/${selectedTable}`],
    enabled: !!selectedTable,
  });

  // Mutation for saving data changes
  const saveMutation = useMutation({
    mutationFn: async (updatedData: any[]) => {
      return await apiRequest('PUT', `/api/master-data/${selectedTable}`, { data: updatedData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/master-data/${selectedTable}`] });
      toast({
        title: "Success",
        description: "Data saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save data",
        variant: "destructive"
      });
    }
  });

  // Mutation for individual row updates
  const updateRowMutation = useMutation({
    mutationFn: async ({ index, row }: { index: number; row: any }) => {
      return await apiRequest('PATCH', `/api/master-data/${selectedTable}/${row.id}`, row);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/master-data/${selectedTable}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update row",
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting rows
  const deleteRowMutation = useMutation({
    mutationFn: async (rowId: number) => {
      return await apiRequest('DELETE', `/api/master-data/${selectedTable}/${rowId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/master-data/${selectedTable}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive"
      });
    }
  });

  // Mutation for adding new rows
  const addRowMutation = useMutation({
    mutationFn: async (newRow: any) => {
      return await apiRequest('POST', `/api/master-data/${selectedTable}`, newRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/master-data/${selectedTable}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add row",
        variant: "destructive"
      });
    }
  });

  // AI-powered data modification
  const processAIPrompt = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', '/api/master-data/ai-modify', {
        table: selectedTable,
        prompt: aiPrompt,
        currentData: tableData
      });

      const result = await response.json();
      if (result.success) {
        await refetch();
        toast({
          title: "AI Processing Complete",
          description: result.message || "Data has been modified successfully"
        });
        setShowAIDialog(false);
        setAiPrompt('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process AI request",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Export data as CSV
  const exportData = () => {
    if (!tableData || tableData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    const headers = currentTableConfig?.columns.map(c => c.header).join(',');
    const rows = tableData.map(row => 
      currentTableConfig?.columns.map(c => {
        const value = row[c.key];
        if (typeof value === 'object') return JSON.stringify(value);
        return value ?? '';
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group tables by category
  const tablesByCategory = masterDataTables.reduce((acc, table) => {
    if (!acc[table.category]) {
      acc[table.category] = [];
    }
    acc[table.category].push(table);
    return acc;
  }, {} as Record<string, typeof masterDataTables>);

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 sm:h-8 sm:w-8" />
          <span className="hidden sm:inline">Master Data Management</span>
          <span className="sm:hidden">Master Data</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          <span className="hidden sm:inline">Manage all master data tables with AI-powered editing and spreadsheet-like interface</span>
          <span className="sm:hidden">Manage and edit master data</span>
        </p>
      </div>

      {/* Mobile Table Selector - Dropdown on small screens */}
      <div className="block lg:hidden mb-4">
        <Select value={selectedTable} onValueChange={setSelectedTable}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a table" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(tablesByCategory).map(([category, tables]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">{category}</div>
                {tables.map(table => {
                  const Icon = table.icon;
                  return (
                    <SelectItem key={table.id} value={table.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{table.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Desktop Table Selector Sidebar - Hidden on mobile */}
        <div className="hidden lg:block lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Tables</CardTitle>
              <CardDescription>Select a table to view and edit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(tablesByCategory).map(([category, tables]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">{category}</h3>
                    <div className="space-y-1">
                      {tables.map(table => {
                        const Icon = table.icon;
                        return (
                          <button
                            key={table.id}
                            onClick={() => setSelectedTable(table.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              selectedTable === table.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{table.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    {currentTableConfig && (
                      <>
                        {React.createElement(currentTableConfig.icon, { className: "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" })}
                        <span className="truncate">{currentTableConfig.name}</span>
                      </>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {currentTableConfig?.description}
                  </CardDescription>
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading}
                    className="px-2 sm:px-3"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline ml-1">Refresh</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportData}
                    className="px-2 sm:px-3"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Export</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAIDialog(true)}
                    className="px-2 sm:px-3"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">AI Edit</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : currentTableConfig ? (
                <div className="overflow-x-auto">
                  <EditableDataGrid
                    columns={currentTableConfig.columns}
                    data={tableData}
                    onSave={(data) => saveMutation.mutate(data)}
                    onRowUpdate={(index, row) => updateRowMutation.mutate({ index, row })}
                    onRowDelete={(index) => {
                      const row = tableData[index];
                      if (row?.id) deleteRowMutation.mutate(row.id);
                    }}
                    onRowAdd={(row) => addRowMutation.mutate(row)}
                    allowAdd={true}
                    allowDelete={true}
                    allowBulkEdit={true}
                    gridHeight="calc(100vh - 300px)"
                  />
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <Table className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base">Select a table to view and edit data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Edit Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[600px] max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">AI-Powered Data Modification</span>
              <span className="sm:hidden">AI Data Edit</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Describe how you want to modify the {currentTableConfig?.name} data. The AI will process your request and update the data accordingly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium">Your Prompt</label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Example: Update all inactive resources to active status, or add 10% to all standard costs..."
                className="mt-1 min-h-[100px] sm:min-h-[120px] text-sm"
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                  <p className="font-medium mb-1">AI Capabilities:</p>
                  <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                    <li>Bulk update fields based on conditions</li>
                    <li>Generate sample data for testing</li>
                    <li>Clean and standardize data formats</li>
                    <li>Apply business rules and validations</li>
                    <li>Create relationships between data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowAIDialog(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={processAIPrompt}
              disabled={isProcessing || !aiPrompt.trim()}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}