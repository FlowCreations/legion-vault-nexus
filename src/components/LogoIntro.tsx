import { useEffect, useState, useRef } from "react";
import solLogo from "@/assets/sol-logo-new.png";
import introAudio from "@/assets/intro-audio.wav";

interface LogoIntroProps {
  onComplete: () => void;
}

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const [phase, setPhase] = useState<"black" | "beams" | "reveal" | "pulse" | "still">("black");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play audio
    const audio = new Audio(introAudio);
    audio.volume = 0.7;
    
    // When audio ends, complete the intro
    audio.addEventListener('ended', () => {
      onComplete();
    });
    
    // Cinematic timing sequence
    const blackTimer = setTimeout(() => {
      setPhase("beams");
      audio.play().catch(err => console.log('Audio play failed:', err));
    }, 500);
    
    const beamsTimer = setTimeout(() => setPhase("reveal"), 2000);
    const revealTimer = setTimeout(() => setPhase("pulse"), 3200);
    const pulseTimer = setTimeout(() => setPhase("still"), 4000);

    return () => {
      clearTimeout(blackTimer);
      clearTimeout(beamsTimer);
      clearTimeout(revealTimer);
      clearTimeout(pulseTimer);
      audio.pause();
      audio.removeEventListener('ended', onComplete);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
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

      {/* Logo with camera push-through reveal */}
      {(phase === "reveal" || phase === "pulse" || phase === "still") && (
        <div 
          className={
            phase === "reveal" ? "animate-logo-push-reveal" : 
            phase === "pulse" ? "animate-logo-pulse-bright" : ""
          }
          style={{
            filter: phase === "still" 
              ? "drop-shadow(0 0 50px rgba(247, 201, 70, 0.4)) drop-shadow(0 0 25px rgba(247, 201, 70, 0.6))"
              : undefined
          }}
        >
          <img 
            src={solLogo}
            alt="Sons of Legion"
            className="h-72 sm:h-80 md:h-96 lg:h-[28rem] w-auto object-contain"
          />
        </div>
      )}

      {/* Subtle warm halo finale */}
      {(phase === "still" || phase === "pulse") && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[900px] h-[900px] rounded-full bg-primary/4 blur-[120px] animate-fade-in" />
        </div>
      )}
    </div>
  );
}
