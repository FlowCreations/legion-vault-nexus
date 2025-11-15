import { motion } from "framer-motion";
import { Users, MapPin, Zap, Star, Globe } from "lucide-react";

interface AudienceInsightsCardProps {
  stats: {
    totalMatches: number;
    nearbyUsers: number;
    highPtpUsers: number;
    loyalFans: number;
    travelingUsers: number;
    estimatedRevenue: number;
  };
}

export function AudienceInsightsCard({ stats }: AudienceInsightsCardProps) {
  const statItems = [
    {
      icon: MapPin,
      label: "Within 2hr drive",
      value: stats.nearbyUsers,
      color: "from-blue-400 to-cyan-400"
    },
    {
      icon: Zap,
      label: "High PTP (needs nudge)",
      value: stats.highPtpUsers,
      color: "from-yellow-400 to-orange-400"
    },
    {
      icon: Star,
      label: "Loyal fans",
      value: stats.loyalFans,
      color: "from-purple-400 to-pink-400"
    },
    {
      icon: Globe,
      label: "Traveling to area",
      value: stats.travelingUsers,
      color: "from-green-400 to-emerald-400"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {stats.totalMatches.toLocaleString()} Users Ready to Reach
          </h3>
          <p className="text-sm text-white/60">AI-selected target audience</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {statItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 rounded-lg p-4 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <item.icon className={`w-4 h-4 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`} />
              <span className="text-xs text-white/60">{item.label}</span>
            </div>
            <div className={`text-2xl font-black bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
              {item.value.toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">Estimated Reach</span>
          <div className="text-right">
            <div className="text-2xl font-black text-white">
              ${Math.round(stats.estimatedRevenue).toLocaleString()}
            </div>
            <div className="text-xs text-white/60">potential revenue</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
