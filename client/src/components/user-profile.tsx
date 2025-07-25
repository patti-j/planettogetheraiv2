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
import { Camera, User, Settings, Bell, Palette, Clock, Save, Upload, X, CreditCard, FileText } from "lucide-react";
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
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${user?.id}/profile`],
    enabled: !!user?.id && open,
  });

  // Fetch user preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery<UserPreferences>({
    queryKey: [`/api/users/${user?.id}/preferences`],
    enabled: !!user?.id && open,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      return await apiRequest("PUT", `/api/users/${user?.id}/profile`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/profile`] });
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      return await apiRequest("PUT", `/api/users/${user?.id}/preferences`, data);
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/preferences`] });
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
    const formData = new FormData(event.currentTarget);
    
    let avatarData = profile?.avatar;
    if (selectedFile && previewUrl) {
      avatarData = previewUrl;
    }

    const data = {
      avatar: avatarData,
      jobTitle: formData.get('jobTitle') as string,
      department: formData.get('department') as string,
      phoneNumber: formData.get('phoneNumber') as string,
    };

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            My Profile & Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="account" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Account & Billing
            </TabsTrigger>
          </TabsList>

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
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
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
                          readOnly
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Contact your system administrator to change your name
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          defaultValue={profile?.lastName}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={profile?.email}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          defaultValue={profile?.username}
                          readOnly
                          className="bg-gray-50"
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
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
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
                        onClick={() => window.location.href = '/account'}
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
                      onClick={() => window.location.href = '/account?section=subscription'}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <Settings className="h-6 w-6" />
                      <span className="text-sm">Manage Subscription</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/account?section=billing'}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <CreditCard className="h-6 w-6" />
                      <span className="text-sm">Payment Methods</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/account?section=invoices'}
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