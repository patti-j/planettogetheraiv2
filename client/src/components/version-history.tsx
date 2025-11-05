/**
 * Version History Component
 * Displays schedule version history with timeline view and comparison features
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  GitBranch, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GitCompare,
  RotateCcw,
  Lock,
  Unlock,
  History,
  Info,
  Sparkles
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Version {
  id: number;
  scheduleId: number;
  versionNumber: number;
  checksum: string;
  createdAt: string;
  createdBy: number;
  createdByName?: string;
  createdByUsername?: string;
  parentVersionId: number | null;
  changeType: string;
  comment: string | null;
  tag: string | null;
  snapshotData: any;
  metrics?: any;
}

interface VersionComparison {
  baseVersion: Version;
  compareVersion: Version;
  differences: {
    added: any[];
    modified: any[];
    removed: any[];
    statistics: {
      totalChanges: number;
      operationsAdded: number;
      operationsModified: number;
      operationsRemoved: number;
    };
    resourceUtilization?: Record<string, any>;
  };
  metrics?: {
    timeSpanDelta?: number;
    resourceUsageDelta?: number;
    totalDurationDelta?: number;
  };
}

interface VersionHistoryProps {
  scheduleId: number;
  currentVersionId?: number;
}

export function VersionHistory({ scheduleId, currentVersionId }: VersionHistoryProps) {
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareVersions, setCompareVersions] = useState<{ base: number | null; compare: number | null }>({
    base: null,
    compare: null
  });
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');
  const [triggerComparison, setTriggerComparison] = useState(false);

  // Fetch version history
  const { data: versionsData, isLoading } = useQuery({
    queryKey: ['/api/schedules', scheduleId, 'versions'],
    enabled: !!scheduleId
  });
  
  // Ensure versions is always an array
  const versions: Version[] = Array.isArray(versionsData) ? versionsData : [];

  // Fetch version comparison
  const { data: comparisonData, isLoading: isLoadingComparison, refetch: refetchComparison } = useQuery({
    queryKey: ['/api/schedules', scheduleId, 'versions', compareVersions.base, 'compare', compareVersions.compare],
    enabled: !!compareVersions.base && !!compareVersions.compare && triggerComparison
  });
  
  // Ensure comparison has the expected structure
  const comparison: VersionComparison | null = comparisonData || null;

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (versionId: number) => {
      return apiRequest(`/api/schedules/${scheduleId}/versions/${versionId}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ reason: rollbackReason })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules', scheduleId, 'versions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pt-operations'] });
      toast({
        title: 'Rollback Successful',
        description: `Schedule has been rolled back to version ${selectedVersion?.versionNumber}`,
      });
      setShowRollbackDialog(false);
      setSelectedVersion(null);
      setRollbackReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Rollback Failed',
        description: error.message || 'Failed to rollback to selected version',
        variant: 'destructive',
      });
    }
  });

  const getChangeTypeColor = (changeType: string | null | undefined) => {
    switch (changeType) {
      case 'OPTIMIZATION_STARTED':
      case 'OPTIMIZATION_APPLIED':
        return 'bg-blue-500';
      case 'MANUAL_EDIT':
        return 'bg-yellow-500';
      case 'ROLLBACK':
        return 'bg-purple-500';
      case 'AUTO_SAVE':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getChangeTypeIcon = (changeType: string | null | undefined) => {
    switch (changeType) {
      case 'OPTIMIZATION_STARTED':
      case 'OPTIMIZATION_APPLIED':
        return <Sparkles className="h-4 w-4" />;
      case 'MANUAL_EDIT':
        return <User className="h-4 w-4" />;
      case 'ROLLBACK':
        return <RotateCcw className="h-4 w-4" />;
      case 'AUTO_SAVE':
        return <Clock className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const formatDifference = (diff: any) => {
    if (!diff) return null;
    
    return (
      <div className="space-y-2">
        {diff.added.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-green-600 dark:text-green-400">
              Added ({diff.added.length})
            </h5>
            <ul className="text-xs space-y-1 ml-4">
              {diff.added.slice(0, 3).map((item: any, idx: number) => (
                <li key={idx}>Operation {item.id}: {item.operation}</li>
              ))}
              {diff.added.length > 3 && <li>...and {diff.added.length - 3} more</li>}
            </ul>
          </div>
        )}
        
        {diff.modified.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Modified ({diff.modified.length})
            </h5>
            <ul className="text-xs space-y-1 ml-4">
              {diff.modified.slice(0, 3).map((item: any, idx: number) => (
                <li key={idx}>
                  Operation {item.id}: {item.field} changed
                  {item.before && item.after && ` from ${item.before} to ${item.after}`}
                </li>
              ))}
              {diff.modified.length > 3 && <li>...and {diff.modified.length - 3} more</li>}
            </ul>
          </div>
        )}
        
        {diff.removed.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Removed ({diff.removed.length})
            </h5>
            <ul className="text-xs space-y-1 ml-4">
              {diff.removed.slice(0, 3).map((item: any, idx: number) => (
                <li key={idx}>Operation {item.id}: {item.operation}</li>
              ))}
              {diff.removed.length > 3 && <li>...and {diff.removed.length - 3} more</li>}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <CardTitle>Version History</CardTitle>
          </div>
          <Badge variant="outline">
            {versions?.length || 0} versions
          </Badge>
        </div>
        <CardDescription>
          Track changes, compare versions, and rollback when needed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">
              <GitBranch className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="compare">
              <GitCompare className="h-4 w-4 mr-2" />
              Compare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <ScrollArea className="h-[500px] w-full pr-4">
              <div className="relative pr-4">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

                {/* Version items */}
                {versions?.map((version: Version, index: number) => (
                  <div key={version.id} className="relative flex items-start mb-6">
                    {/* Timeline dot */}
                    <div 
                      className={`absolute left-5 h-3 w-3 rounded-full ${getChangeTypeColor(version.changeType)} 
                        ring-4 ring-background z-10`}
                    ></div>

                    {/* Version card - use calc to account for left margin */}
                    <Card className="ml-12 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          style={{ width: 'calc(100% - 3rem)' }}
                          onClick={() => setSelectedVersion(version)}>
                      <CardHeader className="pb-3" style={{ width: '100%' }}>
                        <div className="flex items-start justify-between gap-2" style={{ width: '100%' }}>
                          <div className="space-y-1 min-w-0 flex-1" style={{ maxWidth: 'calc(100% - 150px)' }}>
                            <div className="flex items-center space-x-2 flex-wrap">
                              {getChangeTypeIcon(version.changeType)}
                              <span className="font-semibold">Version {version.versionNumber}</span>
                              {version.id === currentVersionId && (
                                <Badge variant="default" className="ml-2">Current</Badge>
                              )}
                              {version.tag && (
                                <Badge variant="outline" className="ml-2 truncate max-w-[200px]" title={version.tag}>{version.tag}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(version.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                            </p>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={`${getChangeTypeColor(version.changeType)} text-white whitespace-nowrap flex-shrink-0`}
                          >
                            {(version.changeType || 'manual').replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {version.comment && (
                          <p className="text-sm text-muted-foreground mb-2 break-words">{version.comment}</p>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            By {version.createdByName || version.createdByUsername || `User #${version.createdBy}`}
                          </span>
                          <div className="flex space-x-2 flex-shrink-0">
                            {version.id !== currentVersionId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVersion(version);
                                  setShowRollbackDialog(true);
                                }}
                                data-testid={`button-rollback-version-${version.id}`}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Rollback
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compare" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Base Version</label>
                <select
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                  value={compareVersions.base || ''}
                  onChange={(e) => {
                    setCompareVersions({ ...compareVersions, base: Number(e.target.value) });
                    setTriggerComparison(false);
                  }}
                  data-testid="select-base-version"
                >
                  <option value="">Select version</option>
                  {versions?.map((v: Version) => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber} - {format(new Date(v.createdAt), 'MMM dd, HH:mm')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Compare To</label>
                <select
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                  value={compareVersions.compare || ''}
                  onChange={(e) => {
                    setCompareVersions({ ...compareVersions, compare: Number(e.target.value) });
                    setTriggerComparison(false);
                  }}
                  data-testid="select-compare-version"
                >
                  <option value="">Select version</option>
                  {versions?.map((v: Version) => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber} - {format(new Date(v.createdAt), 'MMM dd, HH:mm')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  if (compareVersions.base && compareVersions.compare) {
                    setTriggerComparison(true);
                    refetchComparison();
                  } else {
                    toast({
                      title: 'Select Versions',
                      description: 'Please select both base and compare versions',
                      variant: 'destructive',
                    });
                  }
                }}
                disabled={!compareVersions.base || !compareVersions.compare || isLoadingComparison}
                data-testid="button-execute-comparison"
              >
                {isLoadingComparison ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Comparing...
                  </>
                ) : (
                  <>
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare Versions
                  </>
                )}
              </Button>
            </div>

            {comparison && triggerComparison && (
              <ScrollArea className="h-[450px] w-full pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Comparison Results</CardTitle>
                    <CardDescription>
                      Changes from Version {comparison.baseVersion.versionNumber} to Version {comparison.compareVersion.versionNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Key Metrics Comparison */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Schedule Metrics</h4>
                      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">OTIF</div>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Base:</span> {
                                comparison.baseVersion?.metrics?.otif !== undefined ? 
                                `${comparison.baseVersion.metrics.otif.toFixed(1)}%` : 'N/A'
                              }
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Compare:</span> {
                                comparison.compareVersion?.metrics?.otif !== undefined ? 
                                `${comparison.compareVersion.metrics.otif.toFixed(1)}%` : 'N/A'
                              }
                            </div>
                            {comparison.metricsDelta?.otif !== undefined && (
                              <div className={`text-sm font-medium ${
                                comparison.metricsDelta.otif > 0 ? 'text-green-600' : 
                                comparison.metricsDelta.otif < 0 ? 'text-red-600' : ''
                              }`}>
                                Δ {comparison.metricsDelta.otif > 0 ? '+' : ''}{comparison.metricsDelta.otif.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Thruput</div>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Base:</span> {
                                comparison.baseVersion?.metrics?.thruput !== undefined ? 
                                `${comparison.baseVersion.metrics.thruput.toFixed(1)} u/d` : 'N/A'
                              }
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Compare:</span> {
                                comparison.compareVersion?.metrics?.thruput !== undefined ? 
                                `${comparison.compareVersion.metrics.thruput.toFixed(1)} u/d` : 'N/A'
                              }
                            </div>
                            {comparison.metricsDelta?.thruput !== undefined && (
                              <div className={`text-sm font-medium ${
                                comparison.metricsDelta.thruput > 0 ? 'text-green-600' : 
                                comparison.metricsDelta.thruput < 0 ? 'text-red-600' : ''
                              }`}>
                                Δ {comparison.metricsDelta.thruput > 0 ? '+' : ''}{comparison.metricsDelta.thruput.toFixed(1)} u/d
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Cost</div>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Base:</span> {
                                comparison.baseVersion?.metrics?.costPerUnit !== undefined ? 
                                `$${comparison.baseVersion.metrics.costPerUnit.toFixed(2)}/u` : 'N/A'
                              }
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Compare:</span> {
                                comparison.compareVersion?.metrics?.costPerUnit !== undefined ? 
                                `$${comparison.compareVersion.metrics.costPerUnit.toFixed(2)}/u` : 'N/A'
                              }
                            </div>
                            {comparison.metricsDelta?.costPerUnit !== undefined && (
                              <div className={`text-sm font-medium ${
                                comparison.metricsDelta.costPerUnit < 0 ? 'text-green-600' : 
                                comparison.metricsDelta.costPerUnit > 0 ? 'text-red-600' : ''
                              }`}>
                                Δ {comparison.metricsDelta.costPerUnit > 0 ? '+' : ''}${comparison.metricsDelta.costPerUnit.toFixed(2)}/u
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Change Statistics */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Change Statistics</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded">
                          <div className="text-2xl font-bold">{comparison.differences.statistics.totalChanges}</div>
                          <div className="text-xs text-muted-foreground">Total Changes</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
                          <div className="text-2xl font-bold text-green-600">{comparison.differences.statistics.operationsAdded}</div>
                          <div className="text-xs text-muted-foreground">Added</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                          <div className="text-2xl font-bold text-blue-600">{comparison.differences.statistics.operationsModified}</div>
                          <div className="text-xs text-muted-foreground">Modified</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded">
                          <div className="text-2xl font-bold text-red-600">{comparison.differences.statistics.operationsRemoved}</div>
                          <div className="text-xs text-muted-foreground">Removed</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Resource Utilization Comparison */}
                    {comparison.differences.resourceUtilization && (
                      <>
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Resource Utilization</h4>
                          <div className="space-y-2">
                            {Object.entries(comparison.differences.resourceUtilization).map(([resourceId, data]: [string, any]) => (
                              <div key={resourceId} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                <span className="text-sm font-medium">{data.name}</span>
                                <div className="flex space-x-4">
                                  <span className="text-sm">
                                    Base: <strong>{data.base?.utilization || 0}%</strong>
                                  </span>
                                  <span className="text-sm">
                                    Compare: <strong>{data.compare?.utilization || 0}%</strong>
                                  </span>
                                  {data.change !== 0 && (
                                    <span className={`text-sm font-bold ${data.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {data.change > 0 ? '+' : ''}{data.change}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Detailed Changes */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Detailed Changes</h4>
                      {formatDifference(comparison.differences)}
                    </div>
                  </CardContent>
                </Card>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Rollback Dialog */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Rollback</DialogTitle>
            <DialogDescription>
              Are you sure you want to rollback to Version {selectedVersion?.versionNumber}? 
              This will create a new version with the state from the selected version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This action will overwrite the current schedule with the selected version's state.
                The current state will be preserved in version history.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Rollback</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter reason for rollback..."
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                data-testid="input-rollback-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRollbackDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedVersion && rollbackMutation.mutate(selectedVersion.id)}
              disabled={rollbackMutation.isPending || !rollbackReason}
              data-testid="button-confirm-rollback"
            >
              {rollbackMutation.isPending ? 'Rolling back...' : 'Confirm Rollback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}