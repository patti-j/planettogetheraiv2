import { db } from "./db";
import { 
  comments, 
  commentMentions, 
  notifications,
  commentAttachments,
  commentReactions,
  commentWatchers,
  users
} from "@shared/schema";
import { eq, and, or, desc, asc, sql, inArray } from "drizzle-orm";
import type { 
  Comment, 
  InsertComment, 
  CommentMention,
  Notification,
  CommentReaction 
} from "@shared/schema";

export class CommentsService {
  // Create a new comment
  async createComment(data: {
    entityType: string;
    entityId: number;
    content: string;
    plainTextContent?: string;
    authorId: number;
    parentCommentId?: number;
    contextArea?: string;
    mentions?: number[];
    attachments?: any[];
    isPrivate?: boolean;
  }) {
    return await db.transaction(async (tx) => {
      // Determine thread information
      let threadRootId: number | null = null;
      let threadDepth = 0;
      
      if (data.parentCommentId) {
        const parentComment = await tx
          .select()
          .from(comments)
          .where(eq(comments.id, data.parentCommentId))
          .limit(1);
        
        if (parentComment.length > 0) {
          threadRootId = parentComment[0].threadRootId || parentComment[0].id;
          threadDepth = (parentComment[0].threadDepth || 0) + 1;
        }
      }
      
      // Create the comment
      const [newComment] = await tx
        .insert(comments)
        .values({
          entityType: data.entityType,
          entityId: data.entityId,
          content: data.content,
          plainTextContent: data.plainTextContent || this.extractPlainText(data.content),
          authorId: data.authorId,
          parentCommentId: data.parentCommentId || null,
          threadRootId: threadRootId,
          threadDepth: threadDepth,
          contextArea: data.contextArea,
          isPrivate: data.isPrivate || false,
          metadata: {
            mentions: data.mentions || [],
            attachmentCount: data.attachments?.length || 0
          }
        })
        .returning();
      
      // Set threadRootId to self if this is a root comment
      if (!data.parentCommentId) {
        await tx
          .update(comments)
          .set({ threadRootId: newComment.id })
          .where(eq(comments.id, newComment.id));
      }
      
      // Handle mentions
      if (data.mentions && data.mentions.length > 0) {
        await this.createMentions(tx, newComment.id, data.authorId, data.mentions);
        await this.createMentionNotifications(
          tx, 
          newComment.id, 
          data.authorId, 
          data.mentions,
          data.entityType,
          data.entityId,
          data.content
        );
      }
      
      // Handle attachments
      if (data.attachments && data.attachments.length > 0) {
        await this.createAttachments(tx, newComment.id, data.attachments);
      }
      
      // Create notification for parent comment author if this is a reply
      if (data.parentCommentId) {
        const parentComment = await tx
          .select()
          .from(comments)
          .where(eq(comments.id, data.parentCommentId))
          .limit(1);
        
        if (parentComment.length > 0 && parentComment[0].authorId !== data.authorId) {
          await this.createReplyNotification(
            tx,
            newComment.id,
            data.authorId,
            parentComment[0].authorId,
            data.entityType,
            data.entityId,
            data.content
          );
        }
      }
      
      // Notify watchers
      await this.notifyWatchers(
        tx,
        newComment.id,
        data.authorId,
        data.entityType,
        data.entityId,
        threadRootId || newComment.id
      );
      
      return newComment;
    });
  }
  
  // Get comments for an entity
  async getComments(
    entityType: string,
    entityId: number,
    options?: {
      includeDeleted?: boolean;
      sortOrder?: "asc" | "desc";
      limit?: number;
      offset?: number;
      threadId?: number;
    }
  ) {
    const conditions = [
      eq(comments.entityType, entityType),
      eq(comments.entityId, entityId)
    ];
    
    if (!options?.includeDeleted) {
      conditions.push(sql`${comments.status} != 'deleted'`);
    }
    
    if (options?.threadId) {
      conditions.push(eq(comments.threadRootId, options.threadId));
    }
    
    const query = db
      .select({
        comment: comments,
        author: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar
        }
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(and(...conditions))
      .orderBy(
        options?.sortOrder === "desc" 
          ? desc(comments.createdAt) 
          : asc(comments.createdAt)
      );
    
    if (options?.limit) {
      query.limit(options.limit);
    }
    
    if (options?.offset) {
      query.offset(options.offset);
    }
    
    const results = await query;
    
    // Get reactions, mentions, and attachments for each comment
    const commentIds = results.map(r => r.comment.id);
    
    const [reactions, mentions, attachments] = await Promise.all([
      this.getReactionsForComments(commentIds),
      this.getMentionsForComments(commentIds),
      this.getAttachmentsForComments(commentIds)
    ]);
    
    // Combine all data
    return results.map(r => ({
      ...r.comment,
      author: r.author,
      reactions: reactions[r.comment.id] || [],
      mentions: mentions[r.comment.id] || [],
      attachments: attachments[r.comment.id] || []
    }));
  }
  
  // Update a comment
  async updateComment(
    commentId: number,
    userId: number,
    content: string,
    mentions?: number[]
  ) {
    return await db.transaction(async (tx) => {
      // Get the original comment
      const [originalComment] = await tx
        .select()
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);
      
      if (!originalComment || originalComment.authorId !== userId) {
        throw new Error("Comment not found or unauthorized");
      }
      
      // Update comment
      const [updated] = await tx
        .update(comments)
        .set({
          content: content,
          plainTextContent: this.extractPlainText(content),
          isEdited: true,
          editedAt: new Date(),
          editHistory: sql`
            COALESCE(${comments.editHistory}, '[]'::jsonb) || 
            ${JSON.stringify([{
              content: originalComment.content,
              editedAt: new Date().toISOString(),
              editedBy: userId
            }])}::jsonb
          `,
          metadata: {
            ...((originalComment.metadata as any) || {}),
            mentions: mentions || []
          }
        })
        .where(eq(comments.id, commentId))
        .returning();
      
      // Update mentions if provided
      if (mentions) {
        // Remove old mentions
        await tx
          .delete(commentMentions)
          .where(eq(commentMentions.commentId, commentId));
        
        // Add new mentions
        if (mentions.length > 0) {
          await this.createMentions(tx, commentId, userId, mentions);
          await this.createMentionNotifications(
            tx,
            commentId,
            userId,
            mentions,
            originalComment.entityType,
            originalComment.entityId,
            content
          );
        }
      }
      
      return updated;
    });
  }
  
  // Delete a comment (soft delete)
  async deleteComment(commentId: number, userId: number) {
    const [deleted] = await db
      .update(comments)
      .set({
        status: "deleted",
        deletedAt: new Date(),
        deletedBy: userId
      })
      .where(and(
        eq(comments.id, commentId),
        eq(comments.authorId, userId)
      ))
      .returning();
    
    return deleted;
  }
  
  // Add a reaction to a comment
  async addReaction(
    commentId: number,
    userId: number,
    reactionType: string
  ) {
    const [reaction] = await db
      .insert(commentReactions)
      .values({
        commentId,
        userId,
        reactionType
      })
      .onConflictDoNothing()
      .returning();
    
    // Update reaction count
    if (reaction) {
      await db
        .update(comments)
        .set({
          reactionCounts: sql`
            COALESCE(${comments.reactionCounts}, '{}'::jsonb) || 
            jsonb_build_object(
              ${reactionType}, 
              COALESCE((${comments.reactionCounts}->>${reactionType})::int, 0) + 1
            )
          `
        })
        .where(eq(comments.id, commentId));
    }
    
    return reaction;
  }
  
  // Remove a reaction from a comment
  async removeReaction(
    commentId: number,
    userId: number,
    reactionType: string
  ) {
    const deleted = await db
      .delete(commentReactions)
      .where(and(
        eq(commentReactions.commentId, commentId),
        eq(commentReactions.userId, userId),
        eq(commentReactions.reactionType, reactionType)
      ))
      .returning();
    
    // Update reaction count
    if (deleted.length > 0) {
      await db
        .update(comments)
        .set({
          reactionCounts: sql`
            COALESCE(${comments.reactionCounts}, '{}'::jsonb) || 
            jsonb_build_object(
              ${reactionType}, 
              GREATEST(COALESCE((${comments.reactionCounts}->>${reactionType})::int, 0) - 1, 0)
            )
          `
        })
        .where(eq(comments.id, commentId));
    }
    
    return deleted;
  }
  
  // Watch a thread or entity for updates
  async watchEntity(
    userId: number,
    watchType: "comment" | "thread" | "entity",
    watchId: number,
    entityType?: string
  ) {
    const [watcher] = await db
      .insert(commentWatchers)
      .values({
        userId,
        watchType,
        watchId,
        entityType
      })
      .onConflictDoNothing()
      .returning();
    
    return watcher;
  }
  
  // Unwatch a thread or entity
  async unwatchEntity(
    userId: number,
    watchType: "comment" | "thread" | "entity",
    watchId: number
  ) {
    const deleted = await db
      .delete(commentWatchers)
      .where(and(
        eq(commentWatchers.userId, userId),
        eq(commentWatchers.watchType, watchType),
        eq(commentWatchers.watchId, watchId)
      ))
      .returning();
    
    return deleted;
  }
  
  // Get user's notifications (inbox)
  async getUserNotifications(
    userId: number,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
      category?: string;
    }
  ) {
    const conditions = [eq(notifications.userId, userId)];
    
    if (options?.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }
    
    if (options?.category) {
      conditions.push(eq(notifications.category, options.category));
    }
    
    conditions.push(eq(notifications.isArchived, false));
    
    const query = db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
    
    if (options?.limit) {
      query.limit(options.limit);
    }
    
    if (options?.offset) {
      query.offset(options.offset);
    }
    
    return await query;
  }
  
  // Mark notifications as read
  async markNotificationsAsRead(notificationIds: number[], userId: number) {
    return await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(and(
        inArray(notifications.id, notificationIds),
        eq(notifications.userId, userId)
      ))
      .returning();
  }
  
  // Private helper methods
  
  private extractPlainText(content: string): string {
    // Simple extraction - can be enhanced based on content format
    return content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }
  
  private async createMentions(
    tx: any,
    commentId: number,
    mentionedBy: number,
    userIds: number[]
  ) {
    const mentionData = userIds.map(userId => ({
      commentId,
      userId,
      mentionedBy
    }));
    
    await tx.insert(commentMentions).values(mentionData);
  }
  
  private async createMentionNotifications(
    tx: any,
    commentId: number,
    authorId: number,
    mentionedUserIds: number[],
    entityType: string,
    entityId: number,
    content: string
  ) {
    const [author] = await tx
      .select()
      .from(users)
      .where(eq(users.id, authorId))
      .limit(1);
    
    const notificationData = mentionedUserIds.map(userId => ({
      userId,
      type: "mention",
      category: "comment",
      priority: "normal",
      sourceType: "comment",
      sourceId: commentId,
      relatedEntityType: entityType,
      relatedEntityId: entityId,
      title: `${author?.firstName || author?.username} mentioned you`,
      message: `You were mentioned in a comment`,
      actionUrl: `/${entityType}/${entityId}#comment-${commentId}`,
      metadata: {
        commentSnippet: content.substring(0, 100),
        authorName: `${author?.firstName} ${author?.lastName}`,
        authorAvatar: author?.avatar
      }
    }));
    
    await tx.insert(notifications).values(notificationData);
  }
  
  private async createReplyNotification(
    tx: any,
    commentId: number,
    authorId: number,
    parentAuthorId: number,
    entityType: string,
    entityId: number,
    content: string
  ) {
    const [author] = await tx
      .select()
      .from(users)
      .where(eq(users.id, authorId))
      .limit(1);
    
    await tx.insert(notifications).values({
      userId: parentAuthorId,
      type: "reply",
      category: "comment",
      priority: "normal",
      sourceType: "comment",
      sourceId: commentId,
      relatedEntityType: entityType,
      relatedEntityId: entityId,
      title: `${author?.firstName || author?.username} replied to your comment`,
      message: `New reply to your comment`,
      actionUrl: `/${entityType}/${entityId}#comment-${commentId}`,
      metadata: {
        commentSnippet: content.substring(0, 100),
        authorName: `${author?.firstName} ${author?.lastName}`,
        authorAvatar: author?.avatar
      }
    });
  }
  
  private async notifyWatchers(
    tx: any,
    commentId: number,
    authorId: number,
    entityType: string,
    entityId: number,
    threadId: number
  ) {
    // Get all watchers for this entity and thread
    const watchers = await tx
      .select()
      .from(commentWatchers)
      .where(or(
        and(
          eq(commentWatchers.watchType, "entity"),
          eq(commentWatchers.watchId, entityId),
          eq(commentWatchers.entityType, entityType)
        ),
        and(
          eq(commentWatchers.watchType, "thread"),
          eq(commentWatchers.watchId, threadId)
        )
      ));
    
    // Filter out the comment author
    const watchersToNotify = watchers.filter(w => w.userId !== authorId);
    
    if (watchersToNotify.length > 0) {
      const [author] = await tx
        .select()
        .from(users)
        .where(eq(users.id, authorId))
        .limit(1);
      
      const notificationData = watchersToNotify.map(watcher => ({
        userId: watcher.userId,
        type: "comment_on_watched",
        category: "comment",
        priority: "normal",
        sourceType: "comment",
        sourceId: commentId,
        relatedEntityType: entityType,
        relatedEntityId: entityId,
        title: `New comment on watched ${entityType}`,
        message: `${author?.firstName || author?.username} commented`,
        actionUrl: `/${entityType}/${entityId}#comment-${commentId}`,
        metadata: {
          authorName: `${author?.firstName} ${author?.lastName}`,
          authorAvatar: author?.avatar
        }
      }));
      
      await tx.insert(notifications).values(notificationData);
    }
  }
  
  private async getReactionsForComments(commentIds: number[]) {
    if (commentIds.length === 0) return {};
    
    const reactions = await db
      .select({
        commentId: commentReactions.commentId,
        userId: commentReactions.userId,
        reactionType: commentReactions.reactionType,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(commentReactions)
      .leftJoin(users, eq(commentReactions.userId, users.id))
      .where(inArray(commentReactions.commentId, commentIds));
    
    const grouped: Record<number, any[]> = {};
    reactions.forEach(r => {
      if (!grouped[r.commentId]) {
        grouped[r.commentId] = [];
      }
      grouped[r.commentId].push({
        type: r.reactionType,
        user: r.user
      });
    });
    
    return grouped;
  }
  
  private async getMentionsForComments(commentIds: number[]) {
    if (commentIds.length === 0) return {};
    
    const mentions = await db
      .select({
        commentId: commentMentions.commentId,
        user: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(commentMentions)
      .leftJoin(users, eq(commentMentions.userId, users.id))
      .where(inArray(commentMentions.commentId, commentIds));
    
    const grouped: Record<number, any[]> = {};
    mentions.forEach(m => {
      if (!grouped[m.commentId]) {
        grouped[m.commentId] = [];
      }
      grouped[m.commentId].push(m.user);
    });
    
    return grouped;
  }
  
  private async getAttachmentsForComments(commentIds: number[]) {
    if (commentIds.length === 0) return {};
    
    const attachments = await db
      .select()
      .from(commentAttachments)
      .where(inArray(commentAttachments.commentId, commentIds));
    
    const grouped: Record<number, any[]> = {};
    attachments.forEach(a => {
      if (!grouped[a.commentId]) {
        grouped[a.commentId] = [];
      }
      grouped[a.commentId].push({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileType: a.fileType,
        fileSize: a.fileSize
      });
    });
    
    return grouped;
  }
  
  private async createAttachments(tx: any, commentId: number, attachments: any[]) {
    const attachmentData = attachments.map(a => ({
      commentId,
      fileName: a.name,
      fileUrl: a.url,
      fileType: a.type,
      fileSize: a.size
    }));
    
    await tx.insert(commentAttachments).values(attachmentData);
  }
}

export const commentsService = new CommentsService();