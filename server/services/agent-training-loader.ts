import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export interface AgentTraining {
  agentId: string;
  name: string;
  role: string;
  personality: string;
  systemPrompt: string;
  rawContent: string;
  lastUpdated: Date;
}

export class AgentTrainingLoader {
  private static instance: AgentTrainingLoader;
  private trainings: Map<string, AgentTraining> = new Map();
  private readonly trainingDir = join(process.cwd(), 'server/training/agents');

  private constructor() {
    this.loadAllTrainings();
  }

  static getInstance(): AgentTrainingLoader {
    if (!AgentTrainingLoader.instance) {
      AgentTrainingLoader.instance = new AgentTrainingLoader();
    }
    return AgentTrainingLoader.instance;
  }

  private loadAllTrainings(): void {
    try {
      if (!existsSync(this.trainingDir)) {
        console.warn(`[AgentTrainingLoader] Training directory not found: ${this.trainingDir}`);
        return;
      }

      const files = readdirSync(this.trainingDir)
        .filter(f => f.endsWith('.md') && f !== 'README.md');

      for (const file of files) {
        const agentId = file.replace('.md', '').replace('-agent', '').replace(/-/g, '_');
        this.loadTraining(agentId, file);
      }

      console.log(`[AgentTrainingLoader] Loaded ${this.trainings.size} agent trainings`);
    } catch (error) {
      console.error('[AgentTrainingLoader] Failed to load trainings:', error);
    }
  }

  private loadTraining(agentId: string, filename: string): void {
    try {
      const filepath = join(this.trainingDir, filename);
      const content = readFileSync(filepath, 'utf-8');
      
      // Parse the markdown to extract key sections
      const training = this.parseTrainingDocument(agentId, content);
      this.trainings.set(agentId, training);
      
      console.log(`[AgentTrainingLoader] Loaded training for ${agentId}`);
    } catch (error) {
      console.error(`[AgentTrainingLoader] Failed to load ${filename}:`, error);
    }
  }

  private parseTrainingDocument(agentId: string, content: string): AgentTraining {
    // Extract key sections from markdown
    const nameMatch = content.match(/\*\*Name\*\*:\s*(.+)/);
    const roleMatch = content.match(/\*\*Role\*\*:\s*(.+)/);
    const personalityMatch = content.match(/\*\*Personality\*\*:\s*(.+)/);
    
    // Build system prompt from content
    const systemPrompt = this.buildSystemPrompt(content);
    
    return {
      agentId,
      name: nameMatch?.[1] || agentId,
      role: roleMatch?.[1] || 'AI Assistant',
      personality: personalityMatch?.[1] || 'Professional and helpful',
      systemPrompt,
      rawContent: content,
      lastUpdated: new Date()
    };
  }

  private buildSystemPrompt(content: string): string {
    // Extract relevant sections for the system prompt
    const sections = [];
    
    // Extract Core Knowledge Base section
    const knowledgeMatch = content.match(/## Core Knowledge Base([\s\S]*?)##/);
    if (knowledgeMatch) {
      sections.push(knowledgeMatch[1].trim());
    }
    
    // Extract Communication Guidelines
    const commMatch = content.match(/## Communication Guidelines([\s\S]*?)##/);
    if (commMatch) {
      sections.push(commMatch[1].trim());
    }
    
    // Extract Specialized sections
    const specializedMatch = content.match(/## Specialized.*?([\s\S]*?)##/);
    if (specializedMatch) {
      sections.push(specializedMatch[1].trim());
    }
    
    return sections.join('\n\n');
  }

  getTraining(agentId: string): AgentTraining | undefined {
    // Try direct match first
    if (this.trainings.has(agentId)) {
      return this.trainings.get(agentId);
    }
    
    // Try with underscores
    const underscoredId = agentId.replace(/-/g, '_');
    if (this.trainings.has(underscoredId)) {
      return this.trainings.get(underscoredId);
    }
    
    // Try without _agent suffix
    const withoutSuffix = agentId.replace('_agent', '');
    if (this.trainings.has(withoutSuffix)) {
      return this.trainings.get(withoutSuffix);
    }
    
    return undefined;
  }

  getSystemPrompt(agentId: string): string {
    const training = this.getTraining(agentId);
    if (!training) {
      console.warn(`[AgentTrainingLoader] No training found for ${agentId}`);
      return this.getDefaultPrompt(agentId);
    }
    return training.systemPrompt;
  }

  private getDefaultPrompt(agentId: string): string {
    return `You are ${agentId}, an AI assistant for the PlanetTogether manufacturing system. 
    Provide helpful, accurate, and concise responses focused on manufacturing operations.`;
  }

  getAllTrainings(): AgentTraining[] {
    return Array.from(this.trainings.values());
  }

  reloadTraining(agentId: string): void {
    const filename = `${agentId.replace(/_/g, '-')}-agent.md`;
    this.loadTraining(agentId, filename);
  }

  reloadAllTrainings(): void {
    this.trainings.clear();
    this.loadAllTrainings();
  }
}

// Export singleton instance
export const agentTrainingLoader = AgentTrainingLoader.getInstance();