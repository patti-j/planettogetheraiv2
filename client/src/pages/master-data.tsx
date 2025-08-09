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
  Filter, ChevronUp, ChevronDown, Edit2, X, Check
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
  isLoading 
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddRow} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
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

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {processedData.length} of {data?.length || 0} rows
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('items');

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
    plants: [
      { key: 'name', label: 'Name', editable: true, required: true },
      { key: 'code', label: 'Code', editable: true },
      { key: 'location', label: 'Location', editable: true },
      { key: 'type', label: 'Type', editable: true, type: 'select', options: [
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'warehouse', label: 'Warehouse' },
        { value: 'distribution', label: 'Distribution' }
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Master Data Management</h1>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-6 pt-6">
              <TabsList className="grid grid-cols-6 w-full max-w-3xl">
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="plants">Plants</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="vendors">Vendors</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value={activeTab} className="mt-0">
                <EditableDataTable
                  data={data || []}
                  columns={columns[activeTab]}
                  entityType={activeTab}
                  onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                  onCreate={(data) => createMutation.mutate(data)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isLoading={isLoading}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}