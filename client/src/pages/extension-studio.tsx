import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Code, 
  Plus, 
  Play, 
  Settings, 
  Download, 
  Upload, 
  Eye, 
  Edit3, 
  Trash2, 
  Package, 
  Zap, 
  Layers, 
  Database, 
  BarChart3,
  Sparkles,
  FileText,
  Save,
  TestTube,
  Globe,
  Users,
  Star,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Workflow
} from "lucide-react";
import type { Extension, ExtensionFile, InsertExtension } from "@shared/schema";
import { WorkflowStudio } from "@/components/workflow-studio";

const ExtensionStudioPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);
  const [activeTab, setActiveTab] = useState("my-extensions");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ExtensionFile | null>(null);

  // Fetch user's extensions
  const { data: extensions = [], isLoading: extensionsLoading } = useQuery({
    queryKey: ['/api/extensions', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/extensions?userId=${user?.id}`);
      return await response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch marketplace extensions
  const { data: marketplaceExtensions = [], isLoading: marketplaceLoading } = useQuery({
    queryKey: ['/api/marketplace/extensions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/marketplace/extensions');
      return await response.json();
    },
  });

  // Fetch extension files when extension is selected
  const { data: extensionFiles = [] } = useQuery({
    queryKey: ['/api/extensions', selectedExtension?.id, 'files'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/extensions/${selectedExtension?.id}/files`);
      return await response.json();
    },
    enabled: !!selectedExtension?.id,
  });

  // Create extension mutation
  const createExtensionMutation = useMutation({
    mutationFn: async (data: InsertExtension) => {
      const response = await apiRequest('POST', '/api/extensions', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/extensions'] });
      setCreateDialogOpen(false);
      toast({
        title: "Extension Created",
        description: "Your extension has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create extension. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Extension types with icons and descriptions
  const extensionTypes = [
    { value: "component", label: "UI Component", icon: Layers, description: "Custom user interface components" },
    { value: "workflow", label: "Workflow", icon: Zap, description: "Automated business processes" },
    { value: "integration", label: "Integration", icon: Database, description: "Connect external systems" },
    { value: "dashboard", label: "Dashboard", icon: BarChart3, description: "Custom analytics dashboards" },
    { value: "report", label: "Report", icon: FileText, description: "Custom reporting tools" },
  ];

  const extensionCategories = [
    { value: "ui", label: "User Interface" },
    { value: "automation", label: "Automation" },
    { value: "analytics", label: "Analytics" },
    { value: "integration", label: "Integration" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "published": return "bg-blue-100 text-blue-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "deprecated": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = extensionTypes.find(t => t.value === type);
    return typeConfig?.icon || Package;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-6 border-b bg-white">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="md:ml-0 ml-12">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
              <Code className="w-6 h-6 mr-2" />
              Extension Studio
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Create and manage custom software extensions for your manufacturing platform
            </p>
          </div>
          <div className="flex gap-2 lg:flex-shrink-0">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Extension
                </Button>
              </DialogTrigger>
              <CreateExtensionDialog 
                onSubmit={(data) => createExtensionMutation.mutate(data)}
                isLoading={createExtensionMutation.isPending}
                types={extensionTypes}
                categories={extensionCategories}
                userId={user?.id || 0}
              />
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="my-extensions">My Extensions</TabsTrigger>
            <TabsTrigger value="workflows">
              <Workflow className="w-4 h-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="installed">Installed</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="flex-1 mt-4">
            <WorkflowStudio />
          </TabsContent>

          <TabsContent value="my-extensions" className="flex-1 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Extensions List */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Your Extensions</CardTitle>
                    <CardDescription>Extensions you've created</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      {extensionsLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-20 bg-gray-200 rounded-lg"></div>
                            </div>
                          ))}
                        </div>
                      ) : extensions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No extensions yet</p>
                          <Button 
                            variant="link" 
                            onClick={() => setCreateDialogOpen(true)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            Create your first extension
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {extensions.map((extension: Extension) => {
                            const TypeIcon = getTypeIcon(extension.type);
                            return (
                              <Card
                                key={extension.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                  selectedExtension?.id === extension.id ? 'ring-2 ring-purple-500' : ''
                                }`}
                                onClick={() => setSelectedExtension(extension)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <TypeIcon className="w-4 h-4 text-purple-600" />
                                        <h3 className="font-medium text-sm">{extension.displayName}</h3>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {extension.description}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <Badge className={`text-xs ${getStatusColor(extension.status)}`}>
                                          {extension.status}
                                        </Badge>
                                        <span className="text-xs text-gray-500">v{extension.version}</span>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Extension Details & Editor */}
              <div className="lg:col-span-2">
                {selectedExtension ? (
                  <ExtensionEditor
                    extension={selectedExtension}
                    files={extensionFiles}
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                  />
                ) : (
                  <Card className="h-full">
                    <CardContent className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <Code className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No Extension Selected</h3>
                        <p>Select an extension from the list to start editing</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="flex-1 mt-4">
            <MarketplaceView 
              extensions={marketplaceExtensions}
              isLoading={marketplaceLoading}
            />
          </TabsContent>

          <TabsContent value="installed" className="flex-1 mt-4">
            <InstalledExtensionsView userId={user?.id || 0} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Create Extension Dialog Component
const CreateExtensionDialog = ({ 
  onSubmit, 
  isLoading, 
  types, 
  categories, 
  userId 
}: {
  onSubmit: (data: InsertExtension) => void;
  isLoading: boolean;
  types: any[];
  categories: any[];
  userId: number;
}) => {
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    type: "",
    category: "",
    visibility: "private"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      createdBy: userId,
      configuration: {},
      sourceCode: `// ${formData.displayName} Extension
// Generated on ${new Date().toLocaleDateString()}

export default class ${formData.name.replace(/[^a-zA-Z0-9]/g, '')}Extension {
  constructor() {
    this.name = '${formData.displayName}';
    this.version = '1.0.0';
  }

  // Initialize your extension here
  initialize() {
    console.log('${formData.displayName} extension initialized');
  }

  // Add your extension logic here
}`,
    });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Create New Extension</DialogTitle>
        <DialogDescription>
          Build a custom extension to extend your manufacturing platform
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Extension Name</Label>
            <Input
              id="name"
              placeholder="my-custom-extension"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="My Custom Extension"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what your extension does..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Extension Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <div>
                          <div>{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="visibility">Visibility</Label>
          <Select value={formData.visibility} onValueChange={(value) => setFormData({ ...formData, visibility: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private - Only visible to you</SelectItem>
              <SelectItem value="company">Company - Visible to your organization</SelectItem>
              <SelectItem value="public">Public - Available in marketplace</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !formData.name || !formData.displayName || !formData.type || !formData.category}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            {isLoading ? "Creating..." : "Create Extension"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

// Extension Editor Component
const ExtensionEditor = ({ 
  extension, 
  files, 
  onFileSelect, 
  selectedFile 
}: {
  extension: Extension;
  files: ExtensionFile[];
  onFileSelect: (file: ExtensionFile) => void;
  selectedFile: ExtensionFile | null;
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const TypeIcon = extension.type === 'component' ? Layers :
                                extension.type === 'workflow' ? Zap :
                                extension.type === 'integration' ? Database :
                                extension.type === 'dashboard' ? BarChart3 :
                                extension.type === 'report' ? FileText : Package;
                return <TypeIcon className="w-5 h-5" />;
              })()}
              {extension.displayName}
            </CardTitle>
            <CardDescription>{extension.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <TestTube className="w-4 h-4 mr-2" />
              Test
            </Button>
            <Button variant="outline" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Deploy
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-full pb-6">
        <div className="grid grid-cols-4 gap-4 h-full">
          {/* File Explorer */}
          <div className="col-span-1 border-r pr-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Files</h4>
              <Button variant="ghost" size="sm">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`p-2 rounded cursor-pointer text-sm hover:bg-gray-100 ${
                      selectedFile?.id === file.id ? 'bg-purple-50 text-purple-700' : ''
                    }`}
                    onClick={() => onFileSelect(file)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      {file.filename}
                    </div>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="text-xs text-gray-500 p-2">
                    No files yet. Click + to add files.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Code Editor */}
          <div className="col-span-3">
            {selectedFile ? (
              <div className="h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium text-sm">{selectedFile.filename}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedFile.fileType}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm">
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-80 overflow-auto font-mono text-sm">
                  <pre>{selectedFile.content}</pre>
                </div>
              </div>
            ) : (
              <div className="h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Select a file to start editing</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Marketplace View Component
const MarketplaceView = ({ 
  extensions, 
  isLoading 
}: {
  extensions: any[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-32 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Extension Marketplace</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Browse All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {extensions.map((extension) => (
          <Card key={extension.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium">{extension.displayName}</h3>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  Featured
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {extension.description}
              </p>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-3 h-3 fill-yellow-400 text-yellow-400" 
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                </div>
                <span className="text-xs text-gray-500">
                  {extension.installCount || 0} installs
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Download className="w-3 h-3 mr-1" />
                  Install
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Installed Extensions View Component
const InstalledExtensionsView = ({ userId }: { userId: number }) => {
  const { data: installedExtensions = [], isLoading } = useQuery({
    queryKey: ['/api/users', userId, 'extensions'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${userId}/extensions`);
      return await response.json();
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading installed extensions...</div>;
  }

  if (installedExtensions.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No Extensions Installed</h3>
        <p className="text-gray-600 mb-4">Browse the marketplace to install extensions</p>
        <Button>
          <Globe className="w-4 h-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Installed Extensions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {installedExtensions.map((installation: any) => (
          <Card key={installation.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Extension Name</h3>
                <Badge className={`${
                  installation.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {installation.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Installed on {new Date(installation.installedAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExtensionStudioPage;