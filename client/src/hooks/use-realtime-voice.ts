import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseRealtimeVoiceOptions {
  agentId: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  vadMode?: 'server_vad' | 'none';
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onAudioReceived?: (audio: ArrayBuffer) => void;
  onStatusChange?: (status: 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening') => void;
  onResponse?: (response: { text: string; audio?: ArrayBuffer }) => void;
}

interface RealtimeVoiceState {
  sessionId: string | null;
  isConnected: boolean;
  status: 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening';
  error: string | null;
}

export function useRealtimeVoice({
  agentId,
  voice = 'nova',
  vadMode = 'server_vad',
  onTranscript,
  onAudioReceived,
  onStatusChange,
  onResponse,
}: UseRealtimeVoiceOptions) {
  const [state, setState] = useState<RealtimeVoiceState>({
    sessionId: null,
    isConnected: false,
    status: 'idle',
    error: null,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const isRecordingRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize AudioContext
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Start real-time voice session
  const startSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, status: 'connecting', error: null }));
      onStatusChange?.('connecting');

      // Create a new session
      const response = await fetch('/api/realtime/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          voice,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create real-time session');
      }

      const { sessionId, model } = await response.json();
      console.log(`✅ Created real-time session ${sessionId} with ${model}`);

      setState((prev) => ({
        ...prev,
        sessionId,
        isConnected: true,
        status: 'connected',
      }));
      onStatusChange?.('connected');

      // Set up Server-Sent Events for receiving responses
      const eventSource = new EventSource(`/api/realtime/sessions/${sessionId}/events`);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('transcript', (event) => {
        const data = JSON.parse(event.data);
        onTranscript?.(data.text, data.isFinal);
      });

      eventSource.addEventListener('audio', (event) => {
        const data = JSON.parse(event.data);
        const audioData = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
        onAudioReceived?.(audioData.buffer);
        playAudio(audioData.buffer);
      });

      eventSource.addEventListener('status', (event) => {
        const data = JSON.parse(event.data);
        setState((prev) => ({ ...prev, status: data.status }));
        onStatusChange?.(data.status);
      });

      eventSource.addEventListener('error', () => {
        console.error('EventSource error');
        setState((prev) => ({ ...prev, isConnected: false, status: 'idle' }));
        onStatusChange?.('idle');
      });

      // Request microphone access
      await startRecording(sessionId);

      toast({
        title: 'Voice Chat Connected',
        description: `Connected to ${model} - Speak to start conversation`,
      });
    } catch (error) {
      console.error('Failed to start real-time session:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to start voice session',
        status: 'idle',
        isConnected: false,
      }));
      onStatusChange?.('idle');
      
      toast({
        title: 'Connection Failed',
        description: 'Could not start voice chat. Please try again.',
        variant: 'destructive',
      });
    }
  }, [agentId, onTranscript, onAudioReceived, onStatusChange]);

  // Start recording from microphone
  const startRecording = useCallback(async (sessionId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = initAudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processorRef.current = processor;
      isRecordingRef.current = true;
      audioChunksRef.current = [];

      processor.onaudioprocess = (e) => {
        if (!isRecordingRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = convertToPCM16(inputData);
        
        // Send audio chunks to server
        sendAudioChunk(sessionId, pcm16);

        // Update status based on audio level
        const level = calculateAudioLevel(inputData);
        if (level > 0.01) {
          setState((prev) => ({ ...prev, status: 'speaking' }));
          onStatusChange?.('speaking');
        } else {
          setState((prev) => ({ ...prev, status: 'listening' }));
          onStatusChange?.('listening');
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('🎤 Microphone recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [initAudioContext, onStatusChange]);

  // Convert Float32Array to PCM16
  const convertToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, sample * 0x7fff, true);
    }
    
    return buffer;
  };

  // Calculate audio level for voice activity detection
  const calculateAudioLevel = (data: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i]);
    }
    return sum / data.length;
  };

  // Send audio chunk to server
  const sendAudioChunk = useCallback(async (sessionId: string, audioData: ArrayBuffer) => {
    try {
      await fetch(`/api/realtime/sessions/${sessionId}/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: audioData,
      });
    } catch (error) {
      console.error('Failed to send audio chunk:', error);
    }
  }, []);

  // Play received audio
  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      const audioContext = initAudioContext();
      
      // Convert PCM16 to Float32 for Web Audio API
      const pcm16 = new Int16Array(audioData);
      const float32 = new Float32Array(pcm16.length);
      
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 0x7fff;
      }

      // Create audio buffer
      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      // Play the buffer
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }, [initAudioContext]);

  // Send text message
  const sendText = useCallback(async (text: string) => {
    if (!state.sessionId) {
      console.warn('No active session to send text');
      return;
    }

    try {
      await fetch(`/api/realtime/sessions/${state.sessionId}/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch (error) {
      console.error('Failed to send text:', error);
    }
  }, [state.sessionId]);

  // Stop session
  const stopSession = useCallback(async () => {
    // Stop recording
    isRecordingRef.current = false;
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Close session on server
    if (state.sessionId) {
      try {
        await fetch(`/api/realtime/sessions/${state.sessionId}`, {
          method: 'DELETE',
        });
        console.log('🔒 Closed real-time session');
      } catch (error) {
        console.error('Failed to close session:', error);
      }
    }

    setState({
      sessionId: null,
      isConnected: false,
      status: 'idle',
      error: null,
    });
    onStatusChange?.('idle');

    toast({
      title: 'Voice Chat Disconnected',
      description: 'Voice chat session has ended',
    });
  }, [state.sessionId, onStatusChange]);

  // Toggle session
  const toggleSession = useCallback(async () => {
    if (state.isConnected) {
      await stopSession();
    } else {
      await startSession();
    }
  }, [state.isConnected, startSession, stopSession]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (state.isConnected) {
        stopSession();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    sessionId: state.sessionId,
    isConnected: state.isConnected,
    isSessionActive: state.isConnected, // Alias for AI panel compatibility
    status: state.status,
    error: state.error,
    startSession,
    stopSession,
    toggleSession,
    sendText,
    sendMessage: sendText, // Alias for AI panel compatibility
  };
}