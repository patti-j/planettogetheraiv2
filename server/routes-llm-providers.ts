/**
 * LLM Provider Management Routes
 * 
 * API endpoints for configuring and managing LLM providers (OpenAI, Ollama, custom)
 */

import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { llmProviderConfig, llmUsageLogs, insertLlmProviderConfigSchema } from '@shared/schema';
import { requireAuth } from './enhanced-auth-middleware';
import { llmService } from './services/llm-service';

export const llmProviderRoutes = express.Router();

// Get all LLM providers
llmProviderRoutes.get('/api/llm-providers', requireAuth, async (req, res) => {
  try {
    const providers = await db.select().from(llmProviderConfig);
    
    // Don't expose API keys in the response
    const sanitized = providers.map(p => ({
      ...p,
      configuration: { ...p.configuration as any, apiKey: p.configuration && (p.configuration as any).apiKey ? '***' : undefined }
    }));
    
    res.json(sanitized);
  } catch (error: any) {
    console.error('Error fetching LLM providers:', error);
    res.status(500).json({ error: 'Failed to fetch LLM providers' });
  }
});

// Get active provider
llmProviderRoutes.get('/api/llm-providers/active', requireAuth, async (req, res) => {
  try {
    const provider = await llmService.getActiveProvider();
    if (!provider) {
      return res.status(404).json({ error: 'No active LLM provider configured' });
    }
    
    // Sanitize response
    const sanitized = {
      ...provider,
      configuration: { ...provider.configuration as any, apiKey: (provider.configuration as any)?.apiKey ? '***' : undefined }
    };
    
    res.json(sanitized);
  } catch (error: any) {
    console.error('Error fetching active provider:', error);
    res.status(500).json({ error: 'Failed to fetch active provider' });
  }
});

// Create new provider
llmProviderRoutes.post('/api/llm-providers', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    const validated = insertLlmProviderConfigSchema.parse({
      ...req.body,
      createdBy: userId,
      updatedBy: userId
    });
    
    // If this provider is being set as active, deactivate all others
    if (validated.isActive) {
      await db
        .update(llmProviderConfig)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(llmProviderConfig.isActive, true));
      
      // Clear cache after provider change
      llmService.clearCache();
    }
    
    const [provider] = await db
      .insert(llmProviderConfig)
      .values(validated)
      .returning();
    
    // Sanitize response - never return API keys
    const sanitized = {
      ...provider,
      configuration: { 
        ...(provider.configuration as any), 
        apiKey: (provider.configuration as any)?.apiKey ? '***' : undefined 
      }
    };
    
    res.status(201).json(sanitized);
  } catch (error: any) {
    console.error('Error creating LLM provider:', error);
    res.status(400).json({ error: error.message || 'Failed to create provider' });
  }
});

// Update provider
llmProviderRoutes.patch('/api/llm-providers/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1;
    const id = parseInt(req.params.id);
    
    // If activating this provider, deactivate all others
    if (req.body.isActive) {
      await db
        .update(llmProviderConfig)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(llmProviderConfig.isActive, true));
      
      // Clear cache after provider change
      llmService.clearCache();
    }
    
    const [provider] = await db
      .update(llmProviderConfig)
      .set({
        ...req.body,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(llmProviderConfig.id, id))
      .returning();
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Sanitize response - never return API keys
    const sanitized = {
      ...provider,
      configuration: { 
        ...(provider.configuration as any), 
        apiKey: (provider.configuration as any)?.apiKey ? '***' : undefined 
      }
    };
    
    res.json(sanitized);
  } catch (error: any) {
    console.error('Error updating LLM provider:', error);
    res.status(400).json({ error: error.message || 'Failed to update provider' });
  }
});

// Delete provider
llmProviderRoutes.delete('/api/llm-providers/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const [provider] = await db
      .select()
      .from(llmProviderConfig)
      .where(eq(llmProviderConfig.id, id))
      .limit(1);
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    // Don't allow deleting the active provider
    if (provider.isActive) {
      return res.status(400).json({ error: 'Cannot delete active provider. Activate another provider first.' });
    }
    
    await db
      .delete(llmProviderConfig)
      .where(eq(llmProviderConfig.id, id));
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting LLM provider:', error);
    res.status(500).json({ error: 'Failed to delete provider' });
  }
});

// Test provider connection
llmProviderRoutes.post('/api/llm-providers/:id/test', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Fetch the specific provider configuration
    const [provider] = await db
      .select()
      .from(llmProviderConfig)
      .where(eq(llmProviderConfig.id, id))
      .limit(1);
    
    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }
    
    // Test this specific provider (even if not active)
    // Create a temporary LLM service instance with this provider's config
    const { LlmService } = await import('./services/llm-service');
    const testService = new LlmService();
    
    // Temporarily override getActiveProvider to return the provider being tested
    const originalGetProvider = testService.getActiveProvider;
    testService.getActiveProvider = async () => provider;
    
    try {
      const isAvailable = await testService.isAvailable();
      
      if (isAvailable) {
        res.json({ success: true, message: `Provider "${provider.providerName}" is available and responding` });
      } else {
        res.status(503).json({ success: false, message: `Provider "${provider.providerName}" is not available` });
      }
    } finally {
      // Restore original method
      testService.getActiveProvider = originalGetProvider;
    }
  } catch (error: any) {
    console.error('Error testing provider:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get usage statistics
llmProviderRoutes.get('/api/llm-providers/usage/stats', requireAuth, async (req, res) => {
  try {
    const { providerId, feature, limit = 100 } = req.query;
    
    let query = db.select().from(llmUsageLogs);
    
    if (providerId) {
      query = query.where(eq(llmUsageLogs.providerId, parseInt(providerId as string))) as any;
    }
    
    const logs = await query.limit(parseInt(limit as string));
    
    // Calculate statistics
    const stats = {
      totalRequests: logs.length,
      successfulRequests: logs.filter(l => l.status === 'success').length,
      failedRequests: logs.filter(l => l.status === 'error').length,
      avgResponseTime: logs.reduce((sum, l) => sum + (l.responseTimeMs || 0), 0) / logs.length || 0,
      totalTokens: logs.reduce((sum, l) => sum + (l.totalTokens || 0), 0),
    };
    
    res.json({ stats, recentLogs: logs.slice(0, 20) });
  } catch (error: any) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
});
