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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileSpreadsheet, Database, Users, Building, Wrench, Briefcase, CheckCircle, AlertCircle, Plus, Trash2, Grid3X3, ChevronDown, X, MapPin, Building2, Factory, Package, Warehouse, Package2, Hash, ShoppingCart, FileText, ArrowLeftRight, List, Route, TrendingUp, UserCheck, CheckSquare, Square, Calendar, Lightbulb, Sparkles, ExternalLink, Loader2, Edit2, ClipboardList, AlertTriangle, Cog, Search, ChevronLeft, ChevronRight, ChevronUp, ArrowUpDown, Filter, Eye, EyeOff, Info } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMaxDock } from '@/contexts/MaxDockContext';
import { useAuth } from '@/hooks/useAuth';

interface ImportStatus {
  type: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  count?: number;
}

function DataImport() {
  const [importStatuses, setImportStatuses] = useState<ImportStatus[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [recommendedDataTypes, setRecommendedDataTypes] = useState<string[]>([]);
  const [onboardingFeatures, setOnboardingFeatures] = useState<string[]>([]);
  
  // Smart filtering state
  const [showAllDataTypes, setShowAllDataTypes] = useState(false);
  const [dataTypeUsage, setDataTypeUsage] = useState<Record<string, number>>({});
  
  // AI Generation state
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSampleSize, setAiSampleSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [aiGenerationResult, setAiGenerationResult] = useState<any>(null);
  const [deleteExistingData, setDeleteExistingData] = useState(false);

  // AI Modification state
  const [showAIModifyDialog, setShowAIModifyDialog] = useState(false);
  const [aiModifyPrompt, setAiModifyPrompt] = useState('');
  const [aiModifyResult, setAiModifyResult] = useState<any>(null);
  const [showAIModifySummary, setShowAIModifySummary] = useState(false);

  // Feature to data requirements mapping
  const featureDataRequirements = {
    'production-scheduling': ['plants', 'resources', 'capabilities', 'productionOrders', 'operations'],
    'resource-management': ['plants', 'resources', 'capabilities'],
    'job-management': ['productionOrders', 'resources', 'plants', 'operations'],
    'capacity-planning': ['resources', 'capabilities', 'plants', 'productionOrders', 'operations'],
    'inventory-management': ['inventoryItems', 'storageLocations', 'plants'],
    'quality-management': ['resources', 'plants', 'productionOrders', 'operations'],
    'maintenance-scheduling': ['resources', 'plants', 'users'],
    'procurement': ['vendors', 'resources', 'plants'],
    'sales-orders': ['customers', 'productionOrders', 'plants'],
    'user-management': ['users', 'plants'],
    'analytics-reporting': ['plants', 'resources', 'productionOrders', 'operations']
  };

  const [showConsolidatedDialog, setShowConsolidatedDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMaxOpen } = useMaxDock();
  const { user } = useAuth();

  // Fetch available capabilities for dropdown
  const { data: capabilities = [] } = useQuery({
    queryKey: ['/api/capabilities'],
    enabled: true
  });

  // Fetch user preferences
  const { data: userPreferences } = useQuery({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch onboarding data to get selected features
  const { data: onboardingData, isLoading: onboardingLoading, error: onboardingError } = useQuery({
    queryKey: ['/api/onboarding/status'],
    enabled: !!user,
    retry: 1,
    staleTime: 0, // Force fresh data
  });

  // Load recommended data types from onboarding features
  useEffect(() => {
    console.log('Master Data Setup effect triggered with onboarding data:', onboardingData);
    
    if (onboardingData?.selectedFeatures) {
      const features = onboardingData.selectedFeatures;
      setOnboardingFeatures(features);
      
      // Collect recommended data types based on selected features
      const recommendedTypes = new Set<string>();
      features.forEach((feature: string) => {
        const requirements = featureDataRequirements[feature as keyof typeof featureDataRequirements];
        if (requirements) {
          requirements.forEach(type => recommendedTypes.add(type));
        }
      });
      
      const recommendedArray = Array.from(recommendedTypes);
      setRecommendedDataTypes(recommendedArray);
      
      console.log('Recommended data types based on features:', recommendedArray);
      console.log('Selected features:', features);
    }
  }, [onboardingData]);

  const handleGenerateAISampleData = () => {
    const companyInfo = userPreferences?.companyInfo;
    if (companyInfo) {
      // Build AI prompt with company information
      const prompt = `Generate realistic sample data for ${companyInfo.name}, a ${companyInfo.size} ${companyInfo.industry} company with ${companyInfo.numberOfPlants || '3'} manufacturing plants. 
      
Company Details:
- Industry: ${companyInfo.industry}
- Size: ${companyInfo.size}
- Plants: ${companyInfo.numberOfPlants || '3'}
${companyInfo.website ? `- Website: ${companyInfo.website}` : ''}
${companyInfo.products ? `- Products: ${companyInfo.products}` : ''}
${companyInfo.description ? `- Description: ${companyInfo.description}` : ''}

Create authentic manufacturing data that reflects this company's operations.`;

      setAiPrompt(prompt);
    }
    setShowAIDialog(true);
  };

  const dataTypes = [
    // Core Manufacturing
    { key: 'resources', label: 'Resources', icon: Wrench, description: 'Equipment, machinery, and personnel' },
    { key: 'productionOrders', label: 'Production Orders', icon: Briefcase, description: 'Active production work orders' },
    { key: 'operations', label: 'Operations', icon: Cog, description: 'Manufacturing operations and processes' },
    { key: 'plannedOrders', label: 'Planned Orders', icon: Calendar, description: 'Future planned production orders' },
    { key: 'capabilities', label: 'Capabilities', icon: Database, description: 'Skills and machine capabilities' },
    { key: 'plants', label: 'Plants', icon: Building, description: 'Manufacturing facilities and locations' },
    
    // Organizational Structure
    { key: 'sites', label: 'Sites', icon: MapPin, description: 'Manufacturing sites and locations' },
    { key: 'departments', label: 'Departments', icon: Building2, description: 'Organizational departments' },
    { key: 'workCenters', label: 'Work Centers', icon: Factory, description: 'Production work centers' },
    { key: 'employees', label: 'Employees', icon: Users, description: 'Personnel and workforce' },
    
    // Products & Inventory
    { key: 'items', label: 'Items', icon: Package, description: 'Products, components, and materials' },
    { key: 'storageLocations', label: 'Storage Locations', icon: Warehouse, description: 'Storage facilities and locations' },
    { key: 'inventory', label: 'Inventory', icon: Package2, description: 'Current stock levels and quantities' },
    { key: 'inventoryLots', label: 'Inventory Lots', icon: Hash, description: 'Lot-controlled inventory tracking' },
    
    // Business Partners
    { key: 'vendors', label: 'Vendors', icon: Building2, description: 'Suppliers and vendor information' },
    { key: 'customers', label: 'Customers', icon: Users, description: 'Customer accounts and information' },
    
    // Sales & Orders
    { key: 'salesOrders', label: 'Sales Orders', icon: ShoppingCart, description: 'Customer orders and sales' },
    { key: 'purchaseOrders', label: 'Purchase Orders', icon: FileText, description: 'Supplier purchase orders' },
    { key: 'transferOrders', label: 'Transfer Orders', icon: ArrowLeftRight, description: 'Inter-location transfers' },
    
    // Manufacturing Planning
    { key: 'billsOfMaterial', label: 'Bills of Material', icon: List, description: 'Product recipes and formulas' },
    { key: 'routings', label: 'Routings', icon: Route, description: 'Manufacturing process sequences' },
    { key: 'forecasts', label: 'Forecasts', icon: TrendingUp, description: 'Demand and supply forecasts' },
    
    // System Users
    { key: 'users', label: 'Users', icon: UserCheck, description: 'System users and operators' }
  ];

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

  return (
    <div className={`
      p-3 sm:p-6 space-y-4 sm:space-y-6
      ml-3 mr-3
      ${isMaxOpen ? 'md:ml-0 md:mr-0' : 'md:ml-12 md:mr-12'}
      max-w-full overflow-x-hidden
    `}>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            <h1 className="text-xl md:text-2xl font-bold">Master Data Setup</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Set up your company's core manufacturing data quickly and easily. 
            Upload files, enter data in spreadsheet format, use text input, or download templates to get started.
          </p>
        </div>
        <div className="flex gap-2 lg:flex-shrink-0">
          <Button 
            onClick={handleGenerateAISampleData}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Sample Data</span>
            <span className="sm:hidden">AI Data</span>
          </Button>
          <Button 
            onClick={() => setShowAIModifyDialog(true)}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Edit2 className="h-4 w-4" />
            <span className="hidden sm:inline">AI Modify Data</span>
            <span className="sm:hidden">AI Modify</span>
          </Button>
          <Button 
            onClick={() => setShowConsolidatedDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Consolidated Template</span>
            <span className="sm:hidden">Multi-Template</span>
          </Button>
        </div>
      </div>

      {/* Feature-Based Recommendations */}
      {recommendedDataTypes.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Lightbulb className="h-5 w-5" />
              Recommended Data for Your Selected Features
            </CardTitle>
            <CardDescription className="text-blue-700">
              Based on your onboarding feature selections, these data elements are recommended to get started quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-800">Selected Features:</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('/onboarding?step=1', '_blank')}
                    className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {onboardingFeatures.map((feature) => (
                    <Badge key={feature} variant="outline" className="border-blue-300 text-blue-800">
                      {feature.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Recommended data types: {recommendedDataTypes.length} types</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendedDataTypes.map((type) => {
                    const dataType = dataTypes.find(dt => dt.key === type);
                    return dataType ? (
                      <Badge key={type} className="bg-blue-100 text-blue-800 border-blue-300">
                        {dataType.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <Tabs defaultValue="manage">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="manage" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Manage Data</span>
                <span className="sm:hidden">Manage</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Import Data</span>
                <span className="sm:hidden">Import</span>
              </TabsTrigger>
              <TabsTrigger value="structured" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Structured Entry</span>
                <span className="sm:hidden">Structured</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Text Entry</span>
                <span className="sm:hidden">Text</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">Templates</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manage" className="mt-6">
              <ManageDataTab dataType="plants" />
            </TabsContent>
            <TabsContent value="import" className="mt-6">
              <div className="text-center py-8 text-gray-500">
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Import Data Tab - Under Development</p>
                <p className="text-sm">Upload CSV files to import your data.</p>
              </div>
            </TabsContent>
            <TabsContent value="structured" className="mt-6">
              <div className="text-center py-8 text-gray-500">
                <Grid3X3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Structured Entry Tab - Under Development</p>
                <p className="text-sm">Enter data in spreadsheet format.</p>
              </div>
            </TabsContent>
            <TabsContent value="text" className="mt-6">
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Text Entry Tab - Under Development</p>
                <p className="text-sm">Enter data using natural text input.</p>
              </div>
            </TabsContent>
            <TabsContent value="templates" className="mt-6">
              <div className="text-center py-8 text-gray-500">
                <Download className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Templates Tab - Under Development</p>
                <p className="text-sm">Download CSV templates for data entry.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default DataImport;