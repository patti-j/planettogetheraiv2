/**
 * React Hook for OpenAI Realtime Voice API
 * 
 * This hook provides a seamless interface to OpenAI's Realtime Voice API
 * for low-latency, conversational AI interactions with streaming audio.
 * 
 * Features:
 * - WebSocket-based bidirectional audio streaming
 * - Real-time transcription of user speech
 * - Voice Activity Detection (VAD) for natural turn-taking
 * - Function calling support for triggering actions
 * - Streaming audio playback of AI responses
 * 
 * Cost: ~$0.15 per minute (significantly higher than hybrid approach)
 * Latency: ~200-300ms for response start
 * 
 * Usage:
 * ```tsx
 * const {
 *   isConnected,
 *   isListening,
 *   startSession,
 *   stopSession,
 *   sendTextMessage,
 *   userTranscript,
 *   aiTranscript
 * } = useRealtimeVoice({
 *   agentId: 'max',
 *   onAction: (action) => console.log('Action:', action)
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface RealtimeVoiceConfig {
  agentId?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  vadMode?: 'server_vad' | 'semantic_vad' | 'none';
  vadThreshold?: number;
  silenceDuration?: number;
  model?: string;
  onAction?: (action: any) => void;
  onError?: (error: string) => void;
}

interface RealtimeVoiceState {
  isConnected: boolean;
  isListening: boolean;
  isSessionActive: boolean;
  isSpeaking: boolean;
  userTranscript: string;
  aiTranscript: string;
  error: string | null;
}

export function useRealtimeVoice(config: RealtimeVoiceConfig = {}) {
  const {
    agentId = 'max',
    voice = 'alloy',
    vadMode = 'server_vad',
    vadThreshold = 0.5,
    silenceDuration = 500,
    model = 'gpt-4o-realtime-preview-2024-12-17',
    onAction,
    onError
  } = config;

  const [state, setState] = useState<RealtimeVoiceState>({
    isConnected: false,
    isListening: false,
    isSessionActive: false,
    isSpeaking: false,
    userTranscript: '',
    aiTranscript: '',
    error: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  /**
   * Initialize WebSocket connection to realtime voice service
   */
  const connect = useCallback(async () => {
    try {
      // Get or fetch JWT token for authentication
      let token = localStorage.getItem('auth_token');
      
      // If no token, fetch from dev-token endpoint (development mode)
      if (!token) {
        try {
          const response = await fetch('/api/auth/dev-token', {
            credentials: 'include' // Include session cookie
          });
          
          if (response.ok) {
            const data = await response.json();
            token = data.token;
            // Cache token for future use
            if (token) {
              localStorage.setItem('auth_token', token);
            }
          }
        } catch (error) {
          console.error('[Realtime Voice] Failed to fetch auth token:', error);
        }
      }
      
      if (!token) {
        throw new Error('Failed to obtain authentication token');
      }

      // Determine WebSocket URL with token
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/v1/realtime-voice?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Realtime Voice] Connected to service');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await handleServerMessage(message);
      };

      ws.onerror = (error) => {
        console.error('[Realtime Voice] WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'Connection error' }));
        onError?.('Failed to connect to voice service');
      };

      ws.onclose = () => {
        console.log('[Realtime Voice] Disconnected');
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isSessionActive: false,
          isListening: false 
        }));
        cleanup();
      };
    } catch (error) {
      console.error('[Realtime Voice] Connection failed:', error);
      setState(prev => ({ ...prev, error: (error as Error).message }));
      onError?.((error as Error).message);
    }
  }, [onError]);

  /**
   * Handle messages from server
   */
  const handleServerMessage = async (message: any) => {
    switch (message.type) {
      case 'connection.established':
        console.log('[Realtime Voice] Connection established');
        break;

      case 'session.started':
        console.log('[Realtime Voice] Session started');
        setState(prev => ({ ...prev, isSessionActive: true }));
        break;

      case 'session.ended':
        console.log('[Realtime Voice] Session ended');
        setState(prev => ({ ...prev, isSessionActive: false, isListening: false }));
        stopAudioCapture();
        break;

      case 'audio.delta':
        // Play audio chunk
        await playAudioChunk(message.audio);
        setState(prev => ({ ...prev, isSpeaking: true }));
        break;

      case 'transcript.delta':
        // Update AI transcript
        setState(prev => ({
          ...prev,
          aiTranscript: prev.aiTranscript + message.text
        }));
        break;

      case 'user.transcript':
        // User's speech transcription complete
        setState(prev => ({
          ...prev,
          userTranscript: message.text
        }));
        break;

      case 'response.complete':
        // AI response complete
        setState(prev => ({ ...prev, isSpeaking: false }));
        break;

      case 'action.requested':
        // Handle action from AI (navigation, chart creation, etc.)
        onAction?.(message);
        break;

      case 'error':
        console.error('[Realtime Voice] Server error:', message.message);
        setState(prev => ({ ...prev, error: message.message }));
        onError?.(message.message);
        break;

      default:
        console.log('[Realtime Voice] Unknown message type:', message.type);
    }
  };

  /**
   * Start voice session
   */
  const startSession = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      await connect();
      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Send session start request
    wsRef.current?.send(JSON.stringify({
      type: 'session.start',
      agentId,
      voice,
      vadMode,
      vadThreshold,
      silenceDuration,
      model
    }));

    // Start audio capture
    await startAudioCapture();

    setState(prev => ({ 
      ...prev, 
      isListening: true,
      userTranscript: '',
      aiTranscript: ''
    }));
  };

  /**
   * Stop voice session
   */
  const stopSession = () => {
    wsRef.current?.send(JSON.stringify({
      type: 'session.stop'
    }));

    stopAudioCapture();
    
    setState(prev => ({ 
      ...prev, 
      isListening: false,
      isSessionActive: false
    }));
  };

  /**
   * Send text message (alternative to voice)
   */
  const sendTextMessage = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('[Realtime Voice] Not connected');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'message.send',
      text
    }));

    setState(prev => ({ ...prev, userTranscript: text }));
  };

  /**
   * Start capturing microphone audio
   */
  const startAudioCapture = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Process audio chunks and send to server
      await audioContext.audioWorklet.addModule('/audio-processor.js');
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
      audioWorkletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event) => {
        const audioData = event.data;
        
        // Convert Float32Array to PCM16
        const pcm16 = float32ToPcm16(audioData);
        
        // Convert to base64
        const base64Audio = arrayBufferToBase64(pcm16.buffer);
        
        // Send to server
        wsRef.current?.send(JSON.stringify({
          type: 'audio.data',
          audio: base64Audio
        }));
      };

      source.connect(workletNode);
      workletNode.connect(audioContext.destination);
    } catch (error) {
      console.error('[Realtime Voice] Failed to start audio capture:', error);
      onError?.('Failed to access microphone');
    }
  };

  /**
   * Stop audio capture
   */
  const stopAudioCapture = () => {
    audioWorkletNodeRef.current?.disconnect();
    audioContextRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    
    audioWorkletNodeRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
  };

  /**
   * Play audio chunk from server
   */
  const playAudioChunk = async (base64Audio: string) => {
    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = pcm16ToFloat32(pcm16);

      // Add to playback queue
      audioQueueRef.current.push(float32);

      // Start playback if not already playing
      if (!isPlayingRef.current) {
        playAudioQueue();
      }
    } catch (error) {
      console.error('[Realtime Voice] Failed to play audio:', error);
    }
  };

  /**
   * Play queued audio
   */
  const playAudioQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioContext = new AudioContext({ sampleRate: 24000 });

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift()!;
      const buffer = audioContext.createBuffer(1, audioData.length, 24000);
      buffer.copyToChannel(audioData, 0);

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      await new Promise(resolve => {
        source.onended = resolve;
        source.start();
      });
    }

    audioContext.close();
    isPlayingRef.current = false;
  };

  /**
   * Cleanup resources
   */
  const cleanup = () => {
    stopAudioCapture();
    wsRef.current?.close();
    wsRef.current = null;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    ...state,
    startSession,
    stopSession,
    sendTextMessage,
    connect
  };
}

// Utility functions

function float32ToPcm16(float32Array: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcm16;
}

function pcm16ToFloat32(pcm16Array: Int16Array): Float32Array {
  const float32 = new Float32Array(pcm16Array.length);
  for (let i = 0; i < pcm16Array.length; i++) {
    float32[i] = pcm16Array[i] / (pcm16Array[i] < 0 ? 0x8000 : 0x7FFF);
  }
  return float32;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
