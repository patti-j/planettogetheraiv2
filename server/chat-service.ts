import { db } from "./db";
import { chatChannels, chatMembers, chatReactions, users } from "@shared/schema";
import { eq, and, desc, asc, sql, inArray, or, ilike } from "drizzle-orm";
import { z } from "zod";

// Import chatMessages as any to work around type issues
const chatMessages = (await import("@shared/schema")).chatMessages as any;

// Types
export interface CreateChannelData {
  name: string;
  type: 'direct' | 'group' | 'contextual';
  description?: string;
  contextType?: string;
  contextId?: number;
  isPrivate?: boolean;
  memberIds: number[];
}

export interface SendMessageData {
  channelId: number;
  content: string;
  messageType?: 'text' | 'file' | 'system' | 'mention';
  replyToId?: number;
  attachments?: any[];
  metadata?: any;
}

export class ChatService {
  // =============== CHANNELS ===============
  async getChannelsForUser(userId: number) {
    const channels = await db
      .select({
        id: chatChannels.id,
        name: chatChannels.name,
        type: chatChannels.type,
        description: chatChannels.description,
        contextType: chatChannels.contextType,
        contextId: chatChannels.contextId,
        isPrivate: chatChannels.isPrivate,
        createdBy: chatChannels.createdBy,
        createdAt: chatChannels.createdAt,
        updatedAt: chatChannels.updatedAt,
        lastMessageAt: chatChannels.lastMessageAt,
        // Member info
        memberRole: chatMembers.role,
        lastReadAt: chatMembers.lastReadAt,
      })
      .from(chatChannels)
      .innerJoin(chatMembers, eq(chatChannels.id, chatMembers.channelId))
      .where(eq(chatMembers.userId, userId))
      .orderBy(desc(chatChannels.lastMessageAt));

    // Get member counts and last messages for each channel
    const channelIds = channels.map(c => c.id);
    
    if (channelIds.length === 0) {
      return [];
    }

    const memberCounts = await db
      .select({
        channelId: chatMembers.channelId,
        count: sql<number>`count(*)::int`,
      })
      .from(chatMembers)
      .where(inArray(chatMembers.channelId, channelIds))
      .groupBy(chatMembers.channelId);

    const lastMessages = await db
      .select({
        channelId: chatMessages.channelId,
        content: chatMessages.content,
        senderName: sql<string>`coalesce(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(
        and(
          inArray(chatMessages.channelId, channelIds),
          sql`${chatMessages.id} IN (
            SELECT MAX(id) FROM ${chatMessages} 
            WHERE channel_id = ${chatMessages.channelId} 
            AND deleted_at IS NULL
          )`
        )
      );

    // Calculate unread counts
    const unreadCounts = await db
      .select({
        channelId: chatMessages.channelId,
        count: sql<number>`count(*)::int`,
      })
      .from(chatMessages)
      .innerJoin(chatMembers, eq(chatMessages.channelId, chatMembers.channelId))
      .where(
        and(
          inArray(chatMessages.channelId, channelIds),
          eq(chatMembers.userId, userId),
          or(
            sql`${chatMembers.lastReadAt} IS NULL`,
            sql`${chatMessages.createdAt} > ${chatMembers.lastReadAt}`
          ),
          sql`${chatMessages.deletedAt} IS NULL`
        )
      )
      .groupBy(chatMessages.channelId);

    return channels.map(channel => {
      const memberCount = memberCounts.find(mc => mc.channelId === channel.id)?.count || 0;
      const lastMessage = lastMessages.find(lm => lm.channelId === channel.id);
      const unreadCount = unreadCounts.find(uc => uc.channelId === channel.id)?.count || 0;

      return {
        ...channel,
        participants: memberCount,
        unreadCount,
        lastMessage: lastMessage?.content || null,
        lastMessageSender: lastMessage?.senderName || null,
        lastMessageAt: lastMessage?.createdAt || null,
      };
    });
  }

  async createChannel(data: CreateChannelData, createdBy: number) {
    return await db.transaction(async (tx) => {
      // Create channel
      const [channel] = await tx
        .insert(chatChannels)
        .values({
          name: data.name,
          type: data.type,
          description: data.description || null,
          contextType: data.contextType || null,
          contextId: data.contextId || null,
          isPrivate: data.isPrivate || false,
          createdBy,
        })
        .returning();

      // Add creator as owner
      await tx.insert(chatMembers).values({
        channelId: channel.id,
        userId: createdBy,
        role: "owner",
      });

      // Add other members
      if (data.memberIds.length > 0) {
        const memberValues = data.memberIds
          .filter(id => id !== createdBy) // Don't duplicate creator
          .map(userId => ({
            channelId: channel.id,
            userId,
            role: "member" as const,
          }));

        if (memberValues.length > 0) {
          await tx.insert(chatMembers).values(memberValues);
        }
      }

      return channel;
    });
  }

  async getChannelMembers(channelId: number) {
    return await db
      .select({
        id: chatMembers.id,
        userId: chatMembers.userId,
        role: chatMembers.role,
        joinedAt: chatMembers.joinedAt,
        lastReadAt: chatMembers.lastReadAt,
        // User info
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        avatar: users.avatar,
      })
      .from(chatMembers)
      .innerJoin(users, eq(chatMembers.userId, users.id))
      .where(eq(chatMembers.channelId, channelId))
      .orderBy(asc(chatMembers.joinedAt));
  }

  async addMemberToChannel(channelId: number, userId: number, addedBy: number) {
    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(chatMembers)
      .where(and(
        eq(chatMembers.channelId, channelId),
        eq(chatMembers.userId, userId)
      ))
      .limit(1);

    if (existingMember.length > 0) {
      throw new Error("User is already a member of this channel");
    }

    // Add member
    const [member] = await db
      .insert(chatMembers)
      .values({
        channelId,
        userId,
        role: "member",
      })
      .returning();

    // Send system message
    await this.sendMessage({
      channelId,
      content: `User joined the channel`,
      messageType: "system",
    }, addedBy);

    return member;
  }

  // =============== MESSAGES ===============
  async getMessages(channelId: number, userId: number, limit: number = 50, offset: number = 0) {
    // Update user's last read timestamp
    await db
      .update(chatMembers)
      .set({ lastReadAt: new Date() })
      .where(and(
        eq(chatMembers.channelId, channelId),
        eq(chatMembers.userId, userId)
      ));

    const messages = await db
      .select({
        id: chatMessages.id,
        channelId: chatMessages.channelId,
        senderId: chatMessages.senderId,
        content: chatMessages.content,
        originalLanguage: chatMessages.originalLanguage,
        messageType: chatMessages.messageType,
        replyToId: chatMessages.replyToId,
        attachments: chatMessages.attachments,
        metadata: chatMessages.metadata,
        isEdited: chatMessages.isEdited,
        editedAt: chatMessages.editedAt,
        createdAt: chatMessages.createdAt,
        // Sender info
        senderUsername: users.username,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderAvatar: users.avatar,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(and(
        eq(chatMessages.channelId, channelId),
        sql`${chatMessages.deletedAt} IS NULL`
      ))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get reactions for these messages
    const messageIds = messages.map(m => m.id);
    let reactions: any[] = [];

    if (messageIds.length > 0) {
      reactions = await db
        .select({
          messageId: chatReactions.messageId,
          emoji: chatReactions.emoji,
          userId: chatReactions.userId,
          username: users.username,
          createdAt: chatReactions.createdAt,
        })
        .from(chatReactions)
        .innerJoin(users, eq(chatReactions.userId, users.id))
        .where(inArray(chatReactions.messageId, messageIds));
    }

    return messages.map(message => ({
      ...message,
      sender: {
        id: message.senderId,
        username: message.senderUsername,
        firstName: message.senderFirstName,
        lastName: message.senderLastName,
        avatar: message.senderAvatar,
        displayName: message.senderFirstName && message.senderLastName 
          ? `${message.senderFirstName} ${message.senderLastName}`
          : message.senderUsername,
      },
      reactions: reactions
        .filter(r => r.messageId === message.id)
        .reduce((acc, reaction) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
          }
          acc[reaction.emoji].push({
            userId: reaction.userId,
            username: reaction.username,
            createdAt: reaction.createdAt,
          });
          return acc;
        }, {} as Record<string, any[]>),
    })).reverse(); // Reverse to show oldest first
  }

  async sendMessage(data: SendMessageData, senderId: number) {
    return await db.transaction(async (tx) => {
      // Send message
      const [message] = await tx
        .insert(chatMessages)
        .values({
          channelId: data.channelId,
          senderId,
          content: data.content,
          messageType: data.messageType || "text",
          replyToId: data.replyToId,
          attachments: data.attachments,
          metadata: data.metadata,
        })
        .returning();

      // Update channel's last message timestamp
      await tx
        .update(chatChannels)
        .set({ 
          lastMessageAt: message.createdAt,
          updatedAt: new Date(),
        })
        .where(eq(chatChannels.id, data.channelId));

      // Get sender info for response
      const [sender] = await tx
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          avatar: users.avatar,
        })
        .from(users)
        .where(eq(users.id, senderId));

      return {
        ...message,
        sender: {
          ...sender,
          displayName: sender.firstName && sender.lastName 
            ? `${sender.firstName} ${sender.lastName}`
            : sender.username,
        },
        reactions: {},
      };
    });
  }

  async editMessage(messageId: number, content: string, userId: number) {
    // Verify user owns the message
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(and(
        eq(chatMessages.id, messageId),
        eq(chatMessages.senderId, userId)
      ));

    if (!message) {
      throw new Error("Message not found or you don't have permission to edit it");
    }

    const [updatedMessage] = await db
      .update(chatMessages)
      .set({
        content,
        isEdited: true,
        editedAt: new Date(),
      })
      .where(eq(chatMessages.id, messageId))
      .returning();

    return updatedMessage;
  }

  async deleteMessage(messageId: number, userId: number) {
    // Verify user owns the message
    const [message] = await db
      .select()
      .from(chatMessages)
      .where(and(
        eq(chatMessages.id, messageId),
        eq(chatMessages.senderId, userId)
      ));

    if (!message) {
      throw new Error("Message not found or you don't have permission to delete it");
    }

    await db
      .update(chatMessages)
      .set({ deletedAt: new Date() })
      .where(eq(chatMessages.id, messageId));

    return { success: true };
  }

  // =============== REACTIONS ===============
  async addReaction(messageId: number, emoji: string, userId: number) {
    try {
      const [reaction] = await db
        .insert(chatReactions)
        .values({
          messageId,
          userId,
          emoji,
        })
        .returning();

      return reaction;
    } catch (error) {
      // If unique constraint fails, user already reacted with this emoji
      throw new Error("You have already reacted with this emoji");
    }
  }

  async removeReaction(messageId: number, emoji: string, userId: number) {
    await db
      .delete(chatReactions)
      .where(and(
        eq(chatReactions.messageId, messageId),
        eq(chatReactions.userId, userId),
        eq(chatReactions.emoji, emoji)
      ));

    return { success: true };
  }

  // =============== SEARCH ===============
  async searchMessages(query: string, userId: number, channelId?: number) {
    let whereCondition = and(
      sql`${chatMessages.deletedAt} IS NULL`,
      ilike(chatMessages.content, `%${query}%`)
    );

    if (channelId) {
      whereCondition = and(
        whereCondition,
        eq(chatMessages.channelId, channelId)
      );
    } else {
      // Only search in channels user is a member of
      const userChannels = await db
        .select({ channelId: chatMembers.channelId })
        .from(chatMembers)
        .where(eq(chatMembers.userId, userId));

      const channelIds = userChannels.map(c => c.channelId);
      if (channelIds.length === 0) {
        return [];
      }

      whereCondition = and(
        whereCondition,
        inArray(chatMessages.channelId, channelIds)
      );
    }

    return await db
      .select({
        id: chatMessages.id,
        channelId: chatMessages.channelId,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        channelName: chatChannels.name,
        senderName: sql<string>`coalesce(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
      })
      .from(chatMessages)
      .innerJoin(chatChannels, eq(chatMessages.channelId, chatChannels.id))
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(whereCondition)
      .orderBy(desc(chatMessages.createdAt))
      .limit(50);
  }
}