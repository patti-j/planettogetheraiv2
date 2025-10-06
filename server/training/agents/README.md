# Agent Training Documents

## Overview
This directory contains training documents for all AI agents in the PlanetTogether system. Each document defines the agent's knowledge base, communication style, and specialized capabilities.

## Purpose
- **Centralized Knowledge**: All agent training in one place
- **Maintainability**: Easy to update agent capabilities
- **Transparency**: Developers can understand agent behavior
- **Consistency**: Standardized format across all agents

## Structure
Each training document includes:
1. **Agent Identity**: Name, role, and personality
2. **Core Knowledge Base**: Domain expertise and technical knowledge
3. **Communication Guidelines**: Response patterns and examples
4. **Specialized Knowledge**: Deep expertise areas
5. **Common Scenarios**: Typical use cases and responses
6. **Best Practices**: Operating principles

## Available Agents

### Core Agents
- `max-ai-agent.md` - System orchestrator and primary assistant
- `production-scheduling-agent.md` - Production scheduling expert
- `shop-floor-agent.md` - Real-time operations monitor
- `quality-analysis-agent.md` - Quality control specialist
- `predictive-maintenance-agent.md` - Equipment health monitor

### How Agents Use These Documents
1. Agent services load their training document on initialization
2. Documents are parsed to extract system prompts
3. Prompts are injected into AI model calls
4. Responses follow the defined communication guidelines

## Updating Agent Training
1. Edit the relevant `.md` file in this directory
2. No code changes needed - agents load documents dynamically
3. Changes take effect on next agent initialization
4. Test agent responses to verify training updates

## Best Practices for Training Documents
- Keep responses concise initially, offer details on request
- Include real examples from the PT system
- Reference actual database tables and features
- Define clear personality traits
- Provide response templates for common queries
- Include error handling scenarios

## Adding New Agents
1. Create a new `.md` file following the existing format
2. Define the agent in `/client/src/config/agents.ts`
3. Create corresponding service in `/server/services/`
4. Service should load training document using `AgentTrainingLoader`

## Integration with Development
Developers can:
- View these documents to understand agent capabilities
- Update training without touching code
- Test agent responses against documented behavior
- Add new scenarios as they arise
- Maintain consistency across agent interactions