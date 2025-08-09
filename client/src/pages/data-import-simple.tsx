import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Database, Building, Wrench, Package, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useNavigation } from '@/contexts/NavigationContext';

interface ImportStatus {
  type: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  count?: number;
}

function DataImportSimple() {
  const { toast } = useToast();
  const { addRecentPage } = useNavigation();
  const queryClient = useQueryClient();
  
  const [selectedImportDataType, setSelectedImportDataType] = useState('resources');
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Register this page in recent pages when component mounts
  useEffect(() => {
    addRecentPage('/data-import', 'Master Data Import', 'Database');
  }, []);

  // Available data types for import
  const dataTypes = [
    { id: 'resources', name: 'Resources', icon: Wrench, description: 'Machines, production lines, equipment' },
    { id: 'plants', name: 'Plants', icon: Building, description: 'Manufacturing facilities and locations' },
    { id: 'items', name: 'Items', icon: Package, description: 'Products, materials, components' },
    { id: 'users', name: 'Users', icon: Users, description: 'System users and operators' },
  ];

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async ({ dataType, data }: { dataType: string; data: any[] }) => {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/data-import/${dataType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ data })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      setImportStatuses(prev => [...prev, {
        type: variables.dataType,
        status: 'success',
        message: `Successfully imported ${data.imported || 0} records`,
        count: data.imported || 0
      }]);
      
      toast({
        title: "Import Successful",
        description: `${data.imported || 0} ${variables.dataType} records imported`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.dataType}`] });
    },
    onError: (error: any, variables) => {
      setImportStatuses(prev => [...prev, {
        type: variables.dataType,
        status: 'error',
        message: error.message || 'Import failed'
      }]);
      
      toast({
        title: "Import Failed",
        description: error.message || 'Something went wrong',
        variant: "destructive",
      });
    }
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.endsWith('.csv');
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      toast({
        title: "Invalid file format",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsImporting(true);
      let data: any[] = [];
      
      if (isCSV) {
        // Handle CSV files
        const text = await file.text();
        const lines = text.split('\n');
        if (lines.length < 2) {
          throw new Error('CSV file must have header row and at least one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            return obj;
          });
      } else {
        // Handle Excel files
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      }

      if (data.length === 0) {
        throw new Error('No data found in file');
      }

      // Validate data size
      if (data.length > 100) {
        throw new Error(`Maximum 100 records per batch. Current: ${data.length}. Please split your data into smaller batches.`);
      }

      // Process the data for import
      await importMutation.mutateAsync({
        dataType: selectedImportDataType,
        data: data
      });
      
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "File upload failed",
        description: error instanceof Error ? error.message : "Error processing the file",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Download template
  const downloadTemplate = (dataType: string) => {
    const templates: Record<string, any[]> = {
      resources: [
        { name: 'CNC Machine 1', type: 'machining_center', status: 'active', description: 'Primary CNC machine' },
        { name: 'Assembly Line A', type: 'assembly_line', status: 'active', description: 'Main assembly line' }
      ],
      plants: [
        { name: 'Main Plant', location: 'New York', timezone: 'America/New_York', description: 'Primary manufacturing facility' },
        { name: 'West Coast Plant', location: 'California', timezone: 'America/Los_Angeles', description: 'Secondary facility' }
      ],
      items: [
        { name: 'Product A', description: 'Main product line A', category: 'finished_good' },
        { name: 'Component B', description: 'Essential component B', category: 'component' }
      ],
      users: [
        { username: 'operator1', email: 'operator1@company.com', firstName: 'John', lastName: 'Doe', jobTitle: 'Machine Operator' },
        { username: 'supervisor1', email: 'supervisor1@company.com', firstName: 'Jane', lastName: 'Smith', jobTitle: 'Production Supervisor' }
      ]
    };

    const templateData = templates[dataType] || [];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, dataType);
    XLSX.writeFile(workbook, `${dataType}_template.xlsx`);
    
    toast({
      title: "Template Downloaded",
      description: `${dataType} template has been downloaded`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Master Data Import</h1>
        <p className="text-gray-600">Import your master data using CSV or Excel files</p>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="templates">Download Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
              <CardDescription>
                Upload CSV or Excel files to import your master data. Maximum 100 records per file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataType">Data Type</Label>
                <Select value={selectedImportDataType} onValueChange={setSelectedImportDataType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                />
                <p className="text-sm text-gray-500">
                  Supported formats: CSV, Excel (.xlsx, .xls)
                </p>
              </div>

              {isImporting && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing import...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import Status */}
          {importStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Import Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {importStatuses.map((status, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded border">
                      {status.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{status.type}:</span>
                      <span className={status.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                        {status.message}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Templates
              </CardTitle>
              <CardDescription>
                Download Excel templates with sample data for each data type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <div key={type.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium">{type.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate(type.id)}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DataImportSimple;