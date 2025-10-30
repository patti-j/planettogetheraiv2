import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  ArrowLeft,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Filter,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

interface InventoryItem {
  id: string;
  itemCode: string;
  description: string;
  category: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  incomingStock: number;
  unit: string;
  minLevel: number;
  maxLevel: number;
  reorderPoint: number;
  lastRestocked: string;
  warehouse: string;
  supplier: string;
  unitCost: number;
  totalValue: number;
  stockStatus: 'healthy' | 'low' | 'critical' | 'overstock';
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export default function PortalInventory() {
  const [, setLocation] = useLocation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      setLocation('/portal/login');
      return;
    }
    
    fetchInventory();
  }, [setLocation]);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('portal_token');
      const response = await fetch('/api/portal/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'overstock':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockLevel = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.maxLevel) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.stockStatus === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const criticalItems = inventory.filter(item => item.stockStatus === 'critical').length;
  const lowStockItems = inventory.filter(item => item.stockStatus === 'low').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/portal/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Inventory Management</h1>
                  <p className="text-sm text-gray-500">Monitor stock levels and availability</p>
                </div>
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => {}}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-gray-500 mt-1">Active SKUs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Current inventory</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {lowStockItems}
              </div>
              <p className="text-xs text-gray-500 mt-1">Items below reorder</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {criticalItems}
              </div>
              <p className="text-xs text-gray-500 mt-1">Urgent restock needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by item code, description, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="raw_materials">Raw Materials</SelectItem>
                <SelectItem value="components">Components</SelectItem>
                <SelectItem value="finished_goods">Finished Goods</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="overstock">Overstock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Critical Items Alert */}
        {criticalItems > 0 && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-800">
                  Critical Stock Alert
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">
                {criticalItems} item{criticalItems > 1 ? 's' : ''} require immediate restocking.
                Review critical items and place orders to prevent stockouts.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.itemCode}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {item.availableStock} {item.unit}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {item.reservedStock} {item.unit}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStockStatusColor(item.stockStatus)}>
                          {item.stockStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress value={getStockLevel(item)} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : item.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <span className="h-4 w-4">−</span>
                          )}
                          <span className={`text-sm ${
                            item.trend === 'up' ? 'text-green-600' : 
                            item.trend === 'down' ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {item.trendPercentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${item.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{selectedItem.itemCode}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedItem.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  ✕
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Stock Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Current Stock</p>
                      <p className="font-medium">{selectedItem.currentStock} {selectedItem.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="font-medium text-green-600">
                        {selectedItem.availableStock} {selectedItem.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reserved</p>
                      <p className="font-medium text-orange-600">
                        {selectedItem.reservedStock} {selectedItem.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Incoming</p>
                      <p className="font-medium text-blue-600">
                        {selectedItem.incomingStock} {selectedItem.unit}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Reorder Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Reorder Point</p>
                      <p className="font-medium">{selectedItem.reorderPoint} {selectedItem.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Min Level</p>
                      <p className="font-medium">{selectedItem.minLevel} {selectedItem.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Max Level</p>
                      <p className="font-medium">{selectedItem.maxLevel} {selectedItem.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Restocked</p>
                      <p className="font-medium">
                        {format(new Date(selectedItem.lastRestocked), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Unit Cost</p>
                    <p className="font-medium">${selectedItem.unitCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-xl font-bold">${selectedItem.totalValue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Location & Supplier</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Warehouse</p>
                    <p className="font-medium">{selectedItem.warehouse}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="font-medium">{selectedItem.supplier}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}