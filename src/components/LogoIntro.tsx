import { useEffect, useState, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import solLogo from "@/assets/sol-logo-new.png";
import { Button } from "@/components/ui/button";

interface LogoIntroProps {
  onComplete: () => void;
}

export default function LogoIntro({ onComplete }: LogoIntroProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const logoControls = useAnimation();
  const beamControls = useAnimation();
  const backgroundControls = useAnimation();

  useEffect(() => {
    if (!hasStarted) return;
    
    // Prevent multiple audio instances
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Play audio - now triggered by user interaction
    const playAudio = async () => {
      try {
        audioRef.current = new Audio('/intro-audio.wav');
        audioRef.current.volume = 0.7;
        await audioRef.current.play();
        console.log('✓ Intro audio playing');
      } catch (err) {
        console.error('Audio playback failed:', err);
      }
    };
    
    // Orchestrate the animation sequence
    const playSequence = async () => {
      // Start audio
      playAudio();
      
      // Phase 1: Background fade in (0-500ms)
      await backgroundControls.start({
        opacity: [0, 1],
        transition: { duration: 0.5, ease: "easeOut" }
      });
      
      // Phase 2: Light beams rush in (500-2500ms)
      beamControls.start({
        opacity: [0, 0.9, 0.9],
        scale: [0.8, 1],
        transition: { duration: 2, ease: "easeOut" }
      });
      
      // Phase 3: Logo reveals with pulse (2000-3500ms)
      await new Promise(res => setTimeout(res, 1500));
      await logoControls.start({
        opacity: [0, 1],
        scale: [0.5, 1.05, 1],
        filter: [
          "drop-shadow(0 0 0px rgba(247, 201, 70, 0))",
          "drop-shadow(0 0 60px rgba(247, 201, 70, 0.8))",
          "drop-shadow(0 0 40px rgba(247, 201, 70, 0.6))"
        ],
        transition: { duration: 1.5, ease: "easeOut" }
      });
      
      // Phase 4: Logo glows and pulses (3500-5500ms)
      logoControls.start({
        filter: [
          "drop-shadow(0 0 40px rgba(247, 201, 70, 0.6))",
          "drop-shadow(0 0 60px rgba(247, 201, 70, 0.8))",
          "drop-shadow(0 0 40px rgba(247, 201, 70, 0.6))"
        ],
        transition: { 
          duration: 2,
          repeat: 0,
          ease: "easeInOut"
        }
      });
      
      // Phase 5: Transition to hero position (5500-6500ms)
      await new Promise(res => setTimeout(res, 2000));
      
      // Fade out beams
      beamControls.start({
        opacity: 0,
        transition: { duration: 0.8, ease: "easeOut" }
      });
      
      // Background transitions to normal
      backgroundControls.start({
        opacity: 0,
        transition: { duration: 1, ease: "easeInOut" }
      });
      
      // Logo moves to hero position with smooth morph
      await logoControls.start({
        y: "15vh",
        scale: 0.85,
        filter: "drop-shadow(0 0 30px rgba(247, 201, 70, 0.5))",
        transition: { 
          duration: 1,
          ease: [0.4, 0, 0.2, 1] // Custom easing for smooth flow
        }
      });
      
      // Complete transition
      await new Promise(res => setTimeout(res, 200));
      onComplete();
    };
    
    playSequence();
    
    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [onComplete, hasStarted, logoControls, beamControls, backgroundControls]);

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
    <motion.div 
      initial={{ opacity: 1 }}
      animate={backgroundControls}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Animated background with gradient glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={backgroundControls}
        className="absolute inset-0 bg-gradient-cosmic"
      >
        <motion.div 
          className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl -translate-y-1/2"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 3,
            delay: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Light beams with particle effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={beamControls}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Main converging beams */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? "-100%" : "100%" }}
            animate={{ 
              opacity: [0, 0.6, 0],
              x: "0%"
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.15,
              ease: "easeOut"
            }}
            className={`absolute h-0.5 w-full bg-gradient-to-r ${
              i % 2 === 0 
                ? "from-transparent via-primary to-transparent" 
                : "from-transparent via-primary-glow to-transparent"
            }`}
            style={{
              top: `${45 + i * 1.5}%`,
              filter: "blur(1px)"
            }}
          />
        ))}
        
        {/* Diagonal sweeping beams */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`diag-${i}`}
            initial={{ opacity: 0, x: "-50%", y: "-50%" }}
            animate={{ 
              opacity: [0, 0.4, 0],
              x: "50%",
              y: "50%"
            }}
            transition={{
              duration: 2,
              delay: 0.5 + i * 0.2,
              ease: "linear"
            }}
            className="absolute h-0.5 w-[200%] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            style={{
              top: `${30 + i * 15}%`,
              transform: `rotate(${i % 2 === 0 ? 12 : -12}deg)`,
              filter: "blur(2px)"
            }}
          />
        ))}
      </motion.div>

      {/* Logo with flowing animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={logoControls}
        className="relative z-10"
      >
        <img 
          src={solLogo}
          alt="Sons of Legion"
          className="h-72 sm:h-80 md:h-96 lg:h-[28rem] w-auto object-contain"
        />
        
        {/* Pulsing halo behind logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.3, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 -z-10 flex items-center justify-center"
        >
          <div className="w-[600px] h-[600px] rounded-full bg-primary/20 blur-[100px]" />
        </motion.div>
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            initial={{ 
              opacity: 0,
              x: `${Math.random() * 100}%`,
              y: "100%",
            }}
            animate={{
              opacity: [0, 0.6, 0],
              y: "-20%",
              x: `${Math.random() * 100}%`,
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: 1 + Math.random() * 2,
              ease: "easeOut"
            }}
            className="absolute w-1 h-1 bg-primary rounded-full"
            style={{
              filter: "blur(1px)",
              boxShadow: "0 0 4px rgba(247, 201, 70, 0.8)"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
