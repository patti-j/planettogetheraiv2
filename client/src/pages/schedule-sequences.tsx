import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowUpDown, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  Download,
  Filter,
  Search,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Workflow,
  X,
  Plus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { OperationSequencer } from '@/components/operation-sequencer';

export default function ScheduleSequencesPage() {
  const [selectedResources, setSelectedResources] = useState<string[]>(['all']);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sequencerView, setSequencerView] = useState<'compact' | 'standard' | 'detailed'>('standard');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showResourceSelector, setShowResourceSelector] = useState(false);
  const resourceSelectorRef = useRef<HTMLDivElement>(null);

  // Fetch resources for filtering
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

  // Fetch operations to count activities per resource
  const { data: operations = [] } = useQuery({
    queryKey: ['/api/operations'],
  });

  // Calculate activity counts per resource
  const resourceActivityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Count operations per resource
    operations.forEach((operation: any) => {
      const resourceId = operation.assignedResourceId?.toString() || 'unassigned';
      counts[resourceId] = (counts[resourceId] || 0) + 1;
    });
    
    return counts;
  }, [operations]);

  // Calculate sequence statistics based on actual data
  const sequenceStats = useMemo(() => {
    const totalOps = operations.length;
    const optimizedOps = operations.filter((op: any) => op.status === 'planned').length;
    const efficiency = totalOps > 0 ? Math.round((optimizedOps / totalOps) * 100) : 0;
    
    return {
      totalOperations: totalOps,
      optimizedSequences: optimizedOps,
      timesSaved: Math.round((totalOps * 0.1) * 10) / 10, // Estimate based on operations
      efficiency: efficiency
    };
  }, [operations]);

  const handleOptimizeSequence = () => {
    setIsOptimizing(true);
    // Simulate optimization process
    setTimeout(() => {
      setIsOptimizing(false);
    }, 3000);
  };

  const handleSaveSequence = () => {
    // Save current sequence configuration
    console.log('Saving sequence configuration...');
  };

  const handleResourceToggle = (resourceId: string) => {
    if (resourceId === 'all') {
      setSelectedResources(['all']);
    } else {
      const currentResources = selectedResources.filter(r => r !== 'all');
      if (currentResources.includes(resourceId)) {
        const newResources = currentResources.filter(r => r !== resourceId);
        setSelectedResources(newResources.length === 0 ? ['all'] : newResources);
      } else {
        setSelectedResources([...currentResources, resourceId]);
      }
    }
  };

  const removeResource = (resourceId: string) => {
    const newResources = selectedResources.filter(r => r !== resourceId);
    setSelectedResources(newResources.length === 0 ? ['all'] : newResources);
  };

  const getResourceName = (resourceId: string) => {
    if (resourceId === 'all') return 'All Resources';
    const resource = (resources as any[]).find(r => r.id.toString() === resourceId);
    return resource?.name || `Resource ${resourceId}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resourceSelectorRef.current && !resourceSelectorRef.current.contains(event.target as Node)) {
        setShowResourceSelector(false);
      }
    };

    if (showResourceSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResourceSelector]);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            <span className="hidden sm:inline">Schedule Sequences</span>
            <span className="sm:hidden">Sequences</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Reorder and optimize operation sequences</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleSaveSequence}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            size="sm"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save Sequence</span>
            <span className="sm:hidden">Save</span>
          </Button>
          <Button 
            onClick={handleOptimizeSequence}
            disabled={isOptimizing}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            size="sm"
          >
            {isOptimizing ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Optimizing...</span>
                <span className="sm:hidden">Optimizing</span>
              </>
            ) : (
              <>
                <Workflow className="h-4 w-4" />
                <span className="hidden sm:inline">Auto-Optimize</span>
                <span className="sm:hidden">Optimize</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium">Total Operations</p>
                <p className="text-lg sm:text-2xl font-bold">{sequenceStats.totalOperations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium">Optimized</p>
                <p className="text-lg sm:text-2xl font-bold">{sequenceStats.optimizedSequences}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium">Time Saved</p>
                <p className="text-lg sm:text-2xl font-bold">{sequenceStats.timesSaved}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <div>
                <p className="text-xs sm:text-sm font-medium">Efficiency</p>
                <p className="text-lg sm:text-2xl font-bold">{sequenceStats.efficiency}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Sequence Controls</span>
            <span className="sm:hidden">Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-col gap-2 w-full sm:w-auto relative" ref={resourceSelectorRef}>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium whitespace-nowrap">Resources:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResourceSelector(!showResourceSelector)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Select ({selectedResources.length})
                </Button>
              </div>
              
              {/* Selected Resources Tags */}
              <div className="flex flex-wrap gap-1">
                {selectedResources.map((resourceId) => (
                  <Badge key={resourceId} variant="secondary" className="text-xs flex items-center gap-1">
                    {getResourceName(resourceId)}
                    {resourceId !== 'all' && (
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeResource(resourceId)}
                      />
                    )}
                  </Badge>
                ))}
              </div>

              {/* Resource Selector Dropdown */}
              {showResourceSelector && (
                <Card className="absolute z-50 top-full mt-1 w-72 max-h-64 overflow-y-auto shadow-lg border">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                        <Checkbox
                          id="all-resources"
                          checked={selectedResources.includes('all')}
                          onCheckedChange={() => handleResourceToggle('all')}
                        />
                        <label htmlFor="all-resources" className="text-sm font-medium cursor-pointer flex-1">
                          All Resources
                        </label>
                        <Badge variant="secondary" className="text-xs">
                          {operations.length}
                        </Badge>
                      </div>
                      <div className="border-t pt-2">
                        {(resources as any[]).map((resource: any) => {
                          const activityCount = resourceActivityCounts[resource.id.toString()] || 0;
                          return (
                            <div key={resource.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                              <Checkbox
                                id={`resource-${resource.id}`}
                                checked={selectedResources.includes(resource.id.toString())}
                                onCheckedChange={() => handleResourceToggle(resource.id.toString())}
                              />
                              <label htmlFor={`resource-${resource.id}`} className="text-sm flex-1 cursor-pointer">
                                {resource.name}
                              </label>
                              <Badge variant="outline" className="text-xs">
                                {activityCount}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium whitespace-nowrap">Status:</span>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium whitespace-nowrap">View:</span>
              <Select value={sequencerView} onValueChange={(value: any) => setSequencerView(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Sequencer Widget */}
      <Card className="min-h-[400px] sm:min-h-[500px] flex flex-col">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Operation Sequencer</span>
              <span className="sm:hidden">Sequencer</span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <Workflow className="h-3 w-3" />
                <span className="hidden sm:inline">Drag & Drop to Reorder</span>
                <span className="sm:hidden">Drag to Reorder</span>
              </Badge>
              {isOptimizing && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <RotateCcw className="h-3 w-3 animate-spin" />
                  Optimizing...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {selectedResources.includes('all') ? (
            <OperationSequencer
              resourceFilter="all"
              statusFilter={selectedStatus}
              view={sequencerView}
              onSequenceChange={(operations) => {
                console.log('Sequence changed:', operations.length, 'operations');
              }}
            />
          ) : (
            <div className="space-y-4">
              {selectedResources.map((resourceId) => {
                const resource = (resources as any[]).find(r => r.id.toString() === resourceId);
                const activityCount = resourceActivityCounts[resourceId] || 0;
                
                return (
                  <div key={resourceId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium flex items-center gap-2">
                        {resource?.name || `Resource ${resourceId}`}
                        <Badge variant="outline" className="text-xs">
                          {activityCount} activities
                        </Badge>
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(resourceId)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <OperationSequencer
                      resourceFilter={resourceId}
                      statusFilter={selectedStatus}
                      view={sequencerView}
                      onSequenceChange={(operations) => {
                        console.log(`Sequence changed for ${resource?.name}:`, operations.length, 'operations');
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
        <Button variant="outline" className="flex items-center gap-2" size="sm">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export Sequence</span>
          <span className="sm:hidden">Export</span>
        </Button>
        <Button variant="outline" className="flex items-center gap-2" size="sm">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Apply to Schedule</span>
          <span className="sm:hidden">Apply</span>
        </Button>
        <Button variant="outline" className="flex items-center gap-2" size="sm">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Reset to Original</span>
          <span className="sm:hidden">Reset</span>
        </Button>
      </div>
    </div>
  );
}