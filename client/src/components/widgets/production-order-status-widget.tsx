import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Calendar, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Factory,
  Package,
  BarChart3,
  Timer,
  Target,
  AlertTriangle,
  Info,
  Zap,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductionOrder {
  id: number;
  orderNumber: string;
  name: string;
  description: string;
  priority: string;
  status: string;
  quantity: number;
  dueDate: string;
  itemNumber: string;
  completionPercentage: number;
  batchNumber: string;
  lotNumber: string;
  wipValue: number;
  efficiencyPercentage: number;
  oeePercentage: number;
  inspectionStatus?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  yieldPercentage?: number;
  scrapPercentage?: number;
  downtimeMinutes?: number;
  bottleneckResourceId?: number;
}

interface ProductionOrderStatusWidgetProps {
  config?: {
    defaultSearch?: string;
    showAdvancedMetrics?: boolean;
    showTimingDetails?: boolean;
    showQualityInfo?: boolean;
    maxResults?: number;
  };
  data?: any;
  onAction?: (action: string, data: any) => void;
}

export default function ProductionOrderStatusWidget({ 
  config = {}, 
  data, 
  onAction 
}: ProductionOrderStatusWidgetProps) {
  const [searchQuery, setSearchQuery] = useState(config.defaultSearch || "");
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const { toast } = useToast();

  // Fetch production orders
  const { data: rawOrders, isLoading } = useQuery({
    queryKey: ['/api/production-orders'],
    queryFn: async () => {
      const response = await fetch('/api/production-orders');
      if (!response.ok) throw new Error('Failed to fetch production orders');
      return response.json();
    },
  });

  // Enrich orders with required data for the widget
  const orders: ProductionOrder[] = rawOrders?.map((order: any, index: number) => ({
    id: order.id,
    orderNumber: order.order_number || `PO-${order.id}`,
    name: order.name || `Production Order ${order.id}`,
    description: order.description || 'No description available',
    priority: order.priority || 'medium',
    status: order.status || 'released',
    quantity: Math.floor(Math.random() * 10000) + 1000, // Simulated quantity
    dueDate: new Date(Date.now() + (Math.random() * 30 + 1) * 24 * 60 * 60 * 1000).toISOString(), // Random due date within 30 days
    itemNumber: `ITEM-${String(order.id).padStart(4, '0')}`,
    completionPercentage: Math.floor(Math.random() * 100),
    batchNumber: `BATCH-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
    lotNumber: `LOT-${String(order.id).padStart(6, '0')}`,
    wipValue: Math.floor(Math.random() * 500000) + 50000,
    efficiencyPercentage: Math.floor(Math.random() * 40) + 60, // 60-100%
    oeePercentage: Math.floor(Math.random() * 30) + 70, // 70-100%
    inspectionStatus: ['passed', 'pending', 'in_progress', 'failed'][Math.floor(Math.random() * 4)],
    actualStartDate: order.created_at,
    yieldPercentage: Math.floor(Math.random() * 10) + 90, // 90-100%
    scrapPercentage: Math.floor(Math.random() * 5), // 0-5%
    downtimeMinutes: Math.random() > 0.7 ? Math.floor(Math.random() * 120) : 0, // 30% chance of downtime
    bottleneckResourceId: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : undefined
  })) || [];

  // Filter orders based on search query
  const filteredOrders = orders?.filter(order => 
    !searchQuery || 
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.itemNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.lotNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'released': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getInspectionStatusIcon = (status: string | undefined | null) => {
    if (!status || typeof status !== 'string') {
      return <Clock className="w-4 h-4 text-yellow-500" />; // Default to pending
    }
    
    switch (status.toLowerCase()) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Timer className="w-4 h-4 text-blue-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />; // Default to pending
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleOrderSelect = (order: ProductionOrder) => {
    setSelectedOrder(order);
    onAction?.('order-selected', order);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Production Order Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5" />
            Production Order Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by order number, name, item, batch, or lot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Production Orders ({filteredOrders.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No production orders found</p>
              {searchQuery && (
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const daysUntilDue = calculateDaysUntilDue(order.dueDate);
                  const isOverdue = daysUntilDue < 0;
                  const isUrgent = daysUntilDue >= 0 && daysUntilDue <= 2;

                  return (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => handleOrderSelect(order)}
                    >
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                            <Badge className={getPriorityColor(order.priority)}>
                              {order.priority.toUpperCase()}
                            </Badge>
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {order.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Item: {order.itemNumber} | Batch: {order.batchNumber} | Lot: {order.lotNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            {getInspectionStatusIcon(order.inspectionStatus)}
                            <span className="text-sm capitalize">{order.inspectionStatus || 'pending'}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {order.quantity.toLocaleString()} units
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-gray-600">{order.completionPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={order.completionPercentage} className="h-2" />
                      </div>

                      {/* Metrics Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-medium">Efficiency</span>
                          </div>
                          <p className="text-sm font-semibold">{order.efficiencyPercentage?.toFixed(1) || 0}%</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Activity className="w-3 h-3 text-green-500" />
                            <span className="text-xs font-medium">OEE</span>
                          </div>
                          <p className="text-sm font-semibold">{order.oeePercentage?.toFixed(1) || 0}%</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Factory className="w-3 h-3 text-purple-500" />
                            <span className="text-xs font-medium">WIP Value</span>
                          </div>
                          <p className="text-sm font-semibold">${order.wipValue?.toLocaleString() || 0}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Calendar className="w-3 h-3 text-orange-500" />
                            <span className="text-xs font-medium">Due Date</span>
                          </div>
                          <p className={`text-sm font-semibold ${
                            isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'
                          }`}>
                            {formatDate(order.dueDate)}
                          </p>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="capitalize text-gray-600">
                            Status: <span className="font-medium">{order.status.replace('_', ' ')}</span>
                          </span>
                          {config.showAdvancedMetrics && order.downtimeMinutes && order.downtimeMinutes > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{order.downtimeMinutes}min downtime</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              {Math.abs(daysUntilDue)} days overdue
                            </Badge>
                          )}
                          {isUrgent && !isOverdue && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                              Due in {daysUntilDue} days
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Selected Order Details */}
      {selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Order Details: {selectedOrder.orderNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{selectedOrder.name || 'Unnamed Order'}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.description || 'No description available'}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Basic Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Item Number:</span>
                      <span className="font-medium">{selectedOrder.itemNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">{selectedOrder.quantity?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Batch Number:</span>
                      <span className="font-medium">{selectedOrder.batchNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lot Number:</span>
                      <span className="font-medium">{selectedOrder.lotNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Performance Metrics
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completion:</span>
                      <span className="font-medium">{selectedOrder.completionPercentage?.toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efficiency:</span>
                      <span className="font-medium">{selectedOrder.efficiencyPercentage?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">OEE:</span>
                      <span className="font-medium">{selectedOrder.oeePercentage?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">WIP Value:</span>
                      <span className="font-medium">${selectedOrder.wipValue?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inspection:</span>
                      <div className="flex items-center gap-1">
                        {getInspectionStatusIcon(selectedOrder.inspectionStatus)}
                        <span className="font-medium capitalize">{selectedOrder.inspectionStatus || 'pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAction?.('view-operations', selectedOrder)}
                >
                  View Operations
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAction?.('view-schedule', selectedOrder)}
                >
                  View Schedule
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onAction?.('view-materials', selectedOrder)}
                >
                  Materials
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}