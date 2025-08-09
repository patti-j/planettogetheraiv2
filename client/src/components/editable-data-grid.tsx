import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Save, X, Edit2, Plus, Trash2, Copy, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Column {
  key: string;
  header: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'json';
  width?: string;
  editable?: boolean;
  options?: { value: string; label: string }[];
  required?: boolean;
  validation?: (value: any) => boolean | string;
}

interface EditableDataGridProps {
  columns: Column[];
  data: any[];
  onSave?: (updatedData: any[]) => Promise<void>;
  onRowUpdate?: (rowIndex: number, updatedRow: any) => Promise<void>;
  onRowDelete?: (rowIndex: number) => Promise<void>;
  onRowAdd?: (newRow: any) => Promise<void>;
  allowAdd?: boolean;
  allowDelete?: boolean;
  allowBulkEdit?: boolean;
  className?: string;
  gridHeight?: string;
}

export function EditableDataGrid({
  columns,
  data: initialData,
  onSave,
  onRowUpdate,
  onRowDelete,
  onRowAdd,
  allowAdd = true,
  allowDelete = true,
  allowBulkEdit = false,
  className,
  gridHeight = "600px"
}: EditableDataGridProps) {
  const [data, setData] = useState(initialData);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setData(initialData);
    setHasChanges(false);
  }, [initialData]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      return columns.some(col => {
        const value = row[col.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const startEditing = (rowIndex: number, colKey: string, currentValue: any) => {
    const column = columns.find(c => c.key === colKey);
    if (column?.editable === false) return;
    
    setEditingCell({ row: rowIndex, col: colKey });
    setEditValue(currentValue ?? '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveCell = async (rowIndex: number, colKey: string) => {
    const column = columns.find(c => c.key === colKey);
    if (!column) return;

    // Validate value
    if (column.validation) {
      const validationResult = column.validation(editValue);
      if (validationResult !== true) {
        toast({
          title: "Validation Error",
          description: typeof validationResult === 'string' ? validationResult : 'Invalid value',
          variant: "destructive"
        });
        return;
      }
    }

    // Update local data
    const newData = [...data];
    const actualRowIndex = data.indexOf(sortedData[rowIndex]);
    newData[actualRowIndex] = {
      ...newData[actualRowIndex],
      [colKey]: editValue
    };
    
    setData(newData);
    setHasChanges(true);
    setEditingCell(null);
    setEditValue('');

    // Call row update callback if provided
    if (onRowUpdate) {
      setIsLoading(true);
      try {
        await onRowUpdate(actualRowIndex, newData[actualRowIndex]);
        toast({
          title: "Success",
          description: "Row updated successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update row",
          variant: "destructive"
        });
        // Revert changes on error
        setData(initialData);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colKey: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveCell(rowIndex, colKey);
    } else if (e.key === 'Escape') {
      cancelEditing();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveCell(rowIndex, colKey);
      // Move to next editable cell
      const colIndex = columns.findIndex(c => c.key === colKey);
      const nextCol = columns.slice(colIndex + 1).find(c => c.editable !== false);
      if (nextCol) {
        startEditing(rowIndex, nextCol.key, sortedData[rowIndex][nextCol.key]);
      }
    }
  };

  const addNewRow = async () => {
    const newRow: any = {};
    columns.forEach(col => {
      if (col.type === 'boolean') {
        newRow[col.key] = false;
      } else if (col.type === 'number') {
        newRow[col.key] = 0;
      } else if (col.type === 'json') {
        newRow[col.key] = {};
      } else {
        newRow[col.key] = '';
      }
    });

    if (onRowAdd) {
      setIsLoading(true);
      try {
        await onRowAdd(newRow);
        toast({
          title: "Success",
          description: "New row added successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add new row",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setData([...data, newRow]);
      setHasChanges(true);
    }
  };

  const deleteRow = async (rowIndex: number) => {
    const actualRowIndex = data.indexOf(sortedData[rowIndex]);
    
    if (onRowDelete) {
      setIsLoading(true);
      try {
        await onRowDelete(actualRowIndex);
        toast({
          title: "Success",
          description: "Row deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete row",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      const newData = data.filter((_, index) => index !== actualRowIndex);
      setData(newData);
      setHasChanges(true);
    }
  };

  const deleteSelectedRows = async () => {
    const rowsToDelete = Array.from(selectedRows).map(index => data.indexOf(sortedData[index]));
    
    if (onRowDelete) {
      setIsLoading(true);
      try {
        await Promise.all(rowsToDelete.map(index => onRowDelete(index)));
        toast({
          title: "Success",
          description: `${rowsToDelete.length} rows deleted successfully`
        });
        setSelectedRows(new Set());
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete some rows",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      const newData = data.filter((_, index) => !rowsToDelete.includes(index));
      setData(newData);
      setSelectedRows(new Set());
      setHasChanges(true);
    }
  };

  const saveAllChanges = async () => {
    if (!onSave || !hasChanges) return;
    
    setIsLoading(true);
    try {
      await onSave(data);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "All changes saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRowSelection = (rowIndex: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedData.map((_, index) => index)));
    }
  };

  const renderCell = (row: any, column: Column, rowIndex: number) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === column.key;
    const value = row[column.key];

    if (isEditing) {
      switch (column.type) {
        case 'boolean':
          return (
            <Checkbox
              checked={editValue}
              onCheckedChange={(checked) => {
                setEditValue(checked);
                saveCell(rowIndex, column.key);
              }}
              className="h-3 w-3 sm:h-4 sm:w-4"
            />
          );
        case 'select':
          return (
            <Select
              value={editValue}
              onValueChange={(value) => {
                setEditValue(value);
                saveCell(rowIndex, column.key);
              }}
            >
              <SelectTrigger className="h-6 sm:h-8 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {column.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case 'number':
          return (
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value ? Number(e.target.value) : '')}
              onKeyDown={(e) => handleKeyDown(e, rowIndex, column.key)}
              onBlur={() => saveCell(rowIndex, column.key)}
              className="h-6 sm:h-8 text-xs sm:text-sm px-1 sm:px-2"
              autoFocus
            />
          );
        default:
          return (
            <Input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, rowIndex, column.key)}
              onBlur={() => saveCell(rowIndex, column.key)}
              className="h-6 sm:h-8 text-xs sm:text-sm px-1 sm:px-2"
              autoFocus
            />
          );
      }
    }

    // Display mode
    if (column.type === 'boolean') {
      return <Checkbox checked={!!value} disabled className="h-3 w-3 sm:h-4 sm:w-4" />;
    } else if (column.type === 'json') {
      return (
        <span className="text-[10px] sm:text-xs font-mono truncate block max-w-[100px] sm:max-w-[150px]">
          {value ? JSON.stringify(value) : '{}'}
        </span>
      );
    } else {
      return (
        <div
          className="cursor-pointer px-1 sm:px-2 py-0.5 sm:py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded text-xs sm:text-sm"
          onClick={() => startEditing(rowIndex, column.key, value)}
        >
          {value ?? <span className="text-gray-400">--</span>}
        </div>
      );
    }
  };

  return (
    <div className={cn("flex flex-col space-y-2 sm:space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 bg-white dark:bg-gray-900 p-2 sm:p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 sm:pl-9 w-full sm:w-48 md:w-64 h-8 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          
          {allowBulkEdit && selectedRows.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedRows}
              disabled={isLoading}
              className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Delete {selectedRows.size} rows</span>
              <span className="sm:hidden">Delete ({selectedRows.size})</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allowAdd && (
            <Button
              variant="outline"
              size="sm"
              onClick={addNewRow}
              disabled={isLoading}
              className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 flex-1 sm:flex-none"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Add Row</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
          
          {hasChanges && onSave && (
            <Button
              variant="default"
              size="sm"
              onClick={saveAllChanges}
              disabled={isLoading}
              className="text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 flex-1 sm:flex-none"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Save All Changes</span>
              <span className="sm:hidden">Save</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="overflow-auto" style={{ maxHeight: gridHeight }}>
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                {allowBulkEdit && (
                  <th className="p-1 sm:p-2 text-left border-b">
                    <Checkbox
                      checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                      onCheckedChange={toggleAllSelection}
                      className="h-3 w-3 sm:h-4 sm:w-4"
                    />
                  </th>
                )}
                {columns.map(column => (
                  <th
                    key={column.key}
                    className="p-1 sm:p-2 text-left border-b cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    style={{ width: column.width }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs sm:text-sm">
                        {column.header}
                        {column.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                      {sortConfig?.key === column.key && (
                        sortConfig.direction === 'asc' ? 
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : 
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </div>
                  </th>
                ))}
                {allowDelete && (
                  <th className="p-1 sm:p-2 text-left border-b w-12 sm:w-20 text-xs sm:text-sm">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b hover:bg-gray-50 dark:hover:bg-gray-800",
                    selectedRows.has(rowIndex) && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  {allowBulkEdit && (
                    <td className="p-1 sm:p-2">
                      <Checkbox
                        checked={selectedRows.has(rowIndex)}
                        onCheckedChange={() => toggleRowSelection(rowIndex)}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td key={column.key} className="p-1 sm:p-2 text-xs sm:text-sm">
                      {renderCell(row, column, rowIndex)}
                    </td>
                  ))}
                  {allowDelete && (
                    <td className="p-1 sm:p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRow(rowIndex)}
                        disabled={isLoading}
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + (allowBulkEdit ? 1 : 0) + (allowDelete ? 1 : 0)}
                    className="p-4 sm:p-8 text-center text-gray-500 text-xs sm:text-sm"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 gap-1">
        <span>
          Showing {sortedData.length} of {data.length} rows
          {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
        </span>
        {hasChanges && (
          <span className="text-orange-500 text-xs sm:text-sm">
            Unsaved changes
          </span>
        )}
      </div>
    </div>
  );
}