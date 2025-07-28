import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, Database, Users, Building, Wrench, Briefcase, CheckCircle, AlertCircle, Plus, Trash2, Grid3X3, ChevronDown, X, MapPin, Building2, Factory, Package, Warehouse, Package2, Hash, ShoppingCart, FileText, ArrowLeftRight, List, Route, TrendingUp, UserCheck, CheckSquare, Square, Calendar, Lightbulb, Sparkles, ExternalLink, Loader2, Edit2, ClipboardList, AlertTriangle, Cog, Search, ChevronLeft, ChevronRight, ChevronUp, ArrowUpDown, Filter, Eye, EyeOff, Info } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { useAuth } from '@/hooks/useAuth';

// Simple debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface ImportStatus {
  type: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  count?: number;
}

// Get category filter options for a data type
function getCategoryOptions(dataType: string) {
  const categories: Record<string, Array<{value: string, label: string}>> = {
    'resources': [
      { value: 'all', label: 'All Resources' },
      { value: 'machinery', label: 'Machinery' },
      { value: 'personnel', label: 'Personnel' },
      { value: 'equipment', label: 'Equipment' }
    ],
    'capabilities': [
      { value: 'all', label: 'All Capabilities' },
      { value: 'technical', label: 'Technical' },
      { value: 'operational', label: 'Operational' },
      { value: 'quality', label: 'Quality' }
    ],
    'productionOrders': [
      { value: 'all', label: 'All Orders' },
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'completed', label: 'Completed' }
    ],
    'plants': [
      { value: 'all', label: 'All Plants' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'assembly', label: 'Assembly' },
      { value: 'distribution', label: 'Distribution' }
    ]
  };
  
  return categories[dataType] || [{ value: 'all', label: 'All Items' }];
}

function renderItemDetails(item: any, dataType: string): string {
  switch (dataType) {
    case 'plants':
      return item.location || 'No location';
    case 'resources':
      return item.type || 'No type';
    case 'capabilities':
      return item.category || 'No category';
    case 'productionOrders':
      return `${item.status} - ${item.customer || 'No customer'}`;
    case 'users':
      return item.role || 'No role';
    case 'vendors':
      return `${item.vendorType || 'N/A'} - ${item.contactEmail || 'No email'}`;
    case 'customers':
      return `${item.customerTier || 'N/A'} - ${item.contactEmail || 'No email'}`;
    default:
      return 'N/A';
  }
}

// Component for managing existing data
function ManageDataTab({ dataType }: { dataType: string }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Manage Data Tab - Under Development</p>
        <p className="text-sm">This section will allow you to view and edit existing {dataType} data.</p>
      </div>
    </div>
  );
}

export default function DataImport() {
  const { isMaxOpen } = useMaxDock();

  return (
    <div className={`
      p-3 sm:p-6 space-y-4 sm:space-y-6
      ml-3 mr-3
      ${isMaxOpen ? 'md:ml-0 md:mr-0' : 'md:ml-12 md:mr-12'}
      max-w-full overflow-x-hidden
    `}>
      {/* Header */}
      <div className="relative">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <Database className="w-6 h-6 mr-2" />
            Master Data Setup
          </h1>
          <p className="text-sm md:text-base text-gray-600">Import, manage, and generate sample data for your manufacturing system</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-6">
          <Tabs defaultValue="manage">
            <TabsList>
              <TabsTrigger value="manage">Manage Data</TabsTrigger>
            </TabsList>
            <TabsContent value="manage">
              <ManageDataTab dataType="plants" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}