import express from "express";
import fs from "fs";
import path from "path";
import routes from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Extend session interface
declare module "express-session" {
  interface SessionData {
    userId: number;
    isDemo: boolean;
  }
}

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session middleware configuration - must be after CORS and before routes
const pgSession = connectPg(session);
app.use(session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'session',
    pruneSessionInterval: 60 * 15 // Prune expired sessions every 15 minutes
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true, // Save session immediately to establish cookie
  name: 'connect.sid', // Use standard connect session cookie name
  cookie: {
    secure: false, // Set to false for development
    httpOnly: true, // Security - prevent JS access
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    sameSite: 'lax'
  },
  rolling: true // Reset expiry on activity
}));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  const origin = process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || req.headers.origin 
    : 'http://localhost:5000';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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

(async () => {
  log("🚀 Starting PlanetTogether SCM + APS...");
  
  // Log OpenAI API key status on startup
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  if (hasApiKey) {
    log("✅ OpenAI API key configured");
  } else {
    log("⚠️  OpenAI API key not configured - AI features will be limited");
  }
  
  // Serve HTML files directly from public directory with no caching
  app.get('/*.html', (req, res) => {
    const filePath = `client/public${req.path}`;
    
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

  // Register API routes
  app.use('/api', routes);

  // Error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    log(`Error: ${message}`);
  });

  // Create server
  const port = 5000;
  const server = app.listen(port, "0.0.0.0", () => {
    log(`🏭 PlanetTogether serving on port ${port}`);
    log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'No DATABASE_URL'}`);
    log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Setup Vite in development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  // Server is already listening above
})();