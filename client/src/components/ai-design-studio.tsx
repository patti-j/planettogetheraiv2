import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeviceType } from '@/hooks/useDeviceType';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Edit3, 
  Trash2,
  Layout,
  Component,
  BarChart3,
  Settings,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

interface AIDesignStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AIDesignRequest {
  action: 'create' | 'modify' | 'remove';
  targetType: 'page' | 'widget' | 'dashboard' | 'menu';
  description: string;
  context?: string;
}

interface AIDesignResponse {
  success: boolean;
  action: string;
  result: any;
  suggestions?: string[];
  preview?: any;
}

export default function AIDesignStudio({ open, onOpenChange }: AIDesignStudioProps) {
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'preview' | 'complete'>('input');
  const [request, setRequest] = useState<AIDesignRequest>({
    action: 'create',
    targetType: 'page',
    description: '',
    context: ''
  });
  const [aiResponse, setAiResponse] = useState<AIDesignResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  // AI Design mutation
  const aiDesignMutation = useMutation({
    mutationFn: async (designRequest: AIDesignRequest) => {
      const response = await fetch('/api/ai-design-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(designRequest)
      });
      if (!response.ok) throw new Error('Failed to process AI design request');
      return response.json();
    },
    onSuccess: (data) => {
      setAiResponse(data);
      setCurrentStep('preview');
      setIsProcessing(false);
    },
    onError: (error) => {
      toast({ 
        title: "AI Design Error", 
        description: "Failed to process your design request. Please try again.", 
        variant: "destructive" 
      });
      setIsProcessing(false);
      setCurrentStep('input');
    }
  });

  const handleSubmitRequest = () => {
    if (!request.description.trim()) {
      toast({ 
        title: "Missing Description", 
        description: "Please describe what you want to create, modify, or remove.", 
        variant: "destructive" 
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    aiDesignMutation.mutate(request);
  };

  const handleApplyChanges = async () => {
    if (!aiResponse) return;

    try {
      // Apply the AI-generated changes
      if (request.action === 'create') {
        if (request.targetType === 'page') {
          const response = await fetch('/api/pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiResponse.result)
          });
          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
          }
        } else if (request.targetType === 'widget') {
          const response = await fetch('/api/mobile/widgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiResponse.result)
          });
          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: ['/api/mobile/widgets'] });
          }
        } else if (request.targetType === 'dashboard') {
          const response = await fetch('/api/mobile/dashboards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiResponse.result)
          });
          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: ['/api/mobile/dashboards'] });
          }
        }
      }

      setCurrentStep('complete');
      toast({ 
        title: "Success", 
        description: `AI has successfully ${request.action}d your ${request.targetType}!` 
      });

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 2000);

    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to apply AI-generated changes.", 
        variant: "destructive" 
      });
    }
  };

  const resetForm = () => {
    setCurrentStep('input');
    setRequest({
      action: 'create',
      targetType: 'page',
      description: '',
      context: ''
    });
    setAiResponse(null);
    setIsProcessing(false);
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="action">Action</Label>
          <Select value={request.action} onValueChange={(value: any) => setRequest({...request, action: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New
                </div>
              </SelectItem>
              <SelectItem value="modify">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Modify Existing
                </div>
              </SelectItem>
              <SelectItem value="remove">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Remove
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="targetType">Target Type</Label>
          <Select value={request.targetType} onValueChange={(value: any) => setRequest({...request, targetType: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Page
                </div>
              </SelectItem>
              <SelectItem value="widget">
                <div className="flex items-center gap-2">
                  <Component className="w-4 h-4" />
                  Widget
                </div>
              </SelectItem>
              <SelectItem value="dashboard">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </div>
              </SelectItem>
              <SelectItem value="menu">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Menu
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder={`Describe what you want to ${request.action} in detail. For example: "Create a production dashboard with real-time metrics and alerts" or "Modify the inventory widget to show more detailed stock levels"`}
          value={request.description}
          onChange={(e) => setRequest({...request, description: e.target.value})}
          rows={4}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="context">Additional Context (Optional)</Label>
        <Textarea
          id="context"
          placeholder="Any additional context, requirements, or constraints..."
          value={request.context || ''}
          onChange={(e) => setRequest({...request, context: e.target.value})}
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">AI Design Tips</p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>• Be specific about functionality and appearance</li>
              <li>• Mention target platform (mobile, desktop, or both)</li>
              <li>• Include data sources and metrics if relevant</li>
              <li>• Specify color schemes or branding preferences</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative">
        <Bot className="w-16 h-16 text-purple-600" />
        <Sparkles className="w-6 h-6 absolute -top-1 -right-1 text-yellow-500 animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">AI is designing your {request.targetType}...</p>
        <p className="text-sm text-muted-foreground">This may take a moment</p>
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-medium">AI Design Complete!</p>
          <p className="text-sm text-muted-foreground">Review the generated design below</p>
        </div>
      </div>

      {aiResponse && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generated {request.targetType}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {aiResponse.result?.title || aiResponse.result?.name || 'Untitled'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {aiResponse.result?.description || 'No description provided'}
                  </p>
                </div>
                {aiResponse.result?.configuration && (
                  <div>
                    <Label className="text-sm font-medium">Configuration</Label>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                      {JSON.stringify(aiResponse.result.configuration, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiResponse.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <CheckCircle className="w-16 h-16 text-green-600" />
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">Design Applied Successfully!</p>
        <p className="text-sm text-muted-foreground">
          Your {request.targetType} has been {request.action}d and is now available in the system.
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`
        ${isMobile ? 'max-w-[95vw] max-h-[90vh] w-[95vw] h-[90vh]' : 'max-w-4xl max-h-[85vh]'} 
        overflow-hidden flex flex-col
      `}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-6 h-6 text-purple-600" />
                <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                AI Design Assistant
              </span>
            </div>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Use artificial intelligence to create, modify, or remove pages, widgets, dashboards, and menus
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            {currentStep === 'input' && renderInputStep()}
            {currentStep === 'processing' && renderProcessingStep()}
            {currentStep === 'preview' && renderPreviewStep()}
            {currentStep === 'complete' && renderCompleteStep()}
          </ScrollArea>

          <div className="flex-shrink-0 border-t p-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep === 'preview') {
                    setCurrentStep('input');
                  } else {
                    onOpenChange(false);
                    resetForm();
                  }
                }}
                disabled={isProcessing}
              >
                {currentStep === 'preview' ? 'Edit Request' : 'Cancel'}
              </Button>

              <div className="flex gap-2">
                {currentStep === 'input' && (
                  <Button
                    onClick={handleSubmitRequest}
                    disabled={!request.description.trim() || isProcessing}
                    className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Generate Design
                  </Button>
                )}
                
                {currentStep === 'preview' && (
                  <Button
                    onClick={handleApplyChanges}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply Changes
                  </Button>
                )}

                {currentStep === 'complete' && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      resetForm();
                    }}
                    className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700"
                  >
                    Create Another
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}