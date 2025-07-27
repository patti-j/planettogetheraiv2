import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, CheckCircle2, Clock, AlertTriangle, Calendar, 
  Search, Factory, Truck, Calculator, TrendingUp, Info
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

interface ProductionOrder {
  id: number;
  name: string;
  orderNumber: string;
  customer: string;
  priority: string;
  status: string;
  dueDate: string;
  quantity: number;
  productSku?: string;
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

export default function AtpCtpPage() {
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

  const { data: productionOrders } = useQuery<ProductionOrder[]>({
    queryKey: ['/api/production-orders']
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
        recommendations.push("✅ Can fulfill from current inventory");
      } else if (quantity <= ctp) {
        recommendations.push("⚠️ Requires production scheduling");
        recommendations.push(`📅 Additional ${leadTime} days needed for production`);
      } else {
        recommendations.push("❌ Cannot fulfill with current capacity");
        recommendations.push("💡 Consider splitting delivery or extending timeline");
      }

      if (availableStock < stockItem.safetyStock) {
        recommendations.push("⚠️ Below safety stock level - consider reordering");
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

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available to Promise (ATP) / Capable to Promise (CTP)</h1>
          <p className="text-gray-600">Analyze product availability and production capacity for customer commitments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Promise Analysis
              </CardTitle>
              <CardDescription>
                Enter customer request details to calculate availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product..." />
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
                <Label htmlFor="quantity">Requested Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity..."
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Requested Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                />
              </div>

              <Button 
                onClick={calculateAtpCtp}
                disabled={isCalculating}
                className="w-full"
              >
                {isCalculating ? (
                  <>
                    <Calculator className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate ATP/CTP
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Quick Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-green-600">Available to Promise (ATP)</div>
                <p className="text-gray-600">Quantity available from current inventory minus reservations</p>
              </div>
              <div>
                <div className="font-medium text-yellow-600">Capable to Promise (CTP)</div>
                <p className="text-gray-600">ATP plus what can be produced within lead time</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {searchResults ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Promise Analysis Results
                  </CardTitle>
                  {getStatusBadge(searchResults)}
                </div>
                <CardDescription>
                  Analysis for {searchResults.productName} ({searchResults.sku})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{searchResults.requestedQuantity}</div>
                        <div className="text-sm text-gray-600">Requested</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{searchResults.availableToPromise}</div>
                        <div className="text-sm text-gray-600">ATP</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{searchResults.capableToPromise}</div>
                        <div className="text-sm text-gray-600">CTP</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{searchResults.productionLeadTime}</div>
                        <div className="text-sm text-gray-600">Days Lead Time</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">Requested Date</span>
                        </div>
                        <span>{format(parseISO(searchResults.requestedDate), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">Earliest Delivery</span>
                        </div>
                        <span>{format(parseISO(searchResults.earliestDeliveryDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Fulfillment Capability</span>
                        <span>{Math.min(100, Math.round((searchResults.capableToPromise / searchResults.requestedQuantity) * 100))}%</span>
                      </div>
                      <Progress value={Math.min(100, (searchResults.capableToPromise / searchResults.requestedQuantity) * 100)} />
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Inventory Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {stockItems?.find(item => item.sku === searchResults.sku) && (
                            <>
                              <div className="flex justify-between">
                                <span>Current Stock:</span>
                                <span className="font-medium">{stockItems.find(item => item.sku === searchResults.sku)?.currentStock}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Reserved:</span>
                                <span className="font-medium">{stockItems.find(item => item.sku === searchResults.sku)?.reservedStock}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Incoming:</span>
                                <span className="font-medium">{stockItems.find(item => item.sku === searchResults.sku)?.incomingStock}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Safety Stock:</span>
                                <span className="font-medium">{stockItems.find(item => item.sku === searchResults.sku)?.safetyStock}</span>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Production Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span>Production Required:</span>
                            <span className="font-medium">{searchResults.requiresProduction ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lead Time:</span>
                            <span className="font-medium">{searchResults.productionLeadTime} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Production Capacity:</span>
                            <span className="font-medium">{searchResults.capableToPromise - searchResults.availableToPromise}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <div className="space-y-3">
                      {searchResults.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No Analysis Yet</h3>
                <p className="text-gray-400 text-center">
                  Select a product and enter request details to calculate ATP/CTP
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}