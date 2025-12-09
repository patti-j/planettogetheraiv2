# Workday Summary

## December 8, 2025

### GPT-5.1 API Upgrade
Updated the entire application to use OpenAI GPT-5.1 model (released November 13, 2025):

**Central Config Updated:** `server/config/ai-model.ts`
- Primary model: `gpt-5.1`
- Added model variants: `gpt-5.1-chat-latest`, `gpt-5.1-codex`, `gpt-5.1-codex-mini`
- Added reasoning effort levels: none, minimal, low, medium, high
- Enabled 24-hour prompt caching (90% cheaper cached tokens)

**Files Updated to Use Centralized Config:**
- server/ai-agent.ts
- server/routes.ts
- server/translation.ts
- server/alerts-service.ts
- server/ai-analysis-service.ts
- server/implementation-service.ts
- server/services/llm-service.ts
- server/services/onboarding-ai-service.ts
- server/services/openai-config.ts

### Azure Migration Documentation
Created comprehensive Azure infrastructure migration document: `docs/azure-infrastructure-requirements.md`
- Full application migration (not just database)
- Database options: PostgreSQL vs Azure SQL (decision pending Cloud Admin)
- Compute options: App Service, Container Apps, AKS
- Supporting services: Key Vault, App Insights, Storage, Redis
- Cost estimates and migration timeline

---

## Connecting ChatGPT to GitHub repository
- analyzed current Agents' setup, routing, and triggers
- generated ChatGPT suggestions for improvement


