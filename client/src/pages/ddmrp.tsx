import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, AlertCircle, BarChart3, Package, TrendingUp, 
  Zap, Shield, Clock, Settings, RefreshCw, Info
} from "lucide-react";

export default function DDMRP() {
  const [activeView, setActiveView] = useState("buffers");
  
  // Sample buffer data
  const buffers = [
    {
      id: 1,
      item: "Steel Plate 10mm",
      type: "Raw Material",
      leadTime: 14,
      averageDemand: 500,
      variability: "Medium",
      bufferZones: {
        red: { base: 100, safety: 50, total: 150 },
        yellow: { total: 300 },
        green: { total: 450 }
      },
      currentStock: 380,
      bufferStatus: "yellow",
      bufferPercentage: 63,
      plannedOrders: 2,
      openSupply: 200
    },
    {
      id: 2,
      item: "Hydraulic Pump Assembly",
      type: "Component",
      leadTime: 7,
      averageDemand: 75,
      variability: "High",
      bufferZones: {
        red: { base: 30, safety: 20, total: 50 },
        yellow: { total: 75 },
        green: { total: 100 }
      },
      currentStock: 45,
      bufferStatus: "red",
      bufferPercentage: 30,
      plannedOrders: 3,
      openSupply: 50
    },
    {
      id: 3,
      item: "Control Module PCB",
      type: "Component",
      leadTime: 21,
      averageDemand: 200,
      variability: "Low",
      bufferZones: {
        red: { base: 150, safety: 75, total: 225 },
        yellow: { total: 400 },
        green: { total: 600 }
      },
      currentStock: 520,
      bufferStatus: "green",
      bufferPercentage: 87,
      plannedOrders: 0,
      openSupply: 0
    }
  ];

  const getBufferColor = (status: string) => {
    switch(status) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getBufferTextColor = (status: string) => {
    switch(status) {
      case 'red': return 'text-red-600';
      case 'yellow': return 'text-yellow-600';
      case 'green': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Demand-Driven MRP (DDMRP)
          </h1>
          <p className="text-muted-foreground mt-1">
            Strategic inventory positioning and buffer management for improved flow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculate Buffers
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Buffer Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">Items in optimal zone</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Critical Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Flow Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.23</div>
            <p className="text-xs text-muted-foreground">+8% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Avg Lead Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5 days</div>
            <p className="text-xs text-muted-foreground">-2 days improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="buffers">Buffer Status</TabsTrigger>
          <TabsTrigger value="planning">Planning Priority</TabsTrigger>
          <TabsTrigger value="execution">Execution Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="buffers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Buffer Management</CardTitle>
              <CardDescription>
                Real-time buffer status and replenishment signals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {buffers.map((buffer) => (
                  <div key={buffer.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{buffer.item}</h3>
                        <p className="text-sm text-muted-foreground">
                          {buffer.type} • Lead Time: {buffer.leadTime} days
                        </p>
                      </div>
                      <Badge className={getBufferColor(buffer.bufferStatus)}>
                        {buffer.bufferStatus.toUpperCase()} ZONE
                      </Badge>
                    </div>
                    
                    {/* Buffer Visualization */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Stock: {buffer.currentStock}</span>
                        <span className={getBufferTextColor(buffer.bufferStatus)}>
                          {buffer.bufferPercentage}% of buffer
                        </span>
                      </div>
                      
                      <div className="relative h-8 bg-gray-200 rounded overflow-hidden">
                        {/* Red Zone */}
                        <div 
                          className="absolute left-0 h-full bg-red-200"
                          style={{ width: '25%' }}
                        />
                        {/* Yellow Zone */}
                        <div 
                          className="absolute h-full bg-yellow-200"
                          style={{ left: '25%', width: '25%' }}
                        />
                        {/* Green Zone */}
                        <div 
                          className="absolute h-full bg-green-200"
                          style={{ left: '50%', width: '50%' }}
                        />
                        {/* Current Stock Indicator */}
                        <div 
                          className="absolute top-0 h-full w-1 bg-black"
                          style={{ left: `${buffer.bufferPercentage}%` }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <span className="text-red-600">Red: {buffer.bufferZones.red.total}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-yellow-600">Yellow: {buffer.bufferZones.yellow.total}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-green-600">Green: {buffer.bufferZones.green.total}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-3 pt-3 border-t text-sm">
                      <span>Planned Orders: {buffer.plannedOrders}</span>
                      <span>Open Supply: {buffer.openSupply}</span>
                      <span>Avg Demand: {buffer.averageDemand}/week</span>
                      <span>Variability: {buffer.variability}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planning Priority View</CardTitle>
              <CardDescription>
                Prioritized list of items requiring replenishment planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  3 items require immediate planning attention based on buffer penetration
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <div className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">Hydraulic Pump Assembly</p>
                      <p className="text-sm text-muted-foreground">
                        Red zone penetration - Generate order immediately
                      </p>
                    </div>
                    <Button size="sm">Create Order</Button>
                  </div>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">Steel Plate 10mm</p>
                      <p className="text-sm text-muted-foreground">
                        Yellow zone - Monitor closely, prepare for order
                      </p>
                    </div>
                    <Button size="sm" variant="outline">Review</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Alerts</CardTitle>
              <CardDescription>
                Real-time alerts for supply and demand variations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Supply Alert:</strong> Delayed shipment for Steel Plate 10mm - 
                    Expected delay of 3 days. Buffer protection: 5 days remaining.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Demand Spike:</strong> Control Module PCB consumption 
                    increased by 35% this week. Buffer status remains green.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DDMRP Performance Analytics</CardTitle>
              <CardDescription>
                Key metrics and trends for buffer management optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Buffer Reliability</h3>
                  <Progress value={92} className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    92% of buffers maintained optimal levels this month
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-3">Stockout Prevention</h3>
                  <Progress value={98} className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    98% stockout prevention rate with DDMRP
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-3">Inventory Reduction</h3>
                  <Progress value={35} className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    35% average inventory reduction achieved
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-3">Lead Time Compression</h3>
                  <Progress value={28} className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    28% reduction in cumulative lead time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}