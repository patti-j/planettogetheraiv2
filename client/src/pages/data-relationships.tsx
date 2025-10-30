import { useState, useEffect } from "react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  Search, 
  Filter, 
  ArrowRight, 
  ArrowLeft, 
  ArrowRightLeft,
  Key,
  Link,
  Table,
  Users,
  Factory,
  Settings,
  Package,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Globe,
  Cog
} from "lucide-react";

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  defaultValue?: string;
}

interface TableInfo {
  name: string;
  columns: TableColumn[];
  category: string;
}

interface RelationshipInfo {
  type: 'one-to-many' | 'many-to-one' | 'many-to-many' | 'one-to-one';
  fromTable: string;
  toTable: string;
  fromColumn: string;
  toColumn: string;
  description: string;
  junctionTable?: string;
}

const DATA_CATEGORIES = {
  'Core Manufacturing': ['ptplants', 'ptresources', 'ptcapabilities', 'ptplantresources', 'ptworkcenters', 'ptresourcecapabilities'],
  'Production Management': ['ptmanufacturingorders', 'ptjobs', 'ptjoboperations', 'ptoperations', 'ptproductionversions', 'ptplannedorders'],
  'Materials & Inventory': ['ptitems', 'ptboms', 'ptbomitems', 'ptrecipes', 'ptrecipephases', 'ptmaterials', 'ptitemcharacteristics'],
  'Planning & Scheduling': ['ptschedules', 'ptjobresourceblocks', 'ptjobresourceblockintervals', 'ptschedulingresults', 'ptschedulinghistory'],
  'Business Partners': ['ptcustomers', 'ptvendors', 'ptsalesorders', 'ptpurchaseorders', 'ptcustomerorders'],
  'Quality & Compliance': ['ptqualitytests', 'ptqualityresults', 'ptinspections', 'ptnonconformances', 'ptqualitystandards'],
  'User Management': ['users', 'roles', 'permissions', 'user_roles', 'role_permissions'],
  'System Integration': ['system_integrations', 'integration_jobs', 'integration_events', 'api_credentials'],
  'Analytics & Reporting': ['reports', 'dashboards', 'metrics', 'kpi_definitions', 'smart_kpi_definitions'],
  'Other': []
};

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    'Core Manufacturing': Factory,
    'Production Management': Settings,
    'Materials & Inventory': Package,
    'Planning & Scheduling': Calendar,
    'Business Partners': Users,
    'Quality & Compliance': Shield,
    'User Management': Users,
    'System Integration': Globe,
    'Analytics & Reporting': BarChart3,
    'Other': Cog
  };
  return iconMap[category] || Table;
};

const getRelationshipTypeIcon = (type: string) => {
  switch (type) {
    case 'one-to-many': return ArrowRight;
    case 'many-to-one': return ArrowLeft;
    case 'many-to-many': return ArrowRightLeft;
    case 'one-to-one': return Link;
    default: return ArrowRight;
  }
};

const categorizeTable = (tableName: string): string => {
  for (const [category, tables] of Object.entries(DATA_CATEGORIES)) {
    if ((tables as string[]).includes(tableName)) {
      return category;
    }
  }
  return 'Other';
};

const analyzeRelationships = (tables: TableInfo[]): RelationshipInfo[] => {
  const relationships: RelationshipInfo[] = [];
  
  tables.forEach(table => {
    table.columns.forEach(column => {
      if (column.foreignKey) {
        const relType = column.name.endsWith('_id') ? 'many-to-one' : 'one-to-one';
        relationships.push({
          type: relType,
          fromTable: table.name,
          toTable: column.foreignKey.table,
          fromColumn: column.name,
          toColumn: column.foreignKey.column,
          description: `${table.name}.${column.name} references ${column.foreignKey.table}.${column.foreignKey.column}`,
          ...(table.name.includes('_') && table.name.split('_').length === 2 && 
              table.columns.filter(c => c.foreignKey).length >= 2 && 
              { junctionTable: table.name })
        });
      }
    });
  });
  
  return relationships;
};

export default function DataRelationships() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'details'>('browse');
  const { addRecentPage } = useNavigation();

  // Add this page to recent pages when component mounts
  useEffect(() => {
    addRecentPage('/data-relationships', 'Data Relationships', 'Database');
  }, [addRecentPage]);

  // Fetch real database tables
  const { data: tablesRaw = [], isLoading } = useQuery({
    queryKey: ['/api/database/tables'],
  });
  
  // Transform database tables to TableInfo format
  const tables: TableInfo[] = (tablesRaw as any[]).map(table => ({
    name: table.name,
    columns: [], // We'll need to fetch column info separately if needed
    category: categorizeTable(table.name)
  }));

  const relationships = analyzeRelationships(tables);

  // Categorize tables
  const categorizedTables = tables.reduce((acc, table) => {
    const category = categorizeTable(table.name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(table);
    return acc;
  }, {} as Record<string, TableInfo[]>);

  // Filter tables based on search and category
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || categorizeTable(table.name) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTableRelationships = (tableName: string) => {
    return relationships.filter(rel => 
      rel.fromTable === tableName || rel.toTable === tableName
    );
  };

  const getPrimaryKeys = (table: TableInfo) => {
    return table.columns.filter(col => col.primaryKey);
  };

  const getForeignKeys = (table: TableInfo) => {
    return table.columns.filter(col => col.foreignKey);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Database className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading database schema...</p>
        </div>
      </div>
    );
  }

  const selectedTableData = selectedTable ? tables.find(t => t.name === selectedTable) : null;
  const selectedTableRelationships = selectedTable ? getTableRelationships(selectedTable) : [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Relationships</h1>
          <p className="text-gray-600">Explore database tables, their relationships, and key structures</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(DATA_CATEGORIES).map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'browse' ? 'default' : 'outline'}
            onClick={() => setViewMode('browse')}
            size="sm"
          >
            Browse
          </Button>
          <Button
            variant={viewMode === 'details' ? 'default' : 'outline'}
            onClick={() => setViewMode('details')}
            size="sm"
            disabled={!selectedTable}
          >
            Details
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Table className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{tables.length}</p>
                <p className="text-sm text-gray-600">Total Tables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Link className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{relationships.length}</p>
                <p className="text-sm text-gray-600">Relationships</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Key className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredTables.length}
                </p>
                <p className="text-sm text-gray-600">Filtered Tables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{Object.keys(categorizedTables).length}</p>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === 'browse' ? (
        <Tabs defaultValue="by-category" className="space-y-4">
          <TabsList>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
            <TabsTrigger value="by-table">By Table</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>

          <TabsContent value="by-category" className="space-y-6">
            {Object.entries(categorizedTables)
              .filter(([category]) => selectedCategory === "all" || category === selectedCategory)
              .map(([category, categoryTables]) => {
                const Icon = getCategoryIcon(category);
                const filteredCategoryTables = categoryTables.filter(table =>
                  table.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                if (filteredCategoryTables.length === 0) return null;

                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        {category}
                        <Badge variant="secondary">{filteredCategoryTables.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCategoryTables.map(table => {
                          const tableRelationships = getTableRelationships(table.name);
                          const primaryKeys = getPrimaryKeys(table);
                          const foreignKeys = getForeignKeys(table);

                          return (
                            <Card key={table.name} className="hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => {
                                    setSelectedTable(table.name);
                                    setViewMode('details');
                                  }}>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg break-words truncate" title={table.name}>{table.name}</CardTitle>
                                <CardDescription>
                                  {table.columns.length} columns • {tableRelationships.length} relationships
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="flex flex-wrap gap-2">
                                  {primaryKeys.length > 0 && (
                                    <Badge variant="default" className="text-xs">
                                      <Key className="h-3 w-3 mr-1" />
                                      {primaryKeys.length} PK
                                    </Badge>
                                  )}
                                  {foreignKeys.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Link className="h-3 w-3 mr-1" />
                                      {foreignKeys.length} FK
                                    </Badge>
                                  )}
                                  {tableRelationships.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                                      {tableRelationships.length} Relations
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>

          <TabsContent value="by-table" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTables.map(table => {
                const tableRelationships = getTableRelationships(table.name);
                const category = categorizeTable(table.name);
                const Icon = getCategoryIcon(category);

                return (
                  <Card key={table.name} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedTable(table.name);
                          setViewMode('details');
                        }}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="break-words truncate" title={table.name}>{table.name}</span>
                      </CardTitle>
                      <CardDescription>{category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Columns:</span>
                          <span className="font-medium">{table.columns.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Relationships:</span>
                          <span className="font-medium">{tableRelationships.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Primary Keys:</span>
                          <span className="font-medium">{getPrimaryKeys(table).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Foreign Keys:</span>
                          <span className="font-medium">{getForeignKeys(table).length}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="relationships" className="space-y-4">
            <div className="space-y-4">
              {relationships
                .filter(rel => 
                  (selectedCategory === "all" || 
                   categorizeTable(rel.fromTable) === selectedCategory ||
                   categorizeTable(rel.toTable) === selectedCategory) &&
                  (searchTerm === "" ||
                   rel.fromTable.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   rel.toTable.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((rel, index) => {
                  const RelIcon = getRelationshipTypeIcon(rel.type);
                  
                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="capitalize">
                              {rel.type.replace('-', ' ')}
                            </Badge>
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{rel.fromTable}</span>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {rel.fromColumn}
                              </code>
                              <RelIcon className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{rel.toTable}</span>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {rel.toColumn}
                              </code>
                            </div>
                          </div>
                          {rel.junctionTable && (
                            <Badge variant="secondary">
                              Junction: {rel.junctionTable}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{rel.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Details view
        selectedTableData && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setViewMode('browse');
                  setSelectedTable(null);
                }}
              >
                ← Back to Browse
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{selectedTableData.name}</h2>
                <p className="text-gray-600">{categorizeTable(selectedTableData.name)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Table Structure */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table className="h-5 w-5" />
                    Table Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {selectedTableData.columns.map(column => (
                        <div key={column.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <code className="font-medium">{column.name}</code>
                            <Badge variant="outline" className="text-xs">
                              {column.type}
                            </Badge>
                            {column.primaryKey && (
                              <Badge variant="default" className="text-xs">
                                <Key className="h-3 w-3 mr-1" />
                                PK
                              </Badge>
                            )}
                            {column.foreignKey && (
                              <Badge variant="secondary" className="text-xs">
                                <Link className="h-3 w-3 mr-1" />
                                FK
                              </Badge>
                            )}
                            {!column.nullable && (
                              <Badge variant="destructive" className="text-xs">
                                NOT NULL
                              </Badge>
                            )}
                          </div>
                          {column.foreignKey && (
                            <div className="text-xs text-gray-600">
                              → {column.foreignKey.table}.{column.foreignKey.column}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Relationships */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5" />
                    Relationships ({selectedTableRelationships.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {selectedTableRelationships.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No relationships found</p>
                      ) : (
                        selectedTableRelationships.map((rel, index) => {
                          const RelIcon = getRelationshipTypeIcon(rel.type);
                          const isOutgoing = rel.fromTable === selectedTable;
                          
                          return (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="capitalize">
                                  {rel.type.replace('-', ' ')}
                                </Badge>
                                <RelIcon className="h-4 w-4 text-gray-500" />
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-medium"
                                  onClick={() => {
                                    setSelectedTable(isOutgoing ? rel.toTable : rel.fromTable);
                                  }}
                                >
                                  {isOutgoing ? rel.toTable : rel.fromTable}
                                </Button>
                              </div>
                              <div className="text-sm text-gray-600">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {rel.fromColumn}
                                </code>
                                {' → '}
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {rel.toColumn}
                                </code>
                              </div>
                              {rel.junctionTable && (
                                <Badge variant="secondary" className="mt-2">
                                  via {rel.junctionTable}
                                </Badge>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      )}
    </div>
  );
}