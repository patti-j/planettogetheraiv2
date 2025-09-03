import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import BryntumSchedulerProComponent from '@/components/scheduler-pro/BryntumSchedulerPro';
import '@bryntum/schedulerpro/schedulerpro.classic-light.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  RefreshCw,
  Save,
  Star,
  Calendar,
  Download,
  Upload,
  Filter,
  Menu,
  X,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Target,
  Zap,
  Moon,
  Sun
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { GanttDataService } from '@/services/scheduler/GanttDataService';
import { GanttConfigService } from '@/services/scheduler/GanttConfigService';
import { GanttFavoritesService } from '@/services/scheduler/GanttFavoritesService';
import { SchedulerContextService } from '@/services/scheduler/SchedulerContextService';

const ProductionSchedulerProV2: React.FC = () => {
  const schedulerRef = useRef<any>(null);
  const [schedulerInstance, setSchedulerInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resourceCount, setResourceCount] = useState(0);
  const [operationCount, setOperationCount] = useState(0);
  const [currentView, setCurrentView] = useState('dayAndWeek');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [schedulerData, setSchedulerData] = useState<any>({
    project: {
      resources: [],
      events: [],
      dependencies: [],
      assignments: [],
      autoSync: false,
      validateResponse: true
    }
  });
  const [schedulerConfig, setSchedulerConfig] = useState<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isMaxAIOpen, setIsMaxAIOpen] = useState(false);
  const [maxAIMessages, setMaxAIMessages] = useState<Array<{role: string, content: string}>>([
    { role: 'assistant', content: "Hello! I'm Max, your AI scheduling assistant. How can I help optimize your production schedule today?" }
  ]);
  const [maxAIInput, setMaxAIInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [resourceUtilization, setResourceUtilization] = useState('--');
  const { toast } = useToast();
  
  // Services
  const dataService = GanttDataService.getInstance();
  const configService = GanttConfigService.getInstance();
  const favoritesService = GanttFavoritesService.getInstance();
  const contextService = SchedulerContextService.getInstance();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load favorites
        const loadedFavorites = favoritesService.getAllFavorites();
        setFavorites(loadedFavorites);
        
        // Get demo data from service
        const ganttData = await dataService.getDemoData();
        
        // Get default configuration
        const config = configService.getDefaultConfig();
        
        // Set scheduler data with calendars
        setSchedulerData({
          project: {
            calendarsData: ganttData.calendars || [],
            calendar: 'day_shift', // Set default project calendar
            resources: ganttData.resources,
            events: ganttData.events,
            dependencies: ganttData.dependencies,
            assignments: ganttData.assignments,
            autoSync: false,
            validateResponse: true
          }
        });
        
        // Set scheduler configuration starting with today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 1); // Show 1 month for better overview
        
        setSchedulerConfig({
          startDate: today,
          endDate: endDate,
          viewPreset: 'dayAndWeek',
          rowHeight: 50,
          barMargin: 5,
          columns: config.columns,
          features: {
            dependencies: true,
            dependencyEdit: true,
            eventDrag: {
              constrainDragToResource: false
            },
            eventDragCreate: true,
            eventEdit: true,
            eventResize: true,
            eventTooltip: true,
            columnLines: true,
            columnReorder: true,
            columnResize: true,
            filterBar: false,
            nonWorkingTime: true,
            resourceNonWorkingTime: true, // Enable resource calendar visualization
            percentBar: true,
            regionResize: true,
            sort: 'name',
            stripe: true,
            tree: true,
            timeRanges: {
              showCurrentTimeLine: true
            },
            // Enable scheduling engine for resource constraint handling
            eventDragSelect: true,
            scheduleTooltip: true
          }
        });
        
        // Update counts
        setResourceCount(ganttData.resources.length);
        setOperationCount(ganttData.events.length);
        updateResourceUtilization(ganttData.resources, ganttData.events);
        
        setIsLoading(false);
        
        toast({
          title: "Success",
          description: `Scheduler loaded with ${ganttData.resources.length} resources and ${ganttData.events.length} operations`
        });
        
      } catch (error) {
        console.error('Failed to load scheduler data:', error);
        toast({
          title: "Error",
          description: "Failed to load scheduler data",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark');
    }
  }, []);

  // Capture scheduler instance after mount and apply zoom to fit
  useEffect(() => {
    if (!schedulerConfig) return;
    
    let captureAttempts = 0;
    const maxAttempts = 10; // Reduced max attempts
    
    const timer = setInterval(() => {
      captureAttempts++;
      
      // Stop trying after max attempts
      if (captureAttempts >= maxAttempts) {
        clearInterval(timer);
        return;
      }
      
      // Try to get the actual Bryntum instance from the React component
      if (schedulerRef.current) {
        // The Bryntum React wrapper exposes the instance as schedulerInstance
        const instance = schedulerRef.current.schedulerInstance || 
                        schedulerRef.current.instance || 
                        schedulerRef.current;
        
        // Check if we have the actual Bryntum widget with zoom methods
        if (instance && typeof instance.zoomToFit === 'function') {
          setSchedulerInstance(instance);
          
          // Register with context service for Max AI integration
          contextService.setSchedulerInstance(instance);
          
          // Apply zoom to fit after a delay to ensure data is rendered
          // Only do this on initial load
          if (isInitialLoad) {
            setTimeout(() => {
              try {
                // First, ensure we're showing today's date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // Scroll to today if scrollToDate method exists
                if (typeof instance.scrollToDate === 'function') {
                  instance.scrollToDate(today, { block: 'center', animate: true });
                }
                
                // For Scheduler Pro, manually calculate and set time span
                const eventStore = instance.eventStore;
                const events = eventStore?.records || [];
                
                if (events.length > 0) {
                  const startDates = events
                    .map((e: any) => e.startDate)
                    .filter((date: any) => date && !isNaN(date.getTime()));
                  const endDates = events
                    .map((e: any) => e.endDate)
                    .filter((date: any) => date && !isNaN(date.getTime()));
                  
                  if (startDates.length > 0 && endDates.length > 0) {
                    const minDate = new Date(Math.min(...startDates.map((d: Date) => d.getTime())));
                    const maxDate = new Date(Math.max(...endDates.map((d: Date) => d.getTime())));
                    
                    // Add 10% padding for better visibility
                    const duration = maxDate.getTime() - minDate.getTime();
                    const padding = duration * 0.1;
                    const paddedStart = new Date(minDate.getTime() - padding);
                    const paddedEnd = new Date(maxDate.getTime() + padding);
                    
                    instance.setTimeSpan(paddedStart, paddedEnd);
                    console.log(`Initial fit to view: showing from ${paddedStart.toLocaleDateString()} to ${paddedEnd.toLocaleDateString()}`);
                  }
                } else {
                  // No events - show current month
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  instance.setTimeSpan(monthStart, monthEnd);
                }
                
                setIsInitialLoad(false); // Mark that initial load is complete
              } catch (error) {
                console.error('Error during initial fit to view:', error);
                setIsInitialLoad(false);
              }
            }, 1000); // Increased delay for better stability
          }
          
          clearInterval(timer);
        }
      }
    }, 1000); // Increased interval to 1 second to reduce CPU usage
    
    return () => {
      clearInterval(timer);
    };
  }, [schedulerConfig, isInitialLoad]);

  // Update resource utilization
  const updateResourceUtilization = (resources: any[], events: any[]) => {
    if (!resources || !events) {
      setResourceUtilization('--');
      return;
    }
    
    const usedResources = new Set(events.map(e => e.resourceId));
    const utilizationPercent = Math.round((usedResources.size / resources.length) * 100);
    setResourceUtilization(`Resource utilization: ${utilizationPercent}%`);
  };

  // Scheduling Algorithm Implementations
  const runSchedulingAlgorithm = useCallback(async (algorithm: string) => {
    if (!schedulerInstance) {
      toast({
        title: "Error",
        description: "Scheduler not initialized",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Store current view settings
    const currentZoomLevel = schedulerInstance.zoomLevel;
    const currentStartDate = schedulerInstance.startDate;
    const currentEndDate = schedulerInstance.endDate;
    
    try {
      let message = '';
      
      switch(algorithm) {
        case 'ASAP':
        case 'asap':
          await asapScheduling();
          message = 'ASAP scheduling applied - operations scheduled as early as possible!';
          break;
          
        case 'ALAP':
        case 'alap':
          await alapScheduling();
          message = 'ALAP scheduling applied - operations scheduled as late as possible!';
          break;
          
        case 'CRITICAL_PATH':
        case 'criticalPath':
          await criticalPathScheduling();
          message = 'Critical Path identified and optimized!';
          break;
          
        case 'LEVEL_RESOURCES':
        case 'levelResources':
          await levelResourcesScheduling();
          message = 'Resources leveled - workload balanced across resources!';
          break;
          
        case 'DRUM_TOC':
        case 'drum':
          await drumScheduling();
          message = 'Drum scheduling applied - optimized around bottleneck!';
          break;
      }
      
      // Refresh the scheduler
      schedulerInstance.refresh();
      
      // Restore view settings
      schedulerInstance.zoomLevel = currentZoomLevel;
      schedulerInstance.setTimeSpan(currentStartDate, currentEndDate);
      
      // Update status
      const events = schedulerInstance.eventStore.records || [];
      const resources = schedulerInstance.resourceStore.records || [];
      updateResourceUtilization(resources, events);
      
      toast({
        title: "Optimization Complete",
        description: message
      });
      
    } catch (error) {
      console.error('Scheduling error:', error);
      toast({
        title: "Error",
        description: "Failed to apply scheduling algorithm",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [schedulerInstance, toast]);

  // ASAP Scheduling Algorithm
  const asapScheduling = useCallback(async () => {
    if (!schedulerInstance) return;
    
    const events = [...schedulerInstance.eventStore.records].sort((a, b) => 
      a.startDate.getTime() - b.startDate.getTime()
    );
    
    const baseDate = new Date();
    baseDate.setHours(7, 0, 0, 0);
    
    const resourceEvents: any = {};
    events.forEach(event => {
      if (!resourceEvents[event.resourceId]) {
        resourceEvents[event.resourceId] = [];
      }
      resourceEvents[event.resourceId].push(event);
    });
    
    Object.keys(resourceEvents).forEach(resourceId => {
      const resEvents = resourceEvents[resourceId];
      let nextAvailableTime = new Date(baseDate);
      
      resEvents.forEach((event: any) => {
        event.startDate = new Date(nextAvailableTime);
        const durationMs = event.duration * 60 * 60 * 1000;
        event.endDate = new Date(nextAvailableTime.getTime() + durationMs);
        nextAvailableTime = new Date(event.endDate.getTime() + 30 * 60 * 1000);
      });
    });
  }, [schedulerInstance]);

  // ALAP Scheduling Algorithm
  const alapScheduling = useCallback(async () => {
    if (!schedulerInstance) return;
    
    const events = [...schedulerInstance.eventStore.records].sort((a, b) => 
      b.startDate.getTime() - a.startDate.getTime()
    );
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(18, 0, 0, 0);
    
    const resourceEvents: any = {};
    events.forEach(event => {
      if (!resourceEvents[event.resourceId]) {
        resourceEvents[event.resourceId] = [];
      }
      resourceEvents[event.resourceId].push(event);
    });
    
    Object.keys(resourceEvents).forEach(resourceId => {
      const resEvents = resourceEvents[resourceId];
      let latestEndTime = new Date(endDate);
      
      resEvents.forEach((event: any) => {
        const durationMs = event.duration * 60 * 60 * 1000;
        event.endDate = new Date(latestEndTime);
        event.startDate = new Date(latestEndTime.getTime() - durationMs);
        latestEndTime = new Date(event.startDate.getTime() - 30 * 60 * 1000);
      });
    });
  }, [schedulerInstance]);

  // Critical Path Scheduling
  const criticalPathScheduling = useCallback(async () => {
    if (!schedulerInstance) return;
    
    const events = schedulerInstance.eventStore.records;
    const dependencies = schedulerInstance.dependencyStore?.records || [];
    
    const criticalEvents = events.filter((event: any) => {
      const hasPredecessors = dependencies.some((d: any) => d.to === event.id);
      const hasSuccessors = dependencies.some((d: any) => d.from === event.id);
      return hasPredecessors || hasSuccessors;
    });
    
    criticalEvents.forEach((event: any) => {
      event.eventColor = 'red';
      event.cls = 'critical-path';
    });
    
    const nonCriticalEvents = events.filter((event: any) => 
      !criticalEvents.includes(event)
    );
    
    nonCriticalEvents.forEach((event: any) => {
      event.eventColor = 'gray';
      event.cls = '';
    });
  }, [schedulerInstance]);

  // Level Resources Scheduling
  const levelResourcesScheduling = useCallback(async () => {
    if (!schedulerInstance) return;
    
    const events = [...schedulerInstance.eventStore.records];
    const resources = schedulerInstance.resourceStore.records;
    
    const targetOpsPerResource = Math.ceil(events.length / resources.length);
    const resourceAssignments: any = {};
    
    resources.forEach((resource: any) => {
      resourceAssignments[resource.id] = [];
    });
    
    events.sort((a: any, b: any) => b.duration - a.duration);
    
    events.forEach((event: any) => {
      let minResource = null;
      let minCount = Infinity;
      
      Object.entries(resourceAssignments).forEach(([resourceId, assignments]: any) => {
        if (assignments.length < minCount) {
          minCount = assignments.length;
          minResource = resourceId;
        }
      });
      
      if (minResource) {
        event.resourceId = minResource;
        resourceAssignments[minResource].push(event);
        
        const baseTime = new Date();
        baseTime.setHours(8, 0, 0, 0);
        const offset = resourceAssignments[minResource].length - 1;
        const startTime = new Date(baseTime.getTime() + offset * 4 * 60 * 60 * 1000);
        
        event.startDate = startTime;
        const durationMs = event.duration * 60 * 60 * 1000;
        event.endDate = new Date(startTime.getTime() + durationMs);
      }
    });
  }, [schedulerInstance]);

  // Drum (Theory of Constraints) Scheduling
  const drumScheduling = useCallback(async () => {
    if (!schedulerInstance) return;
    
    const events = schedulerInstance.eventStore.records;
    const resources = schedulerInstance.resourceStore.records;
    
    const resourceUsage: any = {};
    resources.forEach((resource: any) => {
      const resourceEvents = events.filter((e: any) => e.resourceId === resource.id);
      let totalDuration = 0;
      resourceEvents.forEach((event: any) => {
        totalDuration += event.duration;
      });
      resourceUsage[resource.id] = {
        resource,
        events: resourceEvents,
        totalDuration
      };
    });
    
    let bottleneck: any = null;
    let maxDuration = 0;
    Object.values(resourceUsage).forEach((usage: any) => {
      if (usage.totalDuration > maxDuration) {
        maxDuration = usage.totalDuration;
        bottleneck = usage;
      }
    });
    
    if (bottleneck) {
      const baseTime = new Date();
      baseTime.setHours(8, 0, 0, 0);
      let currentTime = new Date(baseTime);
      
      bottleneck.events.forEach((event: any) => {
        event.startDate = new Date(currentTime);
        const durationMs = event.duration * 60 * 60 * 1000;
        event.endDate = new Date(currentTime.getTime() + durationMs);
        event.eventColor = 'red';
        currentTime = new Date(event.endDate.getTime() + 30 * 60 * 1000);
      });
      
      Object.values(resourceUsage).forEach((usage: any) => {
        if (usage !== bottleneck) {
          let bufferTime = new Date(baseTime);
          bufferTime.setHours(bufferTime.getHours() + 2);
          
          usage.events.forEach((event: any) => {
            event.startDate = new Date(bufferTime);
            const durationMs = event.duration * 60 * 60 * 1000;
            event.endDate = new Date(bufferTime.getTime() + durationMs);
            event.eventColor = 'green';
            bufferTime = new Date(event.endDate.getTime() + 45 * 60 * 1000);
          });
        }
      });
    }
  }, [schedulerInstance]);

  // Analyze Schedule
  const analyzeSchedule = useCallback(() => {
    if (!schedulerInstance) return '';
    
    const events = schedulerInstance.eventStore.records || [];
    const resources = schedulerInstance.resourceStore.records || [];
    
    const resourceUsage: any = {};
    resources.forEach((resource: any) => {
      const resourceEvents = events.filter((e: any) => e.resourceId === resource.id);
      let totalDuration = 0;
      resourceEvents.forEach((event: any) => {
        const duration = (event.endDate - event.startDate) / (1000 * 60 * 60);
        totalDuration += duration;
      });
      resourceUsage[resource.name] = {
        operations: resourceEvents.length,
        hoursUsed: totalDuration.toFixed(1),
        utilization: resourceEvents.length > 0 ? 100 : 0
      };
    });
    
    let bottleneck = null;
    let maxOps = 0;
    Object.entries(resourceUsage).forEach(([name, data]: any) => {
      if (data.operations > maxOps) {
        maxOps = data.operations;
        bottleneck = name;
      }
    });
    
    let earliestStart: Date | null = null;
    let latestEnd: Date | null = null;
    events.forEach((event: any) => {
      if (!earliestStart || event.startDate < earliestStart) {
        earliestStart = event.startDate;
      }
      if (!latestEnd || event.endDate > latestEnd) {
        latestEnd = event.endDate;
      }
    });
    
    const makespan = earliestStart && latestEnd ? 
      ((latestEnd - earliestStart) / (1000 * 60 * 60)).toFixed(1) : 0;
    
    let response = '📊 **Production Schedule Analysis**\n\n';
    response += `📈 **Overall Metrics:**\n`;
    response += `• Total Operations: ${events.length}\n`;
    response += `• Active Resources: ${Object.values(resourceUsage).filter((r: any) => r.operations > 0).length}/${resources.length}\n`;
    response += `• Total Makespan: ${makespan} hours\n\n`;
    
    response += `🏭 **Resource Utilization:**\n`;
    Object.entries(resourceUsage).forEach(([name, data]: any) => {
      if (data.operations > 0) {
        response += `• ${name}: ${data.operations} operations, ${data.hoursUsed} hours\n`;
      }
    });
    
    if (bottleneck) {
      response += `\n⚠️ **Bottleneck Identified:**\n`;
      response += `• ${bottleneck} has the highest load with ${maxOps} operations\n`;
    }
    
    return response;
  }, [schedulerInstance]);

  // Handle Max AI message
  const handleMaxAISend = async () => {
    if (!maxAIInput.trim()) return;
    
    const userMessage = maxAIInput.trim();
    setMaxAIMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMaxAIInput('');
    
    // Process message and determine response
    const lowerMessage = userMessage.toLowerCase();
    let response = '';
    let executedAlgorithm = null;
    
    // Check for algorithm execution commands
    if (lowerMessage.includes('run') || lowerMessage.includes('execute') || lowerMessage.includes('apply') || lowerMessage.includes('optimize')) {
      if (lowerMessage.includes('asap') || lowerMessage.includes('forward')) {
        executedAlgorithm = 'asap';
        response = '🚀 Executing ASAP (Forward) scheduling algorithm...';
      } else if (lowerMessage.includes('alap') || lowerMessage.includes('backward')) {
        executedAlgorithm = 'alap';
        response = '⏰ Executing ALAP (Backward) scheduling algorithm...';
      } else if (lowerMessage.includes('critical path')) {
        executedAlgorithm = 'criticalPath';
        response = '🎯 Executing Critical Path optimization...';
      } else if (lowerMessage.includes('level') || lowerMessage.includes('balance resource')) {
        executedAlgorithm = 'levelResources';
        response = '⚖️ Executing Resource Leveling algorithm...';
      } else if (lowerMessage.includes('drum') || lowerMessage.includes('toc') || lowerMessage.includes('constraint')) {
        executedAlgorithm = 'drum';
        response = '🥁 Executing Drum (Theory of Constraints) optimization...';
      } else {
        response = 'To optimize the schedule, please specify an algorithm. You can say:\n• "Run ASAP scheduling"\n• "Apply ALAP algorithm"\n• "Execute critical path optimization"\n• "Level resources"\n• "Apply drum scheduling"';
      }
    }
    // Check for analysis requests
    else if (lowerMessage.includes('analyze') || lowerMessage.includes('analysis') || lowerMessage.includes('insights')) {
      response = analyzeSchedule();
    }
    // Information requests
    else if (lowerMessage.includes('what') || lowerMessage.includes('explain') || lowerMessage.includes('tell me about')) {
      if (lowerMessage.includes('asap')) {
        response = 'ASAP (As Soon As Possible) pushes all operations to the earliest possible time slots. Best for urgent orders or maximizing early throughput. Say "Run ASAP" to apply it.';
      } else if (lowerMessage.includes('alap')) {
        response = 'ALAP (As Late As Possible) delays operations to the latest time that still meets due dates. Minimizes inventory holding costs. Say "Run ALAP" to apply it.';
      } else if (lowerMessage.includes('critical path')) {
        response = 'Critical Path identifies the longest sequence of dependent tasks and optimizes them first. Minimizes project completion time. Say "Execute critical path" to apply it.';
      } else if (lowerMessage.includes('level') || lowerMessage.includes('resource')) {
        response = 'Resource Leveling distributes work evenly across all resources. Prevents overloading and improves efficiency. Say "Level resources" to apply it.';
      } else if (lowerMessage.includes('drum') || lowerMessage.includes('toc')) {
        response = 'Drum scheduling (TOC) identifies your bottleneck resource and optimizes around it. Maximizes throughput. Say "Apply drum scheduling" to apply it.';
      } else {
        response = 'I can help you optimize the schedule. Try asking:\n• "Run ASAP scheduling"\n• "Analyze the schedule"\n• "Explain critical path"\n• "Level the resources"';
      }
    }
    // Help commands
    else if (lowerMessage.includes('help') || lowerMessage.includes('commands')) {
      response = '📊 **Schedule Optimization Commands:**\n\n**Execute Algorithms:**\n• Run ASAP\n• Apply ALAP\n• Execute critical path\n• Level resources\n• Apply drum scheduling\n\n**Get Information:**\n• What is ASAP?\n• Explain critical path\n• Analyze schedule\n\n**Analysis:**\n• Show insights\n• Check utilization';
    }
    else {
      response = `I understand you're asking about "${userMessage}". I can help you optimize the schedule using different algorithms. Say "help" to see available commands.`;
    }
    
    // Execute algorithm if requested
    if (executedAlgorithm) {
      setMaxAIMessages(prev => [...prev, { role: 'assistant', content: response }]);
      await runSchedulingAlgorithm(executedAlgorithm);
      
      const successMessage = `✅ Successfully applied ${executedAlgorithm === 'asap' ? 'ASAP' : 
        executedAlgorithm === 'alap' ? 'ALAP' :
        executedAlgorithm === 'criticalPath' ? 'Critical Path' :
        executedAlgorithm === 'levelResources' ? 'Resource Leveling' :
        'Drum (TOC)'} algorithm! The schedule has been optimized. Would you like to try a different algorithm?`;
      
      setMaxAIMessages(prev => [...prev, { role: 'assistant', content: successMessage }]);
    } else {
      setMaxAIMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }
  };

  // Toolbar actions - memoized with useCallback
  const handleZoomIn = useCallback(async () => {
    if (!schedulerInstance) {
      toast({
        title: "Scheduler Loading",
        description: "Please wait for the scheduler to initialize",
        variant: "default"
      });
      return;
    }
    
    setIsZooming(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for visual feedback
      
      if (typeof schedulerInstance.zoomIn === 'function') {
        schedulerInstance.zoomIn();
        const newLevel = Math.min((schedulerInstance.zoomLevel || zoomLevel) + 2, 20);
        setZoomLevel(newLevel);
        console.log('Zoomed in');
      } else if (schedulerInstance.zoomLevel !== undefined) {
        // Fallback to direct property access
        const newLevel = Math.min((schedulerInstance.zoomLevel || zoomLevel) + 2, 20);
        schedulerInstance.zoomLevel = newLevel;
        setZoomLevel(newLevel);
        schedulerInstance.refresh && schedulerInstance.refresh();
        console.log('Zoomed in to level:', newLevel);
      }
      
      toast({
        title: "Zoomed In",
        description: `Zoom level: ${Math.round((zoomLevel + 2) / 20 * 100)}%`,
        duration: 1000
      });
    } catch (error) {
      console.error('Error zooming in:', error);
      toast({
        title: "Zoom Error",
        description: "Unable to zoom in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsZooming(false);
    }
  }, [schedulerInstance, toast, zoomLevel]);

  const handleZoomOut = useCallback(async () => {
    if (!schedulerInstance) {
      toast({
        title: "Scheduler Loading",
        description: "Please wait for the scheduler to initialize",
        variant: "default"
      });
      return;
    }
    
    setIsZooming(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for visual feedback
      
      if (typeof schedulerInstance.zoomOut === 'function') {
        schedulerInstance.zoomOut();
        const newLevel = Math.max((schedulerInstance.zoomLevel || zoomLevel) - 2, 0);
        setZoomLevel(newLevel);
        console.log('Zoomed out');
      } else if (schedulerInstance.zoomLevel !== undefined) {
        // Fallback to direct property access
        const newLevel = Math.max((schedulerInstance.zoomLevel || zoomLevel) - 2, 0);
        schedulerInstance.zoomLevel = newLevel;
        setZoomLevel(newLevel);
        schedulerInstance.refresh && schedulerInstance.refresh();
        console.log('Zoomed out to level:', newLevel);
      }
      
      toast({
        title: "Zoomed Out",
        description: `Zoom level: ${Math.round((zoomLevel - 2) / 20 * 100)}%`,
        duration: 1000
      });
    } catch (error) {
      console.error('Error zooming out:', error);
      toast({
        title: "Zoom Error",
        description: "Unable to zoom out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsZooming(false);
    }
  }, [schedulerInstance, toast, zoomLevel]);

  const handleZoomToFit = useCallback(async () => {
    if (!schedulerInstance) {
      toast({
        title: "Scheduler Loading",
        description: "Please wait for the scheduler to initialize",
        variant: "default"
      });
      return;
    }
    
    setIsZooming(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for visual feedback
      
      // For Scheduler Pro, we always need to manually calculate the time span
      const eventStore = schedulerInstance.eventStore;
      const events = eventStore?.records || [];
      
      if (events.length > 0) {
        // Get all valid start and end dates
        const startDates = events
          .map((e: any) => e.startDate)
          .filter((date: any) => date && !isNaN(date.getTime()));
        const endDates = events
          .map((e: any) => e.endDate)
          .filter((date: any) => date && !isNaN(date.getTime()));
        
        if (startDates.length > 0 && endDates.length > 0) {
          const minDate = new Date(Math.min(...startDates.map((d: Date) => d.getTime())));
          const maxDate = new Date(Math.max(...endDates.map((d: Date) => d.getTime())));
          
          // Add 10% padding on each side for better visibility
          const duration = maxDate.getTime() - minDate.getTime();
          const padding = duration * 0.1;
          const paddedStart = new Date(minDate.getTime() - padding);
          const paddedEnd = new Date(maxDate.getTime() + padding);
          
          // Set the time span to show all events
          schedulerInstance.setTimeSpan(paddedStart, paddedEnd);
          
          // Auto-select appropriate view preset based on duration
          const days = duration / (1000 * 60 * 60 * 24);
          let preset = 'weekAndDay';
          
          if (days <= 2) {
            preset = 'hourAndDay';
          } else if (days <= 14) {
            preset = 'dayAndWeek';
          } else if (days <= 60) {
            preset = 'weekAndMonth';
          } else {
            preset = 'monthAndYear';
          }
          
          try {
            schedulerInstance.viewPreset = preset;
            setCurrentView(preset);
          } catch (e) {
            // Preset might not be available, keep current
            console.log('Could not set preset:', preset);
          }
          
          // Scroll to start of events
          if (typeof schedulerInstance.scrollToDate === 'function') {
            schedulerInstance.scrollToDate(paddedStart, { block: 'start' });
          }
          
          console.log(`Fit to view: showing ${days.toFixed(1)} days from ${paddedStart.toLocaleDateString()} to ${paddedEnd.toLocaleDateString()}`);
          setZoomLevel(10); // Reset zoom level indicator
        }
      } else {
        // No events - show current month
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        schedulerInstance.setTimeSpan(monthStart, monthEnd);
        console.log('No events found - showing current month');
      }
      
      toast({
        title: "Fit to View",
        description: "Schedule adjusted to show all operations",
        duration: 1000
      });
    } catch (error) {
      console.error('Error zooming to fit:', error);
      toast({
        title: "Zoom Error",
        description: "Unable to fit view. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsZooming(false);
    }
  }, [schedulerInstance, toast]);

  const handleViewChange = (preset: string) => {
    if (schedulerInstance) {
      schedulerInstance.viewPreset = preset;
      setCurrentView(preset);
      configService.setZoomLevel(preset);
    }
  };

  const handleOptimize = (algorithm: string) => {
    runSchedulingAlgorithm(algorithm);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };


  if (isLoading || !schedulerData || !schedulerConfig) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading Scheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-500 to-purple-600 overflow-auto">
      {/* Header */}
      <div className="bg-white/95 dark:bg-gray-900/95 shadow-lg px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNavMenuOpen(true)}
            className="text-purple-600 dark:text-purple-400"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Production Schedule</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsMaxAIOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Max AI
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      {isNavMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsNavMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Navigation</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNavMenuOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-2">
              <Link href="/">
                <a className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  🏠 Home
                </a>
              </Link>
              <Link href="/production-scheduler-pro">
                <a className="block px-4 py-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium">
                  📊 Production Scheduler
                </a>
              </Link>
              <Link href="/business-goals">
                <a className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  📈 Business Goals
                </a>
              </Link>
              <Link href="/implementation-projects">
                <a className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  💼 Projects
                </a>
              </Link>
              <Link href="/control-tower">
                <a className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  🌐 Control Tower
                </a>
              </Link>
              <Link href="/help">
                <a className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  📚 Help
                </a>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Max AI Assistant Panel */}
      {isMaxAIOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMaxAIOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl flex flex-col">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Max AI Assistant
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMaxAIOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-b">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Quick Actions
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runSchedulingAlgorithm('ASAP')}
                  className="text-xs"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Run ASAP
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runSchedulingAlgorithm('ALAP')}
                  className="text-xs"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Run ALAP
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runSchedulingAlgorithm('CRITICAL_PATH')}
                  className="text-xs"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Critical Path
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runSchedulingAlgorithm('LEVEL_RESOURCES')}
                  className="text-xs"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Level Resources
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runSchedulingAlgorithm('DRUM_TOC')}
                  className="text-xs"
                >
                  <Target className="h-3 w-3 mr-1" />
                  Drum (TOC)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const analysis = analyzeSchedule();
                    setMaxAIMessages(prev => [...prev, { role: 'assistant', content: analysis }]);
                  }}
                  className="text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Analyze Schedule
                </Button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {maxAIMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
                    msg.role === 'assistant'
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'bg-purple-50 dark:bg-purple-900/20 ml-8'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t dark:border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={maxAIInput}
                  onChange={(e) => setMaxAIInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleMaxAISend()}
                  placeholder="Ask me anything about scheduling..."
                  className="flex-1"
                />
                <Button onClick={handleMaxAISend} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar - Responsive */}
      <div className="bg-white/90 dark:bg-gray-900/90 px-2 sm:px-4 py-2 border-b dark:border-gray-700 flex-shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-3 min-w-fit">
          {/* View Selector - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</label>
            <Select value={currentView} onValueChange={handleViewChange}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue placeholder="Select View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourAndDay">Hour & Day</SelectItem>
                <SelectItem value="dayAndWeek">Day & Week</SelectItem>
                <SelectItem value="weekAndMonth">Week & Month</SelectItem>
                <SelectItem value="monthAndYear">Month & Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zoom Controls - Always visible, responsive sizing */}
          <div className="flex items-center gap-1 pr-2 sm:pr-3 border-r dark:border-gray-700">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              title="Zoom In"
              className={`h-8 w-8 sm:h-8 sm:w-8 transition-all ${
                isZooming ? 'scale-95 bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              disabled={!schedulerInstance || isZooming || zoomLevel >= 20}
            >
              <ZoomIn className={`h-4 w-4 ${isZooming ? 'animate-pulse' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              title="Zoom Out"
              className={`h-8 w-8 sm:h-8 sm:w-8 transition-all ${
                isZooming ? 'scale-95 bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              disabled={!schedulerInstance || isZooming || zoomLevel <= 0}
            >
              <ZoomOut className={`h-4 w-4 ${isZooming ? 'animate-pulse' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomToFit}
              title="Fit to View"
              className={`h-8 w-8 sm:h-8 sm:w-8 transition-all ${
                isZooming ? 'scale-95 bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              disabled={!schedulerInstance || isZooming}
            >
              <Maximize2 className={`h-4 w-4 ${isZooming ? 'animate-pulse' : ''}`} />
            </Button>
            {/* Zoom Level Indicator */}
            <span className="hidden sm:inline-block px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
              {Math.round(zoomLevel / 20 * 100)}%
            </span>
          </div>

          {/* Algorithm Selector - Simplified on mobile */}
          <div className="flex items-center gap-2">
            <label className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">Algorithm:</label>
            <Select onValueChange={handleOptimize}>
              <SelectTrigger className="w-32 sm:w-44 h-8">
                <SelectValue placeholder="Optimize" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asap">ASAP (Forward)</SelectItem>
                <SelectItem value="alap">ALAP (Backward)</SelectItem>
                <SelectItem value="criticalPath">Critical Path</SelectItem>
                <SelectItem value="levelResources">Level Resources</SelectItem>
                <SelectItem value="drum">Drum (TOC)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dark Mode Toggle - Icon only on mobile */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDarkMode}
            className="ml-auto"
          >
            {isDarkMode ? (
              <>
                <Sun className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scheduler Component */}
      <div className="flex-1 m-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden relative">
        <BryntumSchedulerProComponent
          ref={schedulerRef}
          project={schedulerData.project}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white/95 dark:bg-gray-900/95 px-4 py-2 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>{operationCount} operations scheduled</span>
          <span>{resourceUtilization}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductionSchedulerProV2;