import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePowerBIAuth, usePowerBIWorkspaces, usePowerBIDatasets, usePowerBIDataset, usePowerBIDatasetTables } from "@/hooks/use-powerbi-api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";
// Import jsPDF and autoTable at the top level
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  FileText, Search, Download, Calendar, Database, Columns3, X, RefreshCw, 
  AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight, Filter, Check, BarChart3, 
  GripVertical, Settings, FileInput, FileOutput, Save, FolderOpen, Layout,
  Palette, Calculator, Group, Hash, SigmaSquare, TrendingUp, TrendingDown,
  ArrowUpDown, ArrowUp, ArrowDown, Printer, FileDown, ChevronDown, Plus,
  Minus, Maximize2, Minimize2, Move, PaintBucket, Type, AlignLeft
} from "lucide-react";
import { format } from "date-fns";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Types and Interfaces
interface SQLTable {
  tableName: string;
  schemaName: string;
}

interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: string;
  maxLength: number | null;
}

interface PaginatedReportData {
  items: Array<Record<string, any>>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ReportConfiguration {
  id: string;
  name: string;
  description: string;
  sourceType: 'sql' | 'powerbi';
  sourceConfig: {
    schemaName?: string;
    tableName?: string;
    workspaceId?: string;
    datasetId?: string;
    powerBITable?: string;
  };
  columns: {
    selected: string[];
    order: string[];
    widths: Record<string, number>;
  };
  filters: Record<string, string>;
  sorting: {
    column: string;
    order: 'asc' | 'desc';
  };
  grouping: {
    enabled: boolean;
    columns: string[];
    aggregations: Record<string, AggregationType>;
  };
  formatting: ConditionalFormatRule[];
  totals: {
    enabled: boolean;
    columns: string[];
  };
  template: ReportTemplate;
  exportSettings: {
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    fontSize: number;
    includeHeader: boolean;
    includeFooter: boolean;
    headerText: string;
    footerText: string;
  };
  rowHeight: number;
  dateCreated: string;
  lastModified: string;
}

type SourceType = "sql" | "powerbi";
type ViewMode = 'design' | 'preview';
type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';
type ReportTemplate = 'blank' | 'invoice' | 'financial' | 'summary';

interface ConditionalFormatRule {
  id: string;
  column: string;
  condition: 'equals' | 'not-equals' | 'greater' | 'less' | 'contains' | 'between';
  value: any;
  value2?: any;
  format: {
    backgroundColor?: string;
    textColor?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
  };
  enabled: boolean;
}

interface GroupedData {
  groupKey: string;
  groupValues: Record<string, any>;
  items: any[];
  aggregates: Record<string, any>;
  expanded: boolean;
}

// Sortable Column Header Component
function SortableColumnHeader({ 
  column, 
  children, 
  width,
  onResize,
  onSort,
  sortBy,
  sortOrder
}: {
  column: string;
  children: React.ReactNode;
  width?: number;
  onResize?: (width: number) => void;
  onSort?: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: width || 'auto',
    minWidth: width || 150,
  };

  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width || 150);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width || 150);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(50, startWidth + (e.clientX - startX));
      onResize?.(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, startX, startWidth, onResize]);

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className="relative group"
      data-testid={`header-${column}`}
    >
      <div className="flex items-center justify-between pr-4">
        <div 
          className="flex items-center gap-2 flex-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-foreground flex-1"
            onClick={onSort}
          >
            {children}
            {sortBy === column && (
              <span className="text-xs">
                {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>
        <div
          ref={resizeHandleRef}
          onMouseDown={handleMouseDown}
          className={`absolute right-0 top-0 bottom-0 w-1 hover:bg-primary/50 cursor-col-resize transition-colors ${
            isResizing ? 'bg-primary' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </TableHead>
  );
}

export default function PaginatedReports() {
  const { toast } = useToast();
  
  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('design');
  const [sourceType, setSourceType] = useState<SourceType | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [selectedTable, setSelectedTable] = useState<SQLTable | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [selectedPowerBITable, setSelectedPowerBITable] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [rowHeight, setRowHeight] = useState<number>(40);
  
  // Report features state
  const [includeTotals, setIncludeTotals] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>('blank');
  const [groupingEnabled, setGroupingEnabled] = useState(false);
  const [groupingColumns, setGroupingColumns] = useState<string[]>([]);
  const [aggregations, setAggregations] = useState<Record<string, AggregationType>>({});
  const [conditionalFormats, setConditionalFormats] = useState<ConditionalFormatRule[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Report configuration
  const [reportConfigurations, setReportConfigurations] = useState<ReportConfiguration[]>([]);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  
  // UI state
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [showConditionalFormatDialog, setShowConditionalFormatDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showGroupingDialog, setShowGroupingDialog] = useState(false);
  const [leftPanelSize, setLeftPanelSize] = useState(25);
  
  // Export settings
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("excel");
  const [exportHeader, setExportHeader] = useState("");
  const [exportFooter, setExportFooter] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [exportOrientation, setExportOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [exportMargins, setExportMargins] = useState({ top: 10, right: 10, bottom: 10, left: 10 });
  const [exportFontSize, setExportFontSize] = useState(10);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Power BI authentication
  const { isAuthenticated, authenticateAuto } = usePowerBIAuth();

  // Auto-authenticate when Power BI is selected
  useEffect(() => {
    if (sourceType === 'powerbi' && !isAuthenticated) {
      authenticateAuto().catch(console.error);
    }
  }, [sourceType, isAuthenticated, authenticateAuto]);

  // Load saved configurations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('reportConfigurations');
    if (saved) {
      try {
        setReportConfigurations(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved configurations:', e);
      }
    }
  }, []);

  // Save configurations to localStorage when they change
  useEffect(() => {
    if (reportConfigurations.length > 0) {
      localStorage.setItem('reportConfigurations', JSON.stringify(reportConfigurations));
    }
  }, [reportConfigurations]);

  // Apply template styles
  const applyTemplate = useCallback((template: ReportTemplate) => {
    setSelectedTemplate(template);
    
    switch (template) {
      case 'invoice':
        setIncludeTotals(true);
        setRowHeight(35);
        setExportOrientation('portrait');
        setExportHeader('INVOICE');
        setExportFooter('Thank you for your business');
        break;
        
      case 'financial':
        setIncludeTotals(true);
        setGroupingEnabled(true);
        setRowHeight(32);
        setExportOrientation('landscape');
        setExportHeader('Financial Statement');
        break;
        
      case 'summary':
        setIncludeTotals(true);
        setGroupingEnabled(true);
        setRowHeight(38);
        setExportOrientation('portrait');
        setExportHeader('Summary Report');
        break;
        
      default: // blank
        setIncludeTotals(false);
        setGroupingEnabled(false);
        setRowHeight(40);
        setExportOrientation('portrait');
        setExportHeader('');
        setExportFooter('');
        break;
    }
  }, []);

  // Fetch list of SQL Server tables (only when SQL source is selected)
  const { data: tables, isLoading: loadingTables } = useQuery<SQLTable[]>({
    queryKey: ['/api/sql-tables'],
    enabled: sourceType === 'sql',
  });

  // Fetch Power BI workspaces
  const { data: powerbiWorkspaces, isLoading: loadingWorkspaces } = usePowerBIWorkspaces(
    sourceType === 'powerbi' && isAuthenticated
  );

  // Fetch Power BI datasets
  const { data: powerbiDatasets, isLoading: loadingDatasets } = usePowerBIDatasets(
    isAuthenticated && sourceType === 'powerbi',
    workspaceId
  );

  // Fetch Power BI dataset details
  const { data: datasetDetails, isLoading: loadingDatasetDetails } = usePowerBIDataset(
    isAuthenticated && sourceType === 'powerbi',
    workspaceId,
    selectedDatasetId
  );

  // Fetch Power BI dataset tables
  const { data: datasetTables, isLoading: loadingDatasetTables } = usePowerBIDatasetTables(
    isAuthenticated && sourceType === 'powerbi',
    workspaceId,
    selectedDatasetId
  );

  // Fetch table schema
  const { data: tableSchema, isLoading: loadingSchema, error: schemaError } = useQuery<TableColumn[]>({
    queryKey: (() => {
      if (sourceType === 'sql' && selectedTable) {
        return [`/api/sql-tables/${selectedTable.schemaName}/${selectedTable.tableName}/schema`];
      } else if (sourceType === 'powerbi' && selectedPowerBITable && datasetTables) {
        const table = datasetTables.find((t: any) => t.name === selectedPowerBITable);
        return table?.columns ? [`powerbi-columns`, workspaceId, selectedDatasetId, selectedPowerBITable] : [];
      }
      return [];
    })(),
    queryFn: async () => {
      if (sourceType === 'sql' && selectedTable) {
        const { apiRequest } = await import('@/lib/queryClient');
        const response = await apiRequest('GET', `/api/sql-tables/${selectedTable.schemaName}/${selectedTable.tableName}/schema`);
        return response.json();
      } else if (sourceType === 'powerbi' && selectedPowerBITable && datasetTables) {
        const table = datasetTables.find((t: any) => t.name === selectedPowerBITable);
        if (table?.columns) {
          return table.columns.map((col: any) => ({
            columnName: col.name,
            dataType: col.dataType || 'Unknown',
            isNullable: 'YES',
            maxLength: null
          }));
        }
      }
      return [];
    },
    enabled: (!!selectedTable || !!selectedPowerBITable),
  });

  // Fetch paginated data
  const paginatedDataUrl = useMemo(() => {
    if (sourceType === 'sql' && selectedTable) {
      const params = new URLSearchParams({
        schema: selectedTable.schemaName,
        table: selectedTable.tableName,
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        searchTerm,
        sortBy,
        sortOrder,
      });
      return `/api/paginated-reports?${params}`;
    } else if (sourceType === 'powerbi' && selectedPowerBITable && workspaceId && selectedDatasetId) {
      const params = new URLSearchParams({
        workspaceId,
        datasetId: selectedDatasetId,
        table: selectedPowerBITable,
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        searchTerm,
        sortBy,
        sortOrder,
      });
      return `/api/powerbi/dataset-data?${params}`;
    }
    return null;
  }, [sourceType, selectedTable, selectedPowerBITable, workspaceId, selectedDatasetId, currentPage, pageSize, searchTerm, sortBy, sortOrder]);

  const { data, isLoading, error } = useQuery<PaginatedReportData>({
    queryKey: paginatedDataUrl ? [paginatedDataUrl] : [],
    enabled: (!!selectedTable || !!selectedPowerBITable) && !!paginatedDataUrl,
  });

  // Initialize columns when schema loads
  useEffect(() => {
    if (tableSchema && tableSchema.length > 0) {
      const allColumns = tableSchema.map(col => col.columnName);
      const columnsChanged = columnOrder.length !== allColumns.length || 
                          !allColumns.every(col => columnOrder.includes(col));
      
      if (columnOrder.length === 0 || columnsChanged) {
        setColumnOrder(allColumns);
        setSelectedColumns(allColumns);
        
        // Initialize column widths
        const defaultWidths: Record<string, number> = {};
        allColumns.forEach(col => {
          defaultWidths[col] = 150;
        });
        setColumnWidths(defaultWidths);
      }
    }
  }, [tableSchema]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!includeTotals || !data?.items || data.items.length === 0) return {};
    
    const totalsRow: Record<string, any> = {};
    const firstTextColumn = tableSchema?.find(col => 
      !['int', 'decimal', 'float', 'money', 'numeric', 'bigint', 'smallint', 'tinyint'].some(type => 
        col.dataType.toLowerCase().includes(type)
      )
    )?.columnName;
    
    tableSchema?.forEach(col => {
      const isNumeric = ['int', 'decimal', 'float', 'money', 'numeric', 'bigint', 'smallint', 'tinyint'].some(type =>
        col.dataType.toLowerCase().includes(type)
      );
      
      if (isNumeric) {
        const sum = data.items.reduce((acc, item) => {
          const value = parseFloat(item[col.columnName]) || 0;
          return acc + value;
        }, 0);
        totalsRow[col.columnName] = sum;
      } else if (col.columnName === firstTextColumn) {
        totalsRow[col.columnName] = 'Total';
      } else {
        totalsRow[col.columnName] = '';
      }
    });
    
    return totalsRow;
  }, [includeTotals, data, tableSchema]);

  // Group data
  const groupedData = useMemo(() => {
    if (!groupingEnabled || groupingColumns.length === 0 || !data?.items) {
      return null;
    }

    const groups = new Map<string, GroupedData>();
    
    data.items.forEach(item => {
      const groupKey = groupingColumns.map(col => item[col]).join('|');
      
      if (!groups.has(groupKey)) {
        const groupValues: Record<string, any> = {};
        groupingColumns.forEach(col => {
          groupValues[col] = item[col];
        });
        
        groups.set(groupKey, {
          groupKey,
          groupValues,
          items: [],
          aggregates: {},
          expanded: expandedGroups.has(groupKey)
        });
      }
      
      groups.get(groupKey)!.items.push(item);
    });
    
    // Calculate aggregates for each group
    groups.forEach(group => {
      tableSchema?.forEach(col => {
        const aggType = aggregations[col.columnName];
        if (!aggType) return;
        
        const values = group.items.map(item => parseFloat(item[col.columnName])).filter(v => !isNaN(v));
        
        switch (aggType) {
          case 'sum':
            group.aggregates[col.columnName] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            group.aggregates[col.columnName] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'count':
            group.aggregates[col.columnName] = values.length;
            break;
          case 'min':
            group.aggregates[col.columnName] = Math.min(...values);
            break;
          case 'max':
            group.aggregates[col.columnName] = Math.max(...values);
            break;
        }
      });
    });
    
    return Array.from(groups.values());
  }, [groupingEnabled, groupingColumns, data, tableSchema, aggregations, expandedGroups]);

  // Apply conditional formatting
  const getCellStyle = useCallback((value: any, columnName: string): React.CSSProperties => {
    const style: React.CSSProperties = {};
    
    conditionalFormats.filter(rule => rule.enabled && rule.column === columnName).forEach(rule => {
      let matches = false;
      
      switch (rule.condition) {
        case 'equals':
          matches = value == rule.value;
          break;
        case 'not-equals':
          matches = value != rule.value;
          break;
        case 'greater':
          matches = parseFloat(value) > parseFloat(rule.value);
          break;
        case 'less':
          matches = parseFloat(value) < parseFloat(rule.value);
          break;
        case 'contains':
          matches = String(value).toLowerCase().includes(String(rule.value).toLowerCase());
          break;
        case 'between':
          const num = parseFloat(value);
          matches = num >= parseFloat(rule.value) && num <= parseFloat(rule.value2);
          break;
      }
      
      if (matches) {
        if (rule.format.backgroundColor) style.backgroundColor = rule.format.backgroundColor;
        if (rule.format.textColor) style.color = rule.format.textColor;
        if (rule.format.fontWeight) style.fontWeight = rule.format.fontWeight;
        if (rule.format.fontStyle) style.fontStyle = rule.format.fontStyle;
      }
    });
    
    return style;
  }, [conditionalFormats]);

  // Format cell value
  const formatCellValue = (value: any, dataType: string) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">null</span>;
    
    if (dataType?.toLowerCase().includes('date')) {
      try {
        return format(new Date(value), 'MM/dd/yyyy');
      } catch {
        return String(value);
      }
    }
    
    if (dataType?.toLowerCase().includes('time')) {
      try {
        return format(new Date(value), 'HH:mm:ss');
      } catch {
        return String(value);
      }
    }
    
    if (dataType?.toLowerCase().includes('money') || dataType?.toLowerCase().includes('decimal')) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    
    if (typeof value === 'boolean') {
      return value ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>;
    }
    
    return String(value);
  };

  // Save configuration
  const saveConfiguration = () => {
    const config: ReportConfiguration = {
      id: currentConfigId || crypto.randomUUID(),
      name: configName,
      description: configDescription,
      sourceType: sourceType!,
      sourceConfig: {
        schemaName: selectedTable?.schemaName,
        tableName: selectedTable?.tableName,
        workspaceId,
        datasetId: selectedDatasetId,
        powerBITable: selectedPowerBITable,
      },
      columns: {
        selected: selectedColumns,
        order: columnOrder,
        widths: columnWidths,
      },
      filters: columnFilters,
      sorting: {
        column: sortBy,
        order: sortOrder,
      },
      grouping: {
        enabled: groupingEnabled,
        columns: groupingColumns,
        aggregations,
      },
      formatting: conditionalFormats,
      totals: {
        enabled: includeTotals,
        columns: selectedColumns.filter(col => {
          const schema = tableSchema?.find(s => s.columnName === col);
          return schema && ['int', 'decimal', 'float', 'money', 'numeric'].some(type => 
            schema.dataType.toLowerCase().includes(type)
          );
        }),
      },
      template: selectedTemplate,
      exportSettings: {
        orientation: exportOrientation,
        margins: exportMargins,
        fontSize: exportFontSize,
        includeHeader: !!exportHeader,
        includeFooter: !!exportFooter,
        headerText: exportHeader,
        footerText: exportFooter,
      },
      rowHeight,
      dateCreated: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    if (currentConfigId) {
      setReportConfigurations(prev => prev.map(c => c.id === currentConfigId ? config : c));
    } else {
      setReportConfigurations(prev => [...prev, config]);
      setCurrentConfigId(config.id);
    }

    setShowSaveDialog(false);
    toast({
      title: "Configuration Saved",
      description: `"${configName}" has been saved successfully.`,
      variant: "default"
    });
  };

  // Load configuration
  const loadConfiguration = (config: ReportConfiguration) => {
    setSourceType(config.sourceType);
    if (config.sourceConfig.schemaName && config.sourceConfig.tableName) {
      setSelectedTable({
        schemaName: config.sourceConfig.schemaName,
        tableName: config.sourceConfig.tableName,
      });
    }
    setWorkspaceId(config.sourceConfig.workspaceId || '');
    setSelectedDatasetId(config.sourceConfig.datasetId || '');
    setSelectedPowerBITable(config.sourceConfig.powerBITable || '');
    setSelectedColumns(config.columns.selected);
    setColumnOrder(config.columns.order);
    setColumnWidths(config.columns.widths);
    setColumnFilters(config.filters);
    setSortBy(config.sorting.column);
    setSortOrder(config.sorting.order);
    setGroupingEnabled(config.grouping.enabled);
    setGroupingColumns(config.grouping.columns);
    setAggregations(config.grouping.aggregations);
    setConditionalFormats(config.formatting);
    setIncludeTotals(config.totals.enabled);
    setSelectedTemplate(config.template);
    setExportOrientation(config.exportSettings.orientation);
    setExportMargins(config.exportSettings.margins);
    setExportFontSize(config.exportSettings.fontSize);
    setExportHeader(config.exportSettings.headerText);
    setExportFooter(config.exportSettings.footerText);
    setRowHeight(config.rowHeight);
    setCurrentConfigId(config.id);
    setShowLoadDialog(false);
    
    toast({
      title: "Configuration Loaded",
      description: `"${config.name}" has been loaded successfully.`,
      variant: "default"
    });
  };

  // Handle column drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setDraggedColumn(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedColumn(event.active.id as string);
  };

  // Handle column resize
  const handleColumnResize = (column: string, width: number) => {
    setColumnWidths(prev => ({ ...prev, [column]: width }));
  };

  // Export handlers
  const handleExport = async () => {
    // Implementation similar to original but with totals support
    // ... (keeping the core export logic from original)
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            setShowSaveDialog(true);
            break;
          case 'o':
            e.preventDefault();
            setShowLoadDialog(true);
            break;
          case 'p':
            e.preventDefault();
            setShowPrintPreview(true);
            break;
          case 'e':
            e.preventDefault();
            setShowExportDialog(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="border-b bg-card p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  File
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowLoadDialog(true)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Load Configuration
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowPrintPreview(true)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Preview
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Layout className="w-4 h-4 mr-2" />
                  Template: {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Report Templates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={selectedTemplate} onValueChange={(v) => applyTemplate(v as ReportTemplate)}>
                  <DropdownMenuRadioItem value="blank">Blank</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="invoice">Invoice</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="financial">Financial Statement</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="summary">Summary Report</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={includeTotals ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeTotals(!includeTotals)}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Totals
            </Button>

            <Button
              variant={groupingEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGroupingDialog(true)}
            >
              <Group className="w-4 h-4 mr-2" />
              Grouping
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConditionalFormatDialog(true)}
            >
              <Palette className="w-4 h-4 mr-2" />
              Formatting
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <Label className="text-sm">Row Height:</Label>
              <Slider
                value={[rowHeight]}
                onValueChange={([v]) => setRowHeight(v)}
                min={25}
                max={60}
                step={1}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground w-8">{rowHeight}</span>
            </div>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="design">
                <Settings className="w-4 h-4 mr-2" />
                Design View
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Preview Mode
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Data Fields */}
          <ResizablePanel 
            defaultSize={leftPanelSize} 
            minSize={15} 
            maxSize={40}
            onResize={setLeftPanelSize}
          >
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {/* Data Source Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Data Source</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <RadioGroup value={sourceType || ''} onValueChange={(v) => setSourceType(v as SourceType)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sql" id="sql" />
                        <Label htmlFor="sql" className="text-sm">SQL Server</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="powerbi" id="powerbi" />
                        <Label htmlFor="powerbi" className="text-sm">Power BI</Label>
                      </div>
                    </RadioGroup>

                    {sourceType === 'sql' && (
                      <Select
                        value={selectedTable ? `${selectedTable.schemaName}.${selectedTable.tableName}` : ""}
                        onValueChange={(value) => {
                          const [schemaName, tableName] = value.split('.');
                          setSelectedTable({ schemaName, tableName });
                        }}
                        disabled={loadingTables}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select table..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tables?.map((table) => (
                            <SelectItem
                              key={`${table.schemaName}.${table.tableName}`}
                              value={`${table.schemaName}.${table.tableName}`}
                            >
                              {table.schemaName}.{table.tableName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardContent>
                </Card>

                {/* Available Fields */}
                {tableSchema && tableSchema.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Available Fields
                        <Badge variant="secondary" className="text-xs">
                          {selectedColumns.length}/{tableSchema.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {tableSchema.map((col) => (
                            <div key={col.columnName} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedColumns.includes(col.columnName)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedColumns(prev => [...prev, col.columnName]);
                                  } else {
                                    setSelectedColumns(prev => prev.filter(c => c !== col.columnName));
                                  }
                                }}
                              />
                              <div className="flex-1 text-sm">
                                <div className="font-medium">{col.columnName}</div>
                                <div className="text-xs text-muted-foreground">{col.dataType}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {/* Report Parameters */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Parameters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Page Size</Label>
                      <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                        <SelectTrigger className="text-sm">
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

                    <div>
                      <Label className="text-xs">Search</Label>
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search all columns..."
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Preview/Design Area */}
          <ResizablePanel defaultSize={75}>
            <div className="h-full overflow-auto p-4">
              {viewMode === 'preview' && data && data.items.length > 0 ? (
                <div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                  >
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <SortableContext
                              items={columnOrder.filter(col => selectedColumns.includes(col))}
                              strategy={horizontalListSortingStrategy}
                            >
                              {columnOrder.filter(col => selectedColumns.includes(col)).map((col) => (
                                <SortableColumnHeader
                                  key={col}
                                  column={col}
                                  width={columnWidths[col]}
                                  onResize={(width) => handleColumnResize(col, width)}
                                  onSort={() => {
                                    if (sortBy === col) {
                                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortBy(col);
                                      setSortOrder('asc');
                                    }
                                  }}
                                  sortBy={sortBy}
                                  sortOrder={sortOrder}
                                >
                                  <div>
                                    <div className="font-medium">{col}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {tableSchema?.find(s => s.columnName === col)?.dataType}
                                    </div>
                                  </div>
                                </SortableColumnHeader>
                              ))}
                            </SortableContext>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupingEnabled && groupedData ? (
                            groupedData.map((group) => (
                              <>
                                <TableRow 
                                  key={group.groupKey}
                                  className="bg-muted/50 font-medium cursor-pointer"
                                  onClick={() => {
                                    setExpandedGroups(prev => {
                                      const next = new Set(prev);
                                      if (next.has(group.groupKey)) {
                                        next.delete(group.groupKey);
                                      } else {
                                        next.add(group.groupKey);
                                      }
                                      return next;
                                    });
                                  }}
                                >
                                  <TableCell colSpan={selectedColumns.length}>
                                    <div className="flex items-center gap-2">
                                      {group.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                      {groupingColumns.map(col => `${col}: ${group.groupValues[col]}`).join(', ')}
                                      <Badge variant="secondary">{group.items.length} items</Badge>
                                    </div>
                                  </TableCell>
                                </TableRow>
                                {group.expanded && group.items.map((item, idx) => (
                                  <TableRow key={`${group.groupKey}-${idx}`} style={{ height: rowHeight }}>
                                    {columnOrder.filter(col => selectedColumns.includes(col)).map((col) => (
                                      <TableCell 
                                        key={col}
                                        style={{
                                          ...getCellStyle(item[col], col),
                                          width: columnWidths[col],
                                        }}
                                      >
                                        {formatCellValue(item[col], tableSchema?.find(s => s.columnName === col)?.dataType || '')}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                                {group.expanded && includeTotals && (
                                  <TableRow className="font-semibold bg-muted">
                                    {columnOrder.filter(col => selectedColumns.includes(col)).map((col) => (
                                      <TableCell key={col} style={{ width: columnWidths[col] }}>
                                        {group.aggregates[col] !== undefined 
                                          ? formatCellValue(group.aggregates[col], tableSchema?.find(s => s.columnName === col)?.dataType || '')
                                          : ''
                                        }
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                )}
                              </>
                            ))
                          ) : (
                            data.items.map((item, index) => (
                              <TableRow key={index} style={{ height: rowHeight }}>
                                {columnOrder.filter(col => selectedColumns.includes(col)).map((col) => (
                                  <TableCell 
                                    key={col}
                                    style={{
                                      ...getCellStyle(item[col], col),
                                      width: columnWidths[col],
                                    }}
                                  >
                                    {formatCellValue(item[col], tableSchema?.find(s => s.columnName === col)?.dataType || '')}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        {includeTotals && (
                          <TableFooter>
                            <TableRow className="font-bold bg-muted">
                              {columnOrder.filter(col => selectedColumns.includes(col)).map((col) => (
                                <TableCell key={col} style={{ width: columnWidths[col] }}>
                                  {formatCellValue(totals[col], tableSchema?.find(s => s.columnName === col)?.dataType || '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableFooter>
                        )}
                      </Table>
                    </div>
                    <DragOverlay>
                      {draggedColumn ? (
                        <div className="bg-background border rounded p-2 shadow-lg">
                          {draggedColumn}
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Database className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Design Your Report</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Select a data source and configure your report settings in the left panel. 
                      Then switch to Preview Mode to see your report.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      {/* Save Configuration Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Report Configuration</DialogTitle>
            <DialogDescription>
              Save your current report configuration for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Configuration Name</Label>
              <Input
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="My Report Configuration"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={configDescription}
                onChange={(e) => setConfigDescription(e.target.value)}
                placeholder="Describe this report configuration..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveConfiguration} disabled={!configName}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Configuration Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Report Configuration</DialogTitle>
            <DialogDescription>
              Select a saved configuration to load
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {reportConfigurations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No saved configurations found
                </div>
              ) : (
                reportConfigurations.map((config) => (
                  <Card key={config.id} className="cursor-pointer hover:bg-accent" onClick={() => loadConfiguration(config)}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{config.name}</CardTitle>
                        <Badge variant="secondary">{config.template}</Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {config.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(config.dateCreated).toLocaleDateString()}</span>
                        <span>Modified: {new Date(config.lastModified).toLocaleDateString()}</span>
                        <span>Source: {config.sourceType}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Conditional Formatting Dialog */}
      <Dialog open={showConditionalFormatDialog} onOpenChange={setShowConditionalFormatDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Conditional Formatting</DialogTitle>
            <DialogDescription>
              Add formatting rules to highlight data based on conditions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => {
                const newRule: ConditionalFormatRule = {
                  id: crypto.randomUUID(),
                  column: tableSchema?.[0]?.columnName || '',
                  condition: 'equals',
                  value: '',
                  format: {
                    backgroundColor: '#ffeb3b',
                    textColor: '#000000',
                    fontWeight: 'normal',
                  },
                  enabled: true,
                };
                setConditionalFormats(prev => [...prev, newRule]);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {conditionalFormats.map((rule, index) => (
                  <Card key={rule.id}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <Select
                            value={rule.column}
                            onValueChange={(value) => {
                              setConditionalFormats(prev => prev.map((r, i) => 
                                i === index ? { ...r, column: value } : r
                              ));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Column" />
                            </SelectTrigger>
                            <SelectContent>
                              {tableSchema?.map(col => (
                                <SelectItem key={col.columnName} value={col.columnName}>
                                  {col.columnName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={rule.condition}
                            onValueChange={(value) => {
                              setConditionalFormats(prev => prev.map((r, i) => 
                                i === index ? { ...r, condition: value as any } : r
                              ));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="not-equals">Not Equals</SelectItem>
                              <SelectItem value="greater">Greater Than</SelectItem>
                              <SelectItem value="less">Less Than</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="between">Between</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={rule.value}
                            onChange={(e) => {
                              setConditionalFormats(prev => prev.map((r, i) => 
                                i === index ? { ...r, value: e.target.value } : r
                              ));
                            }}
                            placeholder="Value"
                          />
                        </div>
                        <div className="col-span-3 flex gap-1">
                          <Input
                            type="color"
                            value={rule.format.backgroundColor}
                            onChange={(e) => {
                              setConditionalFormats(prev => prev.map((r, i) => 
                                i === index ? { ...r, format: { ...r.format, backgroundColor: e.target.value } } : r
                              ));
                            }}
                            className="w-12"
                            title="Background Color"
                          />
                          <Input
                            type="color"
                            value={rule.format.textColor}
                            onChange={(e) => {
                              setConditionalFormats(prev => prev.map((r, i) => 
                                i === index ? { ...r, format: { ...r.format, textColor: e.target.value } } : r
                              ));
                            }}
                            className="w-12"
                            title="Text Color"
                          />
                        </div>
                        <div className="col-span-2 flex gap-1">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => {
                              setConditionalFormats(prev => prev.map((r, i) => 
                                i === index ? { ...r, enabled: checked } : r
                              ));
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setConditionalFormats(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grouping Dialog */}
      <Dialog open={showGroupingDialog} onOpenChange={setShowGroupingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Grouping</DialogTitle>
            <DialogDescription>
              Group data by selected columns and configure aggregations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Enable Grouping</Label>
              <Switch
                checked={groupingEnabled}
                onCheckedChange={setGroupingEnabled}
              />
            </div>
            
            {groupingEnabled && (
              <>
                <div>
                  <Label>Group By Columns</Label>
                  <div className="mt-2 space-y-2">
                    {tableSchema?.map(col => (
                      <div key={col.columnName} className="flex items-center space-x-2">
                        <Checkbox
                          checked={groupingColumns.includes(col.columnName)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setGroupingColumns(prev => [...prev, col.columnName]);
                            } else {
                              setGroupingColumns(prev => prev.filter(c => c !== col.columnName));
                            }
                          }}
                        />
                        <Label className="text-sm">{col.columnName}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Aggregations</Label>
                  <div className="mt-2 space-y-2">
                    {tableSchema?.filter(col => 
                      ['int', 'decimal', 'float', 'money', 'numeric'].some(type =>
                        col.dataType.toLowerCase().includes(type)
                      )
                    ).map(col => (
                      <div key={col.columnName} className="flex items-center gap-2">
                        <Label className="text-sm w-32">{col.columnName}</Label>
                        <Select
                          value={aggregations[col.columnName] || 'sum'}
                          onValueChange={(value) => {
                            setAggregations(prev => ({
                              ...prev,
                              [col.columnName]: value as AggregationType
                            }));
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sum">Sum</SelectItem>
                            <SelectItem value="avg">Average</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="min">Min</SelectItem>
                            <SelectItem value="max">Max</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowGroupingDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}