import { useState, useRef, useMemo } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Sample data for demo
const resources = [
  { id: 1, name: 'Brew Kettle 1', capacity: 100 },
  { id: 2, name: 'Fermenter 1', capacity: 80 },
  { id: 3, name: 'Packaging Line 1', capacity: 120 },
  { id: 4, name: 'QC Lab', capacity: 60 }
];

const events = [
  {
    id: 1,
    resourceId: 1,
    name: 'Batch #2025-001',
    startDate: new Date(2025, 0, 20, 8, 0),
    endDate: new Date(2025, 0, 20, 12, 0)
  },
  {
    id: 2,
    resourceId: 2,
    name: 'Fermentation #2025-002',
    startDate: new Date(2025, 0, 20, 10, 0),
    endDate: new Date(2025, 0, 20, 16, 0)
  },
  {
    id: 3,
    resourceId: 3,
    name: 'Packaging Run #2025-003',
    startDate: new Date(2025, 0, 20, 14, 0),
    endDate: new Date(2025, 0, 20, 18, 0)
  },
  {
    id: 4,
    resourceId: 4,
    name: 'Quality Test #2025-004',
    startDate: new Date(2025, 0, 20, 9, 0),
    endDate: new Date(2025, 0, 20, 11, 0)
  }
];

export default function ResourceGanttDemo() {
  const { toast } = useToast();
  const schedulerRef = useRef<any>(null);
  const [dataState, setDataState] = useState({ resources, events });
  
  // Debug logging
  console.log('Resources being passed to Bryntum:', dataState.resources);
  console.log('Events being passed to Bryntum:', dataState.events);
  
  const schedulerProps = useMemo(() => ({
    startDate: new Date(2025, 0, 20),
    endDate: new Date(2025, 0, 27),
    viewPreset: 'hourAndDay',
    rowHeight: 60,
    barMargin: 5,
    
    // Use resources and events directly
    resources: dataState.resources,
    events: dataState.events,
    
    features: {
      eventDrag: {
        constrainDragToResource: false,
        constrainDragToTimeSlot: false,
        validatorFn: ({ startDate: dragStartDate }: any) => {
          const valid = dragStartDate.getHours() >= 7;
          if (!valid) {
            toast({
              title: "Invalid time",
              description: "Operations cannot start before 7:00 AM",
              variant: "destructive"
            });
          }
          return valid;
        }
      },
      eventEdit: true,
      eventResize: true,
      timeRanges: true,
      resourceTimeRanges: false,
      nonWorkingTime: false
    },

    columns: [
      { type: 'resourceInfo', text: 'Resource', width: 220, field: 'name' },
      { text: 'Capacity', width: 120, field: 'capacity', align: 'center' }
    ],

    listeners: {
      eventDrop: ({ context }: any) => {
        if (context.valid) {
          toast({
            title: "Event rescheduled",
            description: `${context.eventRecords[0].name} has been moved successfully.`
          });
        }
      },
      
      eventResizeEnd: (event: any) => {
        const eventRecord = event?.eventRecord || event?.eventRecords?.[0];
        const eventName = eventRecord?.name || "Event";
        
        toast({
          title: "Duration updated",
          description: `${eventName} duration has been adjusted.`
        });
      }
    }
  }), [dataState, toast]);

  const handleZoomIn = () => {
    const instance = schedulerRef.current;
    if (instance) {
      instance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    const instance = schedulerRef.current;
    if (instance) {
      instance.zoomOut();
    }
  };

  const handleRefresh = () => {
    setDataState({ resources, events });
    toast({
      title: "Data refreshed",
      description: "The schedule has been reset to original data."
    });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Resource Gantt Demo</h1>
          <p className="text-gray-600">Drag-and-drop production scheduling with Bryntum Scheduler Pro</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleZoomOut} variant="outline" size="sm">
            <ZoomOut className="h-4 w-4 mr-1" />
            Zoom Out
          </Button>
          <Button onClick={handleZoomIn} variant="outline" size="sm">
            <ZoomIn className="h-4 w-4 mr-1" />
            Zoom In
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Try it out:</strong> Drag events between resources or times. 
          Double-click to edit. Events cannot start before 7:00 AM.
        </p>
      </Card>

      <Card className="p-0 overflow-hidden" style={{ height: '600px' }}>
        <BryntumSchedulerPro
          ref={schedulerRef}
          {...schedulerProps}
        />
      </Card>
    </div>
  );
}