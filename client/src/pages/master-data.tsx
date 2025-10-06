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
  Bot, Sparkles, Lightbulb, RefreshCw, Zap, ChevronRight,
  Route, ArrowRight, Layers, Clock, Settings
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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

interface ManufacturingPath {
  id: number;
  operationNumber: string;
  operationName: string;
  workCenter: string;
  estimatedDuration: number;
  status: string;
  description?: string;
}

interface ManufacturingPathViewerProps {
  jobId: number;
  jobDescription: string;
  onClose: () => void;
}

interface HierarchicalDataTableProps extends DataTableProps {
  setSelectedJobForPath?: (job: { id: number; description: string }) => void;
}

// Manufacturing Path Viewer Component
function ManufacturingPathViewer({ jobId, jobDescription, onClose }: ManufacturingPathViewerProps) {
  const [pathData, setPathData] = useState<ManufacturingPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchManufacturingPath = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', `/api/jobs/${jobId}/manufacturing-path`);
        const data = await response.json();
        setPathData(data);
      } catch (error) {
        console.error('Failed to fetch manufacturing path:', error);
        // Fallback to operations if manufacturing path endpoint doesn't exist
        try {
          const operationsResponse = await apiRequest('GET', `/api/jobs/${jobId}/operations`);
          const operations = await operationsResponse.json();
          // Convert operations to manufacturing path format
          const convertedPath = operations.map((op: any, index: number) => ({
            id: op.id,
            operationNumber: String(index + 1).padStart(4, '0'),
            operationName: op.name || op.operationName || `Operation ${index + 1}`,
            workCenter: op.workCenter || op.resourceName || 'Not Assigned',
            estimatedDuration: op.duration || op.estimatedDuration || 0,
            status: op.status || 'planned',
            description: op.description || op.notes || ''
          }));
          setPathData(convertedPath);
        } catch (fallbackError) {
          console.error('Failed to fetch operations:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchManufacturingPath();
  }, [jobId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-500" />
            Manufacturing Path - {jobDescription}
          </DialogTitle>
          <DialogDescription>
            View the complete manufacturing routing and operation sequence for this job
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Loading manufacturing path...</span>
            </div>
          ) : pathData.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No manufacturing operations found for this job</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Path Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{pathData.length}</div>
                  <div className="text-sm text-gray-600">Operations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(pathData.reduce((sum, op) => sum + op.estimatedDuration, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(pathData.map(op => op.workCenter)).size}
                  </div>
                  <div className="text-sm text-gray-600">Work Centers</div>
                </div>
              </div>

              {/* Manufacturing Path Flow */}
              <div className="space-y-3">
                {pathData.map((operation, index) => (
                  <div key={operation.id} className="flex items-center">
                    {/* Operation Card */}
                    <div className="flex-1 border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                            {operation.operationNumber}
                          </div>
                          <div>
                            <h4 className="font-semibold">{operation.operationName}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Settings className="w-3 h-3" />
                                {operation.workCenter}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {operation.estimatedDuration}h
                              </span>
                            </div>
                            {operation.description && (
                              <p className="text-sm text-gray-500 mt-1">{operation.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(operation.status)}>
                          {operation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Arrow connector (except for last item) */}
                    {index < pathData.length - 1 && (
                      <div className="flex items-center justify-center w-8 h-8 mx-2">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
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
            <Sparkles className="h-4 w-4 sm:mr-2" />
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

// Hierarchical Data Table Component for multi-level entities like Jobs
interface HierarchicalDataTableProps {
  data: any[];
  columns: Column[];
  entityType: string;
  onUpdate: (id: number, data: any) => void;
  onCreate: (data: any) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
  onShowAiAssistant?: () => void;
}

// Enhanced hierarchical data types
interface HierarchicalData {
  level: 'job' | 'manufacturing-order' | 'operation' | 'activity';
  parentId: number;
  data: any[];
}

function HierarchicalDataTable({ 
  data, 
  columns, 
  entityType, 
  onUpdate, 
  onCreate, 
  onDelete,
  isLoading,
  onShowAiAssistant,
  setSelectedJobForPath
}: HierarchicalDataTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hierarchicalData, setHierarchicalData] = useState<Record<string, any[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());

  // Fetch manufacturing orders for a job
  const fetchManufacturingOrders = async (jobId: number) => {
    try {
      const key = `job-${jobId}`;
      setLoadingChildren(prev => new Set([...prev, key]));
      const response = await apiRequest('GET', `/api/jobs/${jobId}/manufacturing-orders`);
      const manufacturingOrders = await response.json();
      setHierarchicalData(prev => ({ ...prev, [key]: manufacturingOrders }));
    } catch (error) {
      console.error('Failed to fetch manufacturing orders:', error);
    } finally {
      setLoadingChildren(prev => {
        const newSet = new Set(prev);
        newSet.delete(`job-${jobId}`);
        return newSet;
      });
    }
  };

  // Fetch operations for a manufacturing order
  const fetchOperations = async (manufacturingOrderId: number) => {
    try {
      const key = `mo-${manufacturingOrderId}`;
      setLoadingChildren(prev => new Set([...prev, key]));
      const response = await apiRequest('GET', `/api/manufacturing-orders/${manufacturingOrderId}/operations`);
      const operations = await response.json();
      setHierarchicalData(prev => ({ ...prev, [key]: operations }));
    } catch (error) {
      console.error('Failed to fetch operations:', error);
    } finally {
      setLoadingChildren(prev => {
        const newSet = new Set(prev);
        newSet.delete(`mo-${manufacturingOrderId}`);
        return newSet;
      });
    }
  };

  // Fetch activities for an operation
  const fetchActivities = async (operationId: number) => {
    try {
      const key = `op-${operationId}`;
      setLoadingChildren(prev => new Set([...prev, key]));
      const response = await apiRequest('GET', `/api/operations/${operationId}/activities`);
      const activities = await response.json();
      setHierarchicalData(prev => ({ ...prev, [key]: activities }));
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoadingChildren(prev => {
        const newSet = new Set(prev);
        newSet.delete(`op-${operationId}`);
        return newSet;
      });
    }
  };

  const toggleRowExpansion = (level: 'job' | 'manufacturing-order' | 'operation', id: number) => {
    const key = level === 'job' ? `job-${id}` : level === 'manufacturing-order' ? `mo-${id}` : `op-${id}`;
    const newExpanded = new Set(expandedRows);
    
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      // Fetch child data if not already loaded
      if (!hierarchicalData[key]) {
        if (level === 'job') {
          fetchManufacturingOrders(id);
        } else if (level === 'manufacturing-order') {
          fetchOperations(id);
        } else if (level === 'operation') {
          fetchActivities(id);
        }
      }
    }
    setExpandedRows(newExpanded);
  };

  const renderCell = (row: any, col: Column) => {
    const value = row[col.key];
    if (col.type === 'boolean') {
      return value ? '✓' : '✗';
    }
    if (col.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }
    if (col.type === 'number' && value !== null && value !== undefined) {
      return typeof value === 'number' ? value.toLocaleString() : value;
    }
    return value || '';
  };

  // Column definitions for different hierarchy levels
  const manufacturingOrderColumns: Column[] = [
    { key: 'manufacturingOrderId', label: 'MO ID', type: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'requiredQty', label: 'Required Qty', type: 'number' },
    { key: 'expectedFinishQty', label: 'Expected Qty', type: 'number' },
    { key: 'productName', label: 'Product' }
  ];

  const operationColumns: Column[] = [
    { key: 'operationId', label: 'Operation ID', type: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'setupHours', label: 'Setup Hours', type: 'number' },
    { key: 'requiredStartQty', label: 'Start Qty', type: 'number' },
    { key: 'requiredFinishQty', label: 'Finish Qty', type: 'number' },
    { key: 'minutesPerCycle', label: 'Minutes/Cycle', type: 'number' }
  ];

  const activityColumns: Column[] = [
    { key: 'externalId', label: 'Activity ID' },
    { key: 'productionStatus', label: 'Status' },
    { key: 'comments', label: 'Comments' },
    { key: 'scheduledStartDate', label: 'Start Date', type: 'date' },
    { key: 'scheduledEndDate', label: 'End Date', type: 'date' }
  ];

  return (
    <div className="space-y-4">
      {/* Header with AI Assistant */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold capitalize">{entityType.replace('-', ' ')}</h3>
          <Badge variant="secondary">{data?.length || 0} records</Badge>
        </div>
        {onShowAiAssistant && (
          <Button
            onClick={onShowAiAssistant}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI Assistant
          </Button>
        )}
      </div>

      {/* Main table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {/* Expand toggle column */}
              </TableHead>
              {columns.map(col => (
                <TableHead key={col.key} className={col.width}>
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map(row => (
              <>
                {/* Main row */}
                <TableRow key={`main-${row.id}`}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowExpansion('job', row.id)}
                      className="h-6 w-6 p-0"
                    >
                      {loadingChildren.has(`job-${row.id}`) ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : expandedRows.has(`job-${row.id}`) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                  </TableCell>
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      {renderCell(row, col)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedJobForPath({ id: row.id, description: row.description || row.externalId || `Job ${row.id}` })}
                        title="View Manufacturing Path"
                      >
                        <Route className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(row.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded child rows - Manufacturing Orders */}
                {expandedRows.has(`job-${row.id}`) && hierarchicalData[`job-${row.id}`] && (
                  <TableRow key={`child-job-${row.id}`}>
                    <TableCell></TableCell>
                    <TableCell colSpan={columns.length + 1}>
                      <div className="bg-muted/50 p-3 rounded-lg ml-4">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-medium text-sm">Manufacturing Orders for {row.externalId || row.name || `Job ${row.id}`}</h4>
                          <Badge variant="outline" className="text-xs">
                            {hierarchicalData[`job-${row.id}`]?.length || 0} orders
                          </Badge>
                        </div>
                        
                        {hierarchicalData[`job-${row.id}`]?.length > 0 ? (
                          <div className="space-y-2">
                            {hierarchicalData[`job-${row.id}`].map(mo => (
                              <div key={mo.id} className="border rounded-lg p-3 bg-background">
                                <div className="flex items-center gap-2 mb-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion('manufacturing-order', mo.manufacturingOrderId)}
                                    className="h-5 w-5 p-0"
                                  >
                                    {loadingChildren.has(`mo-${mo.manufacturingOrderId}`) ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : expandedRows.has(`mo-${mo.manufacturingOrderId}`) ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <span className="font-medium text-sm">MO {mo.manufacturingOrderId}: {mo.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {mo.productName}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  <div><span className="text-muted-foreground">Required:</span> {mo.requiredQty}</div>
                                  <div><span className="text-muted-foreground">Expected:</span> {mo.expectedFinishQty}</div>
                                  <div><span className="text-muted-foreground">Product:</span> {mo.productName}</div>
                                  <div><span className="text-muted-foreground">Description:</span> {mo.description}</div>
                                </div>
                                
                                {/* Operations for this Manufacturing Order */}
                                {expandedRows.has(`mo-${mo.manufacturingOrderId}`) && hierarchicalData[`mo-${mo.manufacturingOrderId}`] && (
                                  <div className="mt-3 ml-6">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h5 className="font-medium text-xs">Operations</h5>
                                      <Badge variant="outline" className="text-xs">
                                        {hierarchicalData[`mo-${mo.manufacturingOrderId}`]?.length || 0} operations
                                      </Badge>
                                    </div>
                                    
                                    {hierarchicalData[`mo-${mo.manufacturingOrderId}`]?.length > 0 ? (
                                      <div className="space-y-2">
                                        {hierarchicalData[`mo-${mo.manufacturingOrderId}`].map(operation => (
                                          <div key={operation.id} className="border rounded p-2 bg-muted/30">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRowExpansion('operation', operation.id)}
                                                className="h-4 w-4 p-0"
                                              >
                                                {loadingChildren.has(`op-${operation.id}`) ? (
                                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                                ) : expandedRows.has(`op-${operation.id}`) ? (
                                                  <ChevronDown className="h-3 w-3" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3" />
                                                )}
                                              </Button>
                                              <span className="font-medium text-xs">Op {operation.operationId}: {operation.name}</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs ml-6">
                                              <div><span className="text-muted-foreground">Setup:</span> {operation.setupHours}h</div>
                                              <div><span className="text-muted-foreground">Start Qty:</span> {operation.requiredStartQty}</div>
                                              <div><span className="text-muted-foreground">Finish Qty:</span> {operation.requiredFinishQty}</div>
                                              <div><span className="text-muted-foreground">Minutes/Cycle:</span> {operation.minutesPerCycle}</div>
                                              <div><span className="text-muted-foreground">Description:</span> {operation.description}</div>
                                            </div>
                                            
                                            {/* Activities for this Operation */}
                                            {expandedRows.has(`op-${operation.id}`) && hierarchicalData[`op-${operation.id}`] && (
                                              <div className="mt-2 ml-6">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <h6 className="font-medium text-xs">Activities</h6>
                                                  <Badge variant="outline" className="text-xs">
                                                    {hierarchicalData[`op-${operation.id}`]?.length || 0} activities
                                                  </Badge>
                                                </div>
                                                
                                                {hierarchicalData[`op-${operation.id}`]?.length > 0 ? (
                                                  <div className="space-y-1">
                                                    {hierarchicalData[`op-${operation.id}`].map(activity => (
                                                      <div key={activity.id} className="border rounded p-2 bg-background text-xs">
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                          <div><span className="text-muted-foreground">ID:</span> {activity.externalId}</div>
                                                          <div><span className="text-muted-foreground">Status:</span> {activity.productionStatus}</div>
                                                          <div><span className="text-muted-foreground">Start:</span> {activity.scheduledStartDate ? new Date(activity.scheduledStartDate).toLocaleDateString() : 'N/A'}</div>
                                                          <div><span className="text-muted-foreground">End:</span> {activity.scheduledEndDate ? new Date(activity.scheduledEndDate).toLocaleDateString() : 'N/A'}</div>
                                                          {activity.comments && (
                                                            <div className="col-span-2"><span className="text-muted-foreground">Comments:</span> {activity.comments}</div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <p className="text-xs text-muted-foreground ml-2">No activities found for this operation</p>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-muted-foreground ml-2">No operations found for this manufacturing order</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No manufacturing orders found for this job</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
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
  const [selectedJobForPath, setSelectedJobForPath] = useState<{ id: number; description: string } | null>(null);
  const [companyInfo, setCompanyInfo] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [datasetSize, setDatasetSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recordCounts, setRecordCounts] = useState({
    items: 15,
    customers: 15, 
    vendors: 15,
    capabilities: 15,
    workCenters: 15,
    jobs: 15,
    recipes: 15,
    routings: 15,
    billsOfMaterial: 15,
    warehouses: 15
  });

  // Dataset size presets
  const datasetSizePresets = {
    small: { items: 5, customers: 3, vendors: 3, capabilities: 5, workCenters: 3, jobs: 5, recipes: 3, routings: 3, billsOfMaterial: 5, warehouses: 3 },
    medium: { items: 15, customers: 8, vendors: 8, capabilities: 12, workCenters: 6, jobs: 12, recipes: 8, routings: 8, billsOfMaterial: 10, warehouses: 6 },
    large: { items: 50, customers: 25, vendors: 20, capabilities: 30, workCenters: 15, jobs: 40, recipes: 25, routings: 20, billsOfMaterial: 35, warehouses: 12 }
  };

  // Update record counts when dataset size changes
  const handleDatasetSizeChange = (size: string) => {
    const validSize = size as 'small' | 'medium' | 'large';
    setDatasetSize(validSize);
    setRecordCounts(datasetSizePresets[validSize]);
  };

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
    'sales-orders': [
      { key: 'orderNumber', label: 'Order Number', editable: true, required: true },
      { key: 'customerName', label: 'Customer', editable: true, required: true },
      { key: 'description', label: 'Description', editable: true },
      { key: 'status', label: 'Status', editable: true, type: 'select', options: [
        { value: 'draft', label: 'Draft' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'in_production', label: 'In Production' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' }
      ]},
      { key: 'priority', label: 'Priority', editable: true, type: 'select', options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]},
      { key: 'quantity', label: 'Quantity', editable: true, type: 'number' },
      { key: 'requestedDate', label: 'Requested Date', editable: true, type: 'date' },
      { key: 'promisedDate', label: 'Promised Date', editable: true, type: 'date' }
    ],
    jobs: [
      { key: 'externalId', label: 'Job ID', editable: false, required: true },
      { key: 'description', label: 'Description', editable: true },
      { key: 'priority', label: 'Priority', editable: true, type: 'number' },
      { key: 'scheduled', label: 'Scheduled', editable: false, type: 'boolean' },
      { key: 'needDateTime', label: 'Need Date', editable: true, type: 'date' },
      { key: 'product', label: 'Product', editable: true },
      { key: 'qty', label: 'Quantity', editable: true, type: 'number' }
    ],
    'job-templates': [
      { key: 'templateNumber', label: 'Template Number', editable: true, required: true },
      { key: 'templateName', label: 'Template Name', editable: true, required: true },
      { key: 'productItemNumber', label: 'Product Item', editable: true, required: true },
      { key: 'templateVersion', label: 'Version', editable: true },
      { key: 'status', label: 'Status', editable: true, type: 'select', options: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'archived', label: 'Archived' }
      ]},
      { key: 'standardBatchSize', label: 'Standard Batch Size', editable: true, type: 'number' },
      { key: 'batchUnit', label: 'Batch Unit', editable: true },
      { key: 'estimatedDuration', label: 'Est. Duration (hrs)', editable: true, type: 'number' }
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
    ],
    warehouses: [
      { key: 'name', label: 'Name', editable: true, required: true },
      { key: 'description', label: 'Description', editable: true },
      { key: 'externalId', label: 'External ID', editable: true },
      { key: 'nbrOfDocks', label: 'Number of Docks', editable: true, type: 'number' },
      { key: 'storageCapacity', label: 'Storage Capacity', editable: true, type: 'number' },
      { key: 'annualPercentageRate', label: 'Annual Rate %', editable: true, type: 'number' },
      { key: 'tankWarehouse', label: 'Tank Warehouse', editable: true, type: 'boolean' },
      { key: 'notes', label: 'Notes', editable: true }
    ]
  };

  // API endpoints for each entity type
  const endpoints: Record<string, string> = {
    items: '/api/stock-items',
    resources: '/api/resources',
    capabilities: '/api/capabilities',
    'sales-orders': '/api/sales-orders',
    jobs: '/api/jobs',
    'job-templates': '/api/job-templates',
    plants: '/api/plants',
    users: '/api/users',
    customers: '/api/customers',
    vendors: '/api/vendors',
    warehouses: '/api/warehouses'
  };

  // Data queries
  const { data, isLoading, refetch } = useQuery({
    queryKey: [endpoints[activeTab]],
    queryFn: async () => {
      const response = await apiRequest('GET', endpoints[activeTab]);
      return await response.json();
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

  const handleBulkGenerate = async () => {
    setAiProcessing(true);
    try {
      const response = await apiRequest('POST', '/api/master-data/bulk-generate', {
        recordCounts: recordCounts,
        companyInfo: companyInfo.trim() || undefined,
        replaceExisting: replaceExisting
      });
      
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Bulk Generation Successful',
          description: `Generated ${result.totalRecords} records across all entity types. Refresh your browser to see the new data.`,
        });
        
        // Refresh all data queries
        Object.values(endpoints).forEach(endpoint => {
          queryClient.invalidateQueries({ queryKey: [endpoint] });
        });
        
        setShowAiAssistant(false);
      } else {
        throw new Error(result.message || 'Bulk generation failed');
      }
    } catch (error) {
      console.error('Bulk generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate bulk sample data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAiProcessing(false);
    }
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
            <Sparkles className="h-4 w-4 sm:mr-2" />
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
                <TabsTrigger value="sales-orders" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Sales Orders</TabsTrigger>
                <TabsTrigger value="jobs" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Jobs</TabsTrigger>
                <TabsTrigger value="job-templates" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Job Templates</TabsTrigger>
                <TabsTrigger value="plants" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Plants</TabsTrigger>
                <TabsTrigger value="users" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Users</TabsTrigger>
                <TabsTrigger value="customers" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Customers</TabsTrigger>
                <TabsTrigger value="vendors" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Vendors</TabsTrigger>
                <TabsTrigger value="warehouses" className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">Warehouses</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-3 sm:p-6">
              <TabsContent value={activeTab} className="mt-0">
                {activeTab === 'jobs' ? (
                  <HierarchicalDataTable
                    data={data || []}
                    columns={columns[activeTab]}
                    entityType={activeTab}
                    onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                    onCreate={(data) => createMutation.mutate(data)}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    isLoading={isLoading}
                    onShowAiAssistant={() => setShowAiAssistant(true)}
                    setSelectedJobForPath={setSelectedJobForPath}
                  />
                ) : (
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
                )}
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
              <Sparkles className="h-5 w-5" />
              AI Master Data Assistant
            </DialogTitle>
            <DialogDescription>
              Get AI-powered help with your master data - generate new entries, improve existing data, or get suggestions for better data management across all entity types.
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
                <Sparkles className="h-4 w-4 mr-1 sm:mr-2" />
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

            {/* Bulk Generation Section */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Quick Setup</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate comprehensive sample data for all entity types based on your industry and company details.
              </p>
              
              {/* Dataset Size Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Dataset Size (Current: {datasetSize})</label>
                <div className="flex flex-row space-x-6">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => handleDatasetSizeChange('small')}
                  >
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${datasetSize === 'small' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {datasetSize === 'small' && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-sm ${datasetSize === 'small' ? 'font-semibold text-blue-600' : ''}`}>
                      Small (3-5 records each)
                    </span>
                  </div>
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => handleDatasetSizeChange('medium')}
                  >
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${datasetSize === 'medium' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {datasetSize === 'medium' && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-sm ${datasetSize === 'medium' ? 'font-semibold text-blue-600' : ''}`}>
                      Medium (8-15 records each)
                    </span>
                  </div>
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => handleDatasetSizeChange('large')}
                  >
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${datasetSize === 'large' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {datasetSize === 'large' && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                    </div>
                    <span className={`text-sm ${datasetSize === 'large' ? 'font-semibold text-blue-600' : ''}`}>
                      Large (20-50 records each)
                    </span>
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="p-0 h-auto text-sm text-blue-600 hover:text-blue-700"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </Button>
                
                {showAdvanced && (
                  <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/50">
                    <div className="col-span-2 text-xs text-muted-foreground mb-2">
                      Customize the exact number of records to generate for each entity type:
                    </div>
                    {Object.entries(recordCounts).map(([entityType, count]) => (
                      <div key={entityType} className="flex items-center justify-between">
                        <label className="text-xs font-medium capitalize">
                          {entityType.replace(/([A-Z])/g, ' $1').trim()}:
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={count}
                          onChange={(e) => setRecordCounts(prev => ({
                            ...prev,
                            [entityType]: Math.max(0, parseInt(e.target.value) || 0)
                          }))}
                          className="w-16 h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company/Industry Information (Optional)</label>
                <Textarea
                  placeholder="Tell us about your company, industry, products you manufacture, or website URL so we can generate relevant sample data. For example: 'Automotive parts manufacturer' or 'Food processing company making beverages' or 'www.mycompany.com'"
                  value={companyInfo}
                  onChange={(e) => setCompanyInfo(e.target.value)}
                  rows={3}
                />
              </div>
              <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => setReplaceExisting(!replaceExisting)}
              >
                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${replaceExisting ? 'bg-primary border-primary' : 'border-input'}`}>
                  {replaceExisting && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium leading-none">
                  Replace existing data (delete all current master data first)
                </span>
              </div>
              <Button 
                onClick={handleBulkGenerate}
                disabled={aiProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Sample Data for All Tables
                <span className="ml-2 text-xs opacity-75">
                  ({Object.values(recordCounts).reduce((a, b) => a + b, 0)} total records)
                </span>
              </Button>
            </div>

            {aiProcessing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                AI is working on your {activeTab} request...
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

      {/* Manufacturing Path Viewer */}
      {selectedJobForPath && (
        <ManufacturingPathViewer
          jobId={selectedJobForPath.id}
          jobDescription={selectedJobForPath.description}
          onClose={() => setSelectedJobForPath(null)}
        />
      )}
    </div>
  );
}