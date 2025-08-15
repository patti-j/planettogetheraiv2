import { Router } from "express";
import { ChatService } from "../chat-service";
import { z } from "zod";

const router = Router();
const chatService = new ChatService();

// Validation schemas
const createChannelSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['direct', 'group', 'contextual']),
  description: z.string().optional(),
  contextType: z.string().optional(),
  contextId: z.number().optional(),
  isPrivate: z.boolean().optional(),
  memberIds: z.array(z.number()),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  messageType: z.enum(['text', 'file', 'system', 'mention']).optional(),
  replyToId: z.number().optional(),
  attachments: z.array(z.any()).optional(),
  metadata: z.any().optional(),
});

const editMessageSchema = z.object({
  content: z.string().min(1),
});

const addReactionSchema = z.object({
  emoji: z.string().min(1).max(50),
});

// =============== CHANNELS ===============

// Get user's channels
router.get("/api/chat/channels", async (req, res) => {
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
router.post("/api/chat/channels", async (req, res) => {
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
router.get("/api/chat/channels/:channelId/members", async (req, res) => {
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

// Add member to channel
router.post("/api/chat/channels/:channelId/members", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const channelId = parseInt(req.params.channelId);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: "Invalid channel ID" });
    }

    const { userId: newMemberId } = req.body;
    if (!newMemberId || isNaN(parseInt(newMemberId))) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const member = await chatService.addMemberToChannel(channelId, parseInt(newMemberId), userId);
    res.status(201).json(member);
  } catch (error) {
    console.error("Error adding member to channel:", error);
    res.status(500).json({ error: "Failed to add member to channel" });
  }
});

// =============== MESSAGES ===============

// Get messages for a channel
router.get("/api/chat/channels/:channelId/messages", async (req, res) => {
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
    const offset = parseInt(req.query.offset as string) || 0;

    const messages = await chatService.getMessages(channelId, userId, limit, offset);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send message to channel
router.post("/api/chat/channels/:channelId/messages", async (req, res) => {
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

// Edit message
router.put("/api/chat/messages/:messageId", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const { content } = editMessageSchema.parse(req.body);
    const message = await chatService.editMessage(messageId, content, userId);
    
    res.json(message);
  } catch (error) {
    console.error("Error editing message:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Failed to edit message" });
  }
});

// Delete message
router.delete("/api/chat/messages/:messageId", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    await chatService.deleteMessage(messageId, userId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// =============== REACTIONS ===============

// Add reaction to message
router.post("/api/chat/messages/:messageId/reactions", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const { emoji } = addReactionSchema.parse(req.body);
    const reaction = await chatService.addReaction(messageId, emoji, userId);
    
    res.status(201).json(reaction);
  } catch (error) {
    console.error("Error adding reaction:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: "Failed to add reaction" });
  }
});

// Remove reaction from message
router.delete("/api/chat/messages/:messageId/reactions/:emoji", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    const emoji = req.params.emoji;
    if (!emoji) {
      return res.status(400).json({ error: "Invalid emoji" });
    }

    await chatService.removeReaction(messageId, emoji, userId);
    res.status(204).send();
  } catch (error) {
    console.error("Error removing reaction:", error);
    res.status(500).json({ error: "Failed to remove reaction" });
  }
});

// =============== SEARCH ===============

// Search messages
router.get("/api/chat/search", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const channelId = req.query.channelId ? parseInt(req.query.channelId as string) : undefined;
    if (channelId && isNaN(channelId)) {
      return res.status(400).json({ error: "Invalid channel ID" });
    }

    const results = await chatService.searchMessages(query.trim(), userId, channelId);
    res.json(results);
  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({ error: "Failed to search messages" });
  }
});

export default router;