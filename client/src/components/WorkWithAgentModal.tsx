import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Bot, 
  Calendar,
  Package,
  Users,
  FileText,
  CheckCircle,
  Activity,
  AlertTriangle,
  Target,
  Clock
} from 'lucide-react';

interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidence: number;
  estimatedImpact: string;
  createdAt: string;
  aiAgent: string;
  situation?: string;
  analysis?: string;
  recommendedAction?: string;
  expectedImpact?: {
    temperature?: string;
    qualityRisk?: string;
    efficiency?: string;
  };
}

interface WorkWithAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: ActionRecommendation | null;
}

export function WorkWithAgentModal({ isOpen, onClose, recommendation }: WorkWithAgentModalProps) {
  const [isConnected, setIsConnected] = useState(true);

  if (!isOpen || !recommendation) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };


  const systemTools = [
    {
      icon: Calendar,
      title: 'Production Schedule',
      description: 'View current production timeline',
      color: 'text-blue-600'
    },
    {
      icon: Package,
      title: 'Inventory Status',
      description: 'Check stock levels and availability',
      color: 'text-green-600'
    },
    {
      icon: Users,
      title: 'Resource Allocation',
      description: 'View staff and equipment assignments',
      color: 'text-purple-600'
    },
    {
      icon: FileText,
      title: 'Work Orders',
      description: 'Review active work orders',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Dashboard</span>
            <span>/</span>
            <span>Production Scheduling</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100">Action Resolution</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <div className="text-right">
            <div className="text-sm font-medium">Resolving with Production Scheduling</div>
            <div className="text-xs text-gray-500">Production Agent</div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Action Details */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Action Details</h2>
            
            <div className="flex items-center gap-2 mb-4">
              <Badge className={`text-xs ${getPriorityColor(recommendation.priority)}`}>
                {recommendation.priority.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                pending
              </Badge>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">{recommendation.title}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Situation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {recommendation.situation || 
                   "Station 7 temperature sensor reading 185°F, approaching critical threshold of 200°F. This is causing reduced efficiency and potential quality risks."}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Analysis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {recommendation.analysis || 
                   "High temperatures can damage components and affect product quality. Immediate action prevents costly downtime and maintains production targets."}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Recommended Action</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {recommendation.recommendedAction || 
                   "Reduce line speed by 5% and activate secondary cooling system. Schedule maintenance for cooling unit during next planned downtime."}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Expected Impact</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                    <span>185°F → 165°F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Quality Risk:</span>
                    <span>Medium → Low</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Efficiency:</span>
                    <span>87% → 90%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Agent Conversation */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold">Discuss with Production Scheduling</h3>
              </div>
              {isConnected && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Connected
                </div>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Work together to resolve: {recommendation.title}
            </p>

            <div className="flex flex-col items-center justify-center flex-1 max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium mb-2">Ready to resolve this action</h4>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Start a conversation with Production Scheduling to work through the resolution
              </p>
            </div>
          </div>

        </div>

        {/* Right Panel - System Tools */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">System Tools</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Select a tool to help resolve this action:
            </p>

            <div className="space-y-3">
              {systemTools.map((tool, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`system-tool-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${tool.color}`}>
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{tool.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}