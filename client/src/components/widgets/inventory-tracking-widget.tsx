import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface InventoryTrackingWidgetProps {
  configuration?: {
    materials?: string[];
    [key: string]: any;
  };
  className?: string;
  isMobile?: boolean;
  compact?: boolean;
}

export default function InventoryTrackingWidget({ 
  configuration = {}, 
  className = "",
  isMobile = false,
  compact = false 
}: InventoryTrackingWidgetProps) {
  const { data: stockItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/stock-items'],
    queryFn: async () => {
      const response = await fetch('/api/stock-items');
      return response.json();
    }
  });

  const { data: stockBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ['/api/stock-balances'],
    queryFn: async () => {
      const response = await fetch('/api/stock-balances');
      return response.json();
    }
  });

  const isLoading = itemsLoading || balancesLoading;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Levels
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

  const getStockLevel = (itemId: number) => {
    const balance = stockBalances?.find((b: any) => b.stockItemId === itemId);
    return balance?.currentBalance || 0;
  };

  const getStockStatus = (current: number, min: number = 10) => {
    if (current <= min * 0.5) return { status: 'critical', variant: 'destructive' as const, icon: AlertTriangle };
    if (current <= min) return { status: 'low', variant: 'secondary' as const, icon: TrendingDown };
    return { status: 'good', variant: 'default' as const, icon: TrendingUp };
  };

  const inventoryItems = stockItems?.slice(0, compact || isMobile ? 4 : 6).map((item: any) => {
    const currentLevel = getStockLevel(item.id);
    const statusInfo = getStockStatus(currentLevel, item.minimumStock);
    return {
      ...item,
      currentLevel,
      ...statusInfo
    };
  }) || [];

  const lowStockCount = stockItems?.filter((item: any) => {
    const level = getStockLevel(item.id);
    return level <= (item.minimumStock || 10);
  }).length || 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventory Levels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {inventoryItems.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                <div>
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="text-xs text-gray-500">{item.unit}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{item.currentLevel}</div>
                <Badge variant={item.variant} className="text-xs">
                  {item.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {!compact && !isMobile && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Low Stock Items</span>
              <div className="flex items-center gap-1">
                {lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                <span className={lowStockCount > 0 ? 'text-orange-600 font-medium' : ''}>
                  {lowStockCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}