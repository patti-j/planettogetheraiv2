import React, { useMemo, useRef, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { Chart } from 'chart.js/auto';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Calendar, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter';

// ---- Sample data -----------------------------------------------------------
const startDate = new Date(2025, 0, 20, 8); // January 20, 2025 at 8 AM
const endDate   = new Date(2025, 0, 20, 18); // January 20, 2025 at 6 PM

const resources = [
  { id: 1, name: 'Lab #11',  capacity: 8 },
  { id: 2, name: 'Lab #12',  capacity: 10 },
  { id: 3, name: 'Lab #13',  capacity: 6 },
  { id: 4, name: 'X-Ray lab', capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

const events = [
  { id: 1, resourceId: 1, name: 'RNA Sequencing',       startDate,                       endDate: new Date(2025, 0, 20, 11) },
  { id: 2, resourceId: 1, name: 'Glycan analysis',      startDate: new Date(2025, 0, 20, 12), endDate: new Date(2025, 0, 20, 16) },
  { id: 3, resourceId: 2, name: 'Electron microscopy',  startDate: new Date(2025, 0, 20, 9),  endDate: new Date(2025, 0, 20, 12) },
  { id: 4, resourceId: 2, name: 'Covid variant analysis', startDate: new Date(2025, 0, 20, 13), endDate: new Date(2025, 0, 20, 17) },
  { id: 5, resourceId: 3, name: 'Bacterial identification', startDate: new Date(2025, 0, 20, 10), endDate: new Date(2025, 0, 20, 14) },
  { id: 6, resourceId: 4, name: 'Disinfectant efficacy', startDate: new Date(2025, 0, 20, 9), endDate: new Date(2025, 0, 20, 11) },
  { id: 7, resourceId: 5, name: 'DNA Sequencing',       startDate: new Date(2025, 0, 20, 12), endDate: new Date(2025, 0, 20, 16) }
];

// ---- Utilization helper ----------------------------------------------------
function computeUtilization(resourceId: number, evts: any[], sliceCount = 24) {
  const millis = endDate.getTime() - startDate.getTime();
  const slice = millis / sliceCount;
  const buckets = new Array(sliceCount).fill(0);
  evts.filter(e => e.resourceId === resourceId).forEach(e => {
    const s = Math.max(0, Math.floor((new Date(e.startDate).getTime() - startDate.getTime()) / slice));
    const t = Math.min(sliceCount, Math.ceil((new Date(e.endDate).getTime() - startDate.getTime()) / slice));
    for (let i = s; i < t; i++) buckets[i] += 1;
  });
  return buckets;
}

// ---- Row Expander Chart widget ---------------------------------------------
class UtilizationChartWidget {
  owner: any;
  chart: Chart | null = null;
  
  constructor(config: any) {
    this.owner = config.owner;
  }
  
  render({ record, rowElement }: any) {
    let canvas = rowElement.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.height = '100px';
      canvas.style.width = '100%';
      canvas.style.padding = '10px';
      rowElement.appendChild(canvas);
    }
    
    const data = computeUtilization(record.id, events);
    if (this.chart) this.chart.destroy();
    
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((_, i) => {
          const time = new Date(startDate.getTime() + (i * (endDate.getTime() - startDate.getTime()) / 24));
          return time.getHours() + ':' + String(time.getMinutes()).padStart(2, '0');
        }),
        datasets: [{
          label: 'Utilization',
          data,
          fill: true,
          backgroundColor: 'rgba(251, 146, 60, 0.2)',
          borderColor: 'rgb(251, 146, 60)',
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Load: ${context.parsed.y} task(s)`
            }
          }
        },
        scales: { 
          x: { 
            display: true,
            grid: { display: false },
            ticks: { 
              maxTicksLimit: 8,
              font: { size: 10 }
            }
          }, 
          y: { 
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { 
              stepSize: 1,
              font: { size: 10 }
            }
          }
        }
      }
    });
  }
}

// ---- Main component --------------------------------------------------------
export default function BryntumChartDemoPage() {
  const schedulerRef = useRef<any>(null);
  const [dataState, setDataState] = useState({ resources, events });
  const [, setLocation] = useLocation();

  const schedulerProps = useMemo(() => ({
    startDate,
    endDate,
    viewPreset : 'hourAndDay',
    rowHeight  : 60,
    barMargin  : 8,

    resources : dataState.resources,
    events    : dataState.events,

    // Using React wrapper feature syntax (featureName + "Feature")
    eventDragFeature : { 
      showTooltip : true,
      validatorFn: () => true // Allow all drags
    },
    eventEditFeature : true,
    timeRangesFeature : {
      showCurrentTimeLine: true
    },
    rowExpanderFeature : {
      widgetClass : UtilizationChartWidget,
      singleExpand : false // Allow multiple rows to be expanded
    },
    eventTooltipFeature: {
      template: (data: any) => `
        <div class="p-2">
          <div class="font-semibold">${data.eventRecord.name}</div>
          <div class="text-sm opacity-75">
            ${new Date(data.eventRecord.startDate).toLocaleTimeString()} - 
            ${new Date(data.eventRecord.endDate).toLocaleTimeString()}
          </div>
        </div>
      `
    },

    columns : [
      { 
        type : 'resourceInfo', 
        text : 'Lab', 
        width : 200, 
        field : 'name',
        renderer: ({ record }: any) => {
          return `
            <div class="flex items-center gap-2">
              <span class="font-medium">${record.name}</span>
            </div>
          `;
        }
      },
      { 
        text : 'Capacity', 
        width : 100, 
        field : 'capacity', 
        align : 'center',
        renderer: ({ value }: any) => {
          return `<span class="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded text-sm font-medium">${value}</span>`;
        }
      }
    ],

    eventStyle: 'colored',
    eventColor: 'orange',

    listeners : {
      eventDrop : () => {
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
      }
    }
  }), [dataState]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/20"
            onClick={() => setLocation('/bryntum-demo')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Demos
          </Button>
          <Badge className="bg-white text-orange-600">
            <BarChart3 className="w-3 h-3 mr-1" />
            Chart Integration Demo
          </Badge>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Scheduler Pro with Embedded Charts
        </h1>
        <p className="text-orange-100 mt-1">
          Row expander with real-time utilization charts using Chart.js
        </p>
      </div>

      {/* Info Card */}
      <Card className="m-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-orange-800 dark:text-orange-300">
            Interactive Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-orange-700 dark:text-orange-400">
              This demo showcases Bryntum Scheduler Pro with embedded Chart.js visualizations:
            </p>
            <ul className="list-disc list-inside space-y-1 text-orange-600 dark:text-orange-500">
              <li>Click the expander icon (▶) on any row to view its utilization chart</li>
              <li>Drag and drop events between resources and time slots</li>
              <li>Charts update automatically when events are moved</li>
              <li>Hover over chart points to see detailed load information</li>
              <li>Multiple rows can be expanded simultaneously</li>
            </ul>
            <div className="flex items-center gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline"
                className="border-orange-400 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                onClick={() => {
                  setDataState({ resources, events });
                  window.location.reload();
                }}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduler */}
      <div className="flex-1 p-4">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <div className="h-[600px]">
              <BryntumSchedulerPro
                ref={(ref: any) => { 
                  if (ref?.instance) {
                    schedulerRef.current = ref.instance;
                  }
                }}
                {...schedulerProps}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}