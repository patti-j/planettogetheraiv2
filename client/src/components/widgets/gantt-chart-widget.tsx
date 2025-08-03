import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface GanttChartWidgetProps {
  configuration?: {
    view?: string;
    resources?: string[];
    [key: string]: any;
  };
  className?: string;
  isMobile?: boolean;
  compact?: boolean;
}

export default function GanttChartWidget({ 
  configuration = {}, 
  className = "",
  isMobile = false,
  compact = false 
}: GanttChartWidgetProps) {
  const { data: operations, isLoading } = useQuery({
    queryKey: ['/api/operations'],
    queryFn: async () => {
      const response = await fetch('/api/operations');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Gantt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'scheduled':
        return 'bg-yellow-500';
      case 'delayed':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return "default";
      case 'in-progress':
        return "secondary"; 
      case 'delayed':
        return "destructive";
      default:
        return "outline";
    }
  };

  const scheduleItems = operations?.slice(0, compact || isMobile ? 4 : 6).map((op: any) => ({
    id: op.id,
    name: op.operation_name || `Operation ${op.operation_id}`,
    resource: op.resource_name || 'Unassigned',
    status: op.status || 'scheduled',
    startTime: op.start_time,
    endTime: op.end_time,
    duration: op.duration || 60
  })) || [];

  const completedCount = operations?.filter((op: any) => op.status === 'completed').length || 0;
  const totalCount = operations?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule Gantt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scheduleItems.map((item: any) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <Badge variant={getStatusVariant(item.status)} className="text-xs">
                  {item.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>{item.resource}</span>
                <span>•</span>
                <span>{item.duration}min</span>
              </div>
              {!compact && !isMobile && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                    style={{ 
                      width: item.status === 'completed' ? '100%' : 
                             item.status === 'in-progress' ? '60%' : '0%' 
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {!compact && !isMobile && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}