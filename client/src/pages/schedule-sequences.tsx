import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Workflow
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { OperationSequencer } from '@/components/operation-sequencer';

export default function ScheduleSequencesPage() {
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sequencerView, setSequencerView] = useState<'compact' | 'standard' | 'detailed'>('standard');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Fetch resources for filtering
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/resources'],
  });

  // Mock sequence statistics
  const sequenceStats = {
    totalOperations: 24,
    optimizedSequences: 18,
    timesSaved: 2.5,
    efficiency: 94
  };

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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium whitespace-nowrap">Resource:</span>
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {(resources as any[]).map((resource: any) => (
                    <SelectItem key={resource.id} value={resource.id.toString()}>
                      {resource.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <OperationSequencer
            resourceFilter={selectedResource}
            statusFilter={selectedStatus}
            view={sequencerView}
            onSequenceChange={(operations) => {
              console.log('Sequence changed:', operations.length, 'operations');
            }}
          />
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