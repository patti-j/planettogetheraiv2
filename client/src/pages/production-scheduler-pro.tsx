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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { GanttDataService } from '@/services/scheduler/GanttDataService';
import { GanttConfigService } from '@/services/scheduler/GanttConfigService';
import { GanttFavoritesService } from '@/services/scheduler/GanttFavoritesService';
import { SchedulerContextService } from '@/services/scheduler/SchedulerContextService';
import { AlgorithmExecutionService } from '@/services/optimization/AlgorithmExecutionService';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Settings, Zap, Eye, EyeOff, Palette, Grid, Clock, Layers } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [resourceUtilization, setResourceUtilization] = useState('--');
  const [showAlgorithmDialog, setShowAlgorithmDialog] = useState(false);
  const [availableAlgorithms, setAvailableAlgorithms] = useState<any[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<any>(null);
  const [algorithmProfile, setAlgorithmProfile] = useState<any>(null);
  const [isExecutingAlgorithm, setIsExecutingAlgorithm] = useState(false);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  // Load display options from localStorage or use defaults
  const [displayOptions, setDisplayOptions] = useState(() => {
    const savedOptions = localStorage.getItem('scheduler-display-options');
    if (savedOptions) {
      try {
        return JSON.parse(savedOptions);
      } catch (e) {
        console.error('Failed to parse saved display options:', e);
      }
    }
    return {
      showWeekends: true,
      showNonWorkingTime: true,
      showResourceNames: true,
      showOperationDetails: true,
      showDependencies: true,
      showCriticalPath: false,
      showProgress: true,
      showTooltips: true,
      compactMode: false,
      colorBy: 'status', // 'status', 'resource', 'priority', 'job'
      timeFormat: '12h', // '12h' or '24h'
      gridLines: 'both', // 'none', 'horizontal', 'vertical', 'both'
      rowHeight: 'normal', // 'compact', 'normal', 'comfortable'
      highlightCurrentTime: true,
      showBaselines: false,
      showConstraints: true
    };
  });
  
  // Save display options to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('scheduler-display-options', JSON.stringify(displayOptions));
  }, [displayOptions]);
  const { toast } = useToast();
  
  // Services
  const dataService = GanttDataService.getInstance();
  const configService = GanttConfigService.getInstance();
  const favoritesService = GanttFavoritesService.getInstance();
  const contextService = SchedulerContextService.getInstance();
  const algorithmService = AlgorithmExecutionService.getInstance();

  // Load available algorithms
  useEffect(() => {
    const loadAlgorithms = async () => {
      try {
        const [standard, custom] = await Promise.all([
          algorithmService.getStandardAlgorithms(),
          algorithmService.getAvailableAlgorithms()
        ]);
        
        // Combine and filter approved algorithms
        const allAlgorithms = [...standard, ...custom].filter(algo => 
          algo.status === 'approved' || algo.status === 'deployed' || algo.isStandard
        );
        
        setAvailableAlgorithms(allAlgorithms);
      } catch (error) {
        console.error('Failed to load algorithms:', error);
      }
    };
    
    loadAlgorithms();
  }, []);

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
        
        // Set scheduler configuration starting with today's date (September 3, 2025)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 14); // Show 2 weeks to match demo operations
        
        // Calculate row height based on display options
        const rowHeightMap = {
          compact: 35,
          normal: 50,
          comfortable: 65
        };
        
        setSchedulerConfig({
          startDate: today,
          endDate: endDate,
          viewPreset: 'weekAndMonth',
          rowHeight: rowHeightMap[displayOptions.rowHeight],
          barMargin: displayOptions.compactMode ? 2 : 5,
          columns: config.columns,
          weekendsEnabled: displayOptions.showWeekends,
          features: {
            dependencies: {
              disabled: !displayOptions.showDependencies
            },
            dependencyEdit: true,
            eventDrag: {
              constrainDragToResource: false
            },
            eventDragCreate: true,
            eventEdit: true,
            eventResize: true,
            eventTooltip: {
              disabled: !displayOptions.showTooltips
            },
            columnLines: displayOptions.gridLines === 'vertical' || displayOptions.gridLines === 'both',
            columnReorder: true,
            columnResize: true,
            filterBar: false,
            nonWorkingTime: displayOptions.showNonWorkingTime,
            resourceNonWorkingTime: displayOptions.showNonWorkingTime, // Enable resource calendar visualization
            percentBar: displayOptions.showProgress,
            regionResize: true,
            sort: 'name',
            stripe: displayOptions.gridLines === 'horizontal' || displayOptions.gridLines === 'both',
            tree: true,
            timeRanges: {
              showCurrentTimeLine: displayOptions.highlightCurrentTime
            },
            // Enable scheduling engine for resource constraint handling
            eventDragSelect: true,
            scheduleTooltip: displayOptions.showTooltips,
            criticalPaths: {
              disabled: !displayOptions.showCriticalPath
            }
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
  }, [displayOptions]); // Re-apply config when display options change


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
          
          // Register scheduling algorithms with context service
          contextService.setSchedulingAlgorithms({
            'ASAP': asapScheduling,
            'ALAP': alapScheduling,
            'CRITICAL_PATH': criticalPathScheduling,
            'LEVEL_RESOURCES': levelResourcesScheduling,
            'DRUM_TOC': drumScheduling
          });
          
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
                    
                    // Add small padding for better visibility (2 days on each side)
                    const paddedStart = new Date(minDate);
                    paddedStart.setDate(paddedStart.getDate() - 2);
                    const paddedEnd = new Date(maxDate);
                    paddedEnd.setDate(paddedEnd.getDate() + 2);
                    
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

  // Execute optimization algorithm from Optimization Studio
  const executeOptimizationAlgorithm = useCallback(async () => {
    if (!schedulerInstance || !selectedAlgorithm) {
      toast({
        title: "Error",
        description: "Please select an algorithm",
        variant: "destructive"
      });
      return;
    }

    setIsExecutingAlgorithm(true);
    
    try {
      // Prepare schedule data
      const currentSchedule = {
        events: schedulerInstance.eventStore.records.map((e: any) => ({
          id: e.id,
          name: e.name,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate.toISOString(),
          resourceId: e.resourceId,
          needDate: e.needDate?.toISOString()
        })),
        resources: schedulerInstance.resourceStore.records.map((r: any) => ({
          id: r.id,
          name: r.name,
          capacity: r.capacity || 100
        })),
        dependencies: schedulerInstance.dependencyStore.records.map((d: any) => ({
          from: d.from,
          to: d.to,
          type: d.type,
          lag: d.lag || 0
        })),
        assignments: schedulerInstance.assignmentStore.records.map((a: any) => ({
          eventId: a.eventId,
          resourceId: a.resourceId,
          units: a.units || 100
        }))
      };
      
      // Validate against rules if profile has validation rules
      if (algorithmProfile?.validationRules) {
        const violations = algorithmService.validateSchedule(currentSchedule, algorithmProfile.validationRules);
        
        if (violations.length > 0) {
          const errorViolations = violations.filter(v => v.severity === 'error');
          const warningViolations = violations.filter(v => v.severity === 'warning');
          
          if (errorViolations.length > 0) {
            toast({
              title: "Validation Failed",
              description: `Found ${errorViolations.length} errors that must be fixed before optimization`,
              variant: "destructive"
            });
            
            // Show violations in console
            console.error('Validation errors:', errorViolations);
            setIsExecutingAlgorithm(false);
            return;
          }
          
          if (warningViolations.length > 0) {
            console.warn('Validation warnings:', warningViolations);
          }
        }
      }
      
      // Execute the algorithm
      const execution = {
        algorithmId: selectedAlgorithm.id,
        parameters: algorithmProfile?.parameters || {},
        scope: {
          timeHorizon: algorithmProfile?.scope?.timeHorizon || '1_week',
          startDate: schedulerInstance.startDate.toISOString(),
          endDate: schedulerInstance.endDate.toISOString()
        },
        validationRules: algorithmProfile?.validationRules,
        constraints: algorithmProfile?.constraints
      };
      
      const result = await algorithmService.executeAlgorithm(execution);
      
      if (result.success && result.optimizedSchedule) {
        // Apply optimization to scheduler
        const applied = algorithmService.applyOptimizationToScheduler(
          schedulerInstance,
          result
        );
        
        if (applied) {
          // Calculate and show metrics
          const metrics = algorithmService.calculateMetrics(result.optimizedSchedule);
          
          toast({
            title: "Optimization Applied",
            description: `${selectedAlgorithm.displayName} completed successfully. Makespan: ${metrics.makespan} days, Resource Utilization: ${metrics.resourceUtilization}%`
          });
          
          // Update resource utilization display
          if (metrics.resourceUtilization) {
            setResourceUtilization(`Resource utilization: ${metrics.resourceUtilization}%`);
          }
        } else {
          toast({
            title: "Application Failed",
            description: "Could not apply optimization results to schedule",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Optimization Failed",
          description: result.message || "Algorithm execution failed",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Algorithm execution error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute optimization algorithm",
        variant: "destructive"
      });
    } finally {
      setIsExecutingAlgorithm(false);
      setShowAlgorithmDialog(false);
    }
  }, [schedulerInstance, selectedAlgorithm, algorithmProfile, toast]);

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
    <div className="flex flex-col h-screen bg-black overflow-auto">
      {/* Header */}
      <div className="bg-gray-900 shadow-lg px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Production Schedule</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>


      {/* Toolbar - Responsive */}
      <div className="bg-gray-900 px-2 sm:px-4 py-2 border-b border-gray-700 flex-shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2 sm:gap-3 min-w-fit">
          {/* View Selector - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-gray-700">
            <label className="text-sm font-medium text-gray-300">View:</label>
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
          <div className="flex items-center gap-1 pr-2 sm:pr-3 border-r border-gray-700">
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
            <span className="hidden sm:inline-block px-2 py-1 text-xs font-medium text-gray-400 bg-gray-800 rounded">
              {Math.round(zoomLevel / 20 * 100)}%
            </span>
          </div>

          {/* Algorithm Selector - Simplified on mobile */}
          <div className="flex items-center gap-2">
            <label className="hidden sm:inline text-sm font-medium text-gray-300">Algorithm:</label>
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
            
            {/* Optimization Studio Algorithms Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlgorithmDialog(true)}
              className="h-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Advanced</span>
            </Button>
            
            {/* Display Options Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisplayOptions(true)}
              className="h-8"
            >
              <Settings className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Display</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Scheduler Component */}
      <div className="flex-1 m-4 bg-gray-800 rounded-lg shadow-xl overflow-hidden relative border border-gray-700">
        <BryntumSchedulerProComponent
          ref={schedulerRef}
          project={schedulerData.project}
          displayOptions={displayOptions}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-900 px-4 py-2 flex justify-between items-center text-sm text-gray-400 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>{operationCount} operations scheduled</span>
          <span>{resourceUtilization}</span>
        </div>
      </div>
      
      {/* Optimization Algorithm Dialog */}
      <Dialog open={showAlgorithmDialog} onOpenChange={setShowAlgorithmDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Advanced Optimization Algorithms
            </DialogTitle>
            <DialogDescription>
              Select and configure an optimization algorithm from the Optimization Studio
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Algorithm Tabs */}
            <Tabs defaultValue="standard" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard">Standard Algorithms</TabsTrigger>
                <TabsTrigger value="custom">Custom Algorithms</TabsTrigger>
              </TabsList>
              
              <TabsContent value="standard" className="space-y-4">
                <div className="grid gap-3">
                  {availableAlgorithms
                    .filter(algo => algo.isStandard)
                    .map((algo) => (
                      <Card 
                        key={algo.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedAlgorithm?.id === algo.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => {
                          setSelectedAlgorithm(algo);
                          setAlgorithmProfile(algo.profile || null);
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold flex items-center gap-2">
                                {algo.displayName}
                                {selectedAlgorithm?.id === algo.id && (
                                  <Badge className="bg-purple-600 text-white">Selected</Badge>
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {algo.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{algo.category}</Badge>
                                <Badge variant="outline">v{algo.version}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  }
                  {availableAlgorithms.filter(algo => algo.isStandard).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No standard algorithms available
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                <div className="grid gap-3">
                  {availableAlgorithms
                    .filter(algo => !algo.isStandard)
                    .map((algo) => (
                      <Card 
                        key={algo.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedAlgorithm?.id === algo.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'hover:border-gray-400'
                        }`}
                        onClick={() => {
                          setSelectedAlgorithm(algo);
                          setAlgorithmProfile(algo.profile || null);
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold flex items-center gap-2">
                                {algo.displayName}
                                {selectedAlgorithm?.id === algo.id && (
                                  <Badge className="bg-purple-600 text-white">Selected</Badge>
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {algo.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{algo.category}</Badge>
                                <Badge variant="outline">v{algo.version}</Badge>
                                {algo.status === 'deployed' && (
                                  <Badge className="bg-green-600 text-white">Deployed</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  }
                  {availableAlgorithms.filter(algo => !algo.isStandard).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No custom algorithms available. Create algorithms in the Optimization Studio.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Algorithm Configuration */}
            {selectedAlgorithm && algorithmProfile && (
              <Card className="p-4 border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Runtime Configuration
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time Horizon:</span>
                    <span className="font-medium">
                      {algorithmProfile.scope?.timeHorizon?.replace('_', ' ') || 'Default'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Primary Objective:</span>
                    <span className="font-medium">
                      {algorithmProfile.objectives?.primary?.replace(/_/g, ' ') || 'Minimize Cost'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Constraint Strictness:</span>
                    <span className="font-medium capitalize">
                      {algorithmProfile.constraints?.strictness || 'Moderate'}
                    </span>
                  </div>
                  {algorithmProfile.validationRules && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Validation Rules:</span>
                      <span className="font-medium">
                        {Object.values(algorithmProfile.validationRules.physical || {})
                          .flat()
                          .filter((r: any) => r.enabled).length +
                         Object.values(algorithmProfile.validationRules.policy || {})
                          .flat()
                          .filter((r: any) => r.enabled).length} enabled
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAlgorithmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={executeOptimizationAlgorithm}
                disabled={!selectedAlgorithm || isExecutingAlgorithm}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {isExecutingAlgorithm ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Execute Algorithm
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Display Options Dialog */}
      <Dialog open={showDisplayOptions} onOpenChange={setShowDisplayOptions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Display Options
            </DialogTitle>
            <DialogDescription>
              Customize how the production schedule is displayed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Display Options Tabs */}
            <Tabs defaultValue="visibility" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="visibility">Visibility</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="time">Time</TabsTrigger>
              </TabsList>
              
              {/* Visibility Tab */}
              <TabsContent value="visibility" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-weekends">Show Weekends</Label>
                      <p className="text-sm text-muted-foreground">Display Saturday and Sunday in the timeline</p>
                    </div>
                    <Switch
                      id="show-weekends"
                      checked={displayOptions.showWeekends}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showWeekends: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-non-working">Show Non-Working Time</Label>
                      <p className="text-sm text-muted-foreground">Highlight non-working hours</p>
                    </div>
                    <Switch
                      id="show-non-working"
                      checked={displayOptions.showNonWorkingTime}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showNonWorkingTime: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-resources">Show Resource Names</Label>
                      <p className="text-sm text-muted-foreground">Display resource names on operations</p>
                    </div>
                    <Switch
                      id="show-resources"
                      checked={displayOptions.showResourceNames}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showResourceNames: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-details">Show Operation Details</Label>
                      <p className="text-sm text-muted-foreground">Display duration and other details</p>
                    </div>
                    <Switch
                      id="show-details"
                      checked={displayOptions.showOperationDetails}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showOperationDetails: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-dependencies">Show Dependencies</Label>
                      <p className="text-sm text-muted-foreground">Display dependency lines between operations</p>
                    </div>
                    <Switch
                      id="show-dependencies"
                      checked={displayOptions.showDependencies}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showDependencies: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-critical">Show Critical Path</Label>
                      <p className="text-sm text-muted-foreground">Highlight the critical path</p>
                    </div>
                    <Switch
                      id="show-critical"
                      checked={displayOptions.showCriticalPath}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showCriticalPath: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-progress">Show Progress</Label>
                      <p className="text-sm text-muted-foreground">Display completion percentage</p>
                    </div>
                    <Switch
                      id="show-progress"
                      checked={displayOptions.showProgress}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showProgress: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-constraints">Show Constraints</Label>
                      <p className="text-sm text-muted-foreground">Display constraint indicators</p>
                    </div>
                    <Switch
                      id="show-constraints"
                      checked={displayOptions.showConstraints}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showConstraints: checked }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Color Operations By</Label>
                    <Select
                      value={displayOptions.colorBy}
                      onValueChange={(value) =>
                        setDisplayOptions(prev => ({ ...prev, colorBy: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="resource">Resource</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="job">Job/Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Grid Lines</Label>
                    <Select
                      value={displayOptions.gridLines}
                      onValueChange={(value) =>
                        setDisplayOptions(prev => ({ ...prev, gridLines: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="horizontal">Horizontal Only</SelectItem>
                        <SelectItem value="vertical">Vertical Only</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="highlight-current">Highlight Current Time</Label>
                      <p className="text-sm text-muted-foreground">Show a line at the current time</p>
                    </div>
                    <Switch
                      id="highlight-current"
                      checked={displayOptions.highlightCurrentTime}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, highlightCurrentTime: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-tooltips">Show Tooltips</Label>
                      <p className="text-sm text-muted-foreground">Display tooltips on hover</p>
                    </div>
                    <Switch
                      id="show-tooltips"
                      checked={displayOptions.showTooltips}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showTooltips: checked }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Layout Tab */}
              <TabsContent value="layout" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Row Height</Label>
                    <Select
                      value={displayOptions.rowHeight}
                      onValueChange={(value) =>
                        setDisplayOptions(prev => ({ ...prev, rowHeight: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compact-mode">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Reduce spacing between elements</p>
                    </div>
                    <Switch
                      id="compact-mode"
                      checked={displayOptions.compactMode}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, compactMode: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-baselines">Show Baselines</Label>
                      <p className="text-sm text-muted-foreground">Display baseline schedule for comparison</p>
                    </div>
                    <Switch
                      id="show-baselines"
                      checked={displayOptions.showBaselines}
                      onCheckedChange={(checked) =>
                        setDisplayOptions(prev => ({ ...prev, showBaselines: checked }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Time Tab */}
              <TabsContent value="time" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Time Format</Label>
                    <Select
                      value={displayOptions.timeFormat}
                      onValueChange={(value) =>
                        setDisplayOptions(prev => ({ ...prev, timeFormat: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  // Reset to defaults
                  setDisplayOptions({
                    showWeekends: true,
                    showNonWorkingTime: true,
                    showResourceNames: true,
                    showOperationDetails: true,
                    showDependencies: true,
                    showCriticalPath: false,
                    showProgress: true,
                    showTooltips: true,
                    compactMode: false,
                    colorBy: 'status',
                    timeFormat: '12h',
                    gridLines: 'both',
                    rowHeight: 'normal',
                    highlightCurrentTime: true,
                    showBaselines: false,
                    showConstraints: true
                  });
                  toast({
                    title: "Display Options Reset",
                    description: "Display settings have been reset to defaults"
                  });
                }}
              >
                Reset to Defaults
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDisplayOptions(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Apply display options to scheduler
                    if (schedulerInstance) {
                      // Apply settings to Bryntum scheduler
                      schedulerInstance.weekendsEnabled = displayOptions.showWeekends;
                      schedulerInstance.showTooltip = displayOptions.showTooltips;
                      
                      // Update row height
                      const rowHeightMap = {
                        compact: 30,
                        normal: 45,
                        comfortable: 60
                      };
                      schedulerInstance.rowHeight = rowHeightMap[displayOptions.rowHeight];
                      
                      // Apply other settings
                      if (displayOptions.showCriticalPath) {
                        schedulerInstance.features.criticalPaths = { disabled: false };
                      } else {
                        schedulerInstance.features.criticalPaths = { disabled: true };
                      }
                      
                      if (displayOptions.showDependencies) {
                        schedulerInstance.features.dependencies = { disabled: false };
                      } else {
                        schedulerInstance.features.dependencies = { disabled: true };
                      }
                      
                      // Refresh the scheduler
                      schedulerInstance.refresh();
                    }
                    
                    setShowDisplayOptions(false);
                    toast({
                      title: "Display Options Applied",
                      description: "Your display preferences have been updated"
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionSchedulerProV2;