import { useEffect } from "react";
import { motion } from "framer-motion";

interface StreamIntroProps {
  onComplete: () => void;
}

export const StreamIntro = ({ onComplete }: StreamIntroProps) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
      {/* HBO-style curtain opening effect */}
      <motion.div
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-b from-primary to-primary-dark origin-top"
      />
      
      {/* Logo reveal */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="relative z-10"
      >
        <motion.div
          animate={{
            filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
          }}
          transition={{
            duration: 2,
            repeat: 0,
          }}
          className="text-6xl md:text-8xl font-bold text-white text-center"
        >
          SONS OF LEGION
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 1, duration: 1 }}
          className="h-1 bg-gradient-to-r from-transparent via-white to-transparent mt-4"
        />
      </motion.div>

      {/* Light beams effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: [0, 0.3, 0], x: "100%" }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              ease: "linear",
            }}
            className="absolute h-full w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              top: 0,
              left: `${i * 20}%`,
              transform: "skewX(-20deg)",
            }}
          />
        ))}
      </div>
    </div>
  );
};