import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Users, Target, Monitor, RotateCcw, GraduationCap, Play, UserCheck, Settings, Shield, Edit3, Eye, Volume2, MessageSquare, Sparkles, RefreshCw, ChevronDown, ChevronRight, FileText, Clock, Plus, AlertCircle, Trash2, CheckCircle, AlertTriangle, Mic, VolumeX, Info, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { RoleSwitcher } from '@/components/role-switcher';
import { apiRequest } from '@/lib/queryClient';

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

  const categories = ['all', ...Array.from(new Set(trainingModules.map(module => module.category)))];
  const filteredModules = selectedCategory === 'all' 
    ? trainingModules 
    : trainingModules.filter(module => module.category === selectedCategory);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="md:ml-0 ml-12">
            <h1 className="text-2xl font-semibold text-gray-800">Training & Role Demonstration</h1>
            <p className="text-gray-600">
              Interactive training modules and role switching for comprehensive system demonstrations
            </p>
          </div>
          {user && <RoleSwitcher userId={user.id} currentRole={currentRole as Role} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{trainingModules.length}</div>
                  <div className="text-xs text-gray-500">Training Modules</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{allRoles.length}</div>
                  <div className="text-xs text-gray-500">Available Roles</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{trainingModules.filter(m => m.completed).length}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Monitor className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">{(currentRole as Role)?.name || 'None'}</div>
                  <div className="text-xs text-gray-500">Current Role</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="roles">Role Demonstrations</TabsTrigger>
          <TabsTrigger value="tours">Tour Management</TabsTrigger>
          <TabsTrigger value="resources">Training Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          <div className="flex gap-2 mb-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="h-fit">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="mt-2">{module.description}</CardDescription>
                    </div>
                    {module.completed && (
                      <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-800">Completed</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Role:</span>
                      <Badge variant="outline">{module.role}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">{module.duration}</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Features Covered:</div>
                      <div className="flex flex-wrap gap-1">
                        {module.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => startTrainingMutation.mutate(module.id)}
                      disabled={startTrainingMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {module.completed ? 'Review Module' : 'Start Training'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RoleDemonstrationSection userId={user?.id} currentRole={currentRole as Role} />
        </TabsContent>

        <TabsContent value="tours" className="space-y-6">
          <TourManagementSection />
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Comprehensive guides and reference materials</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• User Guide: Complete system walkthrough</li>
                  <li>• Administrator Manual: Setup and configuration</li>
                  <li>• API Reference: Integration documentation</li>
                  <li>• Best Practices: Optimization techniques</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>Visual learning resources and demonstrations</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
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
                <li>Click "Demonstrate Role" on any role card below</li>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IconComponent className={`h-5 w-5 mr-2 ${getRoleColor(role.name)}`} />
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </div>
                  {isCurrentRole && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Permissions:</span>
                    <Badge variant="outline">
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
                    className={`w-full ${isCurrentRole ? 'opacity-50' : ''}`}
                    onClick={() => handleDemonstrateRole(role.id)}
                    disabled={switchRoleMutation.isPending || isCurrentRole}
                    variant={isCurrentRole ? "secondary" : "default"}
                    key={`role-button-${role.id}-${switchRoleMutation.isPending}`}
                  >
                    {switchRoleMutation.isPending && switchRoleMutation.variables === role.id ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                        Switching...
                      </>
                    ) : isCurrentRole ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Current Role
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Demonstrate Role
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

  // Preview handlers
  const handlePreviewStep = (step: any, role: string) => {
    setPreviewStepData({ step, role });
    setShowStepPreviewDialog(true);
  };

  const handlePreviewTour = (tour: any) => {
    setPreviewTourData(tour);
    setShowTourPreviewDialog(true);
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

  const allRoles = toursFromAPI?.map((tour: any) => tour.role) || [];
  
  // Identify roles that don't have tours yet - use roleId for accurate matching
  const existingTourRoleIds = new Set(toursFromAPI?.map((tour: any) => tour.roleId) || []);
  const missingTourRoles = systemRoles.filter((role: any) => {
    return !existingTourRoleIds.has(role.id);
  });

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
      // Create the same narration text that was used during tour generation
      const createEngagingNarration = (stepData: any, role: string) => {
        if (stepData.voiceScript) {
          return stepData.voiceScript;
        }
        
        const benefit = Array.isArray(stepData.benefits) && stepData.benefits.length > 0 
          ? stepData.benefits[0] 
          : stepData.description;
        
        return `Let me show you ${stepData.title}. ${stepData.description} ${benefit}`;
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
    const allRoles = toursFromAPI?.map((tour: any) => tour.roleDisplayName) || [];
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
      const role = systemRoles.find((r: any) => r.id.toString() === roleId);
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
      ? toursFromAPI.filter((tour: any) => selectedRoles.includes(tour.roleDisplayName))
      : [];
    setVoiceGenerationTours(selectedTours);
    setShowVoiceGenerationDialog(true);
  };

  const handleGenerateVoiceForAll = () => {
    setVoiceGenerationTours(toursFromAPI);
    setShowVoiceGenerationDialog(true);
  };

  const handleVoiceGenerationSubmit = () => {
    voiceGenerationMutation.mutate({
      tours: voiceGenerationTours,
      options: voiceGenerationOptions
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">Tour Content Management</h3>
          <p className="text-gray-600 text-sm">
            Manage guided tour content, steps, voice scripts, and benefits for each role.
            Use AI to regenerate and optimize tour experiences.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleGenerateSelectedTours}
            disabled={regenerateTourWithAI.isPending || selectedRoles.length === 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Regenerate Tours ({selectedRoles.length})
          </Button>
          <Button
            onClick={handleGenerateVoiceForSelected}
            disabled={voiceGenerationMutation.isPending}
            variant="outline"
            className="border-green-300 text-green-600 hover:bg-green-50"
            size="sm"
          >
            {voiceGenerationMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mic className="h-4 w-4 mr-2" />
            )}
            Voice Generation ({selectedRoles.length})
          </Button>

          <Button
            onClick={() => validateToursMutation.mutate()}
            disabled={validateToursMutation.isPending}
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
            size="sm"
          >
            {validateToursMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Validate All Tours
          </Button>
        </div>
      </div>

      {/* Select All Controls for Tour Content */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Select:</span>
          <Button
            onClick={selectAllTourContentRoles}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            All ({toursFromAPI?.length || 0})
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
          {selectedRoles.length} of {toursFromAPI?.length || 0} tours selected
        </div>
      </div>

      {/* Tour Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {toursFromAPI?.map((tour: any) => (
          <Card key={tour.id} className={`cursor-pointer transition-all ${selectedRoles.includes(tour.roleDisplayName) ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">{tour.roleDisplayName}</h4>
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(tour.roleDisplayName)}
                  onChange={() => toggleRole(tour.roleDisplayName)}
                  className="rounded text-purple-600"
                />
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  {tour.tourData?.totalSteps || 0} steps
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {tour.tourData?.estimatedDuration || '5 min'}
                </div>
                <div className="flex items-center">
                  <Volume2 className="h-3 w-3 mr-1" />
                  {tour.tourData?.voiceScriptCount || 0} voice scripts
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate Tours for Additional Roles */}
      {missingTourRoles.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold mb-2">Generate Tours for Additional Roles</h4>
              <p className="text-gray-600 text-sm">
                These roles exist in your system but don't have guided tours yet. Generate AI-powered tours for them.
              </p>
            </div>
            <Button
              onClick={handleGenerateMissingTours}
              disabled={generateNewToursWithAI.isPending || selectedMissingRoles.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {generateNewToursWithAI.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Tours ({selectedMissingRoles.length})
            </Button>
          </div>
          
          {/* Select All Controls for Missing Tours */}
          <div className="flex items-center justify-between mb-4">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {missingTourRoles.map((role: any) => (
              <Card 
                key={role.id} 
                className={`cursor-pointer transition-all border-dashed ${
                  selectedMissingRoles.includes(role.id.toString()) 
                    ? 'ring-2 ring-green-500 bg-green-50 border-green-300' 
                    : 'hover:shadow-md border-gray-300'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">{role.name}</h4>
                    <input
                      type="checkbox"
                      checked={selectedMissingRoles.includes(role.id.toString())}
                      onChange={() => toggleMissingRole(role.id.toString())}
                      className="rounded text-green-600"
                    />
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    <p className="text-xs">{role.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                        No tour yet
                      </div>
                      <Badge variant="outline" className="text-xs">
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

      {/* Detailed Tour Management */}
      {/* Loading State */}
      {toursLoading && (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading tours from database...</span>
        </div>
      )}
      
      {/* Detailed Tour Configuration */}
      {!toursLoading && toursFromAPI?.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold">Detailed Tour Configuration</h4>
          
          {toursFromAPI.map((tour: any) => (
            <Card key={tour.id}>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50" 
                onClick={() => toggleTourExpansion(tour.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {expandedTours.includes(tour.id) ? 
                    <ChevronDown className="h-4 w-4 mr-2" /> : 
                    <ChevronRight className="h-4 w-4 mr-2" />
                  }
                    <CardTitle className="text-lg">{tour.roleDisplayName} Tour</CardTitle>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                      {tour.tourData?.steps?.length || 0} steps
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                      {tour.tourData?.estimatedDuration || '5-10 min'}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewTour(tour);
                      }}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Preview Tour
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit Tour
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTourToDelete(tour);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
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
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-3">Step {index + 1}</Badge>
                          <h5 className="font-semibold">{step.stepName || step.feature || step.title || `Step ${index + 1}`}</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{step.duration}</Badge>
                          <Button size="sm" variant="ghost">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-2">Description</p>
                          <p className="text-gray-600 mb-3">{step.description || step.benefits || 'No description available'}</p>
                          
                          <p className="font-medium mb-2">Page Navigation</p>
                          <code className="bg-white px-2 py-1 rounded text-xs border">
                            {step.navigationPath || step.page || 'Not specified'}
                          </code>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-2">Key Benefits</p>
                          <div className="mb-3">
                            {Array.isArray(step.benefits) ? (
                              <ul className="space-y-1">
                                {step.benefits.map((benefit: string, idx: number) => (
                                  <li key={idx} className="text-gray-600 text-xs flex items-start">
                                    <span className="text-green-600 mr-1">•</span>
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-600 text-xs">{step.benefits || 'No benefits specified'}</p>
                            )}
                          </div>
                          
                          {step.voiceScript && (
                            <div>
                              <p className="font-medium mb-2 flex items-center">
                                <Volume2 className="h-3 w-3 mr-1" />
                                Voice Script
                              </p>
                              <div className="bg-white p-2 rounded border text-xs text-gray-700">
                                {step.voiceScript}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end mt-4 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handlePreviewStep(step, tour.roleDisplayName)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleTestVoice(step, tour.roleDisplayName)}
                          >
                            <Volume2 className="h-3 w-3 mr-1" />
                            Test Voice
                          </Button>
                        </div>
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
      
      {/* Empty State */}
      {!toursLoading && toursFromAPI?.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No tours found in database.</p>
          <p className="text-sm">Generate new tours using the AI system above.</p>
        </div>
      )}

      {/* AI Guidance Dialog */}
      <Dialog open={showAIGuidanceDialog} onOpenChange={setShowAIGuidanceDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
              AI Tour Generation Instructions
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                Additional Guidance for AI (Optional)
              </Label>
              <p className="text-xs text-gray-600 mb-2">
                Provide specific instructions, focus areas, or requirements for the AI to consider when generating tours.
              </p>
              <Textarea
                value={aiGuidance}
                onChange={(e) => setAiGuidance(e.target.value)}
                placeholder="e.g., Focus on advanced features, include more technical details, emphasize business benefits, add more interactive elements..."
                className="min-h-[100px]"
              />
            </div>
            
            {pendingAction && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">
                  Action: {pendingAction.type === 'selected' ? 'Regenerate Selected Tours' :
                          pendingAction.type === 'all' ? 'Regenerate All Tours' :
                          'Generate New Tours'}
                </p>
                <p className="text-xs text-gray-600">
                  {pendingAction.roles?.length || 0} role(s) selected: {pendingAction.roles?.join(', ')}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAIGuidanceDialog(false);
                setAiGuidance("");
                setPendingAction(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAIGeneration}
              disabled={regenerateTourWithAI.isPending || generateNewToursWithAI.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {regenerateTourWithAI.isPending || generateNewToursWithAI.isPending ? 'Generating...' : 'Generate Tours'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Tour
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the tour for <strong>{tourToDelete?.roleDisplayName}</strong>? 
              This action cannot be undone.
            </p>
            
            {tourToDelete?.tourData?.steps && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">This tour contains:</p>
                <p className="text-xs text-gray-600">
                  {tourToDelete.tourData.steps.length} steps • {tourToDelete.tourData.estimatedDuration || '5-10 min'}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setTourToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => tourToDelete?.id && deleteTourMutation.mutate(tourToDelete.id)}
              disabled={deleteTourMutation.isPending}
            >
              {deleteTourMutation.isPending ? 'Deleting...' : 'Delete Tour'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Step Preview Dialog */}
      <Dialog open={showStepPreviewDialog} onOpenChange={setShowStepPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Step Preview
            </DialogTitle>
          </DialogHeader>
          
          {previewStepData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{previewStepData.role} Tour</Badge>
                <Badge variant="secondary">{previewStepData.step.duration}</Badge>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-2">{previewStepData.step.stepTitle || previewStepData.step.feature}</h4>
                <p className="text-gray-600 mb-4">{previewStepData.step.description}</p>
                
                {previewStepData.step.benefits && Array.isArray(previewStepData.step.benefits) && (
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Benefits:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {previewStepData.step.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {previewStepData.step.navigationPath && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">Navigation:</p>
                    <code className="text-xs text-blue-600">{previewStepData.step.navigationPath}</code>
                  </div>
                )}
                
                {previewStepData.step.voiceScript && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">Voice Script:</p>
                    <p className="text-xs text-gray-600">{previewStepData.step.voiceScript}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowStepPreviewDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tour Preview Dialog */}
      <Dialog open={showTourPreviewDialog} onOpenChange={setShowTourPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Play className="h-5 w-5 mr-2" />
              Tour Preview: {previewTourData?.roleDisplayName}
            </DialogTitle>
          </DialogHeader>
          
          {previewTourData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <h4 className="font-semibold">{previewTourData.roleDisplayName} Tour</h4>
                  <p className="text-sm text-gray-600">
                    {previewTourData.tourData?.steps?.length || 0} steps • 
                    {previewTourData.tourData?.estimatedDuration || '5-10 min'}
                  </p>
                </div>
                <Badge variant="secondary">{previewTourData.role}</Badge>
              </div>
              
              {previewTourData.tourData?.steps?.map((step: any, index: number) => (
                <div key={step.id || index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-3">Step {index + 1}</Badge>
                      <h5 className="font-semibold">{step.stepTitle || step.feature}</h5>
                    </div>
                    <Badge variant="secondary">{step.duration}</Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{step.description}</p>
                  
                  {step.benefits && Array.isArray(step.benefits) && (
                    <div className="mb-3">
                      <h6 className="text-sm font-medium mb-1">Benefits:</h6>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {step.benefits.map((benefit: string, benefitIndex: number) => (
                          <li key={benefitIndex} className="flex items-start">
                            <span className="text-green-600 mr-2">•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                    {step.navigationPath && (
                      <div>
                        <span className="font-medium">Navigation: </span>
                        <code className="bg-gray-100 px-1 rounded">{step.navigationPath}</code>
                      </div>
                    )}
                    {step.actionText && (
                      <div>
                        <span className="font-medium">Action: </span>
                        "{step.actionText}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowTourPreviewDialog(false)}>
              Close Preview
            </Button>
            <Button 
              onClick={async () => {
                setShowTourPreviewDialog(false);
                
                if (!previewTourData?.roleId && !previewTourData?.roleDisplayName) {
                  toast({
                    title: "Error",
                    description: "Unable to determine role for tour. Please try again.",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  // Get fresh user data from the API
                  const response = await apiRequest('GET', '/api/auth/me');
                  const userResponse = await response.json();
                  console.log('Fresh user data:', userResponse);
                  console.log('User response type:', typeof userResponse);
                  console.log('User response keys:', Object.keys(userResponse || {}));
                  
                  let userId;
                  if (!userResponse || !userResponse.id) {
                    console.log('User response invalid, trying to use hook user data:', user);
                    // Fallback to hook user data if fresh fetch fails
                    if (!user?.id) {
                      toast({
                        title: "Authentication Error",
                        description: "Please log in again and try.",
                        variant: "destructive",
                      });
                      return;
                    }
                    // Use hook user data as fallback
                    userId = user.id;
                    console.log('Using fallback user ID:', userId);
                  } else {
                    userId = userResponse.id;
                  }

                  console.log('Tour data:', previewTourData);
                  console.log('System roles:', systemRoles);
                  console.log('Looking for role ID:', previewTourData.roleId, 'Display name:', previewTourData.roleDisplayName);
                  
                  // First, switch to the appropriate role
                  let roleId = previewTourData.roleId; // Use direct roleId if available
                  
                  // Fallback to name matching if roleId not available
                  if (!roleId && previewTourData.roleDisplayName) {
                    roleId = systemRoles?.find((r: any) => {
                      const displayNameMatch = r.name.toLowerCase() === previewTourData.roleDisplayName?.toLowerCase();
                      
                      console.log('Checking role:', r.name, 'ID:', r.id);
                      console.log('Display name match:', displayNameMatch);
                      
                      return displayNameMatch;
                    })?.id;
                  }

                  console.log('Found role ID:', roleId);

                  if (roleId) {
                    console.log('Attempting to switch to role ID:', roleId);
                    console.log('Using user ID:', userId);
                    
                    // Switch role using user ID
                    const response = await apiRequest('POST', `/api/users/${userId}/switch-role`, { roleId });
                    console.log('Role switch response:', response);
                    
                    toast({
                      title: "Starting Live Tour",
                      description: `Switching to ${previewTourData.roleDisplayName} role and launching tour...`,
                    });
                    
                    // Clear cache and navigate to home to start the tour
                    queryClient.clear();
                    setTimeout(() => {
                      window.location.href = '/?startTour=true';
                    }, 1000);
                  } else {
                    toast({
                      title: "Role Not Found",
                      description: `Could not find role for ${previewTourData.roleDisplayName}. Please switch manually.`,
                      variant: "destructive",
                    });
                  }
                } catch (error) {
                  console.error('Failed to start live tour:', error);
                  toast({
                    title: "Error Starting Tour",
                    description: "Failed to switch roles. Please try switching manually.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Start Live Tour
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tour Validation Results Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
              Tour Validation Results
            </DialogTitle>
          </DialogHeader>
          
          {validationResults && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Validation Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{validationResults.summary.totalTours}</div>
                    <div className="text-gray-600">Total Tours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{validationResults.summary.validTours}</div>
                    <div className="text-gray-600">Valid Tours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{validationResults.summary.invalidTours}</div>
                    <div className="text-gray-600">Invalid Tours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{validationResults.summary.totalIssues}</div>
                    <div className="text-gray-600">Total Issues</div>
                  </div>
                </div>
              </div>

              {/* Valid Tours */}
              {validationResults.valid.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valid Tours ({validationResults.valid.length})
                  </h3>
                  <div className="space-y-2">
                    {validationResults.valid.map((tour: any) => (
                      <div key={tour.tourId} className="bg-green-50 border border-green-200 p-3 rounded">
                        <div className="font-medium text-green-800">{tour.role}</div>
                        <div className="text-sm text-green-600 mt-1">
                          {tour.validSteps.length} valid steps - All routes are accessible to this role
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid Tours */}
              {validationResults.invalid.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Invalid Tours ({validationResults.invalid.length})
                  </h3>
                  <div className="space-y-4">
                    {validationResults.invalid.map((tour: any) => (
                      <div key={tour.tourId} className="bg-red-50 border border-red-200 p-4 rounded">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-red-800">{tour.role}</div>
                          <Button
                            size="sm"
                            onClick={() => {
                              regenerateTourWithAI.mutate({ roles: [tour.role], guidance: "Fix route permissions - only include accessible routes" });
                              setShowValidationDialog(false);
                            }}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Regenerate Tour
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {tour.issues.map((issue: any, index: number) => (
                            <div key={index} className="bg-white p-3 rounded border border-red-200">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-sm text-red-800">
                                    Step {issue.stepIndex}: {issue.stepName}
                                  </div>
                                  <div className="text-xs text-red-600 mt-1">
                                    Route: <code className="bg-red-100 px-1 rounded">{issue.navigationPath}</code>
                                  </div>
                                  <div className="text-xs text-red-700 mt-1">{issue.issue}</div>
                                  <div className="text-xs text-gray-600 mt-2">
                                    <strong>Suggestion:</strong> {issue.suggestion}
                                  </div>
                                </div>
                                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-1" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowValidationDialog(false)}
                >
                  Close
                </Button>
                {validationResults.invalid.length > 0 && (
                  <Button
                    onClick={() => {
                      const invalidRoles = validationResults.invalid.map((tour: any) => tour.role);
                      regenerateTourWithAI.mutate({ 
                        roles: invalidRoles, 
                        guidance: "Fix all route permission issues - only include routes that are accessible to each specific role based on their permissions" 
                      });
                      setShowValidationDialog(false);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerate All Invalid Tours
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Voice Generation Dialog */}
      <Dialog open={showVoiceGenerationDialog} onOpenChange={setShowVoiceGenerationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2 text-green-600" />
              AI Voice Generation for Tours
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Selected Tours Summary */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Selected Tours ({voiceGenerationTours.length})</h4>
              <div className="flex flex-wrap gap-2">
                {voiceGenerationTours.map((tour: any) => (
                  <Badge key={tour.id} variant="secondary" className="bg-green-100 text-green-800">
                    {tour.roleDisplayName}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Voice Generation Options */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Script Options */}
              <div className="space-y-4">
                <h4 className="font-semibold">Script Options</h4>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="regenerateScript"
                    checked={voiceGenerationOptions.regenerateScript}
                    onCheckedChange={(checked) => 
                      setVoiceGenerationOptions(prev => ({ ...prev, regenerateScript: checked as boolean }))
                    }
                  />
                  <Label htmlFor="regenerateScript" className="text-sm">
                    Regenerate voice scripts with AI
                  </Label>
                </div>
                
                <p className="text-xs text-gray-600 ml-6">
                  {voiceGenerationOptions.regenerateScript 
                    ? "AI will create new engaging voice scripts for each tour step based on your instructions."
                    : "Use existing tour descriptions as voice scripts (faster but less engaging)."
                  }
                </p>

                {voiceGenerationOptions.regenerateScript && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="userInstructions" className="text-sm font-medium">
                      Instructions for AI Script Generation
                    </Label>
                    <Textarea
                      id="userInstructions"
                      placeholder="e.g., Make the narration more conversational and engaging, focus on business benefits, explain technical features in simple terms..."
                      value={voiceGenerationOptions.userInstructions}
                      onChange={(e) => 
                        setVoiceGenerationOptions(prev => ({ ...prev, userInstructions: e.target.value }))
                      }
                      rows={4}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Voice Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold">Voice Settings</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="voiceSelect" className="text-sm font-medium">Voice Selection</Label>
                    <Select
                      value={voiceGenerationOptions.voice}
                      onValueChange={(value) => 
                        setVoiceGenerationOptions(prev => ({ 
                          ...prev, 
                          voice: value,
                          gender: ['alloy', 'nova', 'shimmer', 'alloy-business', 'nova-slow', 'shimmer-energetic'].includes(value) ? 'female' : 'male'
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">Alloy (Female - Most Popular American Voice)</SelectItem>
                        <SelectItem value="nova">Nova (Female - Clear American Pronunciation)</SelectItem>
                        <SelectItem value="fable">Fable (Male - Top Rated American Voice)</SelectItem>
                        <SelectItem value="echo">Echo (Male - Strong American Accent)</SelectItem>
                        <SelectItem value="onyx">Onyx (Male - Deep American Voice)</SelectItem>
                        <SelectItem value="shimmer">Shimmer (Female - Bright American Accent)</SelectItem>
                        <SelectItem value="alloy-business">Alloy Pro (Female - Professional American)</SelectItem>
                        <SelectItem value="nova-slow">Nova Calm (Female - Gentle American)</SelectItem>
                        <SelectItem value="fable-fast">Fable Express (Male - Dynamic American)</SelectItem>
                        <SelectItem value="echo-calm">Echo Steady (Male - Composed American)</SelectItem>
                        <SelectItem value="shimmer-energetic">Shimmer Bright (Female - Energetic American)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="speedSlider" className="text-sm font-medium">
                      Speech Speed: {voiceGenerationOptions.speed}x
                    </Label>
                    <Input
                      id="speedSlider"
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={voiceGenerationOptions.speed}
                      onChange={(e) => 
                        setVoiceGenerationOptions(prev => ({ ...prev, speed: parseFloat(e.target.value) }))
                      }
                      className="mt-1"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Slow (0.5x)</span>
                      <span>Normal (1.0x)</span>
                      <span>Fast (2.0x)</span>
                    </div>
                  </div>

                  {/* Test Voice Button */}
                  <div>
                    <TestVoiceButton 
                      voiceSettings={voiceGenerationOptions}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Preview current voice settings
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Generation Preview */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Generation Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Tours:</strong> {voiceGenerationTours.length} tours selected</p>
                <p><strong>Steps:</strong> ~{voiceGenerationTours.reduce((total, tour) => total + (tour.tourData?.steps?.length || 0), 0)} voice recordings will be generated</p>
                <p><strong>Voice:</strong> {voiceGenerationOptions.voice} ({voiceGenerationOptions.gender}) at {voiceGenerationOptions.speed}x speed</p>
                <p><strong>Script:</strong> {voiceGenerationOptions.regenerateScript ? 'AI-generated engaging scripts' : 'Use existing tour descriptions'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowVoiceGenerationDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVoiceGenerationSubmit}
                disabled={voiceGenerationMutation.isPending || voiceGenerationTours.length === 0}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {voiceGenerationMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Voice...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Generate Voice Recordings
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}