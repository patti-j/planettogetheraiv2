import { Card, CardContent } from '@/components/ui/card';
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
    <div className="flex flex-col h-screen p-4 space-y-4">
      {/* Header - styled like the screenshot */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white p-4 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Bryntum Scheduler Pro Demo</h1>
        <p className="text-center mt-1 text-orange-100">
          {(resources as any[])?.length || 0} Resources with {(operations as any[])?.length || 0} Production Operations
        </p>
      </div>

      {/* Scheduler placeholder */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Scheduler Demo</h2>
            <p className="text-gray-600">
              Visit <a href="/basic-scheduler" className="text-blue-600 hover:underline">Basic Scheduler Demo</a> to see the working scheduler
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}