import { PresetStore, ViewPreset } from '@bryntum/schedulerpro';

export interface GanttPresetConfig {
  id: string;
  name: string;
  base: string;
  tickSize: number;
  tickWidth?: number;
  displayDateFormat?: string;
  shiftUnit: string;
  shiftIncrement: number;
  defaultSpan: number;
  timeResolution?: {
    unit: string;
    increment: number;
  };
  headers?: any[];
  columnLinesFor?: number;
}

export interface GanttViewConfig {
  startDate: Date;
  endDate: Date;
  viewPreset: string;
  barMargin: number;
  rowHeight: number;
  eventColor?: string;
  eventStyle?: string;
  columns: any[];
  features: any;
}

export interface ZoomLevel {
  preset: string;
  startDate?: Date;
  endDate?: Date;
  centerDate?: Date;
  width?: number;
}

export class GanttConfigService {
  private static instance: GanttConfigService;
  private currentConfig: GanttViewConfig | null = null;
  private zoomLevels: ZoomLevel[] = [];
  private currentZoomLevel: number = 4;
  
  private constructor() {
    this.initializeZoomLevels();
  }
  
  static getInstance(): GanttConfigService {
    if (!GanttConfigService.instance) {
      GanttConfigService.instance = new GanttConfigService();
    }
    return GanttConfigService.instance;
  }
  
  /**
   * Initialize zoom levels for the scheduler
   */
  private initializeZoomLevels(): void {
    this.zoomLevels = [
      { preset: 'minuteAndHour', width: 30 },
      { preset: 'hourAndDay', width: 40 },
      { preset: 'dayAndWeek', width: 50 },
      { preset: 'weekAndDay', width: 60 },
      { preset: 'weekAndMonth', width: 70 },
      { preset: 'weekAndDayLetter', width: 80 },
      { preset: 'monthAndYear', width: 90 },
      { preset: 'year', width: 100 },
      { preset: 'manyYears', width: 200 }
    ];
  }
  
  /**
   * Get default configuration for the scheduler
   */
  getDefaultConfig(): GanttViewConfig {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // 2 weeks view
    
    return {
      startDate,
      endDate,
      viewPreset: 'weekAndDay',
      barMargin: 5,
      rowHeight: 45,
      eventColor: 'blue',
      eventStyle: 'rounded',
      columns: this.getDefaultColumns(),
      features: this.getDefaultFeatures()
    };
  }
  
  /**
   * Get default columns configuration
   */
  getDefaultColumns(): any[] {
    return [
      { 
        text: 'Resources', 
        field: 'name', 
        width: 250,
        editor: false,
        renderer: ({ record, value }: any) => {
          if (!record || !record.type || !value) return value || '';
          const iconCls = this.getResourceIcon(record.type);
          return `<i class="${iconCls}"></i> ${value}`;
        }
      },
      { 
        text: 'Type', 
        field: 'type', 
        width: 100,
        editor: false
      },
      { 
        text: 'Department', 
        field: 'department', 
        width: 120,
        editor: false
      },
      { 
        text: 'Capacity %', 
        field: 'capacity', 
        width: 100,
        align: 'center',
        editor: false,
        renderer: ({ value }: any) => {
          if (value === undefined || value === null) return '';
          const cls = value > 80 ? 'capacity-high' : value > 50 ? 'capacity-medium' : 'capacity-low';
          return `<span class="${cls}">${value}%</span>`;
        }
      },
      {
        text: 'Status',
        field: 'status',
        width: 100,
        editor: false,
        renderer: ({ record }: any) => {
          if (!record) return '';
          const status = record.isBottleneck ? 'Bottleneck' : 'Available';
          const cls = record.isBottleneck ? 'status-bottleneck' : 'status-available';
          return `<span class="${cls}">${status}</span>`;
        }
      }
    ];
  }
  
  /**
   * Get default features configuration
   */
  getDefaultFeatures(): any {
    return {
      // Core scheduling features
      dependencies: true,
      dependencyEdit: true,
      
      // Event manipulation  
      eventDrag: {
        constrainDragToResource: false
      },
      eventDragCreate: true,
      eventEdit: true,
      eventResize: true,
      eventTooltip: true,
      
      // Basic UI features
      cellEdit: false,
      columnLines: true,
      columnReorder: true,
      columnResize: true,
      filterBar: false,
      group: false,
      nonWorkingTime: true,
      percentBar: true,
      regionResize: true,
      sort: 'name',
      stripe: true,
      tree: true,
      
      // Time ranges
      timeRanges: {
        showCurrentTimeLine: true
      }
    };
  }
  
  /**
   * Get event edit dialog items configuration
   */
  private getEventEditItems(): any {
    return {
      generalTab: {
        items: {
          name: { label: 'Operation Name' },
          resourceField: { label: 'Assigned Resource' },
          startDateField: { label: 'Start Time' },
          endDateField: { label: 'End Time' },
          percentDoneField: { label: 'Progress %' },
          effortField: { label: 'Effort (hours)' }
        }
      },
      notesTab: {
        items: {
          noteField: {
            type: 'textarea',
            label: 'Notes',
            height: 200
          }
        }
      },
      predecessorsTab: true,
      successorsTab: true,
      advancedTab: {
        items: {
          constraintTypeField: { label: 'Constraint Type' },
          constraintDateField: { label: 'Constraint Date' },
          manuallyScheduledField: { label: 'Manually Scheduled' }
        }
      }
    };
  }
  
  /**
   * Get event tooltip template
   */
  private getEventTooltipTemplate(): any {
    return (data: any) => {
      const { eventRecord } = data;
      return `
        <div class="b-sch-event-tooltip">
          <h4>${eventRecord.name}</h4>
          <dl>
            <dt>Start:</dt><dd>${eventRecord.startDate?.toLocaleString()}</dd>
            <dt>End:</dt><dd>${eventRecord.endDate?.toLocaleString()}</dd>
            <dt>Duration:</dt><dd>${eventRecord.duration} ${eventRecord.durationUnit}</dd>
            <dt>Progress:</dt><dd>${eventRecord.percentDone}%</dd>
            ${eventRecord.note ? `<dt>Notes:</dt><dd>${eventRecord.note}</dd>` : ''}
          </dl>
        </div>
      `;
    };
  }
  
  /**
   * Get context menu items
   */
  private getContextMenuItems(): any {
    return {
      addEvent: {
        text: 'Add Operation',
        icon: 'b-fa b-fa-plus',
        weight: 100
      },
      editEvent: {
        text: 'Edit Operation',
        icon: 'b-fa b-fa-edit',
        weight: 200
      },
      deleteEvent: {
        text: 'Delete Operation',
        icon: 'b-fa b-fa-trash',
        weight: 300
      },
      '-': { weight: 400 },
      expandAll: {
        text: 'Expand All',
        icon: 'b-fa b-fa-expand',
        weight: 500
      },
      collapseAll: {
        text: 'Collapse All',
        icon: 'b-fa b-fa-compress',
        weight: 600
      }
    };
  }
  
  /**
   * Get schedule context menu items
   */
  private getScheduleContextMenuItems(): any {
    return {
      addEvent: {
        text: 'Schedule Operation Here',
        icon: 'b-fa b-fa-plus-circle'
      },
      '-': null,
      zoomIn: {
        text: 'Zoom In',
        icon: 'b-fa b-fa-search-plus'
      },
      zoomOut: {
        text: 'Zoom Out',
        icon: 'b-fa b-fa-search-minus'
      },
      zoomToFit: {
        text: 'Zoom to Fit',
        icon: 'b-fa b-fa-expand-arrows-alt'
      }
    };
  }
  
  /**
   * Validate drag operation
   */
  private validateDrag({ draggedRecords, targetRecord }: any): boolean {
    // Add custom validation logic here
    // For example, prevent dragging to a resource that's at full capacity
    if (targetRecord && targetRecord.capacity >= 100) {
      return false;
    }
    return true;
  }
  
  /**
   * Render summary for groups
   */
  private renderSummary({ events }: any): string {
    const count = events.length;
    const completed = events.filter((e: any) => e.percentDone === 100).length;
    return `${count} operations (${completed} completed)`;
  }
  
  /**
   * Get resource icon based on type
   */
  private getResourceIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'Equipment': 'b-fa b-fa-cogs',
      'Human': 'b-fa b-fa-user',
      'Facility': 'b-fa b-fa-building',
      'Material': 'b-fa b-fa-box',
      'Tool': 'b-fa b-fa-wrench'
    };
    return iconMap[type] || 'b-fa b-fa-cube';
  }
  
  /**
   * Zoom in
   */
  zoomIn(): ZoomLevel | null {
    if (this.currentZoomLevel > 0) {
      this.currentZoomLevel--;
      return this.zoomLevels[this.currentZoomLevel];
    }
    return null;
  }
  
  /**
   * Zoom out
   */
  zoomOut(): ZoomLevel | null {
    if (this.currentZoomLevel < this.zoomLevels.length - 1) {
      this.currentZoomLevel++;
      return this.zoomLevels[this.currentZoomLevel];
    }
    return null;
  }
  
  /**
   * Zoom to fit
   */
  zoomToFit(): ZoomLevel {
    this.currentZoomLevel = 4; // Default middle zoom
    return this.zoomLevels[this.currentZoomLevel];
  }
  
  /**
   * Get current zoom level
   */
  getCurrentZoomLevel(): ZoomLevel {
    return this.zoomLevels[this.currentZoomLevel];
  }
  
  /**
   * Set zoom level by preset name
   */
  setZoomLevel(presetName: string): ZoomLevel | null {
    const index = this.zoomLevels.findIndex(z => z.preset === presetName);
    if (index !== -1) {
      this.currentZoomLevel = index;
      return this.zoomLevels[index];
    }
    return null;
  }
  
  /**
   * Save current configuration
   */
  saveConfig(config: GanttViewConfig): void {
    this.currentConfig = config;
    // TODO: Save to backend/localStorage
    localStorage.setItem('ganttConfig', JSON.stringify(config));
  }
  
  /**
   * Load saved configuration
   */
  loadConfig(): GanttViewConfig | null {
    const saved = localStorage.getItem('ganttConfig');
    if (saved) {
      this.currentConfig = JSON.parse(saved);
      return this.currentConfig;
    }
    return null;
  }
}