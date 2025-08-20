import React, { useMemo, useRef, useState } from 'react';
import { BryntumSchedulerPro } from '@bryntum/schedulerpro-react';
import '@bryntum/schedulerpro/schedulerpro.stockholm.css';
import { Chart } from 'chart.js/auto';

// ---- Sample data -----------------------------------------------------------
const startDate = new Date(2025, 3, 1, 8);
const endDate   = new Date(2025, 3, 1, 18);

const resources = [
  { id: 1, name: 'Lab #11',  capacity: 8 },
  { id: 2, name: 'Lab #12',  capacity: 10 },
  { id: 3, name: 'Lab #13',  capacity: 6 },
  { id: 4, name: 'X-Ray lab', capacity: 4 },
  { id: 5, name: 'Biosafety L3', capacity: 5 }
];

const events = [
  { id: 1, resourceId: 1, name: 'RNA Sequencing',       startDate,                       endDate: new Date(2025, 3, 1, 11) },
  { id: 2, resourceId: 1, name: 'Glycan analysis',      startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) },
  { id: 3, resourceId: 2, name: 'Electron microscopy',  startDate: new Date(2025, 3, 1, 9),  endDate: new Date(2025, 3, 1, 12) },
  { id: 4, resourceId: 2, name: 'Covid variant analysis', startDate: new Date(2025, 3, 1, 13), endDate: new Date(2025, 3, 1, 17) },
  { id: 5, resourceId: 3, name: 'Bacterial identification', startDate: new Date(2025, 3, 1, 10), endDate: new Date(2025, 3, 1, 14) },
  { id: 6, resourceId: 4, name: 'Disinfectant efficacy', startDate: new Date(2025, 3, 1, 9), endDate: new Date(2025, 3, 1, 11) },
  { id: 7, resourceId: 5, name: 'DNA Sequencing',       startDate: new Date(2025, 3, 1, 12), endDate: new Date(2025, 3, 1, 16) }
];

// ---- Utilization helper ----------------------------------------------------
function computeUtilization(resourceId: number, evts: typeof events, sliceCount = 24) {
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
  chart?: Chart;

  constructor(config: any) {
    this.owner = config.owner;
  }

  render({ record, rowElement }: any) {
    let canvas = rowElement.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      rowElement.appendChild(canvas);
    }
    const data = computeUtilization(record.id, events);
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          label: 'Load',
          data,
          fill: false,
          tension: 0.3,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (context) => {
                const hour = Math.floor(context[0].parsed.x / 2.4) + 8;
                return `Time: ${hour}:00`;
              },
              label: (context) => `Utilization: ${context.parsed.y} task(s)`
            }
          }
        },
        scales: { 
          x: { 
            display: false 
          }, 
          y: { 
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          } 
        }
      }
    });
  }
}

// ---- Main component --------------------------------------------------------
export default function BryntumChartDemo() {
  const schedulerRef = useRef<any>(null);
  const [dataState, setDataState] = useState({ resources, events });

  const schedulerProps = useMemo(() => ({
    startDate,
    endDate,
    viewPreset : 'hourAndDay',
    rowHeight  : 100,
    barMargin  : 8,

    resources : dataState.resources,
    events    : dataState.events,

    features : {
      eventDrag : { 
        showTooltip : true 
      },
      eventEdit : true,
      timeRanges : true,
      rowExpander : {
        widgetClass : UtilizationChartWidget,
        singleExpand : false
      }
    },

    columns : [
      { 
        type : 'resourceInfo' as const, 
        text : 'Lab', 
        width : 200, 
        field : 'name',
        showEventCount: false
      },
      { 
        text : 'Capacity', 
        width : 100, 
        field : 'capacity', 
        align : 'center' as const,
        renderer: ({ value }: any) => `${value} stations`
      }
    ],

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
        
        // Force re-render of expanded charts
        const expandedRows = instance.features.rowExpander.expandedRecords;
        expandedRows.forEach((record: any) => {
          const widget = instance.features.rowExpander.getWidget(record);
          if (widget) {
            widget.render({ record, rowElement: instance.getRowFor(record) });
          }
        });
      }
    }
  }), [dataState]);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-screen-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Scheduler Pro – Row Expander with Chart.js
          </h1>
          <p className="text-gray-600">
            Click the expander icon on a row to see a utilization chart for that resource. 
            Drag events to see the charts update in real-time.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-4">
          <BryntumSchedulerPro
            ref={(ref: any) => { schedulerRef.current = ref?.instance; }}
            {...schedulerProps}
          />
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Expandable rows with charts</li>
              <li>• Real-time utilization tracking</li>
              <li>• Drag & drop event scheduling</li>
              <li>• Resource capacity display</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. Click the arrow icon to expand a row</li>
              <li>2. View the utilization chart</li>
              <li>3. Drag events to reschedule</li>
              <li>4. Charts update automatically</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Chart Details</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• X-axis: Time periods</li>
              <li>• Y-axis: Number of tasks</li>
              <li>• Updates on event changes</li>
              <li>• Hover for tooltips</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}