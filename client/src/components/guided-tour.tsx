import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Settings,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Play,
  Move,
  Volume2,
  VolumeX,
  Pause,
  RotateCcw
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  page: string;
  icon: React.ElementType;
  benefits: string[];
  actionText: string;
  duration: string;
}

interface GuidedTourProps {
  role: string;
  initialStep?: number;
  initialVoiceEnabled?: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onSwitchRole?: (newRole: string) => void;
}

// Available roles for tour selection
const getAvailableRoles = () => [
  {
    id: "director",
    name: "Director",
    description: "Strategic oversight, business goals, and executive reporting",
    icon: TrendingUp
  },
  {
    id: "production-scheduler",
    name: "Production Scheduler",
    description: "Resource planning, job scheduling, and capacity optimization", 
    icon: BarChart3
  },
  {
    id: "plant-manager",
    name: "Plant Manager",
    description: "Overall operations management and department coordination",
    icon: Users
  },
  {
    id: "systems-manager",
    name: "Systems Manager", 
    description: "Technical administration, user management, and system configuration",
    icon: Settings
  }
];

// Define role-specific tour steps
const getTourSteps = (role: string): TourStep[] => {
  const commonSteps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Your Demo",
      description: "Let's explore the key features that will transform your manufacturing operations.",
      page: "current",
      icon: Play,
      benefits: [
        "See real-time production insights",
        "Experience intelligent scheduling",
        "Understand role-based workflows"
      ],
      actionText: "Start Tour",
      duration: "2 min tour"
    },
    {
      id: "demo-complete",
      title: "Demo Experience Complete",
      description: "You now have access to explore all PlanetTogether features using the sidebar navigation.",
      page: "current",
      icon: CheckCircle,
      benefits: [
        "Use the sidebar to navigate between features",
        "All demo data is available for exploration",
        "Contact us to learn about implementation"
      ],
      actionText: "Finish Tour",
      duration: "Complete"
    }
  ];

  const roleSteps: Record<string, TourStep[]> = {
    'director': [
      {
        id: "business-goals",
        title: "Strategic Business Goals",
        description: "Define and track strategic objectives with KPI monitoring and risk management.",
        page: "/business-goals",
        icon: TrendingUp,
        benefits: [
          "Align production with business objectives",
          "Monitor KPIs in real-time",
          "Identify and mitigate risks early"
        ],
        actionText: "Explore Goals",
        duration: "2 min"
      },
      {
        id: "analytics",
        title: "Executive Analytics",
        description: "Access comprehensive dashboards with production metrics and performance insights.",
        page: "/analytics",
        icon: BarChart3,
        benefits: [
          "Make data-driven decisions",
          "Identify optimization opportunities",
          "Track performance trends"
        ],
        actionText: "View Analytics",
        duration: "2 min"
      },
      {
        id: "reports",
        title: "Executive Reports",
        description: "Generate detailed reports for stakeholders and board presentations.",
        page: "/reports",
        icon: Settings,
        benefits: [
          "Professional reporting for stakeholders",
          "Automated report generation",
          "Custom metrics and visualizations"
        ],
        actionText: "See Reports",
        duration: "1 min"
      }
    ],
    'production-scheduler': [
      {
        id: "schedule",
        title: "Production Schedule",
        description: "Interactive Gantt charts for visual production planning and resource allocation.",
        page: "/",
        icon: BarChart3,
        benefits: [
          "Drag-and-drop operation scheduling",
          "Real-time capacity visualization",
          "Optimize resource utilization"
        ],
        actionText: "See Schedule",
        duration: "3 min"
      },
      {
        id: "shop-floor",
        title: "Shop Floor Management",
        description: "Mobile-optimized interface for managing operations on the production floor.",
        page: "/shop-floor",
        icon: Users,
        benefits: [
          "Real-time operation status",
          "Mobile-friendly interface",
          "Quick status updates"
        ],
        actionText: "Visit Shop Floor",
        duration: "2 min"
      }
    ],
    'plant-manager': [
      {
        id: "plant-overview",
        title: "Plant Management",
        description: "Comprehensive oversight of plant operations and strategic decision-making.",
        page: "/plant-manager",
        icon: Settings,
        benefits: [
          "Complete plant visibility",
          "Strategic planning tools",
          "Performance optimization"
        ],
        actionText: "Manage Plant",
        duration: "3 min"
      },
      {
        id: "capacity-planning",
        title: "Capacity Planning",
        description: "Plan and optimize production capacity including staffing and equipment.",
        page: "/capacity-planning",
        icon: Target,
        benefits: [
          "Optimize resource allocation",
          "Plan future capacity needs",
          "Balance workloads effectively"
        ],
        actionText: "Plan Capacity",
        duration: "2 min"
      }
    ]
  };

  // Return role-specific steps plus common steps
  const roleSpecificSteps = roleSteps[role] || [];
  return [commonSteps[0], ...roleSpecificSteps, commonSteps[1]];
};

export function GuidedTour({ role, initialStep = 0, initialVoiceEnabled = false, onComplete, onSkip, onSwitchRole }: GuidedTourProps) {
  console.log("GuidedTour component mounted with role:", role, "initialVoiceEnabled:", initialVoiceEnabled);
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [voiceEnabled, setVoiceEnabled] = useState(initialVoiceEnabled);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<HTMLAudioElement | SpeechSynthesisUtterance | null>(null);
  const preloadedAudioRef = useRef<{[key: string]: HTMLAudioElement}>({});
  const [preloadingStatus, setPreloadingStatus] = useState<{[key: string]: 'loading' | 'ready' | 'error'}>({});

  const tourSteps = getTourSteps(role);
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  
  console.log("GuidedTour initialized - tourSteps:", tourSteps, "currentStep:", currentStep);
  
  // Pre-load all audio when voice is enabled and tour starts
  useEffect(() => {
    if (voiceEnabled && currentStep === 0) {
      console.log("Pre-loading all audio for tour steps...");
      preloadAllAudio();
    }
  }, [voiceEnabled]);
  
  // Pre-load audio for all tour steps
  const preloadAllAudio = async () => {
    for (let i = 0; i < tourSteps.length; i++) {
      const stepData = tourSteps[i];
      const enhancedText = createEngagingNarration(stepData, role);
      
      setPreloadingStatus(prev => ({ ...prev, [stepData.id]: 'loading' }));
      
      try {
        const response = await fetch("/api/ai/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            text: enhancedText,
            gender: "female",
            voice: "nova",
            speed: 1.15
          })
        });

        if (!response.ok) {
          throw new Error(`Audio generation failed for step ${stepData.id}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.preload = "auto";
        
        preloadedAudioRef.current[stepData.id] = audio;
        setPreloadingStatus(prev => ({ ...prev, [stepData.id]: 'ready' }));
        
        console.log(`Pre-loaded audio for step: ${stepData.id}`);
        
      } catch (error) {
        console.error(`Failed to pre-load audio for step ${stepData.id}:`, error);
        setPreloadingStatus(prev => ({ ...prev, [stepData.id]: 'error' }));
      }
    }
  };
  
  // Play cached audio directly from server for a specific step  
  const playPreloadedAudio = async (stepId: string) => {
    if (!voiceEnabled || isGenerating || isPlaying) return;
    
    // Stop any currently playing audio
    if (speechRef.current) {
      if (speechRef.current instanceof Audio) {
        speechRef.current.pause();
        speechRef.current.currentTime = 0;
      } else if (speechRef.current instanceof SpeechSynthesisUtterance) {
        speechSynthesis.cancel();
      }
      speechRef.current = null;
    }
    
    // Always use server-side cached audio for instant playback
    const currentStepData = tourSteps.find(step => step.id === stepId);
    if (currentStepData) {
      const enhancedText = createEngagingNarration(currentStepData, role);
      console.log(`Playing cached audio for step: ${stepId}`);
      
      try {
        setIsGenerating(true);
        
        const response = await fetch("/api/ai/text-to-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            text: enhancedText,
            gender: "female",
            voice: "nova",
            speed: 1.15
          })
        });

        if (!response.ok) {
          throw new Error(`Cached audio fetch failed: ${response.status}`);
        }

        setIsGenerating(false);
        setIsPlaying(true);
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.preload = "auto";
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          speechRef.current = null;
          console.log("Cached audio playback completed");
        };
        
        audio.onerror = (e) => {
          console.error("Cached audio playback error:", e);
          setIsPlaying(false);
          setIsGenerating(false);
          URL.revokeObjectURL(audioUrl);
          speechRef.current = null;
        };
        
        speechRef.current = audio;
        
        try {
          await audio.play();
          console.log("Cached audio started playing");
        } catch (playError) {
          console.error("Auto-play failed:", playError);
          setIsPlaying(false);
          setIsGenerating(false);
        }
        
      } catch (error) {
        console.error(`Failed to load cached audio for step ${stepId}:`, error);
        setIsGenerating(false);
      }
    }
  };

  // Set initial position to lower right corner
  useEffect(() => {
    const cardWidth = 384; // w-96 in pixels
    const cardHeight = 500; // approximate height
    const padding = 20; // padding from edges
    
    setPosition({
      x: Math.max(0, window.innerWidth - cardWidth - padding),
      y: Math.max(0, window.innerHeight - cardHeight - padding)
    });
  }, []);

  // Auto-start voice on first load if user selected voice narration during registration
  useEffect(() => {
    console.log("Auto-start voice effect triggered:", { initialVoiceEnabled, currentStep, hasSteps: tourSteps[0] != null });
    if (initialVoiceEnabled && currentStep === 0 && tourSteps[0]) {
      // Auto-start the first step's audio if voice was enabled during registration
      console.log("Auto-starting voice for welcome step since user enabled voice narration");
      const welcomeStepData = tourSteps[0];
      // Also enable voice controls when auto-starting
      setVoiceEnabled(true);
      setTimeout(() => playPreloadedAudio(welcomeStepData.id), 300); // Small delay for smooth loading
    }
  }, [initialVoiceEnabled]); // Only run once when component mounts

  // Play cached audio when step changes and voice is enabled
  useEffect(() => {
    if (voiceEnabled && tourSteps[currentStep] && currentStep > 0) {
      const currentStepData = tourSteps[currentStep];
      // Use server-side cached audio for instant playback
      setTimeout(() => playPreloadedAudio(currentStepData.id), 50); 
    }
  }, [currentStep, voiceEnabled]);

  // Clean up speech on component unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  // Drag functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleNext = () => {
    stopSpeech(); // Stop current speech before proceeding
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      const nextStepData = tourSteps[nextStep];
      
      console.log("Moving to tour step:", nextStep, "page:", nextStepData.page);
      
      // Navigate to the page if it's not current
      if (nextStepData.page && nextStepData.page !== "current") {
        console.log("Navigating to:", nextStepData.page);
        setLocation(nextStepData.page);
      }
      
      setCurrentStep(nextStep);
      // Voice will be handled automatically by useEffect when currentStep changes
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    stopSpeech(); // Stop current speech before proceeding
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const handleComplete = () => {
    stopSpeech();
    // Instead of completing immediately, show role selection dialog
    setShowRoleSelection(true);
  };

  const handleContinueWithNewRole = (newRole: string) => {
    console.log("Starting new tour with role:", newRole);
    setShowRoleSelection(false);
    
    // Use callback to inform parent component about role switch
    if (onSwitchRole) {
      onSwitchRole(newRole);
    }
  };

  const handleFinishAllTours = () => {
    setShowRoleSelection(false);
    setIsVisible(false);
    toast({
      title: "All Tours Complete!",
      description: "Thanks for exploring PlanetTogether! Continue exploring the features on your own.",
    });
    onComplete();
  };

  const handleSkipTour = () => {
    stopSpeech();
    
    // Save tour progress to localStorage so user can resume later
    const tourState = {
      role,
      currentStep,
      voiceEnabled,
      timestamp: Date.now()
    };
    localStorage.setItem('tourProgress', JSON.stringify(tourState));
    
    setIsVisible(false);
    onSkip();
  };

  // Create engaging narration for each step
  const createEngagingNarration = (step: TourStep, userRole: string): string => {
    const engagingNarrations: { [key: string]: string } = {
      "welcome": "Welcome to your personalized PlanetTogether demo! I'm excited to show you how our intelligent manufacturing platform can revolutionize your production operations. In the next few minutes, you'll discover features specifically tailored for your role that will save time, reduce costs, and boost efficiency. Let's begin this journey together!",
      
      "business-goals": "Now we're entering the Strategic Business Goals module - this is where directors like yourself align manufacturing operations with strategic objectives. Here you can set KPIs, monitor progress in real-time, and identify risks before they impact your business. Think of this as your command center for ensuring production supports your broader business strategy. You can track metrics like on-time delivery, cost per unit, and quality scores.",
      
      "analytics": "Welcome to the Executive Analytics dashboard - your data-driven decision-making hub! This powerful interface transforms complex production data into actionable insights. You can spot trends, identify bottlenecks, and discover optimization opportunities at a glance. The customizable widgets adapt to show the metrics that matter most to directors - from overall equipment effectiveness to profit margins. Notice how everything updates in real-time to give you the current pulse of your operation.",
      
      "reports": "Here's the Executive Reports center where you can generate comprehensive reports for stakeholders and board presentations. These aren't just basic charts - they're intelligent reports that highlight key insights and recommendations. You can schedule automatic delivery to executives, customize layouts for different audiences, and drill down into specific metrics. Perfect for monthly reviews, quarterly business reports, and strategic planning sessions.",
      
      "schedule": "Now you're seeing the heart of PlanetTogether - our intelligent production scheduler! This interactive Gantt chart gives you complete visibility into your manufacturing operations. Watch how you can drag and drop operations between resources, see real-time capacity utilization, and instantly understand the impact of schedule changes. The system automatically checks resource capabilities and highlights potential conflicts. This is where efficiency gains happen!",
      
      "shop-floor": "This is our mobile-optimized Shop Floor interface - designed for managers who need to stay connected while walking the production floor. You can monitor operations in real-time, respond to issues instantly, and keep production moving smoothly. The interface adapts perfectly to tablets and smartphones, so you're never out of touch with what's happening on the floor.",
      
      "plant-overview": "Welcome to Plant Management central command! This comprehensive view gives plant managers complete oversight of all operations. You can monitor multiple production lines, track key performance indicators, and coordinate between departments seamlessly. The dashboard aggregates data from across your facility to provide the big picture while allowing you to drill down into specific areas when needed.",
      
      "capacity-planning": "Here's where strategic capacity planning comes alive! This module helps you balance current workloads while planning for future growth. You can model different scenarios, understand resource constraints, and make informed decisions about staffing and equipment needs. The system shows you exactly where bottlenecks might occur and suggests optimal resource allocation strategies.",
      
      "demo-complete": "Congratulations! You've experienced the core capabilities of PlanetTogether that are transforming manufacturing operations worldwide. Take your time exploring these features using the navigation menu - all the demo data is ready for you to experiment with. When you're ready to see how PlanetTogether can work with your specific operations, our team is here to help you get started. Thank you for taking this journey with us!"
    };

    return engagingNarrations[step.id] || `Let me show you ${step.title}. ${step.description} This feature will help you ${step.benefits[0]?.toLowerCase()}.`;
  };

  // AI Voice functionality using OpenAI text-to-speech
  const speakText = async (text: string) => {
    if (!voiceEnabled || isGenerating || isPlaying) return;
    
    // Stop any currently playing audio
    if (speechRef.current) {
      if (speechRef.current instanceof Audio) {
        speechRef.current.pause();
        speechRef.current.currentTime = 0;
      } else if (speechRef.current instanceof SpeechSynthesisUtterance) {
        speechSynthesis.cancel();
      }
      speechRef.current = null;
    }
    
    try {
      setIsGenerating(true);
      console.log("Generating AI speech for:", text.substring(0, 50) + "...");
      
      const response = await fetch("/api/ai/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          text: text,
          gender: "female", // Use female voice for engaging tour experience
          voice: "nova", // High-quality AI voice from OpenAI
          speed: 1.15 // Slightly faster speech for better engagement and reduced wait time
        })
      });

      if (!response.ok) {
        throw new Error(`AI speech generation failed: ${response.status}`);
      }

      setIsGenerating(false);
      setIsPlaying(true);
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Pre-load audio for faster playback
      audio.preload = "auto";
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        speechRef.current = null;
        console.log("AI speech playback completed");
      };
      
      audio.onerror = (e) => {
        console.error("AI audio playback error:", e);
        setIsPlaying(false);
        setIsGenerating(false);
        URL.revokeObjectURL(audioUrl);
        speechRef.current = null;
        // Fallback to browser speech synthesis if AI playback fails
        fallbackSpeech(text);
      };
      
      speechRef.current = audio;
      
      // Add user interaction requirement for audio playback (browser security)
      const playAudio = async () => {
        try {
          await audio.play();
          console.log("AI speech started playing");
        } catch (playError) {
          console.error("Auto-play failed, likely due to browser policy:", playError);
          // Show user interaction prompt if auto-play fails
          setIsPlaying(false);
          setIsGenerating(false);
          fallbackSpeech(text);
        }
      };
      
      await playAudio();
      
    } catch (error) {
      console.error("AI speech generation error:", error);
      setIsPlaying(false);
      setIsGenerating(false);
      // Fallback to browser speech synthesis if AI fails
      fallbackSpeech(text);
    }
  };

  // Fallback to browser speech if AI fails
  const fallbackSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    console.log("Using fallback browser speech synthesis");
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    
    // Try to find a good female voice for fallback
    const preferredVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('samantha')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (speechRef.current) {
      if (speechRef.current instanceof Audio) {
        speechRef.current.pause();
        speechRef.current.currentTime = 0;
      }
      speechRef.current = null;
    }
    
    // Also cancel browser speech synthesis as fallback
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    setIsPlaying(false);
    setIsGenerating(false);
  };

  const toggleVoice = () => {
    // Prevent toggling while audio is generating or playing
    if (isGenerating || isPlaying) return;
    
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);
    
    if (!newVoiceEnabled) {
      stopSpeech();
    } else if (newVoiceEnabled && tourSteps[currentStep]) {
      // Speak current step when voice is enabled using cached audio
      playPreloadedAudio(tourSteps[currentStep].id);
    }
  };

  const togglePlayPause = () => {
    // Prevent multiple clicks during generation or if voice is disabled
    if (isGenerating || !voiceEnabled) return;
    
    if (isPlaying) {
      stopSpeech();
    } else if (tourSteps[currentStep]) {
      playPreloadedAudio(tourSteps[currentStep].id);
    }
  };

  const replayCurrentStep = () => {
    // Replay the current step's narration
    if (!voiceEnabled || isGenerating) return;
    
    // Stop any current speech
    stopSpeech();
    
    // Play current step narration using cached audio
    if (tourSteps[currentStep]) {
      playPreloadedAudio(tourSteps[currentStep].id);
    }
  };

  const currentStepData = tourSteps[currentStep];
  const StepIcon = currentStepData.icon;

  if (!isVisible) return null;

  return (
    <>
      {/* Light backdrop that allows interaction with background */}
      <div className="fixed inset-0 bg-black bg-opacity-20 z-40 pointer-events-none"></div>
      
      {/* Draggable tour window */}
      <Card 
        ref={cardRef}
        className="fixed w-96 bg-white shadow-2xl z-50 cursor-move"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <CardHeader 
          className="relative cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4 text-gray-400" />
              <Badge variant="secondary" className="text-sm">
                {role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')} Demo
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {/* Voice Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVoice}
                className={`text-gray-500 hover:text-gray-700 ${voiceEnabled ? 'bg-blue-50 text-blue-600' : ''}`}
                title={voiceEnabled ? "Turn off voice narration" : "Turn on voice narration"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              
              {/* Play/Pause Button with Generation Indicator (only shown when voice is enabled) */}
              {voiceEnabled && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    disabled={isGenerating}
                    className={`text-gray-500 hover:text-gray-700 ${isGenerating ? 'animate-pulse bg-blue-50' : ''}`}
                    title={isGenerating ? "Generating voice..." : isPlaying ? "Pause narration" : "Play narration"}
                  >
                    {isGenerating ? (
                      <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {/* Replay Button next to audio controls */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={replayCurrentStep}
                    disabled={isGenerating}
                    className="text-gray-500 hover:text-gray-700"
                    title="Replay current step narration"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipTour}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-blue-100">
                <StepIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-gray-900">
                  {currentStepData.title}
                </CardTitle>
                <p className="text-gray-600 mt-1">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Step {currentStep + 1} of {tourSteps.length}</span>
                <span>{currentStepData.duration}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Voice Status Indicator */}
            {voiceEnabled && (
              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                {isGenerating || isPlaying ? (
                  <div className="flex items-center gap-2">
                    {isGenerating ? (
                      <>
                        <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Generating voice narration...</span>
                      </>
                    ) : (
                      <>
                        <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                        <span>Playing voice narration</span>
                      </>
                    )}
                  </div>
                ) : (
                  // Show pre-loading status
                  <div className="flex items-center justify-between">
                    <span>Voice Ready: {Object.values(preloadingStatus).filter(s => s === 'ready').length}/{tourSteps.length} steps</span>
                    {Object.values(preloadingStatus).some(s => s === 'loading') && (
                      <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
            {/* Benefits */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Key Benefits
              </h4>
              <ul className="space-y-1">
                {currentStepData.benefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visit Page Button for steps with specific pages */}
            {currentStepData.page && currentStepData.page !== "current" && (
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    console.log("Visiting page:", currentStepData.page);
                    setLocation(currentStepData.page);
                  }}
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {currentStepData.actionText}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipTour}
                  className="text-gray-500 px-2"
                >
                  Skip
                </Button>
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrevious} className="px-2">
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Back
                  </Button>
                )}
                {/* Voice replay button (when voice is enabled) */}
                {voiceEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={replayCurrentStep}
                    disabled={isGenerating}
                    className="px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    title="Replay current step narration"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Replay
                  </Button>
                )}
              </div>
              
              <Button onClick={handleNext} size="sm" className="bg-blue-600 hover:bg-blue-700 px-3">
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Complete
                    <CheckCircle className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Selection Dialog */}
        <Dialog open={showRoleSelection} onOpenChange={setShowRoleSelection}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-center mb-4">
                🎉 Tour Complete! Continue Exploring?
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Great job completing the <strong>{role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}</strong> tour! 
                  Would you like to explore PlanetTogether from another role's perspective?
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Each role shows different features and capabilities tailored to specific responsibilities.
                </p>
              </div>

              {/* Role Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getAvailableRoles().filter(availableRole => availableRole.id !== role).map((availableRole) => (
                  <Button
                    key={availableRole.id}
                    onClick={() => handleContinueWithNewRole(availableRole.id)}
                    variant="outline"
                    className="h-auto p-4 text-left hover:bg-blue-50 hover:border-blue-300 min-h-[80px] flex items-start"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <availableRole.icon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 mb-1">{availableRole.name}</div>
                        <div className="text-xs text-gray-500 leading-relaxed overflow-hidden">
                          {availableRole.description.length > 60 
                            ? `${availableRole.description.substring(0, 60)}...` 
                            : availableRole.description
                          }
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={handleFinishAllTours}
                  variant="outline" 
                  className="flex-1"
                >
                  No Thanks, I'm Done
                </Button>
                <Button 
                  onClick={handleFinishAllTours}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Explore On My Own
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </>
  );
}