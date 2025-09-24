import { useEffect } from 'react';
import BryntumScheduler from '@/components/BryntumScheduler';

export default function SchedulerPage() {
  useEffect(() => {
    // Update the page title
    document.title = 'Scheduler | Production Planning';
  }, []);

  return (
    <div className="h-full w-full">
      <BryntumScheduler />
    </div>
  );
}