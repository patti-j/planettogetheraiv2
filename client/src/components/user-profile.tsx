import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, User, Settings, Bell, Palette, Clock, Save, Upload, X, CreditCard, FileText, Key, Plus, Trash2, Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface UserProfile {
  id: string | number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  jobTitle?: string;
  department?: string;
  phoneNumber?: string;
  lastLogin?: string;
  createdAt?: string;
}

interface UserPreferences {
  id: number;
  userId: string | number;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    reminders: boolean;
    tours: boolean;
  };
  dashboardLayout: {
    sidebarCollapsed: boolean;
    defaultPage: string;
    widgetPreferences: Record<string, any>;
  };
}

interface UserSecret {
  id: number;
  userId: string;
  name: string;
  key: string;
  description?: string;
  category: string;
  isActive: boolean;
  lastUsed?: string;
  expiresAt?: string;
  encryptedValue?: string;
  createdAt: string;
  updatedAt: string;
}

// Secrets Management Tab Component
function SecretsManagementTab() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSecret, setEditingSecret] = useState<UserSecret | null>(null);
  const [showValue, setShowValue] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user secrets
  const { data: secrets = [], isLoading: secretsLoading } = useQuery<UserSecret[]>({
    queryKey: ['/api/user-secrets'],
  });

  // Create secret mutation
  const createSecretMutation = useMutation({
    mutationFn: async (data: { name: string; key: string; description?: string; category: string; encryptedValue: string }) => {
      return apiRequest('POST', '/api/user-secrets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-secrets'] });
      setIsCreating(false);
      toast({
        title: "Success",
        description: "Secret key created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create secret key",
        variant: "destructive",
      });
    },
  });

  // Update secret mutation
  const updateSecretMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UserSecret> }) => {
      return apiRequest('PUT', `/api/user-secrets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-secrets'] });
      setEditingSecret(null);
      toast({
        title: "Success",
        description: "Secret key updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update secret key",
        variant: "destructive",
      });
    },
  });

  // Delete secret mutation
  const deleteSecretMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/user-secrets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-secrets'] });
      toast({
        title: "Success",
        description: "Secret key deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete secret key",
        variant: "destructive",
      });
    },
  });

  const handleCreateSecret = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    createSecretMutation.mutate({
      name: formData.get('name') as string,
      key: formData.get('key') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      encryptedValue: formData.get('value') as string,
    });
  };

  const handleUpdateSecret = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSecret) return;
    
    const formData = new FormData(event.currentTarget);
    const value = formData.get('value') as string;
    
    const updateData: Partial<UserSecret> = {
      name: formData.get('name') as string,
      key: formData.get('key') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
    };

    if (value) {
      updateData.encryptedValue = value;
    }
    
    updateSecretMutation.mutate({
      id: editingSecret.id,
      data: updateData,
    });
  };

  const toggleShowValue = (secretId: number) => {
    setShowValue(prev => ({
      ...prev,
      [secretId]: !prev[secretId]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          API Keys & Secrets Management
        </CardTitle>
        <CardDescription>
          Securely store and manage API keys, tokens, and other sensitive connection data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Secret Button */}
        {!isCreating && !editingSecret && (
          <Button 
            onClick={() => setIsCreating(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Secret
          </Button>
        )}

        {/* Create Secret Form */}
        {isCreating && (
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Create New Secret</CardTitle>
              <CardDescription>
                Add a new API key or secret to your secure vault
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSecret} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Name *</Label>
                    <Input
                      id="create-name"
                      name="name"
                      placeholder="e.g., OpenAI API Key"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-key">Key Identifier *</Label>
                    <Input
                      id="create-key"
                      name="key"
                      placeholder="e.g., OPENAI_API_KEY"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="create-category">Category *</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai">AI Services</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="payment">Payment Processing</SelectItem>
                      <SelectItem value="messaging">Messaging</SelectItem>
                      <SelectItem value="storage">Cloud Storage</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-value">Secret Value *</Label>
                  <Input
                    id="create-value"
                    name="value"
                    type="password"
                    placeholder="Enter the secret value"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-description">Description</Label>
                  <Textarea
                    id="create-description"
                    name="description"
                    placeholder="Optional description of this secret's purpose"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createSecretMutation.isPending}
                  >
                    {createSecretMutation.isPending ? 'Creating...' : 'Create Secret'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Edit Secret Form */}
        {editingSecret && (
          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="text-lg">Edit Secret</CardTitle>
              <CardDescription>
                Update your secret information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateSecret} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingSecret.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-key">Key Identifier *</Label>
                    <Input
                      id="edit-key"
                      name="key"
                      defaultValue={editingSecret.key}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select name="category" defaultValue={editingSecret.category}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai">AI Services</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="payment">Payment Processing</SelectItem>
                      <SelectItem value="messaging">Messaging</SelectItem>
                      <SelectItem value="storage">Cloud Storage</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-value">New Secret Value (leave empty to keep current)</Label>
                  <Input
                    id="edit-value"
                    name="value"
                    type="password"
                    placeholder="Enter new value or leave empty to keep current"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingSecret.description || ''}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={updateSecretMutation.isPending}
                  >
                    {updateSecretMutation.isPending ? 'Updating...' : 'Update Secret'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingSecret(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Secrets List */}
        {secretsLoading ? (
          <div className="space-y-4">
            <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : secrets.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No secrets stored yet</p>
            <p className="text-sm text-gray-400">Add your first API key or secret to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {secrets.map((secret: UserSecret) => (
              <Card key={secret.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{secret.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {secret.category}
                        </Badge>
                        <Badge 
                          variant={secret.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {secret.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Key: <code className="bg-gray-100 px-1 rounded text-xs">{secret.key}</code>
                      </p>
                      {secret.description && (
                        <p className="text-sm text-gray-500 mb-2">{secret.description}</p>
                      )}
                      <div className="text-xs text-gray-400">
                        Created: {new Date(secret.createdAt).toLocaleDateString()}
                        {secret.lastUsed && (
                          <span className="ml-4">
                            Last used: {new Date(secret.lastUsed).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSecret(secret)}
                        disabled={isCreating || editingSecret !== null}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSecretMutation.mutate(secret.id)}
                        disabled={deleteSecretMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function UserProfileDialogContent({ open, onOpenChange }: UserProfileDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<UserProfile>({
    queryKey: [`/api/auth/profile`],
    enabled: !!user?.id && open,
  });
  
  console.log("Profile dialog state:", { 
    open, 
    user, 
    userId: user?.id,
    queryEnabled: !!user?.id && open,
    profile, 
    profileLoading, 
    profileError 
  });

  // Fetch user preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery<UserPreferences>({
    queryKey: [`/api/user-preferences/${user?.id}`],
    enabled: !!user?.id && open,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      console.log("Sending profile update request with data:", data);
      const response = await apiRequest("PUT", `/api/auth/profile`, data);
      console.log("Profile update response:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("Profile update successful:", data);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/auth/profile`] });
      queryClient.invalidateQueries({ queryKey: [`/api/auth/me`] });
      setSelectedFile(null);
      setPreviewUrl(null);
      // Close the dialog after successful save
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      return await apiRequest("PUT", `/api/user-preferences`, data);
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user-preferences/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Profile form submitted!");
    
    const formData = new FormData(event.currentTarget);
    
    let avatarData = profile?.avatar;
    if (selectedFile && previewUrl) {
      avatarData = previewUrl;
    }

    const data = {
      avatar: avatarData,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      username: formData.get('username') as string,
      jobTitle: formData.get('jobTitle') as string || '',
      department: formData.get('department') as string || '',
      phoneNumber: formData.get('phoneNumber') as string || '',
    };

    // Debug log to see exact values being sent
    console.log("Form data collected with values:", {
      ...data,
      jobTitleValue: formData.get('jobTitle'),
      departmentValue: formData.get('department'),
      phoneNumberValue: formData.get('phoneNumber'),
    });
    
    updateProfileMutation.mutate(data);
  };

  const handlePreferencesUpdate = (field: string, value: any) => {
    if (!preferences) return;
    
    const updatedPreferences = { ...preferences } as any;
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updatedPreferences[parent] = {
        ...(updatedPreferences[parent] || {}),
        [child]: value
      };
    } else {
      updatedPreferences[field] = value;
    }

    updatePreferencesMutation.mutate(updatedPreferences);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto z-[100000]"
        style={{ zIndex: 100000 }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            My Profile & Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          {/* Mobile: Horizontal scrolling tabs */}
          <div className="sm:hidden overflow-x-auto">
            <TabsList className="flex w-max gap-1 p-1">
              <TabsTrigger value="profile" className="flex items-center gap-1 text-xs flex-shrink-0 px-3 py-2">
                <User className="h-4 w-4" />
                Info
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-1 text-xs flex-shrink-0 px-3 py-2">
                <Settings className="h-4 w-4" />
                Prefs
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs flex-shrink-0 px-3 py-2">
                <Bell className="h-4 w-4" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="secrets" className="flex items-center gap-1 text-xs flex-shrink-0 px-3 py-2">
                <Key className="h-4 w-4" />
                Keys
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-1 text-xs flex-shrink-0 px-3 py-2">
                <CreditCard className="h-4 w-4" />
                Account
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Desktop: Grid layout */}
          <div className="hidden sm:block">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="secrets" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys & Secrets
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Account & Billing
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and avatar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <form 
                    key={profile?.id || 'profile-form'} 
                    onSubmit={handleProfileSubmit} 
                    className="space-y-6"
                  >
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage 
                            src={previewUrl || profile?.avatar} 
                            alt="Profile avatar" 
                          />
                          <AvatarFallback className="text-lg">
                            {profile ? getInitials(profile.firstName, profile.lastName) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">
                          {profile?.firstName} {profile?.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                        <Badge variant="outline">{profile?.jobTitle || 'No Title'}</Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Profile Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          defaultValue={profile?.firstName}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          defaultValue={profile?.lastName}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={profile?.email}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          defaultValue={profile?.username}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          name="jobTitle"
                          placeholder="e.g., Production Manager"
                          defaultValue={profile?.jobTitle || ''}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          name="department"
                          placeholder="e.g., Manufacturing Operations"
                          defaultValue={profile?.department || ''}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-1">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          placeholder="e.g., +1 (555) 123-4567"
                          defaultValue={profile?.phoneNumber || ''}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Reset form state
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          // Close the dialog
                          onOpenChange(false);
                        }}
                        disabled={updateProfileMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        onClick={(e) => {
                          console.log("Save Profile button clicked!");
                          // Don't prevent default - let form submit normally
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Preferences</CardTitle>
                <CardDescription>
                  Customize your experience with theme, language, and display settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {preferencesLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Theme
                        </Label>
                        <Select
                          value={preferences?.theme || 'light'}
                          onValueChange={(value) => handlePreferencesUpdate('theme', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select
                          value={preferences?.language || 'en'}
                          onValueChange={(value) => handlePreferencesUpdate('language', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Timezone
                        </Label>
                        <Select
                          value={preferences?.timezone || 'UTC'}
                          onValueChange={(value) => handlePreferencesUpdate('timezone', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            {/* North America */}
                            <SelectItem value="America/New_York">Eastern Time (New York)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (Chicago)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (Denver)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (Los Angeles)</SelectItem>
                            <SelectItem value="America/Toronto">Toronto</SelectItem>
                            <SelectItem value="America/Vancouver">Vancouver</SelectItem>
                            <SelectItem value="America/Montreal">Montreal</SelectItem>
                            <SelectItem value="America/Phoenix">Phoenix</SelectItem>
                            <SelectItem value="America/Anchorage">Anchorage</SelectItem>
                            <SelectItem value="America/Mexico_City">Mexico City</SelectItem>
                            {/* South America */}
                            <SelectItem value="America/Sao_Paulo">São Paulo</SelectItem>
                            <SelectItem value="America/Buenos_Aires">Buenos Aires</SelectItem>
                            <SelectItem value="America/Lima">Lima</SelectItem>
                            <SelectItem value="America/Santiago">Santiago</SelectItem>
                            <SelectItem value="America/Bogota">Bogotá</SelectItem>
                            <SelectItem value="America/Caracas">Caracas</SelectItem>
                            {/* Europe */}
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Berlin">Berlin</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Europe/Rome">Rome</SelectItem>
                            <SelectItem value="Europe/Madrid">Madrid</SelectItem>
                            <SelectItem value="Europe/Amsterdam">Amsterdam</SelectItem>
                            <SelectItem value="Europe/Brussels">Brussels</SelectItem>
                            <SelectItem value="Europe/Vienna">Vienna</SelectItem>
                            <SelectItem value="Europe/Zurich">Zurich</SelectItem>
                            <SelectItem value="Europe/Prague">Prague</SelectItem>
                            <SelectItem value="Europe/Warsaw">Warsaw</SelectItem>
                            <SelectItem value="Europe/Stockholm">Stockholm</SelectItem>
                            <SelectItem value="Europe/Oslo">Oslo</SelectItem>
                            <SelectItem value="Europe/Copenhagen">Copenhagen</SelectItem>
                            <SelectItem value="Europe/Helsinki">Helsinki</SelectItem>
                            <SelectItem value="Europe/Athens">Athens</SelectItem>
                            <SelectItem value="Europe/Budapest">Budapest</SelectItem>
                            <SelectItem value="Europe/Moscow">Moscow</SelectItem>
                            <SelectItem value="Europe/Kiev">Kiev</SelectItem>
                            <SelectItem value="Europe/Dublin">Dublin</SelectItem>
                            <SelectItem value="Europe/Lisbon">Lisbon</SelectItem>
                            {/* Asia */}
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                            <SelectItem value="Asia/Seoul">Seoul</SelectItem>
                            <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                            <SelectItem value="Asia/Hong_Kong">Hong Kong</SelectItem>
                            <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                            <SelectItem value="Asia/Bangkok">Bangkok</SelectItem>
                            <SelectItem value="Asia/Jakarta">Jakarta</SelectItem>
                            <SelectItem value="Asia/Manila">Manila</SelectItem>
                            <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur</SelectItem>
                            <SelectItem value="Asia/Mumbai">Mumbai</SelectItem>
                            <SelectItem value="Asia/Delhi">Delhi</SelectItem>
                            <SelectItem value="Asia/Kolkata">Kolkata</SelectItem>
                            <SelectItem value="Asia/Dhaka">Dhaka</SelectItem>
                            <SelectItem value="Asia/Karachi">Karachi</SelectItem>
                            <SelectItem value="Asia/Tehran">Tehran</SelectItem>
                            <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                            <SelectItem value="Asia/Riyadh">Riyadh</SelectItem>
                            <SelectItem value="Asia/Jerusalem">Jerusalem</SelectItem>
                            <SelectItem value="Asia/Beirut">Beirut</SelectItem>
                            {/* Africa */}
                            <SelectItem value="Africa/Cairo">Cairo</SelectItem>
                            <SelectItem value="Africa/Lagos">Lagos</SelectItem>
                            <SelectItem value="Africa/Nairobi">Nairobi</SelectItem>
                            <SelectItem value="Africa/Johannesburg">Johannesburg</SelectItem>
                            <SelectItem value="Africa/Cape_Town">Cape Town</SelectItem>
                            <SelectItem value="Africa/Casablanca">Casablanca</SelectItem>
                            {/* Australia & Oceania */}
                            <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                            <SelectItem value="Australia/Melbourne">Melbourne</SelectItem>
                            <SelectItem value="Australia/Brisbane">Brisbane</SelectItem>
                            <SelectItem value="Australia/Perth">Perth</SelectItem>
                            <SelectItem value="Australia/Adelaide">Adelaide</SelectItem>
                            <SelectItem value="Pacific/Auckland">Auckland</SelectItem>
                            <SelectItem value="Pacific/Honolulu">Honolulu</SelectItem>
                            <SelectItem value="Pacific/Fiji">Fiji</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Select
                          value={preferences?.dateFormat || 'MM/dd/yyyy'}
                          onValueChange={(value) => handlePreferencesUpdate('dateFormat', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                            <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                            <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                            <SelectItem value="MMM dd, yyyy">MMM DD, YYYY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Time Format</Label>
                        <Select
                          value={preferences?.timeFormat || '12h'}
                          onValueChange={(value) => handlePreferencesUpdate('timeFormat', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                            <SelectItem value="24h">24 Hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Control how you receive notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {preferencesLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          checked={preferences?.notifications?.email ?? true}
                          onCheckedChange={(checked) => 
                            handlePreferencesUpdate('notifications.email', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive browser push notifications
                          </p>
                        </div>
                        <Switch
                          checked={preferences?.notifications?.push ?? true}
                          onCheckedChange={(checked) => 
                            handlePreferencesUpdate('notifications.push', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Desktop Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Show desktop notifications when app is minimized
                          </p>
                        </div>
                        <Switch
                          checked={preferences?.notifications?.desktop ?? true}
                          onCheckedChange={(checked) => 
                            handlePreferencesUpdate('notifications.desktop', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Reminders</Label>
                          <p className="text-sm text-muted-foreground">
                            Get reminders for important tasks and deadlines
                          </p>
                        </div>
                        <Switch
                          checked={preferences?.notifications?.reminders ?? true}
                          onCheckedChange={(checked) => 
                            handlePreferencesUpdate('notifications.reminders', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Tour Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications about new guided tours
                          </p>
                        </div>
                        <Switch
                          checked={preferences?.notifications?.tours ?? true}
                          onCheckedChange={(checked) => 
                            handlePreferencesUpdate('notifications.tours', checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account & Billing Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Account & Billing
                </CardTitle>
                <CardDescription>
                  Manage your account information and billing settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Account Status</Label>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Plan Type</Label>
                        <p className="text-sm text-gray-600">Professional</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Account Created</Label>
                        <p className="text-sm text-gray-600">
                          {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Billing Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Next Billing Date</Label>
                        <p className="text-sm text-gray-600">January 15, 2025</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <p className="text-sm text-gray-600">•••• •••• •••• 4242</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/billing'}
                        className="w-full"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Manage Billing
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/billing?tab=subscription'}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <Settings className="h-6 w-6" />
                      <span className="text-sm">Manage Subscription</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/billing?tab=payment'}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <CreditCard className="h-6 w-6" />
                      <span className="text-sm">Payment Methods</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/billing?tab=invoices'}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <FileText className="h-6 w-6" />
                      <span className="text-sm">Billing History</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Secrets Management Tab */}
          <TabsContent value="secrets" className="space-y-6">
            <SecretsManagementTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Main export component with trigger - supports both internal and external state management
export function UserProfileDialog({ open: externalOpen, onOpenChange: externalOnOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;

  console.log('🎯 UserProfileDialog state check:', {
    externalOpen,
    internalOpen,
    isOpen,
    hasExternalOnChange: !!externalOnOpenChange
  });

  return (
    <>
      {/* Only show the gear icon button if no external state management is provided */}
      {externalOpen === undefined && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </Button>
      )}
      <UserProfileDialogContent open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}