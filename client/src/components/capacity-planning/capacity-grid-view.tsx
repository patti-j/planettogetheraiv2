import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Grid3X3, 
  Download, 
  Upload, 
  Filter, 
  Search, 
  MoreHorizontal,
  Edit,
  Save,
  X,
  Plus,
  RefreshCw,
  Calculator,
  TrendingUp,
  AlertTriangle,
  Check
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CapacityGridData {
  id: string;
  resourceName: string;
  resourceType: string;
  plant: string;
  currentCapacity: number;
  availableCapacity: number;
  utilization: number;
  demandForecast: number;
  capacityGap: number;
  weeklyForecast: number[];
  status: 'normal' | 'warning' | 'critical';
  notes: string;
}

interface CapacityGridViewProps {
  resources: any[];
  scenarios: any[];
  projections: any[];
  onDataUpdate?: (data: CapacityGridData[]) => void;
}

export default function CapacityGridView({ 
  resources = [], 
  scenarios = [], 
  projections = [],
  onDataUpdate 
}: CapacityGridViewProps) {
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlant, setFilterPlant] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Generate comprehensive capacity grid data
  const gridData = useMemo<CapacityGridData[]>(() => {
    return resources.map((resource, index) => {
      const baseCapacity = 160; // Base weekly hours
      const utilization = 65 + Math.random() * 25; // 65-90%
      const currentCapacity = baseCapacity;
      const usedCapacity = (utilization / 100) * currentCapacity;
      const availableCapacity = currentCapacity - usedCapacity;
      const demandForecast = usedCapacity + (Math.random() * 40 - 20); // ±20 variation
      const capacityGap = availableCapacity - demandForecast;
      
      // Generate 12-week forecast
      const weeklyForecast = Array.from({ length: 12 }, (_, week) => {
        const baseUtil = utilization;
        const seasonalVariation = Math.sin((week / 12) * Math.PI * 2) * 10;
        const randomVariation = (Math.random() - 0.5) * 15;
        return Math.max(0, Math.min(100, baseUtil + seasonalVariation + randomVariation));
      });

      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (utilization > 85) status = 'critical';
      else if (utilization > 75 || capacityGap < 10) status = 'warning';

      return {
        id: resource.id?.toString() || index.toString(),
        resourceName: resource.name || `Resource ${index + 1}`,
        resourceType: resource.type || 'General',
        plant: `Plant ${(index % 3) + 1}`,
        currentCapacity,
        availableCapacity: Math.round(availableCapacity),
        utilization: Math.round(utilization),
        demandForecast: Math.round(demandForecast),
        capacityGap: Math.round(capacityGap),
        weeklyForecast,
        status,
        notes: status === 'critical' ? 'Capacity constraint' : status === 'warning' ? 'Monitor closely' : ''
      };
    });
  }, [resources]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return gridData.filter(row => {
      const matchesSearch = searchTerm === '' || 
        row.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.plant.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlant = filterPlant === 'all' || row.plant === filterPlant;
      const matchesStatus = filterStatus === 'all' || row.status === filterStatus;
      
      return matchesSearch && matchesPlant && matchesStatus;
    });
  }, [gridData, searchTerm, filterPlant, filterStatus]);

  const handleCellEdit = useCallback((rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue?.toString() || '');
  }, []);

  const handleCellSave = useCallback(() => {
    if (!editingCell) return;
    
    // In a real implementation, this would update the backend
    toast({
      title: "Cell Updated",
      description: `${editingCell.field} updated to ${editValue}`,
    });
    
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, toast]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 85) return 'text-red-600 font-semibold';
    if (utilization > 75) return 'text-yellow-600 font-medium';
    return 'text-green-600';
  };

  const plants = [...new Set(gridData.map(row => row.plant))];

  const EditableCell = ({ 
    value, 
    rowId, 
    field, 
    type = 'text',
    className = '' 
  }: { 
    value: any; 
    rowId: string; 
    field: string; 
    type?: string;
    className?: string;
  }) => {
    const isEditing = editingCell?.rowId === rowId && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            className="h-8 text-xs"
            type={type}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleCellSave} className="h-6 w-6 p-0">
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCellCancel} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className={`cursor-pointer hover:bg-gray-50 p-1 rounded ${className}`}
        onClick={() => handleCellEdit(rowId, field, value)}
      >
        {type === 'number' ? Number(value).toLocaleString() : value}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            <CardTitle>Capacity Planning Grid</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters and Search */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={filterPlant} onValueChange={setFilterPlant}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Plants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plants</SelectItem>
              {plants.map(plant => (
                <SelectItem key={plant} value={plant}>{plant}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1"></div>
          
          <Badge variant="outline">
            {filteredData.length} of {gridData.length} resources
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Utilization</p>
                <p className="text-xl font-semibold">
                  {Math.round(filteredData.reduce((sum, row) => sum + row.utilization, 0) / filteredData.length || 0)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Available Capacity</p>
                <p className="text-xl font-semibold">
                  {filteredData.reduce((sum, row) => sum + row.availableCapacity, 0).toLocaleString()}h
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Capacity Gaps</p>
                <p className="text-xl font-semibold">
                  {filteredData.filter(row => row.capacityGap < 0).length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Critical Resources</p>
                <p className="text-xl font-semibold">
                  {filteredData.filter(row => row.status === 'critical').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Excel-like Grid */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(filteredData.map(row => row.id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="min-w-40">Resource</TableHead>
                <TableHead className="min-w-28">Type</TableHead>
                <TableHead className="min-w-24">Plant</TableHead>
                <TableHead className="min-w-32 text-center">Current Capacity (h)</TableHead>
                <TableHead className="min-w-32 text-center">Available (h)</TableHead>
                <TableHead className="min-w-28 text-center">Utilization %</TableHead>
                <TableHead className="min-w-32 text-center">Demand Forecast</TableHead>
                <TableHead className="min-w-28 text-center">Capacity Gap</TableHead>
                <TableHead className="min-w-24 text-center">Status</TableHead>
                <TableHead className="min-w-60">12-Week Forecast</TableHead>
                <TableHead className="min-w-60">Notes</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={`hover:bg-gray-50 ${selectedRows.has(row.id) ? 'bg-blue-50' : ''}`}
                >
                  <TableCell>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.has(row.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(row.id);
                        } else {
                          newSelected.delete(row.id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    />
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    <EditableCell value={row.resourceName} rowId={row.id} field="resourceName" />
                  </TableCell>
                  
                  <TableCell>
                    <EditableCell value={row.resourceType} rowId={row.id} field="resourceType" />
                  </TableCell>
                  
                  <TableCell>
                    <EditableCell value={row.plant} rowId={row.id} field="plant" />
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <EditableCell 
                      value={row.currentCapacity} 
                      rowId={row.id} 
                      field="currentCapacity" 
                      type="number"
                    />
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <EditableCell 
                      value={row.availableCapacity} 
                      rowId={row.id} 
                      field="availableCapacity" 
                      type="number"
                    />
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <EditableCell 
                      value={`${row.utilization}%`} 
                      rowId={row.id} 
                      field="utilization" 
                      className={getUtilizationColor(row.utilization)}
                    />
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <EditableCell 
                      value={row.demandForecast} 
                      rowId={row.id} 
                      field="demandForecast" 
                      type="number"
                    />
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <EditableCell 
                      value={row.capacityGap} 
                      rowId={row.id} 
                      field="capacityGap" 
                      type="number"
                      className={row.capacityGap < 0 ? 'text-red-600 font-semibold' : 'text-green-600'}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(row.status)}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {row.weeklyForecast.slice(0, 8).map((forecast, index) => (
                        <div 
                          key={index}
                          className={`h-6 w-6 text-xs rounded flex items-center justify-center ${
                            forecast > 85 ? 'bg-red-100 text-red-700' :
                            forecast > 75 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}
                          title={`Week ${index + 1}: ${Math.round(forecast)}%`}
                        >
                          {Math.round(forecast)}
                        </div>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">+4 more</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="min-w-60">
                    <EditableCell value={row.notes} rowId={row.id} field="notes" />
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          View Forecast
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Add Scenario
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Bulk Actions */}
        {selectedRows.size > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">
                {selectedRows.size} resource{selectedRows.size > 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  Bulk Edit
                </Button>
                <Button size="sm" variant="outline">
                  Export Selected
                </Button>
                <Button size="sm" variant="outline">
                  Create Scenario
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}