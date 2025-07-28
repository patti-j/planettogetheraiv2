import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Play, 
  Loader2, 
  Database, 
  Eye,
  Settings,
  AlertCircle,
  FileX,
  Zap,
  Target,
  Users,
  Package,
  Factory,
  Calendar,
  Info
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMaxDock } from '@/contexts/MaxDockContext';

interface ValidationIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  affectedRecords: number;
  details: any[];
  recommendation: string;
}

interface ValidationResult {
  summary: {
    totalChecks: number;
    criticalIssues: number;
    warnings: number;
    infoItems: number;
    dataIntegrityScore: number;
  };
  issues: ValidationIssue[];
  executionTime: number;
  timestamp: string;
}

function DataValidation() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(null);
  const { toast } = useToast();
  const { isMaxOpen } = useMaxDock();

  const validationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/data-validation/run', {});
    },
    onSuccess: (result) => {
      console.log('Validation result:', result);
      console.log('Summary:', result.summary);
      setValidationResult(result);
      
      if (result.summary) {
        toast({
          title: "Validation Complete",
          description: `Found ${result.summary.criticalIssues || 0} critical issues and ${result.summary.warnings || 0} warnings`,
        });
      } else {
        toast({
          title: "Validation Complete",
          description: "Data validation completed successfully",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Validation Failed",
        description: "Failed to run data validation",
        variant: "destructive"
      });
    }
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'operations': return <Settings className="h-4 w-4" />;
      case 'resources': return <Factory className="h-4 w-4" />;
      case 'capabilities': return <Zap className="h-4 w-4" />;
      case 'production orders': return <Target className="h-4 w-4" />;
      case 'data integrity': return <Database className="h-4 w-4" />;
      case 'relationships': return <Users className="h-4 w-4" />;
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'scheduling': return <Calendar className="h-4 w-4" />;
      default: return <FileX className="h-4 w-4" />;
    }
  };

  return (
    <div className={`
      p-3 sm:p-6 space-y-4 sm:space-y-6
      ml-3 mr-3
      ${isMaxOpen ? 'md:ml-0 md:mr-0' : 'md:ml-12 md:mr-12'}
    `}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Master Data Validation</h1>
            <p className="text-gray-600 text-sm md:text-base">Analyze system data for potential issues and inconsistencies</p>
          </div>
        </div>
        <div className="lg:flex-shrink-0">
          <Button 
            onClick={() => validationMutation.mutate()}
            disabled={validationMutation.isPending}
            className="w-full lg:w-auto"
          >
            {validationMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run Validation
          </Button>
        </div>
      </div>

      {/* Validation Summary */}
      {validationResult && validationResult.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Data Integrity Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {validationResult.summary.dataIntegrityScore !== undefined 
                      ? `${validationResult.summary.dataIntegrityScore}%` 
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-600">{validationResult.summary.criticalIssues || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{validationResult.summary.warnings || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Checks</p>
                  <p className="text-2xl font-bold text-blue-600">{validationResult.summary.totalChecks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error state when validation result is incomplete */}
      {validationResult && !validationResult.summary && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Validation completed but returned incomplete results. Please check the console for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issues List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Validation Issues ({validationResult.issues.length})
                </CardTitle>
                <CardDescription>
                  Click on any issue to view detailed information and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {validationResult.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm
                        ${selectedIssue?.id === issue.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                        ${getSeverityColor(issue.severity)}
                      `}
                      onClick={() => setSelectedIssue(issue)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getSeverityIcon(issue.severity)}
                          {getCategoryIcon(issue.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{issue.title}</h4>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {issue.affectedRecords} records
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{issue.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {issue.category}
                            </Badge>
                            <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>
                              {issue.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {validationResult.issues.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p className="font-medium">No issues found!</p>
                      <p className="text-sm">Your master data appears to be in good condition.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issue Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Issue Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedIssue ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(selectedIssue.severity)}
                        <Badge className={getSeverityColor(selectedIssue.severity)}>
                          {selectedIssue.severity}
                        </Badge>
                      </div>
                      <h3 className="font-medium">{selectedIssue.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedIssue.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Recommendation</h4>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {selectedIssue.recommendation}
                        </AlertDescription>
                      </Alert>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Affected Records ({selectedIssue.affectedRecords})</h4>
                      <div className="max-h-40 overflow-y-auto">
                        {selectedIssue.details.slice(0, 10).map((detail, index) => (
                          <div key={index} className="text-xs p-2 bg-gray-50 rounded mb-2">
                            <div className="font-medium">{detail.name || detail.title || `Record ${index + 1}`}</div>
                            {detail.description && (
                              <div className="text-gray-600">{detail.description}</div>
                            )}
                          </div>
                        ))}
                        {selectedIssue.details.length > 10 && (
                          <p className="text-xs text-gray-500 text-center py-2">
                            ... and {selectedIssue.details.length - 10} more records
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-3" />
                    <p className="font-medium">Select an issue</p>
                    <p className="text-sm">Click on any issue from the list to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Welcome Card */}
      {!validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Data Validation System
            </CardTitle>
            <CardDescription>
              Run comprehensive checks to identify potential issues in your master data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">What gets validated:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4 text-gray-500" />
                    Operations with missing required capabilities
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Factory className="h-4 w-4 text-gray-500" />
                    Resources without active capabilities
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-gray-500" />
                    Production orders with invalid references
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-gray-500" />
                    Data integrity and consistency checks
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    Relationship validation between entities
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Scheduling and timeline conflicts
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Validation benefits:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Identify data quality issues before they impact production</p>
                  <p>• Ensure optimal scheduling algorithm performance</p>
                  <p>• Maintain data integrity across the system</p>
                  <p>• Get actionable recommendations for issue resolution</p>
                  <p>• Monitor overall system health with integrity scoring</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DataValidation;