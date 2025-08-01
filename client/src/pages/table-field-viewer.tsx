import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Edit3, Save, X, Database, Key, FileText, Info, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from "xlsx";

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  primaryKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  comment?: string;
}

interface TableInfo {
  name: string;
  columns: TableColumn[];
  comment?: string;
}

interface FieldComment {
  id?: number;
  tableName: string;
  columnName: string;
  comment: string;
  createdBy?: number;
  updatedAt?: string;
}

export default function TableFieldViewer() {
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch database schema
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ["/api/database/schema"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch field comments
  const { data: fieldComments = [], isLoading: commentsLoading, error: commentsError } = useQuery({
    queryKey: ["/api/field-comments"],
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Debug field comments data
  useEffect(() => {
    console.log("=== FIELD COMMENTS DEBUG ===");
    console.log("Comments loading:", commentsLoading);
    console.log("Comments error:", commentsError);
    console.log("Field comments data:", fieldComments);
    console.log("Field comments length:", fieldComments.length);
    if (fieldComments.length > 0) {
      console.log("Sample comment:", fieldComments[0]);
    }

    // Test direct API calls
    fetch("/api/test-field-comments")
      .then(res => {
        console.log("Test endpoint response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("Test endpoint data:", data);
      })
      .catch(error => {
        console.error("Test endpoint error:", error);
      });

    fetch("/api/field-comments")
      .then(res => {
        console.log("Direct fetch response status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("Direct fetch data:", data);
        console.log("Direct fetch data length:", data.length);
      })
      .catch(error => {
        console.error("Direct fetch error:", error);
      });
  }, [fieldComments, commentsLoading, commentsError]);

  // Update field comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async (data: FieldComment) => {
      return apiRequest("/api/field-comments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/field-comments"] });
      toast({
        title: "Comment updated",
        description: "Field comment has been saved successfully.",
      });
      setEditingField(null);
      setEditComment("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update field comment.",
        variant: "destructive",
      });
    },
  });

  // Filter tables based on search and type
  const filteredTables = tables.filter((table: TableInfo) => {
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "all") return matchesSearch;
    
    // Manufacturing-specific filters
    if (filterType === "production") {
      return matchesSearch && (
        table.name.includes("production") ||
        table.name.includes("job") ||
        table.name.includes("operation") ||
        table.name.includes("resource") ||
        table.name.includes("schedule")
      );
    }
    
    if (filterType === "inventory") {
      return matchesSearch && (
        table.name.includes("stock") ||
        table.name.includes("item") ||
        table.name.includes("inventory") ||
        table.name.includes("material") ||
        table.name.includes("warehouse")
      );
    }
    
    if (filterType === "quality") {
      return matchesSearch && (
        table.name.includes("quality") ||
        table.name.includes("inspection") ||
        table.name.includes("test") ||
        table.name.includes("specification")
      );
    }
    
    return matchesSearch;
  });

  const selectedTableData = tables.find((table: TableInfo) => table.name === selectedTable);

  // Get comment for a specific field
  const getFieldComment = (tableName: string, columnName: string): string => {
    const comment = fieldComments.find((fc: FieldComment) => 
      fc.tableName === tableName && fc.columnName === columnName
    );
    return comment?.comment || "";
  };

  // Handle edit comment
  const handleEditComment = (tableName: string, columnName: string) => {
    const currentComment = getFieldComment(tableName, columnName);
    setEditComment(currentComment);
    setEditingField(`${tableName}.${columnName}`);
  };

  // Handle save comment
  const handleSaveComment = () => {
    if (!editingField) return;
    
    const [tableName, columnName] = editingField.split(".");
    updateCommentMutation.mutate({
      tableName,
      columnName,
      comment: editComment,
    });
  };

  // Get type badge color
  const getTypeBadgeColor = (type: string) => {
    if (type.includes("varchar") || type.includes("text")) return "bg-blue-100 text-blue-800";
    if (type.includes("int") || type.includes("numeric")) return "bg-green-100 text-green-800";
    if (type.includes("timestamp") || type.includes("date")) return "bg-purple-100 text-purple-800";
    if (type.includes("boolean")) return "bg-orange-100 text-orange-800";
    if (type.includes("jsonb") || type.includes("json")) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  // Define junction/relation tables to exclude (tables that only contain IDs for joins)
  const junctionTables = [
    'plant_resources', 'work_center_resources', 'department_resources',
    'production_version_phase_material_requirements', 'production_version_phase_bom_product_outputs',
    'production_version_phase_formulation_details', 'discrete_operation_phase_resource_requirements',
    'discrete_operation_phase_relationships', 'recipe_phase_relationships',
    'sales_order_line_distributions' // Has minimal business data beyond joins
  ];

  // Get all business tables (excluding junction tables)
  const getBusinessTables = () => {
    return tables.filter((table: TableInfo) => 
      !junctionTables.includes(table.name) && 
      !table.name.startsWith('pg_') && // Exclude PostgreSQL system tables
      !table.name.startsWith('information_schema') && // Exclude system schema tables
      table.name !== 'spatial_ref_sys' && // Exclude PostGIS tables
      table.columns.length > 2 // Exclude tables with only ID columns
    );
  };

  // Generate Excel export data
  const generateExcelData = () => {
    const businessTables = getBusinessTables();
    const exportData: any[] = [];

    businessTables.forEach((table: TableInfo) => {
      table.columns.forEach((column: TableColumn) => {
        const fieldComment = getFieldComment(table.name, column.name);
        
        exportData.push({
          'Table Name': table.name,
          'Field Name': column.name,
          'Data Type': column.type,
          'Nullable': column.nullable ? 'Yes' : 'No',
          'Primary Key': column.primaryKey ? 'Yes' : 'No',
          'Foreign Key': column.foreignKey ? 'Yes' : 'No',
          'References': column.foreignKey ? `${column.foreignKey.table}.${column.foreignKey.column}` : '',
          'Default Value': column.default || '',
          'Description': fieldComment || '',
        });
      });
    });

    return exportData;
  };

  // Handle Excel download
  const handleDownloadExcel = () => {
    try {
      const exportData = generateExcelData();
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better readability
      const colWidths = [
        { wch: 25 }, // Table Name
        { wch: 30 }, // Field Name
        { wch: 20 }, // Data Type
        { wch: 10 }, // Nullable
        { wch: 15 }, // Primary Key
        { wch: 15 }, // Foreign Key
        { wch: 25 }, // References
        { wch: 20 }, // Default Value
        { wch: 60 }, // Description
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Database Schema Fields');

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `manufacturing_erp_database_schema_${dateStr}.xlsx`;

      // Download the file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Export successful",
        description: `Downloaded ${exportData.length} field records to ${filename}`,
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to generate Excel file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-3 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Database Schema Viewer
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Explore database table structures and manage field documentation.
              </p>
            </div>
            <Button
              onClick={handleDownloadExcel}
              disabled={tablesLoading || commentsLoading}
              className="flex items-center gap-2 w-full sm:w-auto"
              size="sm"
            >
              <Download className="h-4 w-4" />
              <span className="sm:inline">Download Excel</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Table Selection Panel */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                Tables ({filteredTables.length})
              </CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Business tables available for Excel export: {getBusinessTables().length}
              </p>
              <div className="space-y-2 sm:space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 sm:h-10 text-sm"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[300px] sm:h-[400px] lg:h-[500px]">
                <div className="space-y-2">
                  {tablesLoading ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Loading tables...</div>
                  ) : (
                    filteredTables.map((table: TableInfo) => (
                      <div
                        key={table.name}
                        className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedTable === table.name
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-950"
                            : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                        }`}
                        onClick={() => setSelectedTable(table.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {table.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {table.columns.length} fields
                            </p>
                          </div>
                          {selectedTable === table.name && (
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 ml-2 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Table Details Panel */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate">
                  {selectedTableData ? `Table: ${selectedTableData.name}` : "Select a table to view details"}
                </span>
              </CardTitle>
              {selectedTableData?.comment && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {selectedTableData.comment}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {!selectedTableData ? (
                <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                  <Database className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">Select a table from the left panel to view its field details</p>
                </div>
              ) : (
                <Tabs defaultValue="fields" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                    <TabsTrigger value="fields" className="text-xs sm:text-sm">Field Details</TabsTrigger>
                    <TabsTrigger value="relationships" className="text-xs sm:text-sm">Relationships</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="fields" className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold">
                        Fields ({selectedTableData.columns.length})
                      </h3>
                    </div>
                    
                    <ScrollArea className="h-[300px] sm:h-[400px] lg:h-[500px]">
                      <div className="space-y-3 sm:space-y-4">
                        {selectedTableData.columns.map((column: TableColumn) => (
                          <Card key={column.name} className="border border-gray-200 dark:border-gray-700">
                            <CardContent className="p-3 sm:p-4">
                              <div className="space-y-2 sm:space-y-3">
                                {/* Field Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 sm:gap-2 mb-2">
                                      {column.primaryKey && (
                                        <Key className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" title="Primary Key" />
                                      )}
                                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                                        {column.name}
                                      </h4>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                      <Badge className={`${getTypeBadgeColor(column.type)} text-xs`}>
                                        {column.type}
                                      </Badge>
                                      {!column.nullable && (
                                        <Badge variant="destructive" className="text-xs">
                                          NOT NULL
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditComment(selectedTableData.name, column.name)}
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                                  >
                                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>

                                {/* Field Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Nullable:</span>
                                    <span className="ml-2 font-medium">
                                      {column.nullable ? "Yes" : "No"}
                                    </span>
                                  </div>
                                  {column.default && (
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Default:</span>
                                      <span className="ml-2 font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                                        {column.default}
                                      </span>
                                    </div>
                                  )}
                                  {column.foreignKey && (
                                    <div className="sm:col-span-2">
                                      <span className="text-gray-500 dark:text-gray-400">References:</span>
                                      <span className="ml-2 font-medium text-blue-600 dark:text-blue-400 break-all">
                                        {column.foreignKey.table}.{column.foreignKey.column}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <Separator />

                                {/* Field Comment */}
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Field Description
                                    </span>
                                  </div>
                                  
                                  {editingField === `${selectedTableData.name}.${column.name}` ? (
                                    <div className="space-y-2 sm:space-y-3">
                                      <Textarea
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        placeholder="Add a helpful description for this field..."
                                        rows={3}
                                        className="resize-none text-sm"
                                      />
                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <Button
                                          size="sm"
                                          onClick={handleSaveComment}
                                          disabled={updateCommentMutation.isPending}
                                          className="w-full sm:w-auto"
                                        >
                                          <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingField(null);
                                            setEditComment("");
                                          }}
                                          className="w-full sm:w-auto"
                                        >
                                          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      onClick={() => handleEditComment(selectedTableData.name, column.name)}
                                    >
                                      {getFieldComment(selectedTableData.name, column.name) ? (
                                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                          {getFieldComment(selectedTableData.name, column.name)}
                                        </p>
                                      ) : (
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
                                          Tap to add field description...
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="relationships" className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold">Table Relationships</h3>
                    <div className="space-y-2 sm:space-y-3">
                      {selectedTableData.columns
                        .filter(col => col.isForeignKey && col.references)
                        .map((column: TableColumn) => (
                          <Card key={column.name} className="p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <Key className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mt-1 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base truncate">{column.name}</p>
                                <p className="text-xs sm:text-sm text-gray-500 break-all">
                                  References: <span className="font-mono text-blue-600">{column.references}</span>
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      {selectedTableData.columns.filter(col => col.isForeignKey).length === 0 && (
                        <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
                          No foreign key relationships found in this table.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}