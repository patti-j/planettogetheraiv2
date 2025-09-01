import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Bot, 
  Brain, 
  Sparkles, 
  Mic, 
  MessageSquare, 
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Volume2,
  Settings,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { useMaxDock } from "@/contexts/MaxDockContext";
import { useAITheme } from "@/hooks/use-ai-theme";

interface MaxAICardProps {
  className?: string;
  showDemo?: boolean;
}

export function MaxAICard({ className = "", showDemo = false }: MaxAICardProps) {
  const { setMaxOpen, isMaxOpen } = useMaxDock();
  const { aiTheme } = useAITheme();
  const [demoState, setDemoState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Max AI Settings State
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    autoRespond: false,
    responseSpeed: 'medium',
    notificationsEnabled: true,
    proactiveInsights: true,
    learningMode: true,
    responseVolume: [70],
    preferredLanguage: 'english',
    analysisDepth: 'balanced'
  });

  const handleOpenMax = () => {
    setMaxOpen(true);
  };

  const handleStartDemo = () => {
    setDemoState('running');
    // Simulate demo running for 3 seconds
    setTimeout(() => {
      setDemoState('idle');
    }, 3000);
  };

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Save settings to localStorage
    const updatedSettings = { ...settings, [key]: value };
    localStorage.setItem('maxAISettings', JSON.stringify(updatedSettings));
    
    console.log(`Max AI Setting changed: ${key} = ${value}`);
  };

  // Load settings from localStorage on component mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('maxAISettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.warn('Failed to load Max AI settings:', error);
      }
    }
  }, []);

  const demoInsights = [
    {
      icon: TrendingUp,
      title: "Production Efficiency",
      value: "94.2%",
      trend: "+2.3%",
      color: "text-green-600"
    },
    {
      icon: AlertTriangle,
      title: "Schedule Conflicts",
      value: "3 alerts",
      trend: "-1 from yesterday",
      color: "text-orange-600"
    },
    {
      icon: Lightbulb,
      title: "AI Recommendations",
      value: "5 new",
      trend: "Ready to review",
      color: "text-blue-600"
    }
  ];

  return (
    <Card className={`border-2 transition-all duration-300 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Max AI Assistant</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your intelligent manufacturing companion
              </p>
            </div>
          </div>
          <Badge variant={isMaxOpen ? "default" : "secondary"} className="ml-2">
            {isMaxOpen ? "Active" : "Ready"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Capabilities */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span>Natural Language</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mic className="w-4 h-4 text-green-500" />
            <span>Voice Commands</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Smart Analysis</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Volume2 className="w-4 h-4 text-orange-500" />
            <span>Audio Responses</span>
          </div>
        </div>

        {/* Demo Section */}
        {showDemo && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Live Demo</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartDemo}
                  disabled={demoState === 'running'}
                >
                  {demoState === 'running' ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Start Demo
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDemoState('idle')}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Demo Insights */}
            {demoState !== 'idle' && (
              <div className="space-y-2">
                {demoInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg bg-white/50 border animate-pulse ${
                      demoState === 'running' ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <insight.icon className={`w-4 h-4 ${insight.color}`} />
                      <span className="text-xs font-medium">{insight.title}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold">{insight.value}</div>
                      <div className="text-xs text-muted-foreground">{insight.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleOpenMax}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isMaxOpen ? "Focus Max" : "Open Max"}
          </Button>
          
          {/* Settings Dialog */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Max AI Settings
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Voice & Audio Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Voice & Audio</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="voice-enabled" className="text-sm font-normal">
                      Enable Voice Commands
                    </Label>
                    <Switch
                      id="voice-enabled"
                      checked={settings.voiceEnabled}
                      onCheckedChange={(checked) => handleSettingsChange('voiceEnabled', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Response Volume</Label>
                    <input
                      type="range"
                      value={settings.responseVolume[0]}
                      onChange={(e) => handleSettingsChange('responseVolume', [parseInt(e.target.value)])}
                      max={100}
                      min={0}
                      step={10}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${settings.responseVolume[0]}%, #e5e7eb ${settings.responseVolume[0]}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="text-xs text-gray-500 text-center">
                      {settings.responseVolume[0]}%
                    </div>
                  </div>
                </div>

                {/* Behavior Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Behavior</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-respond" className="text-sm font-normal">
                      Auto-respond to Questions
                    </Label>
                    <Switch
                      id="auto-respond"
                      checked={settings.autoRespond}
                      onCheckedChange={(checked) => handleSettingsChange('autoRespond', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="proactive-insights" className="text-sm font-normal">
                      Proactive Insights
                    </Label>
                    <Switch
                      id="proactive-insights"
                      checked={settings.proactiveInsights}
                      onCheckedChange={(checked) => handleSettingsChange('proactiveInsights', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="learning-mode" className="text-sm font-normal">
                      Learning Mode
                    </Label>
                    <Switch
                      id="learning-mode"
                      checked={settings.learningMode}
                      onCheckedChange={(checked) => handleSettingsChange('learningMode', checked)}
                    />
                  </div>
                </div>

                {/* Performance Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Performance</h4>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Response Speed</Label>
                    <Select 
                      value={settings.responseSpeed} 
                      onValueChange={(value) => handleSettingsChange('responseSpeed', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Fast (Less detailed)</SelectItem>
                        <SelectItem value="medium">Balanced</SelectItem>
                        <SelectItem value="slow">Thorough (More detailed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Analysis Depth</Label>
                    <Select 
                      value={settings.analysisDepth} 
                      onValueChange={(value) => handleSettingsChange('analysisDepth', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surface">Surface Level</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="deep">Deep Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Notifications</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications" className="text-sm font-normal">
                      Enable Notifications
                    </Label>
                    <Switch
                      id="notifications"
                      checked={settings.notificationsEnabled}
                      onCheckedChange={(checked) => handleSettingsChange('notificationsEnabled', checked)}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs border-t pt-3">
          <div>
            <div className="font-bold text-green-600">127</div>
            <div className="text-muted-foreground">Commands</div>
          </div>
          <div>
            <div className="font-bold text-blue-600">98.5%</div>
            <div className="text-muted-foreground">Accuracy</div>
          </div>
          <div>
            <div className="font-bold text-purple-600">24/7</div>
            <div className="text-muted-foreground">Available</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MaxAICard;