import { Card, CardContent } from '@/components/ui/card';
import { BryntumSchedulerWrapper } from '@/components/bryntum/BryntumSchedulerWrapper';
import { useQuery } from '@tanstack/react-query';

export default function DemoPage() {
  // Fetch stats for header
  const { data: operations } = useQuery({
    queryKey: ['/api/pt-operations'],
    enabled: true
  });
  
  const { data: resources } = useQuery({
    queryKey: ['/api/resources'],
    enabled: true
  });
  
  const { data: productionOrders } = useQuery({
    queryKey: ['/api/pt-jobs'],
    enabled: true
  });

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Header - styled like the screenshot */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white p-4 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Bryntum Scheduler Pro Demo</h1>
        <p className="text-center mt-1 text-orange-100">
          {(resources as any[])?.length || 0} Resources with {(operations as any[])?.length || 0} Production Operations
        </p>
      </div>

      {/* Bryntum Scheduler Chart */}
      <Card className="flex-1">
        <CardContent className="p-0 h-full">
          <BryntumSchedulerWrapper height="calc(100vh - 200px)" />
        </CardContent>
      </Card>
    </div>
  );
}