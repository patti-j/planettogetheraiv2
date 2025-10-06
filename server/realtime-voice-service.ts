/**
 * OpenAI Real-time Voice Service
 * 
 * Provides WebSocket-based real-time voice conversation using OpenAI's Realtime API.
 * This service handles bidirectional audio streaming for natural voice interactions.
 * 
 * Features:
 * - Voice Activity Detection (VAD) for automatic turn-taking
 * - Low latency (~200-300ms response time)
 * - Function calling support for taking actions during conversation
 * - Streaming transcripts and audio responses
 * 
 * Cost: ~$0.15 per minute of conversation (significantly higher than hybrid approach)
 */

import WebSocket from 'ws';
import OpenAI from 'openai';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';

interface RealtimeSession {
  clientWs: WebSocket;
  openaiWs: WebSocket | null;
  userId: number;
  agentId: string;
  isConnected: boolean;
  audioBuffer: Buffer[];
}

export class RealtimeVoiceService {
  private sessions: Map<string, RealtimeSession> = new Map();
  private openai: OpenAI;
  private jwtSecret: string;

  constructor(jwtSecret: string) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.jwtSecret = jwtSecret;
  }

  /**
   * Handle new WebSocket connection from client
   */
  async handleConnection(clientWs: WebSocket, req: IncomingMessage) {
    // Authenticate user
    const user = await this.authenticateClient(req);
    if (!user) {
      clientWs.close(1008, 'Unauthorized');
      return;
    }

    const sessionId = `${user.id}-${Date.now()}`;
    const session: RealtimeSession = {
      clientWs,
      openaiWs: null,
      userId: user.id,
      agentId: 'max', // Default agent
      isConnected: false,
      audioBuffer: []
    };

    this.sessions.set(sessionId, session);
    console.log(`[Realtime Voice] New session created: ${sessionId} for user ${user.id}`);

    // Handle client messages
    clientWs.on('message', async (data: Buffer) => {
      await this.handleClientMessage(sessionId, data);
    });

    // Handle client disconnect
    clientWs.on('close', () => {
      this.handleClientDisconnect(sessionId);
    });

    // Handle client errors
    clientWs.on('error', (error) => {
      console.error(`[Realtime Voice] Client error for session ${sessionId}:`, error);
      this.handleClientDisconnect(sessionId);
    });

    // Send initial connection confirmation
    this.sendToClient(clientWs, {
      type: 'connection.established',
      sessionId,
      message: 'Real-time voice service connected'
    });
  }

  /**
   * Authenticate WebSocket client using JWT token
   * 
   * Requires valid JWT token from query parameter or Authorization header.
   * Frontend obtains JWT token via /api/auth/dev-token (development) or
   * regular login flow (production).
   */
  private async authenticateClient(req: IncomingMessage): Promise<{ id: number; username: string } | null> {
    try {
      // Extract JWT token from query parameter or Authorization header
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || 
                   req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        console.error('[Realtime Voice] No authentication token provided');
        return null;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: number; username: string };
      console.log(`[Realtime Voice] ✅ Authenticated user ${decoded.username} (ID: ${decoded.userId})`);
      return { id: decoded.userId, username: decoded.username };
    } catch (error) {
      console.error('[Realtime Voice] Authentication failed:', error);
      return null;
    }
  }

  /**
   * Handle incoming message from client
   */
  private async handleClientMessage(sessionId: string, data: Buffer) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'session.start':
          await this.startOpenAISession(session, message);
          break;

        case 'audio.data':
          // Forward audio to OpenAI
          if (session.openaiWs && session.isConnected) {
            const audioPayload = {
              type: 'input_audio_buffer.append',
              audio: message.audio // base64-encoded PCM16 audio
            };
            session.openaiWs.send(JSON.stringify(audioPayload));
          }
          break;

        case 'message.send':
          // Send text message
          if (session.openaiWs && session.isConnected) {
            const textPayload = {
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: message.text }]
              }
            };
            session.openaiWs.send(JSON.stringify(textPayload));
            session.openaiWs.send(JSON.stringify({ type: 'response.create' }));
          }
          break;

        case 'session.stop':
          this.stopOpenAISession(session);
          break;

        default:
          console.warn(`[Realtime Voice] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[Realtime Voice] Error handling client message:`, error);
    }
  }

  /**
   * Start OpenAI Realtime API session
   */
  private async startOpenAISession(session: RealtimeSession, config: any) {
    if (session.openaiWs) {
      console.warn('[Realtime Voice] OpenAI session already active');
      return;
    }

    try {
      // Connect to OpenAI Realtime API
      const model = config.model || 'gpt-4o-realtime-preview-2024-12-17';
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
      
      const openaiWs = new WebSocket(wsUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      session.openaiWs = openaiWs;

      // Handle OpenAI connection opened
      openaiWs.on('open', () => {
        console.log('[Realtime Voice] Connected to OpenAI Realtime API');
        session.isConnected = true;

        // Configure session
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            voice: config.voice || 'alloy',
            instructions: this.getAgentInstructions(session.agentId),
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: config.vadMode || 'server_vad',
              threshold: config.vadThreshold || 0.5,
              silence_duration_ms: config.silenceDuration || 500,
              prefix_padding_ms: 300
            },
            tools: this.getAgentTools(session.agentId),
            tool_choice: 'auto'
          }
        };

        openaiWs.send(JSON.stringify(sessionConfig));

        // Send confirmation to client
        this.sendToClient(session.clientWs, {
          type: 'session.started',
          message: 'Voice conversation started'
        });
      });

      // Handle OpenAI messages
      openaiWs.on('message', (data: Buffer) => {
        this.handleOpenAIMessage(session, data);
      });

      // Handle OpenAI errors
      openaiWs.on('error', (error) => {
        console.error('[Realtime Voice] OpenAI WebSocket error:', error);
        this.sendToClient(session.clientWs, {
          type: 'error',
          message: 'Voice service error occurred'
        });
      });

      // Handle OpenAI connection closed
      openaiWs.on('close', () => {
        console.log('[Realtime Voice] OpenAI connection closed');
        session.isConnected = false;
        session.openaiWs = null;
        
        this.sendToClient(session.clientWs, {
          type: 'session.ended',
          message: 'Voice conversation ended'
        });
      });

    } catch (error) {
      console.error('[Realtime Voice] Failed to connect to OpenAI:', error);
      this.sendToClient(session.clientWs, {
        type: 'error',
        message: 'Failed to start voice service'
      });
    }
  }

  /**
   * Handle message from OpenAI
   */
  private handleOpenAIMessage(session: RealtimeSession, data: Buffer) {
    try {
      const event = JSON.parse(data.toString());

      // Forward relevant events to client
      switch (event.type) {
        case 'session.created':
          console.log('[Realtime Voice] OpenAI session created');
          break;

        case 'response.audio.delta':
          // Stream audio to client
          this.sendToClient(session.clientWs, {
            type: 'audio.delta',
            audio: event.delta, // base64-encoded audio
            item_id: event.item_id
          });
          break;

        case 'response.audio_transcript.delta':
          // Stream transcript to client
          this.sendToClient(session.clientWs, {
            type: 'transcript.delta',
            text: event.delta,
            item_id: event.item_id
          });
          break;

        case 'conversation.item.input_audio_transcription.completed':
          // User's speech transcription
          this.sendToClient(session.clientWs, {
            type: 'user.transcript',
            text: event.transcript,
            item_id: event.item_id
          });
          break;

        case 'response.function_call_arguments.done':
          // Function call requested by AI
          this.handleFunctionCall(session, event);
          break;

        case 'response.done':
          // Response complete
          this.sendToClient(session.clientWs, {
            type: 'response.complete',
            response: event.response
          });
          break;

        case 'error':
          console.error('[Realtime Voice] OpenAI error:', event.error);
          this.sendToClient(session.clientWs, {
            type: 'error',
            message: event.error.message || 'An error occurred'
          });
          break;

        default:
          // Log unhandled events for debugging
          console.log(`[Realtime Voice] Unhandled event: ${event.type}`);
      }
    } catch (error) {
      console.error('[Realtime Voice] Error handling OpenAI message:', error);
    }
  }

  /**
   * Handle function calls from AI
   */
  private async handleFunctionCall(session: RealtimeSession, event: any) {
    const { call_id, name, arguments: argsString } = event;
    
    try {
      const args = JSON.parse(argsString);
      console.log(`[Realtime Voice] Function call: ${name}`, args);

      let result: any = { success: false, message: 'Function not implemented' };

      // Handle navigation
      if (name === 'navigate_to_page') {
        result = {
          success: true,
          action: 'navigate',
          target: args.path
        };
      }
      // Handle chart creation
      else if (name === 'create_chart') {
        result = {
          success: true,
          action: 'create_chart',
          chartType: args.type,
          data: args.data
        };
      }
      // Handle agent switching
      else if (name === 'switch_agent') {
        result = {
          success: true,
          action: 'switch_agent',
          agentId: args.agentId
        };
      }

      // Send function result back to OpenAI
      const functionOutput = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id,
          output: JSON.stringify(result)
        }
      };

      session.openaiWs?.send(JSON.stringify(functionOutput));

      // Also send action to client if needed
      if (result.success && result.action) {
        this.sendToClient(session.clientWs, {
          type: 'action.requested',
          action: result.action,
          ...result
        });
      }
    } catch (error) {
      console.error('[Realtime Voice] Function call error:', error);
    }
  }

  /**
   * Get agent-specific instructions
   */
  private getAgentInstructions(agentId: string): string {
    const instructions: Record<string, string> = {
      max: 'You are Max, an AI assistant for PlanetTogether manufacturing system. Help users with production scheduling, shop floor management, and system navigation. Be concise and action-oriented.',
      production_scheduling: 'You are a production scheduling expert. Help optimize schedules, analyze bottlenecks, and provide scheduling recommendations.',
      shop_floor: 'You are a shop floor management assistant. Help with real-time production monitoring, operator tasks, and equipment status.',
      quality_analysis: 'You are a quality management expert. Help analyze quality metrics, identify issues, and recommend improvements.',
      predictive_maintenance: 'You are a predictive maintenance specialist. Help monitor equipment health, predict failures, and schedule maintenance.'
    };

    return instructions[agentId] || instructions.max;
  }

  /**
   * Get agent-specific tools (functions AI can call)
   */
  private getAgentTools(agentId: string): any[] {
    return [
      {
        type: 'function',
        name: 'navigate_to_page',
        description: 'Navigate to a different page in the application',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The page path to navigate to (e.g., /production-scheduler, /shop-floor)'
            }
          },
          required: ['path']
        }
      },
      {
        type: 'function',
        name: 'create_chart',
        description: 'Create a data visualization chart',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['bar', 'line', 'pie', 'gauge'],
              description: 'The type of chart to create'
            },
            data: {
              type: 'object',
              description: 'The data for the chart'
            }
          },
          required: ['type']
        }
      },
      {
        type: 'function',
        name: 'switch_agent',
        description: 'Switch to a different AI agent specialist',
        parameters: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              enum: ['production_scheduling', 'shop_floor', 'quality_analysis', 'predictive_maintenance'],
              description: 'The ID of the agent to switch to'
            }
          },
          required: ['agentId']
        }
      }
    ];
  }

  /**
   * Stop OpenAI session
   */
  private stopOpenAISession(session: RealtimeSession) {
    if (session.openaiWs) {
      session.openaiWs.close();
      session.openaiWs = null;
      session.isConnected = false;
      console.log('[Realtime Voice] OpenAI session stopped');
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClientDisconnect(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`[Realtime Voice] Client disconnected: ${sessionId}`);
      this.stopOpenAISession(session);
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Send message to client
   */
  private sendToClient(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessions(): number {
    return this.sessions.size;
  }

  /**
   * Cleanup all sessions
   */
  cleanup() {
    console.log('[Realtime Voice] Cleaning up all sessions');
    this.sessions.forEach((session, sessionId) => {
      this.stopOpenAISession(session);
      session.clientWs.close();
    });
    this.sessions.clear();
  }
}
