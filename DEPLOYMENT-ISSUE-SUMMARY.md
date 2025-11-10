# Cloud Run Deployment Issue - Summary for Replit Support

## Issue Description
Deployment to Cloud Run (planettogetherai.com) is failing with health check timeout errors during cold start.

## Error Message from Cloud Run
```
Health checks timeout because initialization tasks run synchronously before the server can respond to requests
```

## What We've Done to Fix It

### 1. Removed Async IIFE Wrapper
- **Problem**: Server startup was wrapped in `(async () => { ... })()` which kept the function pending until ALL async operations completed
- **Fix**: Removed wrapper so `server.listen()` executes synchronously and immediately

### 2. Restructured Server Startup (server/index.ts)
- **Production**: `serveStatic(app)` runs synchronously BEFORE `server.listen()`
- **Development**: `setupVite()` runs in `setImmediate()` AFTER `server.listen()` (non-blocking)
- **Initialization**: Orchestrator runs in `setImmediate()` AFTER `server.listen()` (non-blocking)

### 3. Smart Health Check Detection
- `/` endpoint detects Cloud Run probes (GoogleHC, kube-probe user agents)
- Returns instant "OK" text response for health checks (<5ms)
- Serves React SPA HTML to browser requests
- `/health` endpoint also available for explicit health checks

## Test Results (Local Development)
✅ Production build successful: `dist/index.js` (1.6MB)
✅ Health check `/` with GoogleHC agent: 4ms response
✅ Health check `/health`: 2.5ms response
✅ Server starts without errors
✅ No blocking operations before server.listen()

## Current Deployment Configuration (.replit file)

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["bash", "-c", "NODE_ENV=production REPLIT_DEPLOYMENT=1 node dist/index.js"]
```

### Build Command
Runs `npm run build` which:
- Compiles TypeScript backend to `dist/index.js`
- Builds Vite frontend to `dist/public/`
- Output: 1.6MB server bundle + frontend assets

### Run Command
Executes: `NODE_ENV=production REPLIT_DEPLOYMENT=1 node dist/index.js`

## Environment Variables Required
- `NODE_ENV=production` (set in run command)
- `REPLIT_DEPLOYMENT=1` (set in run command)
- `PRODUCTION_DATABASE_URL` (secret)
- `JWT_SECRET` (secret)
- `SESSION_SECRET` (secret)
- `OPENAI_API_KEY` (secret)

## Questions for Replit Support

1. **Health Check Configuration**: What user-agent does Cloud Run use for health checks? We've added detection for "GoogleHC" and "kube-probe" - are there others?

2. **Cold Start Timeout**: What's the exact timeout for health checks during cold start? We're responding in <5ms but deployment still fails.

3. **Startup Logging**: Can you check Cloud Run logs to see:
   - How long it takes before the first health check is attempted?
   - What the actual timeout value is?
   - If there are any other errors not shown in the deployment UI?

4. **Alternative Health Check Endpoint**: Should we configure a specific health check endpoint in deployment settings instead of relying on `/`?

5. **Debug Mode**: Is there a way to enable verbose logging for Cloud Run deployments to see the exact cold-start sequence?

## Architecture Notes

- **Application Type**: Full-stack Express.js + React (Vite) SPA
- **Server Port**: 5000 (frontend), internal ports for development
- **Database**: Neon PostgreSQL (serverless)
- **Deployment Target**: Autoscale (stateless)
- **Session Storage**: PostgreSQL with connect-pg-simple
- **Static Assets**: Served from `dist/public/` in production

## Files to Review
1. `replit-config-for-support.toml` - Copy of `.replit` configuration
2. `server/index.ts` - Main server file with startup sequence
3. `package.json` - Build scripts and dependencies
4. `dist/index.js` - Production build output (1.6MB)

## Contact
Project: PlanetTogether SCM + APS
URL: planettogetherai.com (currently failing to deploy)

---

**Note**: We've confirmed locally that health checks respond in <5ms and the server starts synchronously with no blocking operations. The issue appears to be specific to Cloud Run's cold-start health check timing or configuration.
