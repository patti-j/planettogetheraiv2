import express from "express";
import fs from "fs";
import path from "path";
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import routes from "./routes";
import forecastingRoutes from "./forecasting-routes";
import { llmProviderRoutes } from "./routes-llm-providers";
import { automationRoutes } from "./routes-automation";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import { storage as dbStorage, DatabaseStorage } from "./storage-new";
import { seedDatabase } from "./seed";
import { RealtimeVoiceService } from "./realtime-voice-service";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

// Extend session interface
declare module "express-session" {
  interface SessionData {
    userId: number;
    isDemo: boolean;
  }
}

const app = express();

// CRITICAL: Ultra-fast health check endpoints MUST be first, before ANY middleware
// These endpoints respond instantly without any expensive operations

// Primary health check endpoints - respond immediately
// These are used by Cloud Run, Kubernetes, and Prometheus probes
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Root endpoint - Minimal logic, pass through to static/Vite
// Don't do user agent checks or cached file serving here - it slows health checks
app.get('/', (req, res, next) => {
  // For health check probes, respond instantly
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('GoogleHC') || 
      userAgent.includes('kube-probe') ||
      userAgent.includes('Google-Cloud-Scheduler') ||
      userAgent.includes('Prometheus')) {
    return res.status(200).send('OK');
  }
  
  // For all other requests (browser, etc), pass to static/Vite
  // Don't cache index.html here - let Vite/static middleware handle it
  next();
});

// Readiness probe - returns 503 until critical initialization completes
app.get('/readiness', async (req, res) => {
  const { orchestrator } = await import('./initialization-orchestrator');
  const status = orchestrator.getStatus();
  
  if (orchestrator.isReady()) {
    res.status(200).json({
      status: 'ready',
      ...status
    });
  } else {
    res.status(503).json({
      status: 'initializing',
      ...status
    });
  }
});

// Middleware (after health checks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS - Secure configuration for enterprise deployment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Build allowed origins based on environment
  const allowedOrigins: string[] = [];
  
  // In development, allow localhost
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5000', 'https://localhost:5000');
  }
  
  // In production, allow Replit domains and custom domains
  if (process.env.NODE_ENV === 'production') {
    // Allow any Replit domain
    if (origin && (origin.includes('.repl.co') || origin.includes('.replit.dev') || origin.includes('planettogetherai.com'))) {
      allowedOrigins.push(origin);
    }
  }
  
  // Add configured origins
  if (process.env.ALLOWED_ORIGIN) allowedOrigins.push(process.env.ALLOWED_ORIGIN);
  if (process.env.PROD_ORIGIN) allowedOrigins.push(process.env.PROD_ORIGIN);
  
  // Only allow credentials for exact-match trusted origins (no prefix matching to prevent spoofing)
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV === 'production' && origin) {
    // In production, allow any origin but without credentials for safety
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'false');
  } else {
    // Default fallback
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'false');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Session middleware configuration - must be after CORS and before routes
// Configure for Replit environment (HTTPS external, HTTP internal)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true, // Create session immediately
  name: 'planettogether_session', // Unique session name
  proxy: true, // Trust proxy for HTTPS headers
  cookie: {
    secure: false, // Replit handles HTTPS externally
    httpOnly: true, // Security - prevent JS access
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'lax', // More permissive for cross-origin
    path: '/' // Available for all paths
  }
}));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// CRITICAL: NO async IIFE wrapper - server must start synchronously
// All async initialization happens AFTER server.listen() in callbacks
log("🚀 Starting PlanetTogether SCM + APS...");

// Log OpenAI API key status on startup
const hasApiKey = !!process.env.OPENAI_API_KEY;
if (hasApiKey) {
  log("✅ OpenAI API key configured");
} else {
  log("⚠️  OpenAI API key not configured - AI features will be limited");
}
  
// Serve scheduler-test specifically
app.get('/scheduler-test', (req, res) => {
  res.sendFile(path.resolve('public/scheduler-test/index.html'));
});

app.get('/scheduler-test/', (req, res) => {
  res.sendFile(path.resolve('public/scheduler-test/index.html'));
});

// Serve production-scheduler.html specifically
app.get('/production-scheduler.html', (req, res) => {
  const filePath = path.resolve('public/production-scheduler.html');
  
  // Set no-cache headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'text/html'
  });
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Production scheduler file not found');
  }
});

// Serve Bryntum module files specifically
app.get('/schedulerpro.module.js', (req, res) => {
  const filePath = path.resolve('public/schedulerpro.module.js');
  res.set({
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=31536000'
  });
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Scheduler module not found');
  }
});

// Serve Bryntum UMD file specifically
app.get('/schedulerpro.umd.js', (req, res) => {
  const filePath = path.resolve('public/schedulerpro.umd.js');
  res.set({
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=31536000'
  });
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Scheduler UMD not found');
  }
});

// COMMENTED OUT: These handlers were intercepting Vite's files
// The static middleware and Vite will handle these files properly
/*
// Serve JavaScript module files with correct MIME type
app.get('/*.module.js', (req, res) => {
  const filePath = `public${req.path}`;
  
  if (fs.existsSync(filePath)) {
    res.set({
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=31536000'
    });
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).send('Module not found');
  }
});

// Serve all JavaScript files with correct MIME type
app.get('/*.js', (req, res) => {
  const filePath = `public${req.path}`;
  
  if (fs.existsSync(filePath)) {
    res.set({
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=31536000'
    });
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).send('JavaScript file not found');
  }
});

// Serve HTML files directly from public directory with no caching
app.get('/*.html', (req, res) => {
  const filePath = `public${req.path}`;
  
  // Set no-cache headers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).send('File not found');
  }
});
*/


// CRITICAL: Root health check endpoint for deployment (MUST be first)
// Autoscale deployments require a fast-responding root endpoint
app.get("/", (req, res) => {
  // Quick response for health checks
  const userAgent = req.headers['user-agent'] || '';
  const isHealthCheck = userAgent.includes('GoogleHC') || 
                        userAgent.includes('kube-probe') || 
                        userAgent.includes('UptimeRobot') ||
                        userAgent.includes('Pingdom');
  
  if (isHealthCheck || req.headers['x-health-check']) {
    // Instant response for health checks
    return res.status(200).send('OK');
  }
  
  // For browsers in production, serve the index.html
  if (app.get("env") !== "development") {
    const indexPath = path.resolve(import.meta.dirname, "..", "dist", "public", "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // Fallback response
  res.status(200).send('PlanetTogether SCM + APS');
});

// Serve Bryntum static assets from public directory
app.use(express.static(path.resolve(import.meta.dirname, "public")));

// IMPORTANT: Register API routes BEFORE Vite middleware
// This ensures API routes are handled before Vite's catch-all
app.use(routes);  // Note: No '/api' prefix here since routes already have /api prefix
app.use(llmProviderRoutes);  // LLM provider management routes
app.use(automationRoutes);  // AI automation rules routes
app.use('/api/forecasting', forecastingRoutes);  // Forecasting API routes

// DEBUG: Database health check endpoint (for diagnosing production issues)
app.get('/api/debug/db-health', async (req, res) => {
  try {
    // Check if database connection is available
    if (!db) {
      return res.status(503).json({
        status: 'disconnected',
        environment: process.env.NODE_ENV,
        isProduction: process.env.REPLIT_DEPLOYMENT === '1',
        error: 'Database connection not available',
        message: 'Please configure PRODUCTION_DATABASE_URL in deployment settings',
        timestamp: new Date().toISOString()
      });
    }
    
    const { users } = await import("../shared/schema");
    
    // Check if users table exists and count users
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const sampleUsers = await db.select({ 
      id: users.id, 
      username: users.username 
    }).from(users).limit(5);
    
    res.json({
      status: 'connected',
      environment: process.env.NODE_ENV,
      isProduction: process.env.REPLIT_DEPLOYMENT === '1',
      userCount: userCount[0]?.count || 0,
      sampleUsernames: sampleUsers.map(u => u.username),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      environment: process.env.NODE_ENV,
      isProduction: process.env.REPLIT_DEPLOYMENT === '1',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// CRITICAL: Register production scheduler route BEFORE Vite to prevent interference
// This must be before Vite middleware to avoid injection of Vite client scripts
app.get("/api/production-scheduler", (req, res) => {
  try {
    console.log('Serving production scheduler HTML (bypassing Vite)...');
    const htmlPath = path.join(process.cwd(), 'public', 'production-scheduler.html');
    
    // Check if file exists
    if (!fs.existsSync(htmlPath)) {
      console.error('Production scheduler HTML not found at:', htmlPath);
      return res.status(404).send('Production scheduler HTML not found');
    }
    
    // Read and send the HTML file
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    console.log('Successfully read HTML file, size:', htmlContent.length, 'bytes');
    
    // Set headers to ensure clean HTML delivery
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Send the HTML directly without any processing
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error('Error serving production scheduler HTML:', error);
    res.status(500).send('Error loading production scheduler');
  }
});

// Create HTTP server and WebSocket server
// Use PORT environment variable for production, fallback to 5000 for development
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const server = createServer(app);

// Set up WebSocket server for real-time production events
const wss = new WebSocketServer({ 
  server,
  path: '/api/v1/stream/production-events',
  maxPayload: 64 * 1024, // 64KB max message size
  verifyClient: (info: any) => {
    // Verify origin for security (must match HTTP CORS exactly)
    const origin = info.origin;
    const allowedOrigins = [
      'http://localhost:5000',
      'https://localhost:5000', 
      process.env.ALLOWED_ORIGIN,
      process.env.PROD_ORIGIN
    ].filter(Boolean);
    
    if (origin && !allowedOrigins.includes(origin)) {
      log(`❌ WebSocket connection rejected: invalid origin ${origin}`);
      return false;
    }
    return true;
  }
});

// WebSocket connection management with authentication and subscriptions
const activeConnections = new Map<string, {
  ws: WebSocket;
  userId: number;
  subscribedStreams: Set<string>;
  lastPing: number;
  isAuthenticated: boolean;
}>();
let connectionIdCounter = 1;

// WebSocket connection handler with JWT authentication
wss.on('connection', (ws, req) => {
  const connectionId = `agent-${connectionIdCounter++}`;
  let connection = {
    ws,
    userId: 0,
    subscribedStreams: new Set<string>(),
    lastPing: Date.now(),
    isAuthenticated: false
  };
  
  activeConnections.set(connectionId, connection);
  
  log(`📡 Agent connected: ${connectionId} (${activeConnections.size} total)`);
  
  // Request authentication immediately
  ws.send(JSON.stringify({
    type: 'auth_required',
    connectionId,
    timestamp: new Date().toISOString(),
    message: 'Please send authentication token to access production streams'
  }));
  
  // Handle incoming messages from agents
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleAgentMessage(connectionId, message);
    } catch (error) {
      log(`❌ Invalid message from ${connectionId}: ${error}`);
      connection.ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON message format'
      }));
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    activeConnections.delete(connectionId);
    log(`📡 Agent disconnected: ${connectionId} (${activeConnections.size} remaining)`);
  });
  
  // Handle connection errors
  ws.on('error', (error) => {
    log(`❌ WebSocket error for ${connectionId}: ${error}`);
    activeConnections.delete(connectionId);
  });
});

// Set up Realtime Voice WebSocket server
const realtimeVoiceWss = new WebSocketServer({
  server,
  path: '/api/v1/realtime-voice',
  maxPayload: 1 * 1024 * 1024, // 1MB for audio data
  verifyClient: (info: any) => {
    // Verify origin for security
    const origin = info.origin;
    
    // Allow localhost and Replit domains
    if (origin) {
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
      const isReplit = origin.includes('replit.dev') || origin.includes('repl.co');
      const isAllowed = process.env.ALLOWED_ORIGIN === origin || process.env.PROD_ORIGIN === origin;
      
      if (!isLocalhost && !isReplit && !isAllowed) {
        log(`❌ Realtime Voice WebSocket rejected: invalid origin ${origin}`);
        return false;
      }
    }
    
    return true;
  }
});

// Initialize Realtime Voice Service
const jwtSecret = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';
const realtimeVoiceService = new RealtimeVoiceService(jwtSecret);

// Handle Realtime Voice connections
realtimeVoiceWss.on('connection', (ws, req) => {
  realtimeVoiceService.handleConnection(ws, req);
});

log(`🎙️ Realtime Voice WebSocket server initialized on /api/v1/realtime-voice`);

// Broadcast function with strict validation and least-privilege authorization
function broadcastToAgents(event: any) {
  // Validate event structure before broadcasting
  const validationResult = ProductionEventSchema.safeParse(event);
  if (!validationResult.success) {
    log(`❌ Invalid event structure, skipping broadcast: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
    return;
  }
  
  const eventData = {
    ...validationResult.data,
    eventId: event.eventId || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };
  
  const message = JSON.stringify(eventData);
  let broadcastCount = 0;
  const streamType = eventData.streamType || 'production_events';
  
  activeConnections.forEach((connection, connectionId) => {
    // Enforce least privilege: Only send to authenticated connections with explicit subscriptions
    if (!connection.isAuthenticated) return;
    
    // DENY by default - require explicit subscription to receive ANY events
    if (connection.subscribedStreams.size === 0) {
      log(`🔐 ${connectionId} denied event: no subscriptions (least privilege)`);
      return;
    }
    
    // Check explicit subscription to this stream type
    if (!connection.subscribedStreams.has(streamType)) {
      return;
    }
    
    // TODO: Add role-based per-stream authorization check here
    // e.g., if (!userHasStreamAccess(connection.userId, streamType)) return;
    
    if (connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(message);
        broadcastCount++;
      } catch (error) {
        log(`❌ Error sending to ${connectionId}: ${error}`);
        activeConnections.delete(connectionId);
      }
    } else {
      // Clean up closed connections
      activeConnections.delete(connectionId);
    }
  });
  
  if (broadcastCount > 0) {
    log(`📡 Event ${eventData.eventType} (${streamType}) broadcasted to ${broadcastCount} authorized agents`);
  } else {
    log(`📡 Event ${eventData.eventType} (${streamType}) not broadcasted - no authorized subscribers`);
  }
}

// Enhanced heartbeat system with JWT expiry validation
const heartbeatInterval = setInterval(() => {
  const now = Date.now();
  const PING_INTERVAL = 30000; // 30 seconds
  const TIMEOUT_THRESHOLD = 90000; // 90 seconds
  
  activeConnections.forEach((connection, connectionId) => {
    // Check for general connection timeout
    if (now - connection.lastPing > TIMEOUT_THRESHOLD) {
      log(`⏰ Connection ${connectionId} timed out, closing`);
      connection.ws.terminate();
      activeConnections.delete(connectionId);
      return;
    }
    
    // Check JWT expiry for authenticated connections
    if (connection.isAuthenticated && (connection as any).authToken) {
      const tokenValidation = validateJWT((connection as any).authToken);
      if (!tokenValidation.valid) {
        if (tokenValidation.expired) {
          log(`🔓 JWT expired for ${connectionId}, closing connection`);
          connection.ws.send(JSON.stringify({
            type: 'auth_expired',
            message: 'Authentication token has expired. Please reconnect with a valid token.'
          }));
        } else {
          log(`🔓 JWT invalid for ${connectionId}, closing connection`);
          connection.ws.send(JSON.stringify({
            type: 'auth_invalid',
            message: 'Authentication token is no longer valid.'
          }));
        }
        connection.ws.close(1008, 'Token expired or invalid');
        activeConnections.delete(connectionId);
        return;
      }
    }
    
    // Send server-initiated ping for active connections
    if (now - connection.lastPing > PING_INTERVAL && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString(),
        requiresAuth: !connection.isAuthenticated
      }));
    }
  });
}, 15000); // Check every 15 seconds

// JWT Authentication for WebSocket connections
const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret-key-change-in-production';

// Helper function to validate JWT token
function validateJWT(token: string): { valid: boolean; expired?: boolean; userId?: number; exp?: number } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { 
      valid: true, 
      userId: decoded.userId,
      exp: decoded.exp 
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, expired: true };
    }
    return { valid: false };
  }
}

// Role-based stream access control
const STREAM_PERMISSIONS: Record<string, string[]> = {
  'production_events': ['admin', 'production_manager', 'production_planner', 'shop_floor_operator'],
  'equipment_status': ['admin', 'maintenance_manager', 'maintenance_technician', 'shop_floor_operator'],
  'quality_metrics': ['admin', 'quality_manager', 'quality_inspector', 'production_manager'],
  'resource_utilization': ['admin', 'production_manager', 'production_planner', 'plant_manager'],
  'job_updates': ['admin', 'production_manager', 'production_planner', 'shop_floor_operator']
};

// Get streams available to user based on their role
async function getUserAvailableStreams(userId: number, storage: DatabaseStorage): Promise<string[]> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return [];

    // For now, return all streams for authenticated users
    // This is a simplified version - proper role-based access can be added later
    return Object.keys(STREAM_PERMISSIONS);
  } catch (error) {
    log(`❌ Error getting user streams for ${userId}:`, String(error));
    return [];
  }
}

// Check if user has access to specific stream
async function userHasStreamAccess(userId: number, streamType: string, storage: DatabaseStorage): Promise<boolean> {
  const availableStreams = await getUserAvailableStreams(userId, storage);
  return availableStreams.includes(streamType);
}

// Handle incoming messages from agents with authentication
function handleAgentMessage(connectionId: string, message: any) {
  const connection = activeConnections.get(connectionId);
  if (!connection) return;
  
  connection.lastPing = Date.now();
  
  switch (message.type) {
    case 'authenticate':
      const { token } = message;
      if (!token) {
        connection.ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'Authentication token required'
        }));
        return;
      }
      
      const validation = validateJWT(token);
      if (!validation.valid) {
        const errorMessage = validation.expired ? 'Authentication token expired' : 'Invalid authentication token';
        connection.ws.send(JSON.stringify({
          type: 'auth_error',
          message: errorMessage
        }));
        return;
      }
      
      connection.userId = validation.userId!;
      connection.isAuthenticated = true;
      // Store token for periodic validation (in production, use secure token store)
      (connection as any).authToken = token;
      
      log(`🔐 Agent ${connectionId} authenticated as user ${validation.userId} (expires: ${new Date(validation.exp! * 1000).toISOString()})`);
      
      // Get role-based available streams for this user
      getUserAvailableStreams(validation.userId!, dbStorage).then(availableStreams => {
        connection.ws.send(JSON.stringify({
          type: 'auth_success',
          connectionId,
          userId: validation.userId,
          availableStreams,
          expiresAt: new Date(validation.exp! * 1000).toISOString(),
          timestamp: new Date().toISOString()
        }));
        
        log(`🔐 User ${validation.userId} granted access to streams: ${availableStreams.join(', ')}`);
      }).catch(error => {
        log(`❌ Error getting streams for user ${validation.userId}:`, error);
        // Fallback to no streams on error
        connection.ws.send(JSON.stringify({
          type: 'auth_success',
          connectionId,
          userId: validation.userId,
          availableStreams: [],
          expiresAt: new Date(validation.exp! * 1000).toISOString(),
          timestamp: new Date().toISOString()
        }));
      });
      break;
      
    case 'subscribe':
      if (!connection.isAuthenticated) {
        connection.ws.send(JSON.stringify({
          type: 'error',
          message: 'Authentication required before subscribing'
        }));
        return;
      }
      
      const requestedStreams = message.streams || [];
      
      // Role-based stream authorization
      const authorizationPromises = requestedStreams.map(async (stream: string) => {
        const hasAccess = await userHasStreamAccess(connection.userId!, stream, dbStorage);
        return hasAccess ? stream : null;
      });
      
      Promise.all(authorizationPromises).then(results => {
        const allowedStreams = results.filter(stream => stream !== null);
        const deniedStreams = requestedStreams.filter((stream: string) => !allowedStreams.includes(stream));
        
        connection.subscribedStreams.clear();
        allowedStreams.forEach((stream: string) => connection.subscribedStreams.add(stream));
        
        log(`📡 ${connectionId} authorized for streams: ${allowedStreams.join(', ')}`);
        if (deniedStreams.length > 0) {
          log(`🚫 ${connectionId} denied access to streams: ${deniedStreams.join(', ')}`);
        }
        
        connection.ws.send(JSON.stringify({
          type: 'subscription_confirmed',
          streams: allowedStreams,
          denied: deniedStreams,
          timestamp: new Date().toISOString()
        }));
      }).catch(error => {
        log(`❌ Error authorizing streams for ${connectionId}:`, error);
        connection.ws.send(JSON.stringify({
          type: 'error',
          message: 'Authorization error - unable to process stream subscription'
        }));
      });
      break;
      
    case 'ping':
      // Client-initiated ping - respond with pong
      connection.ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
      break;
      
    case 'pong':
      // Client response to server ping - just acknowledge, no error
      log(`💓 Heartbeat received from ${connectionId}`);
      break;
      
    default:
      log(`❓ Unknown message type from ${connectionId}: ${message.type}`);
      connection.ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${message.type}`
      }));
  }
}

// Schema validation for production events
const ProductionEventSchema = z.object({
  type: z.string(),
  eventType: z.string(),
  streamType: z.string().optional(),
  data: z.record(z.any()),
  triggeredBy: z.string().optional(),
  eventId: z.string().optional(),
  timestamp: z.string().optional()
});

// Simulate production events for testing (remove in production)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const events = [
      {
        type: 'production_event',
        eventType: 'job_status_update', 
        streamType: 'production_events',
        data: {
          jobId: `job-${Math.floor(Math.random() * 100)}`,
          status: Math.random() > 0.5 ? 'completed' : 'in_progress',
          resourceId: `resource-${Math.floor(Math.random() * 10)}`,
          efficiency: Math.round(Math.random() * 100)
        }
      },
      {
        type: 'equipment_status',
        eventType: 'status_change',
        streamType: 'equipment_status', 
        data: {
          equipmentId: `eq-${Math.floor(Math.random() * 5)}`,
          status: Math.random() > 0.7 ? 'maintenance' : 'operational',
          utilization: Math.round(Math.random() * 100)
        }
      },
      {
        type: 'quality_alert',
        eventType: 'quality_check',
        streamType: 'quality_metrics',
        data: {
          batchId: `batch-${Math.floor(Math.random() * 50)}`,
          qualityScore: Math.round((Math.random() * 20 + 80) * 10) / 10,
          passed: Math.random() > 0.1
        }
      }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    broadcastToAgents(randomEvent);
  }, 45000); // Every 45 seconds with varied event types
}

// Make broadcast function available globally for other modules
(global as any).broadcastToAgents = broadcastToAgents;

// Error handler (must be registered before starting server)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
const status = err.status || err.statusCode || 500;
const message = err.message || "Internal Server Error";
res.status(status).json({ message });
log(`Error: ${message}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// CRITICAL: Configure static assets BEFORE server starts (for production deployment)
// ═══════════════════════════════════════════════════════════════════════════
// Production: Must configure static assets synchronously to serve them on first request
if (app.get("env") !== "development") {
  try {
    serveStatic(app);
    log("📦 Static assets configured for production");
  } catch (error) {
    log(`⚠️ Static asset configuration warning: ${error}`);
    // Continue anyway - deployment infrastructure might handle static files differently
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CRITICAL: START SERVER IMMEDIATELY (synchronous, no blocking)
// ═══════════════════════════════════════════════════════════════════════════
// Server must start listening BEFORE any async operations to pass Cloud Run health checks
server.listen(port, "0.0.0.0", () => {
log(`🏭 PlanetTogether serving on port ${port}`);
log(`📡 WebSocket server ready for agent connections`);
log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'No DATABASE_URL'}`);
  log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND INITIALIZATION (non-blocking, runs AFTER server starts)
// ═══════════════════════════════════════════════════════════════════════════

// Development: Load Vite middleware asynchronously (don't block health checks)
if (app.get("env") === "development") {
  setImmediate(async () => {
    try {
      await setupVite(app, server);
      log("✅ Vite development middleware loaded");
    } catch (error) {
      log(`⚠️ Vite setup error: ${error}`);
    }
  });
}

// Run initialization orchestrator in background (admin access, data seeding, etc.)
setImmediate(async () => {
  try {
    const { orchestrator } = await import('./initialization-orchestrator');
    await orchestrator.start();
    log(`✅ Initialization orchestrator complete`);
  } catch (error) {
    log(`⚠️ Initialization orchestrator error: ${error}`);
    // Don't exit - server should continue running in degraded state
  }
});