import { useEffect, useState } from "react";
import solLogo from "@/assets/sol-logo-new.png";

interface LogoIntroProps {
  onComplete: () => void;
}

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const [phase, setPhase] = useState<"black" | "beams" | "reveal" | "glow">("black");

  useEffect(() => {
    // Phase timing
    const blackTimer = setTimeout(() => setPhase("beams"), 500);
    const beamsTimer = setTimeout(() => setPhase("reveal"), 2000);
    const revealTimer = setTimeout(() => setPhase("glow"), 3500);
    const completeTimer = setTimeout(() => onComplete(), 5000);

    return () => {
      clearTimeout(blackTimer);
      clearTimeout(beamsTimer);
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
      {/* Light Beams */}
      {(phase === "beams" || phase === "reveal") && (
        <>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-beam-1" />
            <div className="absolute top-1/3 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary-glow to-transparent animate-beam-2" />
            <div className="absolute top-2/3 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent animate-beam-3" />
            <div className="absolute top-1/4 left-0 h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 animate-beam-4 origin-center" style={{ transform: 'rotate(-15deg)' }} />
            <div className="absolute top-3/4 left-0 h-0.5 w-full bg-gradient-to-r from-primary/50 via-primary-glow to-primary/50 animate-beam-5 origin-center" style={{ transform: 'rotate(15deg)' }} />
            <div className="absolute top-1/2 left-0 h-2 w-full bg-gradient-to-r from-transparent via-primary-glow/80 to-transparent animate-beam-converge" />
          </div>
        </>
      )}

      {/* Logo Reveal */}
      {(phase === "reveal" || phase === "glow") && (
        <div className={phase === "reveal" ? "animate-logo-reveal" : "animate-logo-glow"}>
          <img 
            src={solLogo}
            alt="Sons of Legion"
            className="h-64 sm:h-80 md:h-96 w-auto object-contain"
            style={{
              filter: phase === "glow" 
                ? "drop-shadow(0 0 80px rgba(247, 201, 70, 0.6)) drop-shadow(0 0 40px rgba(247, 201, 70, 0.8))"
                : "drop-shadow(0 0 120px rgba(247, 201, 70, 0.9))"
            }}
          />
        </div>
      )}

      {/* Subtle Halo in final phase */}
      {phase === "glow" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-fade-in" />
        </div>
      )}
    </div>
  );
}
