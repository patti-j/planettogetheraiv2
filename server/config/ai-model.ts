// Centralized AI Model Configuration
// This file defines the single AI model used throughout the system

export const AI_MODEL_CONFIG = {
  // The primary model used for all AI operations
  model: 'gpt-4o',
  
  // Model display name for UI
  displayName: 'GPT-4o',
  
  // Model description
  description: 'OpenAI\'s most capable model with enhanced speed and capabilities',
  
  // Temperature settings for different use cases
  temperatures: {
    creative: 0.7,      // For creative tasks
    balanced: 0.5,      // For general use
    accurate: 0.3,      // For accuracy-focused tasks (reduced from 0.7 to prevent hallucinations)
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
    vision: false
  }
};

// Export the default model for easy access
export const DEFAULT_MODEL = AI_MODEL_CONFIG.model;
export const DEFAULT_TEMPERATURE = AI_MODEL_CONFIG.temperatures.accurate;