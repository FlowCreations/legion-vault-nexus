import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface StreamCountdownProps {
  onComplete: () => void;
}

export const StreamCountdown = ({ onComplete }: StreamCountdownProps) => {
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <motion.div
        key={count}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: 0,
          }}
          className="text-9xl font-bold text-white mb-4"
        >
          {count}
        </motion.div>
        <p className="text-2xl text-white/80">Stream starting in...</p>
      </motion.div>
    </div>
  );
};