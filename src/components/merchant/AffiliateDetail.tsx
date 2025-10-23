import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, MapPin, TrendingUp, Facebook, Instagram, Twitter, Youtube, ExternalLink, Power, PowerOff, Music, Video, Clock } from "lucide-react";
import { AffiliateContentManager } from "./AffiliateContentManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackAffiliateContentClick } from "@/utils/affiliateAnalytics";
import { formatDistanceToNow } from "date-fns";

interface Affiliate {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  ethos: string | null;
  non_negotiables: string[] | null;
  status?: string;
  social_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  analytics: {
    total_members?: number;
    totalMembers?: number;
    active_members?: number;
    activeMembers?: number;
    highly_active?: number;
    medium_active?: number;
    low_active?: number;
    top_locations?: string[];
    topLocations?: string[];
    affiliationScore?: number;
  };
}

interface AffiliateContent {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_type: string | null;
  content_url: string | null;
  click_count: number | null;
  last_clicked_at: string | null;
}

interface AffiliateDetailProps {
  affiliate: Affiliate;
  content: AffiliateContent[];
  onClose: () => void;
  onContentUpdate: () => void;
}

export function AffiliateDetail({ affiliate, content, onClose, onContentUpdate }: AffiliateDetailProps) {
  const isActive = affiliate.status === 'active';
  const [contentAnalytics, setContentAnalytics] = useState({
    totalClicks: 0,
    musicClicks: 0,
    videoClicks: 0,
    lastClicked: null as string | null,
  });

  useEffect(() => {
    calculateAnalytics();
  }, [content]);

  const calculateAnalytics = () => {
    const totalClicks = content.reduce((sum, item) => sum + (item.click_count || 0), 0);
    const musicClicks = content
      .filter(item => item.content_type === 'music')
      .reduce((sum, item) => sum + (item.click_count || 0), 0);
    const videoClicks = content
      .filter(item => item.content_type === 'video')
      .reduce((sum, item) => sum + (item.click_count || 0), 0);
    const lastClicked = content
      .filter(item => item.last_clicked_at)
      .sort((a, b) => new Date(b.last_clicked_at!).getTime() - new Date(a.last_clicked_at!).getTime())[0]?.last_clicked_at || null;

    setContentAnalytics({
      totalClicks,
      musicClicks,
      videoClicks,
      lastClicked,
    });
  };

  const topContent = [...content]
    .filter(item => item.click_count && item.click_count > 0)
    .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
    .slice(0, 5);

  const handleToggleActivation = async () => {
    try {
      const newStatus = isActive ? 'inactive' : 'active';
      const { error } = await supabase
        .from('affiliates')
        .update({ status: newStatus })
        .eq('id', affiliate.id);

      if (error) throw error;

      toast.success(`Affiliate ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      onContentUpdate();
    } catch (error) {
      console.error('Error toggling activation:', error);
      toast.error("Failed to update status");
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="content">Manage Content</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Ethos Card */}
        <Card className="border-2 border-affirmative-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={affiliate.avatar_url || undefined} alt={affiliate.name} />
                  <AvatarFallback>{affiliate.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{affiliate.name}</CardTitle>
                  <CardDescription>{affiliate.bio}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={isActive ? "destructive" : "default"}
                  onClick={handleToggleActivation}
                >
                  {isActive ? (
                    <>
                      <PowerOff className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={onClose}>Close</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Performance Analytics */}
            <Card className="border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Content Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm">Total Clicks</span>
                    </div>
                    <p className="text-2xl font-bold text-affirmative-primary">
                      {contentAnalytics.totalClicks.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Music className="h-4 w-4" />
                      <span className="text-sm">Music Clicks</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {contentAnalytics.musicClicks.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Video className="h-4 w-4" />
                      <span className="text-sm">Video Clicks</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {contentAnalytics.videoClicks.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Last Click</span>
                    </div>
                    <p className="text-sm font-medium">
                      {contentAnalytics.lastClicked 
                        ? formatDistanceToNow(new Date(contentAnalytics.lastClicked), { addSuffix: true })
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Top Performing Content */}
                {topContent.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-3">Top Performing Content</h4>
                    <div className="space-y-2">
                      {topContent.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                          <span className="text-lg font-bold text-muted-foreground w-6">
                            #{idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {item.content_type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-affirmative-primary">
                              {item.click_count} clicks
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Affiliation Score */}
            {affiliate.analytics.affiliationScore && (
              <div className="flex items-center justify-between p-4 bg-affirmative-primary/10 rounded-lg border border-affirmative-primary/20">
                <div>
                  <p className="text-sm text-muted-foreground">Affiliation Performance Score</p>
                  <p className="text-3xl font-bold text-affirmative-primary">{affiliate.analytics.affiliationScore}/100</p>
                </div>
                <TrendingUp className="h-12 w-12 text-affirmative-primary" />
              </div>
            )}
            
            {/* Analytics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Total Members</span>
                </div>
                <p className="text-2xl font-bold">{(affiliate.analytics.total_members || affiliate.analytics.totalMembers || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Active Members</span>
                </div>
                <p className="text-2xl font-bold">{(affiliate.analytics.active_members || affiliate.analytics.activeMembers || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Highly Active</span>
                </div>
                <p className="text-2xl font-bold text-affirmative-primary">{affiliate.analytics.highly_active || '0'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Top Locations</span>
                </div>
                <p className="text-sm font-medium">{(affiliate.analytics.top_locations || affiliate.analytics.topLocations || []).slice(0, 2).join(', ') || 'N/A'}</p>
              </div>
            </div>

            {/* Activity Breakdown */}
            <div>
              <h4 className="font-semibold mb-3">Community Activity</h4>
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3 bg-affirmative-primary/10 border-affirmative-primary/20">
                  <p className="text-sm text-muted-foreground">Highly Active</p>
                  <p className="text-xl font-bold text-affirmative-primary">{affiliate.analytics.highly_active || 0}</p>
                </Card>
                <Card className="p-3 bg-accent/10 border-accent/20">
                  <p className="text-sm text-muted-foreground">Medium Active</p>
                  <p className="text-xl font-bold text-accent">{affiliate.analytics.medium_active || 0}</p>
                </Card>
                <Card className="p-3 bg-muted/50">
                  <p className="text-sm text-muted-foreground">Low Active</p>
                  <p className="text-xl font-bold">{affiliate.analytics.low_active || 0}</p>
                </Card>
              </div>
            </div>

            {/* Ethos */}
            {affiliate.ethos && (
              <div>
                <h4 className="font-semibold mb-2">Our Ethos</h4>
                <p className="text-muted-foreground italic">{affiliate.ethos}</p>
              </div>
            )}

            {/* Non-Negotiables */}
            {affiliate.non_negotiables && affiliate.non_negotiables.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Non-Negotiables</h4>
                <div className="flex flex-wrap gap-2">
                  {affiliate.non_negotiables.map((item, idx) => (
                    <Badge key={idx} variant="destructive">{item}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {affiliate.social_links && Object.keys(affiliate.social_links).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Social Media</h4>
                <div className="flex gap-2">
                  {Object.entries(affiliate.social_links).map(([platform, url]) => (
                    url && (
                      <Button
                        key={platform}
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {getSocialIcon(platform)}
                          <span className="ml-2 capitalize">{platform}</span>
                        </a>
                      </Button>
                    )
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* You Might Also Like */}
        {content.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>You May Also Like</CardTitle>
              <CardDescription>Content from {affiliate.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {content.map((item) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer space-y-2"
                    onClick={() => item.content_url && trackAffiliateContentClick(item.id, item.content_url)}
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted relative">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = '';
                            e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-2 group-hover:text-affirmative-primary transition-colors">
                        {item.title}
                      </p>
                      {item.content_type && (
                        <p className="text-xs text-muted-foreground capitalize">{item.content_type}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="content">
        <AffiliateContentManager
          affiliateId={affiliate.id}
          affiliateName={affiliate.name}
          content={content}
          onContentUpdate={onContentUpdate}
        />
      </TabsContent>
    </Tabs>
  );
}
