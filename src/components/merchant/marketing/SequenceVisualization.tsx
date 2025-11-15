import { motion } from "framer-motion";
import { Mail, MessageSquare, Bell, Send } from "lucide-react";

interface Step {
  day: number;
  channel: string;
  message: string;
  targetCount: number;
}

interface SequenceVisualizationProps {
  steps: Step[];
}

export function SequenceVisualization({ steps }: SequenceVisualizationProps) {
  const channelIcons: { [key: string]: any } = {
    email: Mail,
    sms: MessageSquare,
    popup: Bell,
    inbox: Send
  };

  const channelColors: { [key: string]: string } = {
    email: "from-blue-400 to-cyan-400",
    sms: "from-green-400 to-emerald-400",
    popup: "from-yellow-400 to-orange-400",
    inbox: "from-purple-400 to-pink-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
    >
      <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        📬 Communication Strategy
      </h3>

      <div className="space-y-4">
        {steps.map((step, i) => {
          const Icon = channelIcons[step.channel.toLowerCase()] || Mail;
          const colorClass = channelColors[step.channel.toLowerCase()] || "from-gray-400 to-gray-500";

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              {i < steps.length - 1 && (
                <div className="absolute left-5 top-12 w-0.5 h-8 bg-gradient-to-b from-white/20 to-transparent" />
              )}
              
              <div className="flex items-start gap-4 bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent`}>
                      Day {step.day}
                    </span>
                    <span className="text-xs text-white/40">→</span>
                    <span className="text-xs text-white/60 uppercase tracking-wider">
                      {step.channel}
                    </span>
                    <span className="text-xs text-white/40">
                      ({step.targetCount.toLocaleString()} users)
                    </span>
                  </div>
                  <p className="text-sm text-white/80">"{step.message}"</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
