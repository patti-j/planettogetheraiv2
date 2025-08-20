import React, { useMemo, useRef, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ---- Sample data from your provided example -----------------------------------------------------------
const startDate = new Date(2025, 3, 1, 8);
const endDate = new Date(2025, 3, 1, 18);

const resources = [
  { id: 1, name: 'Lab #11', capacity: 8 },
  { id: 2, name: 'Lab #12', capacity: 10 },
  { id: 3, name: 'Lab #13', capacity: 6 },
  { id: 4, name: 'X-Ray lab', capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

const events = [
  { id: 1, resourceId: 1, name: 'RNA Sequencing', startDate, endDate: new Date(2025, 3, 1, 11) },
  { id: 2, resourceId: 1, name: 'Glycan analysis', startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) },
  { id: 3, resourceId: 2, name: 'Electron microscopy', startDate: new Date(2025, 3, 1, 9), endDate: new Date(2025, 3, 1, 12) },
  { id: 4, resourceId: 2, name: 'Covid variant analysis', startDate: new Date(2025, 3, 1, 13), endDate: new Date(2025, 3, 1, 17) },
  { id: 5, resourceId: 3, name: 'Bacterial identification', startDate: new Date(2025, 3, 1, 10), endDate: new Date(2025, 3, 1, 14) },
  { id: 6, resourceId: 4, name: 'Disinfectant efficacy', startDate: new Date(2025, 3, 1, 9), endDate: new Date(2025, 3, 1, 11) },
  { id: 7, resourceId: 5, name: 'DNA Sequencing', startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) }
];

// ---- Main component --------------------------------------------------------
export default function ResourceGanttDemo() {
  const schedulerRef = useRef<any>(null);
  const [dataState, setDataState] = useState({ resources, events });
  const { toast } = useToast();

  const schedulerProps = useMemo(() => ({
    startDate,
    endDate,
    viewPreset: 'hourAndDay',
    rowHeight: 60,
    barMargin: 8,

    resources: dataState.resources,
    events: dataState.events,

    // Drag & drop is enabled by default via EventDrag.
    // Here we configure it explicitly and add a simple validator.
    features: {
      eventDrag: {
        showTooltip: true,
        // Allow moving in time and to other resources:
        constrainDragToResource: false,
        constrainDragToTimeSlot: false,
        // Example validator: disallow drops that start before 07:00
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
      eventEdit: true,   // double-click to edit
      eventResize: true,
      timeRanges: true   // optional, just to show background ranges if you add them later
    },

    columns: [
      { type: 'resourceInfo' as const, text: 'Lab', width: 220, field: 'name' },
      { text: 'Capacity', width: 120, field: 'capacity', align: 'center' as const }
    ],

    listeners: {
      // Keep React state synced with internal store after drops
      eventDrop: ({ context }: any) => {
        if (context.valid) {
          const instance = schedulerRef.current;
          if (!instance) return;
          
          const nextEvents = instance.eventStore.records.map((r: any) => ({
            id: r.id,
            resourceId: r.resourceId,
            name: r.name,
            startDate: r.startDate,
            endDate: r.endDate
          }));
          
          setDataState(prev => ({ ...prev, events: nextEvents }));
          
          toast({
            title: "Event rescheduled",
            description: `${context.eventRecords[0].name} has been moved successfully.`
          });
        }
      },
      
      eventResizeEnd: ({ context }: any) => {
        if (context.valid) {
          toast({
            title: "Duration updated",
            description: "The event duration has been adjusted."
          });
        }
      }
    }
  }), [dataState, toast]);

  // Handle zoom
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

  // Handle refresh
  const handleRefresh = () => {
    // Reset to original data
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
          <h1 className="text-2xl font-semibold">Scheduler Pro – Drag & Drop Demo</h1>
          <p className="text-muted-foreground mt-1">
            Drag events to reschedule in time or drop onto another resource to reassign.
            A simple validator prevents drops before 07:00.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Instructions:</strong> Try dragging events to different times or resources. 
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