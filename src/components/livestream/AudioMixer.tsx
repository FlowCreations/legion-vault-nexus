import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sliders, Waves, Volume2, Zap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AudioMixerProps {
  audioContext: AudioContext | null;
  sourceNode: MediaStreamAudioSourceNode | null;
  onProcessedStream?: (stream: MediaStream) => void;
  onAudioLevel?: (level: number) => void;
}

export const AudioMixer = ({ audioContext, sourceNode, onProcessedStream, onAudioLevel }: AudioMixerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  
  // Spectrum data for visualization
  const [spectrumData, setSpectrumData] = useState<number[]>(new Array(32).fill(0));

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

  useEffect(() => {
    if (!audioContext || !sourceNode) return;

    let animationFrameId: number;

    try {
      // Create audio processing chain
      const lowShelf = audioContext.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 320;
      lowShelf.gain.value = lowGain;

      const midPeak = audioContext.createBiquadFilter();
      midPeak.type = 'peaking';
      midPeak.frequency.value = 1000;
      midPeak.Q.value = 1;
      midPeak.gain.value = midGain;

      const highShelf = audioContext.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 3200;
      highShelf.gain.value = highGain;

      // Compressor
      const compressor = audioContext.createDynamicsCompressor();
      if (compressorEnabled) {
        compressor.threshold.value = threshold;
        compressor.ratio.value = ratio;
        compressor.attack.value = attack;
        compressor.release.value = release;
        compressor.knee.value = knee;
      }

      // Limiter (second compressor with hard settings)
      const limiter = audioContext.createDynamicsCompressor();
      if (limiterEnabled) {
        limiter.threshold.value = limiterThreshold;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.001;
        limiter.release.value = 0.1;
        limiter.knee.value = 0;
      }

      // Reverb (convolver)
      const convolver = audioContext.createConvolver();
      const reverbGain = audioContext.createGain();
      const dryGain = audioContext.createGain();
      reverbGain.gain.value = reverbMix / 100;
      dryGain.gain.value = 1 - (reverbMix / 100);

      // Create impulse response for reverb
      const impulseLength = audioContext.sampleRate * 2;
      const impulse = audioContext.createBuffer(2, impulseLength, audioContext.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < impulseLength; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
        }
      }
      convolver.buffer = impulse;

      // Master gain
      const master = audioContext.createGain();
      master.gain.value = masterGain;

      // Analyzer for visualization - increased sensitivity
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      // MediaStreamDestination for broadcasting processed audio
      const destination = audioContext.createMediaStreamDestination();

      // Connect the chain
      sourceNode.connect(lowShelf);
      lowShelf.connect(midPeak);
      midPeak.connect(highShelf);
      
      if (compressorEnabled) {
        highShelf.connect(compressor);
        compressor.connect(dryGain);
        compressor.connect(convolver);
      } else {
        highShelf.connect(dryGain);
        highShelf.connect(convolver);
      }

      convolver.connect(reverbGain);
      
      const merger = audioContext.createChannelMerger(2);
      dryGain.connect(merger);
      reverbGain.connect(merger);

      if (limiterEnabled) {
        merger.connect(limiter);
        limiter.connect(master);
      } else {
        merger.connect(master);
      }

      master.connect(analyser);
      analyser.connect(destination); // Send processed audio to MediaStream for broadcast
      
      console.log('[AudioMixer] Audio chain established:', {
        hasAudioContext: !!audioContext,
        hasSourceNode: !!sourceNode,
        analyserFftSize: analyser.fftSize,
        contextState: audioContext.state
      });
      
      // Send processed stream back to broadcaster
      if (onProcessedStream) {
        console.log('[AudioMixer] Sending processed stream to broadcaster');
        onProcessedStream(destination.stream);
      }

      // Update spectrum visualization and audio levels with smoothing
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let smoothedLevel = 0;
      const smoothingFactor = 0.3; // Lower = smoother, higher = more responsive
      
      const updateSpectrum = () => {
        analyser.getByteFrequencyData(dataArray);
        setSpectrumData(Array.from(dataArray));
        
        // Calculate overall audio level
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const rawLevel = Math.min(100, (average / 255) * 100);
        
        // Apply exponential smoothing to reduce jitter
        smoothedLevel = smoothedLevel * (1 - smoothingFactor) + rawLevel * smoothingFactor;
        
        // Debug log occasionally
        if (Math.random() < 0.02) {
          console.log('[AudioMixer] Audio level:', smoothedLevel.toFixed(1), 'raw:', rawLevel.toFixed(1));
        }
        
        if (onAudioLevel) {
          onAudioLevel(smoothedLevel);
        }
        
        animationFrameId = requestAnimationFrame(updateSpectrum);
      };
      updateSpectrum();

      // Cleanup
      return () => {
        try {
          cancelAnimationFrame(animationFrameId);
          sourceNode.disconnect();
          lowShelf.disconnect();
          midPeak.disconnect();
          highShelf.disconnect();
          compressor.disconnect();
          limiter.disconnect();
          master.disconnect();
          analyser.disconnect();
          destination.disconnect();
        } catch (e) {
          console.error('Error disconnecting audio nodes:', e);
        }
      };
    } catch (error) {
      console.error('Audio mixer setup error:', error);
    }
  }, [audioContext, sourceNode, lowGain, midGain, highGain, compressorEnabled, threshold, ratio, attack, release, knee, limiterEnabled, limiterThreshold, masterGain, reverbMix, onProcessedStream, onAudioLevel]);

  if (!audioContext || !sourceNode) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Start preview to enable audio mixer</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
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

        {/* Spectrum Analyzer with EQ Response Curve */}
        <div className="mt-4 mb-4 relative">
          <div className="h-32 bg-black rounded-lg p-2 flex items-end gap-1">
            {spectrumData.map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-green-500/40 via-yellow-500/40 to-red-500/40 rounded-sm transition-all"
                style={{ height: `${(value / 255) * 100}%`, minHeight: '2px' }}
              />
            ))}
          </div>
          <canvas
            ref={canvasRef}
            width={800}
            height={128}
            className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
          />
        </div>

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
    </Card>
  );
};