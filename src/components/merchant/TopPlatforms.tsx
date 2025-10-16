import { useState } from "react";

interface Platform {
  name: string;
  icon: string;
  streams: number;
  color: string;
}

export const TopPlatforms = () => {
  const platforms: Platform[] = [
    { name: "Website", icon: "🌐", streams: 2847, color: "from-blue-500/20 to-blue-500/5" },
    { name: "Mobile App", icon: "📱", streams: 1523, color: "from-purple-500/20 to-purple-500/5" },
    { name: "Social Media", icon: "📲", streams: 892, color: "from-pink-500/20 to-pink-500/5" },
  ];

  const sources = [
    { name: "Direct", icon: "🎯", count: 1234 },
    { name: "Search", icon: "🔍", count: 856 },
    { name: "Social", icon: "👥", count: 645 },
    { name: "Email", icon: "✉️", count: 432 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold">Top Platforms</h2>
      <p className="text-gray-400">
        Your top platform over the past 7 days was <span className="text-white font-semibold">Website</span>, 
        where you had <span className="text-white font-semibold">{platforms[0].streams.toLocaleString()}</span> visits
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <div
            key={platform.name}
            className="p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${platform.color} flex items-center justify-center text-3xl mb-4`}>
              {platform.icon}
            </div>
            <div className="text-lg font-semibold mb-1">{platform.name}</div>
            <div className="text-3xl font-bold">{platform.streams.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 mt-4">
        Source: Website Analytics - As of {new Date().toLocaleDateString()}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {sources.map((source) => (
          <div
            key={source.name}
            className="p-4 rounded-lg bg-white/5 border border-white/10 text-center"
          >
            <div className="text-3xl mb-2">{source.icon}</div>
            <div className="text-sm text-gray-400 mb-1">{source.name}</div>
            <div className="text-2xl font-bold">{source.count}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Traffic source data only includes tracked visits
      </div>
    </div>
  );
};
