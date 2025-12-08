import OpenAI from 'openai';
import { DEFAULT_MODEL, AI_MODEL_CONFIG } from '../config/ai-model';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Re-export for convenience
export { DEFAULT_MODEL, AI_MODEL_CONFIG };