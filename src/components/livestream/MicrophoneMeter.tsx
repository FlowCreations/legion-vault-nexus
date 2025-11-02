import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MicrophoneMeter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startMicrophone = async () => {
    try {
      setError(null);
      
      // Request microphone permission with getUserMedia({ audio: true })
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create AudioContext and AnalyserNode to measure volume
      const ctx = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = ctx;
      
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.7;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      src.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx2d = canvas.getContext('2d');
      if (!ctx2d) return;
      
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      
      // Use requestAnimationFrame loop to update the visual meter in real-time
      function draw() {
        if (!canvasRef.current) return;
        
        animationFrameRef.current = requestAnimationFrame(draw);
        
        // Analyze the microphone stream
        analyser.getByteFrequencyData(dataArray);
        
        // Clear canvas
        ctx2d.clearRect(0, 0, WIDTH, HEIGHT);
        
        // Draw background
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx2d.fillRect(0, 0, WIDTH, HEIGHT);
        
        // Display audio levels as 10 vertical bars that react to microphone volume
        const barCount = 10;
        const barWidth = (WIDTH / barCount) - 2; // 2px gap between bars
        const binSize = Math.floor(dataArray.length / barCount);
        
        for (let i = 0; i < barCount; i++) {
          // Get average for this frequency band
          const start = i * binSize;
          const end = start + binSize;
          const bandData = dataArray.slice(start, end);
          const bandAvg = bandData.reduce((a, b) => a + b) / bandData.length;
          const level = Math.min(1, bandAvg / 255);
          
          // Calculate bar height based on real decibel intensity
          const barHeight = level * HEIGHT;
          const x = i * (barWidth + 2); // 2px gap
          
          // Create gradient for this bar (green → yellow → red)
          const gradient = ctx2d.createLinearGradient(0, HEIGHT, 0, HEIGHT - barHeight);
          gradient.addColorStop(0, '#22c55e');    // green
          gradient.addColorStop(0.5, '#eab308');  // yellow
          gradient.addColorStop(1, '#ef4444');    // red
          
          ctx2d.fillStyle = gradient;
          ctx2d.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
          
          // Add soft glow to each bar
          ctx2d.shadowBlur = 8;
          ctx2d.shadowColor = level < 0.4 ? '#22c55e' : level < 0.7 ? '#eab308' : '#ef4444';
          ctx2d.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
          ctx2d.shadowBlur = 0;
        }
      }
      
      draw();
      setIsActive(true);
      
    } catch (err) {
      console.error('Microphone error:', err);
      
      // Clear error handling if the user denies permission
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
          setError('Microphone access denied. Please allow microphone permission in your browser.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone and try again.');
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      }
      setIsActive(false);
    }
  };

  const stopMicrophone = () => {
    // Stop animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Clear canvas - show flat line when no input
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height);
        ctx2d.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx2d.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    setIsActive(false);
    setError(null);
  };

  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={isActive ? "destructive" : "default"}
        onClick={isActive ? stopMicrophone : startMicrophone}
      >
        {isActive ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
        {isActive ? 'Stop' : 'Test Mic'}
      </Button>
      
      <div className="relative">
        {/* Compact and clean canvas - 150px wide, 40px tall */}
        <canvas
          ref={canvasRef}
          width={150}
          height={40}
          className="rounded border border-white/20 bg-black/60"
          style={{ display: 'block' }}
        />
        
        {!isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
            Click to test
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
