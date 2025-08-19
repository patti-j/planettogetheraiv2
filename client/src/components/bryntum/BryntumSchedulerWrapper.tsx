import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';

interface BryntumSchedulerWrapperProps {
  height?: string;
  width?: string;
}

// Helper function to get color based on operation type
function getOperationColor(operationType: string): string {
  const colors: Record<string, string> = {
    'Milling': '#8B4513',
    'Mashing': '#FFD700',
    'Boiling': '#FF6347',
    'Fermentation': '#32CD32',
    'Conditioning': '#4169E1',
    'Packaging': '#9370DB',
    'Quality': '#FF69B4',
    'Cleaning': '#00CED1'
  };
  
  for (const [key, color] of Object.entries(colors)) {
    if (operationType?.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return '#6B7280'; // Default gray
}

export function BryntumSchedulerWrapper({ height = '600px', width = '100%' }: BryntumSchedulerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Toolbar control functions
  const handleZoomIn = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomIn();
    }
  };
  
  const handleZoomOut = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomOut();
    }
  };
  
  const handleZoomToFit = () => {
    if (schedulerRef.current) {
      schedulerRef.current.zoomToFit();
    }
  };
  
  const handlePrevious = () => {
    if (schedulerRef.current) {
      schedulerRef.current.shiftPrevious();
    }
  };
  
  const handleNext = () => {
    if (schedulerRef.current) {
      schedulerRef.current.shiftNext();
    }
  };
  
  const handleToday = () => {
    if (schedulerRef.current) {
      schedulerRef.current.scrollToDate(new Date(), { block: 'center', animate: true });
    }
  };
  
  const handleAddEvent = () => {
    if (schedulerRef.current) {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() + 1);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);
      
      schedulerRef.current.eventStore.add({
        name: 'New Task',
        startDate,
        endDate,
        resourceId: schedulerRef.current.resourceStore.first?.id || 1
      });
    }
  };

  // Fetch PT operations data
  const { data: operations, isLoading: loadingOperations } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });

  // Fetch PT resources data
  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['/api/resources'],
    enabled: true
  });

  // Fetch PT jobs data
  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['/api/pt-jobs'],
    enabled: true
  });

  const isLoading = loadingOperations || loadingResources || loadingJobs;

  useEffect(() => {
    if (isLoading || !containerRef.current || !operations || !resources || isInitialized) {
      return;
    }

    const initScheduler = async () => {
      // Prevent multiple initializations
      if (schedulerRef.current) {
        console.log('Scheduler already exists, skipping initialization');
        return;
      }
      
      // Check if Bryntum is available
      const bryntumAvailable = (window as any).bryntum;
      console.log('Bryntum object available:', !!bryntumAvailable);
      if (bryntumAvailable) {
        console.log('Bryntum modules:', Object.keys(bryntumAvailable));
        if (bryntumAvailable.schedulerpro) {
          // List all available classes and features in Scheduler Pro
          const schedulerProModule = bryntumAvailable.schedulerpro;
          console.log('Available Scheduler Pro classes:', Object.keys(schedulerProModule).filter(key => !key.startsWith('_')));
          
          // Check for specific features and all available features
          const availableFeatures: string[] = [];
          
          // Check all possible feature names from Bryntum documentation
          const featuresToCheck = [
            'EventContextMenu', 'ContextMenu', 'EventMenu',
            'EventSelection', 'Selection', 
            'EventEdit', 'EventEditor',
            'Dependencies', 'DependencyEdit',
            'NonWorkingTime', 'ResourceNonWorkingTime',
            'TimeRanges', 'EventDrag', 'EventResize',
            'EventTooltip', 'ScheduleTooltip', 'Tooltip',
            'ColumnLines', 'Stripe', 'Sort', 'Filter',
            'Group', 'Tree', 'Labels', 'Summary',
            'CellEdit', 'CellMenu', 'HeaderMenu',
            'Search', 'QuickFind', 'RegionResize',
            'Pan', 'EventCopyPaste', 'TaskEdit',
            'ResourceTimeRanges', 'TimeAxisHeaderMenu',
            'ScheduleMenu', 'EventDragCreate', 'SimpleEventEdit'
          ];
          
          featuresToCheck.forEach(feature => {
            if (schedulerProModule[feature]) {
              availableFeatures.push(feature);
              console.log(`✅ ${feature} available`);
            }
          });
          
          console.log('Total available features:', availableFeatures.length);
          console.log('Available features list:', availableFeatures);
        }
      }
      
      if (typeof window === 'undefined' || !bryntumAvailable?.schedulerpro) {
        console.log('Waiting for Bryntum Scheduler Pro library to load...');
        setTimeout(initScheduler, 500);
        return;
      }

      try {
        console.log('Initializing Bryntum Scheduler Pro with PT data (resource-centered view)...');
        const bryntum = (window as any).bryntum;
        
        if (!bryntum?.schedulerpro) {
          throw new Error('Bryntum Scheduler Pro not found');
        }
        
        const { SchedulerPro } = bryntum.schedulerpro;
        
        // Use actual PT resources and handle duplicates by making names unique
        const resourceNameCount = new Map<string, number>();
        const schedulerResources = (resources as any[] || []).map((resource, index) => {
          const baseName = resource.name || `Resource ${index + 1}`;
          const count = resourceNameCount.get(baseName) || 0;
          resourceNameCount.set(baseName, count + 1);
          
          // Add a suffix if this is a duplicate name
          const uniqueName = count > 0 ? `${baseName} (${count + 1})` : baseName;
          
          return {
            id: resource.id || index + 1,
            name: uniqueName,
            originalName: baseName, // Keep original for matching
            type: resource.type || 'Equipment'
          };
        });
        
        console.log(`Loading ${schedulerResources.length} PT resources`);
        console.log('First 5 resources:', schedulerResources.slice(0, 5));

        // Create events (operations) for Scheduler Pro - map using originalName
        const resourceMapping = new Map<string, number>();
        schedulerResources.forEach(r => {
          // Use originalName for mapping to handle duplicates
          if (!resourceMapping.has(r.originalName)) {
            resourceMapping.set(r.originalName, r.id);
          }
        });
        console.log('Resource mapping:', Object.fromEntries(resourceMapping));
        
        const schedulerEvents = (operations as any[] || [])
          .slice(0, 200)
          .filter(op => op.resourceName) // Only include operations with assigned resources
          .map((op, index) => {
            const resourceName = op.resourceName;
            const resourceId = resourceMapping.get(resourceName);
            
            if (!resourceId) {
              console.log(`Warning: Resource "${resourceName}" not found for operation ${op.name}`);
              return null;
            }
            
            const startDate = op.scheduledStart || op.startTime || new Date().toISOString();
            const endDate = op.scheduledEnd || op.endTime || 
              new Date(new Date(startDate).getTime() + (op.duration || 60) * 60000).toISOString();
            
            return {
              id: op.id || index + 1,
              name: op.name || op.operationName || `Operation ${op.id}`,
              startDate: startDate,
              endDate: endDate,
              resourceId: resourceId,
              percentDone: op.percentFinished || 0,
              draggable: true,
              resizable: true
            };
          })
          .filter(event => event !== null); // Remove null events

        console.log(`Loading ${schedulerEvents.length} events`);
        
        // Debug: Check resource distribution
        const resourceDistribution = new Map<number, number>();
        schedulerEvents.forEach(event => {
          const count = resourceDistribution.get(event.resourceId) || 0;
          resourceDistribution.set(event.resourceId, count + 1);
        });
        console.log('Resource distribution:', Object.fromEntries(resourceDistribution));
        console.log('Unique resources used:', resourceDistribution.size);
        
        // Clear container before creating scheduler
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Advanced Scheduler Pro configuration with all available features
        const config = {
          appendTo: containerRef.current,
          height: 600,
          width: '100%',
          autoHeight: false,
          startDate: new Date('2025-08-19'),
          endDate: new Date('2025-09-02'),
          
          // Multi-selection settings (top-level properties)
          multiEventSelect: true,
          deselectOnClick: false,
          
          // View configuration
          viewPreset: {
            base: 'dayAndWeek',
            tickWidth: 100,
            headers: [
              {
                unit: 'week',
                dateFormat: 'MMM DD'
              },
              {
                unit: 'day',
                dateFormat: 'DD'
              }
            ]
          },
          
          // Row configuration
          rowHeight: 60,
          barMargin: 8,
          
          // Resources on the left axis - initialize empty, load after creation
          resourceStore: {
            fields: ['id', 'name', 'type', 'originalName'],
            // Ensure all resources are shown
            tree: false
          },
          
          // Show all resources, even those without events
          hideUnscheduledResources: false,
          
          // Events (operations) on the timeline - initialize empty, load after creation
          eventStore: {
            fields: ['id', 'name', 'startDate', 'endDate', 'resourceId', 'percentDone', 'draggable', 'resizable']
          },
          
          // Enhanced resource columns - use simple text instead of HTML
          columns: [
            { 
              text: 'Resource Name', 
              field: 'name', 
              width: 200,
              editor: false,
              htmlEncode: false
            },
            {
              text: 'Type',
              field: 'type',
              width: 100,
              editor: false,
              renderer: ({ value }: any) => value || 'Equipment'
            }
          ],
          
          // Advanced features configuration - using all available Bryntum features
          features: {
            // Drag and drop with full configuration
            eventDrag: {
              showTooltip: true,
              constrainDragToResource: false,
              showExactDropPosition: true,
              dragHelperConfig: {
                cloneTarget: true,
                hideOriginalElement: false
              },
              validatorFn: ({ draggedRecords, newResource }: any) => {
                // Custom validation logic
                return {
                  valid: true,
                  message: 'Drag to move operation'
                };
              }
            },
            
            // Resize with full configuration
            eventResize: {
              showTooltip: true,
              showExactResizePosition: true,
              tooltipTemplate: ({ startDate, endDate }: any) => {
                const duration = Math.round((endDate - startDate) / (1000 * 60 * 60));
                return `Duration: ${duration} hours`;
              }
            },
            
            // Context menu for events (right-click menu)
            eventMenu: {
              items: {
                editEvent: {
                  text: 'Edit Operation',
                  icon: 'b-fa b-fa-edit',
                  onItem: ({ eventRecord }: any) => {
                    console.log('Edit operation:', eventRecord.name);
                  }
                },
                deleteEvent: {
                  text: 'Delete Operation',
                  icon: 'b-fa b-fa-trash',
                  cls: 'b-separator',
                  onItem: ({ eventRecord }: any) => {
                    console.log('Delete operation:', eventRecord.name);
                  }
                },
                duplicateEvent: {
                  text: 'Duplicate Operation',
                  icon: 'b-fa b-fa-copy',
                  onItem: ({ eventRecord }: any) => {
                    console.log('Duplicate operation:', eventRecord.name);
                  }
                },
                splitEvent: {
                  text: 'Split Operation',
                  icon: 'b-fa b-fa-cut',
                  onItem: ({ eventRecord }: any) => {
                    console.log('Split operation:', eventRecord.name);
                  }
                }
              }
            },
            
            // Context menu for schedule area
            scheduleMenu: {
              items: {
                addEvent: {
                  text: 'Add Operation Here',
                  icon: 'b-fa b-fa-plus',
                  onItem: ({ resourceRecord, date }: any) => {
                    console.log('Add operation at:', date, 'for resource:', resourceRecord?.name);
                  }
                }
              }
            },
            
            // Cell context menu for resources
            cellMenu: {
              items: {
                editResource: {
                  text: 'Edit Resource',
                  icon: 'b-fa b-fa-edit',
                  onItem: ({ record }: any) => {
                    console.log('Edit resource:', record.name);
                  }
                },
                resourceUtilization: {
                  text: 'View Utilization',
                  icon: 'b-fa b-fa-chart-line',
                  onItem: ({ record }: any) => {
                    console.log('View utilization for:', record.name);
                  }
                }
              }
            },
            
            // Header context menu
            headerMenu: {
              items: {
                zoomIn: {
                  text: 'Zoom In',
                  icon: 'b-fa b-fa-search-plus',
                  onItem: () => {
                    console.log('Zoom in timeline');
                  }
                },
                zoomOut: {
                  text: 'Zoom Out', 
                  icon: 'b-fa b-fa-search-minus',
                  onItem: () => {
                    console.log('Zoom out timeline');
                  }
                }
              }
            },
            
            // Event editing (double-click to edit)
            eventEdit: {
              items: {
                generalTab: {
                  title: 'General',
                  items: {
                    nameField: { 
                      type: 'text', 
                      name: 'name', 
                      label: 'Operation Name',
                      required: true
                    },
                    resourceField: {
                      type: 'combo',
                      name: 'resourceId',
                      label: 'Resource',
                      required: true
                    },
                    percentDoneField: {
                      type: 'number',
                      name: 'percentDone',
                      label: 'Progress (%)',
                      min: 0,
                      max: 100
                    }
                  }
                }
              }
            },
            
            // Enhanced tooltips
            eventTooltip: {
              template: ({ eventRecord }: any) => {
                const resource = schedulerResources.find(r => r.id === eventRecord.resourceId);
                const duration = Math.round((new Date(eventRecord.endDate).getTime() - new Date(eventRecord.startDate).getTime()) / (1000 * 60 * 60));
                return `
                  <div style="padding: 14px; min-width: 300px; font-family: system-ui, -apple-system, sans-serif;">
                    <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                      ${eventRecord.name}
                    </h3>
                    <div style="display: grid; gap: 8px; font-size: 14px;">
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">Resource:</span>
                        <span style="font-weight: 500; color: #111827;">${resource?.name || 'Unassigned'}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">Start:</span>
                        <span style="font-weight: 500; color: #111827;">${new Date(eventRecord.startDate).toLocaleString()}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">End:</span>
                        <span style="font-weight: 500; color: #111827;">${new Date(eventRecord.endDate).toLocaleString()}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: #6b7280;">Duration:</span>
                        <span style="font-weight: 500; color: #111827;">${duration} hours</span>
                      </div>
                      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="color: #6b7280;">Progress:</span>
                          <div style="flex: 1; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(to right, #10b981, #059669); width: ${eventRecord.percentDone || 0}%; transition: width 0.3s;"></div>
                          </div>
                          <span style="font-weight: 600; color: #111827;">${eventRecord.percentDone || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }
            },
            
            // Column lines for better visual separation
            columnLines: true,
            
            // Time ranges with current time indicator
            timeRanges: {
              showCurrentTimeLine: true,
              showHeaderElements: true,
              currentDateFormat: 'HH:mm'
            },
            
            // Sorting capabilities
            sort: {
              field: 'name',
              ascending: true
            },
            
            // Filtering capabilities
            filter: true,
            
            // Group resources
            group: false, // Can be enabled for grouping by type
            
            // Schedule tooltip on hover
            scheduleTooltip: true,
            
            // Stripe feature for alternating row colors
            stripe: true,
            
            // Dependencies between events
            dependencies: {
              allowCreate: true,
              showTooltip: true
            },
            
            // Non-working time configuration
            nonWorkingTime: {
              highlightWeekends: true
            },
            
            // Resource non-working time
            resourceNonWorkingTime: {
              maxTimeAxisUnit: 'week'
            },
            
            // Summary feature for rollups
            summary: {
              renderer: ({ sum }: any) => `Total: ${sum}`
            },
            
            // Tree feature for hierarchical resources (disabled - needs tree column)
            tree: false,
            
            // Labels on events
            labels: {
              left: {
                field: 'name',
                editor: false
              }
            },
            
            // Pan feature for scrolling timeline
            pan: true,
            
            // Event drag create - drag to create new events
            eventDragCreate: {
              showTooltip: true,
              dragTolerance: 2
            },
            
            // Quick find feature
            quickFind: true,
            
            // Search feature
            search: true,
            
            // Region resize
            regionResize: true,
            
            // Simple event edit (inline editing)
            simpleEventEdit: true,
            
            // Copy paste events
            eventCopyPaste: {
              keyMap: {
                copy: 'Ctrl+C',
                cut: 'Ctrl+X',
                paste: 'Ctrl+V'
              }
            },
            
            // Export features
            pdfExport: {
              exportServer: false // Client-side export
            },
            
            // Excel export
            excelExporter: {
              zipcelx: false
            }
          },
          
          // Event renderer for custom styling
          eventRenderer: ({ eventRecord, renderData }: any) => {
            // Color based on progress
            let color = '#ef4444'; // Red for 0%
            if (eventRecord.percentDone >= 100) {
              color = '#10b981'; // Green for complete
            } else if (eventRecord.percentDone >= 50) {
              color = '#f59e0b'; // Amber for in progress
            }
            
            renderData.eventColor = color;
            renderData.style = `border-left: 4px solid ${color}`;
            
            return eventRecord.name;
          }
        };
        
        console.log('Creating Scheduler Pro with config:', config);
        console.log('Resources:', schedulerResources);
        console.log('Events:', schedulerEvents);
        
        try {
          schedulerRef.current = new SchedulerPro(config);
          console.log('✅ Scheduler Pro created successfully with PT data!');
          
          // Load resources and events after scheduler creation
          // This ensures proper rendering of all resources
          schedulerRef.current.resourceStore.data = schedulerResources;
          console.log(`Loaded ${schedulerRef.current.resourceStore.count} resources into scheduler`);
          
          // Small delay before loading events to ensure resources are rendered
          setTimeout(() => {
            // Add placeholder events for resources without any operations
            // This ensures all resources are visible in the scheduler
            const usedResourceIds = new Set(schedulerEvents.map(e => e.resourceId));
            const placeholderEvents = schedulerResources
              .filter(r => !usedResourceIds.has(r.id))
              .map((r, index) => ({
                id: 1000 + index, // Use high IDs to avoid conflicts
                name: 'Available',
                startDate: new Date('2025-08-19T00:00:00'),
                endDate: new Date('2025-08-19T00:01:00'),
                resourceId: r.id,
                percentDone: 0,
                draggable: false,
                resizable: false,
                cls: 'placeholder-event' // CSS class for styling
              }));
            
            const allEvents = [...schedulerEvents, ...placeholderEvents];
            schedulerRef.current.eventStore.data = allEvents;
            console.log(`Loaded ${schedulerRef.current.eventStore.count} events into scheduler (${placeholderEvents.length} placeholders)`);
            
            // Force a refresh to ensure all resources are visible
            schedulerRef.current.refresh();
          }, 100);
          
          // Add event listeners for interaction
          schedulerRef.current.on({
            // Event drag completed
            eventDrop: ({ context }: any) => {
              console.log('Event dropped:', {
                event: context.eventRecords[0]?.name,
                newResource: context.newResource?.name,
                newStartDate: context.startDate
              });
            },
            
            // Event resize completed  
            eventResizeEnd: ({ context }: any) => {
              console.log('Event resized:', {
                event: context.eventRecord?.name,
                newStartDate: context.startDate,
                newEndDate: context.endDate
              });
            },
            
            // Event clicked
            eventClick: ({ eventRecord }: any) => {
              console.log('Event clicked:', eventRecord.name);
            },
            
            // Event double-clicked
            eventDblClick: ({ eventRecord }: any) => {
              console.log('Event double-clicked:', eventRecord.name);
              // Could open an edit dialog here
            },
            
            // Resource clicked
            cellClick: ({ record }: any) => {
              if (record) {
                console.log('Resource clicked:', record.name);
              }
            }
          });
          
        } catch (schedulerError: any) {
          console.error('Scheduler Pro creation error:', schedulerError.message || schedulerError);
          console.error('Stack trace:', schedulerError.stack);
          
          // Parse error to identify unavailable features
          const errorMessage = schedulerError.message || '';
          const unavailableFeatures: string[] = [];
          const featureRegex = /Feature '(\w+)' not available/g;
          let match;
          while ((match = featureRegex.exec(errorMessage)) !== null) {
            unavailableFeatures.push(match[1]);
          }
          
          if (unavailableFeatures.length > 0) {
            console.log('Unavailable features detected:', unavailableFeatures);
            console.log('Creating scheduler with available features only...');
            
            // Create a copy of config without unavailable features
            const safeConfig = { ...config };
            if (safeConfig.features) {
              unavailableFeatures.forEach(feature => {
                if (safeConfig.features[feature]) {
                  console.log(`Removing unavailable feature: ${feature}`);
                  delete safeConfig.features[feature];
                }
              });
            }
            
            try {
              schedulerRef.current = new SchedulerPro(safeConfig);
              console.log('✅ Scheduler Pro created with available features only!');
              setIsInitialized(true);
              return;
            } catch (retryError: any) {
              console.error('Retry with safe config failed:', retryError.message);
            }
          }
          
          // If still failing, try minimal config
          console.log('Attempting minimal fallback configuration...');
          const fallbackConfig = {
            appendTo: containerRef.current,
            height: 600,
            startDate: new Date('2025-08-19'),
            endDate: new Date('2025-09-02'),
            resourceStore: { data: schedulerResources },
            eventStore: { data: schedulerEvents },
            columns: [{ text: 'Resources', field: 'name', width: 250 }],
            features: {
              eventDrag: true,
              eventResize: true,
              eventTooltip: true,
              columnLines: true
            }
          };
          
          try {
            schedulerRef.current = new SchedulerPro(fallbackConfig);
            console.log('✅ Scheduler Pro created with fallback configuration');
          } catch (fallbackError: any) {
            console.error('Fallback also failed:', fallbackError.message);
            throw fallbackError;
          }
        }

        console.log('Scheduler initialized successfully');
        setIsInitialized(true);
        
      } catch (err) {
        console.error('Error initializing Bryntum Scheduler:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize scheduler');
      }
    };

    initScheduler();

    // Cleanup
    return () => {
      if (schedulerRef.current) {
        try {
          console.log('Destroying scheduler instance');
          schedulerRef.current.destroy();
          schedulerRef.current = null;
        } catch (e) {
          console.error('Error destroying scheduler:', e);
        }
      }
    };
  }, [isLoading, operations, resources]); // Removed isInitialized to prevent re-initialization loop

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-lg font-medium">Loading Brewery Production Schedule...</p>
          <p className="text-sm text-gray-500">Fetching operations and resources from PT tables</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center space-y-4 text-red-600">
          <p className="text-lg font-medium">Error Loading Scheduler</p>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar with time controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <ZoomIn className="h-4 w-4" />
            ZOOM IN
          </Button>
          
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <ZoomOut className="h-4 w-4" />
            ZOOM OUT
          </Button>
          
          <Button
            onClick={handleZoomToFit}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <Maximize2 className="h-4 w-4" />
            ZOOM TO FIT
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          {/* Navigation controls */}
          <Button
            onClick={handlePrevious}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <ChevronLeft className="h-4 w-4" />
            PREVIOUS
          </Button>
          
          <Button
            onClick={handleToday}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            <Calendar className="h-4 w-4" />
            TODAY
          </Button>
          
          <Button
            onClick={handleNext}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={!isInitialized}
          >
            NEXT
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Add Event button */}
        <Button
          onClick={handleAddEvent}
          size="sm"
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
          disabled={!isInitialized}
        >
          <Plus className="h-4 w-4" />
          ADD EVENT
        </Button>
      </div>
      
      {/* Scheduler container */}
      <div 
        ref={containerRef} 
        className="bryntum-scheduler-container flex-1"
        style={{ 
          height: `calc(${height} - 60px)`,
          width,
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate'
        }}
      />
    </div>
  );
}

export default BryntumSchedulerWrapper;