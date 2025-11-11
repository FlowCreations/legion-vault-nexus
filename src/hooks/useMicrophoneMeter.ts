import { useEffect, useRef, useState } from "react";

interface MicMeterOptions {
  selectedMicId?: string;
  smoothing?: number;
  threshold?: number;
  sharedAudioContext?: AudioContext | null; // Accept shared context
}

export function useMicrophoneMeter({
  selectedMicId,
  smoothing = 0.3,
  threshold = -50,
  sharedAudioContext,
}: MicMeterOptions = {}) {
  const [micLevel, setMicLevel] = useState(-60);
  const [hasSignal, setHasSignal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const constraints: MediaStreamConstraints = {
          audio: { deviceId: selectedMicId ? { exact: selectedMicId } : undefined },
          video: false,
        };

        console.log("🎙️ Requesting mic with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const [track] = stream.getAudioTracks();

        if (!track) throw new Error("No audio track returned.");
        
        if (track.readyState !== "live") {
          console.warn("Track not live yet, waiting for activation...");
          await new Promise<void>(res => {
            track.onunmute = () => res();
          });
        }

        console.log("🎙️ Mic track:", {
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState,
          settings: track.getSettings(),
        });

        if (stream.getAudioTracks().length === 0) {
          throw new Error("No valid microphone input found");
        }

        // Use shared context if provided, otherwise create new one
        let ctx = sharedAudioContext;
        if (!ctx || ctx.state === "closed") {
          ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Resume if suspended (Safari/Chrome autoplay policy)
        if (ctx.state === "suspended") {
          console.log("🎙️ Resuming AudioContext...");
          await ctx.resume();
        }

        const source = ctx.createMediaStreamSource(stream);
        const gain = ctx.createGain();
        gain.gain.value = 1.0;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.0; // No smoothing to prevent signal flattening
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;

        source.connect(gain);
        gain.connect(analyser);

        const data = new Float32Array(analyser.fftSize);

        ctxRef.current = ctx;
        analyserRef.current = analyser;
        gainRef.current = gain;
        streamRef.current = stream;

        console.log("✅ Analyzer connected. Gain:", gain.gain.value, "Context state:", ctx.state);

        const animate = () => {
          if (!active) return;
          
          // Use time domain data for accurate RMS calculation
          analyser.getFloatTimeDomainData(data);
          
          // Calculate RMS (root mean square) energy
          let sumSquares = 0;
          for (let i = 0; i < data.length; i++) {
            sumSquares += data[i] * data[i];
          }
          const rms = Math.sqrt(sumSquares / data.length);
          const db = 20 * Math.log10(rms || 0.0001);
          
          // Apply smoothing for UI (not analyzer)
          const smoothed = micLevel * (1 - smoothing) + db * smoothing;

          setMicLevel(smoothed);
          setHasSignal(db > -55);
          rafRef.current = requestAnimationFrame(animate);
        };
        animate();
      } catch (err: any) {
        console.error("❌ useMicrophoneMeter error:", err);
        setError(err.message || "Microphone access error");
      }
    }

    init();

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      // Only close context if we created it (not shared)
      if (!sharedAudioContext && ctxRef.current) {
        ctxRef.current.close();
      }
    };
  }, [selectedMicId, smoothing, threshold, micLevel, sharedAudioContext]);

  return { micLevel, hasSignal, error, analyser: analyserRef.current, stream: streamRef.current, audioContext: ctxRef.current };
}
