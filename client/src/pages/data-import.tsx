import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, Download, FileSpreadsheet, Database, Users, Building, Wrench, 
  Briefcase, CheckCircle, AlertCircle, Plus, Trash2, Grid3X3, ChevronDown, 
  X, MapPin, Building2, Factory, Package, Warehouse, Package2, Hash, 
  ShoppingCart, FileText, ArrowLeftRight, List, Route, TrendingUp, UserCheck, 
  CheckSquare, Square, Calendar, Lightbulb, Sparkles, ExternalLink, Loader2, 
  Edit2, ClipboardList, AlertTriangle, Cog, Search, ChevronLeft, ChevronRight, 
  ChevronUp, ArrowUpDown, Filter, Eye, EyeOff, Info, Beaker, 
  Table as TableIcon, Undo2, Shield, BarChart3, Clock, Settings, Save, 
  ArrowRightLeft, Bot, Target 
} from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/contexts/NavigationContext';

interface ImportStatus {
  type: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  count?: number;
}

function DataImport() {
  const { user } = useAuth();
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [recommendedDataTypes, setRecommendedDataTypes] = useState<string[]>([]);
  const [onboardingFeatures, setOnboardingFeatures] = useState<string[]>([]);
  const { addRecentPage } = useNavigation();

  // Register this page in recent pages when component mounts
  useEffect(() => {
    addRecentPage('/data-import', 'Master Data Setup', 'Database');
  }, []); // Empty dependency array - only run once on mount
  
  // Smart filtering state
  const [showAllDataTypes, setShowAllDataTypes] = useState(false);
  const [dataTypeUsage, setDataTypeUsage] = useState<Record<string, number>>({});
  
  // Data type selector for Manage Data tab - default to resources which has sample data
  const [selectedManageDataType, setSelectedManageDataType] = useState('resources');
  
  // Import data type selector
  const [selectedImportDataType, setSelectedImportDataType] = useState('');
  
  // Template bulk download state
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  
  // Consolidated import state
  const [isConsolidatedImport, setIsConsolidatedImport] = useState(false);
  const [consolidatedFile, setConsolidatedFile] = useState<File | null>(null);
  const [consolidatedSheets, setConsolidatedSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  
  // AI Generation state
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSampleSize, setAiSampleSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // AI Modification state  
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [aiGenerationResult, setAiGenerationResult] = useState<any>(null);
  const [deleteExistingData, setDeleteExistingData] = useState(false);

  // AI Modification state
  const [showAIModifyDialog, setShowAIModifyDialog] = useState(false);
  const [aiModifyPrompt, setAiModifyPrompt] = useState('');
  const [aiModifyResult, setAiModifyResult] = useState<any>(null);
  const [showAIModifySummary, setShowAIModifySummary] = useState(false);

  // Feature selection dialog state
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [tempSelectedFeatures, setTempSelectedFeatures] = useState<string[]>([]);

  // Available features for selection - matches onboarding.tsx featureModules exactly
  const availableFeatures = [
    { id: 'production-scheduling', name: 'Schedule Optimization', icon: BarChart3, description: 'Plan and schedule your production operations with drag-and-drop Gantt charts' },
    { id: 'theory-of-constraints', name: 'Theory of Constraints (TOC)', icon: Target, description: 'Identify and manage production bottlenecks with drum-buffer-rope methodology' },
    { id: 'capacity-planning', name: 'Capacity Optimization', icon: TrendingUp, description: 'Plan and forecast production capacity across your facilities and resources' },
    { id: 'inventory-optimization', name: 'Inventory Management', icon: Package, description: 'Track materials, optimize stock levels, and manage supply chain' },
    { id: 'production-planning', name: 'Production Plan Optimization', icon: ClipboardList, description: 'Create and manage production plans, targets, and milestones' },
    { id: 'maintenance-management', name: 'Maintenance Planning', icon: Wrench, description: 'Schedule preventive maintenance and track equipment health' },
    { id: 'ai-optimization', name: 'AI Optimization', icon: Bot, description: 'Leverage artificial intelligence for automated optimization and insights' },
  ];

  // Feature to data requirements mapping
  const featureDataRequirements = {
    'production-scheduling': ['plants', 'resources', 'capabilities', 'productionOrders', 'discreteOperations', 'processOperations', 'workCenters', 'routings'],
    'theory-of-constraints': ['resources', 'discreteOperations', 'processOperations', 'productionOrders'],
    'capacity-planning': ['resources', 'capabilities', 'plants', 'productionOrders', 'plannedOrders', 'discreteOperations', 'processOperations', 'workCenters', 'forecasts'],
    'inventory-optimization': ['items', 'inventory', 'inventoryLots', 'plants'], // storageLocations removed - replaced by ptwarehouses
    'production-planning': ['productionOrders', 'plannedOrders', 'resources', 'plants', 'discreteOperations', 'processOperations', 'workCenters'],
    'maintenance-management': ['resources', 'plants', 'users', 'employees', 'workCenters'],
    'ai-optimization': ['productionOrders', 'plannedOrders', 'resources', 'discreteOperations', 'processOperations', 'capabilities'],
    'resource-management': ['plants', 'resources', 'capabilities', 'workCenters', 'employees', 'plantResources'],
    'job-management': ['productionOrders', 'plannedOrders', 'resources', 'plants', 'discreteOperations', 'processOperations', 'workCenters'],
    'quality-management': ['resources', 'plants', 'productionOrders', 'discreteOperations', 'processOperations', 'employees', 'qualityTests', 'inspectionPlans', 'certificates'],
    'procurement': ['vendors', 'purchaseOrders', 'items', 'plants'], // storageLocations removed - replaced by ptwarehouses
    'sales-orders': ['customers', 'salesOrders', 'items', 'plants'],
    'user-management': ['users', 'employees', 'departments'],
    'analytics-reporting': ['plants', 'resources', 'productionOrders', 'plannedOrders', 'discreteOperations', 'processOperations', 'forecasts'],
    'bill-of-materials': ['billsOfMaterial', 'items', 'plants', 'routings', 'recipes', 'productionVersions'],
    'demand-planning': ['forecasts', 'items', 'customers', 'salesOrders', 'plannedOrders'],
    'transfer-management': ['inventory', 'items'] // transferOrders and storageLocations removed - replaced by PT tables
  };

  const [showConsolidatedDialog, setShowConsolidatedDialog] = useState(false);

  // File upload handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedImportDataType) return;

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
      let data: any[] = [];
      
      if (isCSV) {
        // Handle CSV files
        const text = await file.text();
        const lines = text.split('\n');
        if (lines.length < 2) {
          toast({
            title: "Invalid CSV file",
            description: "CSV file must have header row and at least one data row",
            variant: "destructive"
          });
          return;
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
        toast({
          title: "No data found",
          description: "The file doesn't contain any valid data rows",
          variant: "destructive"
        });
        return;
      }

      // Process the data for import
      await processImportData(data, selectedImportDataType);
      
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "File upload failed",
        description: "Error processing the file. Please check the format and try again.",
        variant: "destructive"
      });
    }
  };

  const processImportData = async (data: any[], dataType: string) => {
    try {
      setIsImporting(true);
      const authToken = localStorage.getItem('authToken');
      
      // Validate data size
      if (data.length > 50) {
        toast({
          title: "Import batch too large",
          description: `Maximum 50 records per batch. Current: ${data.length}. Please split your data into smaller batches.`,
          variant: "destructive"
        });
        return;
      }
      
      // Use the bulk import endpoint instead of individual calls
      const response = await fetch('/api/data-import/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: dataType,
          data: data
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${result.imported} records.${result.errors > 0 ? ` ${result.errors} failed.` : ''}`,
          variant: result.imported > 0 ? "default" : "destructive"
        });
        
        // Show error details if any
        if (result.importErrors && result.importErrors.length > 0) {
          console.warn('Import errors:', result.importErrors);
        }
      } else {
        throw new Error(result.message || 'Import failed');
      }
      
      // Clear the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Error importing data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getImportApiEndpoint = (dataType: string) => {
    const endpoints: Record<string, string> = {
      plants: 'plants',
      resources: 'resources', 
      capabilities: 'capabilities',
      productionOrders: 'production-orders',
      plannedOrders: 'planned-orders',
      discreteOperations: 'discrete-operations',
      processOperations: 'process-operations',
      plantResources: 'plant-resources',
      departments: 'departments',
      workCenters: 'work-centers',
      employees: 'employees',
      users: 'users',
      items: 'items',
      // storageLocations: DELETED - replaced by ptwarehouses
      inventory: 'inventory',
      inventoryLots: 'inventory-lots',
      vendors: 'vendors',
      customers: 'customers',
      salesOrders: 'sales-orders',
      purchaseOrders: 'purchase-orders',
      // transferOrders: DELETED - replaced by pttransferorders
      billsOfMaterial: 'bills-of-material',
      routings: 'routings',
      recipes: 'recipes',
      productionVersions: 'production-versions',
      forecasts: 'forecasts',
      qualityTests: 'quality-tests',
      inspectionPlans: 'inspection-plans',
      certificates: 'certificates'
    };
    return endpoints[dataType] || dataType;
  };

  const downloadTemplate = (dataType: string) => {
    if (!dataType) return;
    
    // Create CSV content based on data type
    const fields = getTemplateFieldDefinitions(dataType);
    const headers = fields.map(f => f.label).join(',');
    const sampleRow = fields.map(f => {
      switch (f.type) {
        case 'number': return '100';
        case 'date': return '2024-01-01';
        case 'select': return f.options?.[0] || 'Option1';
        case 'email': return 'example@company.com';
        default: return `Sample ${f.label}`;
      }
    }).join(',');
    
    const csvContent = `${headers}\n${sampleRow}`;
    
    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Function to download all templates as individual CSV files
  const downloadAllTemplates = () => {
    const templatesToDownload = selectedTemplates.size > 0 
      ? Array.from(selectedTemplates) 
      : supportedDataTypes.map(dt => dt.key);

    templatesToDownload.forEach((dataType, index) => {
      // Add a small delay between downloads to prevent browser blocking
      setTimeout(() => {
        downloadTemplate(dataType);
      }, index * 200);
    });

    toast({
      title: "Templates Downloaded",
      description: `${templatesToDownload.length} template files downloaded successfully`,
    });

    // Clear selection after download
    setSelectedTemplates(new Set());
  };

  // Toggle template selection
  const toggleTemplateSelection = (dataType: string) => {
    const newSelection = new Set(selectedTemplates);
    if (newSelection.has(dataType)) {
      newSelection.delete(dataType);
    } else {
      newSelection.add(dataType);
    }
    setSelectedTemplates(newSelection);
  };

  // Select all templates
  const selectAllTemplates = () => {
    setSelectedTemplates(new Set(supportedDataTypes.map(dt => dt.key)));
  };

  // Clear template selection
  const clearTemplateSelection = () => {
    setSelectedTemplates(new Set());
  };

  // Handle consolidated file upload
  const handleConsolidatedFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setConsolidatedFile(file);
      
      // Read the file to get sheet names
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetNames = workbook.SheetNames;
          setConsolidatedSheets(sheetNames);
          setSelectedSheets(new Set(sheetNames)); // Select all sheets by default
        } catch (error) {
          console.error('Error reading consolidated file:', error);
          toast({
            title: "File Error",
            description: "Could not read the Excel file. Please ensure it's a valid Excel file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Toggle sheet selection for consolidated import
  const toggleSheetSelection = (sheetName: string) => {
    const newSelection = new Set(selectedSheets);
    if (newSelection.has(sheetName)) {
      newSelection.delete(sheetName);
    } else {
      newSelection.add(sheetName);
    }
    setSelectedSheets(newSelection);
  };

  // Import consolidated template
  const importConsolidatedTemplate = async () => {
    if (!consolidatedFile || selectedSheets.size === 0) {
      toast({
        title: "Import Error",
        description: "Please select a file and at least one sheet to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    const statuses: ImportStatus[] = [];

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Process each selected sheet
          for (const sheetName of Array.from(selectedSheets)) {
            if (!workbook.Sheets[sheetName]) continue;

            try {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet);

              if (jsonData.length === 0) {
                statuses.push({
                  type: sheetName,
                  status: 'error',
                  message: 'No data found in sheet'
                });
                continue;
              }

              // Map sheet name to data type
              const dataType = mapSheetNameToDataType(sheetName);
              if (!dataType) {
                statuses.push({
                  type: sheetName,
                  status: 'error',
                  message: 'Unknown sheet type'
                });
                continue;
              }

              // Transform and validate data
              const transformedData = transformData(jsonData, dataType);

              // Import the data
              const response = await importMutation.mutateAsync({
                dataType,
                data: transformedData,
                validateOnly: false
              });

              statuses.push({
                type: sheetName,
                status: 'success',
                message: `Successfully imported ${transformedData.length} records`,
                count: transformedData.length
              });

            } catch (error) {
              console.error(`Error processing sheet ${sheetName}:`, error);
              statuses.push({
                type: sheetName,
                status: 'error',
                message: `Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
            }
          }

          setImportStatuses(statuses);
          
          // Show summary toast
          const successCount = statuses.filter(s => s.status === 'success').length;
          const totalCount = statuses.length;
          
          toast({
            title: "Consolidated Import Complete",
            description: `${successCount}/${totalCount} sheets imported successfully`,
            variant: successCount === totalCount ? "default" : "destructive",
          });

        } catch (error) {
          console.error('Error processing consolidated file:', error);
          toast({
            title: "Import Error",
            description: "Failed to process the consolidated file",
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsArrayBuffer(consolidatedFile);
    } catch (error) {
      console.error('Error reading file:', error);
      setIsImporting(false);
      toast({
        title: "File Error",
        description: "Could not read the file",
        variant: "destructive",
      });
    }
  };

  // Map sheet name to data type
  const mapSheetNameToDataType = (sheetName: string): string | null => {
    const mapping: Record<string, string> = {
      'Plants': 'plants',
      'Resources': 'resources',
      'Capabilities': 'capabilities',
      'Production Orders': 'productionOrders',
      'Planned Orders': 'plannedOrders',
      'Discrete Operations': 'discreteOperations',
      'Process Operations': 'processOperations',
      'Plant Resources': 'plantResources',
      'Departments': 'departments',
      'Work Centers': 'workCenters',
      'Employees': 'employees',
      'Users': 'users',
      'Items': 'items',
      'Storage Locations': 'storageLocations',
      'Inventory': 'inventory',
      'Inventory Lots': 'inventoryLots',
      'Vendors': 'vendors',
      'Customers': 'customers',
      'Sales Orders': 'salesOrders',
      'Purchase Orders': 'purchaseOrders',
      'Transfer Orders': 'transferOrders',
      'Bills of Material': 'billsOfMaterial',
      'Routings': 'routings',
      'Recipes': 'recipes',
      'Production Versions': 'productionVersions',
      'Forecasts': 'forecasts',
      'Quality Tests': 'qualityTests',
      'Inspection Plans': 'inspectionPlans',
      'Certificates': 'certificates'
    };
    return mapping[sheetName] || null;
  };

  const getTemplateFieldDefinitions = (selectedDataType: string) => {
    switch (selectedDataType) {
      case 'plants':
        return [
          { key: 'name', label: 'Plant Name', type: 'text', required: true },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'manager', label: 'Manager', type: 'text' },
          { key: 'capacity', label: 'Capacity', type: 'number' },
          { key: 'description', label: 'Description', type: 'text' }
        ];
      case 'resources':
        return [
          { key: 'name', label: 'Resource Name', type: 'text', required: true },
          { key: 'type', label: 'Type', type: 'select', options: ['Machine', 'Tool', 'Equipment', 'Workstation'] },
          { key: 'capacity', label: 'Capacity', type: 'number' },
          { key: 'location', label: 'Location', type: 'text' },
          { key: 'description', label: 'Description', type: 'text' }
        ];
      case 'capabilities':
        return [
          { key: 'name', label: 'Capability Name', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'text' },
          { key: 'category', label: 'Category', type: 'select', options: ['Manufacturing', 'Assembly', 'Quality Control', 'Packaging'] }
        ];
      case 'productionOrders':
        return [
          { key: 'orderNumber', label: 'Order Number', type: 'text', required: true },
          { key: 'name', label: 'Order Name', type: 'text', required: true },
          { key: 'quantity', label: 'Quantity', type: 'number', required: true },
          { key: 'plantId', label: 'Plant ID', type: 'number', required: true },
          { key: 'itemNumber', label: 'Item Number', type: 'text' },
          { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
          { key: 'status', label: 'Status', type: 'select', options: ['released', 'in_progress', 'completed', 'cancelled'] },
          { key: 'dueDate', label: 'Due Date', type: 'date' },
          { key: 'description', label: 'Description', type: 'text' }
        ];
      case 'plannedOrders':
        return [
          { key: 'orderNumber', label: 'Order Number', type: 'text', required: true },
          { key: 'name', label: 'Order Name', type: 'text', required: true },
          { key: 'itemId', label: 'Item ID', type: 'number', required: true },
          { key: 'quantity', label: 'Quantity', type: 'number', required: true },
          { key: 'plantId', label: 'Plant ID', type: 'number', required: true },
          { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
          { key: 'status', label: 'Status', type: 'select', options: ['planned', 'firmed', 'converted', 'cancelled'] },
          { key: 'dueDate', label: 'Due Date', type: 'date' },
          { key: 'plannedStartDate', label: 'Planned Start Date', type: 'date' },
          { key: 'plannedEndDate', label: 'Planned End Date', type: 'date' }
        ];
      case 'discreteOperations':
        return [
          { key: 'operationName', label: 'Operation Name', type: 'text', required: true },
          { key: 'productionOrderId', label: 'Production Order ID', type: 'number', required: true },
          { key: 'operationNumber', label: 'Operation Number', type: 'text', required: true },
          { key: 'workCenterId', label: 'Work Center ID', type: 'number' },
          { key: 'standardRunTime', label: 'Standard Run Time (min)', type: 'number' },
          { key: 'standardSetupTime', label: 'Standard Setup Time (min)', type: 'number' },
          { key: 'status', label: 'Status', type: 'select', options: ['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'] },
          { key: 'order', label: 'Order Sequence', type: 'number' }
        ];
      case 'processOperations':
        return [
          { key: 'operationName', label: 'Operation Name', type: 'text', required: true },
          { key: 'productionOrderId', label: 'Production Order ID', type: 'number', required: true },
          { key: 'phaseNumber', label: 'Phase Number', type: 'text', required: true },
          { key: 'standardDuration', label: 'Standard Duration (min)', type: 'number' },
          { key: 'temperature', label: 'Temperature (°C)', type: 'number' },
          { key: 'pressure', label: 'Pressure (bar)', type: 'number' },
          { key: 'status', label: 'Status', type: 'select', options: ['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'] },
          { key: 'order', label: 'Order Sequence', type: 'number' }
        ];
      case 'plantResources':
        return [
          { key: 'plantId', label: 'Plant ID', type: 'number', required: true },
          { key: 'resourceId', label: 'Resource ID', type: 'number', required: true },
          { key: 'isPrimary', label: 'Primary Plant', type: 'select', options: ['true', 'false'] }
        ];
      case 'productionVersions':
        return [
          { key: 'versionNumber', label: 'Version Number', type: 'text', required: true },
          { key: 'itemNumber', label: 'Item Number', type: 'text', required: true },
          { key: 'plantId', label: 'Plant ID', type: 'number', required: true },
          { key: 'validPlants', label: 'Valid Plants (comma-separated IDs)', type: 'text', required: true },
          { key: 'mrpRelevant', label: 'MRP Relevant', type: 'select', options: ['true', 'false'], required: true },
          { key: 'validFrom', label: 'Valid From', type: 'date', required: true },
          { key: 'validTo', label: 'Valid To', type: 'date' },
          { key: 'lotSizeMin', label: 'Minimum Lot Size', type: 'number', required: true },
          { key: 'lotSizeMax', label: 'Maximum Lot Size', type: 'number', required: true },
          { key: 'standardLotSize', label: 'Standard Lot Size', type: 'number', required: true }
        ];
      default:
        return [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'text' }
        ];
    }
  };

  // Structured Entry Component
  function StructuredEntryComponent() {
    const [selectedDataType, setSelectedDataType] = useState<string>('');
    const [entries, setEntries] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addRow = () => {
      const newEntry = getEmptyEntry(selectedDataType);
      setEntries([...entries, newEntry]);
    };

    const removeRow = (index: number) => {
      setEntries(entries.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, field: string, value: any) => {
      const newEntries = [...entries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      setEntries(newEntries);
    };

    const getEmptyEntry = (dataType: string) => {
      switch (dataType) {
        case 'resources':
          return { name: '', type: '', description: '', location: '', capacity: '' };
        case 'plants':
          return { name: '', location: '', timezone: '', description: '' };
        case 'capabilities':
          return { name: '', description: '', category: '' };
        case 'productionOrders':
          return { orderNumber: '', name: '', priority: '', dueDate: '', description: '' };
        case 'operations':
          return { name: '', description: '', duration: '', sequence: '', status: '' };
        case 'departments':
          return { name: '', code: '', manager: '', description: '' };
        case 'workCenters':
          return { name: '', code: '', department: '', capacity: '', description: '' };
        case 'employees':
          return { firstName: '', lastName: '', email: '', department: '', position: '' };
        case 'users':
          return { username: '', email: '', role: '', firstName: '', lastName: '' };
        case 'items':
          return { itemCode: '', name: '', category: '', unitOfMeasure: '', description: '' };
        case 'storageLocations':
          return { name: '', code: '', type: '', capacity: '', description: '' };
        case 'inventory':
          return { itemCode: '', location: '', quantity: '', unitCost: '', lastUpdated: '' };
        case 'inventoryLots':
          return { lotNumber: '', itemCode: '', quantity: '', expirationDate: '', location: '' };
        case 'vendors':
          return { vendorName: '', contactPerson: '', email: '', phone: '', address: '' };
        case 'customers':
          return { customerName: '', contactPerson: '', email: '', phone: '', address: '' };
        case 'salesOrders':
          return { orderNumber: '', customerName: '', orderDate: '', deliveryDate: '', status: '' };
        case 'purchaseOrders':
          return { orderNumber: '', vendorName: '', orderDate: '', deliveryDate: '', status: '' };
        case 'transferOrders':
          return { orderNumber: '', fromLocation: '', toLocation: '', transferDate: '', status: '' };
        case 'billsOfMaterial':
          return { bomNumber: '', parentItem: '', componentItem: '', quantity: '', unitOfMeasure: '' };
        case 'routings':
          return { routingNumber: '', itemCode: '', operationSequence: '', workCenter: '', setupTime: '' };
        case 'forecasts':
          return { itemCode: '', period: '', forecastQuantity: '', actualDemand: '', accuracy: '' };
        case 'recipes':
          return { recipeNumber: '', productCode: '', version: '', batchSize: '', yield: '' };
        case 'productionVersions':
          return { versionNumber: '', itemNumber: '', plantId: '', validPlants: '', mrpRelevant: 'true', validFrom: '', validTo: '', lotSizeMin: '1', lotSizeMax: '1000', standardLotSize: '100', description: '' };
        case 'plannedOrders':
          return { orderNumber: '', name: '', itemId: '', quantity: '', plantId: '', priority: 'medium', status: 'planned', dueDate: '', plannedStartDate: '', plannedEndDate: '' };
        case 'discreteOperations':
          return { operationName: '', productionOrderId: '', routingId: '', operationNumber: '', workCenterId: '', standardRunTime: '', standardSetupTime: '', status: 'not_started', order: '' };
        case 'processOperations':
          return { operationName: '', productionOrderId: '', recipeId: '', phaseNumber: '', standardDuration: '', temperature: '', pressure: '', status: 'not_started', order: '' };
        case 'plantResources':
          return { plantId: '', resourceId: '', isPrimary: 'true' };
        case 'qualityTests':
          return { testName: '', testType: 'chemical', description: '', procedure: '', acceptanceCriteria: '' };
        case 'inspectionPlans':
          return { planName: '', itemNumber: '', inspectionType: 'incoming', sampleSize: '', frequency: '' };
        case 'certificates':
          return { certificateNumber: '', certificateType: 'quality', issuedBy: '', validFrom: '', validTo: '', description: '' };
        default:
          return { name: '', description: '' };
      }
    };

    const getFieldDefinitions = (dataType: string) => {
      switch (dataType) {
        case 'resources':
          return [
            { key: 'name', label: 'Resource Name', type: 'text', required: true },
            { key: 'type', label: 'Type', type: 'select', options: ['Machine', 'Personnel', 'Equipment'], required: true },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'capacity', label: 'Capacity', type: 'number' }
          ];
        case 'plants':
          return [
            { key: 'name', label: 'Plant Name', type: 'text', required: true },
            { key: 'location', label: 'Location', type: 'text', required: true },
            { key: 'timezone', label: 'Timezone', type: 'text' },
            { key: 'description', label: 'Description', type: 'text' }
          ];
        case 'capabilities':
          return [
            { key: 'name', label: 'Capability Name', type: 'text', required: true },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' }
          ];
        case 'productionOrders':
          return [
            { key: 'orderNumber', label: 'Order Number', type: 'text', required: true },
            { key: 'name', label: 'Order Name', type: 'text', required: true },
            { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
            { key: 'dueDate', label: 'Due Date', type: 'date' },
            { key: 'description', label: 'Description', type: 'text' }
          ];
        case 'operations':
          return [
            { key: 'name', label: 'Operation Name', type: 'text', required: true },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'duration', label: 'Duration (minutes)', type: 'number' },
            { key: 'sequence', label: 'Sequence', type: 'number' },
            { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Completed', 'On Hold'] }
          ];
        case 'departments':
          return [
            { key: 'name', label: 'Department Name', type: 'text', required: true },
            { key: 'code', label: 'Department Code', type: 'text' },
            { key: 'manager', label: 'Manager', type: 'text' },
            { key: 'description', label: 'Description', type: 'text' }
          ];
        case 'workCenters':
          return [
            { key: 'name', label: 'Work Center Name', type: 'text', required: true },
            { key: 'code', label: 'Work Center Code', type: 'text' },
            { key: 'department', label: 'Department', type: 'text' },
            { key: 'capacity', label: 'Capacity', type: 'number' },
            { key: 'description', label: 'Description', type: 'text' }
          ];
        case 'employees':
          return [
            { key: 'firstName', label: 'First Name', type: 'text', required: true },
            { key: 'lastName', label: 'Last Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'department', label: 'Department', type: 'text' },
            { key: 'position', label: 'Position', type: 'text' }
          ];
        case 'users':
          return [
            { key: 'username', label: 'Username', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'role', label: 'Role', type: 'select', options: ['Admin', 'Manager', 'Operator', 'Viewer'] },
            { key: 'firstName', label: 'First Name', type: 'text' },
            { key: 'lastName', label: 'Last Name', type: 'text' }
          ];
        case 'items':
          return [
            { key: 'itemCode', label: 'Item Code', type: 'text', required: true },
            { key: 'name', label: 'Item Name', type: 'text', required: true },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'unitOfMeasure', label: 'Unit of Measure', type: 'select', options: ['Each', 'Pound', 'Kilogram', 'Liter', 'Gallon', 'Meter', 'Foot'] },
            { key: 'description', label: 'Description', type: 'text' }
          ];
        case 'storageLocations':
          return [
            { key: 'name', label: 'Location Name', type: 'text', required: true },
            { key: 'code', label: 'Location Code', type: 'text' },
            { key: 'type', label: 'Location Type', type: 'select', options: ['Warehouse', 'Storage Room', 'Outdoor Yard', 'Cold Storage'] },
            { key: 'capacity', label: 'Capacity', type: 'number' },
            { key: 'description', label: 'Description', type: 'text' }
          ];
        case 'inventory':
          return [
            { key: 'itemCode', label: 'Item Code', type: 'text', required: true },
            { key: 'location', label: 'Storage Location', type: 'text', required: true },
            { key: 'quantity', label: 'Quantity', type: 'number', required: true },
            { key: 'unitCost', label: 'Unit Cost', type: 'number' },
            { key: 'lastUpdated', label: 'Last Updated', type: 'date' }
          ];
        case 'inventoryLots':
          return [
            { key: 'lotNumber', label: 'Lot Number', type: 'text', required: true },
            { key: 'itemCode', label: 'Item Code', type: 'text', required: true },
            { key: 'quantity', label: 'Quantity', type: 'number', required: true },
            { key: 'expirationDate', label: 'Expiration Date', type: 'date' },
            { key: 'location', label: 'Storage Location', type: 'text' }
          ];
        case 'vendors':
          return [
            { key: 'vendorName', label: 'Vendor Name', type: 'text', required: true },
            { key: 'contactPerson', label: 'Contact Person', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'Phone', type: 'text' },
            { key: 'address', label: 'Address', type: 'text' }
          ];
        case 'customers':
          return [
            { key: 'customerName', label: 'Customer Name', type: 'text', required: true },
            { key: 'contactPerson', label: 'Contact Person', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'Phone', type: 'text' },
            { key: 'address', label: 'Address', type: 'text' }
          ];
        case 'salesOrders':
          return [
            { key: 'orderNumber', label: 'Order Number', type: 'text', required: true },
            { key: 'customerName', label: 'Customer', type: 'text', required: true },
            { key: 'orderDate', label: 'Order Date', type: 'date' },
            { key: 'deliveryDate', label: 'Delivery Date', type: 'date' },
            { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Confirmed', 'In Production', 'Shipped', 'Delivered', 'Cancelled'] }
          ];
        case 'purchaseOrders':
          return [
            { key: 'orderNumber', label: 'PO Number', type: 'text', required: true },
            { key: 'vendorName', label: 'Vendor', type: 'text', required: true },
            { key: 'orderDate', label: 'Order Date', type: 'date' },
            { key: 'deliveryDate', label: 'Expected Delivery', type: 'date' },
            { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Acknowledged', 'Shipped', 'Received', 'Cancelled'] }
          ];
        case 'transferOrders':
          return [
            { key: 'orderNumber', label: 'Transfer Number', type: 'text', required: true },
            { key: 'fromLocation', label: 'From Location', type: 'text', required: true },
            { key: 'toLocation', label: 'To Location', type: 'text', required: true },
            { key: 'transferDate', label: 'Transfer Date', type: 'date' },
            { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'In Transit', 'Completed', 'Cancelled'] }
          ];
        case 'billsOfMaterial':
          return [
            { key: 'bomNumber', label: 'BOM Number', type: 'text', required: true },
            { key: 'parentItem', label: 'Parent Item', type: 'text', required: true },
            { key: 'componentItem', label: 'Component Item', type: 'text', required: true },
            { key: 'quantity', label: 'Quantity', type: 'number', required: true },
            { key: 'unitOfMeasure', label: 'Unit of Measure', type: 'select', options: ['Each', 'Pound', 'Kilogram', 'Liter', 'Gallon'] }
          ];
        case 'routings':
          return [
            { key: 'routingNumber', label: 'Routing Number', type: 'text', required: true },
            { key: 'itemCode', label: 'Item Code', type: 'text', required: true },
            { key: 'operationSequence', label: 'Operation Sequence', type: 'number', required: true },
            { key: 'workCenter', label: 'Work Center', type: 'text' },
            { key: 'setupTime', label: 'Setup Time (min)', type: 'number' }
          ];
        case 'forecasts':
          return [
            { key: 'itemCode', label: 'Item Code', type: 'text', required: true },
            { key: 'period', label: 'Period', type: 'text', required: true },
            { key: 'forecastQuantity', label: 'Forecast Quantity', type: 'number', required: true },
            { key: 'actualDemand', label: 'Actual Demand', type: 'number' },
            { key: 'accuracy', label: 'Accuracy %', type: 'number' }
          ];
        case 'qualityTests':
          return [
            { key: 'testName', label: 'Test Name', type: 'text', required: true },
            { key: 'testType', label: 'Test Type', type: 'select', options: ['chemical', 'physical', 'microbiological', 'sensory'] },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'procedure', label: 'Test Procedure', type: 'text' },
            { key: 'acceptanceCriteria', label: 'Acceptance Criteria', type: 'text' }
          ];
        case 'inspectionPlans':
          return [
            { key: 'planName', label: 'Plan Name', type: 'text', required: true },
            { key: 'itemNumber', label: 'Item Number', type: 'text', required: true },
            { key: 'inspectionType', label: 'Inspection Type', type: 'select', options: ['incoming', 'in_process', 'final', 'patrol'] },
            { key: 'sampleSize', label: 'Sample Size', type: 'number' },
            { key: 'frequency', label: 'Frequency', type: 'text' }
          ];
        case 'certificates':
          return [
            { key: 'certificateNumber', label: 'Certificate Number', type: 'text', required: true },
            { key: 'certificateType', label: 'Type', type: 'select', options: ['quality', 'compliance', 'safety', 'environmental'] },
            { key: 'issuedBy', label: 'Issued By', type: 'text', required: true },
            { key: 'validFrom', label: 'Valid From', type: 'date' },
            { key: 'validTo', label: 'Valid To', type: 'date' },
            { key: 'description', label: 'Description', type: 'text' }
          ];
        case 'recipes':
          return [
            { key: 'recipeNumber', label: 'Recipe Number', type: 'text', required: true },
            { key: 'productCode', label: 'Product Code', type: 'text', required: true },
            { key: 'version', label: 'Version', type: 'text', required: true },
            { key: 'batchSize', label: 'Batch Size', type: 'number', required: true },
            { key: 'yield', label: 'Expected Yield %', type: 'number' },
            { key: 'description', label: 'Description', type: 'text' }
          ];
        default:
          return [
            { key: 'name', label: 'Name', type: 'text', required: true },
            { key: 'description', label: 'Description', type: 'text' }
          ];
      }
    };

    const getApiEndpoint = (dataType: string) => {
      const endpoints: Record<string, string> = {
        plants: 'plants',
        resources: 'resources', 
        capabilities: 'capabilities',
        productionOrders: 'production-orders',
        operations: 'operations',
        departments: 'departments',
        workCenters: 'work-centers',
        employees: 'employees',
        users: 'users',
        items: 'items',
        storageLocations: 'storage-locations',
        inventory: 'inventory',
        inventoryLots: 'inventory-lots',
        vendors: 'vendors',
        customers: 'customers',
        salesOrders: 'sales-orders',
        purchaseOrders: 'purchase-orders',
        transferOrders: 'transfer-orders',
        billsOfMaterial: 'bills-of-material',
        routings: 'routings',
        recipes: 'recipes',
        productionVersions: 'production-versions',
        forecasts: 'forecasts'
      };
      return endpoints[dataType] || dataType;
    };

    const submitEntries = async () => {
      if (!selectedDataType || entries.length === 0) return;
      
      setIsSubmitting(true);
      try {
        const authToken = localStorage.getItem('authToken');
        const endpoint = getApiEndpoint(selectedDataType);
        
        for (const entry of entries) {
          await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(entry)
          });
        }
        
        toast({ title: "Success", description: `${entries.length} ${selectedDataType} entries created successfully` });
        setEntries([]);
      } catch (error) {
        toast({ title: "Error", description: "Failed to save entries", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    };

    const fields = getFieldDefinitions(selectedDataType);

    return (
      <div className="space-y-4">
        {/* Data Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Select Data Type</Label>
            <Select value={selectedDataType} onValueChange={(value) => {
              setSelectedDataType(value);
              setEntries([]);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose data type to enter" />
              </SelectTrigger>
              <SelectContent>
                {/* Group data types by category */}
                {['Core Manufacturing', 'Organization', 'Products & Inventory', 'Business Partners', 'Sales & Orders', 'Manufacturing Planning'].map((category) => {
                  const categoryTypes = supportedDataTypes.filter(dt => dt.category === category);
                  return (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b bg-gray-50 dark:bg-gray-800/50">
                        {category}
                      </div>
                      {categoryTypes.map((dataType) => (
                        <SelectItem key={dataType.key} value={dataType.key}>
                          {dataType.label}
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button 
              variant="outline" 
              onClick={addRow}
              disabled={!selectedDataType}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            {entries.length > 0 && (
              <Button onClick={submitEntries} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Save All
              </Button>
            )}
          </div>
        </div>

        {/* Spreadsheet Interface */}
        {selectedDataType && (
          <div className="border rounded-lg overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {fields.map(field => (
                      <TableHead key={field.key}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </TableHead>
                    ))}
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={index}>
                      {fields.map(field => (
                        <TableCell key={field.key}>
                          {field.type === 'select' ? (
                            <Select 
                              value={entry[field.key] || ''} 
                              onValueChange={(value) => updateEntry(index, field.key, value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map(option => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <input
                              type={field.type}
                              value={entry[field.key] || ''}
                              onChange={(e) => updateEntry(index, field.key, e.target.value)}
                              className="w-full h-8 px-2 border rounded text-sm"
                              placeholder={field.label}
                            />
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4 p-4">
              {entries.map((entry, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Entry #{index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {fields.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-sm">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === 'select' ? (
                        <Select 
                          value={entry[field.key] || ''} 
                          onValueChange={(value) => updateEntry(index, field.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <input
                          type={field.type}
                          value={entry[field.key] || ''}
                          onChange={(e) => updateEntry(index, field.key, e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder={field.label}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {entries.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Grid3X3 className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Click "Add Row" to start entering {selectedDataType || 'data'}</p>
              </div>
            )}
          </div>
        )}

        {/* Data Type Not Selected */}
        {!selectedDataType && (
          <div className="border rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
            <ClipboardList className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Select a data type above to start entering data</p>
          </div>
        )}
      </div>
    );
  }
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMaxOpen } = useMaxDock();

  // Fetch available capabilities for dropdown
  const { data: capabilities = [] } = useQuery({
    queryKey: ['/api/capabilities'],
    enabled: true
  });

  // Fetch user preferences
  const { data: userPreferences } = useQuery({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch onboarding data to get selected features
  const { data: onboardingData, isLoading: onboardingLoading, error: onboardingError } = useQuery({
    queryKey: ['/api/onboarding/status'],
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Calculate recommended data types based on selected features
  const calculateRecommendedDataTypes = useCallback((features: string[]) => {
    const recommendedTypes = new Set<string>();
    features.forEach((feature: string) => {
      const requirements = featureDataRequirements[feature as keyof typeof featureDataRequirements];
      if (requirements) {
        requirements.forEach(type => recommendedTypes.add(type));
      }
    });
    setRecommendedDataTypes(Array.from(recommendedTypes));
  }, []);

  // Transform data function for import processing
  const transformData = (jsonData: any[], dataType: string) => {
    // Basic data transformation - adjust field names if needed
    return jsonData;
  };

  // Import mutation for data import
  const importMutation = useMutation({
    mutationFn: async ({ dataType, data, validateOnly }: { dataType: string; data: any[]; validateOnly: boolean }) => {
      const endpoint = getImportApiEndpoint(dataType);
      return await apiRequest('POST', `/api/${endpoint}/import`, { data, validateOnly });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-management'] });
    },
    onError: (error: any) => {
      console.error('Import failed:', error);
    }
  });

  // Load recommended data types from onboarding features
  useEffect(() => {
    // Only run once, and only if onboardingData actually exists
    if (onboardingData && typeof onboardingData === 'object' && 'selectedFeatures' in onboardingData && (onboardingData as any).selectedFeatures) {
      const features = (onboardingData as any).selectedFeatures;
      setOnboardingFeatures(features);
      calculateRecommendedDataTypes(features);
      console.log('Recommended data types based on features:', features);
    }
    // Don't run if onboardingData is null - just ignore it
  }, [onboardingData]); // Removed calculateRecommendedDataTypes from dependencies

  const handleGenerateAISampleData = () => {
    const companyInfo = (userPreferences as any)?.companyInfo || null;
    if (companyInfo) {
      // Build AI prompt with company information
      const prompt = `Generate realistic sample data for ${companyInfo.name}, a ${companyInfo.size} ${companyInfo.industry} company with ${companyInfo.numberOfPlants || '3'} manufacturing plants. 
      
Company Details:
- Industry: ${companyInfo.industry}
- Size: ${companyInfo.size}
- Plants: ${companyInfo.numberOfPlants || '3'}
${companyInfo.website ? `- Website: ${companyInfo.website}` : ''}
${companyInfo.products ? `- Products: ${companyInfo.products}` : ''}
${companyInfo.description ? `- Description: ${companyInfo.description}` : ''}

Create authentic manufacturing data that reflects this company's operations.`;

      setAiPrompt(prompt);
    }
    setShowAIDialog(true);
  };

  // AI Generation Mutation
  const aiGenerationMutation = useMutation({
    mutationFn: async (generationData: any) => {
      const response = await fetch('/api/master-data/bulk-generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(generationData)
      });
      if (!response.ok) throw new Error('Failed to generate AI sample data');
      return await response.json();
    },
    onSuccess: (result) => {
      setAiGenerationResult(result);
      setShowAIDialog(false);
      setShowAISummary(true);
      queryClient.invalidateQueries({ queryKey: ['/api/data-management'] });
      toast({ 
        title: "AI Generation Complete", 
        description: `Generated ${result.totalRecords || 0} records across ${result.importResults?.length || 0} data types` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "AI Generation Failed", 
        description: error.message || "Failed to generate sample data",
        variant: "destructive" 
      });
    }
  });

  // AI Modify Mutation
  const aiModifyMutation = useMutation({
    mutationFn: async (modifyData: any) => {
      const response = await fetch('/api/data-import/modify-data', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(modifyData)
      });
      if (!response.ok) throw new Error('Failed to modify data with AI');
      return await response.json();
    },
    onSuccess: (result) => {
      setAiModifyResult(result);
      setShowAIModifyDialog(false);
      setShowAIModifySummary(true);
      queryClient.invalidateQueries({ queryKey: ['/api/data-management'] });
      toast({ 
        title: "AI Modification Complete", 
        description: `Modified ${result.affectedRecords || 0} records` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "AI Modification Failed", 
        description: error.message || "Failed to modify data",
        variant: "destructive" 
      });
    }
  });

  // Feature update mutation
  const updateFeaturesMutation = useMutation({
    mutationFn: async (features: string[]) => {
      // Get the onboarding ID from the onboarding status
      const statusResponse = await apiRequest('GET', '/api/onboarding/status');
      if (!statusResponse || typeof statusResponse !== 'object' || !('id' in statusResponse)) {
        throw new Error('No onboarding record found');
      }
      
      return await apiRequest('PUT', `/api/onboarding/company/${(statusResponse as any).id}`, { 
        selectedFeatures: features 
      });
    },
    onSuccess: () => {
      setOnboardingFeatures(tempSelectedFeatures);
      calculateRecommendedDataTypes(tempSelectedFeatures);
      setShowFeatureDialog(false);
      toast({
        title: "Features Updated",
        description: "Your feature selections have been updated successfully",
      });
      // Refetch onboarding status to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/status'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update feature selections",
        variant: "destructive"
      });
    }
  });

  const executeAIGeneration = () => {
    // Get company info from user preferences
    const companyInfo = (userPreferences as any)?.companyInfo || {};
    
    const generationData = {
      prompt: aiPrompt,
      companyInfo: companyInfo,
      selectedDataTypes: selectedDataTypes.length > 0 ? selectedDataTypes : recommendedDataTypes,
      sampleSize: aiSampleSize,
      deleteExistingData: deleteExistingData
    };
    aiGenerationMutation.mutate(generationData);
  };

  const executeAIModification = () => {
    const modifyData = {
      prompt: aiModifyPrompt,
      selectedDataTypes: [selectedManageDataType]
    };
    aiModifyMutation.mutate(modifyData);
  };

  // Feature selection handlers
  const handleFeatureToggle = (featureId: string) => {
    setTempSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const openFeatureDialog = () => {
    setTempSelectedFeatures([...onboardingFeatures]);
    setShowFeatureDialog(true);
  };

  const saveFeatureSelection = () => {
    updateFeaturesMutation.mutate(tempSelectedFeatures);
  };

  // Comprehensive list of all master data types organized by category
  const supportedDataTypes = [
    // Core Manufacturing
    { key: 'plants', label: 'Plants', icon: Building, description: 'Manufacturing facilities and locations', category: 'Core Manufacturing' },
    { key: 'resources', label: 'Resources', icon: Wrench, description: 'Equipment, machinery, and personnel', category: 'Core Manufacturing' },
    { key: 'capabilities', label: 'Capabilities', icon: Database, description: 'Skills and machine capabilities', category: 'Core Manufacturing' },
    { key: 'discreteOperations', label: 'Discrete Operations', icon: Cog, description: 'Manufacturing operations for discrete products', category: 'Core Manufacturing' },
    { key: 'processOperations', label: 'Process Operations', icon: Beaker, description: 'Manufacturing operations for process industries', category: 'Core Manufacturing' },
    { key: 'plantResources', label: 'Plant-Resource Links', icon: ArrowRightLeft, description: 'Links between plants and resources', category: 'Core Manufacturing' },
    
    // Organization
    { key: 'departments', label: 'Departments', icon: Building2, description: 'Organizational departments and divisions', category: 'Organization' },
    { key: 'workCenters', label: 'Work Centers', icon: Factory, description: 'Production work centers and stations', category: 'Organization' },
    { key: 'employees', label: 'Employees', icon: UserCheck, description: 'Staff and personnel information', category: 'Organization' },
    { key: 'users', label: 'Users', icon: Users, description: 'System users and access accounts', category: 'Organization' },
    
    // Products & Inventory
    { key: 'items', label: 'Items', icon: Package, description: 'Products, materials, and inventory items', category: 'Products & Inventory' },
    { key: 'storageLocations', label: 'Storage Locations', icon: Warehouse, description: 'Warehouses and storage locations', category: 'Products & Inventory' },
    { key: 'inventory', label: 'Inventory', icon: Package2, description: 'Current inventory levels and stock', category: 'Products & Inventory' },
    { key: 'inventoryLots', label: 'Inventory Lots', icon: Hash, description: 'Inventory lot tracking and batches', category: 'Products & Inventory' },
    
    // Business Partners
    { key: 'vendors', label: 'Vendors', icon: Building2, description: 'Suppliers and vendor information', category: 'Business Partners' },
    { key: 'customers', label: 'Customers', icon: Users, description: 'Customer accounts and information', category: 'Business Partners' },
    
    // Production & Orders
    { key: 'productionOrders', label: 'Production Orders', icon: Briefcase, description: 'Firm production orders for manufacturing', category: 'Production & Orders' },
    { key: 'plannedOrders', label: 'Planned Orders', icon: Calendar, description: 'Future production suggestions from MRP', category: 'Production & Orders' },
    { key: 'salesOrders', label: 'Sales Orders', icon: ShoppingCart, description: 'Customer sales orders and requests', category: 'Production & Orders' },
    { key: 'purchaseOrders', label: 'Purchase Orders', icon: FileText, description: 'Supplier purchase orders', category: 'Production & Orders' },
    { key: 'transferOrders', label: 'Transfer Orders', icon: ArrowLeftRight, description: 'Inter-location transfer orders', category: 'Production & Orders' },
    
    // Manufacturing Planning
    { key: 'billsOfMaterial', label: 'Bills of Material', icon: List, description: 'Product structure and component lists', category: 'Manufacturing Planning' },
    { key: 'routings', label: 'Routings', icon: Route, description: 'Manufacturing process routings', category: 'Manufacturing Planning' },
    { key: 'recipes', label: 'Recipes', icon: Beaker, description: 'Process manufacturing recipes and formulations', category: 'Manufacturing Planning' },
    { key: 'productionVersions', label: 'Production Versions', icon: Settings, description: 'Links BOMs/recipes with routings and defines material consumption per operation', category: 'Manufacturing Planning' },
    { key: 'forecasts', label: 'Forecasts', icon: TrendingUp, description: 'Demand forecasts and planning data', category: 'Manufacturing Planning' },
    
    // Quality & Compliance
    { key: 'qualityTests', label: 'Quality Tests', icon: CheckCircle, description: 'Quality control tests and procedures', category: 'Quality & Compliance' },
    { key: 'inspectionPlans', label: 'Inspection Plans', icon: ClipboardList, description: 'Quality inspection procedures', category: 'Quality & Compliance' },
    { key: 'certificates', label: 'Certificates', icon: Shield, description: 'Quality certificates and compliance documents', category: 'Quality & Compliance' }
  ];

  // Record counts state
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});

  // Fetch record counts for all supported data types (async, doesn't block render)
  const { data: recordCountsData } = useQuery({
    queryKey: ['/api/data-management/record-counts'],
    // Use default fetcher which handles authentication automatically
    staleTime: 30000, // Cache for 30 seconds
    enabled: !!user // Only fetch when user is available
  });

  // Update record counts when data is fetched
  React.useEffect(() => {
    if (recordCountsData) {
      const mappedCounts: Record<string, number> = {};
      const data = recordCountsData as Record<string, number>;
      // Map backend table names to frontend keys
      mappedCounts.plants = data.plants || 0;
      mappedCounts.resources = data.resources || 0;
      mappedCounts.capabilities = data.capabilities || 0;
      mappedCounts.productionOrders = data.production_orders || 0;
      mappedCounts.plannedOrders = data.planned_orders || 0;
      mappedCounts.discreteOperations = data.discrete_operations || 0;
      mappedCounts.processOperations = data.process_operations || 0;
      mappedCounts.plantResources = data.plant_resources || 0;
      mappedCounts.departments = data.departments || 0;
      mappedCounts.workCenters = data.work_centers || 0;
      mappedCounts.employees = data.employees || 0;
      mappedCounts.users = data.users || 0;
      mappedCounts.items = data.items || 0;
      // mappedCounts.storageLocations: DELETED - storageLocations table was replaced by ptwarehouses
      mappedCounts.inventory = data.inventory || 0;
      mappedCounts.inventoryLots = data.inventory_lots || 0;
      mappedCounts.vendors = data.vendors || 0;
      mappedCounts.customers = data.customers || 0;
      mappedCounts.salesOrders = data.sales_orders || 0;
      mappedCounts.purchaseOrders = data.purchase_orders || 0;
      // mappedCounts.transferOrders: DELETED - transferOrders table was replaced by pttransferorders
      mappedCounts.billsOfMaterial = data.bills_of_material || 0;
      mappedCounts.routings = data.routings || 0;
      mappedCounts.recipes = data.recipes || 0;
      mappedCounts.productionVersions = data.production_versions || 0;
      mappedCounts.forecasts = data.forecasts || 0;
      mappedCounts.qualityTests = data.quality_tests || 0;
      mappedCounts.inspectionPlans = data.inspection_plans || 0;
      mappedCounts.certificates = data.certificates || 0;
      setRecordCounts(mappedCounts);
    }
  }, [recordCountsData]);

  // Helper functions
  const getApiEndpoint = (dataType: string): string => {
    const endpoints: Record<string, string> = {
      plants: 'plants',
      resources: 'resources', 
      capabilities: 'capabilities',
      productionOrders: 'production-orders',
      operations: 'operations',
      plannedOrders: 'planned-orders',
      users: 'users',
      vendors: 'vendors',
      customers: 'customers',
      departments: 'departments',
      workCenters: 'work-centers',
      employees: 'employees',
      items: 'items',
      // storageLocations: DELETED - replaced by ptwarehouses
      inventory: 'inventory',
      inventoryLots: 'inventory-lots',
      salesOrders: 'sales-orders',
      purchaseOrders: 'purchase-orders',
      // transferOrders: DELETED - replaced by pttransferorders
      billsOfMaterial: 'bills-of-material',
      routings: 'routings',
      recipes: 'recipes',
      forecasts: 'forecasts'
    };
    return endpoints[dataType] || dataType;
  };

  const getTableName = (dataType: string): string => {
    const tableNames: Record<string, string> = {
      plants: 'plants',
      resources: 'resources',
      capabilities: 'capabilities', 
      productionOrders: 'production_orders',
      operations: 'operations',
      plannedOrders: 'planned_orders',
      users: 'users',
      vendors: 'vendors',
      customers: 'customers',
      departments: 'departments',
      workCenters: 'work_centers',
      employees: 'employees',
      items: 'items',
      // storageLocations: DELETED - replaced by ptwarehouses
      inventory: 'inventory',
      inventoryLots: 'inventory_lots',
      salesOrders: 'sales_orders',
      purchaseOrders: 'purchase_orders',
      // transferOrders: DELETED - replaced by pttransferorders
      billsOfMaterial: 'bills_of_material',
      routings: 'routings',
      recipes: 'recipes',
      productionVersions: 'production_versions',
      forecasts: 'forecasts'
    };
    return tableNames[dataType] || dataType;
  };

  const getItemDetails = (item: any, dataType: string): string => {
    if (!item) return '';
    
    switch (dataType) {
      case 'plants':
        return `${item.location || ''} • ${item.timezone || ''}`;
      case 'resources':
        return `Type: ${item.type || ''} • Plant: ${item.plantId || ''}`;
      case 'capabilities':
        return item.description || '';
      case 'productionOrders':
        return `Priority: ${item.priority || ''} • Due: ${item.dueDate || ''}`;
      case 'operations':
        return `Duration: ${item.duration || ''}min • Status: ${item.status || ''}`;
      case 'plannedOrders':
        return `Quantity: ${item.quantity || ''} • Plan Date: ${item.plannedDate || ''}`;
      case 'users':
        return `Role: ${item.role || ''} • ${item.email || ''}`;
      case 'vendors':
        return `Contact: ${item.contactPerson || ''} • ${item.email || ''}`;
      case 'customers':
        return `Tier: ${item.tier || ''} • ${item.email || ''}`;
      case 'departments':
        return `Manager: ${item.manager || ''} • Code: ${item.code || ''}`;
      case 'workCenters':
        return `Capacity: ${item.capacity || ''} • Department: ${item.departmentId || ''}`;
      case 'employees':
        return `Role: ${item.role || ''} • Department: ${item.departmentId || ''}`;
      case 'items':
        return `Type: ${item.type || ''} • Unit: ${item.unit || ''}`;
      case 'storageLocations':
        return `Type: ${item.type || ''} • Capacity: ${item.capacity || ''}`;
      case 'inventory':
        return `Quantity: ${item.quantity || ''} • Location: ${item.locationId || ''}`;
      case 'inventoryLots':
        return `Lot: ${item.lotNumber || ''} • Expiry: ${item.expiryDate || ''}`;
      case 'salesOrders':
        return `Customer: ${item.customerId || ''} • Total: ${item.total || ''}`;
      case 'purchaseOrders':
        return `Vendor: ${item.vendorId || ''} • Total: ${item.total || ''}`;
      case 'transferOrders':
        return `From: ${item.fromLocation || ''} • To: ${item.toLocation || ''}`;
      case 'billsOfMaterial':
        return `Version: ${item.version || ''} • Items: ${item.components?.length || ''}`;
      case 'routings':
        return `Steps: ${item.operations?.length || ''} • Duration: ${item.totalDuration || ''}min`;
      case 'recipes':
        return `Version: ${item.version || ''} • Batch Size: ${item.batchSize || ''} • Yield: ${item.yield || ''}%`;
      case 'productionVersions':
        return `Item: ${item.itemNumber || ''} • Plants: ${Array.isArray(item.validPlants) ? item.validPlants.join(',') : item.validPlants || ''} • MRP: ${item.mrpRelevant ? 'Yes' : 'No'} • Lot Size: ${item.lotSizeMin || ''}-${item.lotSizeMax || ''}`;
      case 'forecasts':
        return `Period: ${item.period || ''} • Demand: ${item.forecast || ''}`;
      default:
        return item.description || item.type || item.status || '';
    }
  };

  // Component for managing existing data
  function ManageDataTab({ dataType }: { dataType: string }) {
    const [viewMode, setViewMode] = useState<'table' | 'cards' | 'spreadsheet'>('table');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [bulkSelectMode, setBulkSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
    const [newRowData, setNewRowData] = useState<any>({});
    const [showNewRow, setShowNewRow] = useState(false);
    
    // Undo functionality state
    const [undoFunction, setUndoFunction] = useState<(() => void) | null>(null);
    const [hasUndo, setHasUndo] = useState(false);
    
    // Debounce search with longer delay for mobile to prevent keyboard hiding
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearchTerm(searchTerm);
      }, 800); // Increased delay for mobile stability
      
      return () => clearTimeout(timer);
    }, [searchTerm]);

    // Mobile touch handling component
    const MobileTableRow = ({ item, dataType, onEdit, onDelete }: any) => {
      const [showDelete, setShowDelete] = useState(false);
      const isSelected = selectedItems.has(item.id?.toString() || '');

      const handleRowClick = () => {
        console.log('Row clicked, showDelete:', showDelete, 'bulkSelectMode:', bulkSelectMode);
        if (bulkSelectMode) {
          // In bulk mode, toggle selection
          const newSelected = new Set(selectedItems);
          const itemId = item.id?.toString() || '';
          if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
          } else {
            newSelected.add(itemId);
          }
          setSelectedItems(newSelected);
        } else if (!showDelete) {
          onEdit();
        }
      };

      return (
        <TableRow className={`relative ${isSelected && bulkSelectMode ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
          <TableCell className="font-medium p-0">
            <div className="flex min-h-[60px]">
              {/* Checkbox for bulk selection mode */}
              {bulkSelectMode && (
                <div className="w-12 flex items-center justify-center sm:hidden">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleRowClick}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              )}
              
              {/* Main content area - tap to edit or select */}
              <div 
                className="flex-1 p-3 cursor-pointer sm:cursor-default"
                onClick={handleRowClick}
              >
                <div className="flex items-center gap-2">
                  <span>{item.name}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
                  {getItemDetails(item, dataType)}
                </div>
              </div>
              
              {/* Delete button - only show in normal mode */}
              {!bulkSelectMode && (
                <div className={`transition-all duration-300 overflow-hidden ${showDelete ? 'w-16' : 'w-0'} sm:hidden`}>
                  {showDelete && (
                    <div className="w-16 h-full flex items-center justify-center bg-red-100">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                          setShowDelete(false);
                        }}
                        className="w-10 h-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Toggle button - only show in normal mode */}
              {!bulkSelectMode && (
                <div className="w-12 flex items-center justify-center sm:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDelete(!showDelete);
                      // Haptic feedback
                      if (navigator.vibrate) {
                        navigator.vibrate(30);
                      }
                    }}
                    className="w-8 h-8 p-0 hover:bg-gray-100 active:bg-gray-200"
                    title="Toggle delete button"
                  >
                    <span className="text-sm font-bold text-gray-600">⋮</span>
                  </Button>
                </div>
              )}
            </div>
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            {getItemDetails(item, dataType)}
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit()}
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete()}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    };
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newItem, setNewItem] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [allLoadedItems, setAllLoadedItems] = useState<any[]>([]);
    const [hasMoreData, setHasMoreData] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const itemsPerPage = 20;

    // Map data types to table names for pagination API - only supported tables
    const getTableName = (dataType: string) => {
      const mapping: Record<string, string> = {
        'plants': 'plants',
        'resources': 'resources',
        'capabilities': 'capabilities',
        'productionOrders': 'production_orders',
        'vendors': 'vendors',
        'customers': 'customers'
      };
      return mapping[dataType] || dataType;
    };

    // Load more data function for infinite scroll
    const loadMoreData = async (page: number) => {
      if (isLoadingMore || (!hasMoreData && page > 1)) return;
      
      if (page === 1) {
        setInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`/api/data-management/${getTableName(dataType)}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            pagination: {
              page: page,
              limit: itemsPerPage
            },
            search: debouncedSearchTerm ? {
              query: debouncedSearchTerm,
              fields: ['name', 'description']
            } : undefined,
            sort: [{ field: 'name', direction: 'asc' }]
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        const rawItems = result.data || [];
        
        // Filter out items with empty or invalid names and ensure they have proper structure
        const newItems = rawItems.filter((item: any) => 
          item && 
          (item.name && item.name.trim() !== '') && 
          item.id
        );
        
        if (page === 1) {
          // First load or search reset
          setAllLoadedItems(newItems);
        } else {
          // Append new items for infinite scroll - ensure no duplicates
          setAllLoadedItems(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const uniqueNewItems = newItems.filter((item: any) => !existingIds.has(item.id));
            return [...prev, ...uniqueNewItems];
          });
        }
        
        // Update pagination state
        setHasMoreData(result.pagination?.hasNext || false);
        setCurrentPage(page);
        
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        if (page === 1) {
          setInitialLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    };

    // Initial loading state
    const [initialLoading, setInitialLoading] = useState(true);

    // Use accumulated data for infinite scroll
    const currentItems = allLoadedItems;



    // Reset data when debounced search term or data type changes
    React.useEffect(() => {
      setCurrentPage(1);
      setAllLoadedItems([]);
      setHasMoreData(true);
      setSelectedItems(new Set());
      setBulkSelectMode(false);
      if (dataType) {
        loadMoreData(1);
      }
    }, [debouncedSearchTerm, dataType]); // loadMoreData should be stable

    // Scroll detection for infinite scroll
    React.useEffect(() => {
      const handleScroll = () => {
        if (
          window.innerHeight + document.documentElement.scrollTop >= 
          document.documentElement.offsetHeight - 1000 && // Load when 1000px from bottom
          hasMoreData && 
          !isLoadingMore &&
          !initialLoading
        ) {
          loadMoreData(currentPage + 1);
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, [currentPage, hasMoreData, isLoadingMore, initialLoading]); // Dependencies look correct

    // Update mutation with optimistic updates
    const updateMutation = useMutation({
      mutationFn: async (updatedItem: any) => {
        console.log(`[updateMutation] Starting update for item:`, updatedItem);
        const authToken = localStorage.getItem('authToken');
        const endpoint = getApiEndpoint(dataType);
        const url = `/api/${endpoint}/${updatedItem.id}`;
        console.log(`[updateMutation] Making PUT request to: ${url}`);
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(updatedItem)
        });
        
        console.log(`[updateMutation] Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[updateMutation] Error response:`, errorText);
          throw new Error(`Failed to update item: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`[updateMutation] Success result:`, result);
        console.log(`[updateMutation] Checking if description field is in result:`, result.description);
        return result;
      },
      onMutate: async (updatedItem) => {
        console.log(`[updateMutation.onMutate] Optimistically updating UI for:`, updatedItem);
        // Optimistically update the UI immediately
        setAllLoadedItems(prev => 
          prev.map(item => 
            item.id === updatedItem.id ? { ...item, ...updatedItem } : item
          )
        );
      },
      onSuccess: (data, updatedItem) => {
        console.log(`[updateMutation.onSuccess] Update successful for item ${updatedItem.id}`);
        // Don't show toast for spreadsheet updates to reduce noise
        // Don't refresh - the optimistic update is already applied
        setEditingItem(null);
      },
      onError: (error: any, updatedItem, context) => {
        console.error(`[updateMutation.onError] Update failed for item ${updatedItem.id}:`, error);
        // Revert optimistic update on error
        toast({ title: "Error", description: error.message, variant: "destructive" });
        // Refresh only on error to restore correct data
        setCurrentPage(1);
        setAllLoadedItems([]);
        setHasMoreData(true);
        loadMoreData(1);
      }
    });

    // Create mutation
    const createMutation = useMutation({
      mutationFn: async (item: any) => {
        const authToken = localStorage.getItem('authToken');
        const endpoint = getApiEndpoint(dataType);
        const response = await fetch(`/api/${endpoint}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(item)
        });
        if (!response.ok) throw new Error('Failed to create item');
        return response.json();
      },
      onSuccess: () => {
        toast({ title: "Success", description: "Item created successfully" });
        // Refresh data by loading page 1 again
        setCurrentPage(1);
        setAllLoadedItems([]);
        setHasMoreData(true);
        loadMoreData(1);
        setShowAddDialog(false);
        setNewItem({});
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });

    // Delete mutation
    const deleteMutation = useMutation({
      mutationFn: async (id: number) => {
        const authToken = localStorage.getItem('authToken');
        const tableName = getTableName(dataType);
        const response = await fetch(`/api/data-management/${tableName}/bulk-delete`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ ids: [id] })
        });
        if (!response.ok) throw new Error('Failed to delete item');
        return response.json();
      },
      onSuccess: () => {
        toast({ title: "Success", description: "Item deleted successfully" });
        // Refresh data by loading page 1 again
        setCurrentPage(1);
        setAllLoadedItems([]);
        setHasMoreData(true);
        loadMoreData(1);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });

    // Bulk delete mutation using high-performance API
    const bulkDeleteMutation = useMutation({
      mutationFn: async (ids: string[]) => {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`/api/data-management/${getTableName(dataType)}/bulk-delete`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ ids: ids.map(id => Number(id)) })
        });
        if (!response.ok) throw new Error('Failed to delete items');
        return response.json();
      },
      onSuccess: (data) => {
        toast({ 
          title: "Success", 
          description: `${data.deleted} items deleted successfully` 
        });
        // Refresh data by loading page 1 again
        setCurrentPage(1);
        setAllLoadedItems([]);
        setHasMoreData(true);
        loadMoreData(1);
        setSelectedItems(new Set());
        setBulkSelectMode(false);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });

    if (initialLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Header with Search and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium">Existing {dataType} Data</h3>
            <p className="text-sm text-gray-600">
              {currentItems.length} items loaded {!hasMoreData ? '(all data loaded)' : '(scroll for more)'}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              title="Table View"
              className="flex-shrink-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              title="Card View"
              className="flex-shrink-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'spreadsheet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('spreadsheet')}
              title="Spreadsheet View"
              className="flex-shrink-0"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            {viewMode === 'spreadsheet' ? (
              <>
                <Button 
                  onClick={() => setShowNewRow(true)} 
                  size="sm"
                  disabled={showNewRow}
                  className="flex-shrink-0"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add Row</span>
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={!hasUndo}
                  onClick={() => undoFunction && undoFunction()}
                  title="Undo last change (Ctrl+Z)"
                  className="flex-shrink-0"
                >
                  <Undo2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Undo</span>
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="flex-shrink-0">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add New</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder={`Search ${dataType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Data Display */}
        {viewMode === 'spreadsheet' ? (
          <SpreadsheetView 
            dataType={dataType}
            items={currentItems}
            editingRows={editingRows}
            setEditingRows={setEditingRows}
            showNewRow={showNewRow}
            setShowNewRow={setShowNewRow}
            newRowData={newRowData}
            setNewRowData={setNewRowData}
            onUpdate={(item) => updateMutation.mutate(item)}
            onCreate={(item) => createMutation.mutate(item)}
            onDelete={(id) => deleteMutation.mutate(id)}
            isLoading={updateMutation.isPending || createMutation.isPending || deleteMutation.isPending}
            onUndoStackChange={(undoFn, hasUndoChanges) => {
              setUndoFunction(() => undoFn);
              setHasUndo(hasUndoChanges);
            }}
          />
        ) : viewMode === 'table' ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="p-0">
                    {/* Mobile header - matches row structure exactly */}
                    <div className="flex min-h-[60px] sm:hidden">
                      {/* Checkbox space - matches row structure */}
                      {bulkSelectMode && (
                        <div className="w-12 flex items-center justify-center">
                          <span className="text-xs text-gray-500">All</span>
                        </div>
                      )}
                      
                      {/* Content area - exact copy of row structure */}
                      <div className="flex-1 p-3 flex items-center">
                        <span>Name</span>
                        <span className="ml-auto text-sm text-gray-500">
                          {bulkSelectMode && selectedItems.size > 0 && (
                            <>
                              {selectedItems.size} selected
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const selectedIds = Array.from(selectedItems);
                                  bulkDeleteMutation.mutate(selectedIds);
                                }}
                                className="h-6 px-2 ml-2"
                                title={`Delete ${selectedItems.size} selected items`}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                {selectedItems.size}
                              </Button>
                            </>
                          )}
                        </span>
                      </div>
                      
                      {/* Delete button space when not in bulk mode */}
                      {!bulkSelectMode && (
                        <div className="w-0"></div>
                      )}
                      
                      {/* Toggle button space - matches row structure exactly */}
                      <div className="w-12 flex items-center justify-center">
                        <Button
                          variant={bulkSelectMode ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => {
                            setBulkSelectMode(!bulkSelectMode);
                            setSelectedItems(new Set());
                          }}
                          className="w-8 h-8 p-0 hover:bg-gray-100 active:bg-gray-200"
                          title="Bulk select mode"
                        >
                          <span className="text-sm font-bold text-gray-600">⋮</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Desktop header */}
                    <span className="hidden sm:block px-4 py-3">Name</span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Details</TableHead>
                  <TableHead className="hidden sm:table-cell w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                      {debouncedSearchTerm ? `No ${dataType} found matching "${debouncedSearchTerm}"` : `No ${dataType} data available`}
                      <div className="mt-2 text-sm">
                        {debouncedSearchTerm ? 'Try adjusting your search terms' : 'Add some data using the "Add New" button above'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((item, index) => (
                    <MobileTableRow 
                      key={`${item.id || index}-${dataType}-${item.name}`} 
                      item={item} 
                      dataType={dataType}
                      onEdit={() => setEditingItem(item)}
                      onDelete={() => deleteMutation.mutate(item.id)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentItems.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                {debouncedSearchTerm ? `No ${dataType} found matching "${debouncedSearchTerm}"` : `No ${dataType} data available`}
                <div className="mt-2 text-sm">
                  {debouncedSearchTerm ? 'Try adjusting your search terms' : 'Add some data using the "Add New" button above'}
                </div>
              </div>
            ) : (
              currentItems.map((item, index) => (
                <div key={`${item.id || index}-${dataType}-${item.name}-card`} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{item.name || 'Unnamed'}</h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{getItemDetails(item, dataType)}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Infinite Scroll Loading Indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading more data...
            </div>
          </div>
        )}
        
        {/* End of data indicator */}
        {!hasMoreData && currentItems.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            No more data to load
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {dataType}</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <EditItemForm
                item={editingItem}
                dataType={dataType}
                onSave={(updatedItem) => updateMutation.mutate(updatedItem)}
                onCancel={() => setEditingItem(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {dataType}</DialogTitle>
            </DialogHeader>
            <EditItemForm
              item={newItem}
              dataType={dataType}
              onSave={(item) => createMutation.mutate(item)}
              onCancel={() => { setShowAddDialog(false); setNewItem({}); }}
              isLoading={createMutation.isPending}
              isNew={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Spreadsheet View Component with Undo state management, sorting, and filtering
  function SpreadsheetView({ 
    dataType, 
    items, 
    editingRows, 
    setEditingRows, 
    showNewRow, 
    setShowNewRow, 
    newRowData, 
    setNewRowData,
    onUpdate, 
    onCreate, 
    onDelete, 
    isLoading,
    onUndoStackChange 
  }: {
    dataType: string;
    items: any[];
    editingRows: Set<string>;
    setEditingRows: React.Dispatch<React.SetStateAction<Set<string>>>;
    showNewRow: boolean;
    setShowNewRow: React.Dispatch<React.SetStateAction<boolean>>;
    newRowData: any;
    setNewRowData: React.Dispatch<React.SetStateAction<any>>;
    onUpdate: (item: any) => void;
    onCreate: (item: any) => void;
    onDelete: (id: number) => void;
    isLoading: boolean;
    onUndoStackChange?: (undoFunction: () => void, hasUndo: boolean) => void;
  }) {
    const [editData, setEditData] = useState<Record<string, any>>({});
    const [localUpdates, setLocalUpdates] = useState<Record<string, any>>({});
    
    // Keyboard navigation state
    const [focusedCell, setFocusedCell] = useState<{row: number, col: number} | null>(null);
    
    // Excel-like editing state
    const [cellHistory, setCellHistory] = useState<Record<string, any>>({});
    const [undoStack, setUndoStack] = useState<Array<{itemId: string, field: string, oldValue: any, newValue: any}>>([]);
    
    // Sorting and filtering state
    const [sortConfig, setSortConfig] = useState<{field: string, direction: 'asc' | 'desc'} | null>(null);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

    const getFieldsForDataType = (dataType: string) => {
      const commonFields = ['name', 'description'];
      const typeSpecificFields: Record<string, string[]> = {
        plants: ['location', 'timezone', 'capacity'],
        resources: ['type', 'status', 'plantId'],
        capabilities: ['category', 'level'],
        productionOrders: ['priority', 'dueDate', 'quantity', 'status'],
        operations: ['duration', 'sequence', 'status', 'productionOrderId'],
        vendors: ['contactPerson', 'email', 'phone', 'address'],
        customers: ['tier', 'email', 'phone', 'address']
      };
      return [...commonFields, ...(typeSpecificFields[dataType] || [])];
    };

    // Sorting and filtering functions
    const handleSort = (field: string) => {
      setSortConfig(current => {
        if (current?.field === field) {
          return { field, direction: current.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { field, direction: 'asc' };
      });
    };

    const handleFilterChange = (field: string, value: string) => {
      setColumnFilters(prev => ({
        ...prev,
        [field]: value
      }));
    };

    // Apply filtering and sorting to items
    const processedItems = React.useMemo(() => {
      let filteredItems = [...items];

      // Apply column filters
      Object.entries(columnFilters).forEach(([field, filterValue]) => {
        if (filterValue.trim()) {
          filteredItems = filteredItems.filter(item => {
            const itemValue = item[field]?.toString()?.toLowerCase() || '';
            return itemValue.includes(filterValue.toLowerCase());
          });
        }
      });

      // Apply sorting
      if (sortConfig) {
        filteredItems.sort((a, b) => {
          const aValue = a[sortConfig.field];
          const bValue = b[sortConfig.field];
          
          // Handle null/undefined values
          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
          if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
          
          // Handle different data types
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
          }
          
          if (aValue instanceof Date && bValue instanceof Date) {
            return sortConfig.direction === 'asc' 
              ? aValue.getTime() - bValue.getTime() 
              : bValue.getTime() - aValue.getTime();
          }
          
          // String comparison
          const aStr = aValue.toString().toLowerCase();
          const bStr = bValue.toString().toLowerCase();
          
          if (sortConfig.direction === 'asc') {
            return aStr.localeCompare(bStr);
          } else {
            return bStr.localeCompare(aStr);
          }
        });
      }

      return filteredItems;
    }, [items, columnFilters, sortConfig]);

    const fields = getFieldsForDataType(dataType);
    const totalRows = processedItems.length + (showNewRow ? 1 : 0);
    const totalCols = fields.length;

    // Keyboard navigation functions
    const moveToNextCell = (currentRow: number, currentCol: number) => {
      let nextRow = currentRow;
      let nextCol = currentCol + 1;
      
      // If we've reached the end of the row, wrap to the first column of the next row
      if (nextCol >= totalCols) {
        nextCol = 0;
        nextRow = currentRow + 1;
      }
      
      // If we've reached the end of all rows, don't move
      if (nextRow >= totalRows) {
        return;
      }
      
      setFocusedCell({ row: nextRow, col: nextCol });
      
      // Focus the next input
      setTimeout(() => {
        const nextInput = document.querySelector(`[data-cell="${nextRow}-${nextCol}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        moveToNextCell(rowIndex, colIndex);
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    // Excel-like cell editing functions  
    const saveCellValue = (itemId: string, field: string, newValue: any, originalValue: any) => {
      if (newValue !== originalValue) {
        console.log(`[saveCellValue] Saving change: itemId=${itemId}, field=${field}, old="${originalValue}", new="${newValue}"`);
        
        // Add to undo stack
        setUndoStack(prev => [...prev, { itemId, field, oldValue: originalValue, newValue }]);
        
        // Create updated item and save - onUpdate should handle this efficiently
        const originalItem = items.find(item => item.id.toString() === itemId);
        if (!originalItem) {
          console.error(`[saveCellValue] Could not find item with ID ${itemId}`);
          return;
        }
        
        const updatedItem = { ...originalItem, [field]: newValue };
        console.log(`[saveCellValue] Calling onUpdate with:`, updatedItem);
        onUpdate(updatedItem);
      } else {
        console.log(`[saveCellValue] No change detected: "${originalValue}" === "${newValue}"`);
      }
    };

    const handleUndo = () => {
      if (undoStack.length > 0) {
        const lastAction = undoStack[undoStack.length - 1];
        const newUndoStack = undoStack.slice(0, -1);
        setUndoStack(newUndoStack);
        
        // Revert the value
        const updatedItem = { ...items.find(item => item.id.toString() === lastAction.itemId), [lastAction.field]: lastAction.oldValue };
        onUpdate(updatedItem);
        
        // Notify parent about undo stack change
        if (onUndoStackChange) {
          onUndoStackChange(handleUndo, newUndoStack.length > 0);
        }
      }
    };

    // Notify parent when undo stack changes
    useEffect(() => {
      if (onUndoStackChange) {
        onUndoStackChange(handleUndo, undoStack.length > 0);
      }
    }, [undoStack.length]);

    // Keyboard shortcut for Ctrl+Z undo
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'z' && undoStack.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undoStack.length]);

    const startEdit = (itemId: string, item: any) => {
      // Store original values for undo
      setCellHistory(prev => ({ ...prev, [itemId]: { ...item } }));
    };

    const cancelEdit = (itemId: string) => {
      // No longer needed for Excel-like behavior
    };

    const saveEdit = (itemId: string) => {
      // No longer needed for Excel-like behavior
    };

    const saveNewRow = () => {
      if (newRowData.name && newRowData.name.trim()) {
        onCreate(newRowData);
        setNewRowData({});
        setShowNewRow(false);
      }
    };

    const cancelNewRow = () => {
      setNewRowData({});
      setShowNewRow(false);
    };

    const updateEditField = (itemId: string, field: string, value: any) => {
      setEditData(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [field]: value
        }
      }));
    };

    const updateNewRowField = (field: string, value: any) => {
      setNewRowData((prev: any) => ({
        ...prev,
        [field]: value
      }));
    };

    const renderCell = (item: any, field: string, isEditing: boolean, isNewRow = false, rowIndex?: number, colIndex?: number) => {
      // Get current value from local updates first, then item data, or default to empty
      const localKey = item ? `${item.id}_${field}` : '';
      const currentValue = isNewRow 
        ? newRowData[field] || '' 
        : (localUpdates[localKey] !== undefined ? localUpdates[localKey] : item[field] || '');
      
      const handleChange = (newValue: any) => {
        if (isNewRow) {
          updateNewRowField(field, newValue);
        } else {
          // Update local state immediately for responsive UI
          setLocalUpdates(prev => ({
            ...prev,
            [`${item.id}_${field}`]: newValue
          }));
        }
      };

      const handleBlur = (e: React.FocusEvent) => {
        const newValue = (e.target as HTMLInputElement).value;
        if (!isNewRow && newValue !== item[field]) {
          console.log(`Saving cell change: ${field} from "${item[field]}" to "${newValue}" for item ${item.id}`);
          // Save to backend but keep local state until success
          const originalValue = item[field];
          saveCellValue(item.id.toString(), field, newValue, originalValue);
          
          // Clear local update after saving (will use updated item data)
          setTimeout(() => {
            setLocalUpdates(prev => {
              const newUpdates = { ...prev };
              delete newUpdates[`${item.id}_${field}`];
              return newUpdates;
            });
          }, 100);
        }
      };

      const handleFocus = () => {
        if (!isNewRow) {
          startEdit(item.id.toString(), item);
        }
      };

      // Common props for keyboard navigation and Excel-like behavior
      const commonProps = {
        ...(rowIndex !== undefined && colIndex !== undefined ? {
          'data-cell': `${rowIndex}-${colIndex}`,
          onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, rowIndex, colIndex)
        } : {}),
        onFocus: handleFocus,
        onBlur: handleBlur,
        // Enhanced mobile-friendly input styling
        className: "w-full px-3 py-1 border-0 outline-none bg-transparent text-sm h-[36px] focus:bg-white dark:focus:bg-gray-800 focus:border focus:border-blue-500 focus:rounded focus:z-10",
        // Improved mobile input handling
        autoComplete: "off",
        autoCorrect: "off",
        autoCapitalize: "off",
        spellCheck: false
      };

      if (field === 'status' && (dataType === 'resources' || dataType === 'operations' || dataType === 'productionOrders')) {
        return (
          <select 
            value={currentValue} 
            onChange={(e) => {
              handleChange(e.target.value);
              if (!isNewRow) {
                // Save immediately for select dropdowns
                saveCellValue(item.id.toString(), field, e.target.value, item[field]);
                // Clear local update after saving
                setTimeout(() => {
                  setLocalUpdates(prev => {
                    const newUpdates = { ...prev };
                    delete newUpdates[`${item.id}_${field}`];
                    return newUpdates;
                  });
                }, 100);
              }
            }}
            {...commonProps}
            className="w-full px-3 py-1 border-0 outline-none bg-transparent text-sm h-[36px] focus:bg-white focus:border focus:border-blue-500 focus:rounded"
          >
            <option value="">Select...</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            {dataType === 'productionOrders' && (
              <>
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </>
            )}
          </select>
        );
      }

      if (field === 'priority' && dataType === 'productionOrders') {
        return (
          <select 
            value={currentValue} 
            onChange={(e) => {
              handleChange(e.target.value);
              if (!isNewRow) {
                // Save immediately for select dropdowns
                saveCellValue(item.id.toString(), field, e.target.value, item[field]);
                // Clear local update after saving
                setTimeout(() => {
                  setLocalUpdates(prev => {
                    const newUpdates = { ...prev };
                    delete newUpdates[`${item.id}_${field}`];
                    return newUpdates;
                  });
                }, 100);
              }
            }}
            {...commonProps}
            className="w-full px-3 py-1 border-0 outline-none bg-transparent text-sm h-[36px] focus:bg-white dark:focus:bg-gray-800 focus:border focus:border-blue-500 focus:rounded"
          >
            <option value="">Select...</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        );
      }

      if (field === 'dueDate') {
        return (
          <input
            type="date"
            value={currentValue ? (typeof currentValue === 'string' ? currentValue.split('T')[0] : currentValue) : ''}
            onChange={(e) => handleChange(e.target.value)}
            {...commonProps}
          />
        );
      }

      if (field === 'duration' || field === 'sequence' || field === 'quantity' || field === 'capacity') {
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            min="0"
            {...commonProps}
          />
        );
      }

      return (
        <input
          type="text"
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field === 'name' ? 'Enter name...' : ''}
          {...commonProps}
        />
      );
    };

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Filter Status Bar */}
        {(Object.keys(columnFilters).some(key => columnFilters[key]?.trim()) || sortConfig) && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border-b px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-blue-700 dark:text-blue-300 font-medium">Active Filters:</span>
              <div className="flex items-center gap-2">
                {Object.entries(columnFilters).map(([field, value]) => {
                  if (!value?.trim()) return null;
                  return (
                    <Badge key={field} variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                      {field}: "{value}"
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFilterChange(field, '')}
                        className="h-4 w-4 p-0 ml-1 hover:bg-blue-200"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  );
                })}
                {sortConfig && (
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                    Sorted by {sortConfig.field} ({sortConfig.direction})
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSortConfig(null)}
                      className="h-4 w-4 p-0 ml-1 hover:bg-green-200"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setColumnFilters({});
                setSortConfig(null);
              }}
              className="text-xs h-6"
            >
              Clear All
            </Button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b">
              <tr>
                {fields.map(field => (
                  <th key={field} className="text-left px-4 py-3 font-medium text-sm text-gray-900 min-w-[120px]">
                    <div className="space-y-2">
                      {/* Column Header with Sort Button */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort(field)}
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                          title={`Sort by ${field}`}
                        >
                          {sortConfig?.field === field ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      
                      {/* Column Filter Input */}
                      <Input
                        placeholder={`Filter ${field}...`}
                        value={columnFilters[field] || ''}
                        onChange={(e) => handleFilterChange(field, e.target.value)}
                        className="h-6 text-xs border-gray-300 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-sm text-gray-900 w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* New Row */}
              {showNewRow && (
                <tr className="border-b bg-blue-50 dark:bg-blue-950/30">
                  {fields.map((field, colIndex) => (
                    <td key={field} className="border-r">
                      {renderCell(null, field, true, true, 0, colIndex)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={saveNewRow}
                        disabled={isLoading || !newRowData.name?.trim()}
                        className="h-8 px-2 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelNewRow}
                        disabled={isLoading}
                        className="h-8 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Data Rows - Excel-like editing */}
              {processedItems.map((item, rowIndex) => {
                const itemId = item.id.toString();
                const actualRowIndex = showNewRow ? rowIndex + 1 : rowIndex; // Adjust for new row
                
                return (
                  <tr key={itemId} className="border-b hover:bg-gray-50">
                    {fields.map((field, colIndex) => (
                      <td key={field} className="border-r p-0">
                        {renderCell(item, field, false, false, actualRowIndex, colIndex)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item.id)}
                          disabled={isLoading}
                          className="h-8 px-2 text-xs text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {/* Empty State - No items after filtering */}
              {processedItems.length === 0 && items.length > 0 && (
                <tr>
                  <td colSpan={fields.length + 1} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Filter className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium">No items match current filters</p>
                        <p className="text-sm text-gray-400">Try adjusting your column filters or sorting options</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setColumnFilters({});
                          setSortConfig(null);
                        }}
                        className="mt-2"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Empty State - No data at all */}
              {items.length === 0 && !showNewRow && (
                <tr>
                  <td colSpan={fields.length + 1} className="text-center py-8 text-gray-500">
                    No {dataType} data available
                    <div className="mt-2 text-sm">
                      Add some data using the "Add Row" button above
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Simple EditItemForm component for basic editing
  function EditItemForm({ item, dataType, onSave, onCancel, isLoading, isNew = false }: {
    item: any;
    dataType: string;
    onSave: (item: any) => void;
    onCancel: () => void;
    isLoading: boolean;
    isNew?: boolean;
  }) {
    const [formData, setFormData] = useState(item);

    const handleSave = () => {
      onSave(formData);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isLoading} className="flex-1">
            {isLoading ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className={`
        flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4
        ml-3 mr-3
        ${isMaxOpen ? 'md:ml-0 md:mr-0' : 'md:ml-12 md:mr-12'}
      `}>
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-xl md:text-2xl font-bold">Master Data Setup</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground pr-4 sm:pr-0">
            Set up your company's core manufacturing data quickly and easily. 
            Upload files, enter data in spreadsheet format, use text input, or download templates to get started.
          </p>
        </div>
        <div className="flex gap-2 lg:flex-shrink-0">
          <Button 
            onClick={handleGenerateAISampleData}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Sample Data</span>
            <span className="sm:hidden">AI Data</span>
          </Button>
          <Button 
            onClick={() => setShowAIModifyDialog(true)}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Edit2 className="h-4 w-4" />
            <span className="hidden sm:inline">AI Modify Data</span>
            <span className="sm:hidden">AI Modify</span>
          </Button>
        </div>
      </div>

      {/* Feature-Based Recommendations */}
      <div className={`
        ml-3 mr-3
        ${isMaxOpen ? 'md:ml-0 md:mr-0' : 'md:ml-12 md:mr-12'}
      `}>
        {recommendedDataTypes.length > 0 && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Lightbulb className="h-5 w-5" />
              Recommended Data for Your Selected Features
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-400">
              Based on your onboarding feature selections, these data elements are recommended to get started quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">Selected Features:</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openFeatureDialog}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 h-auto"
                    title="Edit feature selections"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-xs">Edit</span>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {onboardingFeatures.map((feature) => (
                    <Badge key={feature} variant="outline" className="border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300">
                      {feature.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Recommended data types: {recommendedDataTypes.length} types</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendedDataTypes.map((type) => {
                    const dataType = supportedDataTypes.find(dt => dt.key === type);
                    return dataType ? (
                      <Badge key={type} className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                        {dataType.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Main Content */}
      <div className={`
        ml-3 mr-3
        ${isMaxOpen ? 'md:ml-0 md:mr-0' : 'md:ml-12 md:mr-12'}
      `}>
        <Card>
        <CardContent className="p-3 sm:p-6">
          <Tabs defaultValue="manage">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="manage" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Manage Data</span>
                <span className="sm:hidden">Manage</span>
              </TabsTrigger>
              <TabsTrigger value="structured" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Structured Entry</span>
                <span className="sm:hidden">Structured</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Text Entry</span>
                <span className="sm:hidden">Text</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Import Data</span>
                <span className="sm:hidden">Import</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">Templates</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manage" className="mt-6">
              <div className="space-y-4">
                {/* Data Type Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Manage Master Data</h3>
                    <p className="text-sm text-gray-600">View and edit your manufacturing data</p>
                  </div>
                  <div className="w-full sm:w-80">
                    <Select value={selectedManageDataType} onValueChange={setSelectedManageDataType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type">
                          {selectedManageDataType && (
                            supportedDataTypes.find(dt => dt.key === selectedManageDataType)?.label
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {/* Group data types by category */}
                        {['Core Manufacturing', 'Organization', 'Products & Inventory', 'Business Partners', 'Sales & Orders', 'Manufacturing Planning'].map((category) => {
                          const categoryTypes = supportedDataTypes.filter(dt => dt.category === category);
                          return (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-b bg-gray-50">
                                {category}
                              </div>
                              {categoryTypes.map((dataType) => (
                                <SelectItem key={dataType.key} value={dataType.key}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{dataType.label}</span>
                                    <span className="ml-2 text-xs text-gray-400">
                                      {recordCounts[dataType.key] !== undefined ? recordCounts[dataType.key] : '...'}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Data Management Component */}
                <ManageDataTab key={selectedManageDataType} dataType={selectedManageDataType} />
              </div>
            </TabsContent>
            <TabsContent value="import" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Import Data Files</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload CSV or Excel files to import your manufacturing data</p>
                </div>

                {/* Import Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      !isConsolidatedImport 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setIsConsolidatedImport(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Upload className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium">Single Data Type Import</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Import CSV or Excel files for one data type at a time</p>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isConsolidatedImport 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setIsConsolidatedImport(true)}
                  >
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium">Consolidated Template Import</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Import multi-sheet Excel file with multiple data types</p>
                  </div>
                </div>

                {!isConsolidatedImport ? (
                  // Single Data Type Import
                  <div className="space-y-4">
                    {/* Data Type Selection for Import */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="import-data-type">Select Data Type</Label>
                    <Select value={selectedImportDataType} onValueChange={setSelectedImportDataType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose data type to import" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Group data types by category */}
                        {['Core Manufacturing', 'Organization', 'Products & Inventory', 'Business Partners', 'Sales & Orders', 'Manufacturing Planning'].map((category) => {
                          const categoryTypes = supportedDataTypes.filter(dt => dt.category === category);
                          return (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-b bg-gray-50">
                                {category}
                              </div>
                              {categoryTypes.map((dataType) => (
                                <SelectItem key={dataType.key} value={dataType.key}>
                                  {dataType.label}
                                </SelectItem>
                              ))}
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadTemplate(selectedImportDataType)}
                      disabled={!selectedImportDataType}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Drop your CSV or Excel file here</p>
                  <p className="text-sm text-gray-500 mb-4">Supports .csv, .xlsx, and .xls files</p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleFileUpload(e)}
                    className="hidden"
                    id="file-upload"
                    disabled={!selectedImportDataType}
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" asChild disabled={!selectedImportDataType}>
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                </div>

                {/* Import Status */}
                {isImporting && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-800">Importing data...</span>
                    </div>
                  </div>
                )}

                {/* Import Templates Helper */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileSpreadsheet className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Need a template?</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    Download a properly formatted template for your selected data type to ensure successful import.
                  </p>
                  {selectedImportDataType && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTemplate(selectedImportDataType)}
                      className="bg-white dark:bg-gray-800 border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-gray-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download {supportedDataTypes.find(dt => dt.key === selectedImportDataType)?.label} Template
                    </Button>
                  )}
                </div>

                    {/* Import Options */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Import Options</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="skip-duplicates" className="rounded" />
                          <Label htmlFor="skip-duplicates" className="text-sm">Skip duplicate records</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="validate-data" className="rounded" defaultChecked />
                          <Label htmlFor="validate-data" className="text-sm">Validate data before import</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Consolidated Import
                  <div className="space-y-4">
                    {/* Consolidated File Upload */}
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
                      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                      <p className="text-lg font-medium mb-2">Drop your consolidated Excel file here</p>
                      <p className="text-sm text-gray-500 mb-4">Upload multi-sheet Excel file with data types as sheet names</p>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleConsolidatedFileUpload}
                        className="hidden"
                        id="consolidated-file-upload"
                      />
                      <label htmlFor="consolidated-file-upload">
                        <Button variant="outline" asChild>
                          <span className="cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Choose Consolidated File
                          </span>
                        </Button>
                      </label>
                    </div>

                    {/* Sheet Selection */}
                    {consolidatedSheets.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-purple-800">Select Sheets to Import</h4>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedSheets(new Set(consolidatedSheets))}
                              className="text-xs h-6"
                            >
                              Select All
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedSheets(new Set())}
                              className="text-xs h-6"
                            >
                              Clear All
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {consolidatedSheets.map((sheetName) => (
                            <div key={sheetName} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedSheets.has(sheetName)}
                                onCheckedChange={() => toggleSheetSelection(sheetName)}
                              />
                              <span className="text-sm">{sheetName}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <Button 
                            onClick={importConsolidatedTemplate}
                            disabled={selectedSheets.size === 0 || isImporting}
                            className="gap-2 bg-purple-600 hover:bg-purple-700"
                          >
                            {isImporting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            Import {selectedSheets.size} Selected Sheets
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Consolidated Import Info */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">How it works</span>
                      </div>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Upload an Excel file with separate sheets for each data type</li>
                        <li>• Sheet names should match data type names (e.g., "Resources", "Plants", "Production Orders")</li>
                        <li>• Each sheet should follow the template format for that data type</li>
                        <li>• Select which sheets to import and process multiple data types at once</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Import Status */}
                {isImporting && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-800">
                        {isConsolidatedImport ? 'Importing consolidated template...' : 'Importing data...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Import Results */}
                {importStatuses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Import Results</h4>
                    {importStatuses.map((status, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        status.status === 'success' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {status.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">{status.type}</span>
                          {status.count && (
                            <Badge variant="secondary" className="text-xs">
                              {status.count} records
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{status.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="structured" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Structured Data Entry</h3>
                  <p className="text-sm text-gray-600 mb-4">Enter data in spreadsheet format for quick bulk entry</p>
                </div>

                <StructuredEntryComponent />
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Natural Text Entry</h3>
                  <p className="text-sm text-gray-600 mb-4">Describe your data in natural language and let AI convert it to structured records</p>
                </div>

                {/* Data Type Selection for Text Entry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="text-data-type">Select Data Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose data type" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Group data types by category */}
                        {['Core Manufacturing', 'Organization', 'Products & Inventory', 'Business Partners', 'Sales & Orders', 'Manufacturing Planning'].map((category) => {
                          const categoryTypes = supportedDataTypes.filter(dt => dt.category === category);
                          return (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-b bg-gray-50">
                                {category}
                              </div>
                              {categoryTypes.map((dataType) => (
                                <SelectItem key={dataType.key} value={dataType.key}>
                                  {dataType.label}
                                </SelectItem>
                              ))}
                            </div>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Text Input Area */}
                <div className="space-y-2">
                  <Label htmlFor="text-input">Describe Your Data</Label>
                  <textarea
                    id="text-input"
                    className="w-full h-32 p-3 border rounded-lg resize-none"
                    placeholder="Example: We have 3 CNC machines (Machine A, Machine B, Machine C) in our production facility. Machine A can do milling and turning, Machine B only does milling, and Machine C does turning and drilling..."
                  />
                </div>

                {/* Processing Options */}
                <div className="flex gap-2">
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Process Text
                  </Button>
                  <Button variant="outline">
                    Clear
                  </Button>
                </div>

                {/* Preview Area */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Preview Processed Data</h4>
                  <p className="text-sm text-gray-500">Processed records will appear here for review before saving</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="mt-6">
              <div className="space-y-4">
                {/* Header with bulk download */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <h3 className="text-lg font-medium text-blue-800">Import Templates</h3>
                  </div>
                  
                  <p className="text-sm text-blue-700 mb-4">
                    Download properly formatted templates with sample data and headers for successful imports.
                  </p>

                  {/* Mobile-optimized action buttons */}
                  <div className="space-y-3">
                    {/* Primary Download Button */}
                    <div className="flex justify-center">
                      <Button 
                        onClick={downloadAllTemplates}
                        className="w-full sm:w-auto gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        size="default"
                      >
                        <Download className="h-4 w-4 flex-shrink-0" />
                        {selectedTemplates.size > 0 
                          ? `Download ${selectedTemplates.size} Selected Template${selectedTemplates.size > 1 ? 's' : ''}` 
                          : 'Download All Templates'
                        }
                      </Button>
                    </div>

                    {/* Selection Controls */}
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={selectAllTemplates}
                        className="h-8"
                        disabled={selectedTemplates.size === supportedDataTypes.length}
                      >
                        Select All
                      </Button>
                      
                      {selectedTemplates.size > 0 && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearTemplateSelection}
                            className="h-8"
                          >
                            Clear Selections
                          </Button>
                          <span className="text-blue-600 font-medium">
                            {selectedTemplates.size} selected
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Multi-Template Option */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-center space-y-3">
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">All Templates in One</h4>
                      <p className="text-sm text-blue-600">Download a consolidated template with all data types in separate sheets</p>
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        onClick={() => setShowConsolidatedDialog(true)}
                        className="w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span className="hidden sm:inline">Consolidated Template</span>
                        <span className="sm:hidden">Multi-Template</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Template Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Core Manufacturing', 'Organization', 'Products & Inventory', 'Business Partners', 'Sales & Orders', 'Manufacturing Planning'].map((category) => {
                    const categoryTypes = supportedDataTypes.filter(dt => dt.category === category);
                    return categoryTypes.length > 0 ? (
                      <div key={category} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">{category}</h4>
                        <div className="space-y-2">
                          {categoryTypes.map((dataType) => (
                            <div key={dataType.key} className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedTemplates.has(dataType.key)}
                                onCheckedChange={() => toggleTemplateSelection(dataType.key)}
                                className="flex-shrink-0"
                              />
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 justify-start"
                                onClick={() => downloadTemplate(dataType.key)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {dataType.label} Template
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>

                {/* Template Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Template Information</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Templates include sample data and proper column headers</li>
                    <li>• Follow the exact format for successful data import</li>
                    <li>• Required fields are marked with * in the template headers</li>
                    <li>• Remove sample rows before adding your actual data</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Sample Data Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent 
          className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Sample Data Generation
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Let AI generate realistic sample data for your manufacturing company based on your onboarding information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Company Info Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Company Information</h3>
              <div className="text-sm text-blue-800">
                <p>AI will generate data based on your company information from the onboarding process.</p>
                {(() => {
                  const dataTypesToGenerate = selectedDataTypes.length > 0 ? selectedDataTypes : recommendedDataTypes;
                  return dataTypesToGenerate.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2">
                        {selectedDataTypes.length > 0 ? 'Selected' : 'Recommended'} data types: 
                        <Badge variant="secondary" className="ml-2">{dataTypesToGenerate.length} types</Badge>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {dataTypesToGenerate.map(key => {
                          const dataType = supportedDataTypes.find(dt => dt.key === key);
                          return (
                            <Badge key={key} variant="outline" className="text-xs bg-white/50 dark:bg-gray-800/50">
                              {dataType?.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Sample Size Selection */}
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-medium">Sample Data Size</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(() => {
                  // Get industry-specific descriptions
                  const getIndustryDescriptions = () => {
                    const companyInfo = (userPreferences as any)?.companyInfo || {};
                    const industry = companyInfo.industry?.toLowerCase() || 'general manufacturing';
                    
                    if (industry.includes('automotive')) {
                      return {
                        small: { records: '1-2 plants, 4-6 resources per plant, 8-12 orders per plant, 2-4 operations per order', description: 'Minimal automotive production setup' },
                        medium: { records: '2-4 plants, 5-9 resources per plant, 10-18 orders per plant, 3-6 operations per order', description: 'Typical automotive production' },
                        large: { records: '4-8 plants, 6-10 resources per plant, 12-19 orders per plant, 4-8 operations per order', description: 'Large automotive manufacturing' }
                      };
                    } else if (industry.includes('pharmaceutical')) {
                      return {
                        small: { records: '1-2 plants, 8-12 resources per plant, 25-40 orders per plant, 4-7 operations per order', description: 'Small pharma production setup' },
                        medium: { records: '2-4 plants, 12-18 resources per plant, 40-65 orders per plant, 5-8 operations per order', description: 'Mid-scale pharmaceutical production' },
                        large: { records: '5-15 plants, 20-30 resources per plant, 80-120 orders per plant, 8-12 operations per order', description: 'Enterprise pharmaceutical operations' }
                      };
                    } else if (industry.includes('electronics')) {
                      return {
                        small: { records: '1-2 plants, 5-8 resources per plant, 12-20 orders per plant, 2-4 operations per order', description: 'Small electronics production' },
                        medium: { records: '2-4 plants, 6-10 resources per plant, 15-25 orders per plant, 3-6 operations per order', description: 'Mid-scale electronics manufacturing' },
                        large: { records: '4-7 plants, 9-14 resources per plant, 21-36 orders per plant, 4-8 operations per order', description: 'Large electronics operations' }
                      };
                    } else if (industry.includes('food') || industry.includes('beverage')) {
                      return {
                        small: { records: '1-2 plants, 2-4 resources per plant, 10-18 orders per plant, 2-4 operations per order', description: 'Small food/beverage production' },
                        medium: { records: '2-4 plants, 3-5 resources per plant, 12-20 orders per plant, 3-6 operations per order', description: 'Regional food manufacturing' },
                        large: { records: '3-6 plants, 5-8 resources per plant, 20-30 orders per plant, 4-8 operations per order', description: 'National food/beverage operations' }
                      };
                    } else {
                      return {
                        small: { records: '1-2 plants, 2-3 resources per plant, 3-5 orders per plant, 2-4 operations per order', description: 'Minimal data for quick testing' },
                        medium: { records: '3-5 plants, 2-3 resources per plant, 4-6 orders per plant, 3-5 operations per order', description: 'Balanced dataset for evaluation' },
                        large: { records: '5-10 plants, 2-4 resources per plant, 3-5 orders per plant, 3-5 operations per order', description: 'Comprehensive data for full testing' }
                      };
                    }
                  };
                  
                  const industryDescriptions = getIndustryDescriptions();
                  
                  return [
                    {
                      value: 'small',
                      label: 'Small Sample',
                      description: industryDescriptions.small.description,
                      details: industryDescriptions.small.records,
                      timing: 'Fastest generation (~30 seconds)'
                    },
                    {
                      value: 'medium',
                      label: 'Medium Sample',
                      description: industryDescriptions.medium.description,
                      details: industryDescriptions.medium.records,
                      timing: 'Moderate generation (~45-60 seconds)'
                    },
                    {
                      value: 'large',
                      label: 'Large Sample',
                      description: industryDescriptions.large.description,
                      details: industryDescriptions.large.records,
                      timing: 'Longer generation (~90+ seconds)'
                    }
                  ];
                })().map((option) => (
                  <div
                    key={option.value}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      aiSampleSize === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setAiSampleSize(option.value as 'small' | 'medium' | 'large')}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        aiSampleSize === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {aiSampleSize === option.value && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-gray-800" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          aiSampleSize === option.value ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {option.label}
                        </p>
                        <p className={`text-xs ${
                          aiSampleSize === option.value ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          {option.description}
                        </p>
                        <p className={`text-xs ${
                          aiSampleSize === option.value ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {option.details}
                        </p>
                        <p className={`text-xs font-medium mt-1 ${
                          aiSampleSize === option.value ? 'text-green-700' : 'text-green-600'
                        }`}>
                          {option.timing}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delete Existing Data Option */}
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-3 flex-1">
                    <div>
                      <h4 className="font-medium text-amber-900">Data Generation Options</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        Choose whether to add to existing data or start fresh.
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="delete-existing"
                        checked={deleteExistingData}
                        onCheckedChange={(checked) => setDeleteExistingData(checked === true)}
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <Label 
                          htmlFor="delete-existing" 
                          className="text-sm font-medium text-amber-900 cursor-pointer"
                        >
                          Delete all existing master data first
                        </Label>
                        <p className="text-xs text-amber-700">
                          ⚠️ <strong>Warning:</strong> This will permanently delete all existing plants, resources, capabilities, 
                          production orders, operations, and other master data. This action cannot be undone.
                        </p>
                        {deleteExistingData && (
                          <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                            <p className="text-xs text-red-800 font-medium">
                              🔥 Deletion confirmed: All master data will be permanently removed before generating new data.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Prompt Editor */}
            <div className="space-y-3">
              <Label htmlFor="ai-prompt" className="text-sm sm:text-base font-medium">
                Generation Instructions
              </Label>
              <Textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what kind of sample data you want to generate..."
                className="min-h-[150px] sm:min-h-[200px] text-sm"
                autoFocus={false}
              />
              <p className="text-xs text-muted-foreground">
                Edit the prompt above to customize the AI-generated sample data. The prompt includes your company information and selected data types.
              </p>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAIDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={executeAIGeneration}
              disabled={aiGenerationMutation.isPending}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {aiGenerationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Generate Sample Data</span>
                  <span className="sm:hidden">Generate Data</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Modification Dialog */}
      <Dialog open={showAIModifyDialog} onOpenChange={setShowAIModifyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-purple-600" />
              AI Data Modification
            </DialogTitle>
            <DialogDescription>
              Modify existing data using natural language descriptions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-modify-prompt">Modification Instructions</Label>
              <Textarea
                id="ai-modify-prompt"
                value={aiModifyPrompt}
                onChange={(e) => setAiModifyPrompt(e.target.value)}
                className="min-h-[120px]"
                placeholder="Example: Add 3 CNC machines to Plant A, Update all high priority orders to critical, Remove outdated equipment from Plant B..."
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Examples of modifications:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• "Add 3 CNC machines to Plant A"</li>
                <li>• "Update all high priority orders to critical"</li>
                <li>• "Change all medium priority production orders to high"</li>
                <li>• "Add capability 'Advanced Welding' to all welding resources"</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowAIModifyDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={executeAIModification}
                disabled={aiModifyMutation.isPending || !aiModifyPrompt.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {aiModifyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Modifying...
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Modify Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Generation Summary Dialog */}
      <Dialog open={showAISummary} onOpenChange={setShowAISummary}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI Generation Complete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {aiGenerationResult && (
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {aiGenerationResult.totalRecords || 0}
                </div>
                <p className="text-sm text-gray-600">
                  Records generated across {aiGenerationResult.importResults?.length || 0} data types
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setShowAISummary(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Modification Summary Dialog */}
      <Dialog open={showAIModifySummary} onOpenChange={setShowAIModifySummary}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI Modification Complete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {aiModifyResult && (
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {aiModifyResult.affectedRecords || 0}
                </div>
                <p className="text-sm text-gray-600">
                  Records successfully modified
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setShowAIModifySummary(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      {/* In-Context Feature Selection Dialog */}
      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Edit Feature Selections
            </DialogTitle>
            <DialogDescription>
              Select which features you want to use in your manufacturing management system. Your selections will determine which data types are recommended.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableFeatures.map((feature) => {
                const IconComponent = feature.icon;
                const isSelected = tempSelectedFeatures.includes(feature.id);
                
                return (
                  <div
                    key={feature.id}
                    className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleFeatureToggle(feature.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-5 w-5 items-center justify-center rounded ${
                        isSelected ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleFeatureToggle(feature.id)}
                            className="flex-shrink-0"
                          />
                          <h3 className={`text-sm font-medium ${
                            isSelected ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {feature.name}
                          </h3>
                        </div>
                        <p className={`text-xs mt-1 ${
                          isSelected ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">Selection Summary</h4>
              </div>
              <p className="text-xs text-blue-800">
                {tempSelectedFeatures.length === 0 
                  ? 'No features selected. Select at least one feature to get data recommendations.'
                  : `${tempSelectedFeatures.length} feature${tempSelectedFeatures.length === 1 ? '' : 's'} selected. These will determine your recommended data types for import and setup.`
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setShowFeatureDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={saveFeatureSelection}
              disabled={updateFeaturesMutation.isPending}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {updateFeaturesMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default DataImport;