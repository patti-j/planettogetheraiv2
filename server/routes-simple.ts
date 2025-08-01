import express from "express";
import { storage } from "./storage-basic";
import { insertPlantSchema, insertCapabilitySchema, insertResourceSchema, insertUserSchema, insertProductionOrderSchema } from "../shared/schema-simple";

export function registerSimpleRoutes(app: express.Application) {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // Plants
  app.get("/api/plants", async (req, res) => {
    try {
      const plants = await storage.getPlants();
      res.json(plants);
    } catch (error) {
      console.error("Error fetching plants:", error);
      res.status(500).json({ error: "Failed to fetch plants", details: error.message });
    }
  });

  app.post("/api/plants", async (req, res) => {
    try {
      const data = insertPlantSchema.parse(req.body);
      const plant = await storage.createPlant(data);
      res.json(plant);
    } catch (error) {
      res.status(400).json({ error: "Invalid plant data" });
    }
  });

  // Capabilities
  app.get("/api/capabilities", async (req, res) => {
    try {
      const capabilities = await storage.getCapabilities();
      res.json(capabilities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch capabilities" });
    }
  });

  app.post("/api/capabilities", async (req, res) => {
    try {
      const data = insertCapabilitySchema.parse(req.body);
      const capability = await storage.createCapability(data);
      res.json(capability);
    } catch (error) {
      res.status(400).json({ error: "Invalid capability data" });
    }
  });

  // Resources
  app.get("/api/resources", async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ error: "Failed to fetch resources", details: error.message });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const data = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(data);
      res.json(resource);
    } catch (error) {
      res.status(400).json({ error: "Invalid resource data" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Production Orders
  app.get("/api/production-orders", async (req, res) => {
    try {
      const orders = await storage.getProductionOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production orders" });
    }
  });

  app.post("/api/production-orders", async (req, res) => {
    try {
      const data = insertProductionOrderSchema.parse(req.body);
      const order = await storage.createProductionOrder(data);
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: "Invalid production order data" });
    }
  });

  // Basic auth endpoint for demo
  app.get("/api/auth/me", (req, res) => {
    res.json({
      id: "demo_user",
      username: "demo_user",
      email: "demo@example.com",
      isDemo: true
    });
  });

  return app;
}