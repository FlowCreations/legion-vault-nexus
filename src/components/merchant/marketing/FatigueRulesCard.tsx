import { motion } from "framer-motion";
import { Shield, CheckCircle, Clock, Moon } from "lucide-react";

interface FatigueRulesCardProps {
  rules: {
    maxEmailPer24h: number;
    maxSmsPer72h: number;
    silenceAfterPurchase: number;
    timezoneOptimization: boolean;
    protectedUsers: number;
  };
}

export function FatigueRulesCard({ rules }: FatigueRulesCardProps) {
  const ruleItems = [
    {
      icon: CheckCircle,
      text: `Max ${rules.maxEmailPer24h} email/24h`,
      active: true
    },
    {
      icon: CheckCircle,
      text: `Max ${rules.maxSmsPer72h} SMS/72h`,
      active: true
    },
    {
      icon: Moon,
      text: `${rules.silenceAfterPurchase}h silence after purchase`,
      active: true
    },
    {
      icon: Clock,
      text: "Timezone optimization ON",
      active: rules.timezoneOptimization
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Respecting User Preferences
          </h3>
          <p className="text-sm text-white/60">Anti-fatigue protection</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {ruleItems.map((rule, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex items-center gap-3"
          >
            <rule.icon className={`w-4 h-4 ${rule.active ? 'text-green-400' : 'text-white/40'}`} />
            <span className="text-sm text-white/80">{rule.text}</span>
          </motion.div>
        ))}
      </div>

      <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">Protected Users</span>
          <div className="text-2xl font-black text-green-400">
            {rules.protectedUsers.toLocaleString()}
          </div>
        </div>
        <div className="text-xs text-white/60 mt-1">
          Currently on cooldown period
        </div>
      </div>
    </motion.div>
  );
}
