import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface QualityDashboardWidgetProps {
  configuration?: {
    tests?: string[];
    [key: string]: any;
  };
  className?: string;
  isMobile?: boolean;
  compact?: boolean;
}

export default function QualityDashboardWidget({ 
  configuration = {}, 
  className = "",
  isMobile = false,
  compact = false 
}: QualityDashboardWidgetProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/metrics');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Quality Dashboard
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

  const qualityTests = [
    { name: 'pH Level', value: 7.2, target: '7.0-7.5', status: 'pass' },
    { name: 'Temperature', value: 23.5, target: '20-25°C', status: 'pass' },
    { name: 'Purity', value: 99.8, target: '>99%', status: 'pass' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pass':
        return "default";
      case 'warning':
        return "secondary";
      case 'fail':
        return "destructive";
      default:
        return "outline";
    }
  };

  const overallScore = metrics?.qualityScore || 95;
  const passedTests = qualityTests.filter(t => t.status === 'pass').length;
  const totalTests = qualityTests.length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Quality Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {qualityTests.slice(0, compact || isMobile ? 3 : 5).map((test, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(test.status)}
                <div>
                  <span className="text-sm font-medium">{test.name}</span>
                  <div className="text-xs text-gray-500">{test.target}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{test.value}</div>
                <Badge variant={getStatusVariant(test.status)} className="text-xs">
                  {test.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {!compact && !isMobile && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Score</span>
              <span className="font-bold text-lg">{overallScore}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Tests Passed</span>
              <span>{passedTests}/{totalTests}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}