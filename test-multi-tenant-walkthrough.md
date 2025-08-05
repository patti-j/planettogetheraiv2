# Multi-Tenant Functionality Testing Guide
## Step-by-Step Testing Walkthrough

### Overview
The multi-tenant system supports 4 different tenant resolution strategies:
1. **Header-based**: Using `x-tenant-id` header
2. **Subdomain-based**: Using subdomain routing
3. **JWT-based**: Tenant ID embedded in authentication token
4. **Path-based**: Tenant ID in URL path

---

## Test 1: Check System Status and Existing Tenants

### Get Tenant Statistics
```bash
curl -s "http://localhost:5000/api/tenant-admin/stats" -H "Accept: application/json"
```

### List All Tenants
```bash
curl -s "http://localhost:5000/api/tenant-admin/tenants" -H "Accept: application/json"
```

### Expected Results:
- Shows total tenants, active tenants, plan distribution
- Lists existing mock tenants (tenant_001: ACME Manufacturing, tenant_002: Steel Works Inc)

---

## Test 2: Tenant Resolution Testing

### Test Header-Based Resolution
```bash
# Test with tenant_001 (ACME Manufacturing)
curl -s "http://localhost:5000/api/tenant-info" \
  -H "Accept: application/json" \
  -H "x-tenant-id: tenant_001"

# Test with tenant_002 (Steel Works Inc)
curl -s "http://localhost:5000/api/tenant-info" \
  -H "Accept: application/json" \
  -H "x-tenant-id: tenant_002"
```

### Test Subdomain-Based Resolution
```bash
# Simulate subdomain request
curl -s "http://localhost:5000/api/tenant-info" \
  -H "Accept: application/json" \
  -H "host: acme-manufacturing.planettogether.com"

curl -s "http://localhost:5000/api/tenant-info" \
  -H "Accept: application/json" \
  -H "host: steel-works.planettogether.com"
```

### Test No Tenant Context
```bash
# Should show no tenant resolved
curl -s "http://localhost:5000/api/tenant-info" \
  -H "Accept: application/json"
```

---

## Test 3: Individual Tenant Details

### Get Specific Tenant Information
```bash
# Get ACME Manufacturing details
curl -s "http://localhost:5000/api/tenant-admin/tenants/tenant_001" \
  -H "Accept: application/json"

# Get Steel Works details
curl -s "http://localhost:5000/api/tenant-admin/tenants/tenant_002" \
  -H "Accept: application/json"
```

### Check Tenant Health
```bash
# Check ACME Manufacturing health
curl -s "http://localhost:5000/api/tenant-admin/tenants/tenant_001/health" \
  -H "Accept: application/json"

# Check Steel Works health
curl -s "http://localhost:5000/api/tenant-admin/tenants/tenant_002/health" \
  -H "Accept: application/json"
```

---

## Test 4: Create New Tenant

### Create a Test Tenant
```bash
curl -X POST "http://localhost:5000/api/tenant-admin/tenants" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Test Manufacturing Co",
    "subdomain": "test-manufacturing",
    "plan": "professional",
    "adminEmail": "admin@testmanufacturing.com",
    "adminPassword": "TempPass123!",
    "features": ["basic-scheduling", "inventory-management", "quality-tracking"]
  }'
```

### Verify New Tenant
```bash
# Should show increased tenant count
curl -s "http://localhost:5000/api/tenant-admin/stats" -H "Accept: application/json"

# Test resolution of new tenant (use the returned tenant ID)
curl -s "http://localhost:5000/api/tenant-info" \
  -H "Accept: application/json" \
  -H "x-tenant-id: [NEW_TENANT_ID]"
```

---

## Test 5: Tenant Context in Operations

### Test Background Jobs with Tenant Context
```bash
# Create a tenant-specific job
curl -X POST "http://localhost:5000/api/jobs" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "x-tenant-id: tenant_001" \
  -d '{
    "type": "inventory_sync",
    "data": {"tenantId": "tenant_001", "syncType": "full"},
    "priority": 2
  }'

# Check job stats (should include tenant-specific job)
curl -s "http://localhost:5000/api/jobs-stats" -H "Accept: application/json"
```

### Test Monitoring with Tenant Context
```bash
# System monitoring should work regardless of tenant
curl -s "http://localhost:5000/api/system/monitoring" \
  -H "Accept: application/json" \
  -H "x-tenant-id: tenant_001"
```

---

## Test 6: Feature and Plan Validation

### Compare Different Tenant Plans
```bash
# ACME (Enterprise plan) - should have more features
curl -s "http://localhost:5000/api/tenant-info" \
  -H "x-tenant-id: tenant_001" | jq '.tenant.features'

# Steel Works (Professional plan) - should have fewer features
curl -s "http://localhost:5000/api/tenant-info" \
  -H "x-tenant-id: tenant_002" | jq '.tenant.features'
```

### Expected Feature Differences:
- **Enterprise (tenant_001)**: advanced-scheduling, quality-management, inventory-optimization
- **Professional (tenant_002)**: basic-scheduling, inventory-management

---

## Test 7: Error Handling

### Test Invalid Tenant ID
```bash
curl -s "http://localhost:5000/api/tenant-info" \
  -H "Accept: application/json" \
  -H "x-tenant-id: invalid_tenant"
```

### Test Non-Existent Tenant Details
```bash
curl -s "http://localhost:5000/api/tenant-admin/tenants/non_existent" \
  -H "Accept: application/json"
```

---

## Understanding the Results

### Successful Tenant Resolution Response:
```json
{
  "resolved": true,
  "resolvedBy": "header",
  "tenant": {
    "id": "tenant_001",
    "name": "ACME Manufacturing",
    "subdomain": "acme-manufacturing",
    "plan": "enterprise",
    "features": ["advanced-scheduling", "quality-management", "inventory-optimization"]
  },
  "requestInfo": {
    "host": "localhost:5000",
    "subdomain": null,
    "tenantHeader": "tenant_001"
  }
}
```

### Tenant Details Response:
```json
{
  "id": "tenant_001",
  "name": "ACME Manufacturing",
  "subdomain": "acme-manufacturing",
  "databaseUrl": "postgresql://user:pass@localhost:5432/tenant_001",
  "status": "active",
  "plan": "enterprise",
  "maxUsers": 100,
  "maxFactories": 10,
  "features": ["advanced-scheduling", "quality-management", "inventory-optimization"],
  "customConfig": {"theme": "industrial", "timezone": "America/New_York"}
}
```

---

## Key Testing Points

### 1. Tenant Isolation
- Each tenant has separate database URLs
- Different feature sets based on plans
- Independent configurations and limits

### 2. Resolution Strategies
- Header-based works with `x-tenant-id`
- Subdomain-based extracts from host header
- Graceful fallback when no tenant found

### 3. Plan-Based Features
- Enterprise: Full feature set
- Professional: Mid-tier features
- Starter: Basic features only

### 4. Integration with Infrastructure
- Background jobs work with tenant context
- Monitoring and CDN remain system-wide
- Tenant-specific operations are isolated

---

## Troubleshooting

### Common Issues:
1. **HTML Response Instead of JSON**: Endpoint might be returning HTML - check URL spelling
2. **Tenant Not Found**: Verify tenant ID exists in mock data
3. **No Tenant Resolution**: Check header format and values

### Debug Commands:
```bash
# Check if server is running correctly
curl -s "http://localhost:5000/api/health" || echo "Server not responding"

# Verbose curl to see headers
curl -v "http://localhost:5000/api/tenant-info" -H "x-tenant-id: tenant_001"
```

This testing approach validates that the multi-tenant architecture correctly isolates tenants, resolves tenant context from requests, and maintains proper feature separation based on subscription plans.