import Papa from 'papaparse';
import { parse as dfParse, isValid } from 'date-fns';
import type {
  ViberateMetrics,
  AudienceMapData,
  DailyEngagementData,
  WeeklyMetricsData,
  PlatformDistributionData,
  GrowthMetrics,
} from "@/types/analytics";

// Flexible date parsing for various CSV formats
const DATE_PATTERNS = [
  "yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "MMM d, yyyy", "d MMM yyyy",
  "yyyy/MM/dd", "MM-dd-yyyy", "dd-MM-yyyy", "M/d/yyyy"
];

function parseFlexibleDate(s: string): Date | null {
  const trimmed = s?.toString().trim();
  if (!trimmed) return null;

  for (const pattern of DATE_PATTERNS) {
    const d = dfParse(trimmed, pattern, new Date());
    if (isValid(d)) return d;
  }
  const d2 = new Date(trimmed);
  return isValid(d2) ? d2 : null;
}

// Helper to parse numbers, handling "N/A" and commas
function parseNumber(value: string): number {
  if (!value || value === 'N/A' || value === '') return 0;
  const cleaned = value.replace(/[,"]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export interface AudienceDemographicsData {
  ageGroup: string;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  youtube: { total: number; male: number; female: number };
  instagram: { total: number; male: number; female: number };
  tiktok: { total: number; male: number; female: number };
}

// Fallback CSV parser (kept for backup)
const parseViberateProfileFromCSV = async (): Promise<ViberateMetrics | null> => {
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
        playlistReachChange1m: 0,
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
        rank: 0,
      },
      instagram: {
        followers: getNumber('Instagram Followers Total'),
        followersChange1m: getNumber('Instagram Followers 1m'),
        likes1m: getNumber('Instagram Likes 1m'),
        rank: 0,
      },
      facebook: {
        followers: getNumber('Facebook Followers Total'),
        followersChange1m: getNumber('Facebook Followers 1m'),
        rank: 0,
      },
      deezer: {
        fans: getNumber('Deezer Fans Total'),
        fansChange1m: getNumber('Deezer Fans 1m'),
        rank: 0,
      },
      soundcloud: {
        followers: getNumber('SoundCloud Followers Total'),
        followersChange1m: getNumber('SoundCloud Followers 1m'),
        plays: getNumber('SoundCloud Plays 1m'),
        rank: 0,
      },
      radio: {
        spins1m: getNumber('Radio Airplay Spins 1m'),
        countries: getNumber('Radio Airplay Countries with Spins 1m'),
        stations: getNumber('Radio Airplay Stations with Spins 1m'),
        rank: getNumber('Radio Airplay Rank'),
      },
      shazam: {
        shazams1m: getNumber('Shazam Shazams 1m'),
        rank: 0,
      },
      beatport: {
        followers: 0,
        rank: 0,
      },
    };
  } catch (error) {
    console.error('Error parsing Viberate profile:', error);
    return null;
  }
};

export const parseViberateProfile = async (): Promise<ViberateMetrics | null> => {
  try {
    // Import supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Fetch from live API via edge function
    const { data, error } = await supabase.functions.invoke('get-viberate-metrics', {
      body: { artist_id: 'sons-of-legion' }
    });

    if (error) {
      console.warn('Live API fetch failed, falling back to CSV:', error);
      return parseViberateProfileFromCSV();
    }

    if (!data?.metrics) {
      console.warn('No metrics in API response, falling back to CSV');
      return parseViberateProfileFromCSV();
    }

    return data.metrics as ViberateMetrics;
  } catch (error) {
    console.error('Error fetching Viberate profile:', error);
    return parseViberateProfileFromCSV();
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
    if (!response.ok) {
      console.error('Failed to fetch engagement-fanbase.csv:', response.statusText);
      return [];
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (h) => h.trim().replace(/^"|"$/g, ''),
        complete: (results) => {
          const data: DailyEngagementData[] = [];
          const rows = results.data as any[];
          
          if (rows.length > 0) {
            console.log('✅ Engagement CSV columns:', Object.keys(rows[0]));
          }
          
          for (const row of rows) {
            const dateStr = row['Date'] || row['date'];
            if (!dateStr) continue;
            
            data.push({
              date: dateStr,
              spotify: {
                followers: parseNumber(row['Spotify Followers'] || '0'),
                likes: 0,
              },
              instagram: {
                followers: parseNumber(row['Instagram Followers'] || '0'),
                likes: 0,
              },
              tiktok: {
                followers: parseNumber(row['TikTok Followers'] || '0'),
                likes: 0,
              },
              facebook: {
                followers: parseNumber(row['Facebook Followers'] || '0'),
                likes: 0,
              },
              youtube: {
                followers: parseNumber(row['Youtube Subscribers'] || '0'),
                subscribers: parseNumber(row['Youtube Subscribers'] || '0'),
                likes: 0,
              },
            });
          }
          
          console.log(`✅ Engagement Timeline loaded: ${data.length} data points`);
          if (data.length > 0) {
            console.log('First entry:', data[0]);
            console.log('Last entry:', data[data.length - 1]);
          }
          resolve(data);
        },
        error: (error) => {
          console.error('❌ Error parsing engagement timeline:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error loading engagement timeline:', error);
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
    if (!response.ok) {
      console.error('Failed to fetch fanbase-total-distribution.csv:', response.statusText);
      return [];
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().replace(/^"|"$/g, ''),
        complete: (results) => {
          const data: PlatformDistributionData[] = [];
          const rows = results.data as any[];
          
          if (rows.length > 0) {
            console.log('✅ Platform CSV columns:', Object.keys(rows[0]));
          }
          
          const colors = {
            'Facebook followers': 'hsl(var(--chart-1))',
            'Instagram followers': 'hsl(var(--chart-2))',
            'TikTok followers': 'hsl(var(--chart-3))',
            'Spotify followers': 'hsl(var(--chart-4))',
            'YouTube subscribers': 'hsl(var(--chart-5))',
            'Deezer fans': 'hsl(var(--chart-1))',
            'Soundcloud followers': 'hsl(var(--chart-2))',
          };
          
          for (const row of rows) {
            const channel = row['Channel'] || row['channel'];
            const total = parseNumber(row['Total'] || row['total'] || '0');
            const percentage = parseFloat(row['Percentage'] || row['percentage'] || '0');
            
            // Skip "Total Fanbase Size" row
            if (channel && channel !== 'Total Fanbase Size' && total > 0) {
              const platformName = channel.replace(/\s+(followers|subscribers|fans)/i, '');
              
              data.push({
                platform: platformName,
                followers: total,
                percentage: percentage,
                color: colors[channel as keyof typeof colors] || 'hsl(var(--muted))',
              });
            }
          }
          
          console.log('✅ Platform Distribution loaded:', data);
          resolve(data);
        },
        error: (error) => {
          console.error('❌ Error parsing platform distribution:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error parsing platform distribution:', error);
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

export interface TopTrackData {
  rank: number;
  title: string;
  streams: number;
  percentOfTotal: number;
}

export const parseTopTracks = async (period: '7days' | '28days' | 'alltime'): Promise<TopTrackData[]> => {
  try {
    const fileName = `top-tracks-${period}.csv`;
    const response = await fetch(`/data/analytics/${fileName}`);
    if (!response.ok) {
      console.error(`Failed to fetch ${fileName}:`, response.statusText);
      return [];
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().replace(/^"|"$/g, ''),
        complete: (results) => {
          const rows = results.data as any[];
          
          const data: TopTrackData[] = rows.map(row => ({
            rank: parseInt(row['Rank'] || '0', 10),
            title: row['Track Name'] || '',
            streams: parseInt(row['Streams']?.replace(/,/g, '') || '0', 10),
            percentOfTotal: parseFloat(row['Percent of Total'] || '0'),
          })).filter(track => track.title && track.rank > 0);
          
          console.log(`✅ Top Tracks (${period}) loaded:`, data.length, 'tracks');
          resolve(data);
        },
        error: (error) => {
          console.error(`❌ Error parsing top tracks (${period}):`, error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`❌ Error loading top tracks (${period}):`, error);
    return [];
  }
};

export const parseAudienceDemographics = async (): Promise<AudienceDemographicsData[]> => {
  try {
    const response = await fetch('/data/analytics/audience-gender-age.csv');
    if (!response.ok) {
      console.error('Failed to fetch audience-gender-age.csv:', response.statusText);
      return [];
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().replace(/^"|"$/g, ''),
        complete: (results) => {
          const rows = results.data as any[];
          
          console.log('✅ Demographics CSV columns:', Object.keys(rows[0] || {}));
          
          const data: AudienceDemographicsData[] = rows
            .filter(r => {
              const ageGroup = (r['Age group'] || '').toLowerCase();
              return ageGroup && !ageGroup.includes('overall') && ageGroup.trim() !== '';
            })
            .map(r => {
              const male = parseNumber(r['Overall Male'] || '0');
              const female = parseNumber(r['Overall Female'] || '0');
              const youtubeMale = parseNumber(r['YouTube Male Subscribers'] || '0');
              const youtubeFemale = parseNumber(r['YouTube Female Subscribers'] || '0');
              const instagramMale = parseNumber(r['Instagram Male Followers'] || '0');
              const instagramFemale = parseNumber(r['Instagram Female Followers'] || '0');
              const tiktokMale = parseNumber(r['TikTok Male Followers'] || '0');
              const tiktokFemale = parseNumber(r['TikTok Female Followers'] || '0');
              
              return {
                ageGroup: r['Age group'],
                totalCount: male + female,
                maleCount: male,
                femaleCount: female,
                youtube: { total: youtubeMale + youtubeFemale, male: youtubeMale, female: youtubeFemale },
                instagram: { total: instagramMale + instagramFemale, male: instagramMale, female: instagramFemale },
                tiktok: { total: tiktokMale + tiktokFemale, male: tiktokMale, female: tiktokFemale }
              };
            });
          
          console.log('Demographics loaded:', data.length, 'age groups');
          resolve(data);
        },
        error: (error) => reject(error)
      });
    });
  } catch (error) {
    console.error('Error loading demographics:', error);
    return [];
  }
};
