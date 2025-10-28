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
    const response = await fetch('/data/analytics/viberate-profile.csv');
    if (!response.ok) {
      console.error('Failed to fetch viberate-profile.csv:', response.statusText);
      return null;
    }
    const text = await response.text();
    const lines = text.split('\n');
    
    if (lines.length < 2) {
      console.error('CSV file has insufficient data');
      return null;
    }
    
    // Parse CSV with proper handling of quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]);
    const values = parseCSVLine(lines[1]);
    
    console.log('CSV Headers:', headers);
    console.log('CSV Values:', values);
    
    const getValue = (key: string): string => {
      const index = headers.indexOf(key);
      if (index < 0) {
        console.warn(`Column "${key}" not found in CSV`);
        return 'N/A';
      }
      return values[index]?.replace(/"/g, '').trim() || 'N/A';
    };
    
    const getNumber = (key: string): number => {
      const value = getValue(key);
      if (value === 'N/A' || value === '') return 0;
      return parseInt(value.replace(/,/g, ''), 10) || 0;
    };
    
    return {
      rank: getNumber('Viberate Rank'),
      artist: getValue('Artist Name'),
      country: getValue('Country'),
      genre: getValue('Genre'),
      spotify: {
        followers: getNumber('Spotify Followers Total'),
        followersChange1m: getNumber('Spotify Followers 1m'),
        monthlyListeners: getNumber('Spotify Monthly Listeners Total'),
        monthlyListenersChange1m: getNumber('Spotify Monthly Listeners 1m'),
        totalStreams: getNumber('Spotify Streams Total'),
        totalStreamsChange1m: getNumber('Spotify Streams 1m'),
        playlistReach: getNumber('Spotify Playlist Reach Total'),
        playlistReachChange1m: 0, // Not in CSV
        rank: getNumber('Spotify Rank'),
      },
      youtube: {
        subscribers: getNumber('YouTube Subscribers Total'),
        subscribersChange1m: getNumber('YouTube Subscribers 1m'),
        totalViews: getNumber('YouTube Views Total'),
        totalViewsChange1m: getNumber('YouTube Views 1m'),
        totalLikes: getNumber('YouTube Likes Total'),
        totalLikesChange1m: getNumber('YouTube Likes 1m'),
        rank: getNumber('YouTube Rank'),
      },
      tiktok: {
        followers: getNumber('TikTok Followers Total'),
        followersChange1m: getNumber('TikTok Followers 1m'),
        views1m: getNumber('TikTok Views 1m'),
        likes1m: getNumber('TikTok Likes 1m'),
        rank: 0, // Not in CSV
      },
      instagram: {
        followers: getNumber('Instagram Followers Total'),
        followersChange1m: getNumber('Instagram Followers 1m'),
        likes1m: getNumber('Instagram Likes 1m'),
        rank: 0, // Not in CSV
      },
      facebook: {
        followers: getNumber('Facebook Followers Total'),
        followersChange1m: getNumber('Facebook Followers 1m'),
        rank: 0, // Not in CSV
      },
      deezer: {
        fans: getNumber('Deezer Fans Total'),
        fansChange1m: getNumber('Deezer Fans 1m'),
        rank: 0, // Not in CSV
      },
      soundcloud: {
        followers: getNumber('SoundCloud Followers Total'),
        followersChange1m: getNumber('SoundCloud Followers 1m'),
        plays: getNumber('SoundCloud Plays 1m'),
        rank: 0, // Not in CSV
      },
      radio: {
        spins1m: getNumber('Radio Airplay Spins 1m'),
        countries: getNumber('Radio Airplay Countries with Spins 1m'),
        stations: getNumber('Radio Airplay Stations with Spins 1m'),
        rank: getNumber('Radio Airplay Rank'),
      },
      shazam: {
        shazams1m: getNumber('Shazam Shazams 1m'),
        rank: 0, // Not in CSV
      },
      beatport: {
        followers: 0, // Not in CSV
        rank: 0, // Not in CSV
      },
    };
  } catch (error) {
    console.error('Error parsing Viberate profile:', error);
    return null;
  }
};

export const parseAudienceMap = async (): Promise<AudienceMapData[]> => {
  try {
    const response = await fetch('/data/analytics/audience-map.csv');
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
    const response = await fetch('/data/analytics/engagement-fanbase.csv');
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
    const response = await fetch('/data/analytics/fanbase-metrics.csv');
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
    const response = await fetch('/data/analytics/fanbase-total-distribution.csv');
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
