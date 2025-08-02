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
  currentStock: number;
  reservedStock: number;
  incomingStock: number;
  unitOfMeasure: string;
  leadTimeDays: number;
  safetyStock: number;
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
  const { data: stockItems } = useQuery<StockItem[]>({
    queryKey: ['/api/stock-items']
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
      
      // Calculate ATP (Available to Promise)
      const availableStock = stockItem.currentStock - stockItem.reservedStock;
      const atp = Math.max(0, availableStock + stockItem.incomingStock);
      
      // Calculate CTP (Capable to Promise)
      const shortfall = Math.max(0, quantity - atp);
      const productionCapacity = 100; // This would come from production planning
      const ctp = atp + productionCapacity;
      
      // Calculate earliest delivery date
      const productionNeeded = shortfall > 0;
      const leadTime = productionNeeded ? stockItem.leadTimeDays : 1;
      const earliestDelivery = addDays(new Date(), leadTime);
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (quantity <= atp) {
        recommendations.push("Can fulfill from current inventory");
      } else if (quantity <= ctp) {
        recommendations.push("Requires production scheduling");
        recommendations.push(`Additional ${leadTime} days needed for production`);
      } else {
        recommendations.push("Cannot fulfill with current capacity");
        recommendations.push("Consider splitting delivery or extending timeline");
      }

      if (availableStock < stockItem.safetyStock) {
        recommendations.push("Below safety stock level - consider reordering");
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
        productionLeadTime: leadTime,
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
    if (!stockItems) return [];
    
    return stockItems.slice(0, 3).map(item => {
      const availableStock = item.currentStock - item.reservedStock;
      const atp = Math.max(0, availableStock + item.incomingStock);
      const utilizationPercentage = ((item.currentStock - availableStock) / item.currentStock) * 100;
      
      return {
        sku: item.sku,
        name: item.name,
        atp,
        currentStock: item.currentStock,
        utilizationPercentage: isNaN(utilizationPercentage) ? 0 : utilizationPercentage,
        status: atp > item.safetyStock ? 'healthy' : atp > 0 ? 'warning' : 'critical'
      };
    });
  }, [stockItems]);

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
          {topProductsAtp.map((product) => (
            <div key={product.sku} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
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
          ))}
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
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="product" className="text-xs">Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {stockItems?.map((item) => (
                  <SelectItem key={item.sku} value={item.sku}>
                    {item.sku} - {item.name}
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