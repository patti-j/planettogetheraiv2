import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Pause
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
  initialVoiceEnabled?: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

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

export function GuidedTour({ role, initialVoiceEnabled = false, onComplete, onSkip }: GuidedTourProps) {
  console.log("GuidedTour component mounted with role:", role, "voice enabled:", initialVoiceEnabled);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [voiceEnabled, setVoiceEnabled] = useState(initialVoiceEnabled);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<Audio | SpeechSynthesisUtterance | null>(null);

  const tourSteps = getTourSteps(role);
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  
  console.log("GuidedTour initialized - tourSteps:", tourSteps, "currentStep:", currentStep);

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

  // Speak text when step changes and voice is enabled
  useEffect(() => {
    if (voiceEnabled && tourSteps[currentStep]) {
      const currentStepData = tourSteps[currentStep];
      const textToSpeak = `${currentStepData.title}. ${currentStepData.description}`;
      setTimeout(() => speakText(textToSpeak), 500); // Small delay to ensure UI is ready
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

  const handleComplete = () => {
    stopSpeech();
    setIsVisible(false);
    toast({
      title: "Tour Complete!",
      description: "You've successfully completed the demo tour. Continue exploring the features.",
    });
    onComplete();
  };

  const handleSkipTour = () => {
    stopSpeech();
    setIsVisible(false);
    onSkip();
  };

  // AI Voice functionality using OpenAI text-to-speech
  const speakText = async (text: string) => {
    if (!voiceEnabled) return;
    
    // Stop any currently playing audio
    if (speechRef.current) {
      if (speechRef.current instanceof Audio) {
        speechRef.current.pause();
      }
      speechRef.current = null;
    }
    
    try {
      setIsPlaying(true);
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
          voice: "nova" // High-quality AI voice from OpenAI
        })
      });

      if (!response.ok) {
        throw new Error(`AI speech generation failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        speechRef.current = null;
        console.log("AI speech playback completed");
      };
      
      audio.onerror = (e) => {
        console.error("AI audio playback error:", e);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        speechRef.current = null;
        // Fallback to browser speech synthesis if AI playback fails
        fallbackSpeech(text);
      };
      
      speechRef.current = audio;
      await audio.play();
      console.log("AI speech started playing");
      
    } catch (error) {
      console.error("AI speech generation error:", error);
      setIsPlaying(false);
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
  };

  const toggleVoice = () => {
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);
    
    if (!newVoiceEnabled) {
      stopSpeech();
    } else if (newVoiceEnabled && tourSteps[currentStep]) {
      // Speak current step when voice is enabled
      const currentStepData = tourSteps[currentStep];
      const textToSpeak = `${currentStepData.title}. ${currentStepData.description}`;
      speakText(textToSpeak);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopSpeech();
    } else if (voiceEnabled && tourSteps[currentStep]) {
      const currentStepData = tourSteps[currentStep];
      const textToSpeak = `${currentStepData.title}. ${currentStepData.description}`;
      speakText(textToSpeak);
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
              
              {/* Play/Pause Button (only shown when voice is enabled) */}
              {voiceEnabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-gray-500 hover:text-gray-700"
                  title={isPlaying ? "Pause narration" : "Play narration"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
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
    </>
  );
}