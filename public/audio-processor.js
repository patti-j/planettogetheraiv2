/**
 * Audio Processor Worklet
 * 
 * This AudioWorklet processes microphone input in real-time,
 * capturing audio chunks and sending them to the main thread
 * for transmission to the OpenAI Realtime API.
 * 
 * Runs on a separate audio processing thread for low latency.
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // ~85ms at 24kHz
    this.buffer = [];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input && input.length > 0) {
      const channelData = input[0]; // Mono audio
      
      // Accumulate samples
      for (let i = 0; i < channelData.length; i++) {
        this.buffer.push(channelData[i]);
      }
      
      // Send buffer when full
      if (this.buffer.length >= this.bufferSize) {
        const audioChunk = new Float32Array(this.buffer);
        this.port.postMessage(audioChunk);
        this.buffer = [];
      }
    }
    
    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
