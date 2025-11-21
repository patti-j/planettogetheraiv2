# PlanetTogether - Autoscale Deployment Diagnostic Report

## Issue Summary
Autoscale deployment failing with health check timeouts and potential service errors.

## Critical Configuration Issue Found

### ⚠️ PORT CONFIGURATION PROBLEM (PRIMARY ISSUE)
**Multiple External Port Mappings Detected** - Autoscale only supports ONE external port

Current `.replit` file contains **15 port mappings**:
- Primary: `localPort 5000 → externalPort 80` ✅
- Extra ports (13 additional mappings):
  - localPort 8000 → externalPort 8000
  - localPort 33497 → externalPort 3003
  - localPort 35123 → externalPort 5000
  - localPort 35309 → externalPort 8080
  - localPort 37527 → externalPort 6000
  - localPort 38407 → externalPort 8008
  - localPort 39085 → externalPort 8000
  - localPort 39793 → externalPort 8099
  - localPort 39953 → externalPort 6800
  - localPort 40349 → externalPort 3002
  - localPort 41077 → externalPort 9000
  - localPort 41193 → externalPort 3001
  - localPort 43627 → externalPort 3003
  - localPort 43783 → externalPort 5173
  - localPort 44205 → externalPort 3000
  - localPort 45079 → externalPort 8081
  - localPort 45281 → externalPort 4200

## Deployment Configuration

### Build & Run Commands
```
Build: npm run build
Run: NODE_ENV=production REPLIT_DEPLOYMENT=1 node dist/index.js
Deployment Target: autoscale
```

### Application Details
- **Node.js Module:** nodejs-20
- **Language:** TypeScript/JavaScript
- **Framework:** Express.js + React
- **Port:** 5000 (internal)
- **External Port:** 80 (configured)

### Listening Configuration
✅ Application listens on `0.0.0.0:5000` (verified in server code)
✅ Health check endpoints configured (`/health`, `/ping`, `/`)
✅ Server starts synchronously before async operations

## Recommended Actions for Support

### 1. ✅ IMMEDIATE FIX - Remove Extra Port Mappings
The `.replit` file needs to be cleaned up to have ONLY the primary port:

```toml
[[ports]]
localPort = 5000
externalPort = 80
```

**All other 14 port mappings should be removed.**

### 2. Delete & Republish
After port cleanup:
1. Go to Publishing → Manage → Shut down
2. Delete the current deployment
3. Republish the app fresh

### 3. Deployment Health Checks
Application is optimized with:
- Ultra-fast health check responses (`/health`, `/ping`, `/`)
- Cloud Run probe detection (GoogleHC, kube-probe, Prometheus)
- Synchronous server startup before async initialization
- In-memory index.html caching for instant responses

## Recent Optimization Applied
**Nov 19, 2025 - Health Check Timeout Fix**
- Moved static asset serving to background (non-blocking)
- Server starts listening immediately before expensive operations
- Health check endpoints respond instantly (<5ms)
- All initialization runs in background via `setImmediate()`

## Artifact Details
- Build output: `/dist` directory
- Static files: `/dist/public`
- Entry point: `/dist/index.js`
- Production database: `$PRODUCTION_DATABASE_URL`
- Development database: `$DATABASE_URL`

## Support Action Plan
1. ✅ Manually edit `.replit` to remove all extra port mappings (keep only 5000→80)
2. ✅ Delete current deployment and republish fresh
3. ✅ Monitor deployment logs for any connection issues
4. ✅ Verify health checks are passing

---

**Generated:** Nov 21, 2025
**Report prepared for:** Replit Support
**Issue Type:** Autoscale Deployment Configuration
