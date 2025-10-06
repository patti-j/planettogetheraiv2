import { db } from "./db";
import { 
  users, roles, permissions, userRoles, rolePermissions,
  agentConnections, agentActions, agentMetricsHourly, agentPolicies, agentAlerts
} from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("🌱 Checking database for agent sample data...");

  try {
    // Check if agent connections exist
    const existingAgents = await db.select().from(agentConnections).limit(1);
    if (existingAgents.length === 0) {
      console.log("⏭️ No agents found - skipping agent data seeding");
      return;
    }

    // Check if agent activities already exist
    const existingActivities = await db.select().from(agentActions).limit(1);
    if (existingActivities.length > 0) {
      console.log("✅ Agent activities already seeded, skipping");
    } else {
      console.log("📊 Seeding agent activities...");
      
      // Get all agent IDs
      const agents = await db.select().from(agentConnections);
      const agentIds = agents.map(a => a.id);
      
      // Create sample activities for each agent
      const activities = [];
      const now = new Date();
      
      for (const agentId of agentIds) {
        // Create 15 sample activities per agent
        for (let i = 0; i < 15; i++) {
          const hoursAgo = Math.floor(Math.random() * 168); // Last 7 days
          const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
          
          const actionTypes = ['api_call', 'data_query', 'schedule_update', 'alert_trigger'];
          const endpoints = [
            '/api/production/orders', '/api/resources', '/api/jobs',
            '/api/scheduling/optimize', '/api/alerts', '/api/manufacturing-orders'
          ];
          const methods = ['GET', 'POST', 'PUT', 'PATCH'];
          const statusCodes = [200, 200, 200, 201, 204, 400, 404, 500];
          
          activities.push({
            agentConnectionId: agentId,
            actionType: actionTypes[Math.floor(Math.random() * actionTypes.length)],
            endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
            method: methods[Math.floor(Math.random() * methods.length)],
            requestBody: JSON.stringify({ query: 'sample' }),
            responseStatus: statusCodes[Math.floor(Math.random() * statusCodes.length)],
            responseTimeMs: Math.floor(Math.random() * 500) + 50,
            sessionId: `session-${agentId}-${i}`,
            metadata: { source: 'system', automated: true },
            timestamp: timestamp,
            createdAt: timestamp
          });
        }
      }
      
      await db.insert(agentActions).values(activities);
      console.log(`✅ Created ${activities.length} agent activities`);
    }

    // Check if agent metrics already exist
    const existingMetrics = await db.select().from(agentMetricsHourly).limit(1);
    if (existingMetrics.length > 0) {
      console.log("✅ Agent metrics already seeded, skipping");
    } else {
      console.log("📊 Seeding agent metrics...");
      
      const agents = await db.select().from(agentConnections);
      const metrics = [];
      const now = new Date();
      
      for (const agent of agents) {
        // Create metrics for the last 24 hours
        for (let hoursAgo = 0; hoursAgo < 24; hoursAgo++) {
          const hourTimestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
          hourTimestamp.setMinutes(0, 0, 0);
          
          const requestsCount = Math.floor(Math.random() * 100) + 20;
          const failedRequests = Math.floor(Math.random() * 5);
          
          metrics.push({
            agentConnectionId: agent.id,
            hourTimestamp: hourTimestamp,
            requestsCount: requestsCount,
            successfulRequests: requestsCount - failedRequests,
            failedRequests: failedRequests,
            avgResponseTimeMs: Math.floor(Math.random() * 200) + 100,
            totalDataTransferredBytes: BigInt(Math.floor(Math.random() * 1000000) + 50000),
            errorsCount: failedRequests,
            createdAt: now
          });
        }
      }
      
      await db.insert(agentMetricsHourly).values(metrics);
      console.log(`✅ Created ${metrics.length} agent metrics records`);
    }

    // Check if agent policies already exist
    const existingPolicies = await db.select().from(agentPolicies).limit(1);
    if (existingPolicies.length > 0) {
      console.log("✅ Agent policies already seeded, skipping");
    } else {
      console.log("📊 Seeding agent policies...");
      
      const agents = await db.select().from(agentConnections);
      const policies = [];
      
      for (const agent of agents) {
        // Rate limiting policy
        policies.push({
          agentConnectionId: agent.id,
          policyType: 'rate_limit',
          policyName: 'Standard Rate Limit',
          policyConfig: {
            requests_per_minute: 60,
            requests_per_hour: 1000,
            burst_size: 10
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Access control policy
        policies.push({
          agentConnectionId: agent.id,
          policyType: 'access_control',
          policyName: 'Data Access Policy',
          policyConfig: {
            allowed_endpoints: ['/api/production/*', '/api/resources/*', '/api/jobs/*'],
            denied_endpoints: ['/api/admin/*', '/api/users/*'],
            read_only: agent.status === 'suspended'
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Data filtering policy  
        policies.push({
          agentConnectionId: agent.id,
          policyType: 'data_filter',
          policyName: 'Response Filtering',
          policyConfig: {
            max_response_size_mb: 10,
            exclude_fields: ['password_hash', 'api_key_secret'],
            anonymize_pii: true
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Quality policy
        policies.push({
          agentConnectionId: agent.id,
          policyType: 'quality',
          policyName: 'Quality Standards',
          policyConfig: {
            min_accuracy: 0.95,
            max_error_rate: 0.05,
            require_validation: true
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      await db.insert(agentPolicies).values(policies);
      console.log(`✅ Created ${policies.length} agent policies`);
    }

    console.log("✅ Database agent data seeding complete");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
