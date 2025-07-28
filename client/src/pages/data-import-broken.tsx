import { useState, useEffect, useCallback } from 'react';
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
import { Upload, Download, FileSpreadsheet, Database, Users, Building, Wrench, Briefcase, CheckCircle, AlertCircle, Plus, Trash2, Grid3X3, ChevronDown, X, MapPin, Building2, Factory, Package, Warehouse, Package2, Hash, ShoppingCart, FileText, ArrowLeftRight, List, Route, TrendingUp, UserCheck, CheckSquare, Square, Calendar, Lightbulb, Sparkles, ExternalLink, Loader2, Edit2, ClipboardList, AlertTriangle, Cog, Search, ChevronLeft, ChevronRight, ChevronUp, ArrowUpDown, Filter, Eye, EyeOff, Info } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { useAuth } from '@/hooks/useAuth';

// Simple debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface ImportStatus {
  type: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  count?: number;
}

// Component for managing existing data
function ManageDataTab({ dataType }: { dataType: string }) {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // High-performance paginated query
  const { data: paginatedData, isLoading } = useQuery({
    queryKey: [`/api/data-management/${getTableName(dataType)}`, currentPage, pageSize, searchQuery, sortField, sortDirection],
    queryFn: async () => {
      const requestBody = {
        pagination: {
          page: currentPage,
          limit: pageSize
        },
        ...(searchQuery && {
          search: {
            query: searchQuery,
            fields: ['name', 'description'] // Search in name and description fields
          }
        }),
        ...(sortField && {
          sort: {
            field: sortField,
            direction: sortDirection
          }
        })
      };
      
      const response = await fetch(`/api/data-management/${getTableName(dataType)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    },
    enabled: true
  });

  const items = paginatedData?.data || [];
  const totalItems = paginatedData?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  function getTableName(type: string): string {
    const tableNames: Record<string, string> = {
      'plants': 'plants',
      'resources': 'resources', 
      'capabilities': 'capabilities',
      'productionOrders': 'production_orders',
      'users': 'users',
      'vendors': 'vendors',
      'customers': 'customers'
    };
    return tableNames[type] || type;
  }

  function getApiEndpoint(type: string): string {
    const endpoints: Record<string, string> = {
      'plants': 'plants',
      'resources': 'resources', 
      'capabilities': 'capabilities',
      'productionOrders': 'jobs',
      'users': 'users',
      'vendors': 'vendors',
      'customers': 'customers'
    };
    return endpoints[type] || type;
  }

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setCurrentPage(1); // Reset to first page on search
    }, 300),
    []
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const updateMutation = useMutation({
    mutationFn: async (item: any) => {
      const endpoint = getApiEndpoint(dataType);
      const response = await fetch(`/api/${endpoint}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
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

  const createMutation = useMutation({
    mutationFn: async (item: any) => {
      const endpoint = getApiEndpoint(dataType);
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const endpoint = getApiEndpoint(dataType);
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'DELETE'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Search, Filters and Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium">Existing {dataType} Data</h3>
            <p className="text-sm text-gray-600">
              {isLoading ? 'Loading...' : `${totalItems} items found`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Filters and Search Row */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${dataType}...`}
              className="pl-10"
              onChange={(e) => debouncedSearch(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {getCategoryOptions(dataType).length > 1 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {getCategoryOptions(dataType).map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Display */}
      {totalItems === 0 && !isLoading ? (
        <div className="text-center py-8 text-gray-500">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No {dataType} data found.</p>
          <p className="text-sm">Use the other tabs to import data or click "Add New" to create manually.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('name')}>
                    Name
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                    {sortField !== 'name' && <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('description')}>
                    Description
                    {sortField === 'description' && (
                      sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                    {sortField !== 'description' && <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  </TableRow>
                ))
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name || item.orderNumber || item.username || item.vendorName || item.customerName || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.description || item.email || item.contactName || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {renderItemDetails(item, dataType)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: pageSize }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            ))
          ) : (
            items.map((item: any) => (
              <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div className="p-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {item.name || item.orderNumber || item.username || item.vendorName || item.customerName || 'N/A'}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.description || item.email || item.contactName || 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {renderItemDetails(item, dataType)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

          
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border rounded-lg">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
          </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = index + 1;
                    } else if (currentPage <= 3) {
                      pageNum = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + index;
                    } else {
                      pageNum = currentPage - 2 + index;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
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

// Get category filter options for a data type
function getCategoryOptions(dataType: string) {
  const categories: Record<string, Array<{value: string, label: string}>> = {
    "resources": [
      { value: "all", label: "All Resources" },
      { value: "machinery", label: "Machinery" },
      { value: "personnel", label: "Personnel" },
      { value: "equipment", label: "Equipment" }
    ],
    "capabilities": [
      { value: "all", label: "All Capabilities" },
      { value: "technical", label: "Technical" },
      { value: "operational", label: "Operational" },
      { value: "quality", label: "Quality" }
    ],
    "productionOrders": [
      { value: "all", label: "All Orders" },
      { value: "active", label: "Active" },
      { value: "pending", label: "Pending" },
      { value: "completed", label: "Completed" }
    ],
    "plants": [
      { value: "all", label: "All Plants" },
      { value: "manufacturing", label: "Manufacturing" },
      { value: "assembly", label: "Assembly" },
      { value: "distribution", label: "Distribution" }
    ]
  };
  
  return categories[dataType] || [{ value: "all", label: "All Items" }];
}
    case 'plants':
      return item.location || 'No location';
    case 'resources':
      return item.type || 'No type';
    case 'capabilities':
      return item.category || 'No category';
    case 'productionOrders':
      return `${item.status} - ${item.customer || 'No customer'}`;
    case 'users':
      return item.role || 'No role';
    case 'vendors':
      return `${item.vendorType || 'N/A'} - ${item.contactEmail || 'No email'}`;
    case 'customers':
      return `${item.customerTier || 'N/A'} - ${item.contactEmail || 'No email'}`;
    default:
      return 'N/A';
  }
}



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

  const renderFormFields = () => {
    switch (dataType) {
      case 'plants':
        return (
          <>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone || ''}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                />
              </div>
            </div>
          </>
        );
      case 'resources':
        return (
          <>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
            </div>
          </>
        );
      case 'capabilities':
        return (
          <>
            <div className="grid gap-4">
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
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
          </>
        );
      default:
        return (
          <div className="text-center py-4 text-gray-500">
            Form fields for {dataType} not yet implemented.
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderFormFields()}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isNew ? 'Create' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

export default function DataImport() {
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [recommendedDataTypes, setRecommendedDataTypes] = useState<string[]>([]);
  const [onboardingFeatures, setOnboardingFeatures] = useState<string[]>([]);
  
  // Smart filtering state
  const [showAllDataTypes, setShowAllDataTypes] = useState(false);
  const [dataTypeUsage, setDataTypeUsage] = useState<Record<string, number>>({});
  
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

  // Debug logging for onboarding data
  useEffect(() => {
    console.log('Onboarding query state:', { 
      user: !!user, 
      onboardingData, 
      onboardingLoading, 
      onboardingError 
    });
  }, [user, onboardingData, onboardingLoading, onboardingError]);

  // Load recommended data types from onboarding features
  useEffect(() => {
    console.log('Master Data Setup effect triggered with onboarding data:', onboardingData);
    
    // Only process when onboarding data is available (not loading)
    if (onboardingData !== undefined) {
      console.log('Processing onboarding data, selected features:', (onboardingData as any)?.selectedFeatures);
      
      // Load features from onboarding data if available
      if (onboardingData && (onboardingData as any).selectedFeatures && (onboardingData as any).selectedFeatures.length > 0) {
        const features = (onboardingData as any).selectedFeatures;
        setOnboardingFeatures(features);
        
        // Convert onboarding features to recommended data types
        const recommendedTypes = new Set<string>();
        features.forEach((feature: string) => {
          const dataTypes = featureDataRequirements[feature as keyof typeof featureDataRequirements];
          if (dataTypes) {
            dataTypes.forEach(type => recommendedTypes.add(type));
          }
        });
        
        const recommendedArray = Array.from(recommendedTypes);
        setRecommendedDataTypes(recommendedArray);
        console.log('Loaded onboarding features:', features, 'Recommended data types:', recommendedArray);
      } else {
        // Fallback: provide default recommended data types for basic manufacturing setup
        const defaultRecommendedTypes = ['plants', 'resources', 'capabilities', 'productionOrders', 'operations'];
        setRecommendedDataTypes(defaultRecommendedTypes);
        setOnboardingFeatures([]);
        console.log('No onboarding features found, using default recommended data types:', defaultRecommendedTypes);
      }
    }
  }, [onboardingData]);

  // No localStorage saving - selections are session-only

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
    plants: '',
    vendors: '',
    customers: ''
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
    plannedOrders: [{ name: '', customer: '', priority: 'medium', dueDate: '', quantity: 1, description: '', planType: 'forecast' }],
    vendors: [{ vendorNumber: '', vendorName: '', vendorType: 'supplier', contactName: '', contactEmail: '', contactPhone: '', address: '', city: '', state: '', zipCode: '', country: 'US', paymentTerms: 'net30', status: 'active' }],
    customers: [{ customerNumber: '', customerName: '', contactName: '', contactEmail: '', contactPhone: '', address: '', city: '', state: '', zipCode: '', country: 'US', customerTier: 'standard', status: 'active' }]
  });

  const importMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/data-import/bulk', data);
      return await response.json();
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

  const aiGenerationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/data-import/generate-sample-data', data);
      return await response.json();
    },
    onSuccess: (result: any) => {
      console.log('AI Generation Success Result:', result);
      setAiGenerationResult(result);
      setShowAIDialog(false);
      setShowAISummary(true);
      queryClient.invalidateQueries();
      
      // Parse the actual response structure from the backend
      const recordCount = result.totalRecords || 0;
      const typeCount = result.importResults?.length || Object.keys(result.generatedData || {}).length || 0;
      
      toast({
        title: "AI Sample Data Generated",
        description: `Successfully generated ${recordCount} records across ${typeCount} data types.`,
      });
    },
    onError: (error) => {
      console.error('AI Generation Error:', error);
      toast({
        title: "AI Generation Failed",
        description: "There was an error generating sample data. Please try again.",
        variant: "destructive",
      });
    }
  });

  const aiModificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/data-import/modify-data', data);
      return await response.json();
    },
    onSuccess: (result: any) => {
      console.log('AI Modification Success Result:', result);
      setAiModifyResult(result);
      setShowAIModifyDialog(false);
      setShowAIModifySummary(true);
      queryClient.invalidateQueries();
      
      const modifiedCount = result.modifiedRecords || 0;
      const modifiedTypes = result.modifiedTypes || [];
      
      toast({
        title: "AI Data Modification Complete",
        description: `Successfully modified ${modifiedCount} records across ${modifiedTypes.length} data types.`,
      });
    },
    onError: (error) => {
      console.error('AI Modification Error:', error);
      toast({
        title: "AI Modification Failed",
        description: "There was an error modifying the data. Please try again.",
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
      case 'operations':
        return data.map(item => {
          let requiredCapabilities = item.requiredCapabilities || item['Required Capabilities'] || [];
          
          // Handle different formats of capabilities data
          if (typeof requiredCapabilities === 'string') {
            requiredCapabilities = requiredCapabilities.split(',').map((cap: string) => cap.trim()).filter(Boolean);
          } else if (!Array.isArray(requiredCapabilities)) {
            requiredCapabilities = [];
          }
          
          return {
            name: item.name || item.Name || item.Operation || '',
            productionOrderId: parseInt(item.productionOrderId || item['Production Order ID'] || '1'),
            description: item.description || item.Description || '',
            duration: parseFloat(item.duration || item.Duration || '1'),
            sequence: parseInt(item.sequence || item.Sequence || '1'),
            status: item.status || item.Status || 'pending',
            requiredCapabilities: requiredCapabilities
          };
        });
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
      case 'operations':
        return [
          { key: 'name', label: 'Operation Name', type: 'text', required: true },
          { key: 'productionOrderId', label: 'Production Order ID', type: 'number', required: true },
          { key: 'description', label: 'Description', type: 'text' },
          { key: 'duration', label: 'Duration (hours)', type: 'number', required: true },
          { key: 'sequence', label: 'Sequence Order', type: 'number', required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in-progress', 'completed', 'on-hold'], required: true },
          { key: 'requiredCapabilities', label: 'Required Capabilities', type: 'multiselect', placeholder: 'Select capabilities' }
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
          { key: 'timezone', label: 'Timezone', type: 'select', options: [
            'UTC',
            // North America
            'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
            'America/Toronto', 'America/Vancouver', 'America/Montreal', 'America/Phoenix',
            'America/Anchorage', 'America/Mexico_City', 'America/Cancun', 'America/Tijuana',
            // South America
            'America/Sao_Paulo', 'America/Buenos_Aires', 'America/Lima', 'America/Santiago',
            'America/Bogota', 'America/Caracas', 'America/Montevideo', 'America/La_Paz',
            // Europe
            'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Rome', 'Europe/Madrid',
            'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Zurich',
            'Europe/Prague', 'Europe/Warsaw', 'Europe/Stockholm', 'Europe/Oslo',
            'Europe/Copenhagen', 'Europe/Helsinki', 'Europe/Athens', 'Europe/Budapest',
            'Europe/Bucharest', 'Europe/Sofia', 'Europe/Zagreb', 'Europe/Belgrade',
            'Europe/Moscow', 'Europe/Kiev', 'Europe/Minsk', 'Europe/Vilnius',
            'Europe/Riga', 'Europe/Tallinn', 'Europe/Dublin', 'Europe/Lisbon',
            // Asia
            'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore',
            'Asia/Bangkok', 'Asia/Jakarta', 'Asia/Manila', 'Asia/Kuala_Lumpur',
            'Asia/Ho_Chi_Minh', 'Asia/Mumbai', 'Asia/Delhi', 'Asia/Kolkata',
            'Asia/Dhaka', 'Asia/Karachi', 'Asia/Tehran', 'Asia/Dubai', 'Asia/Riyadh',
            'Asia/Kuwait', 'Asia/Baghdad', 'Asia/Baku', 'Asia/Tashkent', 'Asia/Almaty',
            'Asia/Yekaterinburg', 'Asia/Novosibirsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk',
            'Asia/Vladivostok', 'Asia/Magadan', 'Asia/Kamchatka',
            // Middle East
            'Asia/Jerusalem', 'Asia/Beirut', 'Asia/Damascus', 'Asia/Amman',
            // Africa
            'Africa/Cairo', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg',
            'Africa/Cape_Town', 'Africa/Casablanca', 'Africa/Tunis', 'Africa/Algiers',
            'Africa/Addis_Ababa', 'Africa/Dar_es_Salaam', 'Africa/Kampala',
            // Australia & Oceania
            'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane',
            'Australia/Perth', 'Australia/Adelaide', 'Australia/Darwin',
            'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu', 'Pacific/Guam',
            'Pacific/Port_Moresby', 'Pacific/Noumea', 'Pacific/Tahiti'
          ], required: true }
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

  // Helper function to safely access company info from user preferences
  const getCompanyInfoFromPreferences = () => {
    try {
      const prefs = userPreferences as any;
      if (prefs && prefs.companyInfo && typeof prefs.companyInfo === 'object' && Object.keys(prefs.companyInfo).length > 0) {
        return prefs.companyInfo;
      }
    } catch (error) {
      console.warn('Error accessing company info from preferences:', error);
    }
    return null;
  };

  // Initialize AI prompt based on company information
  const initializeAIPrompt = () => {
    let companyInfo = {
      name: 'Manufacturing Company',
      industry: 'General Manufacturing',
      size: 'Medium',
      description: 'A manufacturing company',
      website: '',
      numberOfPlants: '1',
      products: ''
    };

    // First try to get company info from user preferences (database)
    const prefsCompanyInfo = getCompanyInfoFromPreferences();
    if (prefsCompanyInfo) {
      companyInfo = { ...companyInfo, ...prefsCompanyInfo };
    } else {
      // Fallback to localStorage for backwards compatibility or anonymous users
      const onboardingCompanyInfo = localStorage.getItem('onboarding-company-info');
      if (onboardingCompanyInfo) {
        try {
          const parsed = JSON.parse(onboardingCompanyInfo);
          companyInfo = { ...companyInfo, ...parsed };
        } catch (error) {
          console.warn('Failed to parse onboarding company info:', error);
        }
      }
    }

    const defaultPrompt = `Generate comprehensive sample data for ${companyInfo.name}, a ${companyInfo.size.toLowerCase()} ${companyInfo.industry.toLowerCase()} company.

Company Details:
- Company Name: ${companyInfo.name}
- Industry: ${companyInfo.industry}
- Company Size: ${companyInfo.size}
- Number of Plants: ${companyInfo.numberOfPlants || '1'}
${companyInfo.website ? `- Website: ${companyInfo.website}` : ''}
${companyInfo.products ? `- Main Products & Production Process: ${companyInfo.products}` : ''}
${companyInfo.description ? `- Description: ${companyInfo.description}` : ''}

Please create realistic manufacturing data that reflects:
- Industry-specific equipment and processes typical for ${companyInfo.industry.toLowerCase()} companies
- Appropriate naming conventions using "${companyInfo.name}" as the company reference
- Realistic production volumes and timelines for a ${companyInfo.size.toLowerCase()} operation
- Proper organizational structure across ${companyInfo.numberOfPlants || '1'} manufacturing location(s)
${companyInfo.products ? `- Manufacturing operations, resources, and workflows based on the production process: ${companyInfo.products}` : ''}

Focus on creating authentic, interconnected data that would be typical for ${companyInfo.name} in the ${companyInfo.industry.toLowerCase()} sector, with manufacturing operations that reflect their actual production process.`;

    setAiPrompt(defaultPrompt);
    return companyInfo;
  };

  const handleGenerateAISampleData = () => {
    const companyInfo = initializeAIPrompt();
    setShowAIDialog(true);
  };

  const executeAIGeneration = () => {
    let companyInfo = {
      name: 'Manufacturing Company',
      industry: 'General Manufacturing',
      size: 'Medium',
      description: 'A manufacturing company',
      website: '',
      numberOfPlants: '1',
      products: ''
    };

    // First try to get company info from user preferences (database)
    const prefsCompanyInfo = getCompanyInfoFromPreferences();
    if (prefsCompanyInfo) {
      companyInfo = { ...companyInfo, ...prefsCompanyInfo };
    } else {
      // Fallback to localStorage for backwards compatibility or anonymous users
      const onboardingCompanyInfo = localStorage.getItem('onboarding-company-info');
      if (onboardingCompanyInfo) {
        try {
          const parsed = JSON.parse(onboardingCompanyInfo);
          companyInfo = { ...companyInfo, ...parsed };
        } catch (error) {
          console.warn('Failed to parse onboarding company info:', error);
        }
      }
    }

    // Use recommended data types if no data types are manually selected
    const dataTypesToGenerate = selectedDataTypes.length > 0 ? selectedDataTypes : recommendedDataTypes;
    
    if (dataTypesToGenerate.length === 0) {
      toast({
        title: "No Data Types Selected",
        description: "Please select at least one data type to generate.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog if delete existing data is selected
    if (deleteExistingData) {
      const confirmed = window.confirm(
        "⚠️ WARNING: This will permanently delete ALL existing master data (plants, resources, capabilities, production orders, operations, etc.) before generating new sample data.\n\n" +
        "This action CANNOT BE UNDONE.\n\n" +
        "Are you absolutely sure you want to proceed?"
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    console.log('Data types for AI generation:', dataTypesToGenerate);
    console.log('Selected data types:', selectedDataTypes);
    console.log('Recommended data types:', recommendedDataTypes);
    console.log('Delete existing data:', deleteExistingData);

    aiGenerationMutation.mutate({
      prompt: aiPrompt,
      companyInfo,
      selectedDataTypes: dataTypesToGenerate,
      sampleSize: aiSampleSize,
      deleteExistingData
    });
  };

  const executeAIModification = () => {
    if (!aiModifyPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please describe what changes you want to make to your master data.",
        variant: "destructive",
      });
      return;
    }

    aiModificationMutation.mutate({
      modificationPrompt: aiModifyPrompt
    });
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

  // Smart filtering functions
  const getDataTypePriority = (dataType: string): 'essential' | 'useful' | 'advanced' => {
    // Essential data types needed for core manufacturing
    const essentialTypes = ['plants', 'resources', 'capabilities', 'productionOrders', 'operations'];
    
    // Useful data types for enhanced functionality
    const usefulTypes = ['inventoryItems', 'storageLocations', 'users', 'workCenters'];
    
    if (essentialTypes.includes(dataType)) return 'essential';
    if (usefulTypes.includes(dataType)) return 'useful';
    return 'advanced';
  };

  const getFilteredDataTypes = () => {
    if (showAllDataTypes) {
      return dataTypes; // Show all data types
    }

    // Filter to show only relevant data types
    const relevantTypes = new Set<string>();
    
    // Always include recommended types from onboarding
    recommendedDataTypes.forEach(type => relevantTypes.add(type));
    
    // Include essential types for basic manufacturing
    const essentialTypes = ['plants', 'resources', 'capabilities', 'productionOrders', 'operations'];
    essentialTypes.forEach(type => relevantTypes.add(type));
    
    // Filter out truly unused advanced types (ones that have never been used)
    return dataTypes.filter(dataType => {
      if (relevantTypes.has(dataType.key)) return true;
      
      const priority = getDataTypePriority(dataType.key);
      if (priority === 'essential') return true;
      
      // Show useful types if they've been used or if no specific features selected
      if (priority === 'useful') {
        const hasBeenUsed = dataTypeUsage[dataType.key] > 0;
        const noFeatureSpecific = recommendedDataTypes.length === 0;
        return hasBeenUsed || noFeatureSpecific;
      }
      
      // Advanced types only shown if specifically needed or heavily used
      const usage = dataTypeUsage[dataType.key] || 0;
      return usage > 5; // Show if used more than 5 times
    });
  };

  const getDataTypesByCategory = () => {
    const filteredTypes = getFilteredDataTypes();
    
    // Group filtered data types by category
    const categories = [
      { category: 'Core Manufacturing', types: [] as any[] },
      { category: 'Organizational Structure', types: [] as any[] },
      { category: 'Products & Inventory', types: [] as any[] },
      { category: 'Orders & Transactions', types: [] as any[] },
      { category: 'Manufacturing Planning', types: [] as any[] },
      { category: 'System Users', types: [] as any[] }
    ];

    filteredTypes.forEach((dataType, index) => {
      const originalIndex = dataTypes.findIndex(dt => dt.key === dataType.key);
      if (originalIndex >= 0 && originalIndex < 5) categories[0].types.push(dataType);
      else if (originalIndex >= 5 && originalIndex < 9) categories[1].types.push(dataType);
      else if (originalIndex >= 9 && originalIndex < 13) categories[2].types.push(dataType);
      else if (originalIndex >= 13 && originalIndex < 16) categories[3].types.push(dataType);
      else if (originalIndex >= 16 && originalIndex < 19) categories[4].types.push(dataType);
      else categories[5].types.push(dataType);
    });

    // Filter out empty categories
    return categories.filter(category => category.types.length > 0);
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
            case 'vendors':
              return { vendorNumber: parts[0], vendorName: parts[1] || '', vendorType: parts[2] || 'supplier', contactName: parts[3] || '', contactEmail: parts[4] || '' };
            case 'customers':
              return { customerNumber: parts[0], customerName: parts[1] || '', contactName: parts[2] || '', contactEmail: parts[3] || '', customerTier: parts[4] || 'standard' };
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
      case 'productionOrders':
        return 'Name,Customer,Priority,Due Date,Quantity,Description\nWidget Assembly,ACME Corp,high,2025-02-01,100,Assembly of widget components\nPart Manufacturing,TechCorp,medium,2025-02-15,250,Manufacturing precision parts';
      case 'operations':
        return 'Name,Production Order ID,Description,Duration,Sequence,Status,Required Capabilities\nCNC Machining,1,Machine widget base,2.5,1,pending,CNC Machining\nAssembly,1,Assemble components,1.0,2,pending,Assembly\nQuality Check,1,Final inspection,0.5,3,pending,Quality Control';
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

      // Business Partners
      case 'vendors':
        return 'Vendor Number,Vendor Name,Vendor Type,Contact Name,Contact Email,Contact Phone,Address,City,State,Zip Code,Country,Payment Terms\nVND-001,ChemSupply Industries,supplier,Sarah Williams,sarah@chemsupply.com,555-123-4567,1234 Industrial Blvd,Cleveland,OH,44101,US,net30';
      case 'customers':
        return 'Customer Number,Customer Name,Contact Name,Contact Email,Contact Phone,Address,City,State,Zip Code,Country,Customer Tier\nCUST-001,ACME Corporation,John Manager,john@acme.com,555-987-6543,789 Business Ave,Chicago,IL,60601,US,preferred';
      
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
      case 'operations':
        csvContent = 'Name,Production Order ID,Description,Duration,Sequence,Status,Required Capabilities\nCNC Machining,1,Machine widget base,2.5,1,pending,CNC Machining\nAssembly,1,Assemble components,1.0,2,pending,Assembly\nQuality Check,1,Final inspection,0.5,3,pending,Quality Control';
        filename = 'operations_template.csv';
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

      // Business Partners
      case 'vendors':
        csvContent = 'Vendor Number,Vendor Name,Vendor Type,Contact Name,Contact Email,Contact Phone,Address,City,State,Zip Code,Country,Tax ID,Payment Terms,Currency,Preferred Vendor,Qualification Level,Performance Rating,Status\nVND-001,ChemSupply Industries,supplier,Sarah Williams,sarah@chemsupply.com,555-123-4567,1234 Industrial Blvd,Cleveland,OH,44101,US,12-3456789,net30,USD,true,preferred,9,active\nVND-002,PackageCorp Solutions,supplier,Mike Johnson,mike@packagecorp.com,555-234-5678,789 Supply Chain Ave,Dallas,TX,75201,US,45-6789012,net30,USD,true,approved,8,active';
        filename = 'vendors_template.csv';
        break;
      case 'customers':
        csvContent = 'Customer Number,Customer Name,Contact Name,Contact Email,Contact Phone,Address,City,State,Zip Code,Country,Customer Tier,Credit Limit,Payment Terms,Tax ID,Sales Rep,Status\nCUST-001,ACME Corporation,John Manager,john@acme.com,555-987-6543,789 Business Ave,Chicago,IL,60601,US,preferred,100000,net30,98-7654321,Sales Rep 1,active\nCUST-002,TechCorp Industries,Sarah Director,sarah@techcorp.com,555-876-5432,456 Technology Blvd,Austin,TX,73301,US,standard,50000,net15,87-6543210,Sales Rep 2,active';
        filename = 'customers_template.csv';
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

  return (
    <div className={`p-3 sm:p-6 space-y-4 sm:space-y-6 ${isMaxOpen ? 'md:ml-0 md:mr-0' : 'md:ml-12 md:mr-12'} ml-3 mr-3`}>
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
                    onClick={() => window.location.href = '/onboarding?step=1'}
                    className="h-auto p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    title="Edit feature selections in Getting Started"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {onboardingFeatures.map(feature => (
                    <Badge key={feature} variant="outline" className="border-blue-300 text-blue-700">
                      {feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Recommended Data Types:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommendedDataTypes.map(dataTypeKey => {
                    const dataType = dataTypes.find(dt => dt.key === dataTypeKey);
                    if (!dataType) return null;
                    
                    const Icon = dataType.icon;
                    const isCompleted = importStatuses.some(status => 
                      status.type === dataTypeKey && status.status === 'success'
                    );
                    
                    return (
                      <div 
                        key={dataTypeKey}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isCompleted 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-blue-200 hover:border-blue-300'
                        }`}
                      >
                        <div className={`p-2 rounded-md ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                          <Icon className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm ${isCompleted ? 'text-green-800' : 'text-blue-800'}`}>
                              {dataType.label}
                            </p>
                            {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                          </div>
                          <p className={`text-xs ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                            {dataType.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Pro tip:</strong> Start with Plants and Capabilities first, then add Resources and Production Orders. 
                  This order helps avoid dependency issues during data import.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Tabs defaultValue="manage" className="w-full">{/* disabled={!isReady} */}
                <div className="w-full overflow-x-auto pb-2">
                  <TabsList className="flex w-max gap-1 lg:grid lg:w-full lg:grid-cols-5 p-1">
                    <TabsTrigger value="manage" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                      <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden lg:inline">Manage Data</span>
                      <span className="lg:hidden">Manage</span>
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                      <span className="hidden lg:inline">Upload File</span>
                      <span className="lg:hidden">Upload</span>
                    </TabsTrigger>
                    <TabsTrigger value="template" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                      <span className="hidden lg:inline">Template Format</span>
                      <span className="lg:hidden">Template</span>
                    </TabsTrigger>
                    <TabsTrigger value="structured" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                      <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden lg:inline">Spreadsheet</span>
                      <span className="lg:hidden">Sheet</span>
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex-shrink-0 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3">
                      <span className="hidden lg:inline">Text Entry</span>
                      <span className="lg:hidden">Text</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="manage" className="space-y-4">
                  <ManageDataTab dataType={key} />
                </TabsContent>

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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <Label className="text-base font-medium">Structured Data Entry</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addStructuredRow(key)}
                        disabled={isImporting}
                        className="w-full sm:w-auto"
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
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <FileSpreadsheet className="h-5 w-5" />
              Consolidated Template Download
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Select multiple data types to download a consolidated template with all your selected data structures.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Selection Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDataTypes(dataTypes.map(dt => dt.key))}
                  className="w-full sm:w-auto"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDataTypes([])}
                  className="w-full sm:w-auto"
                >
                  Clear All
                </Button>
              </div>
              <Badge variant="secondary">
                {selectedDataTypes.length} of {dataTypes.length} selected
              </Badge>
            </div>

            {/* Smart Data Type View Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Data Types:</span>
                <span className="text-xs text-muted-foreground">
                  {showAllDataTypes 
                    ? `Showing all ${dataTypes.length} data types`
                    : `Showing ${getFilteredDataTypes().length} relevant data types`
                  }
                </span>
              </div>
              <Button
                variant={showAllDataTypes ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllDataTypes(!showAllDataTypes)}
                className="h-8"
              >
                {showAllDataTypes ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Show All
                  </>
                )}
              </Button>
            </div>

            {/* Intelligent Data Type Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getDataTypesByCategory().map(category => (
                <div key={category.category} className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                    {category.category}
                  </h4>
                  <div className="space-y-2">
                    {category.types.map(({ key, label, icon: Icon, description }) => {
                      const isSelected = selectedDataTypes.includes(key);
                      const isRecommended = recommendedDataTypes.includes(key);
                      const priority = getDataTypePriority(key);
                      
                      return (
                        <div
                          key={key}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200' 
                              : isRecommended
                              ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
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
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm">{label}</div>
                              <div className="flex gap-1">
                                {isRecommended && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-emerald-100 text-emerald-700 border-emerald-300">
                                    Recommended
                                  </Badge>
                                )}
                                {priority === 'essential' && !isRecommended && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-blue-100 text-blue-700 border-blue-300">
                                    Essential
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowConsolidatedDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                downloadConsolidatedTemplate();
                setShowConsolidatedDialog(false);
              }}
              disabled={selectedDataTypes.length === 0}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Download Consolidated Template</span>
              <span className="sm:hidden">Download Template</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                          const dataType = dataTypes.find(dt => dt.key === key);
                          return (
                            <Badge key={key} variant="outline" className="text-xs bg-white/50">
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
                    const companyInfo = JSON.parse(localStorage.getItem('onboarding-company-info') || '{}');
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
                      details: industryDescriptions.small.records
                    },
                    {
                      value: 'medium',
                      label: 'Medium Sample',
                      description: industryDescriptions.medium.description,
                      details: industryDescriptions.medium.records
                    },
                    {
                      value: 'large',
                      label: 'Large Sample',
                      description: industryDescriptions.large.description,
                      details: industryDescriptions.large.records
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
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
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
                        onCheckedChange={setDeleteExistingData}
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

      {/* AI Generation Summary Dialog */}
      <Dialog open={showAISummary} onOpenChange={setShowAISummary}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="h-5 w-5 text-green-600" />
              AI Sample Data Generated Successfully
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Your sample data has been generated and imported into the system.
            </DialogDescription>
          </DialogHeader>

          {aiGenerationResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Generation Summary</h3>
                <p className="text-sm text-green-800">{aiGenerationResult.summary?.description || aiGenerationResult.summary || 'AI data generation completed successfully'}</p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {aiGenerationResult.summary?.totalRecords || aiGenerationResult.totalRecords || 0} total records
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {Object.keys(aiGenerationResult.summary?.details || {}).length || aiGenerationResult.dataTypes || 0} data types
                  </Badge>
                </div>
              </div>

              {/* Detailed Import Results */}
              {aiGenerationResult.importResults && aiGenerationResult.importResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Generated Data Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiGenerationResult.importResults.map((result: any, index: number) => {
                      const dataType = dataTypes.find(dt => dt.key === result.type);
                      const Icon = dataType?.icon || Database;
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="p-2 bg-green-100 rounded-md">
                            <Icon className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {dataType?.label || result.type}
                            </div>
                            <div className="text-sm text-gray-600">
                              {result.count} {result.count === 1 ? 'record' : 'records'} created
                            </div>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="space-y-4">
                <h3 className="font-medium">Next Steps</h3>
                
                {/* View Sample Data Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 border-blue-200 hover:border-blue-300"
                  onClick={() => {
                    setShowAISummary(false);
                    // Stay on current page to view data
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Database className="h-5 w-5 text-blue-600" />
                    <div className="text-left flex-1">
                      <div className="font-medium">View & Edit Sample Data</div>
                      <div className="text-xs text-muted-foreground">Review and modify the generated data on this page</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </div>
                </Button>

                {/* Feature Exploration Buttons */}
                {onboardingFeatures.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Explore Your Selected Features:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {onboardingFeatures.map(feature => {
                        const getFeatureInfo = (featureKey: string) => {
                          switch (featureKey) {
                            case 'production-scheduling':
                              return {
                                label: 'Explore Production Scheduling',
                                description: 'View and manage your production orders',
                                icon: Calendar,
                                route: '/production-schedule',
                                color: 'text-blue-600'
                              };
                            case 'capacity-planning':
                              return {
                                label: 'Explore Capacity Planning', 
                                description: 'Plan and optimize resource capacity',
                                icon: TrendingUp,
                                route: '/capacity-planning',
                                color: 'text-green-600'
                              };
                            case 'production-planning':
                              return {
                                label: 'Explore Production Planning',
                                description: 'Plan production targets and schedules',
                                icon: ClipboardList,
                                route: '/production-planning', 
                                color: 'text-purple-600'
                              };
                            case 'inventory-optimization':
                              return {
                                label: 'Explore Inventory Optimization',
                                description: 'Optimize stock levels and inventory',
                                icon: Package,
                                route: '/inventory-optimization',
                                color: 'text-orange-600'
                              };
                            case 'demand-planning':
                              return {
                                label: 'Explore Demand Planning',
                                description: 'Forecast and plan for customer demand',
                                icon: TrendingUp,
                                route: '/demand-planning',
                                color: 'text-indigo-600'
                              };
                            default:
                              return {
                                label: `Explore ${feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
                                description: 'Explore this feature',
                                icon: Briefcase,
                                route: `/${feature}`,
                                color: 'text-gray-600'
                              };
                          }
                        };

                        const featureInfo = getFeatureInfo(feature);
                        const Icon = featureInfo.icon;

                        return (
                          <Button
                            key={feature}
                            variant="outline"
                            className="justify-start h-auto p-4"
                            onClick={() => {
                              setShowAISummary(false);
                              window.location.href = featureInfo.route;
                            }}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <Icon className={`h-5 w-5 ${featureInfo.color}`} />
                              <div className="text-left flex-1">
                                <div className="font-medium">{featureInfo.label}</div>
                                <div className="text-xs text-muted-foreground">{featureInfo.description}</div>
                              </div>
                              <ExternalLink className="h-4 w-4" />
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-center sm:justify-end pt-6 border-t">
            <Button
              onClick={() => setShowAISummary(false)}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Data Modification Dialog */}
      <Dialog open={showAIModifyDialog} onOpenChange={setShowAIModifyDialog}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Edit2 className="h-5 w-5 text-emerald-600" />
              AI Master Data Modification
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Describe the specific changes you want to make to your existing master data. AI will analyze your current data and apply the requested modifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Modification Instructions */}
            <div className="space-y-3">
              <Label htmlFor="ai-modify-prompt" className="text-sm sm:text-base font-medium">
                Modification Instructions
              </Label>
              <Textarea
                id="ai-modify-prompt"
                value={aiModifyPrompt}
                onChange={(e) => setAiModifyPrompt(e.target.value)}
                placeholder="Describe what changes you want to make to your master data. Examples:&#10;- Add 3 new CNC machines to Plant A&#10;- Update all high priority production orders to critical&#10;- Add quality control capability to all assembly resources&#10;- Change plant timezone from UTC to America/Chicago&#10;- Increase production order quantities by 25%"
                className="min-h-[120px] sm:min-h-[150px] text-sm"
                autoFocus={false}
              />
              <p className="text-xs text-muted-foreground">
                Be specific about what you want to modify. AI will analyze your existing data and apply only the changes you request without affecting other data.
              </p>
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">How AI Modification Works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• AI analyzes your current master data (plants, resources, production orders, etc.)</li>
                    <li>• Applies only the specific changes you request</li>
                    <li>• Preserves existing relationships and data integrity</li>
                    <li>• Shows you exactly what was modified before saving</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setShowAIModifyDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={executeAIModification}
              disabled={aiModificationMutation.isPending}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {aiModificationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Analyzing & Modifying...</span>
                  <span className="sm:hidden">Modifying...</span>
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Modify Master Data</span>
                  <span className="sm:hidden">Modify Data</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Modification Summary Dialog */}
      <Dialog open={showAIModifySummary} onOpenChange={setShowAIModifySummary}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              AI Data Modification Complete
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Your master data has been successfully modified according to your instructions.
            </DialogDescription>
          </DialogHeader>

          {aiModifyResult && (
            <div className="space-y-6">
              {/* Modification Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h3 className="font-medium text-emerald-900 mb-2">Modification Summary</h3>
                <p className="text-sm text-emerald-800">{aiModifyResult.summary || 'Data modification completed successfully'}</p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {aiModifyResult.modifiedRecords || 0} records modified
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {aiModifyResult.modifiedTypes?.length || 0} data types affected
                  </Badge>
                </div>
              </div>

              {/* Modified Data Details */}
              {aiModifyResult.modifications && aiModifyResult.modifications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Modification Details</h3>
                  <div className="space-y-2">
                    {aiModifyResult.modifications.map((mod: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{mod.type}</div>
                          <div className="text-sm text-gray-600">{mod.description}</div>
                          <div className="text-xs text-gray-500 mt-1">{mod.count} records affected</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center sm:justify-end pt-6 border-t">
            <Button
              onClick={() => setShowAIModifySummary(false)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}