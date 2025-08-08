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
      const win = window as any;
      
      // Try multiple paths to find Bryntum
      if (win.bryntum?.gantt?.Gantt || win.bryntum?.gantt || win.gantt?.Gantt) {
        console.log('✅ Bryntum already loaded, accessing Gantt class...');
        BryntumGantt = win.bryntum?.gantt?.Gantt || win.bryntum?.gantt || win.gantt?.Gantt || win.Gantt;
        
        if (BryntumGantt) {
          console.log('📊 Found Bryntum Gantt class:', BryntumGantt);
          initializeGantt();
          return;
        }
      }

      // Load script
      console.log('📦 Loading Bryntum script from /gantt.umd.js...');
      const script = document.createElement('script');
      script.src = '/gantt.umd.js';
      script.onload = () => {
        console.log('📜 Bryntum script loaded, checking for Gantt class...');
        setTimeout(() => {
          const win = window as any;
          
          // Log what's available
          console.log('🔍 Window properties after load:');
          console.log('window.bryntum:', win.bryntum);
          
          // Check all possible locations for Gantt class
          if (win.bryntum) {
            console.log('✅ Found bryntum namespace');
            console.log('🔍 Bryntum keys:', Object.keys(win.bryntum).slice(0, 20));
            
            // First check for lowercase gantt namespace with capital Gantt class
            if (win.bryntum.gantt && win.bryntum.gantt.Gantt) {
              BryntumGantt = win.bryntum.gantt.Gantt;
              console.log('✅ Found Gantt at window.bryntum.gantt.Gantt!');
            }
            // Then check for Gantt with capital G directly on bryntum
            else if (win.bryntum.Gantt) {
              BryntumGantt = win.bryntum.Gantt;
              console.log('✅ Found Gantt at window.bryntum.Gantt!');
            }
            // Check gantt namespace exists
            else if (win.bryntum.gantt) {
              console.log('🔍 Found gantt namespace, keys:', Object.keys(win.bryntum.gantt).slice(0, 20));
              // The gantt namespace is a module, let's check if it has default export or named exports
              console.log('🔍 Gantt module type:', typeof win.bryntum.gantt);
              console.log('🔍 Checking for default export:', win.bryntum.gantt.default);
              
              // Based on Bryntum docs, in UMD the Gantt should be at bryntum.gantt.Gantt
              // But it seems to be a Proxy, let's try to access it anyway
              try {
                const GanttClass = win.bryntum.gantt.Gantt;
                if (GanttClass) {
                  BryntumGantt = GanttClass;
                  console.log('✅ Found Gantt class via bryntum.gantt.Gantt (from Proxy)');
                }
              } catch (e) {
                console.error('Error accessing Gantt from Proxy:', e);
              }
            }
            
            // Try looking for any key containing Gantt
            if (!BryntumGantt) {
              console.log('🔍 Searching for Gantt in all bryntum properties...');
              for (const key of Object.keys(win.bryntum)) {
                if (key.includes('Gantt') || key.includes('gantt')) {
                  console.log(`Found potential Gantt key: ${key}`, typeof win.bryntum[key]);
                  if (typeof win.bryntum[key] === 'function') {
                    BryntumGantt = win.bryntum[key];
                    console.log(`✅ Using ${key} as Gantt class`);
                    break;
                  }
                }
              }
            }
          }
          
          console.log('🎯 Bryntum Gantt class found:', !!BryntumGantt);
          
          if (BryntumGantt) {
            console.log('🔄 Calling initializeGantt...');
            console.log('Gantt constructor type:', typeof BryntumGantt);
            initializeGantt();
          } else {
            console.error('❌ Bryntum Gantt class not found');
            console.error('Bryntum structure:', win.bryntum);
            setIsReady(false);
          }
        }, 500); // Give more time for script to fully load
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Bryntum script:', error);
        setIsReady(false);
      };
      
      document.head.appendChild(script);
    };

    const initializeGantt = async () => {
      console.log('🔍 initializeGantt called - checking conditions...');
      console.log('ganttRef.current:', ganttRef.current);
      console.log('ganttRef.current exists:', !!ganttRef.current);
      console.log('ganttInstanceRef.current:', ganttInstanceRef.current);  
      console.log('BryntumGantt:', BryntumGantt);
      console.log('BryntumGantt type:', typeof BryntumGantt);
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
          console.log('Config being passed:', {
            appendTo: ganttRef.current,
            ...ganttConfig,
            tasksLength: tasks.length,
            resourcesLength: ganttResources.length
          });
          
          try {
            // Try creating the Gantt instance
            console.log('🔨 Attempting to create Gantt with BryntumGantt:', typeof BryntumGantt);
            console.log('🔨 Container element:', ganttRef.current);
            
            const ganttInstance = new BryntumGantt({
              appendTo: ganttRef.current,
              height: 600,
              width: '100%',
              columns: [
                { text: 'Name', field: 'name', width: 250 }
              ],
              tasks: tasks
            });
            
            console.log('🔨 Gantt instance created:', ganttInstance);
            console.log('🔨 Instance element:', ganttInstance.element);
            console.log('🔨 Instance rendered:', ganttInstance.rendered);
            
            ganttInstanceRef.current = ganttInstance;
            console.log('✅ Bryntum Gantt initialized successfully!');
            
            // Force render and state update
            setTimeout(() => {
              if (ganttInstance.element) {
                console.log('🎨 Gantt element exists, making visible');
                ganttInstance.element.style.display = 'block';
              }
              setIsReady(true);
              console.log('🎨 State updated - Gantt UI should now be visible');
            }, 500);

            toast({
              title: "Professional Gantt Loaded",
              description: `${tasks.length} operations displayed in Bryntum Gantt`,
            });
          } catch (innerError) {
            console.error('❌ Error during Gantt instantiation:', innerError);
            console.error('Stack trace:', innerError.stack);
            throw innerError;
          }
        } catch (error) {
          console.error('❌ Failed to initialize Bryntum Gantt:', error);
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
          
          // Try a minimal configuration
          console.log('🔧 Attempting minimal configuration...');
          try {
            const minimalGantt = new BryntumGantt({
              appendTo: ganttRef.current
            });
            ganttInstanceRef.current = minimalGantt;
            console.log('✅ Minimal Gantt created');
            setTimeout(() => {
              setIsReady(true);
              console.log('🎨 Minimal Gantt UI should now be visible');
            }, 100);
          } catch (minimalError) {
            console.error('❌ Even minimal config failed:', minimalError);
            setIsReady(false);
          }
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