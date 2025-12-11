// Centralized AI Model Configuration
// This file defines the single AI model used throughout the system
// Updated to GPT-5.1 (released November 13, 2025)

export const AI_MODEL_CONFIG = {
  // The primary model used for all AI operations
  model: 'gpt-4o',
  
  // Model display name for UI
  displayName: 'GPT-4o',
  
  // Model description
  description: 'OpenAI GPT-4o - fast, intelligent, multimodal',
  
  // Model variants for specific use cases
  variants: {
    main: 'gpt-5.1',                    // Primary model with adaptive reasoning
    chat: 'gpt-5.1-chat-latest',        // Fast conversational model
    codex: 'gpt-5.1-codex',             // Optimized for coding tasks
    codexMini: 'gpt-5.1-codex-mini',    // Lightweight coding variant
  },
  
  // Reasoning effort levels (new in GPT-5.1)
  // Controls how much "thinking time" the model uses
  reasoningEffort: {
    none: 'none',           // Fastest - no reasoning, 20% faster tool calling
    minimal: 'minimal',     // Very light reasoning
    low: 'low',             // Quick responses
    medium: 'medium',       // Balanced speed/intelligence (recommended default)
    high: 'high',           // More deliberate reasoning
  },
  
  // Temperature settings for different use cases
  temperatures: {
    creative: 0.7,      // For creative tasks
    balanced: 0.5,      // For general use
    accurate: 0.3,      // For accuracy-focused tasks
    deterministic: 0.1  // For highly consistent responses
  },
  
  // Token limits
  maxTokens: {
    default: 1500,
    extended: 2000,
    streaming: 1000,
    short: 500
  },
  
  // Model capabilities
  capabilities: {
    streaming: true,
    functionCalling: true,
    jsonMode: true,
    vision: true,
    adaptiveReasoning: true,    // New in GPT-5.1
    promptCaching: true,        // 24-hour cache retention available
  },
  
  // Prompt caching (new in GPT-5.1 - 90% cheaper cached tokens)
  promptCache: {
    enabled: true,
    retention: '24h',  // 24-hour cache retention
  }
};

// Export the default model for easy access
export const DEFAULT_MODEL = AI_MODEL_CONFIG.model;
export const DEFAULT_TEMPERATURE = AI_MODEL_CONFIG.temperatures.accurate;

// Realtime API configuration for voice-to-voice chat
export const REALTIME_MODEL_CONFIG = {
  // The model to use for real-time voice interactions
  model: 'gpt-realtime-mini', // 70% cheaper than gpt-realtime
  
  // Voice settings
  voice: 'nova', // Available voices: alloy, cedar, echo, nova, marin, shimmer
  
  // Temperature for voice responses
  temperature: 0.8,
  
  // Voice activity detection settings
  turnDetection: {
    type: 'server_vad' as const,
    threshold: 0.5,
    prefixPaddingMs: 300,
    silenceDurationMs: 500,
  },
  
  // Audio format settings
  audio: {
    input: {
      format: 'pcm16' as const,
      sampleRate: 24000,
    },
    output: {
      format: 'pcm16' as const,
      sampleRate: 24000,
    },
  },
  
  // Connection settings
  connection: {
    websocketUrl: 'wss://api.openai.com/v1/realtime',
    reconnectAttempts: 3,
    reconnectDelay: 1000,
  },
  
  // Pricing info (for reference)
  pricing: {
    inputPerMillion: 9.6,  // $9.60 per 1M input tokens (70% cheaper than gpt-realtime at $32)
    outputPerMillion: 19.2, // $19.20 per 1M output tokens (70% cheaper than gpt-realtime at $64)
  },
};