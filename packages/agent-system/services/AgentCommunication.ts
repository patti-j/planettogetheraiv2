// Agent Communication Implementation
import type { AgentCommunication, AgentMessage } from '../types';

export class AgentCommunicationImpl implements AgentCommunication {
  private messages: AgentMessage[] = [];
  private listeners: Set<(messages: AgentMessage[]) => void> = new Set();

  async sendMessage(agentId: string, message: string): Promise<string> {
    // Add user message
    this.addMessage({
      agentId: 'user',
      type: 'user',
      content: message,
      context: {
        page: window.location.pathname,
        targetAgent: agentId
      }
    });

    // Simulate agent processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate agent response (in real implementation, this would call AI services)
    const response = await this.generateAgentResponse(agentId, message);

    // Add agent response message
    this.addMessage({
      agentId,
      type: 'agent',
      content: response,
      context: {
        page: window.location.pathname,
        userRequest: message
      }
    });

    return response;
  }

  addMessage(messageData: Omit<AgentMessage, 'id' | 'timestamp'>): void {
    const message: AgentMessage = {
      ...messageData,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.messages.push(message);
    this.notifyListeners();
  }

  getMessages(): AgentMessage[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
    this.notifyListeners();
  }

  subscribeToMessages(callback: (messages: AgentMessage[]) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current messages
    callback(this.getMessages());
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const currentMessages = this.getMessages();
    this.listeners.forEach(callback => {
      try {
        callback(currentMessages);
      } catch (error) {
        console.error('Agent communication listener error:', error);
      }
    });
  }

  private async generateAgentResponse(agentId: string, userMessage: string): Promise<string> {
    // Simple response generation based on agent type and message content
    const lowerMessage = userMessage.toLowerCase();

    switch (agentId) {
      case 'max':
        if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
          return "I'm here to help! I can coordinate with other agents, analyze system-wide performance, or provide strategic insights. What would you like me to focus on?";
        }
        if (lowerMessage.includes('agent') || lowerMessage.includes('coordinate')) {
          return "I can coordinate with Production Scheduling, Shop Floor, Quality Management, and other agents. Which agents would you like me to work with?";
        }
        if (lowerMessage.includes('performance') || lowerMessage.includes('kpi')) {
          return "Let me analyze the current system performance... Overall efficiency is at 89%, quality at 96%, and all key metrics are trending positively.";
        }
        return "As your system coordinator, I can help with agent orchestration, strategic analysis, and cross-functional insights. How can I assist you today?";

      case 'production_scheduling':
        if (lowerMessage.includes('schedule') || lowerMessage.includes('optimize')) {
          return "I'm analyzing your current production schedule... I found opportunities to improve efficiency by 7% through better resource allocation. Would you like me to show the optimization recommendations?";
        }
        if (lowerMessage.includes('bottleneck') || lowerMessage.includes('delay')) {
          return "I've identified a bottleneck in the packaging line that's reducing throughput by 8%. I can suggest several solutions including workload redistribution and capacity adjustments.";
        }
        if (lowerMessage.includes('resource') || lowerMessage.includes('capacity')) {
          return "Current resource utilization is at 89% capacity. I can optimize resource allocation and suggest capacity improvements to reduce bottlenecks.";
        }
        return "I can help optimize your production schedule, analyze bottlenecks, and improve resource allocation. What specific scheduling challenge can I help with?";

      case 'shop_floor':
        if (lowerMessage.includes('status') || lowerMessage.includes('monitor')) {
          return "Current shop floor status: All production lines operational, equipment uptime at 97%, and no active alerts. Line 3 mixer showing slight vibration increase - recommending preventive maintenance.";
        }
        if (lowerMessage.includes('equipment') || lowerMessage.includes('machine')) {
          return "Equipment monitoring shows all systems operating normally. I detected elevated vibration on Line 3 mixer - this could indicate bearing wear. Shall I create a maintenance work order?";
        }
        if (lowerMessage.includes('alert') || lowerMessage.includes('problem')) {
          return "I'm monitoring for any shop floor events. Currently, all systems are stable with no critical alerts. I can help you respond to any operational issues as they arise.";
        }
        return "I'm monitoring real-time shop floor operations. I can help with equipment status, operator assistance, and event response. What operational area needs attention?";

      case 'quality_management':
        if (lowerMessage.includes('quality') || lowerMessage.includes('inspection')) {
          return "Quality metrics are excellent: First-pass yield at 98.2%, zero customer complaints this week, and all SPC charts show stable processes. Inspection efficiency can be improved by moving to statistical sampling.";
        }
        if (lowerMessage.includes('defect') || lowerMessage.includes('problem')) {
          return "Defect analysis shows significant improvement: defect rates down 35% this month. The main contributing factors are improved process control and enhanced operator training.";
        }
        if (lowerMessage.includes('compliance') || lowerMessage.includes('standard')) {
          return "All compliance metrics are within specification. Current quality standards are being met consistently, and regulatory requirements are up to date.";
        }
        return "I manage quality control and compliance. Current quality performance is excellent at 98.2% first-pass yield. How can I help with your quality initiatives?";

      default:
        return `I'm the ${agentId} agent. I'm currently in development mode, but I'll have full capabilities soon. Is there anything specific you'd like to know about my planned functionality?`;
    }
  }

  // Initialize with welcome message
  initializeWithWelcome(agentId: string, welcomeMessage: string): void {
    if (this.messages.length === 0) {
      this.addMessage({
        agentId,
        type: 'system',
        content: welcomeMessage,
        context: {
          page: window.location.pathname,
          type: 'welcome'
        }
      });
    }
  }
}

// Singleton instance
export const agentCommunication = new AgentCommunicationImpl();