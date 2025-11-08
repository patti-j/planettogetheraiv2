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
import { useErrorHandler, createSafeQuery, createSafeSubmission } from '@/lib/error-handler';
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
  Minimize2,
  ArrowUpDown,
  Plus as PlusIcon,
  Trash2,
  Edit
} from 'lucide-react';
import type { Operation, Resource } from '@shared/schema';
import { useMaxDock } from '@/contexts/MaxDockContext';

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
  // Dashboard rotation properties
  useDashboardRotation: boolean;
  dashboardSequence: DashboardSequenceItem[];
  // Scheduling properties
  schedule: DisplaySchedule;
  createdAt: Date;
}

interface DisplaySchedule {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  isScheduled: boolean;
}

interface DashboardSequenceItem {
  dashboardId: number;
  displayDuration: number; // seconds
  transitionEffect?: 'fade' | 'slide' | 'none';
}

interface Dashboard {
  id: number;
  name: string;
  description?: string;
  widgets: any[];
  layout: any;
  isActive: boolean;
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
  const { isMaxOpen } = useMaxDock();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<VisualFactoryDisplay | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWidgetIndex, setCurrentWidgetIndex] = useState(0);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [editingDisplay, setEditingDisplay] = useState<VisualFactoryDisplay | null>(null);
  
  // Dashboard rotation states
  const [dashboardRotationDialogOpen, setDashboardRotationDialogOpen] = useState(false);
  const [currentDashboardIndex, setCurrentDashboardIndex] = useState(0);
  const [selectedDashboards, setSelectedDashboards] = useState<DashboardSequenceItem[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const adaptiveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { aiTheme } = useAITheme();
  const errorHandler = useErrorHandler('VisualFactory');

  // Fetch data
  const { data: displays = [] } = useQuery<VisualFactoryDisplay[]>({
    queryKey: ['/api/visual-factory/displays'],
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: operations = [] } = useQuery<Operation[]>({
    queryKey: ['/api/operations'],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
  });

  // Fetch dashboards from UI Designer
  const { data: availableDashboards = [] } = useQuery<any[]>({
    queryKey: ['/api/dashboard-configs'],
  });

  // Calculate metrics from available data
  const metrics = {
    utilization: Math.round((operations.filter(op => op.status === 'In Progress').length / Math.max(operations.length, 1)) * 100),
    onTimeDelivery: operations.filter(op => op.status === 'Completed').length / Math.max(operations.length, 1)
  };

  // Check if current display should be active based on schedule
  const isDisplayActiveBySchedule = (display: VisualFactoryDisplay) => {
    if (!display.schedule?.isScheduled) return true;
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = display.schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = display.schedule.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    const isDayActive = display.schedule.daysOfWeek.includes(currentDay);
    const isTimeActive = currentTime >= startTime && currentTime <= endTime;
    
    return isDayActive && isTimeActive;
  };

  // Effect to auto-select displays based on schedule
  useEffect(() => {
    const checkSchedule = () => {
      const activeScheduledDisplay = displays.find(display => 
        display.schedule?.isScheduled && 
        isDisplayActiveBySchedule(display) && 
        display.isActive
      );
      
      if (activeScheduledDisplay && currentDisplay?.id !== activeScheduledDisplay.id) {
        setCurrentDisplay(activeScheduledDisplay);
      }
    };
    
    // Check every minute for schedule changes
    const scheduleInterval = setInterval(checkSchedule, 60000);
    checkSchedule(); // Check immediately
    
    return () => clearInterval(scheduleInterval);
  }, [displays, currentDisplay]);

  // Display Management Mutations
  const createDisplayMutation = useMutation({
    mutationFn: async (display: any) => {
      const response = await apiRequest('POST', '/api/visual-factory/displays', display);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visual-factory/displays'] });
      setConfigDialogOpen(false);
      setEditingDisplay(null);
    }
  });

  const updateDisplayMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & any) => {
      const response = await apiRequest('PUT', `/api/visual-factory/displays/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visual-factory/displays'] });
      setConfigDialogOpen(false);
      setEditingDisplay(null);
    }
  });

  // Auto-rotation effect (handles both widgets and dashboards)
  useEffect(() => {
    if (isPlaying && currentDisplay) {
      // Handle dashboard rotation
      if (currentDisplay.useDashboardRotation && currentDisplay.dashboardSequence.length > 1) {
        const currentDashboardItem = currentDisplay.dashboardSequence[currentDashboardIndex];
        const interval = currentDashboardItem.displayDuration * 1000;
        setTimeRemaining(currentDashboardItem.displayDuration);
        
        intervalRef.current = setInterval(() => {
          setCurrentDashboardIndex(prev => (prev + 1) % currentDisplay.dashboardSequence.length);
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
      // Handle widget rotation (existing behavior)
      else if (!currentDisplay.useDashboardRotation && currentDisplay.widgets.length > 1) {
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
    }
  }, [isPlaying, currentDisplay, currentWidgetIndex, currentDashboardIndex]);

  // Filter displays by schedule activity
  const activeDisplays = displays.filter(display => 
    !display.schedule?.isScheduled || isDisplayActiveBySchedule(display)
  );
  
  const scheduledDisplays = displays.filter(display => 
    display.schedule?.isScheduled
  );

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
    setIsPlaying(false);
    setCurrentWidgetIndex(0);
    setCurrentDashboardIndex(0);
    setTimeRemaining(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
                      {operation.description || 'Production Operation'}
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
  
  // Dashboard Rotation Configuration Component
  const DashboardRotationConfig = ({ 
    availableDashboards, 
    selectedDashboards, 
    onSequenceChange, 
    onSave 
  }: {
    availableDashboards: Dashboard[];
    selectedDashboards: DashboardSequenceItem[];
    onSequenceChange: (sequence: DashboardSequenceItem[]) => void;
    onSave: (sequence: DashboardSequenceItem[]) => void;
  }) => {
    const addDashboard = (dashboardId: number) => {
      const newItem: DashboardSequenceItem = {
        dashboardId,
        displayDuration: 30, // Default 30 seconds
        transitionEffect: 'fade'
      };
      onSequenceChange([...selectedDashboards, newItem]);
    };

    const removeDashboard = (index: number) => {
      const newSequence = selectedDashboards.filter((_, i) => i !== index);
      onSequenceChange(newSequence);
    };

    const updateDashboard = (index: number, updates: Partial<DashboardSequenceItem>) => {
      const newSequence = selectedDashboards.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      );
      onSequenceChange(newSequence);
    };

    const moveUp = (index: number) => {
      if (index === 0) return;
      const newSequence = [...selectedDashboards];
      [newSequence[index], newSequence[index - 1]] = [newSequence[index - 1], newSequence[index]];
      onSequenceChange(newSequence);
    };

    const moveDown = (index: number) => {
      if (index === selectedDashboards.length - 1) return;
      const newSequence = [...selectedDashboards];
      [newSequence[index], newSequence[index + 1]] = [newSequence[index + 1], newSequence[index]];
      onSequenceChange(newSequence);
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Available Dashboards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableDashboards.map((dashboard) => (
              <Card key={dashboard.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => addDashboard(dashboard.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{dashboard.name}</h4>
                    {dashboard.description && (
                      <p className="text-xs text-gray-500 mt-1">{dashboard.description}</p>
                    )}
                  </div>
                  <PlusIcon className="w-4 h-4 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Rotation Sequence</h3>
          {selectedDashboards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ArrowUpDown className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No dashboards selected for rotation</p>
              <p className="text-sm">Click on dashboards above to add them to the sequence</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDashboards.map((item, index) => {
                const dashboard = availableDashboards.find(d => d.id === item.dashboardId);
                return (
                  <Card key={`${item.dashboardId}-${index}`} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-bold text-gray-400 min-w-[2rem]">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{dashboard?.name}</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Duration:</Label>
                            <Input
                              type="number"
                              min="5"
                              max="300"
                              value={item.displayDuration}
                              onChange={(e) => updateDashboard(index, { 
                                displayDuration: parseInt(e.target.value) || 30 
                              })}
                              className="w-20"
                            />
                            <span className="text-sm text-gray-500">seconds</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Effect:</Label>
                            <Select 
                              value={item.transitionEffect} 
                              onValueChange={(value: 'fade' | 'slide' | 'none') => 
                                updateDashboard(index, { transitionEffect: value })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fade">Fade</SelectItem>
                                <SelectItem value="slide">Slide</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => moveDown(index)}
                          disabled={index === selectedDashboards.length - 1}
                        >
                          ↓
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeDashboard(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onSequenceChange([])}>
            Clear All
          </Button>
          <Button 
            onClick={() => onSave(selectedDashboards)}
            disabled={selectedDashboards.length === 0}
          >
            Save Rotation Sequence
          </Button>
        </div>
      </div>
    );
  };

  // Dashboard Renderer Component
  const DashboardRenderer = ({ dashboardId }: { dashboardId: number }) => {
    const dashboard = availableDashboards.find(d => d.id === dashboardId);
    
    if (!dashboard) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Dashboard Not Found</h3>
            <p>The selected dashboard could not be loaded.</p>
          </div>
        </div>
      );
    }

    // Extract widgets from dashboard configuration
    const standardWidgets = dashboard.configuration?.standardWidgets || [];
    const customWidgets = dashboard.configuration?.customWidgets || [];
    const allWidgets = [...standardWidgets, ...customWidgets];

    // Render individual widget
    const renderWidget = (widget: any) => {
      const widgetConfig = widget.config || {};
      const widgetType = widgetConfig.widgetType || widget.type;
      
      return (
        <Card key={widget.id} className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Render different widget types */}
            {widgetType === 'schedule-optimization' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Current Algorithm</span>
                  <Badge variant="outline" className="text-xs">ASAP</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Next Run</span>
                  <span className="text-xs">15:30</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '73%' }}></div>
                </div>
                <div className="text-xs text-gray-600">73% efficiency</div>
              </div>
            )}
            
            {widgetType === 'schedule-tradeoff-analyzer' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">92%</div>
                    <div className="text-xs text-gray-600">On-Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">€15K</div>
                    <div className="text-xs text-gray-600">Cost</div>
                  </div>
                </div>
                <div className="text-xs text-center text-gray-600">
                  3 conflicts detected
                </div>
              </div>
            )}
            
            {widgetType === 'production-kpi' && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-center">
                    <div className="text-sm font-bold">{jobs.length}</div>
                    <div className="text-xs text-gray-600">Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">{metrics.utilization}%</div>
                    <div className="text-xs text-gray-600">Util</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-orange-600">{metrics.overdueOperations}</div>
                    <div className="text-xs text-gray-600">Late</div>
                  </div>
                </div>
              </div>
            )}
            
            {widgetType === 'resource-utilization' && (
              <div className="space-y-1">
                {resources.slice(0, 3).map((resource: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs truncate">{resource.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-8 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full" 
                          style={{ width: `${Math.random() * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs w-8">{Math.floor(Math.random() * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Default widget display */}
            {!['schedule-optimization', 'schedule-tradeoff-analyzer', 'production-kpi', 'resource-utilization'].includes(widgetType) && (
              <div className="flex items-center justify-center h-20 bg-gray-50 rounded">
                <div className="text-center">
                  <BarChart3 className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                  <div className="text-xs text-gray-500">{widgetType || 'Widget'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="flex-1 p-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">{dashboard.name}</h2>
          {dashboard.description && (
            <p className="text-sm text-gray-600 mt-1">{dashboard.description}</p>
          )}
        </div>
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-[400px]">
          {allWidgets.length > 0 ? (
            allWidgets.map(renderWidget)
          ) : (
            <div className="col-span-full flex items-center justify-center bg-gray-50 rounded-lg p-8">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Widgets</h3>
                <p className="text-gray-500">This dashboard doesn't have any widgets configured yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div ref={containerRef} className={`${isFullscreen ? 'h-screen' : 'h-auto'} bg-white`}>
        {/* Header - Hidden in fullscreen */}
        {!isFullscreen && (
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6 py-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className={`${isMaxOpen ? 'md:ml-0' : 'md:ml-12'} ml-12`}>
                  <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
                    <Monitor className="w-6 h-6 mr-2" />
                    Visual Factory
                  </h1>
                  <p className="text-sm md:text-base text-gray-600">Automated large screen displays for manufacturing facilities</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                  {/* Dashboard Rotation Configuration Button */}
                  <Dialog open={dashboardRotationDialogOpen} onOpenChange={setDashboardRotationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="hidden sm:inline">Dashboard Rotation</span>
                        <span className="sm:hidden">Rotation</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Dashboard Rotation Configuration</DialogTitle>
                      </DialogHeader>
                      <DashboardRotationConfig
                        availableDashboards={availableDashboards}
                        selectedDashboards={selectedDashboards}
                        onSequenceChange={setSelectedDashboards}
                        onSave={(sequence) => {
                          // Update current display with dashboard rotation
                          if (currentDisplay) {
                            updateDisplayMutation.mutate({
                              id: currentDisplay.id,
                              useDashboardRotation: true,
                              dashboardSequence: sequence
                            });
                          }
                          setDashboardRotationDialogOpen(false);
                          toast({
                            title: "Dashboard Rotation Saved",
                            description: `Configured rotation sequence with ${sequence.length} dashboards.`
                          });
                        }}
                      />
                    </DialogContent>
                  </Dialog>

                  <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm" size="sm">
                        <PlusIcon className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">New Display</span>
                        <span className="sm:hidden">New Display</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                      <div className="sticky top-0 bg-white p-6 border-b z-10">
                        <DialogHeader>
                          <DialogTitle>
                            {editingDisplay ? 'Edit Display Configuration' : 'Create New Display Configuration'}
                          </DialogTitle>
                        </DialogHeader>
                      </div>
                      <div className="p-6">
                      <CreateDisplayForm
                        onSubmit={(data) => {
                          if (editingDisplay) {
                            updateDisplayMutation.mutate({ id: editingDisplay.id, ...data });
                          } else {
                            createDisplayMutation.mutate(data);
                          }
                        }}
                        availableDashboards={availableDashboards}
                        isLoading={createDisplayMutation.isPending || updateDisplayMutation.isPending}
                        initialData={editingDisplay}
                        onCancel={() => {
                          setConfigDialogOpen(false);
                          setEditingDisplay(null);
                        }}
                      />
                      </div>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDisplay(display);
                            setConfigDialogOpen(true);
                          }}
                          className="h-6 w-6 p-1"
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{display.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{display.location}</span>
                      <span>
                        {display.useDashboardRotation 
                          ? `${display.dashboardSequence?.length || 0} dashboards`
                          : `${display.widgets.length} widgets`
                        }
                      </span>
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
                {currentDisplay.useDashboardRotation 
                  ? `${currentDisplay.name} • Dashboard ${currentDashboardIndex + 1} of ${currentDisplay.dashboardSequence.length}`
                  : `${currentDisplay.name} • Widget ${currentWidgetIndex + 1} of ${currentDisplay.widgets.length}`
                }
              </div>
            )}
          </div>
        )}

        {/* Main Display Area */}
        <div className={`${isFullscreen ? 'h-screen p-4 sm:p-8' : 'p-3 sm:p-6'} bg-gray-50`}>
          {currentDisplay ? (
            <div className={`${isFullscreen ? 'h-full' : 'h-80 sm:h-96'}`}>
              {/* Dashboard Rotation Mode */}
              {currentDisplay.useDashboardRotation && currentDisplay.dashboardSequence.length > 0 ? (
                <div className={`h-full ${
                  currentDisplay.dashboardSequence[currentDashboardIndex]?.transitionEffect === 'fade' 
                    ? 'transition-opacity duration-500' 
                    : currentDisplay.dashboardSequence[currentDashboardIndex]?.transitionEffect === 'slide'
                    ? 'transition-transform duration-500' 
                    : ''
                }`}>
                  <DashboardRenderer 
                    dashboardId={currentDisplay.dashboardSequence[currentDashboardIndex].dashboardId} 
                  />
                  {isPlaying && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {Math.ceil(timeRemaining)}s
                    </div>
                  )}
                </div>
              )
              /* Widget Rotation Mode */
              : currentWidget ? (
                <div className="h-full">
                  {renderWidget(currentWidget)}
                </div>
              )
              /* No Content Mode */
              : (
                <div className="h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center px-4">
                    <ArrowUpDown className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Content Configured</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Configure dashboard rotation or add widgets to this display
                    </p>
                  </div>
                </div>
              )}
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
  availableDashboards,
  isLoading,
  initialData,
  onCancel
}: { 
  onSubmit: (display: any) => void;
  availableDashboards: any[];
  isLoading: boolean;
  initialData?: any;
  onCancel?: () => void;
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    audience: initialData?.audience || 'general' as const,
    autoRotationInterval: initialData?.autoRotationInterval || 30,
    isActive: initialData?.isActive ?? true,
    useAiMode: initialData?.useAiMode || false,
    useDashboardRotation: initialData?.useDashboardRotation || false,
    dashboardSequence: initialData?.dashboardSequence || [] as DashboardSequenceItem[],
    schedule: {
      startTime: initialData?.scheduleStartTime || '07:00',
      endTime: initialData?.scheduleEndTime || '17:00',
      daysOfWeek: initialData?.scheduleDaysOfWeek || [1, 2, 3, 4, 5],
      isScheduled: initialData?.scheduleEnabled || false
    }
  });
  
  const [selectedDashboards, setSelectedDashboards] = useState<number[]>(
    initialData?.dashboardSequence?.map((item: any) => item.dashboardId) || []
  );
  const [showScheduling, setShowScheduling] = useState(initialData?.scheduleEnabled || false);
  
  // Debug logging
  console.log('CreateDisplayForm - availableDashboards:', availableDashboards);
  console.log('CreateDisplayForm - availableDashboards.length:', availableDashboards.length);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create dashboard sequence from selected dashboards
    const dashboardSequence = selectedDashboards.map(dashboardId => ({
      dashboardId,
      displayDuration: 30,
      transitionEffect: 'fade' as const
    }));
    
    onSubmit({
      ...formData,
      useDashboardRotation: selectedDashboards.length > 0,
      dashboardSequence,
      widgets: selectedDashboards.length > 0 ? [] : defaultWidgets.map((widget, index) => ({
        ...widget,
        id: `widget-${index}`
      }))
    });
  };

  const toggleDashboard = (dashboardId: number) => {
    setSelectedDashboards(prev => 
      prev.includes(dashboardId) 
        ? prev.filter(id => id !== dashboardId)
        : [...prev, dashboardId]
    );
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        daysOfWeek: prev.schedule.daysOfWeek.includes(day)
          ? prev.schedule.daysOfWeek.filter(d => d !== day)
          : [...prev.schedule.daysOfWeek, day].sort()
      }
    }));
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
          <Label htmlFor="interval" className="text-sm">Default Duration (seconds)</Label>
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

      {/* Dashboard Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Dashboard Selection</h3>
        <p className="text-sm text-gray-600">Select dashboards to rotate through, or leave empty for widgets</p>
        <p className="text-xs text-blue-600">Available dashboards: {availableDashboards.length}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
          {availableDashboards.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p>No dashboards available.</p>
              <p className="text-xs mt-1">Create dashboards in UI Design Studio first.</p>
            </div>
          ) : (
            availableDashboards.map((dashboard) => (
            <Card 
              key={dashboard.id} 
              className={`cursor-pointer transition-all ${
                selectedDashboards.includes(dashboard.id) 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => toggleDashboard(dashboard.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{dashboard.name}</h4>
                    {dashboard.description && (
                      <p className="text-xs text-gray-500 mt-1">{dashboard.description}</p>
                    )}
                  </div>
                  {selectedDashboards.includes(dashboard.id) && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Scheduling Options */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="enableScheduling"
            checked={showScheduling}
            onCheckedChange={(checked) => {
              setShowScheduling(checked === true);
              setFormData(prev => ({
                ...prev,
                schedule: { ...prev.schedule, isScheduled: checked === true }
              }));
            }}
          />
          <Label htmlFor="enableScheduling" className="text-sm font-medium">Enable Time Schedule</Label>
        </div>
        
        {showScheduling && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-sm">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.schedule.startTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, startTime: e.target.value }
                  }))}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-sm">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.schedule.endTime}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, endTime: e.target.value }
                  }))}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-sm">Active Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {daysOfWeek.map((day, index) => (
                  <Button
                    key={day}
                    type="button"
                    variant={formData.schedule.daysOfWeek.includes(index) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(index)}
                    className="text-xs"
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Mobile bottom spacing */}
      <div className="h-8 sm:h-4"></div>
      
      <div className="flex gap-3">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isLoading || !formData.name || !formData.location} 
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Display' : 'Create Display')}
        </Button>
      </div>
    </form>
  );
}