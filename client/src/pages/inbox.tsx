import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Mail,
  MailOpen,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Bell,
  Trash2,
  Archive,
  Star
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success" | "alert";
  timestamp: string;
  read: boolean;
  category: string;
  priority: "high" | "medium" | "low";
  actionRequired?: boolean;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}

// Mock data for notifications - in a real app this would come from the database
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Production Line Alert",
    message: "Reactor B temperature exceeds normal operating range. Immediate attention required.",
    type: "error",
    timestamp: "2025-08-05T14:30:00Z",
    read: false,
    category: "production",
    priority: "high",
    actionRequired: true,
    relatedEntity: {
      type: "equipment",
      id: "reactor-b",
      name: "Reactor B"
    }
  },
  {
    id: "2",
    title: "Schedule Update",
    message: "Production schedule has been updated for next week. Please review the changes.",
    type: "info",
    timestamp: "2025-08-05T13:15:00Z",
    read: false,
    category: "scheduling",
    priority: "medium",
    actionRequired: true,
    relatedEntity: {
      type: "schedule",
      id: "week-32",
      name: "Week 32 Schedule"
    }
  },
  {
    id: "3",
    title: "Quality Check Completed",
    message: "Batch QC-2025-001 has passed all quality checks and is ready for release.",
    type: "success",
    timestamp: "2025-08-05T12:45:00Z",
    read: true,
    category: "quality",
    priority: "medium",
    actionRequired: false,
    relatedEntity: {
      type: "batch",
      id: "qc-2025-001",
      name: "Batch QC-2025-001"
    }
  },
  {
    id: "4",
    title: "Inventory Low Warning",
    message: "Raw material XYZ-123 is running low. Current stock: 15 units (minimum: 20 units).",
    type: "warning",
    timestamp: "2025-08-05T11:20:00Z",
    read: false,
    category: "inventory",
    priority: "medium",
    actionRequired: true,
    relatedEntity: {
      type: "material",
      id: "xyz-123",
      name: "Raw Material XYZ-123"
    }
  },
  {
    id: "5",
    title: "Maintenance Reminder",
    message: "Scheduled maintenance for Packaging Line A is due tomorrow at 9:00 AM.",
    type: "info",
    timestamp: "2025-08-05T10:00:00Z",
    read: true,
    category: "maintenance",
    priority: "low",
    actionRequired: false,
    relatedEntity: {
      type: "equipment",
      id: "packaging-a",
      name: "Packaging Line A"
    }
  },
  {
    id: "6",
    title: "System Update",
    message: "PlanetTogether system will be updated tonight at 11:00 PM. Expected downtime: 30 minutes.",
    type: "alert",
    timestamp: "2025-08-05T09:30:00Z",
    read: true,
    category: "system",
    priority: "low",
    actionRequired: false
  }
];

export default function InboxPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const queryClient = useQueryClient();

  // In a real app, this would be a proper API call
  const { data: notifications = mockNotifications } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: () => Promise.resolve(mockNotifications)
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "error": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "alert": return <Bell className="w-5 h-5 text-purple-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "error": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "warning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "success": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "alert": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Filter notifications based on search and filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchQuery === "" || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || notification.type === filterType;
    const matchesRead = filterRead === "all" || 
      (filterRead === "read" && notification.read) ||
      (filterRead === "unread" && !notification.read);
    
    return matchesSearch && matchesType && matchesRead;
  });

  const unreadCount = filteredNotifications.filter(n => !n.read).length;
  const actionRequiredCount = filteredNotifications.filter(n => n.actionRequired).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inbox</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredNotifications.length} messages • {unreadCount} unread
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Archive className="w-4 h-4 mr-2" />
              Archive All
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <option value="all">All Types</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="alert">Alerts</option>
            </select>
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{unreadCount}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Action Required</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{actionRequiredCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredNotifications.length}</p>
                </div>
                <Bell className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`hover:shadow-md transition-all cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {notification.actionRequired && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Action Required
                            </Badge>
                          )}
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          <Badge className={getTypeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span className="capitalize">{notification.category}</span>
                          {notification.relatedEntity && (
                            <span>{notification.relatedEntity.name}</span>
                          )}
                        </div>
                        <span>{formatTimestamp(notification.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm" className="p-2">
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || filterType !== "all" || filterRead !== "all" 
                    ? "Try adjusting your search or filters"
                    : "You're all caught up! No new notifications."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}