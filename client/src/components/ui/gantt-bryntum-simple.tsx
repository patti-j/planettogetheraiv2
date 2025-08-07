/**
 * Simple Bryntum Gantt Wrapper - Minimal Configuration for Trial Version
 * 
 * This component loads the Bryntum Gantt chart with minimal configuration
 * to avoid feature compatibility issues with the trial version.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Dynamic import for Bryntum Gantt from local trial files
let BryntumGantt: any = null;

interface SimpleGanttProps {
  operations: any[];
  productionOrders: any[];
  resources: any[];
  rowHeight?: number;
  onOperationUpdate?: (operation: any) => Promise<void>;
  onOperationMove?: (operationId: number, newResourceId: number, newStartTime: Date) => Promise<void>;
  onExportReady?: (handler: () => Promise<void>) => void;
}

export function SimpleBryntumGantt({
  operations,
  productionOrders,
  resources,
  rowHeight = 80,
  onOperationUpdate,
  onOperationMove,
  onExportReady
}: SimpleGanttProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstanceRef = useRef<any>(null);
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);

  // Transform operations to simple Bryntum tasks
  const transformToTasks = () => {
    return operations.map((op, index) => ({
      id: op.id,
      name: `${op.operationName}`,
      startDate: new Date(op.startTime || Date.now()),
      duration: Math.max(1, (op.standardDuration || 60) / 60), // Convert minutes to hours, minimum 1 hour
      percentDone: op.completionPercentage || 0,
      resourceId: op.workCenterId || 1,
      status: op.status || 'scheduled'
    }));
  };

  // Transform resources to simple format
  const transformToResources = () => {
    return resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      type: resource.type || 'resource'
    }));
  };

  // Minimal Bryntum configuration
  const ganttConfig = {
    height: '100%',
    width: '100%',
    rowHeight: rowHeight,
    
    // Basic timeline
    startDate: new Date(2025, 7, 1), // August 1, 2025
    endDate: new Date(2025, 7, 31),   // August 31, 2025
    viewPreset: 'dayAndWeek',
    
    // Simple columns
    columns: [
      { type: 'name', field: 'name', text: 'Operation', width: 200 },
      { type: 'startdate', width: 120, text: 'Start' },
      { type: 'duration', width: 80, text: 'Hours' }
    ],
    
    // Disable all advanced features to avoid errors
    features: {
      taskEdit: false,
      taskDrag: false,
      taskResize: false,
      dependencies: false,
      criticalPath: false,
      progressLine: false
    }
  };

  // Load Bryntum and initialize
  useEffect(() => {
    const loadBryntum = async () => {
      // Check if already loaded
      if ((window as any).bryntum?.gantt?.Gantt) {
        BryntumGantt = (window as any).bryntum.gantt.Gantt;
        initializeGantt();
        return;
      }

      // Load script
      console.log('📦 Loading Bryntum script from /gantt.umd.js...');
      const script = document.createElement('script');
      script.src = '/gantt.umd.js';
      script.onload = () => {
        console.log('📜 Bryntum script loaded, checking for Gantt class...');
        setTimeout(() => {
          BryntumGantt = (window as any).bryntum?.gantt?.Gantt || (window as any).Gantt;
          console.log('🎯 Bryntum Gantt class available:', !!BryntumGantt);
          console.log('🔍 Window bryntum object:', (window as any).bryntum);
          
          if (BryntumGantt) {
            console.log('🔄 Calling initializeGantt...');
            initializeGantt();
          } else {
            console.error('❌ Bryntum Gantt class not found in window object');
            setIsReady(false);
          }
        }, 200); // Increase timeout slightly
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Bryntum script:', error);
        setIsReady(false);
      };
      
      document.head.appendChild(script);
    };

    const initializeGantt = async () => {
      console.log('🔍 initializeGantt called - checking conditions...');
      console.log('ganttRef.current:', !!ganttRef.current);
      console.log('ganttInstanceRef.current:', !!ganttInstanceRef.current);  
      console.log('BryntumGantt:', !!BryntumGantt);
      console.log('operations length:', operations?.length || 0);
      console.log('resources length:', resources?.length || 0);
      
      if (ganttRef.current && !ganttInstanceRef.current && BryntumGantt) {
        try {
          console.log('🏗️ Initializing Bryntum Gantt with data:');
          const tasks = transformToTasks();
          const ganttResources = transformToResources();
          
          console.log(`📊 Tasks: ${tasks.length}, Resources: ${ganttResources.length}`);
          console.log('📋 Sample task:', tasks[0]);
          console.log('🏭 Sample resource:', ganttResources[0]);

          console.log('🚀 Creating Bryntum Gantt instance...');
          ganttInstanceRef.current = new BryntumGantt({
            appendTo: ganttRef.current,
            ...ganttConfig,
            tasks: tasks,
            resources: ganttResources
          });

          console.log('✅ Bryntum Gantt initialized successfully!');
          console.log('📈 Gantt instance:', ganttInstanceRef.current);
          setIsReady(true);

          toast({
            title: "Professional Gantt Loaded",
            description: `${tasks.length} operations displayed in Bryntum Gantt`,
          });
        } catch (error) {
          console.error('❌ Failed to initialize Bryntum Gantt:', error);
          console.error('Error details:', error.message);
          setIsReady(false);
        }
      }
    };

    loadBryntum();

    return () => {
      if (ganttInstanceRef.current) {
        ganttInstanceRef.current.destroy();
        ganttInstanceRef.current = null;
      }
    };
  }, []);

  // Update data when operations change
  useEffect(() => {
    if (ganttInstanceRef.current && isReady) {
      try {
        const tasks = transformToTasks();
        const ganttResources = transformToResources();
        
        ganttInstanceRef.current.project.loadInlineData({
          tasks: tasks,
          resources: ganttResources
        });
      } catch (error) {
        console.error('Failed to update Gantt data:', error);
      }
    }
  }, [operations, resources, isReady]);

  if (!isReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded-lg border-2 border-dashed">
        <div className="text-center p-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            <span className="text-lg font-semibold">Loading Bryntum Gantt...</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Initializing professional Gantt chart with trial features
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={ganttRef} 
      className="h-full w-full bryntum-gantt-container"
      style={{ height: '100%', width: '100%' }}
    />
  );
}