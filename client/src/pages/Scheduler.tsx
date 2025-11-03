import { useEffect } from 'react';

export default function SchedulerPage() {
  useEffect(() => {
    // Update the page title
    document.title = 'Scheduler | Production Planning';
  }, []);

  return (
    <div className="h-full w-full">
      <iframe
        src="/api/v1/production-scheduler"
        className="w-full h-full border-0"
        style={{ minHeight: 'calc(100vh - 64px)' }}
        title="Production Scheduler"
      />
    </div>
  );
}