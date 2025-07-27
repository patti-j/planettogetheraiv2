import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, Database, Users, Building, Wrench, Briefcase, CheckCircle, AlertCircle, Plus, Trash2, Grid3X3 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ImportStatus {
  type: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  count?: number;
}

export default function DataImport() {
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [manualData, setManualData] = useState({
    resources: '',
    jobs: '',
    users: '',
    capabilities: '',
    plants: ''
  });

  // Structured data for spreadsheet-like interface
  const [structuredData, setStructuredData] = useState<Record<string, any[]>>({
    resources: [{ name: '', type: 'Equipment', description: '', status: 'active', capabilities: '' }],
    jobs: [{ name: '', customer: '', priority: 'medium', dueDate: '', quantity: 1, description: '' }],
    users: [{ username: '', email: '', firstName: '', lastName: '', role: 'operator' }],
    capabilities: [{ name: '', description: '', category: 'general' }],
    plants: [{ name: '', location: '', address: '', timezone: 'UTC' }]
  });

  const importMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/data-import/bulk', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Data Import Complete",
        description: "All data has been successfully imported into the system.",
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "There was an error importing your data. Please check the format and try again.",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, dataType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatuses(prev => [...prev, { type: dataType, status: 'pending', message: 'Processing file...' }]);

    try {
      const text = await file.text();
      let data;

      if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }

      setImportStatuses(prev => 
        prev.map(status => 
          status.type === dataType 
            ? { ...status, status: 'success', message: `Successfully processed ${Array.isArray(data) ? data.length : Object.keys(data).length} items`, count: Array.isArray(data) ? data.length : Object.keys(data).length }
            : status
        )
      );

      // Process the data based on type
      await processImportData(dataType, data);

    } catch (error) {
      setImportStatuses(prev => 
        prev.map(status => 
          status.type === dataType 
            ? { ...status, status: 'error', message: error instanceof Error ? error.message : 'Import failed' }
            : status
        )
      );
    } finally {
      setIsImporting(false);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have headers and at least one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index] || '';
        return obj;
      }, {} as any);
    });
  };

  const processImportData = async (dataType: string, data: any[]) => {
    // Transform data based on type and send to backend
    const transformedData = transformDataForImport(dataType, data);
    await importMutation.mutateAsync({ type: dataType, data: transformedData });
  };

  const transformDataForImport = (dataType: string, data: any[]) => {
    switch (dataType) {
      case 'resources':
        return data.map(item => ({
          name: item.name || item.Name || '',
          type: item.type || item.Type || 'Equipment',
          description: item.description || item.Description || '',
          status: item.status || item.Status || 'active',
          capabilities: item.capabilities || item.Capabilities || ''
        }));
      case 'jobs':
        return data.map(item => ({
          name: item.name || item.Name || item.Job || '',
          customer: item.customer || item.Customer || '',
          priority: item.priority || item.Priority || 'medium',
          dueDate: item.dueDate || item['Due Date'] || null,
          quantity: parseInt(item.quantity || item.Quantity || '1'),
          description: item.description || item.Description || ''
        }));
      case 'users':
        return data.map(item => ({
          username: item.username || item.Username || item.User || '',
          email: item.email || item.Email || '',
          firstName: item.firstName || item['First Name'] || '',
          lastName: item.lastName || item['Last Name'] || '',
          role: item.role || item.Role || 'operator'
        }));
      case 'capabilities':
        return data.map(item => ({
          name: item.name || item.Name || item.Capability || '',
          description: item.description || item.Description || '',
          category: item.category || item.Category || 'general'
        }));
      case 'plants':
        return data.map(item => ({
          name: item.name || item.Name || item.Plant || '',
          location: item.location || item.Location || '',
          address: item.address || item.Address || '',
          timezone: item.timezone || item.Timezone || 'UTC'
        }));
      default:
        return data;
    }
  };

  // Field definitions for each data type
  const getFieldDefinitions = (dataType: string) => {
    switch (dataType) {
      case 'resources':
        return [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'type', label: 'Type', type: 'select', options: ['Equipment', 'Personnel', 'Tool', 'Vehicle'], required: true },
          { key: 'description', label: 'Description', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'maintenance'], required: true },
          { key: 'capabilities', label: 'Capabilities', type: 'text', placeholder: 'Comma-separated capabilities' }
        ];
      case 'jobs':
        return [
          { key: 'name', label: 'Job Name', type: 'text', required: true },
          { key: 'customer', label: 'Customer', type: 'text', required: true },
          { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'], required: true },
          { key: 'dueDate', label: 'Due Date', type: 'date' },
          { key: 'quantity', label: 'Quantity', type: 'number', required: true },
          { key: 'description', label: 'Description', type: 'text' }
        ];
      case 'users':
        return [
          { key: 'username', label: 'Username', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'firstName', label: 'First Name', type: 'text', required: true },
          { key: 'lastName', label: 'Last Name', type: 'text', required: true },
          { key: 'role', label: 'Role', type: 'select', options: ['operator', 'supervisor', 'manager', 'admin'], required: true }
        ];
      case 'capabilities':
        return [
          { key: 'name', label: 'Capability Name', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'text' },
          { key: 'category', label: 'Category', type: 'select', options: ['general', 'manufacturing', 'quality', 'maintenance', 'logistics'], required: true }
        ];
      case 'plants':
        return [
          { key: 'name', label: 'Plant Name', type: 'text', required: true },
          { key: 'location', label: 'Location', type: 'text', required: true },
          { key: 'address', label: 'Address', type: 'text' },
          { key: 'timezone', label: 'Timezone', type: 'select', options: ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo'], required: true }
        ];
      default:
        return [];
    }
  };

  const addStructuredRow = (dataType: string) => {
    const fields = getFieldDefinitions(dataType);
    const newRow = fields.reduce((obj, field) => {
      obj[field.key] = field.type === 'number' ? 0 : field.options?.[0] || '';
      return obj;
    }, {} as any);
    
    setStructuredData(prev => ({
      ...prev,
      [dataType]: [...prev[dataType], newRow]
    }));
  };

  const removeStructuredRow = (dataType: string, index: number) => {
    setStructuredData(prev => ({
      ...prev,
      [dataType]: prev[dataType].filter((_, i) => i !== index)
    }));
  };

  const updateStructuredCell = (dataType: string, rowIndex: number, fieldKey: string, value: any) => {
    setStructuredData(prev => ({
      ...prev,
      [dataType]: prev[dataType].map((row, i) => 
        i === rowIndex ? { ...row, [fieldKey]: value } : row
      )
    }));
  };

  const handleStructuredImport = async (dataType: string) => {
    const data = structuredData[dataType].filter(row => {
      // Filter out empty rows (rows where required fields are empty)
      const fields = getFieldDefinitions(dataType);
      return fields.some(field => field.required && row[field.key]?.toString().trim());
    });

    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "Please enter at least one complete row of data.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportStatuses(prev => [...prev, { type: dataType, status: 'pending', message: 'Processing structured data...' }]);

    try {
      await processImportData(dataType, data);
      
      setImportStatuses(prev => 
        prev.map(status => 
          status.type === dataType 
            ? { ...status, status: 'success', message: `Successfully imported ${data.length} items`, count: data.length }
            : status
        )
      );

      // Reset structured data after successful import
      const fields = getFieldDefinitions(dataType);
      const emptyRow = fields.reduce((obj, field) => {
        obj[field.key] = field.type === 'number' ? 0 : field.options?.[0] || '';
        return obj;
      }, {} as any);
      
      setStructuredData(prev => ({
        ...prev,
        [dataType]: [emptyRow]
      }));

    } catch (error) {
      setImportStatuses(prev => 
        prev.map(status => 
          status.type === dataType 
            ? { ...status, status: 'error', message: error instanceof Error ? error.message : 'Import failed' }
            : status
        )
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualImport = async (dataType: string) => {
    const textData = manualData[dataType as keyof typeof manualData];
    if (!textData.trim()) {
      toast({
        title: "No Data",
        description: "Please enter some data before importing.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportStatuses(prev => [...prev, { type: dataType, status: 'pending', message: 'Processing manual entry...' }]);

    try {
      // Try to parse as JSON first, then as CSV-like format
      let data;
      try {
        data = JSON.parse(textData);
      } catch {
        // Parse as line-separated values
        const lines = textData.split('\n').filter(line => line.trim());
        data = lines.map(line => {
          const parts = line.split(',').map(p => p.trim());
          switch (dataType) {
            case 'resources':
              return { name: parts[0], type: parts[1] || 'Equipment', description: parts[2] || '' };
            case 'jobs':
              return { name: parts[0], customer: parts[1] || '', priority: parts[2] || 'medium' };
            case 'users':
              return { username: parts[0], email: parts[1] || '', firstName: parts[2] || '', lastName: parts[3] || '' };
            case 'capabilities':
              return { name: parts[0], description: parts[1] || '', category: parts[2] || 'general' };
            case 'plants':
              return { name: parts[0], location: parts[1] || '', address: parts[2] || '' };
            default:
              return { name: parts[0] };
          }
        });
      }

      await processImportData(dataType, Array.isArray(data) ? data : [data]);
      
      setImportStatuses(prev => 
        prev.map(status => 
          status.type === dataType 
            ? { ...status, status: 'success', message: `Successfully imported ${Array.isArray(data) ? data.length : 1} items`, count: Array.isArray(data) ? data.length : 1 }
            : status
        )
      );

      // Clear the manual data after successful import
      setManualData(prev => ({ ...prev, [dataType]: '' }));

    } catch (error) {
      setImportStatuses(prev => 
        prev.map(status => 
          status.type === dataType 
            ? { ...status, status: 'error', message: error instanceof Error ? error.message : 'Import failed' }
            : status
        )
      );
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = (dataType: string) => {
    let csvContent = '';
    let filename = '';

    switch (dataType) {
      case 'resources':
        csvContent = 'Name,Type,Description,Status,Capabilities\nMachine-001,Equipment,CNC Machine,active,CNC Machining\nOperator-001,Personnel,Machine Operator,active,Machine Operation';
        filename = 'resources_template.csv';
        break;
      case 'jobs':
        csvContent = 'Name,Customer,Priority,Due Date,Quantity,Description\nWidget Assembly,ACME Corp,high,2025-02-01,100,Assembly of widget components\nPart Manufacturing,TechCorp,medium,2025-02-15,250,Manufacturing precision parts';
        filename = 'jobs_template.csv';
        break;
      case 'users':
        csvContent = 'Username,Email,First Name,Last Name,Role\njohn.doe,john@company.com,John,Doe,operator\njane.smith,jane@company.com,Jane,Smith,supervisor';
        filename = 'users_template.csv';
        break;
      case 'capabilities':
        csvContent = 'Name,Description,Category\nCNC Machining,Computer Numerical Control machining,manufacturing\nWelding,Metal welding operations,manufacturing\nQuality Control,Product quality inspection,quality';
        filename = 'capabilities_template.csv';
        break;
      case 'plants':
        csvContent = 'Name,Location,Address,Timezone\nMain Plant,Chicago,123 Industrial Ave Chicago IL,America/Chicago\nSecondary Plant,Dallas,456 Manufacturing Blvd Dallas TX,America/Chicago';
        filename = 'plants_template.csv';
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const dataTypes = [
    { key: 'resources', label: 'Resources', icon: Wrench, description: 'Equipment, machinery, and personnel' },
    { key: 'jobs', label: 'Jobs', icon: Briefcase, description: 'Production orders and work orders' },
    { key: 'users', label: 'Users', icon: Users, description: 'System users and operators' },
    { key: 'capabilities', label: 'Capabilities', icon: Database, description: 'Skills and machine capabilities' },
    { key: 'plants', label: 'Plants', icon: Building, description: 'Manufacturing facilities and locations' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Master Data Setup</h1>
        <p className="text-muted-foreground">
          Set up your company's core manufacturing data quickly and easily. 
          Upload files, enter data in spreadsheet format, use text input, or download templates to get started.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Import Status Overview */}
        {importStatuses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Import Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {importStatuses.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {status.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {status.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                      {status.status === 'pending' && <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                      <span className="font-medium capitalize">{status.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{status.message}</p>
                      {status.count && <Badge variant="secondary">{status.count} items</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Import Sections */}
        {dataTypes.map(({ key, label, icon: Icon, description }) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {label}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                  <TabsTrigger value="structured">
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Spreadsheet
                  </TabsTrigger>
                  <TabsTrigger value="manual">Text Entry</TabsTrigger>
                  <TabsTrigger value="template">Template</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload CSV or JSON files with your {label.toLowerCase()} data
                    </p>
                    <Input
                      type="file"
                      accept=".csv,.json"
                      onChange={(e) => handleFileUpload(e, key)}
                      disabled={isImporting}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="structured" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Structured Data Entry</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addStructuredRow(key)}
                        disabled={isImporting}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Row
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {getFieldDefinitions(key).map(field => (
                                <TableHead key={field.key} className="min-w-32">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </TableHead>
                              ))}
                              <TableHead className="w-12">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {structuredData[key]?.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {getFieldDefinitions(key).map(field => (
                                  <TableCell key={field.key} className="p-2">
                                    {field.type === 'select' ? (
                                      <Select
                                        value={row[field.key]?.toString() || ''}
                                        onValueChange={(value) => updateStructuredCell(key, rowIndex, field.key, value)}
                                        disabled={isImporting}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {field.options?.map(option => (
                                            <SelectItem key={option} value={option}>
                                              {option}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        type={field.type}
                                        value={row[field.key]?.toString() || ''}
                                        onChange={(e) => updateStructuredCell(key, rowIndex, field.key, 
                                          field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                                        )}
                                        placeholder={field.placeholder || field.label}
                                        disabled={isImporting}
                                        className="h-8"
                                        required={field.required}
                                      />
                                    )}
                                  </TableCell>
                                ))}
                                <TableCell className="p-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeStructuredRow(key, rowIndex)}
                                    disabled={isImporting || structuredData[key]?.length <= 1}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <p>Fields marked with * are required</p>
                      <p>{structuredData[key]?.length || 0} rows</p>
                    </div>
                    
                    <Button 
                      onClick={() => handleStructuredImport(key)}
                      disabled={isImporting || (structuredData[key]?.length === 0)}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import {structuredData[key]?.length || 0} {label}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div>
                    <Label htmlFor={`manual-${key}`}>Enter {label} Data</Label>
                    <Textarea
                      id={`manual-${key}`}
                      placeholder={`Enter ${label.toLowerCase()} data (one per line, comma-separated values or JSON format)`}
                      value={manualData[key as keyof typeof manualData]}
                      onChange={(e) => setManualData(prev => ({ ...prev, [key]: e.target.value }))}
                      rows={8}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Example: Name,Type,Description (one entry per line) or JSON format
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleManualImport(key)}
                    disabled={isImporting || !manualData[key as keyof typeof manualData].trim()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import {label}
                  </Button>
                </TabsContent>

                <TabsContent value="template" className="space-y-4">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Download a template CSV file with sample data to get started quickly
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => downloadTemplate(key)}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download {label} Template
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}