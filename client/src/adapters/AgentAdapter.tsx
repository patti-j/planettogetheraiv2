// Agent Adapter - Wraps Agent System Module behind existing AgentContext API
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loadAgentSystemModule } from '@/lib/federation-access';
import type { Agent, AgentMessage, AgentAnalysis, AgentCoordination } from '@/types/agents';
// Import existing agent configuration as fallback from local source
import { ALL_AGENTS, getActiveAgents } from '@/config/agents';

interface AgentAdapterContextType {
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

const AgentAdapterContext = createContext<AgentAdapterContextType | undefined>(undefined);

export function AgentAdapterProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent>(() => {
    const maxAgent = ALL_AGENTS.find(a => a.id === 'max');
    return maxAgent || ALL_AGENTS[0];
  });
  
  const [availableAgents, setAvailableAgents] = useState<Agent[]>(() => getActiveAgents());
  const [allAgents, setAllAgents] = useState<Agent[]>(ALL_AGENTS);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeCoordination, setActiveCoordination] = useState<AgentCoordination>();
  const [currentAnalysis, setCurrentAnalysis] = useState<AgentAnalysis>();

  // Initialize federation system
  useEffect(() => {
    initializeFederation()
      .then(async () => {
        setIsInitialized(true);
        
        // Initialize with federated agent system if available
        try {
          const agentSystem = await getAgentSystemModule();
          const federatedAgents = await agentSystem.getAvailableAgents();
          const currentFederatedAgent = await agentSystem.getCurrentAgent();
          
          if (federatedAgents && federatedAgents.length > 0) {
            setAllAgents(federatedAgents);
            setAvailableAgents(federatedAgents.filter(agent => agent.status === 'active'));
          }
          
          if (currentFederatedAgent) {
            setCurrentAgent(currentFederatedAgent);
          }
        } catch (error) {
          console.warn('[AgentAdapter] Failed to initialize with federated agents, using fallback:', error);
        }
      })
      .catch(error => console.error('[AgentAdapter] Federation init failed:', error));
  }, []);

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

  const switchToAgent = async (agentId: string) => {
    try {
      // Try federated agent switching first
      if (isInitialized) {
        const agentSystem = await getAgentSystemModule();
        await agentSystem.switchToAgent(agentId);
        const newAgent = await agentSystem.getCurrentAgent();
        if (newAgent) {
          setCurrentAgent(newAgent);
          
          const transitionMessage: AgentMessage = {
            id: `transition_${Date.now()}`,
            agentId: newAgent.id,
            type: 'system',
            content: `Switched to ${newAgent.displayName}. ${getAgentWelcomeMessage(newAgent)}`,
            timestamp: new Date(),
            context: {
              page: window.location.pathname
            }
          };
          
          setMessages(prev => [...prev, transitionMessage]);
          return;
        }
      }
      
      // Fallback to local agent switching
      const agent = getAgentById(agentId);
      if (agent && agent.status === 'active') {
        setCurrentAgent(agent);
        
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
    } catch (error) {
      console.error('[AgentAdapter] Agent switching failed:', error);
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
    
    setAvailableAgents(getActiveAgents());
  };

  const value: AgentAdapterContextType = {
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
    <AgentAdapterContext.Provider value={value}>
      {children}
    </AgentAdapterContext.Provider>
  );
}

export function useAgentAdapter() {
  const context = useContext(AgentAdapterContext);
  if (context === undefined) {
    throw new Error('useAgentAdapter must be used within an AgentAdapterProvider');
  }
  return context;
}

// Helper function to generate agent-specific welcome messages
function getAgentWelcomeMessage(agent: any): string {
  const messages = {
    max: `Hello! I'm Max, your manufacturing AI orchestrator. I coordinate with specialized agents across your manufacturing operations:\n\n🏭 **Production Scheduling** - Schedule optimization & bottleneck management\n🏪 **Shop Floor** - Real-time operations & event response\n🛡️ **Quality Management** - Quality control & compliance monitoring\n\nI can help you with cross-functional analysis, strategic insights, and coordinating multiple agents for complex scenarios. What would you like to optimize today?`,
    
    production_scheduling: `Hi! I'm your Production Scheduling Agent. I specialize in:\n\n📅 **Schedule Optimization** - ASAP/ALAP algorithms, constraint management\n🔍 **Bottleneck Analysis** - Identify and resolve production constraints\n⚡ **Resource Allocation** - Optimize equipment and workforce utilization\n📊 **Performance Tracking** - Monitor schedule efficiency and on-time delivery\n\nI analyze your PT job operations, resources, and constraints to create optimal production schedules. How can I improve your production planning?`,
    
    shop_floor: `Hello! I'm your Shop Floor Agent, monitoring real-time operations. I provide:\n\n⚡ **Real-time Monitoring** - Live equipment status and production tracking\n🚨 **Event Response** - Immediate analysis of shop floor events and issues\n👷 **Operator Support** - Guidance and decision support for shop floor teams\n📈 **Performance Insights** - Live OEE, throughput, and efficiency metrics\n\nI'm connected to your production data and can respond to events as they happen. What's the current status you'd like me to analyze?`,
    
    quality_management: `Greetings! I'm your Quality Management Agent, ensuring excellence across operations:\n\n🛡️ **Quality Control** - Monitor quality metrics and identify issues\n📋 **Compliance Tracking** - Ensure adherence to standards and regulations\n🔍 **Defect Analysis** - Root cause analysis and corrective actions\n📊 **SPC Monitoring** - Statistical process control and trend analysis\n\nI help maintain product quality, regulatory compliance, and continuous improvement. What quality aspects would you like me to review?`
  };
  
  return messages[agent.id as keyof typeof messages] || `Hello! I'm ${agent.displayName}. ${agent.description}`;
}