import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { REALTIME_MODEL_CONFIG } from '../config/ai-model';

interface RealtimeSession {
  id: string;
  ws: WebSocket | null;
  userId: number;
  agentId: string;
  isConnected: boolean;
  conversationId: string;
  events: EventEmitter;
  audioBuffer: Buffer[];
  responseAudioBuffer: Buffer[];
}

interface SessionConfig {
  userId: number;
  agentId: string;
  instructions?: string;
  voice?: string;
  temperature?: number;
}

class RealtimeVoiceService {
  private sessions: Map<string, RealtimeSession> = new Map();
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not found for Realtime Voice Service');
    }
  }

  /**
   * Create a new real-time voice session
   */
  async createSession(config: SessionConfig): Promise<string> {
    const sessionId = `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversationId = `conv_${Date.now()}`;

    const session: RealtimeSession = {
      id: sessionId,
      ws: null,
      userId: config.userId,
      agentId: config.agentId,
      isConnected: false,
      conversationId,
      events: new EventEmitter(),
      audioBuffer: [],
      responseAudioBuffer: [],
    };

    this.sessions.set(sessionId, session);

    // Connect to OpenAI Realtime API
    await this.connectToRealtime(sessionId, config);

    return sessionId;
  }

  /**
   * Connect to OpenAI's Realtime API via WebSocket
   */
  private async connectToRealtime(sessionId: string, config: SessionConfig): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const wsUrl = `${REALTIME_MODEL_CONFIG.connection.websocketUrl}?model=${REALTIME_MODEL_CONFIG.model}`;
    
    console.log(`🎤 Connecting to Realtime API with ${REALTIME_MODEL_CONFIG.model}...`);
    
    // The third parameter is for subprotocols
    const ws = new WebSocket(wsUrl, 'openai-realtime', {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1', // Required for Realtime API GA
      },
    });

    session.ws = ws;

    // Handle WebSocket events
    ws.on('open', () => {
      console.log(`✅ Connected to Realtime API for session ${sessionId}`);
      session.isConnected = true;

      // Configure the session
      const sessionUpdate = {
        type: 'session.update',
        session: {
          type: 'realtime',
          model: REALTIME_MODEL_CONFIG.model,
          instructions: config.instructions || 'You are a helpful manufacturing assistant for PlanetTogether. Keep responses concise and focused.',
          voice: config.voice || REALTIME_MODEL_CONFIG.voice,
          temperature: config.temperature || REALTIME_MODEL_CONFIG.temperature,
          audio: REALTIME_MODEL_CONFIG.audio,
          turn_detection: REALTIME_MODEL_CONFIG.turnDetection,
          input_audio_format: REALTIME_MODEL_CONFIG.audio.input.format,
          output_audio_format: REALTIME_MODEL_CONFIG.audio.output.format,
        },
      };

      ws.send(JSON.stringify(sessionUpdate));
      console.log('📝 Session configured with voice:', sessionUpdate.session.voice);

      session.events.emit('connected');
    });

    ws.on('message', (data: Buffer) => {
      try {
        const event = JSON.parse(data.toString());
        this.handleRealtimeEvent(sessionId, event);
      } catch (error) {
        console.error('Failed to parse Realtime API message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for session ${sessionId}:`, error);
      session.events.emit('error', error);
    });

    ws.on('close', () => {
      console.log(`🔌 Disconnected from Realtime API for session ${sessionId}`);
      session.isConnected = false;
      session.events.emit('disconnected');
      this.sessions.delete(sessionId);
    });
  }

  /**
   * Handle events from the Realtime API
   */
  private handleRealtimeEvent(sessionId: string, event: any) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`📨 Realtime event (${event.type}):`, event.type === 'response.output_audio.delta' ? 'audio chunk' : event);

    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        console.log('✅ Session ready:', event.session);
        session.events.emit('session_ready', event.session);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('🎙️ User started speaking');
        session.events.emit('user_speaking_start');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('🎙️ User stopped speaking');
        session.events.emit('user_speaking_stop');
        break;

      case 'conversation.item.added':
        if (event.item.type === 'message' && event.item.role === 'user') {
          console.log('💬 User message:', event.item.content?.[0]?.text);
          session.events.emit('user_message', event.item.content?.[0]?.text);
        }
        break;

      case 'response.output_text.delta':
        // Text response chunk
        session.events.emit('text_delta', event.delta);
        break;

      case 'response.output_audio.delta':
        // Audio response chunk
        const audioChunk = Buffer.from(event.delta, 'base64');
        session.responseAudioBuffer.push(audioChunk);
        session.events.emit('audio_delta', audioChunk);
        break;

      case 'response.output_audio_transcript.delta':
        // Transcript of what the AI is saying
        session.events.emit('transcript_delta', event.delta);
        break;

      case 'response.output_text.done':
        console.log('📝 Text response complete:', event.text);
        session.events.emit('text_complete', event.text);
        break;

      case 'response.output_audio.done':
        console.log('🔊 Audio response complete');
        const completeAudio = Buffer.concat(session.responseAudioBuffer);
        session.responseAudioBuffer = []; // Clear buffer
        session.events.emit('audio_complete', completeAudio);
        break;

      case 'response.output_audio_transcript.done':
        console.log('📄 Transcript complete:', event.transcript);
        session.events.emit('transcript_complete', event.transcript);
        break;

      case 'response.done':
        console.log('✅ Full response complete');
        session.events.emit('response_complete', event.response);
        break;

      case 'error':
        console.error('❌ Realtime API error:', event.error);
        session.events.emit('error', event.error);
        break;

      default:
        console.log('🔍 Unhandled event type:', event.type);
    }
  }

  /**
   * Send audio input to the Realtime API
   */
  sendAudioInput(sessionId: string, audioData: Buffer): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || !session.isConnected) {
      console.warn('Cannot send audio: session not connected');
      return;
    }

    // Convert audio to base64
    const base64Audio = audioData.toString('base64');

    const audioEvent = {
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    };

    session.ws.send(JSON.stringify(audioEvent));
  }

  /**
   * Send text input to the Realtime API
   */
  sendTextInput(sessionId: string, text: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || !session.isConnected) {
      console.warn('Cannot send text: session not connected');
      return;
    }

    const textEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      },
    };

    session.ws.send(JSON.stringify(textEvent));
    console.log('📤 Sent text to Realtime API:', text);

    // Trigger response generation
    session.ws.send(JSON.stringify({ type: 'response.create' }));
  }

  /**
   * Commit audio buffer and get response
   */
  commitAudioAndRespond(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.ws || !session.isConnected) {
      console.warn('Cannot commit audio: session not connected');
      return;
    }

    // Commit the audio buffer
    session.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    
    // Request response
    session.ws.send(JSON.stringify({ type: 'response.create' }));
    
    console.log('🎤 Committed audio buffer and requested response');
  }

  /**
   * Get session event emitter for listening to events
   */
  getSessionEvents(sessionId: string): EventEmitter | null {
    const session = this.sessions.get(sessionId);
    return session ? session.events : null;
  }

  /**
   * Close a session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.ws) {
      session.ws.close();
    }

    this.sessions.delete(sessionId);
    console.log(`🔒 Closed session ${sessionId}`);
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: number): string[] {
    const userSessions: string[] = [];
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        userSessions.push(sessionId);
      }
    }
    return userSessions;
  }

  /**
   * Check if a session is active
   */
  isSessionActive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return !!session && session.isConnected;
  }
}

// Export singleton instance
export const realtimeVoiceService = new RealtimeVoiceService();