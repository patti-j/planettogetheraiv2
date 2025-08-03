import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cog, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EquipmentStatusWidgetProps {
  configuration?: {
    equipment?: string[];
    [key: string]: any;
  };
  className?: string;
  isMobile?: boolean;
  compact?: boolean;
}

export default function EquipmentStatusWidget({ 
  configuration = {}, 
  className = "",
  isMobile = false,
  compact = false 
}: EquipmentStatusWidgetProps) {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['/api/resources'],
    queryFn: async () => {
      const response = await fetch('/api/resources');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Cog className="w-5 h-5" />
            Equipment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'running':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'maintenance':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'offline':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Cog className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'running':
        return "default";
      case 'maintenance':
      case 'warning':
        return "secondary";
      case 'offline':
      case 'error':
        return "destructive";
      default:
        return "outline";
    }
  };

  const equipment = resources?.filter((r: any) => r.type === 'Equipment') || [];
  const activeCount = equipment.filter((e: any) => e.status?.toLowerCase() === 'active').length;
  const totalCount = equipment.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Cog className="w-5 h-5" />
          Equipment Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {equipment.slice(0, compact || isMobile ? 3 : 5).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status)}
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <Badge variant={getStatusVariant(item.status)} className="text-xs">
                {item.status || 'Unknown'}
              </Badge>
            </div>
          ))}
        </div>
        
        {!compact && !isMobile && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Active Equipment</span>
              <span className="font-medium">{activeCount}/{totalCount}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}