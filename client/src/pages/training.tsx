import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Users, Target, Monitor, RotateCcw, GraduationCap, Play, UserCheck, Settings, Shield, Edit3, Eye, Volume2, MessageSquare, Sparkles, RefreshCw, ChevronDown, ChevronRight, FileText, Clock, Plus, AlertCircle, Trash2, CheckCircle, AlertTriangle, Mic, VolumeX, Info, ArrowLeft, Loader2, X, Hourglass } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { useAITheme } from '@/hooks/use-ai-theme';
import { RoleSwitcher } from '@/components/role-switcher';
import { apiRequest } from '@/lib/queryClient';
import { useTour } from '@/contexts/TourContext';

interface Role {
  id: number;
  name: string;
  description: string;
  permissionCount?: number;
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  role: string;
  duration: string;
  features: string[];
  completed: boolean;
}

// Test Voice Button Component
function TestVoiceButton({ voiceSettings }: { voiceSettings: { voice: string; gender: string; speed: number } }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handleTestVoice = async () => {
    const testMessage = "Hello! This is a test of the voice settings you've selected. This will help you preview how the voice narration will sound during tours.";
    
    try {
      setIsLoading(true);
      
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Generate voice using OpenAI TTS API
      const response = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testMessage,
          voice: voiceSettings.voice,
          gender: voiceSettings.gender,
          speed: voiceSettings.speed,
          role: 'test'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate voice: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      console.log('Audio blob received:', audioBlob.size, 'bytes, type:', audioBlob.type);
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio data');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Set audio properties for better compatibility
      audio.preload = 'auto';
      audio.volume = 0.8;
      
      setCurrentAudio(audio);
      setIsLoading(false);
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      audio.onerror = (e) => {
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
        console.error('Error playing audio:', e);
      };
      
      try {
        await audio.play();
        console.log('Audio playback started successfully');
      } catch (playError) {
        console.error('Audio play() failed:', playError);
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
        
        toast({
          title: "Audio Playback Failed",
          description: "Could not play the voice preview. Try adjusting browser audio settings or reload the page.",
          variant: "destructive",
        });
        throw playError;
      }
    } catch (error) {
      console.error('Error testing voice:', error);
      setIsLoading(false);
      setIsPlaying(false);
      
      toast({
        title: "Voice Test Failed",
        description: "Could not generate voice preview. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleTestVoice}
      disabled={isLoading || isPlaying}
      variant="outline" 
      size="sm"
      className="w-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating Voice...
        </>
      ) : isPlaying ? (
        <>
          <Volume2 className="h-4 w-4 mr-2 animate-pulse" />
          Playing...
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4 mr-2" />
          Test Voice
        </>
      )}
    </Button>
  );
}

const trainingModules: TrainingModule[] = [
  {
    id: 'admin-overview',
    title: 'Administrator Overview',
    description: 'Complete system administration including user management and system configuration',
    category: 'System Management',
    role: 'Administrator',
    duration: '30 min',
    features: ['User Management', 'Role Configuration', 'System Settings', 'Security Controls'],
    completed: false,
  },
  {
    id: 'scheduler-basics',
    title: 'Production Scheduler Fundamentals',
    description: 'Learn to create and optimize production schedules using the Gantt chart interface',
    category: 'Production',
    role: 'Production Scheduler',
    duration: '45 min',
    features: ['Gantt Chart', 'Job Creation', 'Resource Assignment', 'Schedule Optimization'],
    completed: false,
  },
  {
    id: 'director-goals',
    title: 'Business Goals Management',
    description: 'Strategic goal setting, KPI tracking, and business performance monitoring',
    category: 'Strategic',
    role: 'Director',
    duration: '35 min',
    features: ['Business Goals', 'KPI Dashboard', 'Risk Management', 'Progress Tracking'],
    completed: false,
  },
  {
    id: 'operator-workflow',
    title: 'Shop Floor Operations',
    description: 'Daily operational tasks including status updates and quality reporting',
    category: 'Operations',
    role: 'Operator',
    duration: '20 min',
    features: ['Operation Status', 'Quality Reports', 'Task Management', 'Mobile Interface'],
    completed: false,
  },
  {
    id: 'systems-config',
    title: 'Systems Management',
    description: 'IT infrastructure management and system configuration for technical staff',
    category: 'Technical',
    role: 'Systems Manager',
    duration: '40 min',
    features: ['System Configuration', 'Data Management', 'Integration Setup', 'Performance Monitoring'],
    completed: false,
  },
];

export default function Training() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const { getThemeClasses } = useAITheme();
  const queryClient = useQueryClient();

  // Check if user has training permissions
  const canAccessTraining = hasPermission('training', 'view');

  // Get all system roles for demonstration (not just available roles)
  const { data: allRoles = [] } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
    enabled: canAccessTraining,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  // Get current role
  const { data: currentRole } = useQuery({
    queryKey: [`/api/users/${user?.id}/current-role`],
    enabled: !!user?.id && canAccessTraining,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  const startTrainingMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      // This would start a training session for the specific module
      return { moduleId, started: true };
    },
    onSuccess: (data) => {
      toast({
        title: "Training Started",
        description: `Training module has been started. Use the role switcher to experience different user perspectives.`,
      });
    },
  });

  if (!canAccessTraining) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Training Access Required</h2>
          <p className="text-gray-600">
            You need training permissions to access this page. Contact your administrator for access.
          </p>
        </div>
      </div>
    );
  }

  const filteredModules = trainingModules;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="md:ml-0 ml-12">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center">
            <GraduationCap className="w-6 h-6 mr-2" />
            Training & Role Demonstration
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Interactive training modules and role switching for comprehensive system demonstrations
          </p>
        </div>
        <div className="lg:flex-shrink-0">
          {user && <RoleSwitcher userId={user.id} currentRole={currentRole as Role} />}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{trainingModules.length}</div>
                  <div className="text-xs text-gray-500">Training Modules</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mr-2 sm:mr-3" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{allRoles.length}</div>
                  <div className="text-xs text-gray-500">Available Roles</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mr-2 sm:mr-3" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{trainingModules.filter(m => m.completed).length}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center">
                <Monitor className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mr-2 sm:mr-3" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold truncate max-w-[120px] sm:max-w-none">{(currentRole as Role)?.name || 'None'}</div>
                  <div className="text-xs text-gray-500">Current Role</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      <Tabs defaultValue="modules" className="space-y-4 sm:space-y-6">
        <TabsList className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-2 h-auto p-1 sm:p-1 bg-gray-100 rounded-lg">
          <TabsTrigger 
            value="modules" 
            className="flex-1 min-w-0 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap" 
            data-tab="training-modules" 
            data-tour-target="training-modules-tab"
          >
            <span className="hidden sm:inline">Training Modules</span>
            <span className="sm:hidden">Modules</span>
          </TabsTrigger>
          <TabsTrigger 
            value="roles" 
            className="flex-1 min-w-0 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap" 
            data-tab="role-demonstrations" 
            data-tour-target="role-demonstrations-tab"
          >
            <span className="hidden sm:inline">Role Demonstrations</span>
            <span className="sm:hidden">Roles</span>
          </TabsTrigger>
          <TabsTrigger 
            value="tours" 
            className="flex-1 min-w-0 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap" 
            data-tab="tour-management" 
            data-tour-target="tour-management-tab"
          >
            <span className="hidden sm:inline">Tour Management</span>
            <span className="sm:hidden">Tours</span>
          </TabsTrigger>
          <TabsTrigger 
            value="resources" 
            className="flex-1 min-w-0 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap" 
            data-tab="training-resources" 
            data-tour-target="training-resources-tab"
          >
            <span className="hidden sm:inline">Training Resources</span>
            <span className="sm:hidden">Resources</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4 sm:space-y-6 pt-6 sm:pt-8 mt-2 sm:mt-4">

          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="h-fit">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg line-clamp-2">{module.title}</CardTitle>
                      <CardDescription className="mt-2 text-xs sm:text-sm line-clamp-3">{module.description}</CardDescription>
                    </div>
                    {module.completed && (
                      <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-800 self-start text-xs">Completed</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm">
                      <span className="text-gray-500">Role:</span>
                      <Badge variant="outline" className="text-xs w-fit">{module.role}</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">{module.duration}</span>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500 mb-2">Features Covered:</div>
                      <div className="flex flex-wrap gap-1">
                        {module.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 text-xs sm:text-sm"
                      onClick={() => startTrainingMutation.mutate(module.id)}
                      disabled={startTrainingMutation.isPending}
                    >
                      <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{module.completed ? 'Review Module' : 'Start Training'}</span>
                      <span className="sm:hidden">{module.completed ? 'Review' : 'Start'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6 pt-6 sm:pt-8 mt-2 sm:mt-4">
          <RoleDemonstrationSection userId={user?.id} currentRole={currentRole as Role} />
        </TabsContent>

        <TabsContent value="tours" className="space-y-6 pt-6 sm:pt-8 mt-2 sm:mt-4">
          <TourManagementSection />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4 sm:space-y-6 pt-6 sm:pt-8 mt-2 sm:mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Documentation</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Comprehensive guides and reference materials</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li>• User Guide: Complete system walkthrough</li>
                  <li>• Administrator Manual: Setup and configuration</li>
                  <li>• API Reference: Integration documentation</li>
                  <li>• Best Practices: Optimization techniques</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Video Tutorials</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Visual learning resources and demonstrations</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li>• Getting Started: 15-minute overview</li>
                  <li>• Role-based Workflows: Feature demonstrations</li>
                  <li>• Advanced Features: Expert techniques</li>
                  <li>• Troubleshooting: Common issues and solutions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Role Demonstration Component
interface RoleDemonstrationSectionProps {
  userId?: number;
  currentRole?: Role | null;
}

function RoleDemonstrationSection({ userId, currentRole }: RoleDemonstrationSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all system roles for demonstration
  const { data: allRoles = [] } = useQuery<Role[]>({
    queryKey: ['/api/roles/all'],
    enabled: !!userId,
    staleTime: 0, // Always refetch to ensure fresh role data
  });

  // Switch role mutation for demonstration
  const switchRoleMutation = useMutation({
    mutationFn: (roleId: number) => 
      apiRequest('POST', `/api/users/${userId}/switch-role`, { roleId }),
    onSuccess: (data, roleId) => {
      const roleName = allRoles.find(r => r.id === roleId)?.name || 'Unknown';
      toast({
        title: "Role Switched Successfully",
        description: `Switched to ${roleName} role. Redirecting to appropriate page...`,
      });
      
      // Invalidate all queries to refresh the UI with new permissions
      queryClient.invalidateQueries();
      
      // Determine appropriate redirect based on role
      const getRedirectPath = (roleName: string): string => {
        const roleNameLower = roleName.toLowerCase();
        
        if (roleNameLower.includes('trainer') || roleNameLower.includes('systems manager')) {
          return '/training'; // These roles can access training
        }
        if (roleNameLower.includes('scheduler') || roleNameLower.includes('production')) {
          return '/production-schedule'; // Production schedulers go to main dashboard
        }
        if (roleNameLower.includes('director')) {
          return '/business-goals'; // Directors go to business goals
        }
        if (roleNameLower.includes('admin')) {
          return '/role-management'; // Admins go to user management
        }
        if (roleNameLower.includes('operator')) {
          return '/operator-dashboard'; // Operators go to operator dashboard
        }
        if (roleNameLower.includes('sales')) {
          return '/sales'; // Sales go to sales dashboard
        }
        if (roleNameLower.includes('maintenance')) {
          return '/maintenance'; // Maintenance to maintenance page
        }
        if (roleNameLower.includes('manager')) {
          return '/analytics'; // Managers go to analytics
        }
        
        return '/production-schedule'; // Default to main dashboard
      };
      
      const redirectPath = getRedirectPath(roleName);
      
      // Navigate to appropriate page for the role
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Role Switch Failed",
        description: error.message || "Failed to switch roles for demonstration",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // The mutation will automatically reset its state after completion
      // This helps prevent stuck button states
    },
  });

  const handleDemonstrateRole = (roleId: number) => {
    switchRoleMutation.mutate(roleId);
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName.toLowerCase().includes('admin')) return Shield;
    if (roleName.toLowerCase().includes('manager')) return Settings;
    if (roleName.toLowerCase().includes('director')) return Target;
    if (roleName.toLowerCase().includes('scheduler')) return Monitor;
    return UserCheck;
  };

  const getRoleColor = (roleName: string) => {
    if (roleName.toLowerCase().includes('admin')) return 'text-red-600';
    if (roleName.toLowerCase().includes('manager')) return 'text-blue-600';
    if (roleName.toLowerCase().includes('director')) return 'text-purple-600';
    if (roleName.toLowerCase().includes('scheduler')) return 'text-green-600';
    if (roleName.toLowerCase().includes('trainer')) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Role Demonstration Center</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">How Role Switching Works:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Click "Demonstrate Role" on any role card in the panel to the left</li>
                <li>Your permissions temporarily change to that role's permissions</li>
                <li>You'll be redirected to the appropriate page for that role</li>
                <li>Use the sidebar navigation to explore features available to that role</li>
                <li>Return to Training → Role Demonstrations to switch to another role</li>
              </ol>
              <p className="mt-2 text-xs text-blue-600">
                💡 <strong>Tip:</strong> Each role sees different menu items and features based on their permissions
              </p>
            </div>
          </div>
        </div>
        <p className="text-gray-600">
          Experience the system from different user perspectives. Perfect for training sessions and sales demonstrations.
        </p>
      </div>

      {currentRole && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
                <CardTitle className="text-lg text-blue-800">Currently Demonstrating</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">
                  {currentRole.name}
                </Badge>
                {currentRole.name !== 'Trainer' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDemonstrateRole(9)} // Trainer role ID is 9
                    className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Return to Trainer
                  </Button>
                )}
              </div>
            </div>
            <CardDescription className="text-blue-700">
              {currentRole.description || `Experiencing the system from ${currentRole.name} perspective`}
              {currentRole.name !== 'Trainer' && (
                <span className="block mt-1 text-xs text-blue-600">
                  Use the sidebar menu to explore features available to this role, or click "Return to Trainer" above
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {allRoles.map((role) => {
          const IconComponent = getRoleIcon(role.name);
          const isCurrentRole = currentRole?.id === role.id;
          
          return (
            <Card 
              key={role.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                isCurrentRole ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center min-w-0 flex-1">
                    <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${getRoleColor(role.name)}`} />
                    <CardTitle className="text-base sm:text-lg truncate">{role.name}</CardTitle>
                  </div>
                  {isCurrentRole && (
                    <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                      Active
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2 text-xs sm:text-sm line-clamp-2">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs sm:text-sm">
                    <span className="text-gray-500">Permissions:</span>
                    <Badge variant="outline" className="text-xs w-fit">
                      {role.permissionCount || 0} permissions
                    </Badge>
                  </div>
                  
                  {/* What this role will see */}
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Will redirect to: </span>
                    {(() => {
                      const roleNameLower = role.name.toLowerCase();
                      if (roleNameLower.includes('director')) return 'Business Goals';
                      if (roleNameLower.includes('scheduler')) return 'Production Schedule';
                      if (roleNameLower.includes('systems')) return 'Systems Management';
                      if (roleNameLower.includes('admin')) return 'User Management';
                      if (roleNameLower.includes('operator')) return 'Operator Dashboard';
                      if (roleNameLower.includes('sales')) return 'Sales Dashboard';
                      if (roleNameLower.includes('maintenance')) return 'Maintenance';
                      if (roleNameLower.includes('manager')) return 'Analytics';
                      return 'Production Schedule';
                    })()}
                  </div>
                  
                  <Button
                    className={`w-full text-xs sm:text-sm ${isCurrentRole ? 'opacity-50' : ''}`}
                    onClick={() => handleDemonstrateRole(role.id)}
                    disabled={switchRoleMutation.isPending || isCurrentRole}
                    variant={isCurrentRole ? "secondary" : "default"}
                    key={`role-button-${role.id}-${switchRoleMutation.isPending}`}
                  >
                    {switchRoleMutation.isPending && switchRoleMutation.variables === role.id ? (
                      <>
                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                        <span className="hidden sm:inline">Switching...</span>
                        <span className="sm:hidden">Switching</span>
                      </>
                    ) : isCurrentRole ? (
                      <>
                        <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Current Role</span>
                        <span className="sm:hidden">Current</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Demonstrate Role</span>
                        <span className="sm:hidden">Demo</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Demonstration Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-yellow-700">
            <p>• <strong>Switch roles freely</strong> - Demonstrate any role without user assignment restrictions</p>
            <p>• <strong>Interface updates</strong> - Navigation menu and features update based on role permissions</p>
            <p>• <strong>Page refresh</strong> - The system reloads to ensure all components reflect the new role</p>
            <p>• <strong>Training focus</strong> - Use role switching to show feature differences across user types</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Tour Management Component
interface TourStep {
  id: string;
  title: string;
  description: string;
  page: string;
  benefits: string[];
  actionText: string;
  duration: string;
}

interface TourData {
  role: string;
  totalSteps: number;
  totalDuration: string;
  steps: TourStep[];
  voiceScripts: Record<string, string>;
}

function TourManagementSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startTour } = useTour();
  
  // Fetch tours from database
  const { data: toursFromAPI = [], isLoading: toursLoading } = useQuery({
    queryKey: ["/api/tours"],
  });
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedMissingRoles, setSelectedMissingRoles] = useState<string[]>([]);
  const [expandedTours, setExpandedTours] = useState<number[]>([]);
  const [editingStep, setEditingStep] = useState<{role: string, stepId: string} | null>(null);
  const [showAIGuidanceDialog, setShowAIGuidanceDialog] = useState(false);
  const [aiGuidance, setAiGuidance] = useState("");
  const [pendingAction, setPendingAction] = useState<{ type: 'selected' | 'all' | 'missing', roles?: string[] } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<any>(null);
  const [showStepPreviewDialog, setShowStepPreviewDialog] = useState(false);
  const [previewStepData, setPreviewStepData] = useState<any>(null);
  const [showTourPreviewDialog, setShowTourPreviewDialog] = useState(false);
  const [previewTourData, setPreviewTourData] = useState<any>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [showVoiceGenerationDialog, setShowVoiceGenerationDialog] = useState(false);
  const [voiceGenerationTours, setVoiceGenerationTours] = useState<any[]>([]);
  const [voiceGenerationOptions, setVoiceGenerationOptions] = useState({
    regenerateScript: false,
    voice: 'nova',
    gender: 'female',
    speed: 1.1,
    userInstructions: ''
  });
  const [showSingleTourGuidanceDialog, setShowSingleTourGuidanceDialog] = useState(false);
  const [singleTourGuidance, setSingleTourGuidance] = useState("");
  const [selectedTourForRegeneration, setSelectedTourForRegeneration] = useState<any>(null);
  const [showSingleTourPreviewDialog, setShowSingleTourPreviewDialog] = useState(false);
  const [singleTourPreviewData, setSingleTourPreviewData] = useState<any>(null);
  const [isGeneratingSingleTour, setIsGeneratingSingleTour] = useState(false);
  const [isApprovingTour, setIsApprovingTour] = useState(false);

  // Preview handlers
  const handlePreviewStep = (step: any, role: string) => {
    setPreviewStepData({ step, role });
    setShowStepPreviewDialog(true);
  };

  const handlePreviewTour = (tour: any) => {
    // Set up the preview data to match the expected structure
    setSingleTourPreviewData({
      role: tour.roleDisplayName,
      originalGuidance: "",
      generatedTour: tour.tourData,
      tourId: tour.id
    });
    // Set the selected tour for regeneration (needed for voice generation)
    setSelectedTourForRegeneration(tour);
    setShowSingleTourPreviewDialog(true);
  };

  // Fetch all system roles
  const { data: systemRoles = [] } = useQuery({
    queryKey: ["/api/roles"],
  });

  // Mock tour data - in real implementation this would come from the tour configuration
  const tourData: Record<string, TourData> = {
    'director': {
      role: 'Director',
      totalSteps: 4,
      totalDuration: '7 min',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Your Demo',
          description: 'Let\'s explore the key features that will transform your manufacturing operations.',
          page: 'current',
          benefits: ['See real-time production insights', 'Experience intelligent scheduling', 'Understand role-based workflows'],
          actionText: 'Start Tour',
          duration: '2 min'
        },
        {
          id: 'business-goals',
          title: 'Strategic Business Goals',
          description: 'Define and track strategic objectives with KPI monitoring and risk management.',
          page: '/business-goals',
          benefits: ['Align production with business objectives', 'Monitor KPIs in real-time', 'Identify and mitigate risks early'],
          actionText: 'Explore Goals',
          duration: '2 min'
        },
        {
          id: 'analytics',
          title: 'Executive Analytics',
          description: 'Access comprehensive dashboards with production metrics and performance insights.',
          page: '/analytics',
          benefits: ['Make data-driven decisions', 'Identify optimization opportunities', 'Track performance trends'],
          actionText: 'View Analytics',
          duration: '2 min'
        },
        {
          id: 'demo-complete',
          title: 'Demo Experience Complete',
          description: 'You now have access to explore all PlanetTogether features using the sidebar navigation.',
          page: 'current',
          benefits: ['Use the sidebar to navigate between features', 'All demo data is available for exploration', 'Contact us to learn about implementation'],
          actionText: 'Finish Tour',
          duration: '1 min'
        }
      ],
      voiceScripts: {
        'business-goals': 'Welcome to Strategic Business Goals. Here you can define and track strategic objectives with comprehensive KPI monitoring and risk management capabilities.',
        'analytics': 'Let me show you Executive Analytics. Access comprehensive dashboards with production metrics and performance insights to make data-driven decisions.',
        'demo-complete': 'Congratulations! You have completed the Director demo experience. You now have access to explore all PlanetTogether features.'
      }
    },
    'production-scheduler': {
      role: 'Production Scheduler',
      totalSteps: 5,
      totalDuration: '9 min',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Your Demo',
          description: 'Let\'s explore the key features that will transform your manufacturing operations.',
          page: 'current',
          benefits: ['See real-time production insights', 'Experience intelligent scheduling', 'Understand role-based workflows'],
          actionText: 'Start Tour',
          duration: '2 min'
        },
        {
          id: 'schedule',
          title: 'Production Schedule',
          description: 'Interactive Gantt charts for visual production planning and resource allocation.',
          page: '/',
          benefits: ['Drag-and-drop operation scheduling', 'Real-time capacity visualization', 'Optimize resource utilization'],
          actionText: 'See Schedule',
          duration: '3 min'
        },
        {
          id: 'boards',
          title: 'Production Boards',
          description: 'Organize jobs, operations, and resources using customizable board views.',
          page: '/boards',
          benefits: ['Kanban-style job management', 'Visual workflow organization', 'Customizable board layouts'],
          actionText: 'View Boards',
          duration: '2 min'
        },
        {
          id: 'scheduling-optimizer',
          title: 'Scheduling Optimizer',
          description: 'AI-powered optimization for multi-operation order planning and resource allocation.',
          page: '/optimize-orders',
          benefits: ['Intelligent scheduling recommendations', 'Optimize delivery timelines', 'Balance efficiency and customer satisfaction'],
          actionText: 'Optimize Orders',
          duration: '2 min'
        },
        {
          id: 'demo-complete',
          title: 'Demo Experience Complete',
          description: 'You now have access to explore all PlanetTogether features using the sidebar navigation.',
          page: 'current',
          benefits: ['Use the sidebar to navigate between features', 'All demo data is available for exploration', 'Contact us to learn about implementation'],
          actionText: 'Finish Tour',
          duration: '1 min'
        }
      ],
      voiceScripts: {
        'schedule': 'Welcome to Production Schedule. Use interactive Gantt charts for visual production planning with drag-and-drop operation scheduling and real-time capacity visualization.',
        'boards': 'Let me show you Production Boards. Organize jobs, operations, and resources using customizable Kanban-style board views for better workflow organization.',
        'scheduling-optimizer': 'Here is the Scheduling Optimizer. Use AI-powered optimization for multi-operation order planning to balance efficiency and customer satisfaction.'
      }
    },
    'plant-manager': {
      role: 'Plant Manager',
      totalSteps: 5,
      totalDuration: '9 min',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Your Demo',
          description: 'Let\'s explore the key features that will transform your manufacturing operations.',
          page: 'current',
          benefits: ['See real-time production insights', 'Experience intelligent scheduling', 'Understand role-based workflows'],
          actionText: 'Start Tour',
          duration: '2 min'
        },
        {
          id: 'plant-overview',
          title: 'Plant Management',
          description: 'Comprehensive oversight of plant operations and strategic decision-making.',
          page: '/plant-manager',
          benefits: ['Complete plant visibility', 'Strategic planning tools', 'Performance optimization'],
          actionText: 'Manage Plant',
          duration: '3 min'
        },
        {
          id: 'capacity-planning',
          title: 'Capacity Planning',
          description: 'Plan and optimize production capacity including staffing and equipment.',
          page: '/capacity-planning',
          benefits: ['Optimize resource allocation', 'Plan future capacity needs', 'Balance workloads effectively'],
          actionText: 'Plan Capacity',
          duration: '2 min'
        },
        {
          id: 'schedule',
          title: 'Production Schedule',
          description: 'Monitor and oversee production scheduling from a management perspective.',
          page: '/',
          benefits: ['Track production progress', 'Monitor resource utilization', 'Identify operational bottlenecks'],
          actionText: 'View Schedule',
          duration: '2 min'
        },
        {
          id: 'demo-complete',
          title: 'Demo Experience Complete',
          description: 'You now have access to explore all PlanetTogether features using the sidebar navigation.',
          page: 'current',
          benefits: ['Use the sidebar to navigate between features', 'All demo data is available for exploration', 'Contact us to learn about implementation'],
          actionText: 'Finish Tour',
          duration: '1 min'
        }
      ],
      voiceScripts: {
        'plant-overview': 'Welcome to Plant Management. Get comprehensive oversight of plant operations with strategic planning tools and performance optimization capabilities.',
        'capacity-planning': 'Let me show you Capacity Planning. Plan and optimize production capacity including staffing and equipment for balanced workload management.',
        'schedule': 'Here is the Production Schedule from a management perspective. Monitor and oversee production scheduling to identify operational bottlenecks.'
      }
    },
    'systems-manager': {
      role: 'Systems Manager',
      totalSteps: 4,
      totalDuration: '7 min',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Your Demo',
          description: 'Let\'s explore the key features that will transform your manufacturing operations.',
          page: 'current',
          benefits: ['See real-time production insights', 'Experience intelligent scheduling', 'Understand role-based workflows'],
          actionText: 'Start Tour',
          duration: '2 min'
        },
        {
          id: 'systems-management',
          title: 'Systems Management',
          description: 'Configure system settings, manage integrations, and oversee technical operations.',
          page: '/systems-management',
          benefits: ['System configuration and monitoring', 'Integration management', 'Technical oversight'],
          actionText: 'Manage Systems',
          duration: '3 min'
        },
        {
          id: 'user-management',
          title: 'User & Role Management',
          description: 'Manage user accounts, role assignments, and access permissions.',
          page: '/user-role-assignments',
          benefits: ['Control user access', 'Manage role permissions', 'Ensure security compliance'],
          actionText: 'Manage Users',
          duration: '2 min'
        },
        {
          id: 'demo-complete',
          title: 'Demo Experience Complete',
          description: 'You now have access to explore all PlanetTogether features using the sidebar navigation.',
          page: 'current',
          benefits: ['Use the sidebar to navigate between features', 'All demo data is available for exploration', 'Contact us to learn about implementation'],
          actionText: 'Finish Tour',
          duration: '1 min'
        }
      ],
      voiceScripts: {
        'systems-management': 'Welcome to Systems Management. Configure system settings, manage integrations, and oversee technical operations with comprehensive monitoring capabilities.',
        'user-management': 'Let me show you User and Role Management. Control user access, manage role permissions, and ensure security compliance across the system.'
      }
    }
  };

  const allRoles = Array.isArray(toursFromAPI) ? toursFromAPI.map((tour: any) => tour.role) : [];
  
  // Identify roles that don't have tours yet - use roleId for accurate matching
  const existingTourRoleIds = new Set(Array.isArray(toursFromAPI) ? toursFromAPI.map((tour: any) => tour.roleId) : []);
  const missingTourRoles = Array.isArray(systemRoles) ? systemRoles.filter((role: any) => {
    return !existingTourRoleIds.has(role.id);
  }) : [];

  const regenerateTourWithAI = useMutation({
    mutationFn: async ({ roles, guidance }: { roles: string[], guidance?: string }) => {
      return apiRequest("POST", "/api/ai/generate-tour", { roles, guidance });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Tours Regenerated",
        description: `AI has successfully regenerated tours for ${variables.roles.length} role(s)`,
        variant: "default",
      });
      // Clear selections after successful generation
      setSelectedRoles([]);
      setAiGuidance("");
      setPendingAction(null);
      setShowAIGuidanceDialog(false);
      // Invalidate tours cache to show updated data
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
    },
    onError: (error: any) => {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate tour content",
        variant: "destructive",
      });
    },
  });

  const generateNewToursWithAI = useMutation({
    mutationFn: async ({ roles, guidance }: { roles: string[], guidance?: string }) => {
      return apiRequest("POST", "/api/ai/generate-tour", { roles, guidance });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Tours Generated",
        description: `AI has successfully generated tours for ${variables.roles.length} new role(s)`,
        variant: "default",
      });
      // Clear selections after successful generation
      setSelectedMissingRoles([]);
      setAiGuidance("");
      setPendingAction(null);
      setShowAIGuidanceDialog(false);
      // Invalidate tours cache to show updated data
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate tour content",
        variant: "destructive",
      });
    },
  });

  // Tour validation mutation
  const validateToursMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/tours/validate");
      return await response.json();
    },
    onSuccess: (data) => {
      setValidationResults(data.validation);
      setShowValidationDialog(true);
      toast({
        title: "Validation Complete",
        description: data.message,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate tours",
        variant: "destructive",
      });
    },
  });

  // Voice generation mutation
  const voiceGenerationMutation = useMutation({
    mutationFn: async (data: {
      tours: any[];
      options: {
        regenerateScript: boolean;
        voice: string;
        gender: string;
        speed: number;
        userInstructions: string;
      };
    }) => {
      const response = await apiRequest("POST", "/api/tours/generate-voice", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Voice Generation Complete",
        description: "Voice recordings have been successfully generated for the selected tours.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      setShowVoiceGenerationDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Voice Generation Failed",
        description: error.message || "Failed to generate voice recordings",
        variant: "destructive",
      });
    },
  });

  // Test voice functionality for tour steps - plays pre-cached recordings
  const handleTestVoice = async (step: any, role: string) => {
    try {
      // Create the same narration text that was used during tour generation with varied openings
      const createEngagingNarration = (stepData: any, role: string) => {
        if (stepData.voiceScript) {
          return stepData.voiceScript;
        }
        
        // Varied engaging transition phrases to keep scripts fresh
        const transitionPhrases = [
          'Let me introduce you to',
          'Here\'s how you can use',
          'Now, let\'s explore',
          'Take a look at',
          'I\'d like to highlight',
          'Let\'s dive into',
          'Check out',
          'Here\'s a key feature:',
          'Notice how',
          'You\'ll find that',
          'This is where you can',
          'Pay attention to'
        ];
        
        const benefit = Array.isArray(stepData.benefits) && stepData.benefits.length > 0 
          ? stepData.benefits[0] 
          : stepData.description;
        
        // Use hash of step title to consistently select the same transition phrase for each step
        const stepHash = stepData.title.split('').reduce((hash: number, char: string) => hash + char.charCodeAt(0), 0);
        const selectedTransition = transitionPhrases[stepHash % transitionPhrases.length];
        
        return `${selectedTransition} ${stepData.title}. ${stepData.description} ${benefit}`;
      };

      const enhancedText = createEngagingNarration(step, role);
      
      // Request the cached voice recording directly (this uses the cache, not generation)
      const response = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          text: enhancedText,
          voice: 'nova',
          speed: 1.15,
          cacheOnly: true // Indicate we only want cached recordings
        }),
      });
      
      if (!response.ok) {
        throw new Error('No cached voice recording found for this step');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      await audio.play();
      
      toast({
        title: "Voice Test",
        description: "Playing cached voice narration for tour step",
      });
      
      // Clean up URL after playing
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
      
    } catch (error) {
      console.error('Voice test error:', error);
      toast({
        title: "Voice Test Failed", 
        description: "No cached voice recording found for this step. Try regenerating the tour.",
        variant: "destructive",
      });
    }
  };

  const deleteTourMutation = useMutation({
    mutationFn: async (tourId: number) => {
      return apiRequest("DELETE", `/api/tours/${tourId}`);
    },
    onSuccess: () => {
      toast({
        title: "Tour Deleted",
        description: "The tour has been successfully deleted",
        variant: "default",
      });
      setShowDeleteDialog(false);
      setTourToDelete(null);
      // Invalidate tours cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete the tour",
        variant: "destructive",
      });
    },
  });

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleMissingRole = (roleId: string) => {
    setSelectedMissingRoles(prev => 
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  // Helper functions for selecting all roles in each section
  const selectAllTourContentRoles = () => {
    const allRoles = Array.isArray(toursFromAPI) ? toursFromAPI.map((tour: any) => tour.roleDisplayName) : [];
    setSelectedRoles(allRoles);
  };

  const unselectAllTourContentRoles = () => {
    setSelectedRoles([]);
  };

  const selectAllMissingRoles = () => {
    const allMissingIds = missingTourRoles.map((role: any) => role.id.toString());
    setSelectedMissingRoles(allMissingIds);
  };

  const unselectAllMissingRoles = () => {
    setSelectedMissingRoles([]);
  };

  const toggleTourExpansion = (tourId: number) => {
    setExpandedTours(prev => 
      prev.includes(tourId) ? prev.filter(r => r !== tourId) : [...prev, tourId]
    );
  };

  const handleGenerateSelectedTours = () => {
    if (selectedRoles.length === 0) {
      toast({
        title: "No Roles Selected",
        description: "Please select at least one role to regenerate tours",
        variant: "destructive",
      });
      return;
    }
    setPendingAction({ type: 'selected', roles: selectedRoles });
    setShowAIGuidanceDialog(true);
  };

  const handleGenerateAllTours = () => {
    setPendingAction({ type: 'all', roles: allRoles });
    setShowAIGuidanceDialog(true);
  };

  const handleGenerateMissingTours = () => {
    if (selectedMissingRoles.length === 0) {
      toast({
        title: "No Roles Selected",
        description: "Please select at least one role to generate tours for",
        variant: "destructive",
      });
      return;
    }
    
    const selectedRoleNames = selectedMissingRoles.map(roleId => {
      const role = (systemRoles as any[]).find((r: any) => r.id.toString() === roleId);
      return role ? role.name : roleId;
    });
    
    setPendingAction({ type: 'missing', roles: selectedRoleNames });
    setShowAIGuidanceDialog(true);
  };

  const handleConfirmAIGeneration = () => {
    if (!pendingAction) return;
    
    const { type, roles } = pendingAction;
    const mutationData = { roles: roles || [], guidance: aiGuidance };
    
    if (type === 'missing') {
      generateNewToursWithAI.mutate(mutationData);
    } else {
      regenerateTourWithAI.mutate(mutationData);
    }
  };

  // Voice generation handlers
  const handleGenerateVoiceForSelected = () => {
    // Allow opening dialog even with no tours selected for settings configuration
    const selectedTours = selectedRoles.length > 0 
      ? (toursFromAPI as any[]).filter((tour: any) => selectedRoles.includes(tour.roleDisplayName))
      : [];
    setVoiceGenerationTours(selectedTours);
    setShowVoiceGenerationDialog(true);
  };

  const handleGenerateVoiceForAll = () => {
    setVoiceGenerationTours(toursFromAPI as any[]);
    setShowVoiceGenerationDialog(true);
  };

  const handleVoiceGenerationSubmit = () => {
    voiceGenerationMutation.mutate({
      tours: voiceGenerationTours,
      options: voiceGenerationOptions
    });
  };

  // Single tour regeneration handler
  const handleSingleTourRegenerate = (tour: any) => {
    setSelectedTourForRegeneration(tour);
    setShowSingleTourGuidanceDialog(true);
  };

  const handleConfirmSingleTourRegeneration = async () => {
    if (selectedTourForRegeneration) {
      setIsGeneratingSingleTour(true);
      
      try {
        // Generate the tour content first (without voice)
        const response = await apiRequest("POST", "/api/ai/generate-tour", { 
          roles: [selectedTourForRegeneration.roleDisplayName], 
          guidance: singleTourGuidance,
          contentOnly: true // Flag to skip voice generation
        });
        
        // Parse the JSON response
        const responseData = await response.json();
        
        // Store the generated tour data for preview
        console.log('AI Response:', responseData);
        console.log('Response tours:', responseData.tours);
        
        // Extract the tour data from the response
        let tourData;
        console.log('Full server response:', JSON.stringify(responseData, null, 2));
        
        if (responseData.tours && responseData.tours.length > 0) {
          console.log('Using tours array - first tour:', responseData.tours[0]);
          tourData = responseData.tours[0];
        } else if (responseData.steps) {
          console.log('Using direct steps:', responseData.steps.length);
          // Direct steps in response
          tourData = { steps: responseData.steps };
        } else {
          console.log('Using fallback - entire response');
          // Fallback to the entire response
          tourData = responseData;
        }
        
        console.log('Processed tour data:', tourData);
        console.log('Tour data steps:', tourData?.steps?.length || 'no steps found');
        
        setSingleTourPreviewData({
          role: selectedTourForRegeneration.roleDisplayName,
          originalGuidance: singleTourGuidance,
          generatedTour: tourData,
          tourId: selectedTourForRegeneration.id
        });
        
        // Close guidance dialog and show preview
        setShowSingleTourGuidanceDialog(false);
        setShowSingleTourPreviewDialog(true);
        
      } catch (error: any) {
        toast({
          title: "Content Generation Failed",
          description: error.message || "Failed to generate tour content",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingSingleTour(false);
      }
    }
  };

  // Preview dialog handlers
  const handleApproveTourContent = async () => {
    if (singleTourPreviewData) {
      setIsApprovingTour(true);
      try {
        // Save the tour content to database and generate voice
        const response = await apiRequest("POST", "/api/tours", {
          tourData: singleTourPreviewData.generatedTour,
          roleId: selectedTourForRegeneration.roleId,
          generateVoice: true
        });
        
        toast({
          title: "Tour Updated",
          description: `Tour content has been saved and voice generation started for ${singleTourPreviewData.role}`,
        });
        
        // Refresh tours data
        queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
        
        // Close dialogs and clear state
        setShowSingleTourPreviewDialog(false);
        clearSingleTourState();
        
      } catch (error: any) {
        toast({
          title: "Save Failed",
          description: error.message || "Failed to save tour content",
          variant: "destructive",
        });
      } finally {
        setIsApprovingTour(false);
      }
    }
  };

  const handleReviseWithAI = () => {
    // Go back to guidance dialog with existing content as context
    setShowSingleTourPreviewDialog(false);
    setShowSingleTourGuidanceDialog(true);
    setSingleTourGuidance(singleTourPreviewData?.originalGuidance || "");
  };

  const clearSingleTourState = () => {
    setSingleTourGuidance("");
    setSelectedTourForRegeneration(null);
    setSingleTourPreviewData(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold">Tour Content Management</h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            Manage guided tour content, steps, voice scripts, and benefits for each role.
            Use AI to regenerate and optimize tour experiences.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2 lg:justify-end pt-2">
          <Button
            onClick={handleGenerateSelectedTours}
            disabled={regenerateTourWithAI.isPending || selectedRoles.length === 0}
            className={`${getThemeClasses()} w-full sm:w-auto text-xs sm:text-sm`}
            size="sm"
          >
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Regenerate Tours ({selectedRoles.length})</span>
            <span className="sm:hidden">Regen ({selectedRoles.length})</span>
          </Button>
          <Button
            onClick={handleGenerateVoiceForSelected}
            disabled={voiceGenerationMutation.isPending}
            variant="outline"
            className="border-green-300 text-green-600 hover:bg-green-50 w-full sm:w-auto text-xs sm:text-sm"
            size="sm"
          >
            {voiceGenerationMutation.isPending ? (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Voice Generation ({selectedRoles.length})</span>
            <span className="sm:hidden">Voice ({selectedRoles.length})</span>
          </Button>
          <Button
            onClick={() => validateToursMutation.mutate()}
            disabled={validateToursMutation.isPending}
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50 w-full sm:w-auto text-xs sm:text-sm"
            size="sm"
          >
            {validateToursMutation.isPending ? (
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Validate All Tours</span>
            <span className="sm:hidden">Validate</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {toursLoading && (
        <div className="flex justify-center items-center py-6 sm:py-8">
          <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mr-2" />
          <span className="text-sm sm:text-base">Loading tours from database...</span>
        </div>
      )}
      
      {/* Detailed Tour Configuration - Moved to Top */}
      {!toursLoading && Array.isArray(toursFromAPI) && toursFromAPI.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {/* Select All Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-3 sm:mb-4 pt-2 sm:pt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Select:</span>
              <Button
                onClick={selectAllTourContentRoles}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                All ({Array.isArray(toursFromAPI) ? toursFromAPI.length : 0})
              </Button>
              <Button
                onClick={unselectAllTourContentRoles}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                None
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {selectedRoles.length} of {Array.isArray(toursFromAPI) ? toursFromAPI.length : 0} tours selected
            </div>
          </div>
          
          {(toursFromAPI as any[])?.map((tour: any) => (
            <Card key={tour.id} className="mb-3 sm:mb-4">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 p-3 sm:p-6" 
                onClick={() => toggleTourExpansion(tour.id)}
            >
              <div className="flex flex-col gap-3 sm:gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
                <div className="flex items-center min-w-0">
                    {expandedTours.includes(tour.id) ? 
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" /> : 
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mr-2 shrink-0" />
                  }
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(tour.roleDisplayName)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleRole(tour.roleDisplayName);
                    }}
                    className="rounded text-purple-600 shrink-0 mr-2 sm:mr-3"
                  />
                    <CardTitle className="text-sm sm:text-lg truncate">{tour.roleDisplayName} Tour</CardTitle>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-gray-600 ml-7 sm:ml-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="flex items-center">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-xs sm:text-sm">{tour.tourData?.steps?.length || 0} steps</span>
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-xs sm:text-sm">{tour.tourData?.estimatedDuration || '5-10 min'}</span>
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 w-full sm:w-auto">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full sm:w-auto text-xs px-2 py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewTour(tour);
                      }}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Preview Tour</span>
                      <span className="sm:hidden">Preview</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-xs px-2 py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        startTour(tour.roleId, true); // Enable voice by default
                        toast({
                          title: "Tour Started",
                          description: `Starting live tour for ${tour.roleDisplayName}`,
                        });
                      }}
                    >
                      <Monitor className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Start Live Tour</span>
                      <span className="sm:hidden">Live</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 w-full sm:w-auto text-xs px-2 py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleTourRegenerate(tour);
                      }}
                      disabled={regenerateTourWithAI.isPending}
                    >
                      {regenerateTourWithAI.isPending ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      <span className="hidden sm:inline">Regenerate</span>
                      <span className="sm:hidden">Regen</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full sm:w-auto text-xs px-2 py-1"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Edit Tour</span>
                      <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto text-xs px-2 py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTourToDelete(tour);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                      <span className="sm:hidden">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {expandedTours.includes(tour.id) && tour.tourData?.steps && (
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {tour.tourData.steps.map((step: any, index: number) => (
                    <div key={step.id || `step-${tour.id}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-3">Step {index + 1}</Badge>
                          <h5 className="font-semibold text-sm">{step.stepName || step.feature || step.title || `Step ${index + 1}`}</h5>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">{step.duration}</Badge>
                          <Button size="sm" variant="ghost">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{step.description || step.stepDescription}</p>
                      
                      {step.benefits && step.benefits.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-xs font-semibold text-gray-700 mb-2">Benefits:</h6>
                          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                            {step.benefits.slice(0, 3).map((benefit: string, benefitIndex: number) => (
                              <li key={benefitIndex}>{benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {step.voiceScript && (
                        <div className="mb-3">
                          <h6 className="text-xs font-semibold text-gray-700 mb-2">Voice Script:</h6>
                          <p className="text-xs text-gray-600 bg-white p-2 rounded border">{step.voiceScript}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          Page: {step.page || step.route || '/'}
                        </Badge>
                        {step.actionText && (
                          <Badge variant="outline" className="text-xs">
                            Action: {step.actionText}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handlePreviewStep(step, tour.roleDisplayName)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Test Voice
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
          ))}
        </div>
      )}

      {/* Generate Tours for Additional Roles */}
      {missingTourRoles.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div>
              <h4 className="font-semibold mb-2">Generate Tours for Additional Roles</h4>
              <p className="text-gray-600 text-sm">
                These roles exist in your system but don't have guided tours yet. Generate AI-powered tours for them.
              </p>
            </div>
            <div className="flex justify-start">
              <Button
                onClick={handleGenerateMissingTours}
                disabled={generateNewToursWithAI.isPending || selectedMissingRoles.length === 0}
                className={`${getThemeClasses()} w-full sm:w-auto text-xs sm:text-sm`}
                size="sm"
              >
                {generateNewToursWithAI.isPending ? (
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Generate Tours ({selectedMissingRoles.length})</span>
                <span className="sm:hidden">Generate ({selectedMissingRoles.length})</span>
              </Button>
            </div>
          </div>
          
          {/* Select All Controls for Missing Tours */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Select:</span>
              <Button
                onClick={selectAllMissingRoles}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                All ({missingTourRoles.length})
              </Button>
              <Button
                onClick={unselectAllMissingRoles}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                None
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {selectedMissingRoles.length} of {missingTourRoles.length} roles selected
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {missingTourRoles.map((role: any) => (
              <Card 
                key={role.id} 
                className={`cursor-pointer transition-all border-dashed ${
                  selectedMissingRoles.includes(role.id.toString()) 
                    ? 'ring-2 ring-green-500 bg-green-50 border-green-300' 
                    : 'hover:shadow-md border-gray-300'
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h4 className="font-semibold text-xs sm:text-sm truncate mr-2">{role.name}</h4>
                    <input
                      type="checkbox"
                      checked={selectedMissingRoles.includes(role.id.toString())}
                      onChange={() => toggleMissingRole(role.id.toString())}
                      className="rounded text-green-600 shrink-0"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2 text-xs text-gray-600">
                    <p className="text-xs line-clamp-2">{role.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1 text-amber-500 shrink-0" />
                        <span className="truncate">No tour yet</span>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        New Role
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog Components */}
      
      {/* AI Guidance Dialog */}
      <Dialog open={showAIGuidanceDialog} onOpenChange={setShowAIGuidanceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Tour Generation Guidance</DialogTitle>
            <DialogDescription>
              Provide specific instructions to customize the tour generation for selected roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="guidance">Custom Instructions</Label>
              <Textarea
                id="guidance"
                placeholder="Example: Focus on operational efficiency features, emphasize scheduling optimization, include real-time monitoring capabilities..."
                value={aiGuidance}
                onChange={(e) => setAiGuidance(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAIGuidanceDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmAIGeneration} 
                disabled={regenerateTourWithAI.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              >
                {regenerateTourWithAI.isPending ? (
                  <Hourglass className="h-4 w-4 mr-2 animate-pulse" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Tours
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Tour Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tour</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {tourToDelete?.roleDisplayName} tour? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (tourToDelete) {
                  deleteTourMutation.mutate(tourToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Tour
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step Preview Dialog */}
      <Dialog open={showStepPreviewDialog} onOpenChange={setShowStepPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewStepData?.step?.stepName || previewStepData?.step?.feature || previewStepData?.step?.title || 'Tour Step'}
            </DialogTitle>
            <DialogDescription>
              Preview step details and test voice narration for {previewStepData?.role}
            </DialogDescription>
          </DialogHeader>
          {previewStepData && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-600">{previewStepData.step.description || previewStepData.step.stepDescription}</p>
              </div>
              
              {previewStepData.step.benefits && previewStepData.step.benefits.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Benefits</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {previewStepData.step.benefits.map((benefit: string, index: number) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {previewStepData.step.voiceScript && (
                <div>
                  <h4 className="font-medium mb-2">Voice Script</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {previewStepData.step.voiceScript}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Test voice generation here
                        toast({
                          title: "Voice Test",
                          description: "Voice generation would play here",
                        });
                      }}
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Test Voice
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Page: {previewStepData.step.page || previewStepData.step.route || '/'}
                </Badge>
                <Badge variant="outline">
                  Duration: {previewStepData.step.duration || '2 min'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tour Preview Dialog */}
      <Dialog open={showTourPreviewDialog} onOpenChange={setShowTourPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTourData?.roleDisplayName} Tour Preview</DialogTitle>
            <DialogDescription>
              Complete tour overview with all steps and content
            </DialogDescription>
          </DialogHeader>
          {previewTourData && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{previewTourData.tourData?.steps?.length || 0}</div>
                  <div className="text-sm text-gray-600">Steps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{previewTourData.tourData?.estimatedDuration || '5-10 min'}</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{previewTourData.tourData?.voiceScriptCount || 0}</div>
                  <div className="text-sm text-gray-600">Voice Scripts</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Tour Steps</h4>
                {previewTourData.tourData?.steps?.map((step: any, index: number) => (
                  <div key={step.id || index} className="border rounded p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Badge className="mr-2">Step {index + 1}</Badge>
                        <span className="font-medium">{step.stepName || step.feature || step.title || `Step ${index + 1}`}</span>
                      </div>
                      <Badge variant="outline">{step.duration || '2 min'}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{step.description || step.stepDescription}</p>
                    <div className="text-xs text-gray-500">
                      Page: {step.page || step.route || '/'}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Dialog Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowTourPreviewDialog(false)}
                >
                  Close Preview
                </Button>
                <Button
                  onClick={() => {
                    if (previewTourData) {
                      // Find the role by display name to get the role ID
                      const role = Array.isArray(allRoles) 
                        ? allRoles.find((r: any) => r && r.name === previewTourData.roleDisplayName)
                        : null;
                      if (role) {
                        // Start the live tour by redirecting with tour parameters
                        window.location.href = `/demo-tour?role=${encodeURIComponent(role.name)}&startTour=true`;
                      } else {
                        console.error('Could not find role:', previewTourData.roleDisplayName, 'in roles:', allRoles);
                      }
                    }
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Live Tour
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Validation Results Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tour Validation Results</DialogTitle>
            <DialogDescription>
              Comprehensive validation check for all tour content and accessibility
            </DialogDescription>
          </DialogHeader>
          {validationResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{validationResults.summary?.validTours || 0}</div>
                  <div className="text-sm text-gray-600">Valid Tours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{validationResults.summary?.invalidTours || 0}</div>
                  <div className="text-sm text-gray-600">Invalid Tours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{validationResults.summary?.criticalErrors || 0}</div>
                  <div className="text-sm text-gray-600">Critical Errors</div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Display Critical Errors */}
                {validationResults.criticalErrors?.map((result: any, index: number) => (
                  <div key={`critical-${index}`} className="border rounded p-4 border-red-300 bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{result.role}</span>
                      <Badge variant="destructive">Critical Error</Badge>
                    </div>
                    {result.criticalErrors?.length > 0 && (
                      <div className="space-y-1">
                        {result.criticalErrors.map((issue: any, issueIndex: number) => (
                          <div key={issueIndex} className="text-sm p-2 rounded bg-red-100 text-red-800">
                            <div className="font-medium">{issue.type}</div>
                            <div>{issue.issue}</div>
                            {issue.suggestion && (
                              <div className="text-xs mt-1 opacity-75">Suggestion: {issue.suggestion}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Display Invalid Tours with Issues */}
                {validationResults.invalid?.map((result: any, index: number) => (
                  <div key={`invalid-${index}`} className="border rounded p-4 border-yellow-300 bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{result.role}</span>
                      <Badge variant="destructive">Invalid</Badge>
                    </div>
                    {result.issues?.length > 0 && (
                      <div className="space-y-1">
                        {result.issues.map((issue: any, issueIndex: number) => (
                          <div key={issueIndex} className={`text-sm p-2 rounded ${
                            issue.severity === 'ERROR' ? 'bg-red-100 text-red-800' : 
                            issue.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            <div className="font-medium">{issue.type}</div>
                            <div>{issue.issue}</div>
                            {issue.suggestion && (
                              <div className="text-xs mt-1 opacity-75">Suggestion: {issue.suggestion}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {result.invalidSteps?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-yellow-800">Invalid Steps:</div>
                        {result.invalidSteps.map((step: any, stepIndex: number) => (
                          <div key={stepIndex} className="text-xs text-yellow-700 ml-2">
                            • Step {step.stepIndex}: {step.stepName} - {step.issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Display Valid Tours */}
                {validationResults.valid?.map((result: any, index: number) => (
                  <div key={`valid-${index}`} className="border rounded p-4 border-green-300 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{result.role}</span>
                      <Badge variant="default">Valid</Badge>
                    </div>
                    <div className="text-sm text-green-700">
                      All {result.validSteps?.length || 0} steps validated successfully
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Voice Generation Dialog */}
      <Dialog open={showVoiceGenerationDialog} onOpenChange={setShowVoiceGenerationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voice Generation Settings</DialogTitle>
            <DialogDescription>
              Configure voice generation options for {voiceGenerationTours.length} tour(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Voice Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voice">Voice Type</Label>
                  <Select value={voiceGenerationOptions.voice} onValueChange={(value) => setVoiceGenerationOptions(prev => ({ ...prev, voice: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={voiceGenerationOptions.gender} onValueChange={(value) => setVoiceGenerationOptions(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="speed">Speech Speed: {voiceGenerationOptions.speed}x</Label>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={voiceGenerationOptions.speed}
                onChange={(e) => setVoiceGenerationOptions(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                className="w-full mt-1"
              />
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="regenerateScript"
                  checked={voiceGenerationOptions.regenerateScript}
                  onChange={(e) => setVoiceGenerationOptions(prev => ({ ...prev, regenerateScript: e.target.checked }))}
                />
                <Label htmlFor="regenerateScript">Regenerate voice scripts</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="userInstructions">Additional Instructions</Label>
              <Textarea
                id="userInstructions"
                placeholder="Any specific voice or content requirements..."
                value={voiceGenerationOptions.userInstructions}
                onChange={(e) => setVoiceGenerationOptions(prev => ({ ...prev, userInstructions: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowVoiceGenerationDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleVoiceGenerationSubmit} disabled={voiceGenerationMutation.isPending}>
                {voiceGenerationMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Generate Voice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Tour Guidance Dialog */}
      <Dialog open={showSingleTourGuidanceDialog} onOpenChange={setShowSingleTourGuidanceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Regenerate {selectedTourForRegeneration?.roleDisplayName} Tour</DialogTitle>
            <DialogDescription>
              Provide specific instructions to customize this tour regeneration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="singleGuidance">Custom Instructions</Label>
              <Textarea
                id="singleGuidance"
                placeholder="Example: Focus on advanced scheduling features, add more detail about optimization tools, emphasize real-time capabilities..."
                value={singleTourGuidance}
                onChange={(e) => setSingleTourGuidance(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setShowSingleTourGuidanceDialog(false);
                clearSingleTourState();
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSingleTourRegeneration} 
                disabled={isGeneratingSingleTour}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {isGeneratingSingleTour ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Tour Preview Dialog */}
      <Dialog open={showSingleTourPreviewDialog} onOpenChange={setShowSingleTourPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{singleTourPreviewData?.role} Tour Content Preview</DialogTitle>
            <DialogDescription>
              Review the generated tour content before approving and generating voice
            </DialogDescription>
          </DialogHeader>
          {singleTourPreviewData && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Tour Overview</h4>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{singleTourPreviewData.generatedTour?.steps?.length || 0}</div>
                    <div className="text-xs text-blue-700">Steps</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{singleTourPreviewData.generatedTour?.estimatedDuration || 'TBD'}</div>
                    <div className="text-xs text-blue-700">Duration</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{singleTourPreviewData.generatedTour?.steps?.filter((s: any) => s.voiceScript).length || 0}</div>
                    <div className="text-xs text-blue-700">Voice Scripts</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Generated Tour Steps</h4>
                {singleTourPreviewData.generatedTour?.steps?.map((step: any, index: number) => (
                  <div key={step.id || index} className="border rounded p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Badge className="mr-2">Step {index + 1}</Badge>
                        <span className="font-medium">{step.stepName || step.feature || step.title || `Step ${index + 1}`}</span>
                      </div>
                      <Badge variant="outline">{step.duration || '2 min'}</Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{step.description || step.stepDescription || 'No description available'}</p>
                    

                    
                    {step.benefits && step.benefits.length > 0 && (
                      <div className="mb-3">
                        <h6 className="text-xs font-semibold text-gray-700 mb-1">Benefits:</h6>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {step.benefits.slice(0, 3).map((benefit: string, benefitIndex: number) => (
                            <li key={benefitIndex}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {step.voiceScript && (
                      <div className="mb-3">
                        <h6 className="text-xs font-semibold text-gray-700 mb-1">Voice Script:</h6>
                        <div className="bg-white p-2 rounded border text-xs text-gray-600">
                          {step.voiceScript}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        Page: {step.navigationPath || step.page || step.route || '/'}
                      </Badge>
                      {step.actionText && (
                        <Badge variant="outline" className="text-xs">
                          Action: {step.actionText}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSingleTourPreviewDialog(false);
                  clearSingleTourState();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleReviseWithAI}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Revise with AI
              </Button>
            </div>
            <Button
              onClick={handleApproveTourContent}
              disabled={isApprovingTour}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-70"
            >
              {isApprovingTour ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Voice...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Approve & Generate Voice
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
