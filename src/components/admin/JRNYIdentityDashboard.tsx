import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Eye, 
  Flame, 
  Thermometer, 
  Snowflake, 
  Star,
  Search,
  RefreshCw,
  Mail,
  Globe,
  Clock,
  MousePointer,
  TrendingUp
} from 'lucide-react';
import { AnimatedCounter } from '@/components/merchant/analytics/AnimatedCounter';
import { format, formatDistanceToNow } from 'date-fns';

interface JRNYVisitor {
  id: string;
  jrny_id: string;
  email: string | null;
  heat_level: string;
  engagement_score: number;
  total_page_views: number;
  total_sessions: number;
  portals_visited: string[];
  first_seen_at: string;
  last_seen_at: string;
  device_type: string;
  browser: string;
  converted_user_id: string | null;
  utm_source: string | null;
}

interface JRNYEvent {
  id: string;
  jrny_id: string;
  event_type: string;
  event_data: Record<string, any>;
  page_url: string;
  created_at: string;
}

const HEAT_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  cold: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <Snowflake className="h-4 w-4" /> },
  warm: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <Thermometer className="h-4 w-4" /> },
  hot: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: <Flame className="h-4 w-4" /> },
  superfan: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: <Star className="h-4 w-4" /> },
};

export const JRNYIdentityDashboard = () => {
  const [visitors, setVisitors] = useState<JRNYVisitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<JRNYVisitor | null>(null);
  const [visitorEvents, setVisitorEvents] = useState<JRNYEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [heatFilter, setHeatFilter] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    identified: 0,
    cold: 0,
    warm: 0,
    hot: 0,
    superfan: 0,
  });

  useEffect(() => {
    fetchVisitors();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('jrny_visitors_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jrny_visitors' },
        () => fetchVisitors()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jrny_visitors')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Type assertion since we know the shape
      const typedData = (data || []) as unknown as JRNYVisitor[];
      setVisitors(typedData);

      // Calculate stats
      const newStats = {
        total: typedData.length,
        identified: typedData.filter(v => v.email).length,
        cold: typedData.filter(v => v.heat_level === 'cold').length,
        warm: typedData.filter(v => v.heat_level === 'warm').length,
        hot: typedData.filter(v => v.heat_level === 'hot').length,
        superfan: typedData.filter(v => v.heat_level === 'superfan').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitorEvents = async (jrnyId: string) => {
    try {
      const { data, error } = await supabase
        .from('jrny_events')
        .select('*')
        .eq('jrny_id', jrnyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setVisitorEvents((data || []) as unknown as JRNYEvent[]);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleSelectVisitor = (visitor: JRNYVisitor) => {
    setSelectedVisitor(visitor);
    fetchVisitorEvents(visitor.jrny_id);
  };

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = !searchQuery || 
      v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.jrny_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHeat = !heatFilter || v.heat_level === heatFilter;
    return matchesSearch && matchesHeat;
  });

  const HeatBadge = ({ level }: { level: string }) => {
    const config = HEAT_COLORS[level] || HEAT_COLORS.cold;
    return (
      <Badge className={`${config.bg} ${config.text} gap-1`}>
        {config.icon}
        {level}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Total Visitors</span>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.total} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Mail className="h-4 w-4" />
              <span className="text-xs">Identified</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              <AnimatedCounter value={stats.identified} />
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.identified / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Snowflake className="h-4 w-4" />
              <span className="text-xs">Cold</span>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.cold} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-1">
              <Thermometer className="h-4 w-4" />
              <span className="text-xs">Warm</span>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.warm} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-1">
              <Flame className="h-4 w-4" />
              <span className="text-xs">Hot</span>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.hot} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Star className="h-4 w-4" />
              <span className="text-xs">Superfans</span>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.superfan} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor List */}
        <Card className="lg:col-span-1 bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Visitors</CardTitle>
              <Button variant="ghost" size="icon" onClick={fetchVisitors}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-background/50"
                />
              </div>
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              <Button
                variant={!heatFilter ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setHeatFilter(null)}
              >
                All
              </Button>
              {Object.keys(HEAT_COLORS).map(level => (
                <Button
                  key={level}
                  variant={heatFilter === level ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setHeatFilter(level)}
                  className="gap-1"
                >
                  {HEAT_COLORS[level].icon}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredVisitors.map(visitor => (
                  <div
                    key={visitor.id}
                    onClick={() => handleSelectVisitor(visitor)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedVisitor?.id === visitor.id
                        ? 'bg-primary/20 border border-primary/50'
                        : 'bg-background/50 hover:bg-background/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate max-w-[150px]">
                        {visitor.email || visitor.jrny_id.substring(0, 8) + '...'}
                      </span>
                      <HeatBadge level={visitor.heat_level} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {visitor.total_page_views}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {visitor.engagement_score}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {visitor.portals_visited?.length || 0}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(visitor.last_seen_at), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Visitor Detail */}
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedVisitor ? 'Visitor Journey' : 'Select a Visitor'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVisitor ? (
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="events">Events ({visitorEvents.length})</TabsTrigger>
                  <TabsTrigger value="portals">Portals</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background/50 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Heat Level</div>
                      <HeatBadge level={selectedVisitor.heat_level} />
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Engagement Score</div>
                      <div className="text-xl font-bold">{selectedVisitor.engagement_score}</div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Page Views</div>
                      <div className="text-xl font-bold">{selectedVisitor.total_page_views}</div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Sessions</div>
                      <div className="text-xl font-bold">{selectedVisitor.total_sessions}</div>
                    </div>
                  </div>

                  <div className="bg-background/50 p-4 rounded-lg space-y-3">
                    <h4 className="font-medium">Identity</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">JRNY ID:</span>
                        <span className="ml-2 font-mono text-xs">{selectedVisitor.jrny_id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{selectedVisitor.email || 'Not revealed'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">First Seen:</span>
                        <span className="ml-2">{format(new Date(selectedVisitor.first_seen_at), 'MMM d, yyyy')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Seen:</span>
                        <span className="ml-2">{formatDistanceToNow(new Date(selectedVisitor.last_seen_at), { addSuffix: true })}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Device:</span>
                        <span className="ml-2">{selectedVisitor.device_type} / {selectedVisitor.browser}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <span className="ml-2">{selectedVisitor.utm_source || 'Direct'}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="events">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {visitorEvents.map(event => (
                        <div key={event.id} className="bg-background/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline">{event.event_type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at), 'MMM d, HH:mm')}
                            </span>
                          </div>
                          {event.page_url && (
                            <div className="text-xs text-muted-foreground truncate">
                              {event.page_url}
                            </div>
                          )}
                          {Object.keys(event.event_data || {}).length > 0 && (
                            <pre className="text-xs mt-2 p-2 bg-background rounded overflow-x-auto">
                              {JSON.stringify(event.event_data, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="portals">
                  <div className="space-y-2">
                    {(selectedVisitor.portals_visited || []).map(portal => (
                      <div key={portal} className="bg-background/50 p-3 rounded-lg flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{portal}</span>
                      </div>
                    ))}
                    {(!selectedVisitor.portals_visited || selectedVisitor.portals_visited.length === 0) && (
                      <div className="text-muted-foreground text-center py-8">
                        No portal visits recorded
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MousePointer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a visitor from the list to view their journey</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
