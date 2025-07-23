import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAITheme } from '@/hooks/use-ai-theme';
import { 
  Monitor, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Users, 
  Building2, 
  DollarSign,
  Headphones,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Wrench,
  BarChart3,
  Target,
  Calendar,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { Job, Operation, Resource } from '@shared/schema';

interface VisualFactoryDisplay {
  id: number;
  name: string;
  description: string;
  location: string;
  audience: 'shop-floor' | 'customer-service' | 'sales' | 'management' | 'general';
  autoRotationInterval: number; // seconds
  isActive: boolean;
  useAiMode: boolean;
  widgets: VisualFactoryWidget[];
  createdAt: Date;
}

interface VisualFactoryWidget {
  id: string;
  type: 'metrics' | 'schedule' | 'orders' | 'alerts' | 'progress' | 'announcements' | 'weather' | 'chart';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
  priority: number;
  audienceRelevance: Record<string, number>; // audience -> relevance score
}

const defaultWidgets: Omit<VisualFactoryWidget, 'id'>[] = [
  {
    type: 'metrics',
    title: 'Production Overview',
    position: { x: 0, y: 0, width: 4, height: 2 },
    config: { showJobs: true, showUtilization: true, showOnTime: true },
    priority: 10,
    audienceRelevance: { 'shop-floor': 10, 'management': 9, 'general': 7 }
  },
  {
    type: 'schedule',
    title: 'Today\'s Schedule',
    position: { x: 4, y: 0, width: 8, height: 6 },
    config: { timeRange: 'today', showDetails: true },
    priority: 9,
    audienceRelevance: { 'shop-floor': 10, 'management': 8, 'general': 6 }
  },
  {
    type: 'orders',
    title: 'Active Orders',
    position: { x: 0, y: 2, width: 4, height: 4 },
    config: { showPriority: true, showDueDate: true, limit: 10 },
    priority: 8,
    audienceRelevance: { 'customer-service': 10, 'sales': 9, 'management': 7 }
  },
  {
    type: 'alerts',
    title: 'System Alerts',
    position: { x: 0, y: 6, width: 6, height: 2 },
    config: { showCritical: true, showWarnings: true },
    priority: 7,
    audienceRelevance: { 'shop-floor': 9, 'management': 10, 'general': 6 }
  }
];

export default function VisualFactory() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<VisualFactoryDisplay | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWidgetIndex, setCurrentWidgetIndex] = useState(0);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [aiConfigDialogOpen, setAiConfigDialogOpen] = useState(false);
  const [newDisplayDialogOpen, setNewDisplayDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [audience, setAudience] = useState<string>('general');
  const [location, setLocation] = useState('');
  const [displayType, setDisplayType] = useState('Large Screen Display');
  const [includeRealTime, setIncludeRealTime] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const adaptiveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { aiTheme } = useAITheme();

  // Fetch data
  const { data: displays = [] } = useQuery<VisualFactoryDisplay[]>({
    queryKey: ['/api/visual-factory/displays'],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ['/api/operations'],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });

  // Calculate metrics from available data
  const metrics = {
    utilization: Math.round((operations.filter(op => op.status === 'In Progress').length / Math.max(operations.length, 1)) * 100),
    onTimeDelivery: operations.filter(op => op.status === 'Completed').length / Math.max(operations.length, 1)
  };

  const { data: liveData } = useQuery({
    queryKey: ['/api/visual-factory/live-data', { audience, includeRealTime }],
    refetchInterval: adaptiveMode ? 30000 : 0, // Refresh every 30s in adaptive mode
    enabled: !!currentDisplay && (includeRealTime || adaptiveMode)
  });

  // AI Content Generation Mutations
  const generateAIContentMutation = useMutation({
    mutationFn: async (params: {
      prompt: string;
      audience: string;
      location: string;
      displayType: string;
      includeRealTime: boolean;
    }) => {
      const response = await apiRequest('POST', '/api/visual-factory/ai/generate-content', params);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Content Generated",
        description: "Your display configuration has been created successfully!"
      });
      setAiConfigDialogOpen(false);
      setAiPrompt('');
      
      // Apply the generated content to create a new display
      if (data.displayConfig) {
        createDisplayMutation.mutate({
          ...data.displayConfig,
          location: location || 'Generated Display',
          useAiMode: true,
          isActive: true
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI content. Please try again.",
        variant: "destructive"
      });
    }
  });

  const generateAdaptiveContentMutation = useMutation({
    mutationFn: async (params: {
      displayId?: number;
      timeOfDay: string;
      audience: string;
    }) => {
      const response = await apiRequest('POST', '/api/visual-factory/ai/adaptive-content', params);
      return await response.json();
    },
    onSuccess: (data) => {
      if (currentDisplay && data.adaptiveContent) {
        // Update current display with adaptive content
        updateDisplayMutation.mutate({
          id: currentDisplay.id,
          widgets: data.adaptiveContent.widgets,
          autoRotationInterval: data.adaptiveContent.recommendedInterval,
          useAiMode: true
        });
        
        toast({
          title: "Adaptive Content Applied",
          description: data.insights
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Adaptive Content Failed",
        description: "Failed to generate adaptive content. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Display Management Mutations
  const createDisplayMutation = useMutation({
    mutationFn: async (display: any) => {
      const response = await apiRequest('POST', '/api/visual-factory/displays', display);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visual-factory/displays'] });
      setNewDisplayDialogOpen(false);
    }
  });

  const updateDisplayMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & any) => {
      const response = await apiRequest('PUT', `/api/visual-factory/displays/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visual-factory/displays'] });
    }
  });

  // Auto-rotation effect with adaptive content
  useEffect(() => {
    if (isPlaying && currentDisplay && currentDisplay.widgets.length > 1) {
      const interval = currentDisplay.autoRotationInterval * 1000;
      setTimeRemaining(interval / 1000);
      
      intervalRef.current = setInterval(() => {
        setCurrentWidgetIndex(prev => (prev + 1) % currentDisplay.widgets.length);
        setTimeRemaining(interval / 1000);
      }, interval);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        clearInterval(countdownInterval);
      };
    }
  }, [isPlaying, currentDisplay, currentWidgetIndex]);

  // Adaptive content refresh effect
  useEffect(() => {
    if (adaptiveMode && currentDisplay) {
      const refreshAdaptiveContent = () => {
        const currentHour = new Date().getHours();
        let timeOfDay = 'general';
        
        if (currentHour >= 6 && currentHour < 12) timeOfDay = 'morning';
        else if (currentHour >= 12 && currentHour < 18) timeOfDay = 'afternoon';
        else if (currentHour >= 18 && currentHour < 22) timeOfDay = 'evening';
        else timeOfDay = 'night';

        generateAdaptiveContentMutation.mutate({
          displayId: currentDisplay.id,
          timeOfDay,
          audience
        });
      };

      // Refresh adaptive content every 5 minutes
      adaptiveIntervalRef.current = setInterval(refreshAdaptiveContent, 5 * 60 * 1000);
      
      return () => {
        if (adaptiveIntervalRef.current) {
          clearInterval(adaptiveIntervalRef.current);
        }
      };
    }
  }, [adaptiveMode, currentDisplay, audience]);

  // AI Content Generation Functions
  const handleGenerateAIContent = () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your display.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAI(true);
    generateAIContentMutation.mutate({
      prompt: aiPrompt,
      audience,
      location,
      displayType,
      includeRealTime
    });
  };

  const handleToggleAdaptiveMode = () => {
    setAdaptiveMode(!adaptiveMode);
    
    if (!adaptiveMode && currentDisplay) {
      // Enable adaptive mode - generate initial adaptive content
      const currentHour = new Date().getHours();
      let timeOfDay = 'morning';
      if (currentHour >= 12 && currentHour < 18) timeOfDay = 'afternoon';
      else if (currentHour >= 18 && currentHour < 22) timeOfDay = 'evening';
      else if (currentHour >= 22 || currentHour < 6) timeOfDay = 'night';

      generateAdaptiveContentMutation.mutate({
        displayId: currentDisplay.id,
        timeOfDay,
        audience
      });
      
      toast({
        title: "Adaptive Mode Enabled",
        description: "Display will now automatically adjust content based on real-time conditions."
      });
    } else {
      toast({
        title: "Adaptive Mode Disabled",
        description: "Display content will remain static."
      });
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handlePlay = () => {
    if (currentDisplay) {
      setIsPlaying(!isPlaying);
    }
  };

  const resetRotation = () => {
    setCurrentWidgetIndex(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const renderWidget = (widget: VisualFactoryWidget) => {
    const widgetContent = () => {
      switch (widget.type) {
        case 'metrics':
          return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{jobs.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{metrics.utilization}%</div>
                <div className="text-xs sm:text-sm text-gray-600">Utilization</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  {Math.round(metrics.onTimeDelivery * 100)}%
                </div>
                <div className="text-xs sm:text-sm text-gray-600">On Time</div>
              </div>
            </div>
          );

        case 'schedule':
          const todayOperations = operations.filter(op => {
            if (!op.startTime) return false;
            const opDate = new Date(op.startTime);
            const today = new Date();
            return opDate.toDateString() === today.toDateString();
          });

          return (
            <div className="space-y-2">
              {todayOperations.slice(0, 6).map(operation => (
                <div key={operation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-50 rounded gap-1 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{operation.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate">
                      {jobs.find(j => j.id === operation.jobId)?.name}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:text-right">
                    <Badge variant={operation.status === 'Completed' ? 'default' : 'secondary'} className="text-xs">
                      {operation.status}
                    </Badge>
                    <div className="text-xs text-gray-600 ml-2 sm:ml-0">
                      {operation.startTime ? new Date(operation.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Not scheduled'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );

        case 'orders':
          return (
            <div className="space-y-2">
              {jobs.slice(0, 8).map(job => (
                <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 bg-gray-50 rounded gap-1 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{job.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate">{job.customer}</div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:text-right">
                    <Badge variant={job.priority === 'High' ? 'destructive' : 
                                  job.priority === 'Medium' ? 'default' : 'secondary'} className="text-xs">
                      {job.priority}
                    </Badge>
                    <div className="text-xs text-gray-600 ml-2 sm:ml-0">
                      {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );

        case 'alerts':
          const alerts = [
            { type: 'warning', message: 'Machine CNC-001 maintenance due in 2 days', time: '10 min ago' },
            { type: 'info', message: 'New order received from Tech Corp', time: '25 min ago' },
            { type: 'success', message: 'Batch A assembly completed ahead of schedule', time: '1 hour ago' }
          ];

          return (
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-2 sm:space-x-3 p-2 bg-gray-50 rounded">
                  {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mt-0.5" />}
                  {alert.type === 'info' && <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5" />}
                  {alert.type === 'success' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm">{alert.message}</div>
                    <div className="text-xs text-gray-500">{alert.time}</div>
                  </div>
                </div>
              ))}
            </div>
          );

        case 'progress':
          const completedOps = operations.filter(op => op.status === 'Completed').length;
          const totalOps = operations.length;
          const progressPercent = totalOps > 0 ? (completedOps / totalOps) * 100 : 0;

          return (
            <div className="text-center">
              <div className="mb-4">
                <div className="text-2xl sm:text-3xl font-bold">{Math.round(progressPercent)}%</div>
                <div className="text-xs sm:text-sm text-gray-600">Daily Progress</div>
              </div>
              <Progress value={progressPercent} className="w-full h-3 sm:h-4" />
              <div className="mt-2 text-xs sm:text-sm text-gray-600">
                {completedOps} of {totalOps} operations completed
              </div>
            </div>
          );

        default:
          return <div className="text-center text-gray-500">Widget content</div>;
      }
    };

    return (
      <Card className="h-full">
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            {widget.title}
            {isPlaying && currentDisplay && currentDisplay.widgets.length > 1 && (
              <div className="text-xs sm:text-sm font-normal text-gray-500">
                {Math.ceil(timeRemaining)}s
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {widgetContent()}
        </CardContent>
      </Card>
    );
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'shop-floor': return <Building2 className="w-4 h-4" />;
      case 'customer-service': return <Headphones className="w-4 h-4" />;
      case 'sales': return <DollarSign className="w-4 h-4" />;
      case 'management': return <TrendingUp className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const currentWidget = currentDisplay?.widgets[currentWidgetIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <div ref={containerRef} className={`${isFullscreen ? 'h-screen' : 'h-auto'} bg-white`}>
        {/* Header - Hidden in fullscreen */}
        {!isFullscreen && (
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6 py-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="md:ml-0 ml-12">
                  <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
                    <Monitor className="w-6 h-6 mr-2" />
                    Visual Factory
                  </h1>
                  <p className="text-sm md:text-base text-gray-600">Automated large screen displays for manufacturing facilities</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                  <Dialog open={aiConfigDialogOpen} onOpenChange={setAiConfigDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className={`${aiTheme.gradient} text-white text-sm`} size="sm">
                        <Sparkles className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Configure</span>
                        <span className="sm:hidden">AI</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>AI Display Configuration</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ai-prompt">Describe your display requirements</Label>
                          <Textarea
                            id="ai-prompt"
                            placeholder="Create a display for the shop floor showing production metrics, current operations, and alerts. Make it engaging and easy to read from a distance."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="audience">Target Audience</Label>
                            <Select value={audience} onValueChange={setAudience}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select audience" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="management">Management</SelectItem>
                                <SelectItem value="shop-floor">Shop Floor</SelectItem>
                                <SelectItem value="customer-service">Customer Service</SelectItem>
                                <SelectItem value="sales">Sales Team</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              placeholder="e.g., Main Production Floor"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="includeRealTime"
                            checked={includeRealTime}
                            onCheckedChange={(checked) => setIncludeRealTime(checked === true)}
                          />
                          <Label htmlFor="includeRealTime">Include real-time data</Label>
                        </div>
                        
                        <Button
                          onClick={handleGenerateAIContent}
                          disabled={!aiPrompt.trim() || generateAIContentMutation.isPending}
                          className={`w-full ${aiTheme.gradient} text-white`}
                        >
                          {generateAIContentMutation.isPending ? 'Generating...' : 'Generate Display'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={newDisplayDialogOpen} onOpenChange={setNewDisplayDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="text-xs sm:text-sm">
                        <Monitor className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">New Display</span>
                        <span className="sm:hidden">New</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Display</DialogTitle>
                      </DialogHeader>
                      <CreateDisplayForm 
                        onSubmit={(display) => createDisplayMutation.mutate(display)}
                        isLoading={createDisplayMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Selection - Hidden in fullscreen during playback */}
        {!isFullscreen && (
          <div className="px-3 sm:px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displays.map(display => (
                <Card 
                  key={display.id} 
                  className={`cursor-pointer transition-all ${currentDisplay?.id === display.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setCurrentDisplay(display)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-base sm:text-lg">{display.name}</CardTitle>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {getAudienceIcon(display.audience)}
                        <Badge variant={display.isActive ? 'default' : 'secondary'} className="text-xs">
                          {display.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{display.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{display.location}</span>
                      <span>{display.widgets.length} widgets</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Display Controls */}
        {currentDisplay && (
          <div className={`${isFullscreen ? 'absolute top-4 right-4 z-50' : 'px-3 sm:px-6 py-4 border-b border-gray-200'} flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2`}>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePlay}
                variant={isPlaying ? "destructive" : "default"}
                size="sm"
                className="text-xs"
              >
                {isPlaying ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="ml-1">{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>
              <Button onClick={resetRotation} variant="outline" size="sm" className="text-xs">
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="ml-1 hidden sm:inline">Reset</span>
              </Button>
              <Button onClick={handleFullscreen} variant="outline" size="sm" className="text-xs">
                {isFullscreen ? <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="ml-1 hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </Button>
            </div>
            {!isFullscreen && (
              <div className="text-xs sm:text-sm text-gray-600">
                {currentDisplay.name} • Widget {currentWidgetIndex + 1} of {currentDisplay.widgets.length}
              </div>
            )}
          </div>
        )}

        {/* Main Display Area */}
        <div className={`${isFullscreen ? 'h-screen p-4 sm:p-8' : 'p-3 sm:p-6'} bg-gray-50`}>
          {currentDisplay && currentWidget ? (
            <div className={`${isFullscreen ? 'h-full' : 'h-80 sm:h-96'}`}>
              {renderWidget(currentWidget)}
            </div>
          ) : (
            <div className="h-80 sm:h-96 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center px-4">
                <Monitor className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Display Selected</h3>
                <p className="text-sm sm:text-base text-gray-600">Choose a display configuration to start the visual factory experience</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Display Form Component
function CreateDisplayForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (display: Omit<VisualFactoryDisplay, 'id' | 'createdAt'>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    audience: 'general' as const,
    autoRotationInterval: 30,
    isActive: true,
    useAiMode: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      widgets: defaultWidgets.map((widget, index) => ({
        ...widget,
        id: `widget-${index}`
      }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-sm">Display Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Shop Floor Display 1"
            className="text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="location" className="text-sm">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Production Area A"
            className="text-sm"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-sm">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Main production display showing real-time metrics and schedules"
          className="text-sm"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="audience" className="text-sm">Target Audience</Label>
          <Select value={formData.audience} onValueChange={(value: any) => setFormData({ ...formData, audience: value })}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shop-floor">Shop Floor Workers</SelectItem>
              <SelectItem value="customer-service">Customer Service</SelectItem>
              <SelectItem value="sales">Sales Office</SelectItem>
              <SelectItem value="management">Management</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="interval" className="text-sm">Auto-rotation (seconds)</Label>
          <Input
            id="interval"
            type="number"
            min="10"
            max="300"
            value={formData.autoRotationInterval}
            onChange={(e) => setFormData({ ...formData, autoRotationInterval: parseInt(e.target.value) })}
            className="text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="active" className="text-sm">Active</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="ai-mode"
            checked={formData.useAiMode}
            onCheckedChange={(checked) => setFormData({ ...formData, useAiMode: checked })}
          />
          <Label htmlFor="ai-mode" className="text-sm">AI Dynamic Mode</Label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !formData.name || !formData.location} className="w-full">
        {isLoading ? 'Creating...' : 'Create Display'}
      </Button>
    </form>
  );
}