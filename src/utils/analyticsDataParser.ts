import type {
  ViberateMetrics,
  AudienceMapData,
  DailyEngagementData,
  WeeklyMetricsData,
  PlatformDistributionData,
  GrowthMetrics,
} from "@/types/analytics";

export const parseViberateProfile = async (): Promise<ViberateMetrics | null> => {
  try {
    const response = await fetch('/src/data/analytics/viberate-profile.csv');
    const text = await response.text();
    const lines = text.split('\n');
    
    if (lines.length < 2) return null;
    
    const headers = lines[0].split(',');
    const values = lines[1].split(',');
    
    const getValue = (key: string): string => {
      const index = headers.indexOf(key);
      return index >= 0 ? values[index]?.replace(/"/g, '').trim() : 'N/A';
    };
    
    const getNumber = (key: string): number => {
      const value = getValue(key);
      if (value === 'N/A' || value === '') return 0;
      return parseInt(value.replace(/,/g, ''), 10) || 0;
    };
    
    return {
      rank: getNumber('Viberate rank'),
      artist: getValue('Artist'),
      country: getValue('Country'),
      genre: getValue('Genre'),
      spotify: {
        followers: getNumber('Spotify followers'),
        followersChange1m: getNumber('Spotify followers - 1m'),
        monthlyListeners: getNumber('Spotify monthly listeners'),
        monthlyListenersChange1m: getNumber('Spotify monthly listeners - 1m'),
        totalStreams: getNumber('Spotify total streams'),
        totalStreamsChange1m: getNumber('Spotify total streams - 1m'),
        playlistReach: getNumber('Spotify playlist reach'),
        playlistReachChange1m: getNumber('Spotify playlist reach - 1m'),
        rank: getNumber('Spotify rank'),
      },
      youtube: {
        subscribers: getNumber('YouTube subscribers'),
        subscribersChange1m: getNumber('YouTube subscribers - 1m'),
        totalViews: getNumber('YouTube total views'),
        totalViewsChange1m: getNumber('YouTube total views - 1m'),
        totalLikes: getNumber('YouTube total likes'),
        totalLikesChange1m: getNumber('YouTube total likes - 1m'),
        rank: getNumber('YouTube rank'),
      },
      tiktok: {
        followers: getNumber('TikTok followers'),
        followersChange1m: getNumber('TikTok followers - 1m'),
        views1m: getNumber('TikTok views (1m)'),
        likes1m: getNumber('TikTok likes (1m)'),
        rank: getNumber('TikTok rank'),
      },
      instagram: {
        followers: getNumber('Instagram followers'),
        followersChange1m: getNumber('Instagram followers - 1m'),
        likes1m: getNumber('Instagram likes (1m)'),
        rank: getNumber('Instagram rank'),
      },
      facebook: {
        followers: getNumber('Facebook followers'),
        followersChange1m: getNumber('Facebook followers - 1m'),
        rank: getNumber('Facebook rank'),
      },
      deezer: {
        fans: getNumber('Deezer fans'),
        fansChange1m: getNumber('Deezer fans - 1m'),
        rank: getNumber('Deezer rank'),
      },
      soundcloud: {
        followers: getNumber('SoundCloud followers'),
        followersChange1m: getNumber('SoundCloud followers - 1m'),
        plays: getNumber('SoundCloud plays'),
        rank: getNumber('SoundCloud rank'),
      },
      radio: {
        spins1m: getNumber('Radio spins (1m)'),
        countries: getNumber('Radio countries'),
        stations: getNumber('Radio stations'),
        rank: getNumber('Radio rank'),
      },
      shazam: {
        shazams1m: getNumber('Shazam shazams (1m)'),
        rank: getNumber('Shazam rank'),
      },
      beatport: {
        followers: getNumber('Beatport followers'),
        rank: getNumber('Beatport rank'),
      },
    };
  } catch (error) {
    console.error('Error parsing Viberate profile:', error);
    return null;
  }
};

export const parseAudienceMap = async (): Promise<AudienceMapData[]> => {
  try {
    const response = await fetch('/src/data/analytics/audience-map.csv');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data: AudienceMapData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const getNum = (index: number) => parseFloat(values[index]) || 0;
      
      data.push({
        country: values[0],
        overallPercentage: getNum(1),
        spotify: {
          followers: getNum(2),
          percentage: getNum(3),
        },
        instagram: {
          followers: getNum(4),
          percentage: getNum(5),
        },
        tiktok: {
          followers: getNum(6),
          percentage: getNum(7),
        },
        youtube: {
          followers: getNum(8),
          percentage: getNum(9),
        },
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing audience map:', error);
    return [];
  }
};

export const parseEngagementTimeline = async (): Promise<DailyEngagementData[]> => {
  try {
    const response = await fetch('/src/data/analytics/engagement-fanbase.csv');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];
    
    const data: DailyEngagementData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const getNum = (index: number) => parseInt(values[index]) || 0;
      
      data.push({
        date: values[0],
        spotify: {
          followers: getNum(1),
          likes: getNum(2),
        },
        instagram: {
          followers: getNum(3),
          likes: getNum(4),
        },
        tiktok: {
          followers: getNum(5),
          likes: getNum(6),
        },
        facebook: {
          followers: getNum(7),
          likes: getNum(8),
        },
        youtube: {
          followers: getNum(9),
          subscribers: getNum(9),
          likes: getNum(10),
        },
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing engagement timeline:', error);
    return [];
  }
};

export const parseWeeklyMetrics = async (): Promise<WeeklyMetricsData[]> => {
  try {
    const response = await fetch('/src/data/analytics/fanbase-metrics.csv');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];
    
    const data: WeeklyMetricsData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const getNum = (index: number) => parseInt(values[index]) || 0;
      
      data.push({
        date: values[0],
        spotify: getNum(1),
        instagram: getNum(2),
        tiktok: getNum(3),
        facebook: getNum(4),
        youtube: getNum(5),
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing weekly metrics:', error);
    return [];
  }
};

export const parsePlatformDistribution = async (): Promise<PlatformDistributionData[]> => {
  try {
    const response = await fetch('/src/data/analytics/fanbase-total-distribution.csv');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];
    
    const data: PlatformDistributionData[] = [];
    const colors = {
      Facebook: 'hsl(var(--chart-1))',
      Instagram: 'hsl(var(--chart-2))',
      TikTok: 'hsl(var(--chart-3))',
      Spotify: 'hsl(var(--chart-4))',
      YouTube: 'hsl(var(--chart-5))',
    };
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      data.push({
        platform: values[0],
        followers: parseInt(values[1]) || 0,
        percentage: parseFloat(values[2]) || 0,
        color: colors[values[0] as keyof typeof colors] || 'hsl(var(--muted))',
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing platform distribution:', error);
    return [];
  }
};

export const calculateGrowthMetrics = (viberate: ViberateMetrics | null): GrowthMetrics[] => {
  if (!viberate) return [];
  
  const calculateTrend = (change: number): 'up' | 'down' | 'stable' => {
    if (change > 100) return 'up';
    if (change < -100) return 'down';
    return 'stable';
  };
  
  const calculatePercent = (current: number, change: number): number => {
    if (current === 0) return 0;
    return (change / (current - change)) * 100;
  };
  
  return [
    {
      platform: 'Spotify',
      current: viberate.spotify.followers,
      change1m: viberate.spotify.followersChange1m,
      changePercent: calculatePercent(viberate.spotify.followers, viberate.spotify.followersChange1m),
      trend: calculateTrend(viberate.spotify.followersChange1m),
    },
    {
      platform: 'YouTube',
      current: viberate.youtube.subscribers,
      change1m: viberate.youtube.subscribersChange1m,
      changePercent: calculatePercent(viberate.youtube.subscribers, viberate.youtube.subscribersChange1m),
      trend: calculateTrend(viberate.youtube.subscribersChange1m),
    },
    {
      platform: 'TikTok',
      current: viberate.tiktok.followers,
      change1m: viberate.tiktok.followersChange1m,
      changePercent: calculatePercent(viberate.tiktok.followers, viberate.tiktok.followersChange1m),
      trend: calculateTrend(viberate.tiktok.followersChange1m),
    },
    {
      platform: 'Instagram',
      current: viberate.instagram.followers,
      change1m: viberate.instagram.followersChange1m,
      changePercent: calculatePercent(viberate.instagram.followers, viberate.instagram.followersChange1m),
      trend: calculateTrend(viberate.instagram.followersChange1m),
    },
    {
      platform: 'Facebook',
      current: viberate.facebook.followers,
      change1m: viberate.facebook.followersChange1m,
      changePercent: calculatePercent(viberate.facebook.followers, viberate.facebook.followersChange1m),
      trend: calculateTrend(viberate.facebook.followersChange1m),
    },
  ];
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatPercentage = (percent: number): string => {
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
};
