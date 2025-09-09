import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, Calendar, Factory, Shield, TrendingUp, Package, 
  Layers, Target, Wrench, Truck, User, DollarSign, Monitor
} from 'lucide-react';
import { useAgent } from '@/contexts/AgentContext';
import { Agent } from '@/types/agents';

const AGENT_ICONS = {
  Sparkles, Calendar, Factory, Shield, TrendingUp, Package,
  Layers, Target, Wrench, Truck, User, DollarSign, Monitor
};

interface AgentSelectorProps {
  onAgentSelect?: (agentId: string) => void;
  compact?: boolean;
}

export function AgentSelector({ onAgentSelect, compact = false }: AgentSelectorProps) {
  const { currentAgent, availableAgents, allAgents, switchToAgent } = useAgent();

  const handleAgentSelect = (agentId: string) => {
    switchToAgent(agentId);
    onAgentSelect?.(agentId);
  };

  const getAgentIcon = (iconName: string) => {
    const Icon = AGENT_ICONS[iconName as keyof typeof AGENT_ICONS] || Sparkles;
    return Icon;
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'idle': return 'bg-gray-400';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getDepartmentLabel = (department: string) => {
    const labels = {
      orchestration: 'System',
      operations: 'Operations',
      planning: 'Planning',
      support: 'Support'
    };
    return labels[department as keyof typeof labels] || department;
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 p-2">
        {availableAgents.map((agent) => {
          const Icon = getAgentIcon(agent.icon);
          const isActive = currentAgent.id === agent.id;
          
          return (
            <Button
              key={agent.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleAgentSelect(agent.id)}
              className="flex items-center gap-2"
              style={isActive ? { backgroundColor: agent.color, borderColor: agent.color } : {}}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{agent.displayName}</span>
            </Button>
          );
        })}
      </div>
    );
  }

  const groupedAgents = allAgents.reduce((acc, agent) => {
    if (!acc[agent.department]) {
      acc[agent.department] = [];
    }
    acc[agent.department].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">AI Agent Team</h3>
          <p className="text-sm text-muted-foreground">
            Specialized agents for manufacturing optimization
          </p>
        </div>

        {Object.entries(groupedAgents).map(([department, agents]) => (
          <div key={department} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {getDepartmentLabel(department)}
            </h4>
            
            <div className="space-y-2">
              {agents.map((agent) => {
                const Icon = getAgentIcon(agent.icon);
                const isActive = currentAgent.id === agent.id;
                const isAvailable = agent.status === 'active';
                
                return (
                  <Card 
                    key={agent.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'ring-2 ring-offset-2' 
                        : 'hover:shadow-md'
                    } ${!isAvailable ? 'opacity-50' : ''}`}
                    style={isActive ? { 
                      ringColor: agent.color,
                      borderColor: agent.color 
                    } : {}}
                    onClick={() => isAvailable && handleAgentSelect(agent.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div 
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: `${agent.color}20` }}
                        >
                          <Icon 
                            className="w-5 h-5" 
                            style={{ color: agent.color }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium truncate">
                              {agent.displayName}
                            </h5>
                            <div className="flex items-center gap-1">
                              <div 
                                className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}
                              />
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                              >
                                {agent.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {agent.description}
                          </p>
                          
                          {agent.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {agent.specialties.slice(0, 2).map((specialty, index) => (
                                <Badge 
                                  key={index}
                                  variant="outline" 
                                  className="text-xs px-1.5 py-0.5"
                                  style={{ 
                                    borderColor: `${agent.color}40`,
                                    color: agent.color
                                  }}
                                >
                                  {specialty}
                                </Badge>
                              ))}
                              {agent.specialties.length > 2 && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                  +{agent.specialties.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}