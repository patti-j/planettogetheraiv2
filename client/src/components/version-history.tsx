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
  parentVersionId: number | null;
  changeType: string;
  comment: string | null;
  tag: string | null;
  snapshotData: any;
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

  // Fetch version history
  const { data: versions, isLoading } = useQuery({
    queryKey: ['/api/schedules', scheduleId, 'versions'],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/${scheduleId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch version history');
      return response.json();
    },
    enabled: !!scheduleId
  });

  // Fetch version comparison
  const { data: comparison, isLoading: isLoadingComparison } = useQuery({
    queryKey: ['/api/schedules', scheduleId, 'versions', compareVersions.base, 'compare', compareVersions.compare],
    queryFn: async () => {
      const response = await fetch(
        `/api/schedules/${scheduleId}/versions/${compareVersions.base}/compare/${compareVersions.compare}`
      );
      if (!response.ok) throw new Error('Failed to compare versions');
      return response.json();
    },
    enabled: !!compareVersions.base && !!compareVersions.compare
  });

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

  const getChangeTypeColor = (changeType: string) => {
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

  const getChangeTypeIcon = (changeType: string) => {
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
              <div className="relative">
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

                    {/* Version card */}
                    <Card className="ml-12 flex-1 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedVersion(version)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {getChangeTypeIcon(version.changeType)}
                              <span className="font-semibold">Version {version.versionNumber}</span>
                              {version.id === currentVersionId && (
                                <Badge variant="default" className="ml-2">Current</Badge>
                              )}
                              {version.tag && (
                                <Badge variant="outline" className="ml-2">{version.tag}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(version.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                            </p>
                          </div>
                          <Badge 
                            variant="secondary"
                            className={`${getChangeTypeColor(version.changeType)} text-white`}
                          >
                            {version.changeType.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {version.comment && (
                          <p className="text-sm text-muted-foreground mb-2">{version.comment}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            By User #{version.createdBy}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompareVersions({
                                  base: version.parentVersionId || version.id - 1,
                                  compare: version.id
                                });
                              }}
                              data-testid={`button-compare-version-${version.id}`}
                            >
                              <GitCompare className="h-3 w-3 mr-1" />
                              Compare
                            </Button>
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
                  onChange={(e) => setCompareVersions({ ...compareVersions, base: Number(e.target.value) })}
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
                  onChange={(e) => setCompareVersions({ ...compareVersions, compare: Number(e.target.value) })}
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

            {comparison && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparison Results</CardTitle>
                  <CardDescription>
                    Changes from Version {comparison.baseVersion.versionNumber} to Version {comparison.compareVersion.versionNumber}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{comparison.differences.statistics.totalChanges}</div>
                      <div className="text-xs text-muted-foreground">Total Changes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{comparison.differences.statistics.operationsAdded}</div>
                      <div className="text-xs text-muted-foreground">Added</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{comparison.differences.statistics.operationsModified}</div>
                      <div className="text-xs text-muted-foreground">Modified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{comparison.differences.statistics.operationsRemoved}</div>
                      <div className="text-xs text-muted-foreground">Removed</div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  {formatDifference(comparison.differences)}
                </CardContent>
              </Card>
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