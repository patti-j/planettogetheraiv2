import OpenAI from 'openai';
import { ExternalUser, ExternalCompany } from '../shared/schema';
import { DatabaseStorage } from '../../server/storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const storage = new DatabaseStorage();

export class PortalAIAssistant {
  private systemPrompt = `You are Max, an AI assistant for the PlanetTogether External Partners Portal. 
You help suppliers, customers, and OEM partners navigate the portal, complete tasks, and optimize their interactions.

Key capabilities:
- Natural language understanding and task execution
- Document extraction and processing
- Predictive analytics and recommendations
- Workflow automation suggestions
- Multi-language support

Always be helpful, proactive, and focused on making tasks easier for users.`;

  // Main conversation handler
  async chat(
    message: string, 
    user: ExternalUser, 
    company: ExternalCompany,
    context?: any
  ): Promise<string> {
    try {
      // Build context-aware prompt
      const contextPrompt = this.buildContextPrompt(user, company, context);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'system', content: contextPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = response.choices[0].message.content || 'I apologize, I couldn\'t process that request.';

      // Log interaction
      await this.logInteraction(user.id, company.id, message, aiResponse);

      return aiResponse;
    } catch (error) {
      console.error('AI chat error:', error);
      return 'I\'m having trouble processing your request. Please try again or contact support.';
    }
  }

  // Onboarding conversation
  async onboardingChat(
    message: string,
    companyId: string,
    step: string,
    history: any[]
  ): Promise<{
    response: string;
    suggestedActions?: any[];
    extractedData?: any;
    nextStep?: string;
  }> {
    try {
      const onboardingPrompt = `You are helping a new company complete their portal setup.
Current step: ${step}
Previous conversation: ${JSON.stringify(history)}

Guide them through:
1. Company information collection
2. Feature selection based on company type
3. Initial configuration
4. User setup
5. First task completion

Extract structured data from their responses and suggest next actions.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: onboardingPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        functions: [
          {
            name: 'extract_company_data',
            description: 'Extract company information from user input',
            parameters: {
              type: 'object',
              properties: {
                companyName: { type: 'string' },
                industry: { type: 'string' },
                size: { type: 'string' },
                primaryNeed: { type: 'string' },
              }
            }
          },
          {
            name: 'suggest_features',
            description: 'Suggest features based on company needs',
            parameters: {
              type: 'object',
              properties: {
                features: { type: 'array', items: { type: 'string' } },
                configuration: { type: 'object' }
              }
            }
          }
        ],
      });

      const aiResponse = response.choices[0].message;
      const functionCall = aiResponse.function_call;

      let extractedData = {};
      let suggestedActions = [];

      if (functionCall) {
        const args = JSON.parse(functionCall.arguments);
        if (functionCall.name === 'extract_company_data') {
          extractedData = args;
        } else if (functionCall.name === 'suggest_features') {
          suggestedActions = args.features;
        }
      }

      // Update onboarding progress
      await storage.updateOnboardingProgress({
        companyId,
        currentStep: step,
        extractedData,
        conversationHistory: [...history, { message, response: aiResponse.content }],
      });

      return {
        response: aiResponse.content || 'Let me help you with that.',
        extractedData,
        suggestedActions,
        nextStep: this.determineNextStep(step, extractedData),
      };
    } catch (error) {
      console.error('Onboarding chat error:', error);
      return {
        response: 'Let me help you set up your account. What\'s your company name?',
      };
    }
  }

  // Document intelligence
  async extractFromDocument(
    documentContent: string,
    documentType: string
  ): Promise<any> {
    try {
      const extractionPrompt = `Extract structured data from this ${documentType} document.
Return a JSON object with relevant fields.

Document content:
${documentContent}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a document extraction specialist.' },
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Document extraction error:', error);
      return null;
    }
  }

  // Predictive analytics
  async generatePrediction(
    companyId: string,
    predictionType: string,
    historicalData: any[]
  ): Promise<{
    prediction: any;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const predictionPrompt = `Based on the historical data, generate a ${predictionType} prediction.
Provide confidence level and reasoning.

Historical data:
${JSON.stringify(historicalData)}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a predictive analytics expert.' },
          { role: 'user', content: predictionPrompt }
        ],
        temperature: 0.5,
      });

      // Parse response and extract prediction details
      const content = response.choices[0].message.content || '';
      
      return {
        prediction: this.extractPrediction(content, predictionType),
        confidence: 0.85, // Would be calculated based on data quality
        reasoning: content,
      };
    } catch (error) {
      console.error('Prediction error:', error);
      return {
        prediction: null,
        confidence: 0,
        reasoning: 'Unable to generate prediction',
      };
    }
  }

  // Smart notifications
  async prioritizeNotifications(
    notifications: any[],
    userPreferences: any
  ): Promise<any[]> {
    try {
      const priorityPrompt = `Prioritize these notifications based on urgency and user preferences.
Return them in order of importance with priority scores.

Notifications: ${JSON.stringify(notifications)}
User preferences: ${JSON.stringify(userPreferences)}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You prioritize notifications intelligently.' },
          { role: 'user', content: priorityPrompt }
        ],
        temperature: 0.4,
      });

      // Parse and return prioritized list
      return this.parsePrioritizedList(response.choices[0].message.content || '');
    } catch (error) {
      console.error('Notification prioritization error:', error);
      return notifications; // Return unprioritized as fallback
    }
  }

  // Workflow automation suggestions
  async suggestAutomation(
    userActions: any[],
    companyType: string
  ): Promise<{
    pattern: string;
    suggestion: string;
    estimatedTimeSaved: number;
  }[]> {
    try {
      const automationPrompt = `Analyze these user actions and suggest workflow automations.
Company type: ${companyType}
Actions: ${JSON.stringify(userActions)}

Identify repetitive patterns and suggest automations with time savings estimates.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a workflow optimization expert.' },
          { role: 'user', content: automationPrompt }
        ],
        temperature: 0.6,
      });

      return this.parseAutomationSuggestions(response.choices[0].message.content || '');
    } catch (error) {
      console.error('Automation suggestion error:', error);
      return [];
    }
  }

  // Helper methods
  private buildContextPrompt(user: ExternalUser, company: ExternalCompany, context: any): string {
    return `User context:
- Company: ${company.name} (${company.type})
- User role: ${user.role}
- Current page: ${context?.currentPage || 'unknown'}
- Recent actions: ${JSON.stringify(context?.recentActions || [])}
- Language preference: ${user.preferredLanguage || 'en'}
- AI assistance level: ${user.aiAssistanceLevel || 'standard'}`;
  }

  private determineNextStep(currentStep: string, data: any): string {
    const steps = [
      'welcome',
      'company_info',
      'feature_selection',
      'user_setup',
      'initial_config',
      'first_task',
      'complete'
    ];

    const currentIndex = steps.indexOf(currentStep);
    return steps[Math.min(currentIndex + 1, steps.length - 1)];
  }

  private extractPrediction(content: string, type: string): any {
    // Extract prediction based on type
    // This would be more sophisticated in production
    return {
      value: 'Extracted prediction',
      timeframe: '30 days',
      factors: ['factor1', 'factor2'],
    };
  }

  private parsePrioritizedList(content: string): any[] {
    // Parse AI response into prioritized notification list
    // This would be more sophisticated in production
    return [];
  }

  private parseAutomationSuggestions(content: string): any[] {
    // Parse AI response into automation suggestions
    // This would be more sophisticated in production
    return [];
  }

  private async logInteraction(
    userId: string,
    companyId: string,
    message: string,
    response: string
  ): Promise<void> {
    try {
      await storage.logPortalActivity({
        userId,
        companyId,
        action: 'ai_interaction',
        details: { message, response },
        aiAssisted: true,
      });
    } catch (error) {
      console.error('Failed to log AI interaction:', error);
    }
  }
}