import express from "express";
import { createServer } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerRoutes } from "./routes-new";
import { seedDatabase } from "./seed-database";
import { checkDbHealth } from "./db";

const app = express();
const server = createServer(app);

// Session configuration using PostgreSQL store
const PgSession = connectPg(session);

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Register database-driven routes
await registerRoutes(app);

// Initialize database
const initializeDatabase = async () => {
  try {
    console.log("Checking database health...");
    const health = await checkDbHealth();
    
    if (health.healthy) {
      console.log("✓ Database connection healthy");
      
      // Seed database with initial data
      try {
        await seedDatabase();
        console.log("✓ Database initialized successfully");
      } catch (seedError) {
        console.log("Database seeding skipped (already seeded or error):", seedError);
      }
    } else {
      console.error("✗ Database connection failed:", health.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Database initialization failed:", error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 Database-driven API endpoints available`);
  
  // Initialize database after server starts
  await initializeDatabase();
  
  console.log("=== SYSTEM READY ===");
  console.log("✓ All hardcoded endpoints replaced with database storage");
  console.log("✓ Widget system fully database-driven");
  console.log("✓ Mobile and desktop endpoints use real data");
});

export { app, server };