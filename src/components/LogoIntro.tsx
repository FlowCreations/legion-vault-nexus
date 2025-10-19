import { useEffect, useState } from "react";
import solLogo from "@/assets/sol-logo-new.png";

interface LogoIntroProps {
  onComplete: () => void;
}

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const [phase, setPhase] = useState<"black" | "beams" | "reveal" | "pulse" | "still">("black");

  useEffect(() => {
    // Cinematic timing sequence
    const blackTimer = setTimeout(() => setPhase("beams"), 800); // Black screen with rumble
    const beamsTimer = setTimeout(() => setPhase("reveal"), 2300); // Beams rushing
    const revealTimer = setTimeout(() => setPhase("pulse"), 3500); // Logo revealed
    const pulseTimer = setTimeout(() => setPhase("still"), 4200); // Glow pulse
    const completeTimer = setTimeout(() => onComplete(), 5000); // Hold on still

    return () => {
      clearTimeout(blackTimer);
      clearTimeout(beamsTimer);
      clearTimeout(revealTimer);
      clearTimeout(pulseTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* Light Beams - Fast rushing motion */}
      {(phase === "beams" || phase === "reveal") && (
        <div className="absolute inset-0">
          {/* Horizontal beams */}
          <div className="absolute top-[45%] left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-beam-1" />
          <div className="absolute top-[55%] left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-primary-glow to-transparent animate-beam-2" />
          <div className="absolute top-[50%] left-0 h-2 w-full bg-gradient-to-r from-transparent via-primary/80 to-transparent animate-beam-converge" />
          
          {/* Diagonal beams */}
          <div className="absolute top-[35%] left-0 h-0.5 w-[150%] -translate-x-1/4 rotate-12 bg-gradient-to-r from-primary/0 via-primary to-primary/0 animate-beam-4" />
          <div className="absolute top-[65%] left-0 h-1 w-[150%] -translate-x-1/4 -rotate-12 bg-gradient-to-r from-primary/0 via-primary-glow/90 to-primary/0 animate-beam-5" />
          <div className="absolute top-[40%] left-0 h-0.5 w-[150%] -translate-x-1/4 rotate-6 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-beam-3" />
        </div>
      )}

      {/* Logo Reveal with push-through effect */}
      {(phase === "reveal" || phase === "pulse" || phase === "still") && (
        <div 
          className={
            phase === "reveal" ? "animate-logo-reveal" : 
            phase === "pulse" ? "animate-logo-pulse" : ""
          }
          style={{
            filter: phase === "still" 
              ? "drop-shadow(0 0 60px rgba(247, 201, 70, 0.5)) drop-shadow(0 0 30px rgba(247, 201, 70, 0.7))"
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

      {/* Subtle warm halo in final phase */}
      {phase === "still" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] rounded-full bg-primary/5 blur-[100px] animate-fade-in" />
        </div>
      )}
    </div>
  );
}
