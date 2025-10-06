import React, { createContext, useContext, useState, useEffect } from 'react';
import { Agent, AgentMessage, AgentAnalysis, AgentCoordination } from '@/types/agents';
// Temporarily revert to original agent management while federation is in development
import { getAgentById, getActiveAgents, ALL_AGENTS } from '@/config/agents';
import { useLocation } from 'wouter';

interface AgentContextType {
  // Current agent state
  currentAgent: Agent;
  availableAgents: Agent[];
  allAgents: Agent[];
  
  // Agent switching
  switchToAgent: (agentId: string) => void;
  
  // Message management
  messages: AgentMessage[];
  addMessage: (message: Omit<AgentMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  
  // Agent coordination
  activeCoordination?: AgentCoordination;
  requestCoordination: (coordination: AgentCoordination) => void;
  
  // Agent analysis and insights
  currentAnalysis?: AgentAnalysis;
  setCurrentAnalysis: (analysis: AgentAnalysis) => void;
  
  // Agent status management
  updateAgentStatus: (agentId: string, status: Agent['status']) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [currentAgent, setCurrentAgent] = useState<Agent>(() => {
    // Default to Max agent
    return getAgentById('max') || ALL_AGENTS[0];
  });
  
  const [availableAgents, setAvailableAgents] = useState<Agent[]>(() => getActiveAgents());
  const [allAgents, setAllAgents] = useState<Agent[]>(ALL_AGENTS);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeCoordination, setActiveCoordination] = useState<AgentCoordination>();
  const [currentAnalysis, setCurrentAnalysis] = useState<AgentAnalysis>();
  
  // Auto-select agent based on current page
  useEffect(() => {
    const pageToAgentMap: Record<string, string> = {
      '/production-schedule': 'production_scheduling',
      '/production-scheduler': 'production_scheduling',
      '/shop-floor-control': 'shop_floor',
      '/quality-control': 'quality_analysis',
      '/quality-management': 'quality_analysis',
      '/predictive-maintenance': 'predictive_maintenance',
      '/maintenance': 'predictive_maintenance'
    };
    
    const agentId = pageToAgentMap[location];
    console.log('🤖 Agent Auto-Select:', { location, agentId, currentAgent: currentAgent.id });
    
    if (agentId && currentAgent.id !== agentId) {
      const agent = getAgentById(agentId);
      if (agent && agent.status === 'active') {
        console.log('✅ Switching to agent:', agent.displayName);
        setCurrentAgent(agent);
        
        // Add welcome message when auto-switching
        const welcomeMessage: AgentMessage = {
          id: `autoswitch_${Date.now()}`,
          agentId: agent.id,
          type: 'agent',
          content: getAgentWelcomeMessage(agent),
          timestamp: new Date(),
          context: {
            page: location
          }
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [location, currentAgent.id]);
  
  // Initialize with welcome message from current agent
  useEffect(() => {
    if (messages.length === 0 && currentAgent) {
      const welcomeMessage: AgentMessage = {
        id: `welcome_${Date.now()}`,
        agentId: currentAgent.id,
        type: 'agent',
        content: getAgentWelcomeMessage(currentAgent),
        timestamp: new Date(),
        context: {
          page: window.location.pathname
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [currentAgent.id]);

  const switchToAgent = (agentId: string) => {
    const agent = getAgentById(agentId);
    if (agent && agent.status === 'active') {
      setCurrentAgent(agent);
      
      // Add transition message
      const transitionMessage: AgentMessage = {
        id: `transition_${Date.now()}`,
        agentId: agent.id,
        type: 'system',
        content: `Switched to ${agent.displayName}. ${getAgentWelcomeMessage(agent)}`,
        timestamp: new Date(),
        context: {
          page: window.location.pathname
        }
      };
      
      setMessages(prev => [...prev, transitionMessage]);
    }
  };

  const addMessage = (messageData: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const message: AgentMessage = {
      ...messageData,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
    // Re-add welcome message
    const welcomeMessage: AgentMessage = {
      id: `welcome_${Date.now()}`,
      agentId: currentAgent.id,
      type: 'agent',
      content: getAgentWelcomeMessage(currentAgent),
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const requestCoordination = (coordination: AgentCoordination) => {
    setActiveCoordination(coordination);
    
    // Add coordination message
    const coordinationMessage: AgentMessage = {
      id: `coord_${Date.now()}`,
      agentId: 'max',
      type: 'system',
      content: `Coordinating with ${coordination.collaboratingAgents.join(', ')} for optimal results...`,
      timestamp: new Date(),
    };
    addMessage(coordinationMessage);
  };

  const updateAgentStatus = (agentId: string, status: Agent['status']) => {
    setAllAgents(prev => 
      prev.map(agent => 
        agent.id === agentId ? { ...agent, status } : agent
      )
    );
    
    // Update available agents list
    setAvailableAgents(getActiveAgents());
  };

  const value: AgentContextType = {
    currentAgent,
    availableAgents,
    allAgents,
    switchToAgent,
    messages,
    addMessage,
    clearMessages,
    activeCoordination,
    requestCoordination,
    currentAnalysis,
    setCurrentAnalysis,
    updateAgentStatus
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}

// Helper function to generate agent-specific welcome messages
function getAgentWelcomeMessage(agent: Agent): string {
  const messages = {
    max: `Hello! I'm Max, your manufacturing AI orchestrator. I coordinate with specialized agents across your manufacturing operations:\n\n🏭 **Production Scheduling** - Schedule optimization & bottleneck management\n🏪 **Shop Floor** - Real-time operations & event response\n🛡️ **Quality Management** - Quality control & compliance monitoring\n\nI can help you with cross-functional analysis, strategic insights, and coordinating multiple agents for complex scenarios. What would you like to optimize today?`,
    
    production_scheduling: `Hi! I'm your Production Scheduling Agent. I specialize in:\n\n📅 **Schedule Optimization** - ASAP/ALAP algorithms, constraint management\n🔍 **Bottleneck Analysis** - Identify and resolve production constraints\n⚡ **Resource Allocation** - Optimize equipment and workforce utilization\n📊 **Bryntum Scheduler** - Features, configuration, and optimization techniques\n📚 **PlanetTogether Knowledge** - Finite capacity, pegging, what-if scenarios, and advanced scheduling\n⚙️ **APS Best Practices** - Industry standards and proven scheduling methodologies\n\nI analyze your PT job operations, resources, and constraints to create optimal production schedules. How can I improve your production planning?`,
    
    shop_floor: `Hello! I'm your Shop Floor Agent, monitoring real-time operations. I provide:\n\n⚡ **Real-time Monitoring** - Live equipment status and production tracking\n🚨 **Event Response** - Immediate analysis of shop floor events and issues\n👷 **Operator Support** - Guidance and decision support for shop floor teams\n📈 **Performance Insights** - Live OEE, throughput, and efficiency metrics\n\nI'm connected to your production data and can respond to events as they happen. What's the current status you'd like me to analyze?`,
    
    quality_management: `Greetings! I'm your Quality Management Agent, ensuring excellence across operations:\n\n🛡️ **Quality Control** - Monitor quality metrics and identify issues\n📋 **Compliance Tracking** - Ensure adherence to standards and regulations\n🔍 **Defect Analysis** - Root cause analysis and corrective actions\n📊 **SPC Monitoring** - Statistical process control and trend analysis\n\nI help maintain product quality, regulatory compliance, and continuous improvement. What quality aspects would you like me to review?`
  };
  
  return messages[agent.id as keyof typeof messages] || `Hello! I'm ${agent.displayName}. ${agent.description}`;
}