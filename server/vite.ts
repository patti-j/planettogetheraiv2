import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: false, // Disable HMR in middleware mode to avoid WebSocket conflicts
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  
  // Only catch actual page routes for SPA, not assets or Vite internal routes
  // Using wildcard for all non-asset routes to support client-side routing
  app.get("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API routes - let them be handled by Express router
    if (url.startsWith('/api/')) {
      return next();
    }
    
    // Skip Vite internal routes, assets, and dependency requests
    if (url.startsWith('/@') || 
        url.startsWith('/src/') || 
        url.startsWith('/node_modules/') ||
        url.includes('.')) {
      return next();
    }
    
    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  const publicPath = path.resolve(import.meta.dirname, "..", "public");

  // In production deployment, files might be served differently
  // Don't throw error, just log warning and set up what we can
  if (!fs.existsSync(distPath)) {
    console.warn(`⚠️ Build directory not found at: ${distPath}`);
    console.warn('  Static assets will be served from deployment infrastructure');
    
    // Try to serve from public directory if it exists
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }
    
    // Serve a basic fallback for catch-all routes
    app.use("*", (_req, res) => {
      // Try to find index.html in various locations
      const possiblePaths = [
        path.resolve(distPath, "index.html"),
        path.resolve(publicPath, "index.html"),
        path.resolve(import.meta.dirname, "..", "public", "index.html"),
        path.resolve(import.meta.dirname, "..", "client", "index.html")
      ];
      
      for (const indexPath of possiblePaths) {
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
      
      // If no index.html found, send a basic response
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>PlanetTogether SCM + APS</title></head>
        <body>
          <h1>PlanetTogether SCM + APS</h1>
          <p>Application is starting up...</p>
        </body>
        </html>
      `);
    });
    
    return;
  }

  // Normal case: serve built client files from dist/public
  // NOTE: Removed express.static here as it's now handled in index.ts before routes
  // This prevents conflicts with the static serving order
  
  console.log(`✅ Static assets directory confirmed at: ${distPath}`);
}
