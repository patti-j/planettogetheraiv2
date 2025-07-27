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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, Database, Users, Building, Wrench, Briefcase, CheckCircle, AlertCircle, Plus, Trash2, Grid3X3, ChevronDown, X, MapPin, Building2, Factory, Package, Warehouse, Package2, Hash, ShoppingCart, FileText, ArrowLeftRight, List, Route, TrendingUp, UserCheck, CheckSquare, Square, Calendar } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMaxDock } from '@/contexts/MaxDockContext';

interface ImportStatus {
  type: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  count?: number;
}

export default function DataImport() {
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [showConsolidatedDialog, setShowConsolidatedDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMaxOpen } = useMaxDock();

  // Fetch available capabilities for dropdown
  const { data: capabilities = [] } = useQuery({
    queryKey: ['/api/capabilities'],
    queryFn: () => apiRequest('/api/capabilities'),
    enabled: true
  });

  // Fetch plants for resource dependencies (disabled for now)
  // const { data: plants = [] } = useQuery({
  //   queryKey: ['/api/plants'],
  //   enabled: true
  // });

  const [manualData, setManualData] = useState({
    resources: '',
    productionOrders: '',
    plannedOrders: '',
    users: '',
    capabilities: '',
    plants: ''
  });

  // Data dependency hierarchy - defines what must be created first
  const dataDependencies = {
    plants: [], // No dependencies - can be created first
    capabilities: [], // No dependencies - can be created first  
    users: [], // No dependencies - can be created first
    resources: ['plants', 'capabilities'], // Requires plants and capabilities to exist
    productionOrders: ['resources'], // Requires resources to exist
    plannedOrders: ['resources'] // Requires resources to exist
  };

  // Structured data for spreadsheet-like interface
  const [structuredData, setStructuredData] = useState<Record<string, any[]>>({
    plants: [{ name: '', location: '', address: '', timezone: 'UTC' }],
    capabilities: [{ name: '', description: '', category: 'general' }],
    users: [{ username: '', email: '', firstName: '', lastName: '', role: 'operator' }],
    resources: [{ name: '', type: 'Equipment', description: '', status: 'active', capabilities: [], plantId: '' }],
    productionOrders: [{ name: '', customer: '', priority: 'medium', dueDate: '', quantity: 1, description: '', status: 'pending' }],
    plannedOrders: [{ name: '', customer: '', priority: 'medium', dueDate: '', quantity: 1, description: '', planType: 'forecast' }]
  });

  const importMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/data-import/bulk', 'POST', data);
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
        return data.map(item => {
          let capabilities = item.capabilities || item.Capabilities || [];
          
          // Handle different formats of capabilities data
          if (typeof capabilities === 'string') {
            // If it's a comma-separated string, split it
            capabilities = capabilities.split(',').map((cap: string) => cap.trim()).filter(Boolean);
          } else if (!Array.isArray(capabilities)) {
            capabilities = [];
          }
          
          return {
            name: item.name || item.Name || '',
            type: item.type || item.Type || 'Equipment',
            description: item.description || item.Description || '',
            status: item.status || item.Status || 'active',
            capabilities: capabilities
          };
        });
      case 'productionOrders':
        return data.map(item => ({
          name: item.name || item.Name || item['Production Order'] || '',
          customer: item.customer || item.Customer || '',
          priority: item.priority || item.Priority || 'medium',
          dueDate: item.dueDate || item['Due Date'] || null,
          quantity: parseInt(item.quantity || item.Quantity || '1'),
          status: item.status || item.Status || 'pending',
          description: item.description || item.Description || ''
        }));
      case 'plannedOrders':
        return data.map(item => ({
          name: item.name || item.Name || item['Planned Order'] || '',
          customer: item.customer || item.Customer || '',
          priority: item.priority || item.Priority || 'medium',
          dueDate: item.dueDate || item['Due Date'] || null,
          quantity: parseInt(item.quantity || item.Quantity || '1'),
          planType: item.planType || item['Plan Type'] || 'forecast',
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
          { key: 'plantId', label: 'Plant', type: 'select', options: ['1', '2'], required: true, placeholder: 'Select plant' },
          { key: 'description', label: 'Description', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'maintenance'], required: true },
          { key: 'capabilities', label: 'Capabilities', type: 'multiselect', placeholder: 'Select capabilities' }
        ];
      case 'productionOrders':
        return [
          { key: 'name', label: 'Production Order Name', type: 'text', required: true },
          { key: 'customer', label: 'Customer', type: 'text', required: true },
          { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'], required: true },
          { key: 'dueDate', label: 'Due Date', type: 'date' },
          { key: 'quantity', label: 'Quantity', type: 'number', required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['pending', 'released', 'in-progress', 'completed', 'cancelled'], required: true },
          { key: 'description', label: 'Description', type: 'text' }
        ];
      case 'plannedOrders':
        return [
          { key: 'name', label: 'Planned Order Name', type: 'text', required: true },
          { key: 'customer', label: 'Customer', type: 'text', required: true },
          { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'], required: true },
          { key: 'dueDate', label: 'Due Date', type: 'date' },
          { key: 'quantity', label: 'Quantity', type: 'number', required: true },
          { key: 'planType', label: 'Plan Type', type: 'select', options: ['forecast', 'firm', 'safety'], required: true },
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
      if (field.type === 'multiselect') {
        obj[field.key] = [];
      } else if (field.type === 'number') {
        obj[field.key] = 0;
      } else {
        obj[field.key] = field.options?.[0] || '';
      }
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

  // Check if dependencies are satisfied for a data type
  const checkDependencies = (dataType: string) => {
    const dependencies = dataDependencies[dataType as keyof typeof dataDependencies] || [];
    const missingDeps: string[] = [];
    
    for (const dep of dependencies) {
      // Check if this dependency has data (either imported or in structured data)
      const hasImportedData = importStatuses.some(status => 
        status.type === dep && status.status === 'success'
      );
      const hasStructuredData = structuredData[dep]?.some(row => {
        const fields = getFieldDefinitions(dep);
        return fields.some(field => field.required && row[field.key]?.toString().trim());
      });
      
      if (!hasImportedData && !hasStructuredData) {
        missingDeps.push(dep);
      }
    }
    
    return { isReady: missingDeps.length === 0, missingDeps };
  };

  // Get dependency status message
  const getDependencyMessage = (dataType: string) => {
    const { isReady, missingDeps } = checkDependencies(dataType);
    
    if (isReady) {
      return { type: 'ready', message: 'Ready to create' };
    } else {
      const depNames = missingDeps.map(dep => dep.charAt(0).toUpperCase() + dep.slice(1)).join(', ');
      return { 
        type: 'blocked', 
        message: `Please create ${depNames} first before adding ${dataType}` 
      };
    }
  };

  // Order data types by dependencies (least dependent first)
  const getOrderedDataTypes = () => {
    const dataTypes = Object.keys(structuredData);
    return dataTypes.sort((a, b) => {
      const aDeps = dataDependencies[a as keyof typeof dataDependencies]?.length || 0;
      const bDeps = dataDependencies[b as keyof typeof dataDependencies]?.length || 0;
      return aDeps - bDeps;
    });
  };

  // Multi-select capabilities component
  const CapabilitiesMultiSelect = ({ value, onChange, disabled }: {
    value: string[];
    onChange: (value: string[]) => void;
    disabled: boolean;
  }) => {
    const [open, setOpen] = useState(false);
    
    // Type guard for capabilities array
    const availableCapabilities = Array.isArray(capabilities) ? capabilities : [];
    
    const toggleCapability = (capabilityName: string) => {
      const newValue = value.includes(capabilityName)
        ? value.filter(name => name !== capabilityName)
        : [...value, capabilityName];
      onChange(newValue);
    };

    const removeCapability = (capabilityName: string) => {
      onChange(value.filter(name => name !== capabilityName));
    };

    return (
      <div className="space-y-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between h-8 text-left"
              disabled={disabled}
            >
              <span className="truncate">
                {value.length === 0 ? "Select capabilities" : `${value.length} selected`}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <div className="max-h-48 overflow-auto p-2">
              {availableCapabilities.map((capability: any) => (
                <div key={capability.id} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`cap-${capability.id}`}
                    checked={value.includes(capability.name)}
                    onCheckedChange={() => toggleCapability(capability.name)}
                  />
                  <label 
                    htmlFor={`cap-${capability.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {capability.name}
                  </label>
                </div>
              ))}
              {availableCapabilities.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">No capabilities available</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Selected capabilities badges */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {value.map((capName) => (
              <Badge 
                key={capName} 
                variant="secondary" 
                className="text-xs py-0 px-1 h-5"
              >
                {capName}
                <button
                  onClick={() => removeCapability(capName)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  disabled={disabled}
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
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

  const getTemplatePreview = (type: string) => {
    switch (type) {
      // Core Manufacturing
      case 'resources':
        return 'Name,Type,Description,Status,Capabilities\nMachine-001,Equipment,CNC Machine,active,CNC Machining';
      case 'jobs':
        return 'Name,Customer,Priority,Due Date,Quantity,Description\nWidget Assembly,ACME Corp,high,2025-02-01,100,Assembly of widget components';
      case 'capabilities':
        return 'Name,Description,Category\nCNC Machining,Computer Numerical Control machining,manufacturing';
      case 'plants':
        return 'Name,Location,Address,Timezone\nMain Plant,Chicago,123 Industrial Ave Chicago IL,America/Chicago';
      
      // Organizational Structure
      case 'sites':
        return 'Name,Code,Street,City,State,Postal Code,Country\nMain Manufacturing,MAIN,123 Industrial Blvd,Chicago,IL,60601,USA';
      case 'departments':
        return 'Name,Code,Description,Plant,Cost Center\nProduction,PROD,Manufacturing operations,Main Plant,CC001';
      case 'workCenters':
        return 'Name,Code,Description,Department,Capacity\nCNC Work Center,WC001,CNC machining operations,Production,10';
      case 'employees':
        return 'Employee Number,First Name,Last Name,Email,Department\nEMP001,John,Smith,john.smith@company.com,Production';
      
      // Products & Inventory
      case 'items':
        return 'Item Number,Name,Description,Item Type,Unit of Measure\nWIDG-001,Widget Assembly,Standard widget product,finished_good,EA';
      case 'storageLocations':
        return 'Name,Code,Description,Site,Location Type\nMain Storage,SL-MAIN,Primary storage facility,Main Manufacturing,general';
      case 'inventory':
        return 'Item Number,Storage Location Code,Location,On Hand Quantity\nWIDG-001,SL-MAIN,A1-B2,150';
      case 'inventoryLots':
        return 'Lot Number,Item Number,Storage Location Code,Quantity,Status\nLOT001,COMP-001,SL-MAIN,100,available';
      
      // Sales & Orders
      case 'salesOrders':
        return 'Order Number,Customer Name,Order Date,Status,Total Amount\nSO-2025-001,ACME Corporation,2025-01-15,open,75000';
      case 'purchaseOrders':
        return 'Order Number,Supplier Name,Order Date,Status,Total Amount\nPO-2025-001,Steel Supply Co,2025-01-15,open,35000';
      case 'transferOrders':
        return 'Order Number,From Warehouse,To Warehouse,Status\nTO-2025-001,WH-MAIN,WH-FG,open';
      
      // Manufacturing Planning
      case 'billsOfMaterial':
        return 'Parent Item Number,Revision,Description,Effective Date\nWIDG-001,1,Widget assembly BOM,2025-01-01';
      case 'routings':
        return 'Item Number,Revision,Description,Effective Date\nWIDG-001,1,Widget manufacturing routing,2025-01-01';
      case 'forecasts':
        return 'Item Number,Site,Forecast Date,Forecast Quantity\nWIDG-001,Main Manufacturing,2025-02-01,100';
      
      // System Users
      case 'users':
        return 'Username,Email,First Name,Last Name,Role\njohn.doe,john@company.com,John,Doe,operator';
      
      default:
        return 'Column1,Column2,Column3\nValue1,Value2,Value3';
    }
  };

  const downloadConsolidatedTemplate = () => {
    if (selectedDataTypes.length === 0) {
      toast({
        title: "No Data Types Selected",
        description: "Please select at least one data type to download.",
        variant: "destructive",
      });
      return;
    }

    // Create a consolidated CSV with sections for each data type
    let consolidatedContent = '';
    
    selectedDataTypes.forEach((dataType, index) => {
      const dataTypeInfo = dataTypes.find(dt => dt.key === dataType);
      const sectionTitle = dataTypeInfo ? dataTypeInfo.label : dataType;
      
      // Add section header
      consolidatedContent += `\n# ${sectionTitle.toUpperCase()}\n`;
      consolidatedContent += `# ${dataTypeInfo?.description || ''}\n`;
      
      // Add the template content for this data type
      const templateContent = getConsolidatedTemplateContent(dataType);
      consolidatedContent += templateContent;
      
      // Add spacing between sections (except for last one)
      if (index < selectedDataTypes.length - 1) {
        consolidatedContent += '\n\n';
      }
    });

    const blob = new Blob([consolidatedContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consolidated_template_${selectedDataTypes.length}_types.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Consolidated Template Downloaded",
      description: `Downloaded template with ${selectedDataTypes.length} data types.`,
    });
  };

  const getConsolidatedTemplateContent = (dataType: string) => {
    switch (dataType) {
      // Core Manufacturing
      case 'resources':
        return 'Name,Type,Description,Status,Capabilities\nMachine-001,Equipment,CNC Machine,active,CNC Machining\nOperator-001,Personnel,Machine Operator,active,Machine Operation';
      case 'jobs':
        return 'Name,Customer,Priority,Due Date,Quantity,Description\nWidget Assembly,ACME Corp,high,2025-02-01,100,Assembly of widget components\nPart Manufacturing,TechCorp,medium,2025-02-15,250,Manufacturing precision parts';
      case 'capabilities':
        return 'Name,Description,Category\nCNC Machining,Computer Numerical Control machining,manufacturing\nWelding,Metal welding operations,manufacturing\nQuality Control,Product quality inspection,quality';
      case 'plants':
        return 'Name,Location,Address,Timezone\nMain Plant,Chicago,123 Industrial Ave Chicago IL,America/Chicago\nSecondary Plant,Dallas,456 Manufacturing Blvd Dallas TX,America/Chicago';

      // Organizational Structure
      case 'sites':
        return 'Name,Code,Street,City,State,Postal Code,Country,Timezone,Currency,Site Type\nMain Manufacturing,MAIN,123 Industrial Blvd,Chicago,IL,60601,USA,America/Chicago,USD,manufacturing\nStorage Site,ST01,456 Storage Dr,Dallas,TX,75201,USA,America/Chicago,USD,storage';
      case 'departments':
        return 'Name,Code,Description,Plant,Cost Center,Budget Amount\nProduction,PROD,Manufacturing operations department,Main Plant,CC001,500000\nQuality Control,QC,Quality assurance department,Main Plant,CC002,150000';
      case 'workCenters':
        return 'Name,Code,Description,Department,Plant,Capacity,Efficiency,Cost Per Hour\nCNC Work Center,WC001,CNC machining operations,Production,Main Plant,10,95,7500\nAssembly Line 1,WC002,Product assembly line,Production,Main Plant,5,90,5000';
      case 'employees':
        return 'Employee Number,First Name,Last Name,Email,Phone,Department,Work Center,Job Title,Skill Level,Hourly Rate,Capabilities,Shift Pattern\nEMP001,John,Smith,john.smith@company.com,555-0101,Production,CNC Work Center,CNC Operator,senior,3500,"1,2",day\nEMP002,Jane,Doe,jane.doe@company.com,555-0102,Quality Control,,QC Inspector,intermediate,3000,"5",day';

      // Products & Inventory
      case 'items':
        return 'Item Number,Name,Description,Item Type,Unit of Measure,Weight,Standard Cost,List Price,Lead Time,Safety Stock\nWIDG-001,Widget Assembly,Standard widget product,finished_good,EA,1500,2500,5000,7,50\nCOMP-001,Widget Component,Main widget component,component,EA,200,500,0,3,100';
      case 'storageLocations':
        return 'Name,Code,Description,Site,Location Type,Total Capacity,Used Capacity\nMain Storage,SL-MAIN,Primary storage facility,Main Manufacturing,general,10000,6500\nFinished Goods,SL-FG,Finished products storage,Main Manufacturing,finished_goods,5000,2800';
      case 'inventory':
        return 'Item Number,Storage Location Code,Location,On Hand Quantity,Allocated Quantity,Available Quantity,Average Cost\nWIDG-001,SL-MAIN,A1-B2,150,25,125,2500\nCOMP-001,SL-MAIN,B3-C4,500,100,400,500';
      case 'inventoryLots':
        return 'Lot Number,Item Number,Storage Location Code,Quantity,Expiration Date,Received Date,Status\nLOT001,COMP-001,SL-MAIN,100,2025-12-31,2025-01-15,available\nLOT002,COMP-001,SL-MAIN,75,,2025-01-20,available';

      // Sales & Orders
      case 'salesOrders':
        return 'Order Number,Customer Name,Customer Code,Order Date,Requested Date,Status,Priority,Total Amount,Site,Sales Person\nSO-2025-001,ACME Corporation,ACME,2025-01-15,2025-02-01,open,high,75000,Main Manufacturing,John Sales\nSO-2025-002,TechCorp Inc,TECH,2025-01-16,2025-02-15,confirmed,medium,125000,Main Manufacturing,Jane Sales';
      case 'purchaseOrders':
        return 'Order Number,Supplier Name,Supplier Code,Order Date,Requested Date,Status,Total Amount,Site,Buyer Name\nPO-2025-001,Steel Supply Co,STEEL,2025-01-15,2025-01-30,open,35000,Main Manufacturing,Bob Buyer\nPO-2025-002,Component Corp,COMP,2025-01-16,2025-02-05,confirmed,18000,Main Manufacturing,Alice Buyer';
      case 'transferOrders':
        return 'Order Number,From Warehouse,To Warehouse,Requested Date,Status,Priority,Requested By\nTO-2025-001,WH-MAIN,WH-FG,2025-01-15,open,medium,Production Manager\nTO-2025-002,WH-FG,WH-MAIN,2025-01-16,shipped,high,Inventory Manager';

      // Manufacturing Planning
      case 'billsOfMaterial':
        return 'Parent Item Number,Revision,Description,Effective Date,BOM Type,Standard Quantity\nWIDG-001,1,Widget assembly BOM,2025-01-01,production,1\nCOMP-001,1,Component sub-assembly BOM,2025-01-01,production,1';
      case 'routings':
        return 'Item Number,Revision,Description,Effective Date,Routing Type,Standard Quantity\nWIDG-001,1,Widget manufacturing routing,2025-01-01,production,1\nCOMP-001,1,Component production routing,2025-01-01,production,1';
      case 'forecasts':
        return 'Item Number,Site,Forecast Date,Forecast Quantity,Forecast Type,Forecast Method,Confidence,Planner Name\nWIDG-001,Main Manufacturing,2025-02-01,100,demand,manual,80,Production Planner\nCOMP-001,Main Manufacturing,2025-02-01,250,demand,statistical,70,Production Planner';

      // System Users
      case 'users':
        return 'Username,Email,First Name,Last Name,Role\njohn.doe,john@company.com,John,Doe,operator\njane.smith,jane@company.com,Jane,Smith,supervisor';

      default:
        return 'Column1,Column2,Column3\nValue1,Value2,Value3';
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
      case 'productionOrders':
        csvContent = 'Name,Customer,Priority,Due Date,Quantity,Status,Description\nWidget Assembly,ACME Corp,high,2025-02-01,100,pending,Assembly of widget components\nPart Manufacturing,TechCorp,medium,2025-02-15,250,released,Manufacturing precision parts';
        filename = 'production_orders_template.csv';
        break;
      case 'plannedOrders':
        csvContent = 'Name,Customer,Priority,Due Date,Quantity,Plan Type,Description\nWidget Forecast Q1,ACME Corp,medium,2025-03-31,500,forecast,Forecast for Q1 widget demand\nPart Planning Q2,TechCorp,low,2025-06-30,300,firm,Planned parts for Q2 production';
        filename = 'planned_orders_template.csv';
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

      // Organizational Structure
      case 'sites':
        csvContent = 'Name,Code,Street,City,State,Postal Code,Country,Timezone,Currency,Site Type\nMain Manufacturing,MAIN,123 Industrial Blvd,Chicago,IL,60601,USA,America/Chicago,USD,manufacturing\nStorage Site,ST01,456 Storage Dr,Dallas,TX,75201,USA,America/Chicago,USD,storage';
        filename = 'sites_template.csv';
        break;
      case 'departments':
        csvContent = 'Name,Code,Description,Plant,Cost Center,Budget Amount\nProduction,PROD,Manufacturing operations department,Main Plant,CC001,500000\nQuality Control,QC,Quality assurance department,Main Plant,CC002,150000';
        filename = 'departments_template.csv';
        break;
      case 'workCenters':
        csvContent = 'Name,Code,Description,Department,Plant,Capacity,Efficiency,Cost Per Hour\nCNC Work Center,WC001,CNC machining operations,Production,Main Plant,10,95,7500\nAssembly Line 1,WC002,Product assembly line,Production,Main Plant,5,90,5000';
        filename = 'work_centers_template.csv';
        break;
      case 'employees':
        csvContent = 'Employee Number,First Name,Last Name,Email,Phone,Department,Work Center,Job Title,Skill Level,Hourly Rate,Capabilities,Shift Pattern\nEMP001,John,Smith,john.smith@company.com,555-0101,Production,CNC Work Center,CNC Operator,senior,3500,"1,2",day\nEMP002,Jane,Doe,jane.doe@company.com,555-0102,Quality Control,,QC Inspector,intermediate,3000,"5",day';
        filename = 'employees_template.csv';
        break;

      // Products & Inventory
      case 'items':
        csvContent = 'Item Number,Name,Description,Item Type,Unit of Measure,Weight,Standard Cost,List Price,Lead Time,Safety Stock\nWIDG-001,Widget Assembly,Standard widget product,finished_good,EA,1500,2500,5000,7,50\nCOMP-001,Widget Component,Main widget component,component,EA,200,500,0,3,100';
        filename = 'items_template.csv';
        break;
      case 'storageLocations':
        csvContent = 'Name,Code,Description,Site,Location Type,Total Capacity,Used Capacity\nMain Storage,SL-MAIN,Primary storage facility,Main Manufacturing,general,10000,6500\nFinished Goods,SL-FG,Finished products storage,Main Manufacturing,finished_goods,5000,2800';
        filename = 'storage_locations_template.csv';
        break;
      case 'inventory':
        csvContent = 'Item Number,Storage Location Code,Location,On Hand Quantity,Allocated Quantity,Available Quantity,Average Cost\nWIDG-001,SL-MAIN,A1-B2,150,25,125,2500\nCOMP-001,SL-MAIN,B3-C4,500,100,400,500';
        filename = 'inventory_template.csv';
        break;
      case 'inventoryLots':
        csvContent = 'Lot Number,Item Number,Storage Location Code,Quantity,Expiration Date,Received Date,Status\nLOT001,COMP-001,SL-MAIN,100,2025-12-31,2025-01-15,available\nLOT002,COMP-001,SL-MAIN,75,,2025-01-20,available';
        filename = 'inventory_lots_template.csv';
        break;

      // Sales & Orders
      case 'salesOrders':
        csvContent = 'Order Number,Customer Name,Customer Code,Order Date,Requested Date,Status,Priority,Total Amount,Site,Sales Person\nSO-2025-001,ACME Corporation,ACME,2025-01-15,2025-02-01,open,high,75000,Main Manufacturing,John Sales\nSO-2025-002,TechCorp Inc,TECH,2025-01-16,2025-02-15,confirmed,medium,125000,Main Manufacturing,Jane Sales';
        filename = 'sales_orders_template.csv';
        break;
      case 'purchaseOrders':
        csvContent = 'Order Number,Supplier Name,Supplier Code,Order Date,Requested Date,Status,Total Amount,Site,Buyer Name\nPO-2025-001,Steel Supply Co,STEEL,2025-01-15,2025-01-30,open,35000,Main Manufacturing,Bob Buyer\nPO-2025-002,Component Corp,COMP,2025-01-16,2025-02-05,confirmed,18000,Main Manufacturing,Alice Buyer';
        filename = 'purchase_orders_template.csv';
        break;
      case 'transferOrders':
        csvContent = 'Order Number,From Warehouse,To Warehouse,Requested Date,Status,Priority,Requested By\nTO-2025-001,WH-MAIN,WH-FG,2025-01-15,open,medium,Production Manager\nTO-2025-002,WH-FG,WH-MAIN,2025-01-16,shipped,high,Inventory Manager';
        filename = 'transfer_orders_template.csv';
        break;

      // Manufacturing Planning
      case 'billsOfMaterial':
        csvContent = 'Parent Item Number,Revision,Description,Effective Date,BOM Type,Standard Quantity\nWIDG-001,1,Widget assembly BOM,2025-01-01,production,1\nCOMP-001,1,Component sub-assembly BOM,2025-01-01,production,1';
        filename = 'bills_of_material_template.csv';
        break;
      case 'routings':
        csvContent = 'Item Number,Revision,Description,Effective Date,Routing Type,Standard Quantity\nWIDG-001,1,Widget manufacturing routing,2025-01-01,production,1\nCOMP-001,1,Component production routing,2025-01-01,production,1';
        filename = 'routings_template.csv';
        break;
      case 'forecasts':
        csvContent = 'Item Number,Site,Forecast Date,Forecast Quantity,Forecast Type,Forecast Method,Confidence,Planner Name\nWIDG-001,Main Manufacturing,2025-02-01,100,demand,manual,80,Production Planner\nCOMP-001,Main Manufacturing,2025-02-01,250,demand,statistical,70,Production Planner';
        filename = 'forecasts_template.csv';
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
    // Core Manufacturing
    { key: 'resources', label: 'Resources', icon: Wrench, description: 'Equipment, machinery, and personnel' },
    { key: 'productionOrders', label: 'Production Orders', icon: Briefcase, description: 'Active production work orders' },
    { key: 'plannedOrders', label: 'Planned Orders', icon: Calendar, description: 'Future planned production orders' },
    { key: 'capabilities', label: 'Capabilities', icon: Database, description: 'Skills and machine capabilities' },
    { key: 'plants', label: 'Plants', icon: Building, description: 'Manufacturing facilities and locations' },
    
    // Organizational Structure
    { key: 'sites', label: 'Sites', icon: MapPin, description: 'Manufacturing sites and locations' },
    { key: 'departments', label: 'Departments', icon: Building2, description: 'Organizational departments' },
    { key: 'workCenters', label: 'Work Centers', icon: Factory, description: 'Production work centers' },
    { key: 'employees', label: 'Employees', icon: Users, description: 'Personnel and workforce' },
    
    // Products & Inventory
    { key: 'items', label: 'Items', icon: Package, description: 'Products, components, and materials' },
    { key: 'storageLocations', label: 'Storage Locations', icon: Warehouse, description: 'Storage facilities and locations' },
    { key: 'inventory', label: 'Inventory', icon: Package2, description: 'Current stock levels and quantities' },
    { key: 'inventoryLots', label: 'Inventory Lots', icon: Hash, description: 'Lot-controlled inventory tracking' },
    
    // Sales & Orders
    { key: 'salesOrders', label: 'Sales Orders', icon: ShoppingCart, description: 'Customer orders and sales' },
    { key: 'purchaseOrders', label: 'Purchase Orders', icon: FileText, description: 'Supplier purchase orders' },
    { key: 'transferOrders', label: 'Transfer Orders', icon: ArrowLeftRight, description: 'Inter-location transfers' },
    
    // Manufacturing Planning
    { key: 'billsOfMaterial', label: 'Bills of Material', icon: List, description: 'Product recipes and formulas' },
    { key: 'routings', label: 'Routings', icon: Route, description: 'Manufacturing process sequences' },
    { key: 'forecasts', label: 'Forecasts', icon: TrendingUp, description: 'Demand and supply forecasts' },
    
    // System Users
    { key: 'users', label: 'Users', icon: UserCheck, description: 'System users and operators' }
  ];

  return (
    <div className={`p-6 max-w-7xl mx-auto ${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Master Data Setup</h1>
            <p className="text-muted-foreground">
              Set up your company's core manufacturing data quickly and easily. 
              Upload files, enter data in spreadsheet format, use text input, or download templates to get started.
            </p>
          </div>
          <Button 
            onClick={() => setShowConsolidatedDialog(true)}
            variant="outline"
            className="gap-2 shrink-0 ml-4"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Consolidated Template</span>
            <span className="sm:hidden">Multi-Template</span>
          </Button>
        </div>
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

        {/* Dependency Guide */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Grid3X3 className="h-5 w-5" />
              Data Entry Guide
            </CardTitle>
            <CardDescription className="text-blue-700">
              Follow this order to ensure all dependencies are met:
              <span className="font-medium block mt-1">
                1. Plants → 2. Capabilities → 3. Users → 4. Resources → 5. Jobs
              </span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Data Import Sections - Ordered by Dependencies */}
        {getOrderedDataTypes().map((key) => {
          const dataType = dataTypes.find(dt => dt.key === key);
          if (!dataType) return null;
          
          const { label, icon: Icon, description } = dataType;
          const dependencyStatus = getDependencyMessage(key);
          const isReady = dependencyStatus.type === 'ready';
          
          return (
            <Card key={key} className={isReady ? '' : 'opacity-60 border-orange-200'}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {label}
                    {!isReady && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Blocked
                      </Badge>
                    )}
                    {isReady && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Ready
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  {description}
                  {!isReady && (
                    <div className="mt-2 text-orange-600 font-medium text-sm">
                      ⚠️ {dependencyStatus.message}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upload" className="w-full">{/* disabled={!isReady} */}
                <div className="w-full overflow-x-auto">
                  <TabsList className="flex w-max gap-1 md:grid md:w-full md:grid-cols-4">
                    <TabsTrigger value="upload" className="flex-shrink-0 whitespace-nowrap">
                      <span className="hidden sm:inline">Upload File</span>
                      <span className="sm:hidden">Upload</span>
                    </TabsTrigger>
                    <TabsTrigger value="template" className="flex-shrink-0 whitespace-nowrap">
                      <span className="hidden sm:inline">Template Format</span>
                      <span className="sm:hidden">Template</span>
                    </TabsTrigger>
                    <TabsTrigger value="structured" className="flex-shrink-0 whitespace-nowrap">
                      <Grid3X3 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Spreadsheet</span>
                      <span className="sm:hidden">Sheet</span>
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex-shrink-0 whitespace-nowrap">
                      <span className="hidden sm:inline">Text Entry</span>
                      <span className="sm:hidden">Text</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="upload" className="space-y-4">
                  <div className="space-y-4">
                    {/* Format Requirements */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 mb-1">File Format Requirements</h4>
                          <p className="text-sm text-blue-700 mb-2">
                            Your file must match the exact format shown in the Template tab below.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadTemplate(key)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download Template
                            </Button>
                            <span className="text-xs text-blue-600 flex items-center">
                              Use this template to ensure correct format
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upload Area */}
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
                      <p className="text-xs text-muted-foreground mt-2">
                        Accepted formats: CSV, JSON
                      </p>
                    </div>
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
                    
                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-lg overflow-hidden">
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
                                    {field.type === 'multiselect' && field.key === 'capabilities' ? (
                                      <CapabilitiesMultiSelect
                                        value={row[field.key] || []}
                                        onChange={(value) => updateStructuredCell(key, rowIndex, field.key, value)}
                                        disabled={isImporting}
                                      />
                                    ) : field.type === 'select' ? (
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

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4 max-h-96 overflow-auto">
                      {structuredData[key]?.length ? (
                        structuredData[key].map((row, rowIndex) => (
                          <Card key={rowIndex} className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium text-sm">Entry #{rowIndex + 1}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStructuredRow(key, rowIndex)}
                                  disabled={isImporting || structuredData[key]?.length <= 1}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {getFieldDefinitions(key).map(field => (
                                <div key={field.key} className="space-y-1">
                                  <Label className="text-sm font-medium">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </Label>
                                  {field.type === 'multiselect' && field.key === 'capabilities' ? (
                                    <CapabilitiesMultiSelect
                                      value={row[field.key] || []}
                                      onChange={(value) => updateStructuredCell(key, rowIndex, field.key, value)}
                                      disabled={isImporting}
                                    />
                                  ) : field.type === 'select' ? (
                                    <Select
                                      value={row[field.key]?.toString() || ''}
                                      onValueChange={(value) => updateStructuredCell(key, rowIndex, field.key, value)}
                                      disabled={isImporting}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
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
                                      required={field.required}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <Grid3X3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No entries yet. Click "Add Row" to start.</p>
                        </div>
                      )}
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
                  <div className="space-y-4">
                    {/* Template Purpose */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Download className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-green-800 mb-1">Required File Format</h4>
                          <p className="text-sm text-green-700 mb-2">
                            This template shows the exact column headers and format required for file uploads. 
                            Your CSV files must match this structure exactly.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Template Preview */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h5 className="font-medium mb-2">Template Format Preview:</h5>
                      <div className="text-xs font-mono bg-white p-2 rounded border">
                        {getTemplatePreview(key)}
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="text-center">
                      <Button 
                        onClick={() => downloadTemplate(key)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download {label} Template
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Use this template for the Upload File tab above
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Consolidated Template Dialog */}
      <Dialog open={showConsolidatedDialog} onOpenChange={setShowConsolidatedDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Consolidated Template Download
            </DialogTitle>
            <DialogDescription>
              Select multiple data types to download a consolidated template with all your selected data structures.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDataTypes(dataTypes.map(dt => dt.key))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDataTypes([])}
                >
                  Clear All
                </Button>
              </div>
              <Badge variant="secondary">
                {selectedDataTypes.length} of {dataTypes.length} selected
              </Badge>
            </div>

            {/* Data Type Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { category: 'Core Manufacturing', types: dataTypes.slice(0, 5) },
                { category: 'Organizational Structure', types: dataTypes.slice(5, 9) },
                { category: 'Products & Inventory', types: dataTypes.slice(9, 13) },
                { category: 'Orders & Transactions', types: dataTypes.slice(13, 16) },
                { category: 'Manufacturing Planning', types: dataTypes.slice(16, 19) },
                { category: 'System Users', types: dataTypes.slice(19) }
              ].map(category => (
                <div key={category.category} className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                    {category.category}
                  </h4>
                  <div className="space-y-2">
                    {category.types.map(({ key, label, icon: Icon, description }) => {
                      const isSelected = selectedDataTypes.includes(key);
                      return (
                        <div
                          key={key}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedDataTypes(prev => prev.filter(id => id !== key));
                            } else {
                              setSelectedDataTypes(prev => [...prev, key]);
                            }
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{label}</div>
                            <div className="text-xs text-muted-foreground">{description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Preview Section */}
            {selectedDataTypes.length > 0 && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-medium mb-2">Template Preview</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your consolidated template will include sections for the following data types:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedDataTypes.map(key => {
                    const dataType = dataTypes.find(dt => dt.key === key);
                    return (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {dataType?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowConsolidatedDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                downloadConsolidatedTemplate();
                setShowConsolidatedDialog(false);
              }}
              disabled={selectedDataTypes.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Consolidated Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}