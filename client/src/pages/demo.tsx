import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Beer, Calendar, Factory, Package } from 'lucide-react';
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Beer className="h-6 w-6 text-amber-600" />
              <CardTitle>Brewery Production Schedule - Bryntum Gantt</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                <Factory className="h-3 w-3 mr-1" />
                {(resources as any[])?.length || 0} Resources
              </Badge>
              <Badge variant="secondary">
                <Calendar className="h-3 w-3 mr-1" />
                {(operations as any[])?.length || 0} Operations
              </Badge>
              <Badge variant="secondary">
                <Package className="h-3 w-3 mr-1" />
                {(productionOrders as any[])?.length || 0} Jobs
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bryntum Scheduler Chart */}
      <Card className="flex-1">
        <CardContent className="p-0 h-full">
          <BryntumSchedulerWrapper height="calc(100vh - 200px)" />
        </CardContent>
      </Card>
    </div>
  );
}