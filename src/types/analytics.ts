export interface ViberateMetrics {
  rank: number;
  artist: string;
  country: string;
  genre: string;
  spotify: SpotifyMetrics;
  youtube: YouTubeMetrics;
  tiktok: TikTokMetrics;
  instagram: InstagramMetrics;
  facebook: FacebookMetrics;
  deezer: DeezerMetrics;
  soundcloud: SoundCloudMetrics;
  radio: RadioMetrics;
  shazam: ShazamMetrics;
  beatport: BeatportMetrics;
}

export interface SpotifyMetrics {
  followers: number;
  followersChange1m: number;
  monthlyListeners: number;
  monthlyListenersChange1m: number;
  totalStreams: number;
  totalStreamsChange1m: number;
  playlistReach: number;
  playlistReachChange1m: number;
  rank: number;
}

export interface YouTubeMetrics {
  subscribers: number;
  subscribersChange1m: number;
  totalViews: number;
  totalViewsChange1m: number;
  totalLikes: number;
  totalLikesChange1m: number;
  rank: number;
}

export interface TikTokMetrics {
  followers: number;
  followersChange1m: number;
  views1m: number;
  likes1m: number;
  rank: number;
}

export interface InstagramMetrics {
  followers: number;
  followersChange1m: number;
  likes1m: number;
  rank: number;
}

export interface FacebookMetrics {
  followers: number;
  followersChange1m: number;
  rank: number;
}

export interface DeezerMetrics {
  fans: number;
  fansChange1m: number;
  rank: number;
}

export interface SoundCloudMetrics {
  followers: number;
  followersChange1m: number;
  plays: number;
  rank: number;
}

export interface RadioMetrics {
  spins1m: number;
  countries: number;
  stations: number;
  rank: number;
}

export interface ShazamMetrics {
  shazams1m: number;
  rank: number;
}

export interface BeatportMetrics {
  followers: number;
  rank: number;
}

export interface AudienceMapData {
  country: string;
  overallPercentage: number;
  spotify: PlatformAudienceMetrics;
  instagram: PlatformAudienceMetrics;
  tiktok: PlatformAudienceMetrics;
  youtube: PlatformAudienceMetrics;
}

export interface PlatformAudienceMetrics {
  followers: number;
  percentage: number;
}

export interface DailyEngagementData {
  date: string;
  spotify: DailyPlatformEngagement;
  instagram: DailyPlatformEngagement;
  tiktok: DailyPlatformEngagement;
  facebook: DailyPlatformEngagement;
  youtube: DailyPlatformEngagement;
}

export interface DailyPlatformEngagement {
  followers: number;
  likes?: number;
  subscribers?: number;
}

export interface WeeklyMetricsData {
  date: string;
  spotify: number;
  instagram: number;
  tiktok: number;
  facebook: number;
  youtube: number;
}

export interface PlatformDistributionData {
  platform: string;
  followers: number;
  percentage: number;
  color: string;
}

export interface GrowthMetrics {
  platform: string;
  current: number;
  change1m: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}
