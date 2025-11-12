import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sliders, Waves, Volume2, Zap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CompactLevelMeter } from './CompactLevelMeter';

interface AudioMixerProps {
  audioContext: AudioContext | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  onProcessedStream?: (stream: MediaStream) => void;
  onAudioLevel?: (left: number, right: number) => void;
  onReady?: () => void;
  onProcessedAnalyser?: (analyser: AnalyserNode) => void;
  onRawInputAnalyser?: (analyser: AnalyserNode) => void;
}

export const AudioMixer = ({ audioContext, sourceNode, onProcessedStream, onAudioLevel, onReady, onProcessedAnalyser, onRawInputAnalyser }: AudioMixerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInitializedRef = useRef(false);
  
  // Store native Web Audio nodes for processing
  const nodesRef = useRef<{
    highPass: BiquadFilterNode | null;
    lowShelf: BiquadFilterNode | null;
    midPeak: BiquadFilterNode | null;
    highShelf: BiquadFilterNode | null;
    compressor: DynamicsCompressorNode | null;
    masterGain: GainNode | null;
  }>({
    highPass: null,
    lowShelf: null,
    midPeak: null,
    highShelf: null,
    compressor: null,
    masterGain: null
  });
  
  // EQ Controls
  const [lowGain, setLowGain] = useState(0); // -12 to +12 dB
  const [midGain, setMidGain] = useState(0);
  const [highGain, setHighGain] = useState(0);
  
  // Compressor Controls
  const [compressorEnabled, setCompressorEnabled] = useState(true);
  const [threshold, setThreshold] = useState(-24); // dB
  const [ratio, setRatio] = useState(4); // 1:4
  const [attack, setAttack] = useState(0.003); // seconds
  const [release, setRelease] = useState(0.25); // seconds
  const [knee, setKnee] = useState(30); // dB
  
  // Noise Gate
  const [gateEnabled, setGateEnabled] = useState(false);
  const [gateThreshold, setGateThreshold] = useState(-50); // dB
  
  // Limiter
  const [limiterEnabled, setLimiterEnabled] = useState(true);
  const [limiterThreshold, setLimiterThreshold] = useState(-1); // dB
  
  // Master
  const [masterGain, setMasterGain] = useState(1);
  const [reverbMix, setReverbMix] = useState(0); // 0-100%
  
  // Audio levels for meters
  const [leftLevel, setLeftLevel] = useState(0);
  const [rightLevel, setRightLevel] = useState(0);

  // Draw EQ response curve
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw frequency labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const freqLabels = ['20Hz', '100Hz', '1kHz', '10kHz', '20kHz'];
    const freqPositions = [0.05, 0.2, 0.5, 0.8, 0.95];
    freqLabels.forEach((label, i) => {
      ctx.fillText(label, width * freqPositions[i], height - 4);
    });
    
    // Draw dB labels
    ctx.textAlign = 'right';
    ctx.fillText('+12dB', 30, 15);
    ctx.fillText('0dB', 30, height / 2);
    ctx.fillText('-12dB', 30, height - 15);
    
    // Draw center line at 0dB
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Draw EQ response curve
    ctx.strokeStyle = lowGain === 0 && midGain === 0 && highGain === 0 
      ? 'rgba(200, 200, 200, 0.8)' 
      : 'rgba(34, 197, 94, 1)'; // green when active
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    // Sample points across the frequency spectrum
    const points = 100;
    for (let i = 0; i < points; i++) {
      const x = (i / points) * width;
      const freq = 20 * Math.pow(1000, i / points); // logarithmic frequency
      
      // Calculate response at this frequency
      let response = 0;
      
      // Low shelf effect (320Hz)
      if (freq < 320) {
        response += lowGain;
      } else {
        const transition = Math.max(0, 1 - (freq - 320) / 320);
        response += lowGain * transition;
      }
      
      // Mid peak effect (1kHz with Q=1)
      const midQ = 1;
      const midFreq = 1000;
      const midBandwidth = midFreq / midQ;
      const midDist = Math.abs(Math.log2(freq / midFreq));
      const midEffect = Math.max(0, 1 - (midDist * midQ));
      response += midGain * midEffect;
      
      // High shelf effect (3.2kHz)
      if (freq > 3200) {
        response += highGain;
      } else {
        const transition = Math.max(0, (freq - 1600) / 1600);
        response += highGain * transition;
      }
      
      // Convert dB to pixel position (center = 0dB)
      const y = height / 2 - (response / 12) * (height / 2 - 20);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
  }, [lowGain, midGain, highGain]);

  // Effect 1: Initialize Native Web Audio Processing Chain (Simple & Reliable)
  useEffect(() => {
    (async () => {
      if (!audioContext || !sourceNode) {
        console.log('[AudioMixer] ⚠️ Missing dependencies:', { 
          hasContext: !!audioContext, 
          hasSource: !!sourceNode 
        });
        return;
      }

      // Prevent double initialization
      if (isInitializedRef.current) {
        console.log('[AudioMixer] ⚠️ Already initialized, skipping duplicate init');
        return;
      }
    
      let animationFrameId: number;
      let highPass: BiquadFilterNode | null = null;
      let lowShelf: BiquadFilterNode | null = null;
      let midPeak: BiquadFilterNode | null = null;
      let highShelf: BiquadFilterNode | null = null;
      let compressor: DynamicsCompressorNode | null = null;
      let masterGain: GainNode | null = null;
      let destination: MediaStreamAudioDestinationNode | null = null;
      let analyser: AnalyserNode | null = null;
      let leftAnalyser: AnalyserNode | null = null;
      let rightAnalyser: AnalyserNode | null = null;
      let splitter: ChannelSplitterNode | null = null;

      try {
        isInitializedRef.current = true;
      
      console.log('[AudioMixer] 🔧 Initializing Native Web Audio Processing Chain...');
      console.log('[AudioMixer] Context state:', audioContext.state);
      console.log('[AudioMixer] Source node channels:', sourceNode.channelCount);

      // CRITICAL: Ensure AudioContext is running before creating nodes
      if (audioContext.state === 'suspended') {
        console.log('[AudioMixer] Resuming suspended AudioContext...');
        await audioContext.resume();
      } else if (audioContext.state === 'closed') {
        console.error('[AudioMixer] ❌ AudioContext is closed! Cannot process audio.');
        throw new Error('AudioContext is closed - cannot initialize audio processing');
      }
      
      console.log('[AudioMixer] Context state after resume:', audioContext.state);

      // Create high-pass filter (remove rumble below 80Hz)
      highPass = audioContext.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 80;
      highPass.Q.value = 0.7;
      console.log('[AudioMixer] ✅ High-pass filter created (80Hz)');

      // Create EQ - Low shelf (warmth at 200Hz)
      lowShelf = audioContext.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 200;
      lowShelf.gain.value = 0; // Controlled by UI
      console.log('[AudioMixer] ✅ Low shelf EQ created (200Hz)');

      // Create EQ - Mid peak (presence at 3kHz)
      midPeak = audioContext.createBiquadFilter();
      midPeak.type = 'peaking';
      midPeak.frequency.value = 3000;
      midPeak.Q.value = 1.0;
      midPeak.gain.value = 0; // Controlled by UI
      console.log('[AudioMixer] ✅ Mid peak EQ created (3kHz)');

      // Create EQ - High shelf (air at 8kHz)
      highShelf = audioContext.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 8000;
      highShelf.gain.value = 0; // Controlled by UI
      console.log('[AudioMixer] ✅ High shelf EQ created (8kHz)');

      // Create compressor (smooth out dynamics)
      compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      console.log('[AudioMixer] ✅ Compressor created');

      // Create master gain
      masterGain = audioContext.createGain();
      masterGain.gain.value = 1.0;
      console.log('[AudioMixer] ✅ Master gain created');

      // Store nodes in ref for UI control
      nodesRef.current = {
        highPass,
        lowShelf,
        midPeak,
        highShelf,
        compressor,
        masterGain
      };

      // Create destination for processed stream
      destination = audioContext.createMediaStreamDestination();
      console.log('[AudioMixer] ✅ MediaStreamDestination created:', destination.stream.id);

      // Create analysers for metering
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.1;
      analyser.minDecibels = -90;
      analyser.maxDecibels = 0;

      // Stereo L/R analysers for true stereo metering
      splitter = audioContext.createChannelSplitter(2);
      
      leftAnalyser = audioContext.createAnalyser();
      leftAnalyser.fftSize = 2048;
      leftAnalyser.smoothingTimeConstant = 0;
      leftAnalyser.minDecibels = -90;
      leftAnalyser.maxDecibels = 0;
      
      rightAnalyser = audioContext.createAnalyser();
      rightAnalyser.fftSize = 2048;
      rightAnalyser.smoothingTimeConstant = 0;
      rightAnalyser.minDecibels = -90;
      rightAnalyser.maxDecibels = 0;

      // Connect the signal chain:
      // source → highpass → lowshelf → midpeak → highshelf → compressor → gain → [destination, analysers]
      console.log('[AudioMixer] 🔌 Connecting processing chain...');
      sourceNode.connect(highPass);
      highPass.connect(lowShelf);
      lowShelf.connect(midPeak);
      midPeak.connect(highShelf);
      highShelf.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(destination);
      masterGain.connect(analyser);
      masterGain.connect(splitter);
      
      splitter.connect(leftAnalyser, 0);
      splitter.connect(rightAnalyser, 1);

      console.log('[AudioMixer] 🎛️ Signal chain connected:', {
        source: 'Microphone',
        chain: 'HPF → Low EQ → Mid EQ → High EQ → Compressor → Master Gain',
        outputs: ['LiveKit Stream', 'Level Meters']
      });

      // Verify processed stream has active audio tracks
      const processedTracks = destination.stream.getAudioTracks();
      console.log('[AudioMixer] 🔍 Processed stream has', processedTracks.length, 'audio tracks');
      
      if (processedTracks.length === 0) {
        console.error('[AudioMixer] ❌ CRITICAL: Destination stream has no audio tracks!');
        throw new Error('Audio processing failed - no output tracks');
      }
      
      processedTracks.forEach((track, i) => {
        console.log(`[AudioMixer] 🔍 Processed track ${i}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label
        });
        
        if (!track.enabled) {
          console.warn(`[AudioMixer] ⚠️ Track ${i} is disabled, enabling it`);
          track.enabled = true;
        }
      });
      
      // Notify parent components
      if (onProcessedStream) {
        onProcessedStream(destination.stream);
        console.log('[AudioMixer] ✅ Processed stream sent to LiveKit with', processedTracks.length, 'active tracks');
      }

      if (onProcessedAnalyser) {
        onProcessedAnalyser(analyser);
      }

      if (onRawInputAnalyser) {
        onRawInputAnalyser(leftAnalyser);
      }

      if (onReady) {
        onReady();
      }

      console.log('[AudioMixer] ✅ Native Web Audio processing initialized successfully');

      // Start level metering animation
      const bufferLeft = new Float32Array(leftAnalyser.fftSize);
      const bufferRight = new Float32Array(rightAnalyser.fftSize);
      let smoothedLeft = 0;
      let smoothedRight = 0;
      const smoothingFactor = 0.3;
      const noiseFloor = 2;

      const updateMeters = () => {
        leftAnalyser.getFloatTimeDomainData(bufferLeft);
        rightAnalyser.getFloatTimeDomainData(bufferRight);

        // Calculate RMS for each channel
        let sumL = 0, sumR = 0;
        for (let i = 0; i < bufferLeft.length; i++) {
          sumL += bufferLeft[i] * bufferLeft[i];
          sumR += bufferRight[i] * bufferRight[i];
        }
        const rmsL = Math.sqrt(sumL / bufferLeft.length);
        const rmsR = Math.sqrt(sumR / bufferRight.length);

        const dbL = 20 * Math.log10(rmsL || 0.0001);
        const dbR = 20 * Math.log10(rmsR || 0.0001);

        const percentLeft = Math.max(0, Math.min(100, ((dbL + 50) / 44) * 100));
        const percentRight = Math.max(0, Math.min(100, ((dbR + 50) / 44) * 100));

        smoothedLeft = smoothedLeft * (1 - smoothingFactor) + percentLeft * smoothingFactor;
        smoothedRight = smoothedRight * (1 - smoothingFactor) + percentRight * smoothingFactor;

        setLeftLevel(smoothedLeft > noiseFloor ? smoothedLeft : 0);
        setRightLevel(smoothedRight > noiseFloor ? smoothedRight : 0);

        if (onAudioLevel) {
          onAudioLevel(
            smoothedLeft > noiseFloor ? smoothedLeft : 0,
            smoothedRight > noiseFloor ? smoothedRight : 0
          );
        }

        animationFrameId = requestAnimationFrame(updateMeters);
      };

        updateMeters();

      } catch (error: any) {
        console.error('[AudioMixer] ❌ Fatal setup error:', error);
        console.error('[AudioMixer] Error details:', {
          name: error.name,
          message: error.message,
          contextState: audioContext?.state,
          stack: error.stack
        });
        
        // Reset flags on error so it can be retried
        isInitializedRef.current = false;
        
        throw new Error(`Audio mixer failed to initialize: ${error.message}`);
      }
    })();

    // Cleanup
    return () => {
      console.log('[AudioMixer] 🧹 Cleaning up audio processing...');
      
      // Reset initialization flag
      isInitializedRef.current = false;
      
      // Clear nodes ref
      nodesRef.current = {
        highPass: null,
        lowShelf: null,
        midPeak: null,
        highShelf: null,
        compressor: null,
        masterGain: null
      };
    };
  }, [audioContext, sourceNode, onProcessedStream, onAudioLevel, onReady, onProcessedAnalyser, onRawInputAnalyser]);

  // Effect 2: Update native Web Audio node parameters when UI controls change
  useEffect(() => {
    if (nodesRef.current.lowShelf) {
      nodesRef.current.lowShelf.gain.value = lowGain;
    }
    if (nodesRef.current.midPeak) {
      nodesRef.current.midPeak.gain.value = midGain;
    }
    if (nodesRef.current.highShelf) {
      nodesRef.current.highShelf.gain.value = highGain;
    }
    if (nodesRef.current.compressor) {
      nodesRef.current.compressor.threshold.value = threshold;
      nodesRef.current.compressor.ratio.value = ratio;
      nodesRef.current.compressor.attack.value = attack;
      nodesRef.current.compressor.release.value = release;
      nodesRef.current.compressor.knee.value = knee;
    }
    if (nodesRef.current.masterGain) {
      nodesRef.current.masterGain.gain.value = masterGain;
    }
    
    console.log('[AudioMixer] Native node parameters updated:', { 
      lowGain, midGain, highGain, 
      threshold, ratio, attack, release, knee,
      masterGain 
    });
  }, [lowGain, midGain, highGain, threshold, ratio, attack, release, knee, masterGain]);

  if (!audioContext || !sourceNode) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Start preview to enable audio mixer</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex-1">
          <Tabs defaultValue="mixing" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="mixing" className="gap-1">
                <Volume2 className="w-3 h-3" />
                Mixing
              </TabsTrigger>
              <TabsTrigger value="eq" className="gap-1">
                <Sliders className="w-3 h-3" />
                EQ
              </TabsTrigger>
              <TabsTrigger value="dynamics" className="gap-1">
                <Zap className="w-3 h-3" />
                Dynamics
              </TabsTrigger>
              <TabsTrigger value="effects" className="gap-1">
                <Waves className="w-3 h-3" />
                Effects
              </TabsTrigger>
              <TabsTrigger value="master" className="gap-1">
                <Volume2 className="w-3 h-3" />
                Master
              </TabsTrigger>
            </TabsList>

            {/* Mixing Tools Tab */}
            <TabsContent value="mixing" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Fine-tune your audio levels and balance
                </p>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Microphone Gain</Label>
                    <span className="text-xs text-muted-foreground">{masterGain.toFixed(2)}x</span>
                  </div>
                  <Slider
                    value={[masterGain]}
                    onValueChange={(v) => setMasterGain(v[0])}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Reverb Mix</Label>
                    <span className="text-xs text-muted-foreground">{reverbMix}%</span>
                  </div>
                  <Slider
                    value={[reverbMix]}
                    onValueChange={(v) => setReverbMix(v[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </TabsContent>

            {/* EQ Tab */}
            <TabsContent value="eq" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm">Low Shelf (320Hz)</Label>
                  <span className="text-xs text-muted-foreground">{lowGain > 0 ? '+' : ''}{lowGain.toFixed(1)} dB</span>
                </div>
                <Slider
                  value={[lowGain]}
                  onValueChange={(v) => setLowGain(v[0])}
                  min={-12}
                  max={12}
                  step={0.5}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm">Mid Peak (1kHz)</Label>
                  <span className="text-xs text-muted-foreground">{midGain > 0 ? '+' : ''}{midGain.toFixed(1)} dB</span>
                </div>
                <Slider
                  value={[midGain]}
                  onValueChange={(v) => setMidGain(v[0])}
                  min={-12}
                  max={12}
                  step={0.5}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm">High Shelf (3.2kHz)</Label>
                  <span className="text-xs text-muted-foreground">{highGain > 0 ? '+' : ''}{highGain.toFixed(1)} dB</span>
                </div>
                <Slider
                  value={[highGain]}
                  onValueChange={(v) => setHighGain(v[0])}
                  min={-12}
                  max={12}
                  step={0.5}
                />
              </div>
            </TabsContent>

            {/* Dynamics Tab */}
            <TabsContent value="dynamics" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Compressor</Label>
                <Switch checked={compressorEnabled} onCheckedChange={setCompressorEnabled} />
              </div>

              {compressorEnabled && (
                <>
                  <Separator />
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm">Threshold</Label>
                      <span className="text-xs text-muted-foreground">{threshold} dB</span>
                    </div>
                    <Slider
                      value={[threshold]}
                      onValueChange={(v) => setThreshold(v[0])}
                      min={-60}
                      max={0}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm">Ratio</Label>
                      <span className="text-xs text-muted-foreground">1:{ratio}</span>
                    </div>
                    <Slider
                      value={[ratio]}
                      onValueChange={(v) => setRatio(v[0])}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm">Attack</Label>
                      <span className="text-xs text-muted-foreground">{(attack * 1000).toFixed(1)} ms</span>
                    </div>
                    <Slider
                      value={[attack * 1000]}
                      onValueChange={(v) => setAttack(v[0] / 1000)}
                      min={0}
                      max={100}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm">Release</Label>
                      <span className="text-xs text-muted-foreground">{(release * 1000).toFixed(0)} ms</span>
                    </div>
                    <Slider
                      value={[release * 1000]}
                      onValueChange={(v) => setRelease(v[0] / 1000)}
                      min={10}
                      max={1000}
                      step={10}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm">Knee</Label>
                      <span className="text-xs text-muted-foreground">{knee} dB</span>
                    </div>
                    <Slider
                      value={[knee]}
                      onValueChange={(v) => setKnee(v[0])}
                      min={0}
                      max={40}
                      step={1}
                    />
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <Label>Noise Gate</Label>
                <Switch checked={gateEnabled} onCheckedChange={setGateEnabled} />
              </div>

              {gateEnabled && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Gate Threshold</Label>
                    <span className="text-xs text-muted-foreground">{gateThreshold} dB</span>
                  </div>
                  <Slider
                    value={[gateThreshold]}
                    onValueChange={(v) => setGateThreshold(v[0])}
                    min={-80}
                    max={-20}
                    step={1}
                  />
                </div>
              )}
            </TabsContent>

            {/* Effects Tab */}
            <TabsContent value="effects" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm">Reverb Mix</Label>
                  <span className="text-xs text-muted-foreground">{reverbMix}%</span>
                </div>
                <Slider
                  value={[reverbMix]}
                  onValueChange={(v) => setReverbMix(v[0])}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label>Limiter (Prevent Clipping)</Label>
                <Switch checked={limiterEnabled} onCheckedChange={setLimiterEnabled} />
              </div>

              {limiterEnabled && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm">Ceiling</Label>
                    <span className="text-xs text-muted-foreground">{limiterThreshold} dB</span>
                  </div>
                  <Slider
                    value={[limiterThreshold]}
                    onValueChange={(v) => setLimiterThreshold(v[0])}
                    min={-6}
                    max={0}
                    step={0.1}
                  />
                </div>
              )}
            </TabsContent>

            {/* Master Tab */}
            <TabsContent value="master" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm">Master Output</Label>
                  <span className="text-xs text-muted-foreground">{(masterGain * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[masterGain * 100]}
                  onValueChange={(v) => setMasterGain(v[0] / 100)}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                <p><strong>Pro Tip:</strong> Start with subtle settings</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Compressor: -24dB threshold, 4:1 ratio</li>
                  <li>EQ: Boost mids slightly for vocals</li>
                  <li>Limiter: Keep at -1dB to prevent clipping</li>
                  <li>Reverb: Use sparingly (10-20%)</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </Card>
  );
};