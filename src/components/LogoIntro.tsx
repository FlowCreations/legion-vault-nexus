import { useEffect, useState } from "react";
import solLogo from "@/assets/sol-logo-new.png";

interface LogoIntroProps {
  onComplete: () => void;
}

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const [phase, setPhase] = useState<"black" | "beams" | "reveal" | "glow" | "fadeout">("black");

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    
    // START ANIMATION IMMEDIATELY (don't wait for audio)
    const blackTimer = setTimeout(() => setPhase("beams"), 500);
    const beamsTimer = setTimeout(() => setPhase("reveal"), 2000);
    const glowTimer = setTimeout(() => setPhase("glow"), 3500);
    const completeTimer = setTimeout(() => onComplete(), 6000);
    
    // Stop audio at exactly 8 seconds (music duration)
    const audioStopTimer = setTimeout(() => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
      }
    }, 8000);
    
    // TRY TO PLAY AUDIO IN PARALLEL (optional enhancement)
    const tryPlayAudio = async () => {
      try {
        audio = new Audio('/intro-audio.wav');
        audio.volume = 0.7;
        await audio.play();
        console.log('✓ Intro audio playing - will stop at 8 seconds');
      } catch (err) {
        // If autoplay blocked, try with muted audio
        console.log('Audio autoplay blocked, trying muted...');
        try {
          if (audio) {
            audio.muted = true;
            await audio.play();
            // Gradually unmute (some browsers allow this)
            setTimeout(() => {
              if (audio) {
                audio.muted = false;
                audio.volume = 0.7;
              }
            }, 100);
          }
        } catch (mutedErr) {
          console.log('Audio completely blocked, continuing with silent animation');
        }
      }
    };
    
    tryPlayAudio();
    
    return () => {
      clearTimeout(blackTimer);
      clearTimeout(beamsTimer);
      clearTimeout(glowTimer);
      clearTimeout(completeTimer);
      clearTimeout(audioStopTimer);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
      }
    };
  }, [onComplete]);

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
