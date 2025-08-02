import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Share2, Package, User, Calendar, DollarSign, Truck, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName?: string;
  orderDate: string;
  requestedDate: string;
  promisedDate?: string;
  shippedDate?: string;
  status: string;
  priority: string;
  currency: string;
  subtotal: string;
  totalAmount: string;
  salesPerson?: string;
  shippingMethod?: string;
  notes?: string;
}

interface SalesOrderStatusWidgetProps {
  widgetId?: string;
  onDataChange?: (data: any) => void;
  isEditMode?: boolean;
  className?: string;
}

const statusIcons = {
  open: Clock,
  confirmed: CheckCircle,
  in_production: Package,
  shipped: Truck,
  invoiced: DollarSign,
  closed: CheckCircle,
  cancelled: XCircle,
};

const statusColors = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  in_production: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  invoiced: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function SalesOrderStatusWidget({ 
  widgetId, 
  onDataChange, 
  isEditMode = false,
  className = "" 
}: SalesOrderStatusWidgetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"orderNumber" | "customer" | "product">("orderNumber");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const { toast } = useToast();

  // Query sales orders with search functionality
  const { data: salesOrders = [], isLoading, error } = useQuery({
    queryKey: ['/api/sales-orders', searchTerm, searchType],
    enabled: searchTerm.length >= 2,
  });

  const handleOrderSelect = (order: SalesOrder) => {
    setSelectedOrder(order);
    onDataChange?.(order);
  };

  const handleShare = async () => {
    if (!selectedOrder) return;

    const shareData = {
      title: `Sales Order ${selectedOrder.orderNumber} Status`,
      text: `Order Status: ${selectedOrder.status}\nCustomer: ${selectedOrder.customerName || 'N/A'}\nTotal: ${selectedOrder.currency} ${selectedOrder.totalAmount}\nPromised Date: ${selectedOrder.promisedDate ? new Date(selectedOrder.promisedDate).toLocaleDateString() : 'TBD'}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Sales order status has been shared.",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          fallbackShare(shareData.text);
        }
      }
    } else {
      fallbackShare(shareData.text);
    }
  };

  const fallbackShare = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Sales order status has been copied to your clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Share failed",
        description: "Unable to share the order status.",
        variant: "destructive",
      });
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const StatusIcon = selectedOrder ? statusIcons[selectedOrder.status as keyof typeof statusIcons] || Clock : Clock;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sales Order Status
          </CardTitle>
          {selectedOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
        </div>

        {/* Search Controls */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Select value={searchType} onValueChange={(value) => setSearchType(value as typeof searchType)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orderNumber">Order Number</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="product">Product</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={`Search by ${searchType === 'orderNumber' ? 'order number' : searchType}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchTerm.length >= 2 && (
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : error ? (
                <div className="p-3 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  Error loading orders
                </div>
              ) : salesOrders.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                  No orders found
                </div>
              ) : (
                <div className="divide-y">
                  {salesOrders.map((order: SalesOrder) => (
                    <button
                      key={order.id}
                      onClick={() => handleOrderSelect(order)}
                      className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{order.orderNumber}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {order.customerName || `Customer ${order.customerId}`}
                          </div>
                        </div>
                        <Badge className={`text-xs ${statusColors[order.status as keyof typeof statusColors] || statusColors.open}`}>
                          {order.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {selectedOrder ? (
          <div className="space-y-4">
            {/* Order Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedOrder.orderNumber}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Order Date: {formatDate(selectedOrder.orderDate)}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className="h-5 w-5" />
                  <Badge className={statusColors[selectedOrder.status as keyof typeof statusColors] || statusColors.open}>
                    {selectedOrder.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <Badge className={priorityColors[selectedOrder.priority as keyof typeof priorityColors] || priorityColors.medium}>
                  {selectedOrder.priority.toUpperCase()} PRIORITY
                </Badge>
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Customer</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedOrder.customerName || `Customer ${selectedOrder.customerId}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Requested Date</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(selectedOrder.requestedDate)}
                    </div>
                  </div>
                </div>

                {selectedOrder.promisedDate && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Promised Date</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(selectedOrder.promisedDate)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Total Amount</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                    </div>
                  </div>
                </div>

                {selectedOrder.salesPerson && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Sales Person</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedOrder.salesPerson}
                      </div>
                    </div>
                  </div>
                )}

                {selectedOrder.shippedDate && (
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Shipped Date</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(selectedOrder.shippedDate)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Notes */}
            {selectedOrder.notes && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">Notes</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  {selectedOrder.notes}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Search for a sales order to view its status
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}