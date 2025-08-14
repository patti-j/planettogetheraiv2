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
import OperationSequencerWidget from '@/components/widgets/operation-sequencer-widget';
import { useQuery } from '@tanstack/react-query';

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Sequences</h1>
          <p className="text-gray-600">Reorder and optimize operation sequences for better resource utilization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSaveSequence}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Sequence
          </Button>
          <Button 
            onClick={handleOptimizeSequence}
            disabled={isOptimizing}
            className="flex items-center gap-2"
          >
            {isOptimizing ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Workflow className="h-4 w-4" />
                Auto-Optimize
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Operations</p>
                <p className="text-2xl font-bold">{sequenceStats.totalOperations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Optimized</p>
                <p className="text-2xl font-bold">{sequenceStats.optimizedSequences}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Time Saved</p>
                <p className="text-2xl font-bold">{sequenceStats.timesSaved}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Efficiency</p>
                <p className="text-2xl font-bold">{sequenceStats.efficiency}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sequence Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Resource:</span>
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resources.map((resource: any) => (
                    <SelectItem key={resource.id} value={resource.id.toString()}>
                      {resource.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
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

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">View:</span>
              <Select value={sequencerView} onValueChange={(value: any) => setSequencerView(value)}>
                <SelectTrigger className="w-32">
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
      <Card className="min-h-[600px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Operation Sequencer
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Workflow className="h-3 w-3" />
                Drag & Drop to Reorder
              </Badge>
              {isOptimizing && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <RotateCcw className="h-3 w-3 animate-spin" />
                  Optimizing...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OperationSequencerWidget
            configuration={{
              view: sequencerView,
              allowReorder: true,
              showResourceFilter: true,
              showStatusFilter: true,
              showOptimizationFlags: true
            }}
            isDesktop={true}
          />
        </CardContent>
      </Card>

      {/* Additional Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Sequence
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Apply to Schedule
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Original
        </Button>
      </div>
    </div>
  );
}