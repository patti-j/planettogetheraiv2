import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Target, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BarChart3,
  Zap,
  Info,
  X
} from 'lucide-react';
import { format } from 'date-fns';

interface OptimizationResult {
  operationId: number;
  operationName: string;
  resourceId: number;
  resourceName: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'unscheduled' | 'conflict' | 'warning';
  previousResource?: string;
  previousStartTime?: string;
  notes?: string[];
}

interface OptimizationSummary {
  algorithmName: string;
  executionTime: number;
  totalOperations: number;
  scheduledOperations: number;
  unscheduledOperations: number;
  resourceConflicts: number;
  scheduleImprovement: number;
  utilizationImprovement: number;
  results: OptimizationResult[];
  warnings: string[];
  unusualResults: {
    lateScheduling: OptimizationResult[];
    resourceChanges: OptimizationResult[];
    longGaps: OptimizationResult[];
  };
  statistics: {
    averageUtilization: number;
    completionDate: string;
    criticalPath: number;
    costImpact: number;
  };
}

interface OptimizationSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: OptimizationSummary | null;
}

export const OptimizationSummaryDialog: React.FC<OptimizationSummaryDialogProps> = ({
  open,
  onOpenChange,
  summary
}) => {
  if (!summary) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'unscheduled':
        return <X className="w-4 h-4 text-red-600" />;
      case 'conflict':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'warning':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'unscheduled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'conflict':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'warning':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const schedulingSuccess = (summary.scheduledOperations / summary.totalOperations) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            Optimization Complete: {summary.algorithmName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.scheduledOperations}</div>
                  <div className="text-sm text-gray-600">Operations Scheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.unscheduledOperations}</div>
                  <div className="text-sm text-gray-600">Unscheduled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.executionTime}s</div>
                  <div className="text-sm text-gray-600">Processing Time</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${summary.scheduleImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.scheduleImprovement >= 0 ? '+' : ''}{summary.scheduleImprovement}%
                  </div>
                  <div className="text-sm text-gray-600">Schedule Improvement</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Scheduling Success Rate</span>
                  <span className="text-sm text-gray-600">{Math.round(schedulingSuccess)}%</span>
                </div>
                <Progress value={schedulingSuccess} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Warnings and Issues */}
          {(summary.warnings.length > 0 || summary.unscheduledOperations > 0 || summary.resourceConflicts > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Issues and Warnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.unscheduledOperations > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{summary.unscheduledOperations} operations could not be scheduled.</strong> 
                      This may be due to resource constraints, capability mismatches, or scheduling conflicts.
                    </AlertDescription>
                  </Alert>
                )}
                
                {summary.resourceConflicts > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{summary.resourceConflicts} resource conflicts detected.</strong> 
                      Multiple operations may be competing for the same resources at overlapping times.
                    </AlertDescription>
                  </Alert>
                )}

                {summary.warnings.map((warning, index) => (
                  <Alert key={index}>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Unusual Results */}
          {(summary.unusualResults.lateScheduling.length > 0 || 
            summary.unusualResults.resourceChanges.length > 0 || 
            summary.unusualResults.longGaps.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Unusual Scheduling Results
                </CardTitle>
                <CardDescription>
                  Operations with unusual scheduling patterns that may require attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.unusualResults.lateScheduling.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      Late Scheduling ({summary.unusualResults.lateScheduling.length} operations)
                    </h4>
                    <div className="space-y-2">
                      {summary.unusualResults.lateScheduling.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded border">
                          <span className="text-sm font-medium">{result.operationName}</span>
                          <span className="text-xs text-gray-600">
                            Scheduled for {format(new Date(result.startTime), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary.unusualResults.resourceChanges.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      Resource Changes ({summary.unusualResults.resourceChanges.length} operations)
                    </h4>
                    <div className="space-y-2">
                      {summary.unusualResults.resourceChanges.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded border">
                          <span className="text-sm font-medium">{result.operationName}</span>
                          <div className="text-xs text-gray-600">
                            <span className="line-through">{result.previousResource}</span>
                            <span className="mx-2">→</span>
                            <span className="font-medium">{result.resourceName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summary.unusualResults.longGaps.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      Long Scheduling Gaps ({summary.unusualResults.longGaps.length} operations)
                    </h4>
                    <div className="space-y-2">
                      {summary.unusualResults.longGaps.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded border">
                          <span className="text-sm font-medium">{result.operationName}</span>
                          <span className="text-xs text-gray-600">
                            Gap detected before scheduling
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Detailed Scheduling Results
              </CardTitle>
              <CardDescription>
                Complete list of all operations processed by the optimization algorithm
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2 hidden sm:table-cell">Job</th>
                      <th className="text-left p-2">Operation</th>
                      <th className="text-left p-2 hidden md:table-cell">Resource</th>
                      <th className="text-left p-2 hidden lg:table-cell">Start Time</th>
                      <th className="text-left p-2 hidden lg:table-cell">End Time</th>
                      <th className="text-left p-2 hidden md:table-cell">Duration</th>
                      <th className="text-left p-2 hidden lg:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.results.map((result, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.status)}
                            <Badge variant="outline" className={getStatusColor(result.status)}>
                              {result.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2 hidden sm:table-cell">
                          <div className="text-sm font-medium">{(result as any).jobName || 'Unknown Job'}</div>
                          <div className="text-xs text-gray-500">ID: {(result as any).jobId || 'N/A'}</div>
                        </td>
                        <td className="p-2 font-medium">
                          <div>{result.operationName}</div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            {result.resourceName} • {result.duration}h
                          </div>
                        </td>
                        <td className="p-2 hidden md:table-cell">{result.resourceName}</td>
                        <td className="p-2 hidden lg:table-cell">
                          {result.startTime ? format(new Date(result.startTime), 'MMM dd, HH:mm') : 'Not scheduled'}
                        </td>
                        <td className="p-2 hidden lg:table-cell">
                          {result.endTime ? format(new Date(result.endTime), 'MMM dd, HH:mm') : 'Not scheduled'}
                        </td>
                        <td className="p-2 hidden md:table-cell">{result.duration}h</td>
                        <td className="p-2 text-xs text-gray-600 hidden lg:table-cell">
                          {result.notes && result.notes.length > 0 ? result.notes.join(', ') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Performance Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{summary.statistics.averageUtilization}%</div>
                  <div className="text-sm text-gray-600">Average Utilization</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {format(new Date(summary.statistics.completionDate), 'MMM dd')}
                  </div>
                  <div className="text-sm text-gray-600">Completion Date</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{summary.statistics.criticalPath}h</div>
                  <div className="text-sm text-gray-600">Critical Path</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${summary.statistics.costImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.statistics.costImpact >= 0 ? '+' : ''}${Math.abs(summary.statistics.costImpact)}
                  </div>
                  <div className="text-sm text-gray-600">Cost Impact</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};