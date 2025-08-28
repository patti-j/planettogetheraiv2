import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Save, 
  Settings,
  Filter,
  Download,
  Upload,
  Star,
  RefreshCw,
  Play,
  Pause,
  FastForward
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GanttDataService } from '@/services/scheduler/GanttDataService';
import { GanttConfigService } from '@/services/scheduler/GanttConfigService';
import { GanttFavoritesService } from '@/services/scheduler/GanttFavoritesService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Type declaration for Bryntum SchedulerPro
interface BryntumSchedulerPro {
  schedulerpro: {
    SchedulerPro: any;
    ProjectModel: any;
    EventModel: any;
    ResourceModel: any;
    DependencyModel: any;
    AssignmentModel: any;
  };
}

const ProductionSchedulerPro: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('weekAndDay');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [selectedFavorite, setSelectedFavorite] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  const [favoriteDescription, setFavoriteDescription] = useState('');
  
  const { toast } = useToast();
  
  // Services
  const dataService = GanttDataService.getInstance();
  const configService = GanttConfigService.getInstance();
  const favoritesService = GanttFavoritesService.getInstance();

  useEffect(() => {
    // Load favorites
    const loadedFavorites = favoritesService.getAllFavorites();
    setFavorites(loadedFavorites);
    
    // Load Bryntum SchedulerPro script if not already loaded
    const loadBryntumScript = () => {
      if ((window as any).bryntum) {
        // Already loaded
        initializeScheduler();
        return;
      }
      
      const script = document.createElement('script');
      script.src = '/schedulerpro.umd.js';
      script.async = true;
      script.onload = () => {
        console.log('Bryntum SchedulerPro loaded');
        // Wait a bit for the library to fully initialize
        setTimeout(initializeScheduler, 100);
      };
      script.onerror = () => {
        console.error('Failed to load Bryntum SchedulerPro script');
        toast({
          title: "Error",
          description: "Failed to load scheduler library. Please refresh the page.",
          variant: "destructive"
        });
        setIsLoading(false);
      };
      document.body.appendChild(script);
      
      // Also load the CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/schedulerpro.classic-light.css';
      document.head.appendChild(link);
    };

    loadBryntumScript();

    // Cleanup
    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.destroy();
        schedulerRef.current = null;
      }
    };
  }, []);

  const initializeScheduler = async () => {
    try {
      setIsLoading(true);
      
      const bryntumGlobal = (window as any).bryntum as BryntumSchedulerPro;
      
      if (!bryntumGlobal || !bryntumGlobal.schedulerpro) {
        console.error('Bryntum SchedulerPro not loaded');
        toast({
          title: "Error",
          description: "Scheduler library not available. Please refresh the page.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      const { SchedulerPro, ProjectModel } = bryntumGlobal.schedulerpro;

      if (!SchedulerPro || !ProjectModel) {
        console.error('SchedulerPro components not found');
        toast({
          title: "Error",
          description: "Failed to load scheduler components",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Get demo data from service
      const ganttData = await dataService.getDemoData();
      console.log('Gantt data loaded:', ganttData);
      
      // Get default configuration
      const config = configService.getDefaultConfig();
      
      // Create project model with updated API properties
      console.log('Creating ProjectModel...');
      const project = new ProjectModel({
        resources: ganttData.resources,
        events: ganttData.events,
        dependencies: ganttData.dependencies,
        assignments: ganttData.assignments,
        
        // Enable scheduling features
        autoSync: false,
        validateResponse: true
      });

      console.log('ProjectModel created, creating scheduler...');
      
      // Use simplified configuration to avoid missing features error
      try {
        schedulerRef.current = new SchedulerPro({
          appendTo: containerRef.current,
          project,
          
          // Basic configuration
          startDate: new Date(2025, 7, 28),
          endDate: new Date(2025, 8, 7),
          viewPreset: 'weekAndDayLetter',
          rowHeight: 50,
          barMargin: 5,
          
          // Simple columns configuration
          columns: config.columns,
          
          // Use simplified features from config
          features: config.features,
          
          // Event listeners
          listeners: {
            beforeEventEdit: ({ eventRecord }: any) => {
            console.log('Editing event:', eventRecord);
            return true;
          },
          
          beforeEventSave: ({ eventRecord, values }: any) => {
            console.log('Saving event:', eventRecord, values);
            // TODO: Save to backend
            return true;
          },
          
          beforeEventDelete: ({ eventRecords }: any) => {
            console.log('Deleting events:', eventRecords);
            // TODO: Delete from backend
            return true;
          },
          
          eventDrop: ({ eventRecords, targetResourceRecord, startDate }: any) => {
            console.log('Event dropped:', eventRecords, targetResourceRecord, startDate);
            // TODO: Update backend
          },
          
          eventResizeEnd: ({ eventRecord, startDate, endDate }: any) => {
            console.log('Event resized:', eventRecord, startDate, endDate);
            // TODO: Update backend
          },
          
          dependencyAdd: ({ dependency }: any) => {
            console.log('Dependency added:', dependency);
            // TODO: Save to backend
          },
          
          dependencyRemove: ({ dependency }: any) => {
            console.log('Dependency removed:', dependency);
            // TODO: Remove from backend
          }
        }
      });
      } catch (innerError) {
        console.error('Failed to create scheduler with simple config:', innerError);
        throw innerError;
      }

      console.log('Scheduler created successfully');
      
      // Update counts
      setResourceCount(ganttData.resources.length);
      setOperationCount(ganttData.events.length);
      
      toast({
        title: "Success",
        description: `Scheduler loaded with ${ganttData.resources.length} resources and ${ganttData.events.length} operations`
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize scheduler - Full error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize scheduler",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Toolbar actions
  const handleZoomIn = () => {
    if (schedulerRef.current) {
      const newZoom = configService.zoomIn();
      if (newZoom) {
        schedulerRef.current.viewPreset = newZoom.preset;
      }
    }
  };

  const handleZoomOut = () => {
    if (schedulerRef.current) {
      const newZoom = configService.zoomOut();
      if (newZoom) {
        schedulerRef.current.viewPreset = newZoom.preset;
      }
    }
  };

  const handleZoomToFit = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomToFit();
    }
  };

  const handleViewChange = (preset: string) => {
    if (schedulerRef.current) {
      schedulerRef.current.viewPreset = preset;
      setCurrentView(preset);
      configService.setZoomLevel(preset);
    }
  };

  const handleRefresh = async () => {
    if (schedulerRef.current) {
      setIsLoading(true);
      const ganttData = await dataService.getProductionData();
      schedulerRef.current.project.loadInlineData(ganttData);
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Data refreshed"
      });
    }
  };

  const handleSaveFavorite = () => {
    if (!favoriteName) {
      toast({
        title: "Error",
        description: "Please enter a name for the favorite",
        variant: "destructive"
      });
      return;
    }

    if (schedulerRef.current) {
      const config = {
        viewPreset: schedulerRef.current.viewPreset.id,
        startDate: schedulerRef.current.startDate.toISOString(),
        endDate: schedulerRef.current.endDate.toISOString(),
        filters: schedulerRef.current.store.filters?.values,
        grouping: schedulerRef.current.store.groupers?.[0]?.field,
        sorting: schedulerRef.current.store.sorters?.[0]?.field,
        columns: schedulerRef.current.columns.map((c: any) => ({
          field: c.field,
          width: c.width,
          hidden: c.hidden
        }))
      };

      favoritesService.saveFavorite({
        name: favoriteName,
        description: favoriteDescription,
        config,
        isShared: false,
        createdBy: 'current-user' // TODO: Get from auth context
      }).then(favorite => {
        setFavorites([...favorites, favorite]);
        setSaveDialogOpen(false);
        setFavoriteName('');
        setFavoriteDescription('');
        toast({
          title: "Success",
          description: "Favorite saved successfully"
        });
      });
    }
  };

  const handleLoadFavorite = (favoriteId: string) => {
    if (schedulerRef.current && favoriteId) {
      const config = favoritesService.applyFavorite(favoriteId);
      schedulerRef.current.setTimeSpan(config.startDate, config.endDate);
      schedulerRef.current.viewPreset = config.viewPreset;
      
      if (config.filters) {
        schedulerRef.current.store.filter(config.filters);
      }
      if (config.grouping) {
        schedulerRef.current.store.group(config.grouping);
      }
      if (config.sorting) {
        schedulerRef.current.store.sort(config.sorting);
      }
      
      setSelectedFavorite(favoriteId);
      toast({
        title: "Success",
        description: "Favorite loaded"
      });
    }
  };

  const handleRunOptimization = (algorithm: string) => {
    toast({
      title: "Optimization Started",
      description: `Running ${algorithm} optimization...`
    });
    // TODO: Implement optimization algorithms
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header Toolbar */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Production Scheduler Pro
            </h1>
            
            {/* View Preset Selector */}
            <Select value={currentView} onValueChange={handleViewChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minuteAndHour">Minute & Hour</SelectItem>
                <SelectItem value="hourAndDay">Hour & Day</SelectItem>
                <SelectItem value="dayAndWeek">Day & Week</SelectItem>
                <SelectItem value="weekAndDay">Week & Day</SelectItem>
                <SelectItem value="weekAndMonth">Week & Month</SelectItem>
                <SelectItem value="monthAndYear">Month & Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleZoomToFit}
                title="Zoom to Fit"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Favorites */}
            <Select value={selectedFavorite} onValueChange={handleLoadFavorite}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Load favorite view" />
              </SelectTrigger>
              <SelectContent>
                {favorites.map(fav => (
                  <SelectItem key={fav.id} value={fav.id}>
                    <Star className="h-3 w-3 inline mr-1" />
                    {fav.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* Optimization Algorithms */}
            <Select onValueChange={handleRunOptimization}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Run optimization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asap">
                  <Play className="h-3 w-3 inline mr-1" />
                  ASAP (Forward)
                </SelectItem>
                <SelectItem value="alap">
                  <Pause className="h-3 w-3 inline mr-1" />
                  ALAP (Backward)
                </SelectItem>
                <SelectItem value="critical">
                  <FastForward className="h-3 w-3 inline mr-1" />
                  Critical Path
                </SelectItem>
                <SelectItem value="level">
                  Level Resources
                </SelectItem>
                <SelectItem value="toc">
                  Theory of Constraints
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Save View">
                  <Save className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Current View as Favorite</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="favorite-name">Name</Label>
                    <Input
                      id="favorite-name"
                      value={favoriteName}
                      onChange={(e) => setFavoriteName(e.target.value)}
                      placeholder="Enter favorite name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="favorite-description">Description (optional)</Label>
                    <Textarea
                      id="favorite-description"
                      value={favoriteDescription}
                      onChange={(e) => setFavoriteDescription(e.target.value)}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSaveFavorite} className="w-full">
                    Save Favorite
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="icon" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading scheduler...</p>
            </div>
          </div>
        )}
        
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Status Bar */}
      <div className="border-t bg-card px-4 py-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Ready • Demo Data Loaded
          </div>
          <div className="flex items-center gap-4">
            <span>Resources: 8</span>
            <span>Operations: 6</span>
            <span>Dependencies: 5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionSchedulerPro;