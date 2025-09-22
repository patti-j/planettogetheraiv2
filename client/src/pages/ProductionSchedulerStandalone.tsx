import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ProductionSchedulerStandalone() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header with back button */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <Link href="/production-schedule">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Production Schedule
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Standalone Blazor Scheduler
        </h1>
        <div className="w-[180px]"></div> {/* Spacer for centering */}
      </div>
      
      {/* Iframe container */}
      <iframe
        src="/scheduler-blazor/"
        title="Scheduler (Blazor vanilla)"
        className="flex-1 border-0"
        style={{ width: '100%' }}
      />
    </div>
  );
}