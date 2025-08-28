import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Activity,
  Moon,
  Sun,
  MessageCircle,
  Send,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek } from "date-fns";

interface Operation {
  id: number;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  resourceId?: number;
  jobId?: number;
  status: 'planned' | 'in-progress' | 'completed';
  completionPercentage: number;
  priority: number;
}

interface Resource {
  id: number;
  name: string;
  category: string;
  type: string;
  isActive: boolean;
}

type ViewMode = 'hour-day' | 'day-week' | 'week-month' | 'month-year';
type Algorithm = 'asap' | 'alap' | 'critical-path' | 'level-resources' | 'drum-toc';

export default function ProductionScheduler() {
  const [viewMode, setViewMode] = useState<ViewMode>('day-week');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('asap');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMaxAIOpen, setIsMaxAIOpen] = useState(false);
  const [maxAIMessage, setMaxAIMessage] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);

  // Get operations and resources
  const { data: operations, isLoading: loadingOperations } = useQuery({
    queryKey: ['/api/operations'],
  });

  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['/api/resources'],
  });

  // Algorithm mutation
  const algorithmMutation = useMutation({
    mutationFn: async (algorithm: Algorithm) => {
      const response = await apiRequest('POST', '/api/scheduler/apply-algorithm', { algorithm });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Algorithm Applied", description: "Schedule optimized successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to apply algorithm", variant: "destructive" });
    },
  });

  // Max AI message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/max-ai/scheduler-chat', { message });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Max AI", description: data.response });
    },
  });

  const getTimelineColumns = () => {
    const columns = [];
    const start = startOfWeek(currentDate);
    
    switch (viewMode) {
      case 'hour-day':
        for (let i = 0; i < 24; i++) {
          columns.push(`${i}:00`);
        }
        break;
      case 'day-week':
        for (let i = 0; i < 7; i++) {
          const date = addDays(start, i);
          columns.push(format(date, 'EEE MM/dd'));
        }
        break;
      case 'week-month':
        for (let i = 0; i < 4; i++) {
          const weekStart = addDays(start, i * 7);
          columns.push(`Week ${format(weekStart, 'MM/dd')}`);
        }
        break;
      case 'month-year':
        for (let i = 0; i < 12; i++) {
          columns.push(format(addDays(start, i * 30), 'MMM'));
        }
        break;
    }
    return columns;
  };

  const handleAlgorithmClick = (algorithm: Algorithm) => {
    setSelectedAlgorithm(algorithm);
    algorithmMutation.mutate(algorithm);
  };

  const handleMaxAISend = () => {
    if (maxAIMessage.trim()) {
      sendMessageMutation.mutate(maxAIMessage);
      setMaxAIMessage('');
    }
  };

  const timelineColumns = getTimelineColumns();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Production Scheduler</h1>
              <p className="text-muted-foreground">
                Advanced scheduling with AI optimization and resource management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaxAIOpen(!isMaxAIOpen)}
              >
                <MessageCircle className="h-4 w-4" />
                Max AI
              </Button>
            </div>
          </div>

          {/* Max AI Panel */}
          {isMaxAIOpen && (
            <Card className="border-2 border-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">🤖 Max AI Assistant</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMaxAIOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAlgorithmClick('asap')}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Run ASAP
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAlgorithmClick('alap')}
                  >
                    <TrendingDown className="h-4 w-4 mr-1" />
                    Run ALAP
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAlgorithmClick('critical-path')}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Critical Path
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAlgorithmClick('level-resources')}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Level Resources
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAlgorithmClick('drum-toc')}
                  >
                    <Target className="h-4 w-4 mr-1" />
                    Drum (TOC)
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                  >
                    <Activity className="h-4 w-4 mr-1" />
                    Analyze Schedule
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Hello! I'm Max, your AI scheduling assistant. How can I help optimize your production schedule today?"
                    value={maxAIMessage}
                    onChange={(e) => setMaxAIMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleMaxAISend()}
                  />
                  <Button onClick={handleMaxAISend} disabled={sendMessageMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>View:</Label>
                <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour-day">Hour & Day</SelectItem>
                    <SelectItem value="day-week">Day & Week</SelectItem>
                    <SelectItem value="week-month">Week & Month</SelectItem>
                    <SelectItem value="month-year">Month & Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.min(zoomLevel + 0.2, 2))}
                >
                  <ZoomIn className="h-4 w-4" />
                  Zoom In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(Math.max(zoomLevel - 0.2, 0.5))}
                >
                  <ZoomOut className="h-4 w-4" />
                  Zoom Out
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(1)}
                >
                  <Maximize2 className="h-4 w-4" />
                  Fit to View
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Algorithm:</Label>
                <Select value={selectedAlgorithm} onValueChange={(value: Algorithm) => setSelectedAlgorithm(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP (Forward)</SelectItem>
                    <SelectItem value="alap">ALAP (Backward)</SelectItem>
                    <SelectItem value="critical-path">Critical Path</SelectItem>
                    <SelectItem value="level-resources">Level Resources</SelectItem>
                    <SelectItem value="drum-toc">Drum (TOC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleAlgorithmClick(selectedAlgorithm)}
                disabled={algorithmMutation.isPending}
              >
                {algorithmMutation.isPending ? 'Applying...' : 'Apply Algorithm'}
              </Button>
            </div>
          </div>

          {/* Gantt Chart */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
                {/* Timeline Header */}
                <div className="grid grid-cols-[200px_150px_1fr] border-b bg-muted/50">
                  <div className="p-3 font-medium border-r">Resource</div>
                  <div className="p-3 font-medium border-r">Category</div>
                  <div className="grid grid-cols-7 gap-0">
                    {timelineColumns.map((column, index) => (
                      <div key={index} className="p-3 text-center font-medium border-r text-sm">
                        {column}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-[200px_150px_1fr] border-b bg-muted/20">
                  <div className="p-2 border-r"></div>
                  <div className="p-2 border-r"></div>
                  <div className="grid grid-cols-7 gap-0">
                    {timelineColumns.map((_, colIndex) => (
                      <div key={colIndex} className="border-r">
                        <div className="grid grid-cols-12 h-8">
                          {Array.from({ length: 12 }, (_, hourIndex) => (
                            <div 
                              key={hourIndex} 
                              className="border-r border-border/30 text-xs text-center py-1"
                            >
                              {viewMode === 'hour-day' ? `${hourIndex * 2}` : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Time Indicator */}
                <div className="grid grid-cols-[200px_150px_1fr] border-b bg-muted/10">
                  <div className="p-2 border-r text-sm text-muted-foreground">
                    {format(new Date(), 'HH:mm')}
                  </div>
                  <div className="p-2 border-r"></div>
                  <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 z-10"></div>
                    <div className="h-6"></div>
                  </div>
                </div>

                {/* Resources and Operations */}
                {loadingResources ? (
                  <div className="p-8 text-center text-muted-foreground">Loading resources...</div>
                ) : !resources || (resources as Resource[]).length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No records to display</div>
                ) : (
                  (resources as Resource[])?.map((resource: Resource) => (
                    <div key={resource.id} className="grid grid-cols-[200px_150px_1fr] border-b hover:bg-muted/30">
                      <div className="p-3 border-r font-medium">{resource.name}</div>
                      <div className="p-3 border-r text-sm text-muted-foreground">{resource.category}</div>
                      <div className="relative min-h-[60px] p-2">
                        {/* Operation bars for this resource */}
                        {(operations as Operation[])?.filter((op: Operation) => op.resourceId === resource.id).map((operation: Operation) => (
                          <div
                            key={operation.id}
                            className={`absolute h-8 rounded text-xs text-white px-2 py-1 cursor-pointer transition-all hover:shadow-lg ${
                              operation.status === 'completed' ? 'bg-green-500' :
                              operation.status === 'in-progress' ? 'bg-blue-500' :
                              'bg-orange-500'
                            }`}
                            style={{
                              left: '10px', // Would calculate based on startTime
                              width: '120px', // Would calculate based on duration
                              top: '10px'
                            }}
                            onClick={() => setSelectedOperation(operation)}
                          >
                            <div className="font-medium truncate">{operation.name}</div>
                            <div className="text-xs opacity-90">{operation.completionPercentage}% complete</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Bar */}
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                {(operations as Operation[])?.length || 0} operations scheduled
              </Badge>
              <Badge variant="outline">
                Resource utilization: 83%
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: {format(new Date(), 'HH:mm:ss')}
            </div>
          </div>

          {/* Operation Details */}
          {selectedOperation && (
            <Card>
              <CardHeader>
                <CardTitle>Operation Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setSelectedOperation(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Operation Name</Label>
                    <div className="font-medium">{selectedOperation.name}</div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={
                      selectedOperation.status === 'completed' ? 'default' :
                      selectedOperation.status === 'in-progress' ? 'secondary' :
                      'outline'
                    }>
                      {selectedOperation.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <div>{format(selectedOperation.startTime, 'MMM d, HH:mm')}</div>
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <div>{format(selectedOperation.endTime, 'MMM d, HH:mm')}</div>
                  </div>
                  <div>
                    <Label>Completion</Label>
                    <div>{selectedOperation.completionPercentage}%</div>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <div>{selectedOperation.priority}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}