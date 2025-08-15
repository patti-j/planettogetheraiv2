import { Router } from "express";
import { ChatService } from "../chat-service-simple";
import { z } from "zod";

const router = Router();
const chatService = new ChatService();

// Validation schemas
const createChannelSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['direct', 'group', 'contextual']),
  description: z.string().optional(),
  memberIds: z.array(z.number()),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  messageType: z.enum(['text', 'file', 'system', 'mention']).optional(),
});

// =============== CHANNELS ===============

// Get user's channels
router.get("/channels", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const channels = await chatService.getChannelsForUser(userId);
    res.json(channels);
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

// Create new channel
router.post("/channels", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const validatedData = createChannelSchema.parse(req.body);
    const channel = await chatService.createChannel(validatedData, userId);
    
    res.status(201).json(channel);
  } catch (error) {
    console.error("Error creating channel:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create channel" });
  }
});

// Get channel members
router.get("/channels/:channelId/members", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: "Invalid channel ID" });
    }

    const members = await chatService.getChannelMembers(channelId);
    res.json(members);
  } catch (error) {
    console.error("Error fetching channel members:", error);
    res.status(500).json({ error: "Failed to fetch channel members" });
  }
});

// =============== MESSAGES ===============

// Get messages for a channel
router.get("/channels/:channelId/messages", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: "Invalid channel ID" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await chatService.getMessages(channelId, userId, limit);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send message to channel
router.post("/channels/:channelId/messages", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: "Invalid channel ID" });
    }

    const validatedData = sendMessageSchema.parse(req.body);
    const messageData = {
      ...validatedData,
      channelId,
    };

    const message = await chatService.sendMessage(messageData, userId);
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Failed to send message" });
  }
});

// =============== SEARCH ===============

// Search messages
router.get("/search", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const results = await chatService.searchMessages(query.trim(), userId);
    res.json(results);
  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({ error: "Failed to search messages" });
  }
});

export default router;