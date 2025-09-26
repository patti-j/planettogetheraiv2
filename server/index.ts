import express from "express";
import fs from "fs";
import path from "path";
import routes from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";

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

// CORS - Must be BEFORE session middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  const origin = req.headers.origin || 'http://localhost:5000';
  res.header('Access-Control-Allow-Origin', origin);
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

(async () => {
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

  // Serve Bryntum static assets from public directory
  app.use(express.static(path.resolve(import.meta.dirname, "public")));

  // IMPORTANT: Register API routes BEFORE Vite middleware
  // This ensures API routes are handled before Vite's catch-all
  app.use(routes);  // Note: No '/api' prefix here since routes already have /api prefix

  // Create server (needed for Vite HMR)
  const port = 5000;
  const server = app.listen(port, "0.0.0.0", () => {
    log(`🏭 PlanetTogether serving on port ${port}`);
    log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'No DATABASE_URL'}`);
    log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Setup Vite AFTER API routes in development
  // This way Vite's catch-all only handles non-API routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handler (must be last)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    log(`Error: ${message}`);
  });
  // Server is already listening above
})();