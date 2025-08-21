# API Documentation

This document describes the REST API endpoints available in the PlanetTogether Manufacturing SCM + APS system.

## Base URL
```
http://localhost:5000/api
```

## Authentication

The API uses session-based authentication. Users must log in to access protected endpoints.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### Logout
```http
POST /api/auth/logout
```

### Current User
```http
GET /api/auth/me
```

## Manufacturing Resources

### Resources
```http
GET /api/resources              # Get all resources
GET /api/resources/:id          # Get specific resource
POST /api/resources             # Create new resource
PUT /api/resources/:id          # Update resource
DELETE /api/resources/:id       # Delete resource
```

**Resource Schema:**
```json
{
  "id": "number",
  "name": "string",
  "type": "equipment | labor | tool | space",
  "description": "string",
  "capacity": "number",
  "status": "active | inactive | maintenance",
  "costPerHour": "number"
}
```

### Capabilities
```http
GET /api/capabilities           # Get all capabilities
GET /api/capabilities/:id       # Get specific capability
POST /api/capabilities          # Create new capability
```

### Work Centers
```http
GET /api/work-centers           # Get all work centers
GET /api/work-centers/:id       # Get specific work center
POST /api/work-centers          # Create new work center
```

## Production Management

### Production Orders
```http
GET /api/production-orders      # Get all production orders
GET /api/production-orders/:id  # Get specific production order
POST /api/production-orders     # Create new production order
PUT /api/production-orders/:id  # Update production order
```

**Production Order Schema:**
```json
{
  "id": "number",
  "orderNumber": "string",
  "productId": "number",
  "quantity": "number",
  "status": "planned | released | in_progress | completed | cancelled",
  "startDate": "string (ISO date)",
  "dueDate": "string (ISO date)",
  "priority": "low | medium | high | urgent"
}
```

### Bills of Material (BOMs)
```http
GET /api/boms                   # Get all BOMs
GET /api/boms/:id              # Get specific BOM
POST /api/boms                 # Create new BOM
GET /api/boms/:id/items        # Get BOM items
```

### Routings
```http
GET /api/routings              # Get all routings
GET /api/routings/:id          # Get specific routing
POST /api/routings             # Create new routing
```

## Inventory Management

### Items
```http
GET /api/items                 # Get all items
GET /api/items/:id             # Get specific item
POST /api/items                # Create new item
PUT /api/items/:id             # Update item
```

**Item Schema:**
```json
{
  "id": "number",
  "itemNumber": "string",
  "itemName": "string",
  "itemType": "raw_material | component | finished_good | service",
  "unitOfMeasure": "string",
  "unitCost": "number",
  "description": "string"
}
```

### Stocks
```http
GET /api/stocks                # Get all stock records
GET /api/stocks/:id            # Get specific stock record
POST /api/stocks               # Create new stock record
PUT /api/stocks/:id            # Update stock record
```

### Storage Locations
```http
GET /api/storage-locations     # Get all storage locations
GET /api/storage-locations/:id # Get specific storage location
POST /api/storage-locations    # Create new storage location
```

## Sales & Procurement

### Sales Orders
```http
GET /api/sales-orders          # Get all sales orders
GET /api/sales-orders/:id      # Get specific sales order
POST /api/sales-orders         # Create new sales order
PUT /api/sales-orders/:id      # Update sales order
```

### Purchase Orders
```http
GET /api/purchase-orders       # Get all purchase orders
GET /api/purchase-orders/:id   # Get specific purchase order
POST /api/purchase-orders      # Create new purchase order
```

### Customers
```http
GET /api/customers             # Get all customers
GET /api/customers/:id         # Get specific customer
POST /api/customers            # Create new customer
```

### Vendors
```http
GET /api/vendors               # Get all vendors
GET /api/vendors/:id           # Get specific vendor
POST /api/vendors              # Create new vendor
```

## Quality Management

### Quality Inspections
```http
GET /api/quality-inspections   # Get all inspections
GET /api/quality-inspections/:id # Get specific inspection
POST /api/quality-inspections  # Create new inspection
```

### Quality Specifications
```http
GET /api/quality-specifications # Get all specifications
GET /api/quality-specifications/:id # Get specific specification
POST /api/quality-specifications # Create new specification
```

## Process Manufacturing

### Recipes
```http
GET /api/recipes               # Get all recipes
GET /api/recipes/:id           # Get specific recipe
POST /api/recipes              # Create new recipe
```

### Formulations
```http
GET /api/formulations          # Get all formulations
GET /api/formulations/:id      # Get specific formulation
POST /api/formulations         # Create new formulation
```

## Operations & Scheduling

### Operations
```http
GET /api/operations            # Get all operations
GET /api/operations/:id        # Get specific operation
POST /api/operations           # Create new operation
```

### Jobs
```http
GET /api/jobs                  # Get all jobs
GET /api/jobs/:id              # Get specific job
POST /api/jobs                 # Create new job
PUT /api/jobs/:id              # Update job
```

## Analytics & Metrics

### Metrics Dashboard
```http
GET /api/metrics               # Get dashboard metrics
```

**Metrics Response:**
```json
{
  "activeJobs": "number",
  "utilization": "number",
  "overdueOperations": "number",
  "completedToday": "number",
  "averageLeadTime": "number",
  "qualityMetrics": {
    "passRate": "number",
    "defectRate": "number"
  }
}
```

### Optimization Algorithms
```http
GET /api/optimization/algorithms # Get available algorithms
POST /api/optimization/run       # Run optimization
```

## Database Schema

### Schema Information
```http
GET /api/database/schema       # Get complete database schema
```

**Schema Response:**
```json
[
  {
    "name": "string",
    "columns": [
      {
        "name": "string",
        "type": "string",
        "nullable": "boolean",
        "primaryKey": "boolean",
        "foreignKey": {
          "table": "string",
          "column": "string"
        },
        "comment": "string"
      }
    ],
    "relationships": [
      {
        "fromTable": "string",
        "toTable": "string",
        "fromColumn": "string",
        "toColumn": "string",
        "relationshipType": "one-to-many | many-to-one | many-to-many"
      }
    ]
  }
]
```

## Error Handling

### Error Response Format
```json
{
  "error": "string",
  "message": "string",
  "statusCode": "number",
  "timestamp": "string (ISO date)"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to prevent abuse:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

## Pagination

List endpoints support pagination:
```http
GET /api/items?page=1&limit=50&sort=name&order=asc
```

**Pagination Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "pages": 10
  }
}
```

## Filtering and Searching

Most list endpoints support filtering:
```http
GET /api/items?search=bearing&type=component&status=active
```

## WebSocket Events

Real-time updates available for:
- Production order status changes
- Job completions
- Resource availability updates
- Quality inspection results

```javascript
// Connect to WebSocket
const socket = new WebSocket('ws://localhost:5000/ws');

// Listen for events
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

## Authentication Headers

Include session cookie or token in requests:
```http
Cookie: connect.sid=s%3A...
```

## API Versioning

Current API version: `v1`
Future versions will use URL versioning: `/api/v2/...`

---

For more detailed information about specific endpoints, please refer to the source code or contact the development team.