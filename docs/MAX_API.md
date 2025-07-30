# Max AI Assistant Algorithm Feedback API

Max can now submit algorithm feedback programmatically to the system for continuous improvement tracking and automated issue detection.

## API Endpoint

```
POST /api/max/algorithm-feedback
```

**Authentication**: None required (Max has special system access)

## Request Format

```json
{
  "algorithmName": "backwards-scheduling",
  "algorithmVersion": "v1.0",
  "title": "Max Auto-detected Issue",
  "description": "Automated detection of potential scheduling inefficiency",
  "feedbackType": "bug|improvement|feature_request|positive",
  "category": "performance|algorithm|usability",
  "severity": "low|medium|high|critical",
  "priority": "low|medium|high|critical",
  "plantId": 123,  // Optional: specific plant ID
  "notes": "Additional details about the feedback",
  "executionContext": {
    "executionId": "exec_12345",
    "performanceMetrics": {
      "executionTime": 2.5,
      "resourceUtilization": 85,
      "scheduleEfficiency": 78
    },
    "customData": {}
  },
  "expectedResult": "What Max expected to happen",
  "actualResult": "What actually happened",
  "suggestedImprovement": "Max's improvement suggestion",
  "reproducible": true,
  "reproductionSteps": ["Step 1", "Step 2"],
  "tags": ["automated", "performance"]
}
```

## Required Fields

- `algorithmName`: Name of the algorithm being evaluated
- `algorithmVersion`: Version of the algorithm
- `title`: Brief title for the feedback
- `description`: Detailed description of the issue/suggestion
- `feedbackType`: Type of feedback (bug, improvement, feature_request, positive)
- `category`: Category of the feedback (performance, algorithm, usability)
- `severity`: Severity level (low, medium, high, critical)
- `priority`: Priority level (low, medium, high, critical)

## Response Format

```json
{
  "success": true,
  "feedback": {
    "id": 9,
    "algorithmName": "backwards-scheduling",
    "title": "Max Auto-detected Issue",
    // ... full feedback object
  },
  "message": "Algorithm feedback logged by Max AI Assistant"
}
```

## Special Features for Max

1. **Automatic System User**: Max is automatically created as a system user if it doesn't exist
2. **Automated Marking**: All feedback is marked with `[AUTOMATED FEEDBACK]` prefix
3. **Special Metadata**: Feedback includes `feedbackSource: 'max_ai_assistant'` and `automatedSystem: true`
4. **Timestamp Tracking**: Automatic timestamp when feedback is submitted

## Usage Examples

### Performance Issue Detection
```bash
curl -X POST http://localhost:5000/api/max/algorithm-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "algorithmName": "backwards-scheduling",
    "algorithmVersion": "v1.0",
    "title": "Resource Allocation Inefficiency Detected",
    "description": "Algorithm shows 15% efficiency loss in resource allocation",
    "feedbackType": "bug",
    "category": "performance",
    "severity": "medium",
    "priority": "high",
    "notes": "Detected during automated performance monitoring",
    "executionContext": {
      "executionId": "auto_exec_001",
      "performanceMetrics": {
        "executionTime": 3.2,
        "resourceUtilization": 72,
        "scheduleEfficiency": 85
      }
    }
  }'
```

### Algorithm Improvement Suggestion
```bash
curl -X POST http://localhost:5000/api/max/algorithm-feedback \
  -H "Content-Type: application/json" \
  -d '{
    "algorithmName": "capacity-planning",
    "algorithmVersion": "v2.1",
    "title": "Suggested Optimization for Peak Hours",
    "description": "AI analysis suggests alternative approach for peak hour scheduling",
    "feedbackType": "improvement",
    "category": "algorithm",
    "severity": "low",
    "priority": "medium",
    "suggestedImprovement": "Implement dynamic resource weighting during peak demand periods",
    "executionContext": {
      "analysisType": "pattern_recognition",
      "dataPoints": 15000,
      "confidenceLevel": 0.87
    }
  }'
```

## Integration with Development Environment

Max's feedback automatically appears in the Algorithm Development tab in Optimization Studio, where developers can:

- View automated feedback alongside user feedback
- Filter specifically for Max's automated suggestions
- Track implementation status of Max's recommendations
- See performance trends identified by Max

## Error Handling

- Invalid data returns 400 with validation details
- Server errors return 500 with error message
- All errors include helpful messages for debugging

## Canvas Widget Management API

Max can create and manage interactive widgets on the user's canvas for data visualization, controls, and real-time monitoring.

### Widget Types

- `chart` - Data visualization widgets (bar, line, pie charts)
- `table` - Tabular data display widgets
- `text` - Text displays and markdown content
- `image` - Image displays and visual content
- `button` - Interactive control buttons
- `custom` - Custom HTML/React components

### Create Widget for User (Max AI)

**POST** `/api/max/canvas/widgets`

No authentication required for Max AI systems.

```json
{
  "sessionId": "session_123",
  "userId": 6,
  "widgetType": "chart",
  "title": "Production Efficiency Trends",
  "config": {
    "chartType": "line",
    "dataSource": "production_orders",
    "xAxis": "date",
    "yAxis": "efficiency",
    "filters": {
      "plant": "Plant A",
      "dateRange": "last_30_days"
    }
  },
  "position": {
    "x": 100,
    "y": 200,
    "width": 400,
    "height": 300
  },
  "data": {
    "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
    "datasets": [{
      "label": "Efficiency %",
      "data": [85, 88, 92, 89],
      "borderColor": "rgb(75, 192, 192)"
    }]
  },
  "interactionSettings": {
    "clickAction": "drill_down",
    "hoverTooltips": true,
    "zoomEnabled": true
  },
  "refreshInterval": 30000,
  "autoUpdate": true
}
```

**Response (201 Created):**
```json
{
  "id": 123,
  "sessionId": "session_123",
  "userId": 6,
  "widgetType": "chart",
  "title": "Production Efficiency Trends",
  "createdByMax": true,
  "isVisible": true,
  "position": {
    "x": 100,
    "y": 200,
    "width": 400,
    "height": 300
  },
  "createdAt": "2025-07-30T14:30:00Z",
  "updatedAt": "2025-07-30T14:30:00Z"
}
```

### Get Canvas Widgets

**GET** `/api/canvas/widgets?sessionId=session_123&userId=6`

No authentication required for read operations.

**Response (200 OK):**
```json
[
  {
    "id": 123,
    "sessionId": "session_123",
    "userId": 6,
    "widgetType": "chart",
    "title": "Production Efficiency Trends",
    "createdByMax": true,
    "isVisible": true,
    "position": {
      "x": 100,
      "y": 200,
      "width": 400,
      "height": 300
    },
    "config": {
      "chartType": "line",
      "dataSource": "production_orders"
    },
    "createdAt": "2025-07-30T14:30:00Z"
  }
]
```

### Update Widget Position

**PUT** `/api/canvas/widgets/{id}/position`

```json
{
  "x": 150,
  "y": 250,
  "width": 450,
  "height": 350
}
```

### Clear All Widgets

**DELETE** `/api/canvas/widgets?sessionId=session_123&userId=6`

Removes all widgets for the specified session/user.

### Example Widget Configurations

#### Production KPI Dashboard
```json
{
  "widgetType": "chart",
  "title": "Real-time Production KPIs",
  "config": {
    "chartType": "gauge",
    "metrics": ["oee", "throughput", "quality"],
    "thresholds": {
      "oee": { "good": 85, "warning": 70 },
      "throughput": { "good": 100, "warning": 80 },
      "quality": { "good": 99, "warning": 95 }
    }
  },
  "refreshInterval": 10000,
  "autoUpdate": true
}
```

#### Resource Utilization Table
```json
{
  "widgetType": "table",
  "title": "Resource Utilization",
  "config": {
    "columns": ["resource", "utilization", "status", "next_maintenance"],
    "sortable": true,
    "filterable": true,
    "pageSize": 10
  },
  "data": {
    "rows": [
      {"resource": "Line A", "utilization": "89%", "status": "Running", "next_maintenance": "2025-08-15"},
      {"resource": "Line B", "utilization": "76%", "status": "Running", "next_maintenance": "2025-08-20"}
    ]
  }
}
```

#### Alert Button
```json
{
  "widgetType": "button",
  "title": "Schedule Emergency Stop",
  "config": {
    "buttonText": "EMERGENCY STOP",
    "buttonStyle": "danger",
    "confirmationRequired": true,
    "confirmationMessage": "Are you sure you want to initiate emergency stop?",
    "action": "emergency_stop",
    "targetSystems": ["line_a", "line_b"]
  },
  "interactionSettings": {
    "requiresConfirmation": true,
    "logAction": true
  }
}
```