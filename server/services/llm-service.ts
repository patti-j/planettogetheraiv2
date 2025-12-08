/**
 * LLM Service Abstraction Layer
 * 
 * Provides a unified interface for LLM providers (OpenAI, Ollama, custom)
 * Supports both cloud-based and local LLM deployments for data privacy
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { db } from '../db';
import { llmProviderConfig, llmUsageLogs, type LlmProviderConfig } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { DEFAULT_MODEL } from '../config/ai-model';

// ============================================
// Types & Interfaces
// ============================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
}

// Base interface that all providers must implement
interface LLMProvider {
  chat(request: LLMRequest): Promise<LLMResponse>;
  streamChat?(request: LLMRequest): AsyncGenerator<LLMStreamChunk, void, unknown>;
  isAvailable(): Promise<boolean>;
}

// ============================================
// OpenAI Provider Implementation
// ============================================

class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private config: LlmProviderConfig;

  constructor(config: LlmProviderConfig) {
    this.config = config;
    const apiKey = this.getApiKey();
    
    this.client = new OpenAI({
      apiKey: apiKey,
      timeout: (config.timeout || 30) * 1000,
    });
  }

  private getApiKey(): string {
    const configData = this.config.configuration as any;
    
    // Support env variable reference: "env:OPENAI_API_KEY"
    if (configData.apiKey?.startsWith('env:')) {
      const envVar = configData.apiKey.split(':')[1];
      return process.env[envVar] || '';
    }
    
    return configData.apiKey || process.env.OPENAI_API_KEY || '';
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || this.config.defaultModel || DEFAULT_MODEL;
    const temperature = request.temperature ?? parseFloat(this.config.temperature?.toString() || '0.7');
    const maxTokens = request.maxTokens || this.config.maxTokens || 4000;

    const messages: ChatCompletionMessageParam[] = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const completion = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const choice = completion.choices[0];
    
    return {
      content: choice.message.content || '',
      model: completion.model,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason || undefined,
    };
  }

  async *streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const model = request.model || this.config.defaultModel || DEFAULT_MODEL;
    const temperature = request.temperature ?? parseFloat(this.config.temperature?.toString() || '0.7');
    const maxTokens = request.maxTokens || this.config.maxTokens || 4000;

    const messages: ChatCompletionMessageParam[] = request.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const stream = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason !== null;
      
      yield { content, done };
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) return false;
      
      // Simple test call
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI provider unavailable:', error);
      return false;
    }
  }
}

// ============================================
// Ollama Provider Implementation (Local LLM)
// ============================================

class OllamaProvider implements LLMProvider {
  private config: LlmProviderConfig;
  private baseUrl: string;

  constructor(config: LlmProviderConfig) {
    this.config = config;
    const configData = config.configuration as any;
    this.baseUrl = configData.baseUrl || 'http://localhost:11434';
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || this.config.defaultModel || 'llama2';
    const temperature = request.temperature ?? parseFloat(this.config.temperature?.toString() || '0.7');

    // Format messages for Ollama
    const prompt = this.formatMessagesAsPrompt(request.messages);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.response || '',
      model: data.model || model,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      finishReason: data.done ? 'stop' : undefined,
    };
  }

  async *streamChat(request: LLMRequest): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const model = request.model || this.config.defaultModel || 'llama2';
    const temperature = request.temperature ?? parseFloat(this.config.temperature?.toString() || '0.7');

    const prompt = this.formatMessagesAsPrompt(request.messages);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama streaming request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          yield {
            content: data.response || '',
            done: data.done || false,
          };
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }
  }

  private formatMessagesAsPrompt(messages: LLMMessage[]): string {
    // Convert chat messages to a single prompt for Ollama
    return messages.map(msg => {
      if (msg.role === 'system') {
        return `System: ${msg.content}\n`;
      } else if (msg.role === 'user') {
        return `User: ${msg.content}\n`;
      } else {
        return `Assistant: ${msg.content}\n`;
      }
    }).join('\n');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Ollama provider unavailable:', error);
      return false;
    }
  }
}

// ============================================
// LLM Service (Main Interface)
// ============================================

export class LLMService {
  private static instance: LLMService;
  private providerCache: Map<number, LLMProvider> = new Map();

  private constructor() {}

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Get the active LLM provider configuration
   */
  async getActiveProvider(): Promise<LlmProviderConfig | null> {
    const providers = await db
      .select()
      .from(llmProviderConfig)
      .where(eq(llmProviderConfig.isActive, true))
      .orderBy(desc(llmProviderConfig.isDefault))
      .limit(1);

    return providers[0] || null;
  }

  /**
   * Create a provider instance based on configuration
   */
  private createProvider(config: LlmProviderConfig): LLMProvider {
    switch (config.providerType) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      default:
        throw new Error(`Unsupported provider type: ${config.providerType}`);
    }
  }

  /**
   * Get or create a cached provider instance
   */
  private async getProvider(config: LlmProviderConfig): Promise<LLMProvider> {
    if (!this.providerCache.has(config.id)) {
      const provider = this.createProvider(config);
      this.providerCache.set(config.id, provider);
    }
    return this.providerCache.get(config.id)!;
  }

  /**
   * Send a chat completion request using the active provider
   */
  async chat(request: LLMRequest, feature: string, userId?: number): Promise<LLMResponse> {
    const startTime = Date.now();
    const providerConfig = await this.getActiveProvider();
    
    if (!providerConfig) {
      throw new Error('No active LLM provider configured');
    }

    const provider = await this.getProvider(providerConfig);
    
    try {
      const response = await provider.chat(request);
      const responseTime = Date.now() - startTime;

      // Log usage
      await this.logUsage({
        providerId: providerConfig.id,
        feature,
        userId,
        model: response.model,
        promptTokens: response.usage?.promptTokens,
        completionTokens: response.usage?.completionTokens,
        totalTokens: response.usage?.totalTokens,
        responseTime,
        status: 'success',
      });

      // Update provider stats
      await this.updateProviderStats(providerConfig.id, response.usage?.totalTokens || 0);

      return response;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Log error
      await this.logUsage({
        providerId: providerConfig.id,
        feature,
        userId,
        responseTime,
        status: 'error',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Stream chat completion using the active provider
   */
  async *streamChat(request: LLMRequest, feature: string, userId?: number): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const providerConfig = await this.getActiveProvider();
    
    if (!providerConfig) {
      throw new Error('No active LLM provider configured');
    }

    const provider = await this.getProvider(providerConfig);
    
    if (!provider.streamChat) {
      throw new Error(`Provider ${providerConfig.providerType} does not support streaming`);
    }

    yield* provider.streamChat(request);
  }

  /**
   * Log LLM usage for auditing and analytics
   */
  private async logUsage(data: {
    providerId: number;
    feature: string;
    userId?: number;
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    responseTime: number;
    status: string;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await db.insert(llmUsageLogs).values({
        providerId: data.providerId,
        feature: data.feature,
        userId: data.userId || null,
        model: data.model || null,
        promptTokens: data.promptTokens || null,
        completionTokens: data.completionTokens || null,
        totalTokens: data.totalTokens || null,
        responseTimeMs: data.responseTime,
        status: data.status,
        errorMessage: data.errorMessage || null,
        promptSummary: `${data.feature} request`,
      });
    } catch (error) {
      console.error('Failed to log LLM usage:', error);
    }
  }

  /**
   * Update provider usage statistics
   */
  private async updateProviderStats(providerId: number, tokens: number): Promise<void> {
    try {
      // Get current values
      const [current] = await db
        .select()
        .from(llmProviderConfig)
        .where(eq(llmProviderConfig.id, providerId))
        .limit(1);
      
      if (current) {
        await db
          .update(llmProviderConfig)
          .set({
            totalRequests: (current.totalRequests || 0) + 1,
            totalTokens: (current.totalTokens || 0) + tokens,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(llmProviderConfig.id, providerId));
      }
    } catch (error) {
      console.error('Failed to update provider stats:', error);
    }
  }

  /**
   * Check if the active provider is available
   */
  async isAvailable(): Promise<boolean> {
    const providerConfig = await this.getActiveProvider();
    if (!providerConfig) return false;

    const provider = await this.getProvider(providerConfig);
    return provider.isAvailable();
  }

  /**
   * Clear provider cache (useful after configuration changes)
   */
  clearCache(): void {
    this.providerCache.clear();
  }
}

// Export singleton instance
export const llmService = LLMService.getInstance();
