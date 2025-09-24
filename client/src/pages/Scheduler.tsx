import { useEffect } from 'react';
import BryntumScheduler from '@/components/BryntumScheduler';

export default function SchedulerPage() {
  useEffect(() => {
    // Update the page title
    document.title = 'Scheduler | Production Planning';
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-shrink-0 px-6 py-4 border-b">
        <h1 className="text-2xl font-bold text-foreground">Production Scheduler</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag and drop to schedule operations, manage resources, and track dependencies
        </p>
      </div>
      
      <div className="h-[calc(100vh-96px)]">
        <BryntumScheduler />
      </div>
    </div>
  );
}