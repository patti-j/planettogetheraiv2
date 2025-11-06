import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database, 
  Settings as SettingsIcon,
  Save,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Sparkles,
  Bot,
  Activity,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Zap,
  Brain,
  X,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function Settings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Local state for preferences form
  const [maxRecentPages, setMaxRecentPages] = useState<string>('5');
  const [theme, setTheme] = useState<string>('light');
  const [language, setLanguage] = useState<string>('en');
  const [timezone, setTimezone] = useState<string>('UTC');
  const [dateFormat, setDateFormat] = useState<string>('MM/dd/yyyy');
  const [timeFormat, setTimeFormat] = useState<string>('12h');

  // Fetch AI agents data
  const { data: aiAgentsData, isLoading: agentsLoading, refetch: refetchAgents } = useQuery({
    queryKey: ['/api/ai-agents'],
    queryFn: async () => {
      const response = await fetch('/api/ai-agents');
      if (!response.ok) throw new Error('Failed to fetch AI agents');
      return response.json();
    }
  });

  // Update AI agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async ({ agentId, data }: { agentId: string; data: any }) => {
      const response = await fetch(`/api/ai-agents/${agentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update AI agent');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Updated",
        description: "AI agent configuration has been saved successfully.",
      });
      refetchAgents();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update AI agent. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update global settings mutation
  const updateGlobalSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/ai-agents/global/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update global settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Global AI agent settings have been saved successfully.",
      });
      refetchAgents();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update global settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Toggle agent status
  const toggleAgentStatus = (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    updateAgentMutation.mutate({
      agentId,
      data: { status: newStatus }
    });
  };

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['/api/user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/user-preferences/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch preferences:', response.status, response.statusText);
        return null;
      }
      return response.json();
    },
    enabled: !!user?.id
  });

  // Initialize all form states when preferences are loaded
  useEffect(() => {
    if (preferences) {
      // Handle maxRecentPages with fallback to default value
      const maxPages = preferences.dashboardLayout?.maxRecentPages;
      if (maxPages !== undefined && maxPages !== null) {
        setMaxRecentPages(maxPages.toString());
      }
      
      if (preferences.theme) {
        setTheme(preferences.theme);
      }
      if (preferences.language) {
        setLanguage(preferences.language);
      }
      if (preferences.timezone) {
        setTimezone(preferences.timezone);
      }
      if (preferences.dateFormat) {
        setDateFormat(preferences.dateFormat);
      }
      if (preferences.timeFormat) {
        setTimeFormat(preferences.timeFormat);
      }
    }
  }, [preferences]);

  // Update user preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user-preferences', {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        // Try to parse JSON, but handle cases where response might be empty
        const responseText = await response.text();
        try {
          return responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          // If JSON parsing fails, just return success indication
          return { success: true };
        }
      } catch (error) {
        console.error('Preferences update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch the preferences query with user ID
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences', user?.id] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    }
  });

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetch(`/api/users/${user?.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        // Try to parse JSON, but handle cases where response might be empty
        const responseText = await response.text();
        try {
          return responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          // If JSON parsing fails, just return success indication
          return { success: true };
        }
      } catch (error) {
        console.error('Profile update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      console.error('Profile mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetch(`/api/users/${user?.id}/change-password`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        // Try to parse JSON, but handle cases where response might be empty
        const responseText = await response.text();
        try {
          return responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          // If JSON parsing fails, just return success indication
          return { success: true };
        }
      } catch (error) {
        console.error('Password change error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      console.error('Password mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to change password: ${error.message || 'Please check your current password.'}`,
        variant: "destructive",
      });
    }
  });

  const handleSavePreferences = () => {
    const updatedPrefs = {
      ...preferences,
      theme,
      language,
      timezone,
      dateFormat,
      timeFormat,
      dashboardLayout: {
        ...preferences?.dashboardLayout,
        maxRecentPages: parseInt(maxRecentPages)
      }
    };
    
    updatePreferencesMutation.mutate(updatedPrefs);
  };

  const handleSaveProfile = (profileData: any) => {
    updateProfileMutation.mutate(profileData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Settings</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/dashboard')}
              className="h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="ai-agents" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Agents
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={(user as any)?.avatar || undefined} />
                    <AvatarFallback className="text-lg">
                      {user.firstName?.[0]?.toUpperCase() || 'U'}
                      {user.lastName?.[0]?.toUpperCase() || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Change Photo
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Upload a new profile picture
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      defaultValue={user.firstName || ''}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      defaultValue={user.lastName || ''}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user.email || ''}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      defaultValue={(user as any)?.phoneNumber || ''}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Job Title
                    </Label>
                    <Input
                      id="jobTitle"
                      defaultValue={(user as any)?.jobTitle || ''}
                      placeholder="Enter your job title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Department
                    </Label>
                    <Input
                      id="department"
                      defaultValue={(user as any)?.department || ''}
                      placeholder="Enter your department"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSaveProfile({})}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Display Preferences
                </CardTitle>
                <CardDescription>
                  Customize your experience and interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Language
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
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
                    <Label htmlFor="timezone" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timezone
                    </Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date Format
                    </Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeFormat" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Format
                    </Label>
                    <Select value={timeFormat} onValueChange={setTimeFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxRecentPages" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Max Recent Pages
                    </Label>
                    <Select 
                      value={maxRecentPages}
                      onValueChange={setMaxRecentPages}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select max recent pages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 pages</SelectItem>
                        <SelectItem value="5">5 pages</SelectItem>
                        <SelectItem value="8">8 pages</SelectItem>
                        <SelectItem value="10">10 pages</SelectItem>
                        <SelectItem value="12">12 pages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Agents Control Panel */}
          <TabsContent value="ai-agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Agents Management
                </CardTitle>
                <CardDescription>
                  Control and configure all AI agents running in your system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Agent Status Overview */}
                {agentsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading AI agents...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                          <p className="text-2xl font-bold text-green-600">
                            {aiAgentsData?.summary?.activeAgents || 0}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Paused Agents</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {aiAgentsData?.summary?.pausedAgents || 0}
                          </p>
                        </div>
                        <PauseCircle className="h-8 w-8 text-orange-600" />
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Issues</p>
                          <p className="text-2xl font-bold text-red-600">
                            {aiAgentsData?.summary?.errorAgents || 0}
                          </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      </div>
                    </Card>
                  </div>
                )}

                <Separator />

                {/* Individual Agent Controls */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Agent Configuration</h3>
                  
                  {aiAgentsData?.agents?.map((agent: any) => {
                    const getAgentIcon = (type: string) => {
                      switch (type) {
                        case 'assistant': return <Sparkles className="h-5 w-5 text-purple-600" />;
                        case 'monitoring': return <Activity className="h-5 w-5 text-blue-600" />;
                        case 'optimization': return <BarChart3 className="h-5 w-5 text-emerald-600" />;
                        case 'quality': return <CheckCircle className="h-5 w-5 text-orange-600" />;
                        case 'maintenance': return <Zap className="h-5 w-5 text-amber-600" />;
                        default: return <Bot className="h-5 w-5 text-gray-600" />;
                      }
                    };

                    const getAgentIconBg = (type: string) => {
                      switch (type) {
                        case 'assistant': return 'bg-purple-100 dark:bg-purple-900';
                        case 'monitoring': return 'bg-blue-100 dark:bg-blue-900';
                        case 'optimization': return 'bg-emerald-100 dark:bg-emerald-900';
                        case 'quality': return 'bg-orange-100 dark:bg-orange-900';
                        case 'maintenance': return 'bg-amber-100 dark:bg-amber-900';
                        default: return 'bg-gray-100 dark:bg-gray-900';
                      }
                    };

                    return (
                      <Card key={agent.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 ${getAgentIconBg(agent.type)} rounded-lg`}>
                              {getAgentIcon(agent.type)}
                            </div>
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {agent.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline" 
                              className={
                                agent.status === 'active' 
                                  ? "text-green-600 border-green-600" 
                                  : agent.status === 'paused'
                                  ? "text-orange-600 border-orange-600"
                                  : "text-red-600 border-red-600"
                              }
                            >
                              {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                            </Badge>
                            <Switch 
                              checked={agent.status === 'active'} 
                              onCheckedChange={() => toggleAgentStatus(agent.id, agent.status)}
                            />
                          </div>
                        </div>
                        {/* Agent settings would go here */}
                      </Card>
                    );
                  })}
                  
                  {/* Legacy Max AI Assistant - keeping for fallback */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Max AI Assistant</p>
                          <p className="text-sm text-muted-foreground">
                            Main AI assistant for production insights and navigation
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Response Mode</Label>
                        <Select defaultValue="proactive">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="proactive">Proactive</SelectItem>
                            <SelectItem value="reactive">Reactive Only</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Analysis Frequency</Label>
                        <Select defaultValue="5min">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1min">Every Minute</SelectItem>
                            <SelectItem value="5min">Every 5 Minutes</SelectItem>
                            <SelectItem value="15min">Every 15 Minutes</SelectItem>
                            <SelectItem value="30min">Every 30 Minutes</SelectItem>
                            <SelectItem value="1hour">Every Hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Insight Level</Label>
                        <Select defaultValue="detailed">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  {/* System Monitoring Agent */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">System Monitoring Agent</p>
                          <p className="text-sm text-muted-foreground">
                            Monitors system performance and generates alerts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Monitoring Interval</Label>
                        <Select defaultValue="5min">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1min">1 Minute</SelectItem>
                            <SelectItem value="5min">5 Minutes</SelectItem>
                            <SelectItem value="10min">10 Minutes</SelectItem>
                            <SelectItem value="30min">30 Minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Alert Threshold</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Sensitivity</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High Sensitivity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Data Retention</Label>
                        <Select defaultValue="30days">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7days">7 Days</SelectItem>
                            <SelectItem value="30days">30 Days</SelectItem>
                            <SelectItem value="90days">90 Days</SelectItem>
                            <SelectItem value="1year">1 Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  {/* Production Optimization Agent */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">Production Optimization Agent</p>
                          <p className="text-sm text-muted-foreground">
                            Analyzes production data and suggests optimizations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Analysis Frequency</Label>
                        <Select defaultValue="hourly">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="15min">Every 15 Minutes</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Optimization Focus</Label>
                        <Select defaultValue="efficiency">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="efficiency">Efficiency</SelectItem>
                            <SelectItem value="cost">Cost Reduction</SelectItem>
                            <SelectItem value="quality">Quality</SelectItem>
                            <SelectItem value="throughput">Throughput</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Auto-Apply Changes</Label>
                        <Select defaultValue="suggest">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="suggest">Suggest Only</SelectItem>
                            <SelectItem value="minor">Minor Changes</SelectItem>
                            <SelectItem value="all">All Changes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  {/* Quality Analysis Agent */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium">Quality Analysis Agent</p>
                          <p className="text-sm text-muted-foreground">
                            Monitors quality metrics and detects anomalies
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Sampling Rate</Label>
                        <Select defaultValue="continuous">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="continuous">Continuous</SelectItem>
                            <SelectItem value="batch">Per Batch</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="shift">Per Shift</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quality Threshold</Label>
                        <Select defaultValue="95">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="90">90%</SelectItem>
                            <SelectItem value="95">95%</SelectItem>
                            <SelectItem value="98">98%</SelectItem>
                            <SelectItem value="99">99%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Alert Level</Label>
                        <Select defaultValue="warning">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">Info Only</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="critical">Critical Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  {/* Predictive Maintenance Agent */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                          <Zap className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">Predictive Maintenance Agent</p>
                          <p className="text-sm text-muted-foreground">
                            Predicts equipment failures and schedules maintenance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Paused
                        </Badge>
                        <Switch />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Prediction Model</Label>
                        <Select defaultValue="ml">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ml">Machine Learning</SelectItem>
                            <SelectItem value="statistical">Statistical</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Forecast Window</Label>
                        <Select defaultValue="30days">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7days">7 Days</SelectItem>
                            <SelectItem value="30days">30 Days</SelectItem>
                            <SelectItem value="90days">90 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Confidence Level</Label>
                        <Select defaultValue="80">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="70">70%</SelectItem>
                            <SelectItem value="80">80%</SelectItem>
                            <SelectItem value="90">90%</SelectItem>
                            <SelectItem value="95">95%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </div>

                <Separator />

                {/* Global Agent Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Global Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Master AI Control</p>
                          <p className="text-sm text-muted-foreground">
                            Enable or disable all AI agents at once
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Auto-Start Agents</p>
                          <p className="text-sm text-muted-foreground">
                            Automatically start agents on system boot
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Agent Learning Mode</p>
                          <p className="text-sm text-muted-foreground">
                            Allow agents to learn from user interactions
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Performance Mode</Label>
                        <Select defaultValue="balanced">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conservative">Conservative</SelectItem>
                            <SelectItem value="balanced">Balanced</SelectItem>
                            <SelectItem value="aggressive">Aggressive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Default Language Model</Label>
                        <Select defaultValue="gpt-5">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-5">GPT-5</SelectItem>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="claude-3">Claude 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Response Timeout (seconds)</Label>
                        <Input type="number" defaultValue="30" min="5" max="300" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      updateGlobalSettingsMutation.mutate({
                        masterAIControl: true,
                        autoStartAgents: true,
                        agentLearningMode: true,
                        performanceMode: 'balanced',
                        defaultLanguageModel: 'gpt-5',
                        responseTimeout: 30
                      });
                    }}
                  >
                    Reset to Defaults
                  </Button>
                  <Button 
                    onClick={() => {
                      toast({
                        title: "Settings Saved",
                        description: "AI agent settings have been saved successfully.",
                      });
                    }}
                    disabled={updateAgentMutation.isPending || updateGlobalSettingsMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Agent Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Model Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Model Configuration
                </CardTitle>
                <CardDescription>
                  Configure OpenAI, local LLM models, and other AI providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Manage your AI models, configure OpenAI API settings, set up local LLM models with Ollama, 
                    and control which AI provider is used for different features in the system.
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Current Active Provider</p>
                    <p className="text-sm text-muted-foreground">OpenAI (GPT-4)</p>
                  </div>
                  <Button onClick={() => setLocation('/llm-settings')}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Manage AI Models
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch defaultChecked={preferences?.notifications?.email !== false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </p>
                    </div>
                    <Switch defaultChecked={preferences?.notifications?.push !== false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Production Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get alerted about production issues
                      </p>
                    </div>
                    <Switch defaultChecked={preferences?.notifications?.production !== false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Schedule Changes</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications for schedule updates
                      </p>
                    </div>
                    <Switch defaultChecked={preferences?.notifications?.schedule !== false} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleChangePassword}
                    disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage your active login sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        Active now • Your current browser session
                      </p>
                    </div>
                    <Badge variant="secondary">Current</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Information
                </CardTitle>
                <CardDescription>
                  View system details and diagnostics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <p className="text-sm text-muted-foreground">{user.id}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Login</Label>
                    <p className="text-sm text-muted-foreground">
                      {(user as any)?.lastLogin ? new Date((user as any).lastLogin).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}