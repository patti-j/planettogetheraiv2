import { Router } from "express";
import { commentsService } from "../comments-service";
import { z } from "zod";
import { db } from "../db";
import { users } from "@shared/schema";
import { or, sql } from "drizzle-orm";

const router = Router();

// Schema validators
const createCommentSchema = z.object({
  entityType: z.string(),
  entityId: z.number(),
  content: z.string().min(1),
  parentCommentId: z.number().optional(),
  contextArea: z.string().optional(),
  mentions: z.array(z.number()).optional(),
  attachments: z.array(z.any()).optional(),
  isPrivate: z.boolean().optional()
});

const updateCommentSchema = z.object({
  content: z.string().min(1),
  mentions: z.array(z.number()).optional()
});

const addReactionSchema = z.object({
  reactionType: z.string()
});

// Get comments for an entity
router.get("/api/comments/:entityType/:entityId", async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { includeDeleted, sortOrder, limit, offset, threadId } = req.query;
    
    const comments = await commentsService.getComments(
      entityType,
      parseInt(entityId),
      {
        includeDeleted: includeDeleted === "true",
        sortOrder: sortOrder as "asc" | "desc" || "asc",
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        threadId: threadId ? parseInt(threadId as string) : undefined
      }
    );
    
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Authentication middleware function
function getAuthenticatedUserId(req: any): number | null {
  let userId = req.session?.userId;
  
  // Check for token in Authorization header if session fails
  if (!userId && req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    
    // Extract user ID from token (format: user_ID_timestamp_random)
    if (token.startsWith('user_')) {
      const tokenParts = token.split('_');
      if (tokenParts.length >= 2) {
        userId = parseInt(tokenParts[1]);
      }
    }
  }
  
  return userId || null;
}

// Create a new comment
router.post("/api/comments", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const data = createCommentSchema.parse(req.body);
    
    const comment = await commentsService.createComment({
      ...data,
      authorId: userId
    });
    
    res.json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Update a comment
router.put("/api/comments/:commentId", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const commentId = parseInt(req.params.commentId);
    const data = updateCommentSchema.parse(req.body);
    
    const updated = await commentsService.updateComment(
      commentId,
      userId,
      data.content,
      data.mentions
    );
    
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// Delete a comment
router.delete("/api/comments/:commentId", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const commentId = parseInt(req.params.commentId);
    
    const deleted = await commentsService.deleteComment(commentId, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: "Comment not found or unauthorized" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// Add a reaction to a comment
router.post("/api/comments/:commentId/reactions", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const commentId = parseInt(req.params.commentId);
    const { reactionType } = addReactionSchema.parse(req.body);
    
    const reaction = await commentsService.addReaction(
      commentId,
      userId,
      reactionType
    );
    
    res.json(reaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error adding reaction:", error);
    res.status(500).json({ error: "Failed to add reaction" });
  }
});

// Remove a reaction from a comment
router.delete("/api/comments/:commentId/reactions/:reactionType", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const commentId = parseInt(req.params.commentId);
    const { reactionType } = req.params;
    
    await commentsService.removeReaction(commentId, userId, reactionType);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing reaction:", error);
    res.status(500).json({ error: "Failed to remove reaction" });
  }
});

// Watch an entity or thread
router.post("/api/watch", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { watchType, watchId, entityType } = req.body;
    
    const watcher = await commentsService.watchEntity(
      userId,
      watchType,
      watchId,
      entityType
    );
    
    res.json(watcher);
  } catch (error) {
    console.error("Error watching entity:", error);
    res.status(500).json({ error: "Failed to watch entity" });
  }
});

// Unwatch an entity or thread
router.delete("/api/watch", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { watchType, watchId } = req.body;
    
    await commentsService.unwatchEntity(userId, watchType, watchId);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error unwatching entity:", error);
    res.status(500).json({ error: "Failed to unwatch entity" });
  }
});

// Get user's notifications (inbox)
router.get("/api/notifications", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { unreadOnly, limit, offset, category } = req.query;
    
    const notifications = await commentsService.getUserNotifications(userId, {
      unreadOnly: unreadOnly === "true",
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      category: category as string
    });
    
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread notification count
router.get("/api/notifications/unread-count", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const notifications = await commentsService.getUserNotifications(userId, {
      unreadOnly: true
    });
    
    res.json({ count: notifications.length });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// Mark notifications as read
router.post("/api/notifications/mark-read", async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { notificationIds } = req.body;
    
    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ error: "notificationIds must be an array" });
    }
    
    const updated = await commentsService.markNotificationsAsRead(
      notificationIds,
      userId
    );
    
    res.json(updated);
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// Search users for mentions
router.get("/api/users/search", async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    
    // This is a simple implementation - you might want to enhance it
    const users = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        avatar: users.avatar
      })
      .from(users)
      .where(or(
        sql`${users.username} ILIKE ${`%${query}%`}`,
        sql`${users.firstName} ILIKE ${`%${query}%`}`,
        sql`${users.lastName} ILIKE ${`%${query}%`}`
      ))
      .limit(10);
    
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

export default router;