import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
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
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GanttDataService } from '@/services/scheduler/GanttDataService';
import { GanttConfigService } from '@/services/scheduler/GanttConfigService';
import { GanttFavoritesService } from '@/services/scheduler/GanttFavoritesService';

const ProductionSchedulerProV2: React.FC = () => {
  const schedulerRef = useRef<any>(null);
  const [schedulerInstance, setSchedulerInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resourceCount, setResourceCount] = useState(0);
  const [operationCount, setOperationCount] = useState(0);
  const [currentView, setCurrentView] = useState('weekAndDayLetter');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [schedulerData, setSchedulerData] = useState<any>(null);
  const [schedulerConfig, setSchedulerConfig] = useState<any>(null);
  const { toast } = useToast();
  
  // Services
  const dataService = GanttDataService.getInstance();
  const configService = GanttConfigService.getInstance();
  const favoritesService = GanttFavoritesService.getInstance();

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
        console.log('Gantt data loaded:', ganttData);
        
        // Get default configuration
        const config = configService.getDefaultConfig();
        
        // Set scheduler data
        setSchedulerData({
          project: {
            resources: ganttData.resources,
            events: ganttData.events,
            dependencies: ganttData.dependencies,
            assignments: ganttData.assignments,
            autoSync: false,
            validateResponse: true
          }
        });
        
        // Set scheduler configuration with shorter date range to prevent Bryntum error
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7); // Show 1 week
        
        setSchedulerConfig({
          startDate: today,
          endDate: endDate,
          viewPreset: 'weekAndDayLetter',
          zoomLevel: 10,  // Set initial zoom level like in HTML version
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
            percentBar: true,
            regionResize: true,
            sort: 'name',
            stripe: true,
            tree: true,
            timeRanges: {
              showCurrentTimeLine: true
            }
          }
        });
        
        // Update counts
        setResourceCount(ganttData.resources.length);
        setOperationCount(ganttData.events.length);
        
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

  // Capture scheduler instance after mount
  useEffect(() => {
    const timer = setInterval(() => {
      // Try to get the actual Bryntum instance from the React component
      if (schedulerRef.current) {
        // The Bryntum React wrapper exposes the instance as schedulerInstance
        const instance = schedulerRef.current.schedulerInstance || 
                        schedulerRef.current.instance || 
                        schedulerRef.current;
        
        // Check if we have the actual Bryntum widget with zoom methods
        if (instance && typeof instance.zoomToFit === 'function') {
          console.log('✅ Scheduler instance captured successfully');
          setSchedulerInstance(instance);
          
          // Apply initial zoom to fit
          setTimeout(() => {
            instance.zoomToFit();
            console.log('Initial zoom to fit applied');
          }, 100);
          
          clearInterval(timer);
        }
      }
    }, 100);
    
    // Clear interval after 5 seconds if not found
    const timeout = setTimeout(() => clearInterval(timer), 5000);
    
    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [schedulerData, schedulerConfig]);

  // Toolbar actions - memoized with useCallback
  const handleZoomIn = useCallback(() => {
    if (schedulerInstance && typeof schedulerInstance.zoomIn === 'function') {
      schedulerInstance.zoomIn();
      console.log('Zoomed in');
    } else if (schedulerInstance && schedulerInstance.zoomLevel !== undefined) {
      // Fallback to direct property access
      schedulerInstance.zoomLevel = Math.min((schedulerInstance.zoomLevel || 10) + 2, 20);
      console.log('Zoomed in to level:', schedulerInstance.zoomLevel);
    } else {
      console.log('Scheduler not ready for zoom in');
    }
  }, [schedulerInstance]);

  const handleZoomOut = useCallback(() => {
    if (schedulerInstance && typeof schedulerInstance.zoomOut === 'function') {
      schedulerInstance.zoomOut();
      console.log('Zoomed out');
    } else if (schedulerInstance && schedulerInstance.zoomLevel !== undefined) {
      // Fallback to direct property access
      schedulerInstance.zoomLevel = Math.max((schedulerInstance.zoomLevel || 10) - 2, 0);
      console.log('Zoomed out to level:', schedulerInstance.zoomLevel);
    } else {
      console.log('Scheduler not ready for zoom out');
    }
  }, [schedulerInstance]);

  const handleZoomToFit = useCallback(() => {
    if (schedulerInstance && typeof schedulerInstance.zoomToFit === 'function') {
      schedulerInstance.zoomToFit();
      console.log('Zoomed to fit');
    } else {
      console.log('Scheduler not ready for zoom to fit');
    }
  }, [schedulerInstance]);

  const handleViewChange = (preset: string) => {
    if (schedulerInstance) {
      schedulerInstance.viewPreset = preset;
      setCurrentView(preset);
      configService.setZoomLevel(preset);
    }
  };

  const handleRefresh = async () => {
    if (schedulerInstance) {
      setIsLoading(true);
      const ganttData = await dataService.getProductionData();
      schedulerInstance.project.loadInlineData(ganttData);
      setIsLoading(false);
      toast({
        title: "Refreshed",
        description: "Data refreshed successfully"
      });
    }
  };

  const handleOptimize = (algorithm: string) => {
    console.log('Optimizing with algorithm:', algorithm);
    toast({
      title: "Optimization Started",
      description: `Running ${algorithm} optimization...`
    });
  };

  const handleSaveFavorite = () => {
    if (schedulerInstance) {
      const name = prompt('Enter a name for this view:');
      if (name) {
        const favorite = {
          id: Date.now().toString(),
          name,
          description: `Saved on ${new Date().toLocaleDateString()}`,
          config: {
            viewPreset: schedulerInstance.viewPreset,
            startDate: schedulerInstance.startDate.toISOString(),
            endDate: schedulerInstance.endDate.toISOString()
          },
          createdAt: new Date().toISOString(),
          createdBy: '1'
        };
        favoritesService.saveFavorite(favorite);
        setFavorites([...favorites, favorite]);
        toast({
          title: "Saved",
          description: `View "${name}" saved successfully`
        });
      }
    }
  };

  const handleLoadFavorite = (favoriteId: string) => {
    const favorite = favoritesService.getFavorite(favoriteId);
    if (schedulerInstance && favorite) {
      schedulerInstance.viewPreset = favorite.config.viewPreset;
      schedulerInstance.startDate = new Date(favorite.config.startDate);
      schedulerInstance.endDate = new Date(favorite.config.endDate);
      toast({
        title: "Loaded",
        description: `View "${favorite.name}" loaded`
      });
    }
  };

  // Event handlers - properly memoized with useCallback
  const handleBeforeEventEdit = useCallback(({ eventRecord }: any) => {
    console.log('Editing event:', eventRecord);
    return true;
  }, []);

  const handleBeforeEventSave = useCallback(({ eventRecord, values }: any) => {
    console.log('Saving event:', eventRecord, values);
    return true;
  }, []);

  const handleBeforeEventDelete = useCallback(({ eventRecords }: any) => {
    console.log('Deleting events:', eventRecords);
    return true;
  }, []);

  const handleEventDrop = useCallback(({ eventRecords, targetResourceRecord, startDate }: any) => {
    console.log('Event dropped:', eventRecords, targetResourceRecord, startDate);
  }, []);

  const handleEventResizeEnd = useCallback(({ eventRecord, startDate, endDate }: any) => {
    console.log('Event resized:', eventRecord, startDate, endDate);
  }, []);

  const handleDependencyAdd = useCallback(({ dependency }: any) => {
    console.log('Dependency added:', dependency);
  }, []);

  const handleDependencyRemove = useCallback(({ dependency }: any) => {
    console.log('Dependency removed:', dependency);
  }, []);

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
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-r pr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomToFit}
                title="Zoom to Fit"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* View Selector */}
            <Select value={currentView} onValueChange={handleViewChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourAndDay">Hour & Day</SelectItem>
                <SelectItem value="dayAndWeek">Day & Week</SelectItem>
                <SelectItem value="weekAndDay">Week & Day</SelectItem>
                <SelectItem value="weekAndDayLetter">Week & Day (Letter)</SelectItem>
                <SelectItem value="weekAndMonth">Week & Month</SelectItem>
                <SelectItem value="monthAndYear">Month & Year</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Optimization Algorithms */}
            <Select onValueChange={handleOptimize}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Optimization Algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asap">ASAP</SelectItem>
                <SelectItem value="alap">ALAP</SelectItem>
                <SelectItem value="critical">Critical Path</SelectItem>
                <SelectItem value="resource">Level Resources</SelectItem>
                <SelectItem value="toc">Theory of Constraints</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Favorites */}
            <Select onValueChange={handleLoadFavorite}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Load Favorite" />
              </SelectTrigger>
              <SelectContent>
                {favorites.map(fav => (
                  <SelectItem key={fav.id} value={fav.id}>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-2" />
                      {fav.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleSaveFavorite}>
              <Save className="h-4 w-4 mr-2" />
              Save View
            </Button>
          </div>
        </div>
      </div>

      {/* Scheduler Component */}
      <div className="flex-1 relative flex flex-col" style={{ minHeight: 0, overflow: 'auto' }}>
        <div className="flex-1 min-h-0" style={{ overflow: 'auto' }}>
          <BryntumSchedulerPro
          ref={schedulerRef}
          {...schedulerConfig}
          project={schedulerData.project}
          onBeforeEventEdit={handleBeforeEventEdit}
          onBeforeEventSave={handleBeforeEventSave}
          onBeforeEventDelete={handleBeforeEventDelete}
          onEventDrop={handleEventDrop}
          onEventResizeEnd={handleEventResizeEnd}
          onDependencyAdd={handleDependencyAdd}
          onDependencyRemove={handleDependencyRemove}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Resources: {resourceCount}</span>
            <span>Operations: {operationCount}</span>
            <span>View: {currentView}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionSchedulerProV2;