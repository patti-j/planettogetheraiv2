# Voice Transcription Approaches

This document describes the voice transcription implementations for the PlanetTogether AI assistant system.

## Approach 1: Hybrid Web Speech API + Whisper (Current Implementation)

### Overview
The hybrid approach combines browser-based Web Speech API for real-time visual feedback with OpenAI Whisper for high-quality final transcription. This provides users with instant feedback while ensuring accuracy.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌──────────────┐         ┌────────────┐         ┌──────────┐  │
│  │  Microphone  │────────▶│ Recording  │────────▶│ Display  │  │
│  │    Button    │         │   State    │         │  Status  │  │
│  └──────────────┘         └────────────┘         └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌────────────────────┐         ┌────────────────────┐
        │  Web Speech API    │         │   MediaRecorder    │
        │  (Real-time Text)  │         │   (Audio Capture)  │
        └────────────────────┘         └────────────────────┘
                    │                             │
                    │                             │
                    ▼                             ▼
        ┌────────────────────┐         ┌────────────────────┐
        │  Live Transcript   │         │   Audio Blob       │
        │  (Instant Visual   │         │   (WebM format)    │
        │   Feedback - Green │         │                    │
        │   Highlighting)    │         │                    │
        └────────────────────┘         └────────────────────┘
                                                  │
                                                  ▼
                                       ┌────────────────────┐
                                       │  Backend API       │
                                       │  POST /api/ai-agent│
                                       │       /voice       │
                                       └────────────────────┘
                                                  │
                                                  ▼
                                       ┌────────────────────┐
                                       │  OpenAI Whisper    │
                                       │  (whisper-1 model) │
                                       │  High Accuracy     │
                                       └────────────────────┘
                                                  │
                                                  ▼
                                       ┌────────────────────┐
                                       │  Final Transcript  │
                                       │  Auto-sent to AI   │
                                       └────────────────────┘
```

### Components

#### Frontend Implementation
**File**: `client/src/components/navigation/desktop-layout.tsx`

```typescript
// Web Speech API Setup (Real-time transcription)
const SpeechRecognition = (window as any).SpeechRecognition || 
                         (window as any).webkitSpeechRecognition;

// Initialize recognition
const recognition = new SpeechRecognition();
recognition.continuous = true;        // Keep listening
recognition.interimResults = true;    // Get interim results
recognition.lang = 'en-US';          // Language setting

// Handle real-time results
recognition.onresult = (event) => {
  let interimTranscript = '';
  let finalTranscript = '';
  
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      finalTranscript += transcript + ' ';
    } else {
      interimTranscript += transcript;
    }
  }
  
  // Update UI with live text (green highlighting)
  const newText = (currentPrompt + ' ' + finalTranscript + interimTranscript).trim();
  setLiveTranscript(newText);
};

// MediaRecorder for audio capture
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
});

// Collect audio chunks
const audioChunks = [];
mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    audioChunks.push(event.data);
  }
};

// On stop, send to Whisper
mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  await sendToWhisper(audioBlob);
};
```

#### Backend Implementation
**File**: `server/routes.ts` (lines 3399-3488)

```typescript
// Voice transcription endpoint
router.post("/api/ai-agent/voice", upload.single('audio'), async (req, res) => {
  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      message: "Voice transcription service is not properly configured"
    });
  }

  // Validate file upload
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No audio file provided"
    });
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (req.file.buffer.length > maxSize) {
    return res.status(400).json({
      success: false,
      message: "Audio file too large. Maximum size is 10MB"
    });
  }

  // Validate MIME type
  const allowedMimeTypes = [
    'audio/webm', 'audio/ogg', 'audio/mp3', 
    'audio/mp4', 'audio/mpeg', 'audio/wav', 
    'audio/flac', 'audio/m4a'
  ];
  
  if (!allowedMimeTypes.some(type => req.file!.mimetype.includes(type))) {
    return res.status(400).json({
      success: false,
      message: `Unsupported audio format: ${req.file.mimetype}`
    });
  }

  // Initialize OpenAI
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Create file-like object
  const audioFile = new File(
    [req.file.buffer], 
    req.file.originalname || "audio.wav",
    { type: req.file.mimetype || "audio/wav" }
  );

  // Transcribe using Whisper
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
  });

  res.json({
    success: true,
    text: transcription.text,
    message: "Voice transcribed successfully"
  });
});
```

### User Experience Flow

1. **User clicks microphone button**
   - Recording starts immediately
   - Timer countdown begins (60 seconds max)
   - UI shows recording state

2. **User speaks into microphone**
   - Web Speech API provides instant visual feedback
   - Text appears in real-time with green highlighting
   - User sees what they're saying immediately

3. **User stops recording** (or timer expires)
   - MediaRecorder captures audio blob
   - Audio sent to backend `/api/ai-agent/voice`
   - "Transcribing..." indicator shows

4. **Backend processes audio**
   - OpenAI Whisper transcribes with high accuracy
   - Final transcript returned to frontend

5. **Final transcript displayed**
   - Replaces live transcript
   - Auto-submitted to AI assistant
   - AI processes and responds

### Advantages

✅ **Instant Visual Feedback**: Users see text appear as they speak  
✅ **High Accuracy**: Whisper provides superior transcription quality  
✅ **No Additional Costs**: Web Speech API is free (browser-based)  
✅ **Offline Support**: Web Speech API works without internet initially  
✅ **User Confidence**: Real-time text builds trust and engagement  
✅ **Error Correction**: Users can see mistakes and re-record  

### Limitations

⚠️ **Browser Compatibility**: Web Speech API not available in all browsers  
⚠️ **Two-Step Process**: Requires both APIs to complete transcription  
⚠️ **Latency**: Final transcript requires network round-trip  
⚠️ **Recording Limits**: 60-second maximum recording time  
⚠️ **No True Conversation**: Each recording is independent  

### Configuration

**Environment Variables Required**:
- `OPENAI_API_KEY`: For Whisper transcription

**Frontend Settings**:
- Recording timeout: 60 seconds
- Audio format: WebM with Opus codec
- Language: English (en-US)

**Backend Settings**:
- Max file size: 10MB
- Supported formats: WebM, OGG, MP3, MP4, MPEG, WAV, FLAC, M4A
- Whisper model: `whisper-1`

### Cost Analysis

- Web Speech API: **FREE** (browser-based)
- OpenAI Whisper: **$0.006 per minute** of audio
- Average 30-second recording: **$0.003 per transcription**
- 1000 recordings/month: **~$3/month**

---

## Approach 2: OpenAI Real-time API (Planned Implementation)

### Overview
The OpenAI real-time API provides true conversational AI with bidirectional streaming, voice activity detection, and natural turn-taking. This is the ideal solution for conversational experiences.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                         │
│   ┌──────────────┐         ┌────────────┐                  │
│   │  Microphone  │────────▶│ WebSocket  │                  │
│   │    Button    │         │ Connection │                  │
│   └──────────────┘         └────────────┘                  │
└────────────────────────────────────────────────────────────┘
                                   │
                                   │ Bidirectional WebSocket
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌────────────────────┐         ┌────────────────────┐
        │  Audio Stream In   │         │  Audio Stream Out  │
        │  (User Voice)      │         │  (AI Response)     │
        └────────────────────┘         └────────────────────┘
                    │                             │
                    ▼                             ▼
        ┌────────────────────────────────────────────────────┐
        │           OpenAI Real-time API Server              │
        │   ┌──────────────────────────────────────────┐    │
        │   │  Features:                               │    │
        │   │  - Voice Activity Detection (VAD)       │    │
        │   │  - Automatic Turn-taking                │    │
        │   │  - Speech-to-Speech (no text step)      │    │
        │   │  - Function Calling                     │    │
        │   │  - Streaming Transcripts                │    │
        │   │  - Low Latency (~200ms)                 │    │
        │   └──────────────────────────────────────────┘    │
        └────────────────────────────────────────────────────┘
                    │
                    ▼
        ┌────────────────────┐
        │  Real-time Text    │
        │  & Audio Response  │
        └────────────────────┘
```

### Key Features

1. **Voice Activity Detection (VAD)**
   - Automatic detection of when user starts/stops speaking
   - No need for manual start/stop buttons
   - Natural conversation flow

2. **Bidirectional Streaming**
   - Real-time audio in and out
   - No waiting for recording to finish
   - Immediate AI responses

3. **Speech-to-Speech Mode**
   - Direct voice-to-voice without intermediate text
   - Lower latency
   - More natural conversation

4. **Function Calling**
   - AI can trigger actions while speaking
   - Navigate pages, create charts, etc.
   - Integrated with existing Max AI capabilities

5. **Low Latency**
   - ~200-300ms response time
   - Feels like real conversation
   - Much faster than hybrid approach

### Implementation Plan

#### Phase 1: Backend WebSocket Server
**File**: `server/realtime-voice-service.ts` (to be created)

```typescript
import WebSocket from 'ws';
import OpenAI from 'openai';

export class RealtimeVoiceService {
  private wss: WebSocket.Server;
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.wss = new WebSocket.Server({ port: 8080 });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws) => {
      // Connect to OpenAI real-time API
      const openaiWs = await this.connectToOpenAI();
      
      // Forward client audio to OpenAI
      ws.on('message', (audioData) => {
        openaiWs.send(audioData);
      });
      
      // Forward OpenAI responses to client
      openaiWs.on('message', (response) => {
        ws.send(response);
      });
    });
  }
}
```

#### Phase 2: Frontend WebSocket Client
**File**: `client/src/hooks/useRealtimeVoice.ts` (to be created)

```typescript
export function useRealtimeVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true 
    });
    
    const ws = new WebSocket('ws://localhost:8080');
    wsRef.current = ws;
    
    ws.onopen = () => {
      setIsConnected(true);
      // Start streaming audio
      streamAudioToWebSocket(stream, ws);
    };
    
    ws.onmessage = (event) => {
      // Handle AI response (audio + transcript)
      handleAIResponse(event.data);
    };
  };

  return { connect, disconnect, isConnected };
}
```

### Advantages

✅ **Natural Conversation**: True back-and-forth dialogue  
✅ **Lower Latency**: ~200ms vs 2-3 seconds  
✅ **Automatic Turn-taking**: No buttons needed  
✅ **Voice Activity Detection**: Knows when user is speaking  
✅ **Function Calling**: AI can take actions while speaking  
✅ **Streaming**: Responses start immediately  
✅ **Better UX**: Feels like talking to a person  

### Cost Analysis

- OpenAI Real-time API: **$0.06 per minute** (audio in)
- OpenAI Real-time API: **$0.24 per minute** (audio out)
- Average conversation: **$0.15 per minute** (combined)
- 10-minute conversation: **$1.50**
- 100 conversations/month (5 min avg): **$75/month**

**Note**: Significantly more expensive than hybrid approach, but provides much better user experience for conversational AI.

### Configuration Options

Users can choose between approaches based on:
- **Use Case**: Quick commands vs long conversations
- **Budget**: Cost-sensitive vs premium experience
- **Network**: Stable connection required for real-time
- **Browser Support**: Web Speech API compatibility

---

## Comparison Table

| Feature | Hybrid (Web Speech + Whisper) | OpenAI Real-time API |
|---------|------------------------------|---------------------|
| Latency | 2-3 seconds | ~200ms |
| Cost per minute | $0.006 | $0.15 |
| Natural conversation | No | Yes |
| Visual feedback | Immediate (Web Speech) | Streamed |
| Turn-taking | Manual | Automatic |
| Function calling | After transcription | During speech |
| Browser compatibility | Chrome/Edge/Safari | All (WebSocket) |
| Recording limits | 60 seconds | Unlimited |
| Best for | Quick commands, transcription | Conversations, dialogue |

---

## Recommendations

**Use Hybrid Approach When**:
- User needs to give quick commands
- Cost is a primary concern
- Recording is < 60 seconds
- Visual feedback is important
- Internet connection is unstable

**Use Real-time API When**:
- Having natural conversation
- Discussing complex topics
- Need immediate responses
- Want AI to take actions during speech
- Premium experience is desired

**Implementation Strategy**:
1. Keep hybrid as default (cost-effective)
2. Add real-time API as opt-in feature
3. Let users toggle in settings
4. Monitor usage and costs
5. Gather user feedback
6. Optimize based on data

---

## Maintenance Notes

### Hybrid Approach
- Web Speech API may have browser-specific quirks
- Whisper API updates automatically (no maintenance needed)
- Monitor for browser deprecations

### Real-time API
- WebSocket connection management required
- Handle reconnections gracefully
- Monitor usage costs carefully
- Update as OpenAI releases new features

---

**Last Updated**: October 6, 2025  
**Status**: Hybrid approach active, Real-time API planned  
**Maintained By**: PlanetTogether Development Team
