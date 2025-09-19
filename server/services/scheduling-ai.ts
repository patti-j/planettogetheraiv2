import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a Senior Production Scheduling Agent with deep expertise in advanced planning and scheduling (APS) systems, particularly PlanetTogether. You provide clear, actionable guidance on production scheduling challenges.

## Core Knowledge Areas

### PlanetTogether Concepts
- **Finite Capacity Scheduling**: Scheduling that respects actual resource capacity constraints
- **Infinite Capacity Planning**: Planning without resource constraints for rough capacity analysis
- **Forward Scheduling**: Starting from material availability date and scheduling forward
- **Backward Scheduling**: Starting from due date and scheduling backward to find start date
- **Bottleneck Resource**: Resource that limits overall throughput (drum in Theory of Constraints)
- **Setup Time**: Time required to prepare a resource between different operations
- **Changeover Matrix**: Defines sequence-dependent setup times between products
- **Pegging**: Linking demand to supply across multiple levels
- **What-if Scenarios**: Testing different scheduling strategies without affecting live schedule
- **Gantt Chart**: Visual representation of schedule with operations on timeline
- **Resource Utilization**: Percentage of available time a resource is productive

### Bryntum Scheduler Pro Features
- **Dependencies**: Relationships between tasks (FS, SS, SF, FF)
- **Resource Assignment**: Allocating resources to operations
- **Drag-and-Drop**: Interactive schedule manipulation
- **Critical Path**: Sequence of operations determining minimum completion time
- **Resource Histogram**: Visual representation of resource loading over time
- **Event Splitting**: Breaking operations across non-working time
- **Calendar Management**: Defining working/non-working time patterns

### Scheduling Best Practices
1. **Capacity Balancing**: Level-load resources to avoid peaks and valleys
2. **Setup Optimization**: Group similar products to minimize changeovers
3. **Pull vs Push**: Schedule based on actual demand vs forecast
4. **Buffer Management**: Strategic placement of time/inventory buffers
5. **Constraint Management**: Focus on bottleneck scheduling first
6. **Schedule Stability**: Balance optimization with execution stability
7. **KPI Monitoring**: Track on-time delivery, utilization, WIP levels

### Common Scheduling Challenges
- Late orders due to capacity constraints
- Excessive changeovers reducing productivity  
- Material shortages disrupting schedule
- Unplanned downtime and maintenance
- Demand variability and rush orders
- Long lead times and high WIP
- Resource conflicts and bottlenecks

### Integration Points
- ERP systems (SAP, Oracle, Microsoft Dynamics)
- MES (Manufacturing Execution Systems)
- Quality management systems
- Inventory and warehouse management
- Demand planning and forecasting
- Shop floor data collection

## Response Guidelines
1. Provide specific, actionable advice
2. Reference PlanetTogether features when applicable
3. Suggest KPIs to measure improvement
4. Consider both technical and organizational aspects
5. Explain scheduling concepts in business terms
6. Offer step-by-step guidance for complex tasks

Remember: Focus on practical solutions that can be implemented in real manufacturing environments. Balance ideal theory with operational reality.`;

interface SchedulingAIOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export class SchedulingAI {
  private readonly defaultOptions: SchedulingAIOptions = {
    maxTokens: 1500,
    temperature: 0.7,
    model: 'gpt-4o-2024-08-06'
  };

  async generateResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    options: SchedulingAIOptions = {}
  ): Promise<string> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[SchedulingAI] OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.');
    }
    
    // Build messages array with system prompt and history
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add conversation history (limit to last 10 messages to manage tokens)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ 
        role: msg.role as 'user' | 'assistant', 
        content: msg.content 
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    try {
      console.log('[SchedulingAI] Sending request to OpenAI API...');
      console.log('[SchedulingAI] Model:', finalOptions.model);
      console.log('[SchedulingAI] Message count:', messages.length);
      console.log('[SchedulingAI] User message length:', userMessage.length);
      
      const completion = await openai.chat.completions.create({
        model: finalOptions.model!,
        messages,
        max_tokens: finalOptions.maxTokens,
        temperature: finalOptions.temperature,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        console.error('[SchedulingAI] OpenAI returned empty response');
        throw new Error('OpenAI returned an empty response');
      }
      
      console.log('[SchedulingAI] Successfully generated response, length:', response.length);
      return response;
      
    } catch (error: any) {
      console.error('[SchedulingAI] OpenAI API error:', error);
      console.error('[SchedulingAI] Error type:', error?.constructor?.name);
      console.error('[SchedulingAI] Error message:', error?.message);
      console.error('[SchedulingAI] Error response:', error?.response?.data);
      
      // Handle specific OpenAI errors
      if (error?.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing settings.');
      }
      
      if (error?.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      
      if (error?.code === 'model_not_found') {
        throw new Error(`Model ${finalOptions.model} not found. Please use a valid model.`);
      }
      
      if (error?.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }
      
      if (error?.status === 500 || error?.status === 502 || error?.status === 503) {
        throw new Error('OpenAI API service is temporarily unavailable. Please try again later.');
      }
      
      // Generic error
      throw new Error(`Failed to generate AI response: ${error?.message || 'Unknown error'}`);
    }
  }

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      // Validate API key
      if (!process.env.OPENAI_API_KEY) {
        console.error('[SchedulingAI] OpenAI API key is not configured for title generation');
        return 'Scheduling Consultation';
      }
      
      console.log('[SchedulingAI] Generating conversation title...');
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Generate a brief, descriptive title (max 6 words) for this scheduling conversation based on the first message. Focus on the main topic or question.' 
          },
          { role: 'user', content: firstMessage }
        ],
        max_tokens: 20,
        temperature: 0.5,
      });

      const title = completion.choices[0]?.message?.content?.trim() || 'Scheduling Consultation';
      console.log('[SchedulingAI] Generated title:', title);
      return title;
      
    } catch (error: any) {
      console.error('[SchedulingAI] Error generating title:', error);
      console.error('[SchedulingAI] Title error details:', {
        message: error?.message,
        code: error?.code,
        status: error?.status
      });
      return 'Scheduling Consultation';
    }
  }
}

export const schedulingAI = new SchedulingAI();