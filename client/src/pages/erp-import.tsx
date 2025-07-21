import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw,
  Eye,
  Trash2,
  Play,
  Pause,
  Activity,
  TrendingUp,
  Users,
  Package,
  Factory,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  Info,
  X,
  Search,
  Filter,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

interface ImportJob {
  id: string;
  name: string;
  type: 'orders' | 'inventory' | 'resources' | 'schedules' | 'customers';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  issues: ImportIssue[];
  summary?: ImportSummary;
}

interface ImportIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  line: number;
  field: string;
  message: string;
  suggestion?: string;
}

interface ImportSummary {
  newRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  duplicateRecords: number;
  dataQualityScore: number;
  mappingAccuracy: number;
}

const ERPImportPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedImport, setSelectedImport] = useState<ImportJob | null>(null);
  const [activeTab, setActiveTab] = useState('imports');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Mock data for demonstration
  const mockImportJobs: ImportJob[] = [
    {
      id: '1',
      name: 'Daily Orders Import',
      type: 'orders',
      status: 'completed',
      fileName: 'orders_2025-01-18.csv',
      totalRecords: 150,
      processedRecords: 150,
      successfulRecords: 147,
      failedRecords: 3,
      startTime: '2025-01-18T08:00:00Z',
      endTime: '2025-01-18T08:05:00Z',
      duration: 300,
      issues: [
        {
          id: '1',
          type: 'warning',
          line: 23,
          field: 'customer_id',
          message: 'Customer ID not found, created new customer record',
          suggestion: 'Verify customer data in ERP system'
        },
        {
          id: '2',
          type: 'error',
          line: 45,
          field: 'due_date',
          message: 'Invalid date format',
          suggestion: 'Use YYYY-MM-DD format'
        }
      ],
      summary: {
        newRecords: 85,
        updatedRecords: 62,
        skippedRecords: 3,
        duplicateRecords: 0,
        dataQualityScore: 94,
        mappingAccuracy: 98
      }
    },
    {
      id: '2',
      name: 'Inventory Update',
      type: 'inventory',
      status: 'running',
      fileName: 'inventory_levels.xlsx',
      totalRecords: 850,
      processedRecords: 425,
      successfulRecords: 420,
      failedRecords: 5,
      startTime: '2025-01-18T09:30:00Z',
      issues: [
        {
          id: '3',
          type: 'info',
          line: 156,
          field: 'location',
          message: 'New warehouse location detected',
          suggestion: 'Confirm location mapping is correct'
        }
      ]
    },
    {
      id: '3',
      name: 'Resource Schedule Sync',
      type: 'schedules',
      status: 'failed',
      fileName: 'resource_schedules.json',
      totalRecords: 45,
      processedRecords: 12,
      successfulRecords: 0,
      failedRecords: 12,
      startTime: '2025-01-18T07:15:00Z',
      endTime: '2025-01-18T07:18:00Z',
      duration: 180,
      issues: [
        {
          id: '4',
          type: 'error',
          line: 1,
          field: 'resource_id',
          message: 'Invalid JSON format detected',
          suggestion: 'Validate JSON structure before import'
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'orders': return <Package className="w-4 h-4" />;
      case 'inventory': return <Database className="w-4 h-4" />;
      case 'resources': return <Factory className="w-4 h-4" />;
      case 'schedules': return <Calendar className="w-4 h-4" />;
      case 'customers': return <Users className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const filteredImports = mockImportJobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesType = filterType === 'all' || job.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const PageContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="md:ml-0 ml-12">
          <h1 className="text-2xl font-semibold text-gray-800">ERP Data Import</h1>
          <p className="text-gray-600">Import and manage data from external ERP systems</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="flex items-center gap-2"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Successful Imports</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Imports</p>
                <p className="text-2xl font-bold text-blue-600">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed Imports</p>
                <p className="text-2xl font-bold text-red-600">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Data Quality</p>
                <p className="text-2xl font-bold text-purple-600">94%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="imports">Import Jobs</TabsTrigger>
          <TabsTrigger value="upload">New Import</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="imports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search imports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="resources">Resources</SelectItem>
                      <SelectItem value="schedules">Schedules</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import Jobs List */}
          <div className="space-y-4">
            {filteredImports.map((job) => (
              <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getTypeIcon(job.type)}
                        <h3 className="text-lg font-semibold">{job.name}</h3>
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{job.fileName}</p>
                      
                      {/* Progress Bar */}
                      {job.status === 'running' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{job.processedRecords} / {job.totalRecords}</span>
                          </div>
                          <Progress value={(job.processedRecords / job.totalRecords) * 100} />
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Records:</span>
                          <span className="ml-2 font-medium">{job.totalRecords}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Successful:</span>
                          <span className="ml-2 font-medium text-green-600">{job.successfulRecords}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Failed:</span>
                          <span className="ml-2 font-medium text-red-600">{job.failedRecords}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Issues:</span>
                          <span className="ml-2 font-medium text-yellow-600">{job.issues.length}</span>
                        </div>
                      </div>

                      {/* Time Info */}
                      {job.startTime && (
                        <div className="mt-3 text-sm text-gray-600">
                          <Clock className="inline w-4 h-4 mr-1" />
                          Started: {format(parseISO(job.startTime), 'MMM dd, yyyy HH:mm')}
                          {job.duration && (
                            <span className="ml-4">
                              Duration: {Math.floor(job.duration / 60)}m {job.duration % 60}s
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedImport(job)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      {job.status === 'running' && (
                        <Button variant="outline" size="sm">
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      {job.status === 'failed' && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Data</CardTitle>
              <CardDescription>
                Import data from CSV, Excel, or JSON files from your ERP system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="import-type">Import Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type to import" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orders">Orders</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="resources">Resources</SelectItem>
                    <SelectItem value="schedules">Schedules</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="import-name">Import Job Name</Label>
                <Input placeholder="Enter a name for this import" />
              </div>

              <div>
                <Label htmlFor="file-upload">File Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Drop your file here or click to browse</p>
                  <p className="text-sm text-gray-500">Supports CSV, Excel (.xlsx), and JSON files</p>
                  <Button variant="outline" className="mt-4">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Import Notes</Label>
                <Textarea 
                  placeholder="Add any notes about this import..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Preview Data</Button>
                <Button>
                  <Play className="w-4 h-4 mr-2" />
                  Start Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping Configuration</CardTitle>
              <CardDescription>
                Configure how ERP fields map to system fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Field mapping configuration will help ensure accurate data imports from different ERP systems.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View historical import data and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Detailed import history and analytics will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Details Dialog */}
      {selectedImport && (
        <Dialog open={!!selectedImport} onOpenChange={() => setSelectedImport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getTypeIcon(selectedImport.type)}
                {selectedImport.name} - Import Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{selectedImport.totalRecords}</div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedImport.successfulRecords}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{selectedImport.failedRecords}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{selectedImport.issues.length}</div>
                  <div className="text-sm text-gray-600">Issues</div>
                </div>
              </div>

              {/* Issues List */}
              {selectedImport.issues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Import Issues</h3>
                  <div className="space-y-2">
                    {selectedImport.issues.map((issue) => (
                      <Alert key={issue.id}>
                        <div className="flex items-start gap-3">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <AlertDescription>
                              <div className="font-medium">
                                Line {issue.line}, Field: {issue.field}
                              </div>
                              <div>{issue.message}</div>
                              {issue.suggestion && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Suggestion: {issue.suggestion}
                                </div>
                              )}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              {selectedImport.summary && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Import Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">New Records</div>
                      <div className="text-xl font-bold">{selectedImport.summary.newRecords}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Updated Records</div>
                      <div className="text-xl font-bold">{selectedImport.summary.updatedRecords}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Skipped Records</div>
                      <div className="text-xl font-bold">{selectedImport.summary.skippedRecords}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Data Quality Score</div>
                      <div className="text-xl font-bold text-purple-600">{selectedImport.summary.dataQualityScore}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Mapping Accuracy</div>
                      <div className="text-xl font-bold text-blue-600">{selectedImport.summary.mappingAccuracy}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${isMaximized ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className={`${isMaximized ? 'h-full overflow-y-auto p-6' : 'px-4 py-3 sm:px-6'}`}>
        <PageContent />
      </div>
    </div>
  );
};

export default ERPImportPage;