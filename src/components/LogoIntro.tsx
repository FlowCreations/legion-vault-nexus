import { useEffect, useState, useRef } from "react";
import solLogo from "@/assets/sol-logo-new.png";
import { Button } from "@/components/ui/button";

interface LogoIntroProps {
  onComplete: () => void;
}

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [phase, setPhase] = useState<"black" | "beams" | "reveal" | "glow" | "fadeout">("black");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!hasStarted) return;
    
    // Prevent multiple audio instances
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // START ANIMATION IMMEDIATELY after user clicks
    const blackTimer = setTimeout(() => setPhase("beams"), 500);
    const beamsTimer = setTimeout(() => setPhase("reveal"), 2000);
    const glowTimer = setTimeout(() => setPhase("glow"), 3500);
    const completeTimer = setTimeout(() => onComplete(), 6000);
    
    // Stop audio at exactly 8 seconds (music duration)
    const audioStopTimer = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 8000);
    
    // Play audio - now triggered by user interaction so it will work across browsers
    const playAudio = async () => {
      try {
        audioRef.current = new Audio('/intro-audio.wav');
        audioRef.current.volume = 0.7;
        await audioRef.current.play();
        console.log('✓ Intro audio playing - will stop at 8 seconds');
      } catch (err) {
        console.error('Audio playback failed:', err);
      }
    };
    
    playAudio();
    
    return () => {
      clearTimeout(blackTimer);
      clearTimeout(beamsTimer);
      clearTimeout(glowTimer);
      clearTimeout(completeTimer);
      clearTimeout(audioStopTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [onComplete, hasStarted]);

  // Show start button if not started yet
  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
        <img 
          src={solLogo}
          alt="Sons of Legion"
          className="h-48 sm:h-56 md:h-64 w-auto object-contain mb-8 opacity-80"
        />
        <Button
          onClick={() => setHasStarted(true)}
          size="lg"
          className="bg-primary hover:bg-primary-glow text-black font-bold px-8 py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(247,201,70,0.5)]"
        >
          Enter the Legion
        </Button>
        <p className="text-sm text-muted-foreground mt-4">Click to start your journey with sound</p>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Multiple rushing light beams with staggered timing */}
      {(phase === "beams" || phase === "reveal") && (
        <div className="absolute inset-0">
          {/* Main horizontal beams */}
          <div className="absolute top-[48%] left-0 h-2 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-90 animate-beam-fast-1" />
          <div className="absolute top-[52%] left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary-glow to-transparent opacity-80 animate-beam-fast-2" />
          <div className="absolute top-[50%] left-0 h-3 w-full bg-gradient-to-r from-transparent via-primary/90 to-transparent animate-beam-converge-fast shadow-[0_0_30px_rgba(247,201,70,0.8)]" />
          
          {/* Diagonal rushing beams */}
          <div className="absolute top-[30%] left-0 h-1 w-[200%] -translate-x-1/2 rotate-[8deg] bg-gradient-to-r from-transparent via-primary/70 to-transparent animate-beam-diagonal-1" />
          <div className="absolute top-[70%] left-0 h-1 w-[200%] -translate-x-1/2 -rotate-[8deg] bg-gradient-to-r from-transparent via-primary-glow/80 to-transparent animate-beam-diagonal-2" />
          <div className="absolute top-[40%] left-0 h-0.5 w-[200%] -translate-x-1/2 rotate-[15deg] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-beam-diagonal-3" />
          <div className="absolute top-[60%] left-0 h-0.5 w-[200%] -translate-x-1/2 -rotate-[15deg] bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-beam-diagonal-4" />
          
          {/* Additional accent beams */}
          <div className="absolute top-[35%] left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-beam-fast-3" />
          <div className="absolute top-[65%] left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-primary-glow/50 to-transparent animate-beam-fast-4" />
        </div>
      )}

      {/* Logo with continuous glowing animation */}
      {(phase === "reveal" || phase === "glow") && (
        <div 
          className={`transition-all duration-1000 ease-out ${
            phase === "reveal" ? "animate-logo-push-reveal" : 
            phase === "glow" ? "animate-logo-continuous-glow" : ""
          }`}
          style={{
            filter: "drop-shadow(0 0 50px rgba(247, 201, 70, 0.6)) drop-shadow(0 0 25px rgba(247, 201, 70, 0.8))"
          }}
        >
          <img 
            src={solLogo}
            alt="Sons of Legion"
            className="h-72 sm:h-80 md:h-96 lg:h-[28rem] w-auto object-contain"
          />
        </div>
      )}

      {/* Continuous warm halo */}
      {phase === "glow" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[900px] h-[900px] rounded-full bg-primary/8 blur-[120px] animate-pulse-glow" />
        </div>
      )}
    </div>
  );
}
