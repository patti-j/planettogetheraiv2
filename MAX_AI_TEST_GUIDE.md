# Max AI Manufacturing Intelligence - Testing Guide

## How to Access Max AI

### Desktop Version
1. Open http://localhost:5000 in your browser
2. Log in with your credentials
3. Look for the **Max AI panel on the left side** of the screen
4. Click the circular Max button to open/close the AI assistant

### Mobile Version  
1. Open http://localhost:5000 on your mobile device or resize browser to mobile width
2. Max AI is integrated into the mobile interface

## Sample Questions to Test

Try asking Max these manufacturing-focused questions:

### Production Status Questions
- "What is the current production status?"
- "Show me active production orders"
- "Are there any bottlenecks in production?"
- "What operations are currently running?"
- "How many alerts are active?"

### Schedule Analysis
- "Analyze today's production schedule"
- "What resources are overloaded?"
- "Find resource conflicts in the schedule"
- "What orders are at risk of being late?"

### Optimization Suggestions
- "How can we optimize the current schedule?"
- "What setup time reductions are possible?"
- "Identify parallel processing opportunities"
- "Suggest ways to improve throughput"

### Alert Management
- "Show me critical alerts"
- "What production alerts need attention?"
- "Summarize active alerts by severity"

### Resource Analysis
- "What is the current resource utilization?"
- "Which resources are available?"
- "Show me resource capacity"
- "What resources have the most downtime?"

## Features Max AI Can Help With

1. **Real-time Production Intelligence**
   - Monitor active orders and operations
   - Track resource utilization
   - Identify production issues

2. **Schedule Optimization**
   - Detect resource conflicts
   - Find bottlenecks
   - Suggest sequence improvements

3. **Proactive Insights**
   - Alert summaries
   - Risk identification
   - Performance metrics

4. **Context-Aware Responses**
   - Max understands what page you're on
   - Provides relevant suggestions based on your current view
   - Offers role-based insights

## Testing the API Directly

You can also test Max AI via API calls:

```bash
# Test production status query
curl -X POST http://localhost:5000/api/max-ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "message": "What is the current production status?",
    "context": {
      "currentPage": "/production-schedule",
      "selectedData": null,
      "recentActions": []
    }
  }'

# Test insights
curl -X GET http://localhost:5000/api/max-ai/insights \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Test anomaly detection  
curl -X GET http://localhost:5000/api/max-ai/anomalies \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## What Max AI Analyzes

- **Production Orders**: Status, delays, completion rates
- **Operations**: Running, pending, bottlenecks
- **Resources**: Utilization, conflicts, availability
- **Alerts**: Active issues, severity, recommendations
- **Schedule**: Optimization opportunities, risks

## Expected Responses

Max AI should provide:
- Clear summaries of current production state
- Specific metrics and counts
- Actionable suggestions
- Context-aware recommendations
- Links to relevant pages or actions

## Troubleshooting

If Max AI isn't responding:
1. Check that you're logged in
2. Ensure the server is running (npm run dev)
3. Look for the Max button on the left panel (desktop)
4. Check browser console for any errors
5. Verify your OpenAI API key is set in environment variables

## Current Capabilities

✅ Production status monitoring
✅ Schedule analysis
✅ Bottleneck detection
✅ Resource conflict identification
✅ Alert summarization
✅ Optimization suggestions
✅ Context-aware responses based on current page

## Coming Soon (Per 8-Week Plan)

- Visual schedule manipulation
- Automated optimization execution
- Predictive analytics
- Multi-plant coordination
- Custom KPI tracking
- Voice interaction