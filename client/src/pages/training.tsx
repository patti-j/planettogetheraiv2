import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, Target, Monitor, RotateCcw, GraduationCap, Play, UserCheck, Settings, Shield, Edit3, Eye, Volume2, MessageSquare, Sparkles, RefreshCw, ChevronDown, ChevronRight, FileText, Clock, Plus, AlertCircle } from 'lucide-react';
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

  // Get available roles for demonstration
  const { data: availableRoles = [] } = useQuery<Role[]>({
    queryKey: [`/api/users/${user?.id}/available-roles`],
    enabled: !!user?.id && canAccessTraining,
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
                  <div className="text-2xl font-bold">{availableRoles.length}</div>
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
          return '/'; // Production schedulers go to main dashboard
        }
        if (roleNameLower.includes('director')) {
          return '/business-goals'; // Directors go to business goals
        }
        if (roleNameLower.includes('admin')) {
          return '/role-management'; // Admins go to user management
        }
        if (roleNameLower.includes('operator')) {
          return '/operator'; // Operators go to operator dashboard
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
        
        return '/'; // Default to main dashboard
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
        <p className="text-gray-600">
          Switch between different system roles to demonstrate features and permissions. 
          Each role provides access to specific system areas and functionality.
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
              <Badge variant="default" className="bg-blue-600">
                {currentRole.name}
              </Badge>
            </div>
            <CardDescription className="text-blue-700">
              {currentRole.description}
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedMissingRoles, setSelectedMissingRoles] = useState<string[]>([]);
  const [expandedTours, setExpandedTours] = useState<string[]>([]);
  const [editingStep, setEditingStep] = useState<{role: string, stepId: string} | null>(null);

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

  const allRoles = Object.keys(tourData);
  
  // Identify roles that don't have tours yet
  const existingTourRoles = new Set(allRoles);
  const missingTourRoles = systemRoles.filter((role: any) => {
    const roleKey = role.name.toLowerCase().replace(/\s+/g, '-');
    return !existingTourRoles.has(roleKey);
  });

  const generateTourWithAI = useMutation({
    mutationFn: async (roles: string[]) => {
      return apiRequest("POST", "/api/ai/generate-tour", { roles });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Tour Generated",
        description: `AI has successfully generated tours for ${variables.length} role(s)`,
        variant: "default",
      });
      // Clear selections after successful generation
      setSelectedRoles([]);
      setSelectedMissingRoles([]);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate tour content",
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

  const toggleTourExpansion = (role: string) => {
    setExpandedTours(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
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
    generateTourWithAI.mutate(selectedRoles);
  };

  const handleGenerateAllTours = () => {
    generateTourWithAI.mutate(allRoles);
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
    
    generateTourWithAI.mutate(selectedRoleNames);
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
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateSelectedTours}
            disabled={generateTourWithAI.isPending || selectedRoles.length === 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Regenerate Selected ({selectedRoles.length})
          </Button>
          <Button
            onClick={handleGenerateAllTours}
            disabled={generateTourWithAI.isPending}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generateTourWithAI.isPending ? 'animate-spin' : ''}`} />
            AI Regenerate All Tours
          </Button>
        </div>
      </div>

      {/* Tour Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(tourData).map(([role, data]) => (
          <Card key={role} className={`cursor-pointer transition-all ${selectedRoles.includes(role) ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">{data.role}</h4>
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="rounded text-purple-600"
                />
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  {data.totalSteps} steps
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {data.totalDuration}
                </div>
                <div className="flex items-center">
                  <Volume2 className="h-3 w-3 mr-1" />
                  {Object.keys(data.voiceScripts).length} voice scripts
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
              disabled={generateTourWithAI.isPending || selectedMissingRoles.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Tours ({selectedMissingRoles.length})
            </Button>
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
      <div className="space-y-4">
        <h4 className="font-semibold">Detailed Tour Configuration</h4>
        
        {Object.entries(tourData).map(([role, data]) => (
          <Card key={role}>
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50" 
              onClick={() => toggleTourExpansion(role)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {expandedTours.includes(role) ? 
                    <ChevronDown className="h-4 w-4 mr-2" /> : 
                    <ChevronRight className="h-4 w-4 mr-2" />
                  }
                  <CardTitle className="text-lg">{data.role} Tour</CardTitle>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {data.totalSteps} steps
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {data.totalDuration}
                  </span>
                  <Button size="sm" variant="outline">
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit Tour
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {expandedTours.includes(role) && (
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {data.steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-3">Step {index + 1}</Badge>
                          <h5 className="font-semibold">{step.title}</h5>
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
                          <p className="text-gray-600 mb-3">{step.description}</p>
                          
                          <p className="font-medium mb-2">Page Navigation</p>
                          <code className="bg-white px-2 py-1 rounded text-xs border">
                            {step.page}
                          </code>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-2">Key Benefits</p>
                          <ul className="space-y-1 mb-3">
                            {step.benefits.map((benefit, idx) => (
                              <li key={idx} className="text-gray-600 text-xs flex items-start">
                                <span className="text-green-600 mr-1">•</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                          
                          {data.voiceScripts[step.id] && (
                            <div>
                              <p className="font-medium mb-2 flex items-center">
                                <Volume2 className="h-3 w-3 mr-1" />
                                Voice Script
                              </p>
                              <div className="bg-white p-2 rounded border text-xs text-gray-700">
                                {data.voiceScripts[step.id]}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MessageSquare className="h-3 w-3" />
                          Action: "{step.actionText}"
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" variant="ghost">
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
    </div>
  );
}