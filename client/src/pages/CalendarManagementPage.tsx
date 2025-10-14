import CalendarManagement from '@/components/production-scheduler/CalendarManagement';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function CalendarManagementPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Link href="/production-scheduler">
          <Button variant="ghost" className="mb-4" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scheduler
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Calendar Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Set up working hours, maintenance windows, and scheduling constraints for your production facility.
        </p>
      </div>

      <CalendarManagement />

      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Understanding Scheduling Constraints</h3>
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">Per-Operation Constraints:</h4>
            <p>Each operation in your schedule can have individual constraints that control when it can be scheduled.</p>
          </div>
          
          <div>
            <h4 className="font-medium">Available Constraint Types:</h4>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><strong>Must Start On (MSO)</strong>: Operation must start exactly on specified date</li>
              <li><strong>Must Finish On (MFO)</strong>: Operation must finish exactly on specified date</li>
              <li><strong>Start No Earlier Than (SNET)</strong>: Operation cannot start before specified date</li>
              <li><strong>Finish No Earlier Than (FNET)</strong>: Operation cannot finish before specified date</li>
              <li><strong>Start No Later Than (SNLT)</strong>: Operation must start by specified date</li>
              <li><strong>Finish No Later Than (FNLT)</strong>: Operation must finish by specified date</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium">Working Time Calculation:</h4>
            <p>The scheduler automatically adjusts operation durations based on:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Project calendar (facility-wide working hours)</li>
              <li>Resource calendars (individual machine/worker availability)</li>
              <li>Maintenance periods (planned downtime)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium">Manual Scheduling:</h4>
            <p>
              Operations marked as "manually scheduled" bypass all automatic calculations and maintain
              their exact position regardless of algorithm changes or constraint adjustments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}