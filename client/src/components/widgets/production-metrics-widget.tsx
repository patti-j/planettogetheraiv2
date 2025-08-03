import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Factory, TrendingUp, Activity, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ProductionMetricsWidgetProps {
  configuration?: {
    metrics?: string[];
    [key: string]: any;
  };
  className?: string;
  isMobile?: boolean;
  compact?: boolean;
}

export default function ProductionMetricsWidget({ 
  configuration = {}, 
  className = "",
  isMobile = false,
  compact = false 
}: ProductionMetricsWidgetProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/metrics');
      return response.json();
    }
  });

  const { data: operations } = useQuery({
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
            <Factory className="w-5 h-5" />
            Production Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const outputRate = operations?.filter((op: any) => op.status === 'completed').length || 0;
  const efficiency = Math.round((outputRate / Math.max(operations?.length || 1, 1)) * 100);
  const qualityScore = metrics?.qualityScore || 95;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Factory className="w-5 h-5" />
          Production Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid ${compact || isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-3 gap-4'}`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Output</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{outputRate}</div>
            <div className="text-xs text-gray-500">units/day</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Efficiency</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{efficiency}%</div>
            <div className="text-xs text-gray-500">target: 85%</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Quality</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{qualityScore}%</div>
            <div className="text-xs text-gray-500">target: 98%</div>
          </div>
        </div>
        
        {!compact && !isMobile && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <Badge variant={efficiency >= 85 ? "default" : "destructive"}>
                {efficiency >= 85 ? "On Target" : "Below Target"}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}