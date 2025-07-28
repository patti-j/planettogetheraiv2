import React, { useState, useEffect, useCallback } from 'react';
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
import { Upload, Download, FileSpreadsheet, Database, Users, Building, Wrench, Briefcase, CheckCircle, AlertCircle, Plus, Trash2, Grid3X3, ChevronDown, X, MapPin, Building2, Factory, Package, Warehouse, Package2, Hash, ShoppingCart, FileText, ArrowLeftRight, List, Route, TrendingUp, UserCheck, CheckSquare, Square, Calendar, Lightbulb, Sparkles, ExternalLink, Loader2, Edit2, ClipboardList, AlertTriangle, Cog, Search, ChevronLeft, ChevronRight, ChevronUp, ArrowUpDown, Filter, Eye, EyeOff, Info } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { useAuth } from '@/hooks/useAuth';

interface ImportStatus {
  type: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  count?: number;
}

function DataImport() {
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [recommendedDataTypes, setRecommendedDataTypes] = useState<string[]>([]);
  const [onboardingFeatures, setOnboardingFeatures] = useState<string[]>([]);
  
  // Smart filtering state
  const [showAllDataTypes, setShowAllDataTypes] = useState(false);
  const [dataTypeUsage, setDataTypeUsage] = useState<Record<string, number>>({});
  
  // Data type selector for Manage Data tab - default to resources which has sample data
  const [selectedManageDataType, setSelectedManageDataType] = useState('resources');
  
  // AI Generation state
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSampleSize, setAiSampleSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [aiGenerationResult, setAiGenerationResult] = useState<any>(null);
  const [deleteExistingData, setDeleteExistingData] = useState(false);

  // AI Modification state
  const [showAIModifyDialog, setShowAIModifyDialog] = useState(false);
  const [aiModifyPrompt, setAiModifyPrompt] = useState('');
  const [aiModifyResult, setAiModifyResult] = useState<any>(null);
  const [showAIModifySummary, setShowAIModifySummary] = useState(false);

  // Feature to data requirements mapping
  const featureDataRequirements = {
    'production-scheduling': ['plants', 'resources', 'capabilities', 'productionOrders', 'operations'],
    'resource-management': ['plants', 'resources', 'capabilities'],
    'job-management': ['productionOrders', 'resources', 'plants', 'operations'],
    'capacity-planning': ['resources', 'capabilities', 'plants', 'productionOrders', 'operations'],
    'inventory-management': ['inventoryItems', 'storageLocations', 'plants'],
    'quality-management': ['resources', 'plants', 'productionOrders', 'operations'],
    'maintenance-scheduling': ['resources', 'plants', 'users'],
    'procurement': ['vendors', 'resources', 'plants'],
    'sales-orders': ['customers', 'productionOrders', 'plants'],
    'user-management': ['users', 'plants'],
    'analytics-reporting': ['plants', 'resources', 'productionOrders', 'operations']
  };

  const [showConsolidatedDialog, setShowConsolidatedDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMaxOpen } = useMaxDock();
  const { user } = useAuth();

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
    staleTime: 0, // Force fresh data
  });

  // Load recommended data types from onboarding features
  useEffect(() => {
    console.log('Master Data Setup effect triggered with onboarding data:', onboardingData);
    
    if (onboardingData?.selectedFeatures) {
      const features = onboardingData.selectedFeatures;
      setOnboardingFeatures(features);
      
      // Collect recommended data types based on selected features
      const recommendedTypes = new Set<string>();
      features.forEach((feature: string) => {
        const requirements = featureDataRequirements[feature as keyof typeof featureDataRequirements];
        if (requirements) {
          requirements.forEach(type => recommendedTypes.add(type));
        }
      });
      
      const recommendedArray = Array.from(recommendedTypes);
      setRecommendedDataTypes(recommendedArray);
      
      console.log('Recommended data types based on features:', recommendedArray);
      console.log('Selected features:', features);
    }
  }, [onboardingData]);

  const handleGenerateAISampleData = () => {
    const companyInfo = userPreferences?.companyInfo;
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

  const dataTypes = [
    // Core Manufacturing
    { key: 'resources', label: 'Resources', icon: Wrench, description: 'Equipment, machinery, and personnel' },
    { key: 'productionOrders', label: 'Production Orders', icon: Briefcase, description: 'Active production work orders' },
    { key: 'operations', label: 'Operations', icon: Cog, description: 'Manufacturing operations and processes' },
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
    
    // Business Partners
    { key: 'vendors', label: 'Vendors', icon: Building2, description: 'Suppliers and vendor information' },
    { key: 'customers', label: 'Customers', icon: Users, description: 'Customer accounts and information' },
    
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
      sites: 'sites',
      departments: 'departments',
      workCenters: 'work-centers',
      employees: 'employees',
      items: 'items',
      storageLocations: 'storage-locations',
      inventory: 'inventory',
      inventoryLots: 'inventory-lots',
      salesOrders: 'sales-orders',
      purchaseOrders: 'purchase-orders',
      transferOrders: 'transfer-orders',
      billsOfMaterial: 'bills-of-material',
      routings: 'routings',
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
      sites: 'sites',
      departments: 'departments',
      workCenters: 'work_centers',
      employees: 'employees',
      items: 'items',
      storageLocations: 'storage_locations',
      inventory: 'inventory',
      inventoryLots: 'inventory_lots',
      salesOrders: 'sales_orders',
      purchaseOrders: 'purchase_orders',
      transferOrders: 'transfer_orders',
      billsOfMaterial: 'bills_of_material',
      routings: 'routings',
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
      case 'sites':
        return `Location: ${item.location || ''} • Type: ${item.type || ''}`;
      case 'departments':
        return `Manager: ${item.manager || ''} • Site: ${item.siteId || ''}`;
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
      case 'forecasts':
        return `Period: ${item.period || ''} • Demand: ${item.forecast || ''}`;
      default:
        return item.description || item.type || item.status || '';
    }
  };

  // Component for managing existing data
  function ManageDataTab({ dataType }: { dataType: string }) {
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [searchTerm, setSearchTerm] = useState('');
    const [bulkSelectMode, setBulkSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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
        <TableRow className={`relative ${isSelected && bulkSelectMode ? 'bg-blue-50' : ''}`}>
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
                <div className="text-sm text-gray-500 sm:hidden">
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
    const itemsPerPage = 10;

    // Map data types to table names for pagination API
    const getTableName = (dataType: string) => {
      const mapping: Record<string, string> = {
        'plants': 'plants',
        'resources': 'resources',
        'capabilities': 'capabilities',
        'productionOrders': 'production_orders',
        'operations': 'operations',
        'plannedOrders': 'planned_orders',
        'vendors': 'vendors',
        'customers': 'customers',
        'users': 'users',
        'sites': 'sites',
        'departments': 'departments',
        'workCenters': 'work_centers',
        'employees': 'employees',
        'items': 'items',
        'storageLocations': 'storage_locations',
        'inventory': 'inventory',
        'inventoryLots': 'inventory_lots',
        'salesOrders': 'sales_orders',
        'purchaseOrders': 'purchase_orders',
        'transferOrders': 'transfer_orders',
        'billsOfMaterial': 'bills_of_material',
        'routings': 'routings',
        'forecasts': 'forecasts',
        'stockItems': 'stock_items'
      };
      return mapping[dataType] || dataType;
    };

    // Use high-performance pagination API
    const { data: paginatedData, isLoading, error } = useQuery({
      queryKey: [`/api/data-management/${getTableName(dataType)}`, currentPage, searchTerm],
      queryFn: async () => {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`/api/data-management/${getTableName(dataType)}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            pagination: {
              page: currentPage,
              limit: itemsPerPage
            },
            search: searchTerm ? {
              query: searchTerm,
              fields: ['name', 'description']
            } : undefined,
            sort: [{ field: 'name', direction: 'asc' }]
          })
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        return response.json();
      },
      enabled: !!dataType
    });

    // Extract data and pagination info from API response
    const currentItems = paginatedData?.data || [];
    const pagination = paginatedData?.pagination || {
      page: 1,
      limit: itemsPerPage,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    };

    // Reset to page 1 when search term changes
    React.useEffect(() => {
      setCurrentPage(1);
      setSelectedItems(new Set());
      setBulkSelectMode(false);
    }, [searchTerm, dataType]);

    // Update mutation
    const updateMutation = useMutation({
      mutationFn: async (updatedItem: any) => {
        const authToken = localStorage.getItem('authToken');
        const endpoint = getApiEndpoint(dataType);
        const response = await fetch(`/api/${endpoint}/${updatedItem.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(updatedItem)
        });
        if (!response.ok) throw new Error('Failed to update item');
        return response.json();
      },
      onSuccess: () => {
        toast({ title: "Success", description: "Item updated successfully" });
        queryClient.invalidateQueries({ queryKey: [`/api/data-management/${getTableName(dataType)}`] });
        setEditingItem(null);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
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
        queryClient.invalidateQueries({ queryKey: [`/api/data-management/${getTableName(dataType)}`] });
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
        const endpoint = getApiEndpoint(dataType);
        const response = await fetch(`/api/${endpoint}/${id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (!response.ok) throw new Error('Failed to delete item');
        return response.json();
      },
      onSuccess: () => {
        toast({ title: "Success", description: "Item deleted successfully" });
        queryClient.invalidateQueries({ queryKey: [`/api/data-management/${getTableName(dataType)}`] });
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
        queryClient.invalidateQueries({ queryKey: [`/api/data-management/${getTableName(dataType)}`] });
        setSelectedItems(new Set());
        setBulkSelectMode(false);
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });

    if (isLoading) {
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
              {pagination.total} items found • Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
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
        {viewMode === 'table' ? (
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
                    <span className="hidden sm:block">Name</span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Details</TableHead>
                  <TableHead className="hidden sm:table-cell w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((item) => (
                  <MobileTableRow 
                    key={item.id} 
                    item={item} 
                    dataType={dataType}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => deleteMutation.mutate(item.id)}
                  />
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{item.name}</h4>
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
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
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
    <div className={`
      p-3 sm:p-6 space-y-4 sm:space-y-6
      ml-3 mr-3
      ${isMaxOpen ? 'md:ml-0 md:mr-0' : 'md:ml-12 md:mr-12'}
      max-w-full overflow-x-hidden
    `}>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-xl md:text-2xl font-bold">Master Data Setup</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
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
          <Button 
            onClick={() => setShowConsolidatedDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Consolidated Template</span>
            <span className="sm:hidden">Multi-Template</span>
          </Button>
        </div>
      </div>

      {/* Feature-Based Recommendations */}
      {recommendedDataTypes.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Lightbulb className="h-5 w-5" />
              Recommended Data for Your Selected Features
            </CardTitle>
            <CardDescription className="text-blue-700">
              Based on your onboarding feature selections, these data elements are recommended to get started quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-800">Selected Features:</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('/onboarding?step=1', '_blank')}
                    className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {onboardingFeatures.map((feature) => (
                    <Badge key={feature} variant="outline" className="border-blue-300 text-blue-800">
                      {feature.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Recommended data types: {recommendedDataTypes.length} types</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendedDataTypes.map((type) => {
                    const dataType = dataTypes.find(dt => dt.key === type);
                    return dataType ? (
                      <Badge key={type} className="bg-blue-100 text-blue-800 border-blue-300">
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

      {/* Main Content */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <Tabs defaultValue="manage">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="manage" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Manage Data</span>
                <span className="sm:hidden">Manage</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Import Data</span>
                <span className="sm:hidden">Import</span>
              </TabsTrigger>
              <TabsTrigger value="structured" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Structured Entry</span>
                <span className="sm:hidden">Structured</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Text Entry</span>
                <span className="sm:hidden">Text</span>
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
                  <div className="w-full sm:w-64">
                    <Select value={selectedManageDataType} onValueChange={setSelectedManageDataType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Core Manufacturing</div>
                        <SelectItem value="resources">Resources</SelectItem>
                        <SelectItem value="productionOrders">Production Orders</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="plannedOrders">Planned Orders</SelectItem>
                        <SelectItem value="capabilities">Capabilities</SelectItem>
                        <SelectItem value="plants">Plants</SelectItem>
                        
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-t mt-1 pt-2">Organization</div>
                        <SelectItem value="sites">Sites</SelectItem>
                        <SelectItem value="departments">Departments</SelectItem>
                        <SelectItem value="workCenters">Work Centers</SelectItem>
                        <SelectItem value="employees">Employees</SelectItem>
                        
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-t mt-1 pt-2">Products & Inventory</div>
                        <SelectItem value="items">Items</SelectItem>
                        <SelectItem value="storageLocations">Storage Locations</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="inventoryLots">Inventory Lots</SelectItem>
                        
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-t mt-1 pt-2">Business Partners</div>
                        <SelectItem value="vendors">Vendors</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-t mt-1 pt-2">Sales & Orders</div>
                        <SelectItem value="salesOrders">Sales Orders</SelectItem>
                        <SelectItem value="purchaseOrders">Purchase Orders</SelectItem>
                        <SelectItem value="transferOrders">Transfer Orders</SelectItem>
                        
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-t mt-1 pt-2">Manufacturing Planning</div>
                        <SelectItem value="billsOfMaterial">Bills of Material</SelectItem>
                        <SelectItem value="routings">Routings</SelectItem>
                        <SelectItem value="forecasts">Forecasts</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
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
                  <h3 className="text-lg font-medium mb-2">Import CSV Data</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload CSV files to import your manufacturing data</p>
                </div>
                
                {/* Data Type Selection for Import */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="import-data-type">Select Data Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose data type to import" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resources">Resources</SelectItem>
                        <SelectItem value="plants">Plants</SelectItem>
                        <SelectItem value="capabilities">Capabilities</SelectItem>
                        <SelectItem value="productionOrders">Production Orders</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="vendors">Vendors</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
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
            </TabsContent>
            
            <TabsContent value="structured" className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Structured Data Entry</h3>
                  <p className="text-sm text-gray-600 mb-4">Enter data in spreadsheet format for quick bulk entry</p>
                </div>

                {/* Data Type Selection for Structured Entry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="structured-data-type">Select Data Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose data type to enter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resources">Resources</SelectItem>
                        <SelectItem value="plants">Plants</SelectItem>
                        <SelectItem value="capabilities">Capabilities</SelectItem>
                        <SelectItem value="productionOrders">Production Orders</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Row
                    </Button>
                  </div>
                </div>

                {/* Spreadsheet-like Interface Placeholder */}
                <div className="border rounded-lg">
                  <div className="bg-gray-50 p-3 border-b">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium">
                      <div>Name</div>
                      <div>Type</div>
                      <div>Description</div>
                      <div>Actions</div>
                    </div>
                  </div>
                  <div className="p-4 text-center text-gray-500">
                    <Grid3X3 className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Select a data type above to start entering data</p>
                  </div>
                </div>
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
                        <SelectItem value="resources">Resources</SelectItem>
                        <SelectItem value="plants">Plants</SelectItem>
                        <SelectItem value="capabilities">Capabilities</SelectItem>
                        <SelectItem value="productionOrders">Production Orders</SelectItem>
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
                <div>
                  <h3 className="text-lg font-medium mb-2">Download Templates</h3>
                  <p className="text-sm text-gray-600 mb-4">Download CSV templates with sample data and proper formatting</p>
                </div>

                {/* Template Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Core Manufacturing */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Core Manufacturing</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Resources Template
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Plants Template
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Capabilities Template
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Production Orders Template
                      </Button>
                    </div>
                  </div>

                  {/* Business Partners */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Business Partners</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Vendors Template
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Customers Template
                      </Button>
                    </div>
                  </div>

                  {/* Inventory & Orders */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Inventory & Orders</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Items Template
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Storage Locations Template
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Sales Orders Template
                      </Button>
                    </div>
                  </div>
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
    </div>
  );
}

export default DataImport;