import { db } from "./db";
import { chatChannels, chatMembers, chatReactions, users } from "@shared/schema";
import { eq, and, desc, asc, sql, inArray, or, ilike } from "drizzle-orm";

export class ChatService {
  async getChannelsForUser(userId: number) {
    try {
      const result = await db.execute(sql`
        SELECT 
          c.id,
          c.name,
          c.type,
          c.description,
          c.is_private as "isPrivate",
          c.created_at as "createdAt",
          c.last_message_at as "lastMessageAt",
          COUNT(cm.user_id)::int as participants,
          0::int as "unreadCount",
          last_msg.content as "lastMessage"
        FROM chat_channels c
        INNER JOIN chat_members cm ON c.id = cm.channel_id
        LEFT JOIN chat_members user_member ON c.id = user_member.channel_id AND user_member.user_id = ${userId}
        LEFT JOIN LATERAL (
          SELECT content
          FROM chat_messages msg
          WHERE msg.channel_id = c.id 
          AND msg.deleted_at IS NULL
          ORDER BY msg.created_at DESC
          LIMIT 1
        ) last_msg ON true
        WHERE user_member.user_id = ${userId}
        GROUP BY c.id, c.name, c.type, c.description, c.is_private, c.created_at, c.last_message_at, last_msg.content
        ORDER BY c.last_message_at DESC NULLS LAST
      `);

      return result.rows;
    } catch (error) {
      console.error("Error fetching channels:", error);
      return [];
    }
  }

  async createChannel(data: {
    name: string;
    type: string;
    description?: string;
    memberIds: number[];
  }, createdBy: number) {
    try {
      const result = await db.execute(sql`
        WITH new_channel AS (
          INSERT INTO chat_channels (name, type, description, created_by)
          VALUES (${data.name}, ${data.type}, ${data.description || null}, ${createdBy})
          RETURNING id, name, type, description, created_by, created_at
        ),
        owner_member AS (
          INSERT INTO chat_members (channel_id, user_id, role)
          SELECT id, ${createdBy}, 'owner'
          FROM new_channel
        )
        SELECT * FROM new_channel
      `);

      const channel = result.rows[0];

      // Add other members
      if (data.memberIds.length > 0) {
        const memberValues = data.memberIds
          .filter(id => id !== createdBy)
          .map(memberId => `(${channel.id}, ${memberId}, 'member')`)
          .join(', ');

        if (memberValues) {
          await db.execute(sql`
            INSERT INTO chat_members (channel_id, user_id, role)
            VALUES ${sql.raw(memberValues)}
          `);
        }
      }

      return channel;
    } catch (error) {
      console.error("Error creating channel:", error);
      throw error;
    }
  }

  async getMessages(channelId: number, userId: number, limit: number = 50) {
    try {
      // Update user's last read timestamp
      await db.execute(sql`
        UPDATE chat_members 
        SET last_read_at = NOW() 
        WHERE channel_id = ${channelId} AND user_id = ${userId}
      `);

      const result = await db.execute(sql`
        SELECT 
          m.id,
          m.channel_id as "channelId",
          m.sender_id as "senderId",
          m.content,
          m.message_type as "messageType",
          m.reply_to_id as "replyToId",
          m.is_edited as "isEdited",
          m.edited_at as "editedAt",
          m.created_at as "createdAt",
          u.username,
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.avatar,
          COALESCE(u.first_name || ' ' || u.last_name, u.username) as "displayName"
        FROM chat_messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.channel_id = ${channelId} 
        AND m.deleted_at IS NULL
        ORDER BY m.created_at ASC
        LIMIT ${limit}
      `);

      return result.rows.map(row => ({
        id: row.id,
        channelId: row.channelId,
        senderId: row.senderId,
        content: row.content,
        messageType: row.messageType || 'text',
        replyToId: row.replyToId,
        isEdited: row.isEdited || false,
        editedAt: row.editedAt,
        createdAt: row.createdAt,
        sender: {
          id: row.senderId,
          username: row.username || '',
          firstName: row.firstName || '',
          lastName: row.lastName || '',
          avatar: row.avatar || null,
          displayName: row.displayName || row.username || 'Unknown User',
        },
        reactions: {},
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  async sendMessage(data: {
    channelId: number;
    content: string;
    messageType?: string;
  }, senderId: number) {
    try {
      const result = await db.execute(sql`
        WITH new_message AS (
          INSERT INTO chat_messages (channel_id, sender_id, content, message_type)
          VALUES (${data.channelId}, ${senderId}, ${data.content}, ${data.messageType || 'text'})
          RETURNING id, channel_id, sender_id, content, message_type, created_at
        ),
        channel_update AS (
          UPDATE chat_channels 
          SET last_message_at = (SELECT created_at FROM new_message),
              updated_at = NOW()
          WHERE id = ${data.channelId}
        )
        SELECT 
          m.*,
          u.username,
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.avatar,
          COALESCE(u.first_name || ' ' || u.last_name, u.username) as "displayName"
        FROM new_message m
        INNER JOIN users u ON m.sender_id = u.id
      `);

      const message = result.rows[0];
      return {
        id: message.id,
        channelId: message.channel_id,
        senderId: message.sender_id,
        content: message.content,
        messageType: message.message_type || 'text',
        isEdited: false,
        editedAt: null,
        createdAt: message.created_at,
        sender: {
          id: message.sender_id,
          username: message.username || '',
          firstName: message.firstName || '',
          lastName: message.lastName || '',
          avatar: message.avatar || null,
          displayName: message.displayName || message.username || 'Unknown User',
        },
        reactions: {},
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async searchMessages(query: string, userId: number) {
    try {
      const result = await db.execute(sql`
        SELECT 
          m.id,
          m.channel_id as "channelId",
          m.content,
          m.created_at as "createdAt",
          c.name as "channelName",
          COALESCE(u.first_name || ' ' || u.last_name, u.username) as "senderName"
        FROM chat_messages m
        INNER JOIN chat_channels c ON m.channel_id = c.id
        INNER JOIN users u ON m.sender_id = u.id
        INNER JOIN chat_members cm ON c.id = cm.channel_id
        WHERE cm.user_id = ${userId}
        AND m.deleted_at IS NULL
        AND m.content ILIKE ${'%' + query + '%'}
        ORDER BY m.created_at DESC
        LIMIT 50
      `);

      return result.rows;
    } catch (error) {
      console.error("Error searching messages:", error);
      return [];
    }
  }

  async getChannelMembers(channelId: number) {
    try {
      const result = await db.execute(sql`
        SELECT 
          cm.id,
          cm.user_id as "userId",
          cm.role,
          cm.joined_at as "joinedAt",
          u.username,
          u.first_name as "firstName",
          u.last_name as "lastName",
          u.email,
          u.avatar
        FROM chat_members cm
        INNER JOIN users u ON cm.user_id = u.id
        WHERE cm.channel_id = ${channelId}
        ORDER BY cm.joined_at ASC
      `);

      return result.rows;
    } catch (error) {
      console.error("Error fetching channel members:", error);
      return [];
    }
  }
}