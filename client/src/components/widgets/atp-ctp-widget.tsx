import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, CheckCircle2, Clock, AlertTriangle, Calculator, 
  TrendingUp, Factory, Truck, Calendar, Search
} from "lucide-react";
import { format, addDays, parseISO } from "date-fns";

interface StockItem {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  type: string;
  unitOfMeasure: string;
  standardCost: number;
  averageCost: number;
  supplier: string;
  leadTimeDays: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  economicOrderQuantity: number;
  safetyStock: number;
  abcClassification: string;
  isActive: boolean;
}

interface StockBalance {
  id: number;
  itemId: number;
  location: string;
  currentQuantity: number;
  reservedQuantity: number;
  allocatedQuantity: number;
  incomingQuantity: number;
  lastUpdated: string;
}

interface AtpResult {
  sku: string;
  productName: string;
  requestedQuantity: number;
  requestedDate: string;
  availableToPromise: number;
  capableToPromise: number;
  earliestDeliveryDate: string;
  requiresProduction: boolean;
  productionLeadTime: number;
  recommendations: string[];
}

interface AtpCtpWidgetProps {
  className?: string;
  compact?: boolean;
}

export default function AtpCtpWidget({ className = "", compact = false }: AtpCtpWidgetProps) {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [requestedQuantity, setRequestedQuantity] = useState<string>("");
  const [requestedDate, setRequestedDate] = useState<string>("");
  const [searchResults, setSearchResults] = useState<AtpResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch data
  const { data: stockItems, isLoading: stockItemsLoading, error: stockItemsError } = useQuery<StockItem[]>({
    queryKey: ['/api/stock-items']
  });

  const { data: stockBalances } = useQuery<StockBalance[]>({
    queryKey: ['/api/stock-balances']
  });

  const calculateAtpCtp = async () => {
    if (!selectedProduct || !requestedQuantity || !requestedDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsCalculating(true);

    try {
      // Find the selected stock item
      const stockItem = stockItems?.find(item => item.sku === selectedProduct);
      if (!stockItem) {
        throw new Error("Product not found");
      }

      const quantity = parseInt(requestedQuantity);
      const requestDate = parseISO(requestedDate);
      
      // Get stock balance for this item (use first location or create default)
      let stockBalance = stockBalances?.find(balance => balance.itemId === stockItem.id);
      if (!stockBalance) {
        // Create default balance if none exists
        stockBalance = {
          id: 0,
          itemId: stockItem.id,
          location: 'Main Warehouse',
          currentQuantity: Math.floor(Math.random() * 200) + 50, // Demo data
          reservedQuantity: Math.floor(Math.random() * 30),
          allocatedQuantity: Math.floor(Math.random() * 20),
          incomingQuantity: Math.floor(Math.random() * 100),
          lastUpdated: new Date().toISOString()
        };
      }
      
      // Calculate ATP (Available to Promise)
      const availableStock = stockBalance.currentQuantity - stockBalance.reservedQuantity - stockBalance.allocatedQuantity;
      const atp = Math.max(0, availableStock + stockBalance.incomingQuantity);
      
      // Calculate CTP (Capable to Promise) - includes potential production
      const shortfall = Math.max(0, quantity - atp);
      const productionCapacity = stockItem.economicOrderQuantity || 100; // Use EOQ as production capacity
      const ctp = atp + (shortfall > 0 ? productionCapacity : 0);
      
      // Calculate earliest delivery date
      const productionNeeded = shortfall > 0;
      const baseLeadTime = productionNeeded ? stockItem.leadTimeDays : 1;
      const additionalTime = quantity > productionCapacity ? Math.ceil(quantity / productionCapacity) : 1;
      const totalLeadTime = baseLeadTime * additionalTime;
      const earliestDelivery = addDays(new Date(), totalLeadTime);
      
      // Generate intelligent recommendations
      const recommendations: string[] = [];
      if (quantity <= atp) {
        recommendations.push("✅ Can fulfill from current inventory");
        if (availableStock < stockItem.reorderPoint) {
          recommendations.push("⚠️ Stock below reorder point - consider replenishment");
        }
      } else if (quantity <= ctp) {
        recommendations.push("🏭 Requires production scheduling");
        recommendations.push(`⏱️ Additional ${totalLeadTime} days needed for production`);
        if (stockItem.supplier) {
          recommendations.push(`📦 Contact supplier: ${stockItem.supplier}`);
        }
      } else {
        recommendations.push("❌ Cannot fulfill with current capacity");
        recommendations.push("📋 Consider splitting delivery or extending timeline");
        recommendations.push(`💡 Maximum producible: ${ctp} units in ${totalLeadTime} days`);
      }

      if (availableStock < stockItem.safetyStock) {
        recommendations.push("🚨 Below safety stock level - urgent reordering needed");
      }

      if (stockItem.abcClassification === 'A') {
        recommendations.push("⭐ Priority item - ensure adequate stock levels");
      }

      const result: AtpResult = {
        sku: stockItem.sku,
        productName: stockItem.name,
        requestedQuantity: quantity,
        requestedDate: requestedDate,
        availableToPromise: atp,
        capableToPromise: ctp,
        earliestDeliveryDate: format(earliestDelivery, 'yyyy-MM-dd'),
        requiresProduction: productionNeeded,
        productionLeadTime: totalLeadTime,
        recommendations
      };

      setSearchResults(result);
      
      toast({
        title: "ATP/CTP Calculated",
        description: "Promise analysis completed successfully"
      });

    } catch (error) {
      toast({
        title: "Calculation Error",
        description: "Failed to calculate ATP/CTP",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const getStatusBadge = (result: AtpResult) => {
    if (result.requestedQuantity <= result.availableToPromise) {
      return <Badge className="bg-green-500">Available to Promise</Badge>;
    } else if (result.requestedQuantity <= result.capableToPromise) {
      return <Badge className="bg-yellow-500">Capable to Promise</Badge>;
    } else {
      return <Badge variant="destructive">Cannot Promise</Badge>;
    }
  };

  const getCapacityPercentage = (result: AtpResult) => {
    return Math.min(100, (result.requestedQuantity / result.capableToPromise) * 100);
  };

  // Quick calculation for top products (for compact mode)
  const topProductsAtp = useMemo(() => {
    if (!stockItems || !stockItems.length) return [];
    
    return stockItems.slice(0, 3).map(item => {
      // Get or simulate stock balance for this item
      let stockBalance = stockBalances?.find(balance => balance.itemId === item.id);
      if (!stockBalance) {
        stockBalance = {
          id: 0,
          itemId: item.id,
          location: 'Main Warehouse',
          currentQuantity: Math.floor(Math.random() * 200) + 50,
          reservedQuantity: Math.floor(Math.random() * 30),
          allocatedQuantity: Math.floor(Math.random() * 20),
          incomingQuantity: Math.floor(Math.random() * 100),
          lastUpdated: new Date().toISOString()
        };
      }

      const availableStock = stockBalance.currentQuantity - stockBalance.reservedQuantity - stockBalance.allocatedQuantity;
      const atp = Math.max(0, availableStock + stockBalance.incomingQuantity);
      const utilizationPercentage = stockBalance.currentQuantity > 0 ? ((stockBalance.reservedQuantity + stockBalance.allocatedQuantity) / stockBalance.currentQuantity) * 100 : 0;
      
      return {
        sku: item.sku,
        name: item.name,
        atp,
        currentStock: stockBalance.currentQuantity,
        utilizationPercentage: isNaN(utilizationPercentage) ? 0 : utilizationPercentage,
        status: atp >= item.safetyStock ? 'healthy' : atp > item.minStockLevel ? 'warning' : 'critical',
        classification: item.abcClassification
      };
    });
  }, [stockItems, stockBalances]);

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="w-4 h-4" />
            ATP / CTP Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stockItemsLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          ) : stockItemsError ? (
            <div className="text-center py-4">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">Failed to load stock data</p>
            </div>
          ) : topProductsAtp.length === 0 ? (
            <div className="text-center py-4">
              <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No stock items available</p>
            </div>
          ) : (
            topProductsAtp.map((product) => (
              <div key={product.sku} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    {product.classification && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {product.classification}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{product.atp} units</p>
                  <Badge 
                    variant={product.status === 'healthy' ? 'default' : 
                            product.status === 'warning' ? 'secondary' : 'destructive'}
                    className="text-xs"
                  >
                    {product.status === 'healthy' ? 'Available' : 
                     product.status === 'warning' ? 'Low Stock' : 'Critical'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          ATP / CTP Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stockItemsError && (
          <div className="border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Failed to load stock data</span>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="product" className="text-xs">Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={stockItemsLoading}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder={stockItemsLoading ? "Loading..." : "Select..."} />
              </SelectTrigger>
              <SelectContent>
                {stockItems?.filter(item => item.isActive).map((item) => (
                  <SelectItem key={item.sku} value={item.sku}>
                    <div className="flex items-center gap-2">
                      <span>{item.sku} - {item.name}</span>
                      {item.abcClassification && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {item.abcClassification}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-xs">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="0"
              value={requestedQuantity}
              onChange={(e) => setRequestedQuantity(e.target.value)}
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs">Date</Label>
            <Input
              id="date"
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="h-8"
            />
          </div>
        </div>

        <Button 
          onClick={calculateAtpCtp} 
          disabled={isCalculating}
          className="w-full h-8"
          size="sm"
        >
          {isCalculating ? "Calculating..." : "Calculate ATP/CTP"}
        </Button>

        {/* Results */}
        {searchResults && (
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{searchResults.productName}</h4>
              {getStatusBadge(searchResults)}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Available to Promise</p>
                <p className="text-lg font-bold text-green-600">{searchResults.availableToPromise}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Capable to Promise</p>
                <p className="text-lg font-bold text-blue-600">{searchResults.capableToPromise}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Capacity Utilization</span>
                <span>{Math.round(getCapacityPercentage(searchResults))}%</span>
              </div>
              <Progress value={getCapacityPercentage(searchResults)} className="h-2" />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">Earliest Delivery</p>
              <p className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(searchResults.earliestDeliveryDate), 'MMM dd, yyyy')}
              </p>
            </div>

            {searchResults.recommendations.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Recommendations</p>
                <ul className="text-xs space-y-1">
                  {searchResults.recommendations.slice(0, 2).map((rec, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-gray-400">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}