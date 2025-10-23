import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Package, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  FileText,
  Mail,
  Phone,
  Building2,
  MapPin,
  Star,
  Target,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus,
  Filter,
  Download,
  Printer,
  Share2,
  Maximize2,
  Minimize2
} from "lucide-react";
import { PtJob, JobOperation, Resource } from "@shared/schema";

interface SalesLead {
  id: number;
  company: string;
  contact: string;
  email: string;
  phone: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed" | "lost";
  value: number;
  probability: number;
  expectedClose: string;
  product: string;
  quantity: number;
  notes: string;
  createdAt: string;
  lastActivity: string;
}

interface SalesOrder {
  id: number;
  orderNumber: string;
  customer: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  status: "pending" | "confirmed" | "production" | "shipped" | "delivered" | "invoiced";
  orderDate: string;
  requestedDelivery: string;
  estimatedDelivery: string;
  jobId?: number;
  priority: "low" | "medium" | "high";
  salesRep: string;
  notes: string;
}

interface ProductCatalog {
  id: number;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  leadTime: number;
  minQuantity: number;
  maxQuantity: number;
  capabilities: string[];
  specifications: Record<string, string>;
  availability: "available" | "limited" | "discontinued";
  imageUrl?: string;
}

export default function Sales() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);

  // Fetch production data for integration
  const { data: jobs = [] } = useQuery<PtJob[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: operations = [] } = useQuery<JobOperation[]>({
    queryKey: ["/api/operations"],
  });

  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ["/api/resources"],
  });

  // Mock sales data (in real app, this would come from CRM API)
  const mockLeads: SalesLead[] = [
    {
      id: 1,
      company: "Automotive Solutions Inc",
      contact: "Sarah Johnson",
      email: "sarah.johnson@autosolutions.com",
      phone: "(555) 123-4567",
      status: "qualified",
      value: 85000,
      probability: 70,
      expectedClose: "2025-08-15",
      product: "Custom Automotive Parts",
      quantity: 500,
      notes: "Interested in high-volume production runs",
      createdAt: "2025-07-01",
      lastActivity: "2025-07-12"
    },
    {
      id: 2,
      company: "TechCorp Manufacturing",
      contact: "Mike Chen",
      email: "mike.chen@techcorp.com",
      phone: "(555) 987-6543",
      status: "proposal",
      value: 120000,
      probability: 85,
      expectedClose: "2025-07-30",
      product: "Precision Components",
      quantity: 1000,
      notes: "Requires tight tolerances and quality certification",
      createdAt: "2025-06-15",
      lastActivity: "2025-07-13"
    },
    {
      id: 3,
      company: "Industrial Equipment Co",
      contact: "Lisa Rodriguez",
      email: "lisa.rodriguez@indequip.com",
      phone: "(555) 456-7890",
      status: "negotiation",
      value: 200000,
      probability: 60,
      expectedClose: "2025-08-30",
      product: "Heavy Machinery Parts",
      quantity: 200,
      notes: "Price-sensitive customer, competing with 2 other suppliers",
      createdAt: "2025-06-01",
      lastActivity: "2025-07-14"
    }
  ];

  const mockOrders: SalesOrder[] = [
    {
      id: 1,
      orderNumber: "SO-2025-001",
      customer: "Tech Corp",
      product: "Widget Assembly - Batch A",
      quantity: 100,
      unitPrice: 250,
      totalValue: 25000,
      status: "production",
      orderDate: "2025-07-01",
      requestedDelivery: "2025-07-25",
      estimatedDelivery: "2025-07-23",
      jobId: 1,
      priority: "high",
      salesRep: "John Smith",
      notes: "Rush order for existing customer"
    },
    {
      id: 2,
      orderNumber: "SO-2025-002",
      customer: "AutoParts Inc",
      product: "Custom Bracket Set",
      quantity: 500,
      unitPrice: 45,
      totalValue: 22500,
      status: "confirmed",
      orderDate: "2025-07-05",
      requestedDelivery: "2025-08-01",
      estimatedDelivery: "2025-07-30",
      priority: "medium",
      salesRep: "Sarah Davis",
      notes: "Standard delivery timeline"
    },
    {
      id: 3,
      orderNumber: "SO-2025-003",
      customer: "Industrial Solutions",
      product: "Precision Gears",
      quantity: 50,
      unitPrice: 180,
      totalValue: 9000,
      status: "shipped",
      orderDate: "2025-06-20",
      requestedDelivery: "2025-07-15",
      estimatedDelivery: "2025-07-14",
      priority: "low",
      salesRep: "Mike Johnson",
      notes: "Delivered on time"
    }
  ];

  const mockProducts: ProductCatalog[] = [
    {
      id: 1,
      name: "Custom Widget Assembly",
      description: "High-precision widget assembly for automotive applications",
      category: "Automotive",
      basePrice: 250,
      leadTime: 14,
      minQuantity: 50,
      maxQuantity: 5000,
      capabilities: ["CNC Machining", "Assembly", "Quality Control"],
      specifications: {
        "Material": "Aluminum 6061",
        "Tolerance": "±0.005\"",
        "Surface Finish": "Anodized",
        "Weight": "2.3 lbs"
      },
      availability: "available"
    },
    {
      id: 2,
      name: "Precision Bracket Set",
      description: "Precision-machined bracket set for industrial equipment",
      category: "Industrial",
      basePrice: 45,
      leadTime: 7,
      minQuantity: 100,
      maxQuantity: 10000,
      capabilities: ["CNC Machining", "Welding"],
      specifications: {
        "Material": "Steel 4140",
        "Tolerance": "±0.010\"",
        "Surface Finish": "Powder Coated",
        "Weight": "0.8 lbs"
      },
      availability: "available"
    },
    {
      id: 3,
      name: "Heavy Duty Gears",
      description: "High-torque gears for heavy machinery applications",
      category: "Heavy Equipment",
      basePrice: 180,
      leadTime: 21,
      minQuantity: 10,
      maxQuantity: 1000,
      capabilities: ["CNC Machining", "Heat Treatment", "Quality Control"],
      specifications: {
        "Material": "Hardened Steel",
        "Tolerance": "±0.002\"",
        "Surface Finish": "Ground",
        "Weight": "5.2 lbs"
      },
      availability: "limited"
    }
  ];

  // Calculate sales metrics
  const totalPipelineValue = mockLeads.reduce((sum, lead) => sum + lead.value, 0);
  const weightedPipelineValue = mockLeads.reduce((sum, lead) => sum + (lead.value * lead.probability / 100), 0);
  const totalOrderValue = mockOrders.reduce((sum, order) => sum + order.totalValue, 0);
  const activeOrders = mockOrders.filter(order => 
    ["pending", "confirmed", "production"].includes(order.status)
  ).length;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-purple-100 text-purple-800";
      case "qualified": return "bg-green-100 text-green-800";
      case "proposal": return "bg-yellow-100 text-yellow-800";
      case "negotiation": return "bg-orange-100 text-orange-800";
      case "closed": return "bg-emerald-100 text-emerald-800";
      case "lost": return "bg-red-100 text-red-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "production": return "bg-purple-100 text-purple-800";
      case "shipped": return "bg-green-100 text-green-800";
      case "delivered": return "bg-emerald-100 text-emerald-800";
      case "invoiced": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  // Filter leads based on search and status
  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = searchTerm === "" || 
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.product.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter orders based on search and status
  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const PageContent = () => (
    <div className="space-y-6">
      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pipeline Value</p>
                    <p className="text-2xl font-bold">${totalPipelineValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Weighted Pipeline</p>
                    <p className="text-2xl font-bold">${Math.round(weightedPipelineValue).toLocaleString()}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold">${totalOrderValue.toLocaleString()}</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Orders</p>
                    <p className="text-2xl font-bold">{activeOrders}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Recent Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockLeads.slice(0, 3).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{lead.company}</p>
                        <p className="text-sm text-gray-600">{lead.contact}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">${lead.value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">${order.totalValue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Leads Tab */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setLeadDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{lead.company}</h3>
                      <p className="text-sm text-gray-600">{lead.contact}</p>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">${lead.value.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">({lead.probability}%)</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{lead.product}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{new Date(lead.expectedClose).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setOrderDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(order.priority)}`}></div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Product</p>
                      <p className="font-medium">{order.product}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="font-medium">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Value</p>
                      <p className="font-medium">${order.totalValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Delivery</p>
                      <p className="font-medium">{new Date(order.requestedDelivery).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4 mr-1" />
                      Generate Quote
                    </Button>
                    {order.jobId && (
                      <Button size="sm" variant="outline">
                        <Package className="w-4 h-4 mr-1" />
                        View Production
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setQuoteDialogOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Generate Quote
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <Badge className={product.availability === "available" ? "bg-green-100 text-green-800" : product.availability === "limited" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                      {product.availability}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Base Price</span>
                      <span className="font-medium">${product.basePrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Lead Time</span>
                      <span className="font-medium">{product.leadTime} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Min/Max Qty</span>
                      <span className="font-medium">{product.minQuantity} - {product.maxQuantity}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Required Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {product.capabilities.map((capability, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      <FileText className="w-4 h-4 mr-1" />
                      Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-gray-50 ${isMaximized ? 'fixed inset-0 z-50' : 'h-screen'} flex flex-col`}>
      {/* Maximize button in top right corner matching hamburger menu positioning */}
      <div className="fixed top-2 right-2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-3 sm:p-6 flex-shrink-0">
        <div className="relative">
          <div className="md:ml-0 ml-12">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
              <DollarSign className="w-6 h-6 mr-2" />
              Sales Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600">Manage leads, orders, and customer relationships</p>
          </div>
          

        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <PageContent />
          </TabsContent>
          
          <TabsContent value="leads" className="mt-6">
            <PageContent />
          </TabsContent>
          
          <TabsContent value="orders" className="mt-6">
            <PageContent />
          </TabsContent>
          
          <TabsContent value="products" className="mt-6">
            <PageContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}