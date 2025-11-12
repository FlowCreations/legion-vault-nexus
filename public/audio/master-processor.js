/**
 * Master Bus AudioWorklet Processor
 * Sons of Legion - Warm Analog Signature
 * 
 * DSP Chain:
 * 1. High-pass filter @ 80 Hz (remove rumble)
 * 2. Low shelf +1.5 dB @ 160 Hz (warmth)
 * 3. Presence peak +2.2 dB @ 3.2 kHz (clarity)
 * 4. Air shelf +1.4 dB @ 10-12 kHz (shimmer)
 * 5. Noise gate (threshold: -50 dB)
 * 6. Compressor (3:1 ratio, soft knee, slow attack)
 * 7. Limiter (ceiling: -0.6 dBFS)
 * 8. Master gain
 */

class MasterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sampleRate = 48000;
    
    // Biquad filter states (each filter needs its own state)
    this.hpf = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0, x1: [0, 0], x2: [0, 0], y1: [0, 0], y2: [0, 0] };
    this.lowShelf = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0, x1: [0, 0], x2: [0, 0], y1: [0, 0], y2: [0, 0] };
    this.presencePeak = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0, x1: [0, 0], x2: [0, 0], y1: [0, 0], y2: [0, 0] };
    this.airShelf = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0, x1: [0, 0], x2: [0, 0], y1: [0, 0], y2: [0, 0] };
    
    // Dynamics state (per channel)
    this.compressorEnvelope = [0, 0];
    this.gateEnvelope = [1, 1];
    this.limiterEnvelope = [0, 0];
    
    // Initialize filters
    this.updateFilters();
  }
  
  static get parameterDescriptors() {
    return [
      { name: 'masterGain', defaultValue: 1.0, minValue: 0.0, maxValue: 4.0 },
      { name: 'lowGain', defaultValue: 1.5, minValue: -12, maxValue: 12 },
      { name: 'presenceGain', defaultValue: 2.2, minValue: -12, maxValue: 12 },
      { name: 'airGain', defaultValue: 1.4, minValue: -12, maxValue: 12 },
      { name: 'compThreshold', defaultValue: -18, minValue: -60, maxValue: 0 },
      { name: 'compRatio', defaultValue: 3.0, minValue: 1, maxValue: 20 },
      { name: 'compAttack', defaultValue: 0.03, minValue: 0.001, maxValue: 1 },
      { name: 'compRelease', defaultValue: 0.25, minValue: 0.01, maxValue: 3 },
      { name: 'gateThreshold', defaultValue: -50, minValue: -80, maxValue: 0 },
      { name: 'limiterThreshold', defaultValue: -0.6, minValue: -20, maxValue: 0 },
    ];
  }
  
  updateFilters() {
    // High-pass filter @ 80 Hz
    this.calculateBiquad(this.hpf, 'highpass', 80, 0.707, 0);
    
    // Low shelf @ 160 Hz, +1.5 dB (warmth)
    this.calculateBiquad(this.lowShelf, 'lowshelf', 160, 0.707, 1.5);
    
    // Presence peak @ 3.2 kHz, +2.2 dB (clarity)
    this.calculateBiquad(this.presencePeak, 'peaking', 3200, 1.0, 2.2);
    
    // Air shelf @ 10 kHz, +1.4 dB (shimmer)
    this.calculateBiquad(this.airShelf, 'highshelf', 10000, 0.707, 1.4);
  }
  
  calculateBiquad(filter, type, freq, Q, gain) {
    const w0 = 2 * Math.PI * freq / this.sampleRate;
    const cosW0 = Math.cos(w0);
    const sinW0 = Math.sin(w0);
    const alpha = sinW0 / (2 * Q);
    const A = Math.pow(10, gain / 40);
    
    let b0, b1, b2, a0, a1, a2;
    
    if (type === 'highpass') {
      b0 = (1 + cosW0) / 2;
      b1 = -(1 + cosW0);
      b2 = (1 + cosW0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
    } else if (type === 'lowshelf') {
      const S = 1;
      b0 = A * ((A + 1) - (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha * S);
      b1 = 2 * A * ((A - 1) - (A + 1) * cosW0);
      b2 = A * ((A + 1) - (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha * S);
      a0 = (A + 1) + (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha * S;
      a1 = -2 * ((A - 1) + (A + 1) * cosW0);
      a2 = (A + 1) + (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha * S;
    } else if (type === 'highshelf') {
      const S = 1;
      b0 = A * ((A + 1) + (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha * S);
      b1 = -2 * A * ((A - 1) + (A + 1) * cosW0);
      b2 = A * ((A + 1) + (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha * S);
      a0 = (A + 1) - (A - 1) * cosW0 + 2 * Math.sqrt(A) * alpha * S;
      a1 = 2 * ((A - 1) - (A + 1) * cosW0);
      a2 = (A + 1) - (A - 1) * cosW0 - 2 * Math.sqrt(A) * alpha * S;
    } else if (type === 'peaking') {
      b0 = 1 + alpha * A;
      b1 = -2 * cosW0;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosW0;
      a2 = 1 - alpha / A;
    }
    
    filter.b0 = b0 / a0;
    filter.b1 = b1 / a0;
    filter.b2 = b2 / a0;
    filter.a1 = a1 / a0;
    filter.a2 = a2 / a0;
  }
  
  processBiquad(sample, filter, channel) {
    const output = filter.b0 * sample + filter.b1 * filter.x1[channel] + filter.b2 * filter.x2[channel]
                   - filter.a1 * filter.y1[channel] - filter.a2 * filter.y2[channel];
    
    filter.x2[channel] = filter.x1[channel];
    filter.x1[channel] = sample;
    filter.y2[channel] = filter.y1[channel];
    filter.y1[channel] = output;
    
    return output;
  }
  
  processCompressor(sample, params, channel) {
    // Peak detector with attack/release
    const inputLevel = Math.abs(sample);
    const attackCoeff = Math.exp(-1 / (params.attack * this.sampleRate));
    const releaseCoeff = Math.exp(-1 / (params.release * this.sampleRate));
    
    if (inputLevel > this.compressorEnvelope[channel]) {
      this.compressorEnvelope[channel] = inputLevel + attackCoeff * (this.compressorEnvelope[channel] - inputLevel);
    } else {
      this.compressorEnvelope[channel] = inputLevel + releaseCoeff * (this.compressorEnvelope[channel] - inputLevel);
    }
    
    // Calculate gain reduction
    const thresholdLin = Math.pow(10, params.threshold / 20);
    const overThreshold = this.compressorEnvelope[channel] - thresholdLin;
    
    if (overThreshold > 0) {
      const gainReduction = overThreshold * (1 - 1 / params.ratio);
      const gainReductionLin = Math.pow(10, -gainReduction / 20);
      return sample * gainReductionLin;
    }
    
    return sample;
  }
  
  processGate(sample, threshold, channel) {
    const level = Math.abs(sample);
    const thresholdLin = Math.pow(10, threshold / 20);
    const attackCoeff = 0.01; // Fast open
    const releaseCoeff = 0.001; // Slow close
    
    if (level < thresholdLin) {
      // Below threshold: close gate
      this.gateEnvelope[channel] *= (1 - releaseCoeff);
    } else {
      // Above threshold: open gate
      this.gateEnvelope[channel] += (1 - this.gateEnvelope[channel]) * attackCoeff;
    }
    
    return sample * this.gateEnvelope[channel];
  }
  
  processLimiter(sample, threshold, channel) {
    const thresholdLin = Math.pow(10, threshold / 20);
    const level = Math.abs(sample);
    const attackCoeff = 0.5; // Very fast
    
    if (level > thresholdLin) {
      // Calculate target gain
      const targetGain = thresholdLin / level;
      this.limiterEnvelope[channel] += (targetGain - this.limiterEnvelope[channel]) * attackCoeff;
    } else {
      // Release back to 1.0
      this.limiterEnvelope[channel] += (1.0 - this.limiterEnvelope[channel]) * 0.01;
    }
    
    return sample * this.limiterEnvelope[channel];
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0]) {
      return true;
    }
    
    const numChannels = Math.min(output.length, 2); // Max 2 channels
    
    // Get parameters (they may be arrays if automated)
    const masterGain = parameters.masterGain[0];
    const compParams = {
      threshold: parameters.compThreshold[0],
      ratio: parameters.compRatio[0],
      attack: parameters.compAttack[0],
      release: parameters.compRelease[0]
    };
    const gateThreshold = parameters.gateThreshold[0];
    const limiterThreshold = parameters.limiterThreshold[0];
    
    // Process each channel
    for (let channel = 0; channel < numChannels; channel++) {
      const inputChannel = input[channel] || input[0]; // Fallback to mono if needed
      const outputChannel = output[channel];
      
      for (let i = 0; i < inputChannel.length; i++) {
        let sample = inputChannel[i];
        
        // 1. High-pass filter (remove rumble)
        sample = this.processBiquad(sample, this.hpf, channel);
        
        // 2. Low shelf (warmth)
        sample = this.processBiquad(sample, this.lowShelf, channel);
        
        // 3. Presence peak (clarity)
        sample = this.processBiquad(sample, this.presencePeak, channel);
        
        // 4. Air shelf (shimmer)
        sample = this.processBiquad(sample, this.airShelf, channel);
        
        // 5. Noise gate
        sample = this.processGate(sample, gateThreshold, channel);
        
        // 6. Compressor (gentle, slow)
        sample = this.processCompressor(sample, compParams, channel);
        
        // 7. Limiter (safety)
        sample = this.processLimiter(sample, limiterThreshold, channel);
        
        // 8. Master gain
        sample *= masterGain;
        
        // Clamp to prevent overflow
        sample = Math.max(-1, Math.min(1, sample));
        
        outputChannel[i] = sample;
      }
    }
    
    return true;
  }
}

registerProcessor('master-processor', MasterProcessor);
