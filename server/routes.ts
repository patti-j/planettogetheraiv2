import express from "express";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { eq, sql, and, desc } from "drizzle-orm";
import { storage } from "./storage";
import { insertUserSchema, insertCompanyOnboardingSchema, insertUserPreferencesSchema } from "@shared/schema";

const router = express.Router();

// Authentication routes
router.post("/auth/login", async (req, res) => {
  try {
    console.log("=== LOGIN DEBUG ===");
    const { username, password } = req.body;
    console.log(`Username: ${username}`);
    console.log(`Password length: ${password?.length}`);
    console.log(`Password: ${password}`);

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user by username or email
    const user = await storage.getUserByUsernameOrEmail(username);
    console.log("=== USER DATA FROM DATABASE ===");
    console.log(`User found: ${user?.username} ID: ${user?.id}`);
    console.log(`User email: ${user?.email}`);
    console.log(`User firstName: ${user?.firstName}`);
    console.log(`User lastName: ${user?.lastName}`);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Get user roles and permissions
    const userRoles = await storage.getUserRoles(user.id);
    const roleNames = [];
    const permissions: string[] = [];

    for (const userRole of userRoles) {
      const role = await storage.getRole(userRole.roleId);
      if (role) {
        roleNames.push(role.name);
        const rolePermissions = await storage.getRolePermissions(role.id);
        for (const rp of rolePermissions) {
          const permission = await storage.getPermission(rp.permissionId);
          if (permission) {
            permissions.push(permission.name);
          }
        }
      }
    }

    console.log(`User roles: ${roleNames.join(', ')}`);
    console.log(`Stored hash: ${user.passwordHash}`);
    console.log(`Comparing password: ${password}`);

    // Verify password
    const isValid = await bcryptjs.compare(password, user.passwordHash);
    console.log(`Password comparison result: ${isValid}`);

    if (!isValid) {
      console.log("Password verification failed");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await storage.updateUser(user.id, { lastLogin: new Date() });

    // Store user in session
    (req.session as any).userId = user.id;
    (req.session as any).user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: roleNames,
      permissions: permissions
    };

    console.log("Login successful");
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roleNames,
        permissions: permissions
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", (req, res) => {
  console.log("=== AUTH CHECK ===");
  console.log(`Session ID: ${req.sessionID}`);
  console.log(`Authorization header: ${req.headers.authorization}`);
  console.log(`Session userId: ${(req.session as any)?.userId}`);
  console.log(`Session isDemo: ${(req.session as any)?.isDemo}`);

  const sessionUserId = (req.session as any)?.userId;
  if (!sessionUserId) {
    console.log("No userId found, returning 401");
    return res.status(401).json({ message: "Not authenticated" });
  }

  const user = (req.session as any).user;
  if (user) {
    res.json({ user });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// User management routes
router.get("/users", async (req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Company onboarding routes
router.get("/onboarding/status", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    const onboarding = await storage.getCompanyOnboarding(userId);
    res.json({
      success: true,
      data: onboarding || {
        onboardingProgress: 0,
        isCompleted: false,
        completedSteps: [],
        primaryGoals: [],
        currentChallenges: []
      }
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    res.status(500).json({ 
      success: false, 
      message: "An unexpected error occurred while fetching onboarding status" 
    });
  }
});

router.post("/onboarding", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const data = { ...req.body, userId };
    const onboarding = await storage.createCompanyOnboarding(data);
    res.json({ success: true, data: onboarding });
  } catch (error) {
    console.error("Error creating onboarding:", error);
    res.status(500).json({ message: "Failed to create onboarding" });
  }
});

// User preferences routes
router.get("/user-preferences/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const preferences = await storage.getUserPreferences(userId);
    
    // Return default preferences if none exist
    const defaultPreferences = {
      theme: "light",
      language: "en",
      timezone: "UTC",
      dashboardLayout: {},
      notificationSettings: {},
      uiSettings: {}
    };

    res.json({
      error: preferences ? undefined : "Failed to fetch user preferences",
      ...defaultPreferences,
      ...preferences
    });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ 
      error: "Failed to fetch user preferences",
      theme: "light",
      language: "en",
      timezone: "UTC",
      dashboardLayout: {},
      notificationSettings: {},
      uiSettings: {}
    });
  }
});

router.post("/user-preferences/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const existing = await storage.getUserPreferences(userId);
    
    if (existing) {
      const updated = await storage.updateUserPreferences(userId, req.body);
      res.json(updated);
    } else {
      const created = await storage.createUserPreferences({ userId, ...req.body });
      res.json(created);
    }
  } catch (error) {
    console.error("Error saving user preferences:", error);
    res.status(500).json({ message: "Failed to save user preferences" });
  }
});

// Recent pages routes
router.post("/recent-pages", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    await storage.saveRecentPage({ userId, ...req.body });
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving recent page:", error);
    res.status(500).json({ message: "Failed to save recent page" });
  }
});

router.get("/recent-pages", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const pages = await storage.getRecentPages(userId);
    res.json(pages);
  } catch (error) {
    console.error("Error fetching recent pages:", error);
    res.status(500).json([]);
  }
});

// Basic manufacturing data routes
router.get("/plants", async (req, res) => {
  try {
    const plants = await storage.getPlants();
    res.json(plants);
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ message: "Failed to fetch plants" });
  }
});

router.get("/resources", async (req, res) => {
  try {
    const resources = await storage.getResources();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

router.get("/job-operations", async (req, res) => {
  try {
    const operations = await storage.getJobOperations();
    res.json(operations);
  } catch (error) {
    console.error("Error fetching job operations:", error);
    res.status(500).json({ message: "Failed to fetch job operations" });
  }
});

router.get("/manufacturing-orders", async (req, res) => {
  try {
    const orders = await storage.getManufacturingOrders();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching manufacturing orders:", error);
    res.status(500).json({ message: "Failed to fetch manufacturing orders" });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

export default router;