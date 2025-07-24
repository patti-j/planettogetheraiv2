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
import { TourManagementSettings } from '@/components/tour-management-settings';
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
  const [showTourSettings, setShowTourSettings] = useState(false);
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const { aiTheme } = useAITheme();
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
  // Tour Management Component - moved inside Training component to access showTourSettings state
  function TourManagementSection() {
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

    // Generate Tours for Selected Roles mutation
    const generateSelectedToursMutation = useMutation({
      mutationFn: (data: { roles: string[], guidance?: string }) => 
        apiRequest('POST', '/api/ai/generate-tour', data),
      onSuccess: () => {
        toast({
          title: "Tours Generated Successfully",
          description: "The selected tours have been generated with AI assistance.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      },
    });

    // Delete Tour mutation
    const deleteTourMutation = useMutation({
      mutationFn: (tourId: number) => 
        apiRequest('DELETE', `/api/tours/${tourId}`),
      onSuccess: () => {
        toast({
          title: "Tour Deleted",
          description: "Tour has been successfully deleted.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
        setShowDeleteDialog(false);
        setTourToDelete(null);
      },
    });

    const toursArray = Array.isArray(toursFromAPI) ? toursFromAPI : [];
    const existingRoleIds = toursArray.map((tour: any) => tour.roleId);
    const rolesWithTours = toursArray.map((tour: any) => tour.roleDisplayName || tour.roleName);
    
    // Get all system roles for demonstration
    const { data: allRoles = [] } = useQuery<Role[]>({
      queryKey: ['/api/roles'],
      staleTime: 300000, // 5 minutes
    });

    const missingRoles = allRoles.filter(role => 
      !existingRoleIds.includes(role.id)
    );

    const handleSelectAll = (type: 'existing' | 'missing') => {
      if (type === 'existing') {
        const allRoleNames = rolesWithTours;
        setSelectedRoles(selectedRoles.length === allRoleNames.length ? [] : allRoleNames);
      } else {
        const allMissingRoleNames = missingRoles.map(r => r.name);
        setSelectedMissingRoles(selectedMissingRoles.length === allMissingRoleNames.length ? [] : allMissingRoleNames);
      }
    };

    const handleGenerateSelectedTours = () => {
      if (selectedRoles.length === 0 && selectedMissingRoles.length === 0) {
        toast({
          title: "No Selection",
          description: "Please select at least one role to generate tours for.",
          variant: "destructive",
        });
        return;
      }
      setShowAIGuidanceDialog(true);
      setPendingAction({ 
        type: 'selected', 
        roles: [...selectedRoles, ...selectedMissingRoles] 
      });
    };

    const executeGenerateTours = (guidance: string) => {
      if (!pendingAction) return;
      
      const roles = pendingAction.roles || [];
      generateSelectedToursMutation.mutate({ roles, guidance });
      setShowAIGuidanceDialog(false);
      setPendingAction(null);
      setAiGuidance("");
      setSelectedRoles([]);
      setSelectedMissingRoles([]);
    };

    // Handle preview tour
    const handlePreviewTour = (tour: any) => {
      try {
        const tourData = typeof tour.tourData === 'string' ? JSON.parse(tour.tourData) : tour.tourData;
        const mappedTourData = {
          ...tour,
          steps: tourData?.steps || [],
          totalSteps: tourData?.totalSteps || tourData?.steps?.length || 0,
          estimatedDuration: tourData?.estimatedDuration || 'Unknown duration',
          voiceScriptCount: tourData?.voiceScriptCount || 0
        };
        setPreviewTourData(mappedTourData);
      } catch (e) {
        console.error('Error parsing tour data:', e);
        setPreviewTourData(tour);
      }
      setShowTourPreviewDialog(true);
    };

    // Handle start live tour
    const handleStartLiveTour = (tour: any) => {
      console.log("Starting live tour for:", tour);
      console.log("Available roles:", allRoles);
      
      // Find the role by ID or name with improved matching
      let roleToSwitch = null;
      
      // First try to match by role ID
      if (tour.roleId) {
        roleToSwitch = allRoles.find(role => role.id === tour.roleId);
      }
      
      // If not found, try to match by role display name
      if (!roleToSwitch && (tour.roleDisplayName || tour.roleName)) {
        const targetRoleName = tour.roleDisplayName || tour.roleName;
        roleToSwitch = allRoles.find(role => 
          role.name === targetRoleName || 
          role.name.toLowerCase() === targetRoleName.toLowerCase()
        );
      }
      
      console.log("Found role to switch:", roleToSwitch);
      
      if (roleToSwitch) {
        // Switch role first, then start tour
        const switchRoleAndStartTour = async () => {
          try {
            // Switch to the target role
            const response = await apiRequest('POST', `/api/users/${user?.id}/switch-role`, {
              roleId: roleToSwitch.id
            });
            
            if (response.ok) {
              // Start the tour with voice enabled by default
              startTour(roleToSwitch.id, true);
              
              toast({
                title: "Tour Started",
                description: `Starting guided tour as ${roleToSwitch.name}`,
              });
            } else {
              throw new Error("Failed to switch role");
            }
          } catch (error) {
            console.error("Error switching role:", error);
            // Try to start tour anyway without role switch
            startTour(roleToSwitch.id, true);
            
            toast({
              title: "Tour Started",
              description: `Starting guided tour as ${roleToSwitch.name}`,
            });
          }
        };
        
        switchRoleAndStartTour();
      } else {
        toast({
          title: "Role Not Found",
          description: `Could not find role for tour: ${tour.roleDisplayName || tour.roleName}. Available roles: ${allRoles.map(r => r.name).join(', ')}`,
          variant: "destructive",
        });
      }
    };

    // Handle single tour regeneration
    const handleSingleTourRegeneration = (tour: any) => {
      setSelectedTourForRegeneration(tour);
      setShowSingleTourGuidanceDialog(true);
    };

    // Single tour regeneration mutation
    const regenerateSingleTourMutation = useMutation({
      mutationFn: (data: { roleId: number, guidance?: string }) => 
        apiRequest('POST', `/api/ai/generate-tour/single`, data),
      onSuccess: () => {
        toast({
          title: "Tour Regenerated",
          description: "The tour has been successfully regenerated with AI assistance.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
        setShowSingleTourGuidanceDialog(false);
        setSelectedTourForRegeneration(null);
        setSingleTourGuidance("");
      },
    });

    const executeSingleTourRegeneration = () => {
      if (!selectedTourForRegeneration) return;
      
      regenerateSingleTourMutation.mutate({
        roleId: selectedTourForRegeneration.roleId,
        guidance: singleTourGuidance
      });
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-medium text-gray-900">Tour Management</h3>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowTourSettings(true)}
              className={`${aiTheme.gradient} text-white`}
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Tour Settings</span>
              <span className="sm:hidden">Settings</span>
            </Button>
          </div>
        </div>

        {toursLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading tours...</p>
          </div>
        ) : (
          <>
            {/* Existing Tours Section */}
            {toursArray.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h4 className="text-md font-medium text-gray-800">Existing Tours ({toursArray.length})</h4>
                    {selectedRoles.length > 0 && (
                      <Button
                        onClick={handleGenerateSelectedTours}
                        disabled={generateSelectedToursMutation.isPending}
                        className={`${aiTheme.gradient} text-white text-xs`}
                        size="sm"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Regenerate Selected</span>
                        <span className="sm:hidden">Regenerate</span>
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('existing')}
                      className="text-xs"
                    >
                      {selectedRoles.length === rolesWithTours.length ? 'None' : `All (${toursArray.length})`}
                    </Button>
                    {selectedRoles.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {selectedRoles.length} of {toursArray.length} selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  {toursArray.map((tour: any) => (
                    <Card key={tour.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedRoles.includes(tour.roleDisplayName || tour.roleName)}
                              onCheckedChange={(checked) => {
                                const roleName = tour.roleDisplayName || tour.roleName;
                                if (checked) {
                                  setSelectedRoles([...selectedRoles, roleName]);
                                } else {
                                  setSelectedRoles(selectedRoles.filter(r => r !== roleName));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <CardTitle className="text-lg">{tour.roleDisplayName || tour.roleName}</CardTitle>
                              <CardDescription>
                                {(() => {
                                  try {
                                    const tourData = typeof tour.tourData === 'string' ? JSON.parse(tour.tourData) : tour.tourData;
                                    const stepCount = tourData?.totalSteps || tourData?.steps?.length || 0;
                                    const duration = tourData?.estimatedDuration || 'Unknown duration';
                                    return `${stepCount} steps • ${duration}`;
                                  } catch (e) {
                                    return '0 steps • Unknown duration';
                                  }
                                })()}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm" 
                              onClick={() => handlePreviewTour(tour)}
                              title="Preview Tour"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline ml-1">Preview</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartLiveTour(tour)}
                              className={`${aiTheme.gradient} text-white`}
                              title="Start Live Tour"
                            >
                              <Play className="w-4 h-4" />
                              <span className="hidden sm:inline ml-1">Start</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSingleTourRegeneration(tour)}
                              className={`${aiTheme.gradient} text-white`}
                              title="Regenerate Tour"
                            >
                              <RefreshCw className="w-4 h-4" />
                              <span className="hidden sm:inline ml-1">Regenerate</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setExpandedTours(prev => 
                                  prev.includes(tour.id) 
                                    ? prev.filter(id => id !== tour.id)
                                    : [...prev, tour.id]
                                );
                              }}
                            >
                              {expandedTours.includes(tour.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline ml-1">
                                {expandedTours.includes(tour.id) ? 'Collapse' : 'Expand'}
                              </span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setTourToDelete(tour);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline ml-1">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {expandedTours.includes(tour.id) && (
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {(() => {
                              try {
                                const tourData = typeof tour.tourData === 'string' ? JSON.parse(tour.tourData) : tour.tourData;
                                const steps = tourData?.steps || [];
                                return steps.length > 0 ? steps.map((step: any, index: number) => (
                                  <div key={index} className="border rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium">{step.stepName || `Step ${index + 1}`}</h4>
                                      <Badge variant="outline">{step.navigationPath || step.page || step.route || 'No navigation'}</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">{step.description}</p>
                                    {step.benefits && (
                                      <div className="text-xs text-green-600">
                                        Benefits: {Array.isArray(step.benefits) ? step.benefits.join(', ') : step.benefits}
                                      </div>
                                    )}
                                  </div>
                                )) : (
                                  <p className="text-sm text-gray-500">No steps available</p>
                                );
                              } catch (e) {
                                return <p className="text-sm text-red-500">Error loading tour steps</p>;
                              }
                            })()}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Tours for Missing Roles */}
            {missingRoles.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h4 className="text-md font-medium text-gray-800">Generate Tours for Additional Roles ({missingRoles.length})</h4>
                    {selectedMissingRoles.length > 0 && (
                      <Button
                        onClick={handleGenerateSelectedTours}
                        disabled={generateSelectedToursMutation.isPending}
                        className={`${aiTheme.gradient} text-white text-xs`}
                        size="sm"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Generate Tours</span>
                        <span className="sm:hidden">Generate</span>
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('missing')}
                      className="text-xs"
                    >
                      {selectedMissingRoles.length === missingRoles.length ? 'None' : `All (${missingRoles.length})`}
                    </Button>
                    {selectedMissingRoles.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {selectedMissingRoles.length} of {missingRoles.length} selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {missingRoles.map((role) => (
                    <Card key={role.id} className="border-dashed border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedMissingRoles.includes(role.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMissingRoles([...selectedMissingRoles, role.name]);
                              } else {
                                setSelectedMissingRoles(selectedMissingRoles.filter(r => r !== role.name));
                              }
                            }}
                          />
                          <div>
                            <h4 className="font-medium">{role.name}</h4>
                            <p className="text-sm text-gray-500">{role.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* AI Guidance Dialog */}
            <Dialog open={showAIGuidanceDialog} onOpenChange={setShowAIGuidanceDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>AI Tour Generation</DialogTitle>
                  <DialogDescription>
                    Provide guidance for the AI to create role-specific tours that highlight relevant features and benefits.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-guidance">Custom Instructions (Optional)</Label>
                    <Textarea
                      id="ai-guidance"
                      placeholder="E.g., Focus on scheduling and optimization features, emphasize time-saving benefits..."
                      value={aiGuidance}
                      onChange={(e) => setAiGuidance(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAIGuidanceDialog(false);
                        setPendingAction(null);
                        setAiGuidance("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => executeGenerateTours(aiGuidance)}
                      disabled={generateSelectedToursMutation.isPending}
                      className={`${aiTheme.gradient} text-white`}
                    >
                      {generateSelectedToursMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Tours
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Single Tour Regeneration Dialog */}
            <Dialog open={showSingleTourGuidanceDialog} onOpenChange={setShowSingleTourGuidanceDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Regenerate Tour</DialogTitle>
                  <DialogDescription>
                    Regenerate the tour for {selectedTourForRegeneration?.roleDisplayName || selectedTourForRegeneration?.roleName} with custom AI guidance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="single-tour-guidance">Custom Instructions (Optional)</Label>
                    <Textarea
                      id="single-tour-guidance"
                      placeholder="E.g., Focus more on advanced features, emphasize efficiency benefits..."
                      value={singleTourGuidance}
                      onChange={(e) => setSingleTourGuidance(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSingleTourGuidanceDialog(false);
                        setSelectedTourForRegeneration(null);
                        setSingleTourGuidance("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={executeSingleTourRegeneration}
                      disabled={regenerateSingleTourMutation.isPending}
                      className={`${aiTheme.gradient} text-white`}
                    >
                      {regenerateSingleTourMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Regenerate Tour
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Tour Preview Dialog */}
            <Dialog open={showTourPreviewDialog} onOpenChange={setShowTourPreviewDialog}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tour Preview: {previewTourData?.roleDisplayName || previewTourData?.roleName}</DialogTitle>
                  <DialogDescription>
                    Preview the complete tour content and navigation flow
                  </DialogDescription>
                </DialogHeader>
                {previewTourData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{previewTourData.steps?.length || 0}</div>
                        <div className="text-sm text-gray-600">Steps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{previewTourData.estimatedDuration || 'Unknown'}</div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{previewTourData.voiceScripts ? Object.keys(previewTourData.voiceScripts).length : 0}</div>
                        <div className="text-sm text-gray-600">Voice Scripts</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg">Tour Steps</h4>
                      {previewTourData.steps?.map((step: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-lg">
                              {index + 1}. {step.stepName || `Step ${index + 1}`}
                            </h5>
                            <Badge variant="outline" className="text-xs">
                              {step.navigationPath || step.page || step.route || 'No navigation'}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Description</Label>
                              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                            </div>
                            
                            {step.benefits && (
                              <div>
                                <Label className="text-sm font-medium text-green-700">Key Benefits</Label>
                                <p className="text-sm text-green-600 mt-1">{step.benefits}</p>
                              </div>
                            )}
                            
                            {step.voiceScript && (
                              <div>
                                <Label className="text-sm font-medium text-purple-700">Voice Script</Label>
                                <p className="text-sm text-purple-600 mt-1 italic">"{step.voiceScript}"</p>
                                <div className="mt-2">
                                  <TestVoiceButton voiceSettings={{ voice: 'nova', gender: 'female', speed: 1.1 }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )) || (
                        <p className="text-center text-gray-500 py-8">No steps available in this tour</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setShowTourPreviewDialog(false)}
                      >
                        Close Preview
                      </Button>
                      <Button
                        onClick={() => {
                          setShowTourPreviewDialog(false);
                          handleStartLiveTour(previewTourData);
                        }}
                        className={`${aiTheme.gradient} text-white`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Live Tour
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Tour</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the tour for {tourToDelete?.roleDisplayName || tourToDelete?.roleName}? 
                    This action cannot be undone.
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
          </>
        )}
      </div>
    );
  }
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
        <div className="lg:flex-shrink-0 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTourSettings(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Tour Settings</span>
          </Button>
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

      {/* Tour Management Settings Dialog */}
      <TourManagementSettings 
        open={showTourSettings}
        onOpenChange={setShowTourSettings}
      />
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
// Tour Management Component Interfaces
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
