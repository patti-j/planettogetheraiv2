import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Save, Trash2, Upload, Download, Search,
  Filter, ChevronUp, ChevronDown, Edit2, X, Check, FileText,
  Bot, Wand2, Sparkles, Lightbulb, RefreshCw, Zap
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface EditableCell {
  rowId: number;
  field: string;
  value: any;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  entityType: string;
  onUpdate: (id: number, data: any) => void;
  onCreate: (data: any) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
  onShowAiAssistant?: () => void;
}

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: { value: string; label: string }[];
  editable?: boolean;
  required?: boolean;
  width?: string;
}

function EditableDataTable({ 
  data, 
  columns, 
  entityType, 
  onUpdate, 
  onCreate, 
  onDelete,
  isLoading,
  onShowAiAssistant
}: DataTableProps) {
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [newRow, setNewRow] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter and sort data
  const processedData = data
    ?.filter(row => {
      if (!searchTerm) return true;
      return columns.some(col => 
        String(row[col.key] || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    ?.sort((a, b) => {
      if (!sortColumn) return 0;
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (aVal < bVal) return -direction;
      if (aVal > bVal) return direction;
      return 0;
    }) || [];

  const handleCellClick = (rowId: number, field: string, value: any, editable?: boolean) => {
    if (!editable) return;
    setEditingCell({ rowId, field, value });
    setEditValue(value || '');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCellSave = () => {
    if (editingCell) {
      const row = data.find(r => r.id === editingCell.rowId);
      if (row && row[editingCell.field] !== editValue) {
        onUpdate(editingCell.rowId, { ...row, [editingCell.field]: editValue });
      }
      setEditingCell(null);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleAddRow = () => {
    const defaultRow: any = { id: -1 };
    columns.forEach(col => {
      if (col.type === 'boolean') {
        defaultRow[col.key] = false;
      } else if (col.type === 'number') {
        defaultRow[col.key] = 0;
      } else {
        defaultRow[col.key] = '';
      }
    });
    setNewRow(defaultRow);
  };

  const handleSaveNewRow = () => {
    if (newRow) {
      const { id, ...rowData } = newRow;
      onCreate(rowData);
      setNewRow(null);
    }
  };

  const handleCancelNewRow = () => {
    setNewRow(null);
  };

  const renderCell = (row: any, column: Column) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === column.key;
    const value = row[column.key];

    if (isEditing) {
      if (column.type === 'select' && column.options) {
        return (
          <Select
            value={editValue}
            onValueChange={(val) => {
              setEditValue(val);
              handleCellSave();
            }}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type={column.type === 'number' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="h-8 text-sm"
          />
          <Button size="sm" variant="ghost" onClick={handleCellSave}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCellCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    if (column.type === 'boolean') {
      return (
        <input
          type="checkbox"
          checked={!!value}
          onChange={() => column.editable && onUpdate(row.id, { ...row, [column.key]: !value })}
          disabled={!column.editable}
          className="cursor-pointer"
        />
      );
    }

    return (
      <div
        className={`px-2 py-1 ${column.editable ? 'cursor-pointer hover:bg-muted' : ''}`}
        onClick={() => handleCellClick(row.id, column.key, value, column.editable)}
      >
        {value || '-'}
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search and filters - full width on mobile */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="shrink-0">
            <Filter className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShowAiAssistant}
            className="shrink-0"
          >
            <Bot className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">AI Help</span>
          </Button>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-1">Import</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-1">Export</span>
          </Button>
          <Button onClick={handleAddRow} size="sm" className="flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-1">Add Row</span>
          </Button>
        </div>
      </div>

      {/* Table - responsive layout */}
      <div className="border rounded-lg overflow-hidden">
        {/* Desktop table view */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                {columns.map(col => (
                  <TableHead 
                    key={col.key}
                    className={`cursor-pointer hover:bg-muted ${col.width || ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center justify-between">
                      {col.label}
                      {sortColumn === col.key && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* New row form */}
              {newRow && (
                <TableRow className="bg-muted/50">
                  <TableCell>New</TableCell>
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      {col.type === 'select' && col.options ? (
                        <Select
                          value={newRow[col.key]}
                          onValueChange={(val) => setNewRow({ ...newRow, [col.key]: val })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {col.options.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : col.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={!!newRow[col.key]}
                          onChange={(e) => setNewRow({ ...newRow, [col.key]: e.target.checked })}
                        />
                      ) : (
                        <Input
                          type={col.type === 'number' ? 'number' : 'text'}
                          value={newRow[col.key]}
                          onChange={(e) => setNewRow({ ...newRow, [col.key]: e.target.value })}
                          placeholder={col.label}
                          className="h-8"
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={handleSaveNewRow}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelNewRow}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Data rows */}
              {processedData.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      {renderCell(row, col)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(row.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile card view */}
        <div className="lg:hidden">
          {/* New row form for mobile */}
          {newRow && (
            <div className="border-b p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Add New {entityType.replace('-', ' ')}</h4>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={handleSaveNewRow}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelNewRow}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {columns.map(col => (
                  <div key={col.key}>
                    <label className="text-sm font-medium text-muted-foreground">{col.label}</label>
                    {col.type === 'select' && col.options ? (
                      <Select
                        value={newRow[col.key]}
                        onValueChange={(val) => setNewRow({ ...newRow, [col.key]: val })}
                      >
                        <SelectTrigger className="h-9 mt-1">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {col.options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : col.type === 'boolean' ? (
                      <div className="flex items-center mt-2">
                        <input
                          type="checkbox"
                          checked={!!newRow[col.key]}
                          onChange={(e) => setNewRow({ ...newRow, [col.key]: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                      </div>
                    ) : (
                      <Input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={newRow[col.key]}
                        onChange={(e) => setNewRow({ ...newRow, [col.key]: e.target.value })}
                        placeholder={col.label}
                        className="h-9 mt-1"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Mobile data cards */}
          <div className="space-y-3 p-4">
            {processedData.map((row, idx) => (
              <div key={row.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(row.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                {columns.map(col => (
                  <div key={col.key} className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {col.label}
                    </label>
                    <div className="text-sm">
                      {renderCell(row, col)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground px-2">
        <div className="text-center sm:text-left">
          Showing {processedData.length} of {data?.length || 0} rows
        </div>
        <div className="flex gap-2 justify-center sm:justify-end">
          <Button variant="outline" size="sm" disabled className="text-xs">Previous</Button>
          <Button variant="outline" size="sm" disabled className="text-xs">Next</Button>
        </div>
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('items');
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Define columns for each entity type
  const columns: Record<string, Column[]> = {
    items: [
      { key: 'name', label: 'Name', editable: true, required: true },
      { key: 'description', label: 'Description', editable: true },
      { key: 'sku', label: 'SKU', editable: true },
      { key: 'category', label: 'Category', editable: true, type: 'select', options: [
        { value: 'raw-material', label: 'Raw Material' },
        { value: 'component', label: 'Component' },
        { value: 'finished-good', label: 'Finished Good' },
        { value: 'packaging', label: 'Packaging' }
      ]},
      { key: 'unitOfMeasure', label: 'UOM', editable: true },
      { key: 'standardCost', label: 'Cost', editable: true, type: 'number' },
      { key: 'leadTime', label: 'Lead Time', editable: true, type: 'number' },
      { key: 'isActive', label: 'Active', editable: true, type: 'boolean' }
    ],
    resources: [
      { key: 'name', label: 'Name', editable: true, required: true },
      { key: 'type', label: 'Type', editable: true, type: 'select', options: [
        { value: 'machine', label: 'Machine' },
        { value: 'human', label: 'Human' },
        { value: 'tool', label: 'Tool' },
        { value: 'workstation', label: 'Workstation' }
      ]},
      { key: 'status', label: 'Status', editable: true, type: 'select', options: [
        { value: 'available', label: 'Available' },
        { value: 'busy', label: 'Busy' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'offline', label: 'Offline' }
      ]},
      { key: 'efficiency', label: 'Efficiency %', editable: true, type: 'number' },
      { key: 'costPerHour', label: 'Cost/Hour', editable: true, type: 'number' },
      { key: 'isDrum', label: 'Is Drum', editable: true, type: 'boolean' }
    ],
    capabilities: [
      { key: 'name', label: 'Name', editable: true, required: true },
      { key: 'description', label: 'Description', editable: true }
    ],
    'production-orders': [
      { key: 'orderNumber', label: 'Order Number', editable: true, required: true },
      { key: 'name', label: 'Name', editable: true, required: true },
      { key: 'description', label: 'Description', editable: true },
      { key: 'status', label: 'Status', editable: true, type: 'select', options: [
        { value: 'released', label: 'Released' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]},
      { key: 'priority', label: 'Priority', editable: true, type: 'select', options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]},
      { key: 'quantity', label: 'Quantity', editable: true, type: 'number' },
      { key: 'dueDate', label: 'Due Date', editable: true, type: 'date' }
    ],
    recipes: [
      { key: 'recipeNumber', label: 'Recipe Number', editable: true, required: true },
      { key: 'recipeName', label: 'Recipe Name', editable: true, required: true },
      { key: 'productItemNumber', label: 'Product Item', editable: true, required: true },
      { key: 'recipeVersion', label: 'Version', editable: true },
      { key: 'status', label: 'Status', editable: true, type: 'select', options: [
        { value: 'created', label: 'Created' },
        { value: 'released_for_planning', label: 'Released for Planning' },
        { value: 'released_for_execution', label: 'Released for Execution' },
        { value: 'obsolete', label: 'Obsolete' }
      ]},
      { key: 'batchSize', label: 'Batch Size', editable: true, type: 'number' },
      { key: 'batchUnit', label: 'Batch Unit', editable: true }
    ],
    plants: [
      { key: 'name', label: 'Name', editable: true, required: true },
      { key: 'location', label: 'Location', editable: true },
      { key: 'address', label: 'Address', editable: true },
      { key: 'city', label: 'City', editable: true },
      { key: 'state', label: 'State', editable: true },
      { key: 'country', label: 'Country', editable: true },
      { key: 'plantType', label: 'Plant Type', editable: true, type: 'select', options: [
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'distribution', label: 'Distribution' },
        { value: 'warehouse', label: 'Warehouse' },
        { value: 'office', label: 'Office' }
      ]},
      { key: 'isActive', label: 'Active', editable: true, type: 'boolean' }
    ],
    users: [
      { key: 'username', label: 'Username', editable: true, required: true },
      { key: 'email', label: 'Email', editable: true },
      { key: 'firstName', label: 'First Name', editable: true },
      { key: 'lastName', label: 'Last Name', editable: true },
      { key: 'department', label: 'Department', editable: true },
      { key: 'jobTitle', label: 'Job Title', editable: true },
      { key: 'isActive', label: 'Active', editable: true, type: 'boolean' }
    ],
    customers: [
      { key: 'name', label: 'Name', editable: true, required: true },
      { key: 'code', label: 'Code', editable: true },
      { key: 'contactName', label: 'Contact', editable: true },
      { key: 'email', label: 'Email', editable: true },
      { key: 'phone', label: 'Phone', editable: true },
      { key: 'address', label: 'Address', editable: true },
      { key: 'creditLimit', label: 'Credit Limit', editable: true, type: 'number' },
      { key: 'isActive', label: 'Active', editable: true, type: 'boolean' }
    ],
    vendors: [
      { key: 'name', label: 'Name', editable: true, required: true },
      { key: 'code', label: 'Code', editable: true },
      { key: 'contactName', label: 'Contact', editable: true },
      { key: 'email', label: 'Email', editable: true },
      { key: 'phone', label: 'Phone', editable: true },
      { key: 'address', label: 'Address', editable: true },
      { key: 'paymentTerms', label: 'Payment Terms', editable: true },
      { key: 'isActive', label: 'Active', editable: true, type: 'boolean' }
    ]
  };

  // API endpoints for each entity type
  const endpoints: Record<string, string> = {
    items: '/api/stock-items',
    resources: '/api/resources',
    capabilities: '/api/capabilities',
    'production-orders': '/api/production-orders',
    recipes: '/api/recipes',
    plants: '/api/plants',
    users: '/api/users',
    customers: '/api/customers',
    vendors: '/api/vendors'
  };

  // Data queries
  const { data, isLoading, refetch } = useQuery({
    queryKey: [endpoints[activeTab]],
    queryFn: async () => {
      const response = await fetch(endpoints[activeTab]);
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PATCH', `${endpoints[activeTab]}/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints[activeTab]] });
      toast({
        title: 'Success',
        description: 'Item updated successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive'
      });
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', endpoints[activeTab], data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints[activeTab]] });
      toast({
        title: 'Success',
        description: 'Item created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create item',
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `${endpoints[activeTab]}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints[activeTab]] });
      toast({
        title: 'Success',
        description: 'Item deleted successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive'
      });
    }
  });

  // AI-powered data operations
  const aiDataMutation = useMutation({
    mutationFn: async ({ operation, prompt, entityType, selectedData }: { 
      operation: 'suggest' | 'generate' | 'improve' | 'bulk_edit';
      prompt: string;
      entityType: string;
      selectedData?: any[];
    }) => {
      const response = await apiRequest('POST', '/api/master-data/ai-assist', {
        operation,
        prompt,
        entityType,
        selectedData,
        currentData: data || []
      });
      return await response.json();
    },
    onSuccess: (result) => {
      setAiSuggestions(result.suggestions || []);
      setAiProcessing(false);
      toast({
        title: 'AI Assistant',
        description: result.message || 'AI suggestions generated successfully'
      });
    },
    onError: (error: any) => {
      setAiProcessing(false);
      toast({
        title: 'AI Error',
        description: error.message || 'Failed to process AI request',
        variant: 'destructive'
      });
    }
  });

  const handleAiRequest = async (operation: 'suggest' | 'generate' | 'improve' | 'bulk_edit') => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please describe what you need help with',
        variant: 'destructive'
      });
      return;
    }

    setAiProcessing(true);
    aiDataMutation.mutate({
      operation,
      prompt: aiPrompt,
      entityType: activeTab
    });
  };

  const applyAiSuggestion = (suggestion: any) => {
    if (suggestion.operation === 'create') {
      createMutation.mutate(suggestion.data);
    } else if (suggestion.operation === 'update') {
      updateMutation.mutate({ id: suggestion.id, data: suggestion.data });
    }
    setAiSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" />
          <span className="hidden sm:inline">Master Data Management</span>
          <span className="sm:hidden">Master Data</span>
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline"
            onClick={() => setShowAiAssistant(true)}
            size="sm"
            className="flex-1 sm:flex-initial"
          >
            <Bot className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">AI Assistant</span>
            <span className="sm:hidden ml-1">AI</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-initial">
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Save All Changes</span>
            <span className="sm:hidden ml-1">Save</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-3 sm:px-6 pt-4 sm:pt-6">
              <TabsList className="flex overflow-x-auto no-scrollbar gap-1 w-full bg-muted p-1 rounded-lg">
                <TabsTrigger value="items" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Items</TabsTrigger>
                <TabsTrigger value="resources" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Resources</TabsTrigger>
                <TabsTrigger value="capabilities" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Capabilities</TabsTrigger>
                <TabsTrigger value="production-orders" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Orders</TabsTrigger>
                <TabsTrigger value="recipes" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Recipes</TabsTrigger>
                <TabsTrigger value="plants" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Plants</TabsTrigger>
                <TabsTrigger value="users" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Users</TabsTrigger>
                <TabsTrigger value="customers" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Customers</TabsTrigger>
                <TabsTrigger value="vendors" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Vendors</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-3 sm:p-6">
              <TabsContent value={activeTab} className="mt-0">
                <EditableDataTable
                  data={data || []}
                  columns={columns[activeTab]}
                  entityType={activeTab}
                  onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                  onCreate={(data) => createMutation.mutate(data)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isLoading={isLoading}
                  onShowAiAssistant={() => setShowAiAssistant(true)}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Assistant Dialog */}
      <Dialog open={showAiAssistant} onOpenChange={setShowAiAssistant}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Master Data Assistant
            </DialogTitle>
            <DialogDescription>
              Get AI-powered help with your {activeTab.replace('-', ' ')} data - generate new entries, improve existing data, or get suggestions for better data management.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* AI Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">What would you like help with?</label>
              <Textarea
                placeholder={`For example:
- Generate 10 new ${activeTab} with realistic data
- Improve the descriptions for all existing ${activeTab}
- Suggest better names for items with generic names
- Fill in missing data for incomplete entries`}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Button 
                onClick={() => handleAiRequest('generate')}
                disabled={aiProcessing}
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Sparkles className="h-4 w-4 mr-1 sm:mr-2" />
                Generate
              </Button>
              <Button 
                onClick={() => handleAiRequest('improve')}
                disabled={aiProcessing}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Wand2 className="h-4 w-4 mr-1 sm:mr-2" />
                Improve
              </Button>
              <Button 
                onClick={() => handleAiRequest('suggest')}
                disabled={aiProcessing}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Lightbulb className="h-4 w-4 mr-1 sm:mr-2" />
                Suggestions
              </Button>
              <Button 
                onClick={() => handleAiRequest('bulk_edit')}
                disabled={aiProcessing}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Zap className="h-4 w-4 mr-1 sm:mr-2" />
                Bulk Edit
              </Button>
            </div>

            {aiProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                AI is analyzing your {activeTab} data and generating suggestions...
              </div>
            )}

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  AI Suggestions ({aiSuggestions.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {aiSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={suggestion.operation === 'create' ? 'default' : 'secondary'}>
                              {suggestion.operation}
                            </Badge>
                            {suggestion.confidence && (
                              <Badge variant="outline">
                                {Math.round(suggestion.confidence * 100)}% confident
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1">{suggestion.explanation}</p>
                          {suggestion.data && (
                            <div className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                              <strong>Suggested changes:</strong>
                              <pre className="mt-1 text-xs whitespace-pre-wrap break-all">{JSON.stringify(suggestion.data, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => applyAiSuggestion(suggestion)}
                          >
                            Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAiSuggestions(prev => prev.filter(s => s !== suggestion))}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAiAssistant(false);
              setAiPrompt('');
              setAiSuggestions([]);
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}