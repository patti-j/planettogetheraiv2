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