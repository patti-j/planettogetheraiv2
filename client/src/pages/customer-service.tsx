import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Phone, 
  Mail, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Star, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Filter,
  User,
  MapPin,
  Building2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Send,
  Plus,
  Eye,
  Edit,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Headphones
} from "lucide-react";
import { PtJob, JobOperation, Resource } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useNavigation } from "@/contexts/NavigationContext";

interface CustomerOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  orderDate: string;
  requestedDelivery: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  status: "pending" | "confirmed" | "production" | "shipped" | "delivered" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  totalValue: number;
  products: {
    name: string;
    quantity: number;
    unitPrice: number;
    status: string;
  }[];
  jobId?: number;
  productionProgress: number;
  notes: string;
  assignedAgent: string;
  lastContact: string;
  issueCount: number;
  satisfactionRating?: number;
}

interface CustomerIssue {
  id: number;
  orderId: number;
  customerName: string;
  issueType: "delivery" | "quality" | "billing" | "general" | "urgent";
  priority: "low" | "medium" | "high" | "urgent";
  subject: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "escalated";
  createdAt: string;
  assignedAgent: string;
  resolution?: string;
  resolutionDate?: string;
  customerSatisfaction?: number;
}

interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  customerSince: string;
  lastOrder: string;
  status: "active" | "inactive" | "vip";
  satisfactionScore: number;
  paymentTerms: string;
  notes: string;
}

export default function CustomerService() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<CustomerIssue | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactNote, setContactNote] = useState("");
  const { toast } = useToast();
  const { addRecentPage } = useNavigation();

  // Register this page in recent pages when component mounts
  useEffect(() => {
    addRecentPage('/customer-service', 'Customer Service', 'Headphones');
  }, [addRecentPage]);

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

  // Mock customer service data
  const mockOrders: CustomerOrder[] = [
    {
      id: 1,
      orderNumber: "ORD-2025-001",
      customerName: "Tech Corp Solutions",
      customerEmail: "orders@techcorp.com",
      customerPhone: "(555) 123-4567",
      customerAddress: "123 Industrial Blvd, Tech City, TC 12345",
      orderDate: "2025-07-01",
      requestedDelivery: "2025-07-25",
      estimatedDelivery: "2025-07-23",
      status: "production",
      priority: "high",
      totalValue: 25000,
      products: [
        { name: "Widget Assembly - Batch A", quantity: 100, unitPrice: 250, status: "In Production" }
      ],
      jobId: 1,
      productionProgress: 65,
      notes: "Rush order - customer has production deadline",
      assignedAgent: "Sarah Johnson",
      lastContact: "2025-07-13",
      issueCount: 1,
      satisfactionRating: 4
    },
    {
      id: 2,
      orderNumber: "ORD-2025-002",
      customerName: "AutoParts Manufacturing",
      customerEmail: "procurement@autoparts.com",
      customerPhone: "(555) 987-6543",
      customerAddress: "456 Manufacturing Way, Auto City, AC 67890",
      orderDate: "2025-07-05",
      requestedDelivery: "2025-08-01",
      estimatedDelivery: "2025-07-30",
      status: "confirmed",
      priority: "medium",
      totalValue: 45000,
      products: [
        { name: "Custom Bracket Set", quantity: 500, unitPrice: 45, status: "Scheduled" },
        { name: "Precision Bolts", quantity: 1000, unitPrice: 22.50, status: "Pending" }
      ],
      productionProgress: 15,
      notes: "Standard delivery schedule - good customer",
      assignedAgent: "Mike Chen",
      lastContact: "2025-07-10",
      issueCount: 0,
      satisfactionRating: 5
    },
    {
      id: 3,
      orderNumber: "ORD-2025-003",
      customerName: "Industrial Equipment Inc",
      customerEmail: "orders@indequip.com",
      customerPhone: "(555) 456-7890",
      customerAddress: "789 Heavy Industry Dr, Steel Town, ST 13579",
      orderDate: "2025-06-20",
      requestedDelivery: "2025-07-15",
      estimatedDelivery: "2025-07-14",
      actualDelivery: "2025-07-16",
      status: "delivered",
      priority: "low",
      totalValue: 18000,
      products: [
        { name: "Heavy Duty Gears", quantity: 50, unitPrice: 180, status: "Delivered" },
        { name: "Mounting Hardware", quantity: 200, unitPrice: 45, status: "Delivered" }
      ],
      productionProgress: 100,
      notes: "Delivered 2 days late - customer understanding",
      assignedAgent: "Lisa Rodriguez",
      lastContact: "2025-07-16",
      issueCount: 1,
      satisfactionRating: 3
    }
  ];

  const mockIssues: CustomerIssue[] = [
    {
      id: 1,
      orderId: 1,
      customerName: "Tech Corp Solutions",
      issueType: "delivery",
      priority: "high",
      subject: "Delivery Date Inquiry",
      description: "Customer asking about delivery status for rush order ORD-2025-001",
      status: "investigating",
      createdAt: "2025-07-13",
      assignedAgent: "Sarah Johnson"
    },
    {
      id: 2,
      orderId: 3,
      customerName: "Industrial Equipment Inc",
      issueType: "quality",
      priority: "medium",
      subject: "Product Quality Concern",
      description: "Customer reported minor surface imperfections on delivered gears",
      status: "resolved",
      createdAt: "2025-07-16",
      assignedAgent: "Lisa Rodriguez",
      resolution: "Offered 5% discount on next order and implemented additional QC checks",
      resolutionDate: "2025-07-17",
      customerSatisfaction: 4
    }
  ];

  const mockCustomers: CustomerProfile[] = [
    {
      id: 1,
      name: "Tech Corp Solutions",
      email: "orders@techcorp.com",
      phone: "(555) 123-4567",
      company: "Tech Corp Solutions",
      address: "123 Industrial Blvd, Tech City, TC 12345",
      totalOrders: 12,
      totalValue: 285000,
      averageOrderValue: 23750,
      customerSince: "2023-03-15",
      lastOrder: "2025-07-01",
      status: "vip",
      satisfactionScore: 4.2,
      paymentTerms: "Net 30",
      notes: "High-volume customer, prefers rush orders"
    },
    {
      id: 2,
      name: "AutoParts Manufacturing",
      email: "procurement@autoparts.com",
      phone: "(555) 987-6543",
      company: "AutoParts Manufacturing",
      address: "456 Manufacturing Way, Auto City, AC 67890",
      totalOrders: 8,
      totalValue: 156000,
      averageOrderValue: 19500,
      customerSince: "2024-01-20",
      lastOrder: "2025-07-05",
      status: "active",
      satisfactionScore: 4.8,
      paymentTerms: "Net 45",
      notes: "Reliable customer, standard delivery requirements"
    }
  ];

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      // In real app, this would update the order status in the database
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
  });

  // Log customer contact mutation
  const logContactMutation = useMutation({
    mutationFn: async ({ orderId, note }: { orderId: number; note: string }) => {
      // In real app, this would log the contact in the database
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      toast({
        title: "Contact Logged",
        description: "Customer contact has been logged successfully.",
      });
      setContactDialogOpen(false);
      setContactNote("");
    },
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "production": return "bg-purple-100 text-purple-800";
      case "shipped": return "bg-green-100 text-green-800";
      case "delivered": return "bg-emerald-100 text-emerald-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "open": return "bg-red-100 text-red-800";
      case "investigating": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "escalated": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  // Get customer status color
  const getCustomerStatusColor = (status: string) => {
    switch (status) {
      case "vip": return "bg-purple-100 text-purple-800";
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  // Filter orders
  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filter issues
  const filteredIssues = mockIssues.filter(issue => {
    const matchesSearch = searchTerm === "" || 
      issue.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate metrics
  const totalOrders = mockOrders.length;
  const urgentOrders = mockOrders.filter(order => order.priority === "urgent" || order.priority === "high").length;
  const openIssues = mockIssues.filter(issue => issue.status === "open" || issue.status === "investigating").length;
  const averageSatisfaction = mockOrders.reduce((sum, order) => sum + (order.satisfactionRating || 0), 0) / mockOrders.filter(order => order.satisfactionRating).length;

  const PageContent = () => (
    <div className="space-y-6">
      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
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
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                      <p className="text-gray-600">{order.customerName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{order.customerEmail}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(order.priority)}`}></div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requested Delivery</p>
                      <p className="font-medium">{new Date(order.requestedDelivery).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Value</p>
                      <p className="font-medium">${order.totalValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Production Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={order.productionProgress} className="flex-1" />
                        <span className="text-sm font-medium">{order.productionProgress}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Products</p>
                    <div className="space-y-2">
                      {order.products.map((product, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <span className="text-gray-500 ml-2">x{product.quantity}</span>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{product.status}</Badge>
                            <p className="text-sm text-gray-500">${product.unitPrice} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setContactDialogOpen(true)}>
                      <Phone className="w-4 h-4 mr-1" />
                      Contact Customer
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4 mr-1" />
                      Generate Report
                    </Button>
                    {order.jobId && (
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4 mr-1" />
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

      {/* Issues Tab */}
      {activeTab === "issues" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search issues..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Issues List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredIssues.map((issue) => (
              <Card key={issue.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{issue.subject}</h3>
                      <p className="text-gray-600">{issue.customerName}</p>
                      <p className="text-sm text-gray-500">Order: {mockOrders.find(o => o.id === issue.orderId)?.orderNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(issue.priority)}`}></div>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{issue.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Issue Type</p>
                      <p className="font-medium capitalize">{issue.issueType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">{new Date(issue.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Assigned Agent</p>
                      <p className="font-medium">{issue.assignedAgent}</p>
                    </div>
                  </div>

                  {issue.resolution && (
                    <div className="bg-green-50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium text-green-800">Resolution</p>
                      <p className="text-green-700">{issue.resolution}</p>
                      {issue.customerSatisfaction && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-green-700">Customer satisfaction: {issue.customerSatisfaction}/5</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Add Note
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4 mr-1" />
                      Contact Customer
                    </Button>
                    {issue.status !== "resolved" && (
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Customers List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{customer.name}</h3>
                      <p className="text-gray-600">{customer.company}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{customer.email}</span>
                      </div>
                    </div>
                    <Badge className={getCustomerStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="font-medium">{customer.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Value</p>
                      <p className="font-medium">${customer.totalValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Avg Order Value</p>
                      <p className="font-medium">${customer.averageOrderValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Satisfaction</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{customer.satisfactionScore}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4 mr-1" />
                      Order History
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
      <div className="fixed right-12 z-50 top-3 md:top-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
          className="shadow-md border"
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-3 sm:p-6 flex-shrink-0">
        <div className="relative">
          <div className="md:ml-0 ml-12">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground flex items-center">
              <Headphones className="w-6 h-6 mr-2" />
              Customer Service
            </h1>
            <p className="text-sm md:text-base text-gray-600">Manage customer orders, issues, and relationships</p>
          </div>
          

        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white border-b px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{urgentOrders}</div>
            <div className="text-sm text-gray-500">Urgent Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{openIssues}</div>
            <div className="text-sm text-gray-500">Open Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{averageSatisfaction.toFixed(1)}</div>
            <div className="text-sm text-gray-500">Avg Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="mt-6">
            <PageContent />
          </TabsContent>
          
          <TabsContent value="issues" className="mt-6">
            <PageContent />
          </TabsContent>
          
          <TabsContent value="customers" className="mt-6">
            <PageContent />
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Customer Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Contact Notes
              </label>
              <Textarea
                placeholder="Enter details about your interaction with the customer..."
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setContactDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedOrder && logContactMutation.mutate({ orderId: selectedOrder.id, note: contactNote })}
                disabled={!contactNote.trim() || logContactMutation.isPending}
              >
                {logContactMutation.isPending ? "Logging..." : "Log Contact"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}