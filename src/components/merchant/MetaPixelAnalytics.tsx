import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, Eye, ShoppingCart, DollarSign, Users, MousePointer } from "lucide-react";

interface EventData {
  id: string;
  event_type: string;
  event_data: any;
  page_url: string;
  created_at: string;
  user_id: string | null;
}

type DateRange = '24h' | '7d' | '30d' | 'all';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const MetaPixelAnalytics = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [dateRange]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_events')
        .select('*')
        .like('event_type', 'meta_pixel_%')
        .order('created_at', { ascending: false });

      // Apply date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.limit(1000);
      if (error) throw error;
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const metrics = {
    totalEvents: events.length,
    pageViews: events.filter(e => e.event_type === 'meta_pixel_pageview').length,
    viewContent: events.filter(e => e.event_type === 'meta_pixel_viewcontent').length,
    addToCart: events.filter(e => e.event_type === 'meta_pixel_addtocart').length,
    purchases: events.filter(e => e.event_type === 'meta_pixel_purchase').length,
    leads: events.filter(e => e.event_type === 'meta_pixel_lead').length,
    revenue: events
      .filter(e => e.event_type === 'meta_pixel_purchase')
      .reduce((sum, e) => sum + (e.event_data?.value || 0), 0),
  };

  // Calculate conversion rate
  const conversionRate = metrics.pageViews > 0 
    ? ((metrics.purchases / metrics.pageViews) * 100).toFixed(2)
    : '0.00';

  // Event type breakdown for pie chart
  const eventTypeData = Object.entries(
    events.reduce((acc, e) => {
      const type = e.event_type.replace('meta_pixel_', '');
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Timeline data - group by day
  const timelineData = events.reduce((acc, event) => {
    const date = new Date(event.created_at).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, events: 0 };
    }
    acc[date].events++;
    return acc;
  }, {} as Record<string, { date: string; events: number }>);

  const timelineArray = Object.values(timelineData).reverse();

  // Top content by URL
  const topContent = Object.entries(
    events
      .filter(e => e.page_url)
      .reduce((acc, e) => {
        const url = e.page_url || 'unknown';
        if (!acc[url]) {
          acc[url] = { url, views: 0, conversions: 0 };
        }
        acc[url].views++;
        if (e.event_type === 'meta_pixel_purchase') {
          acc[url].conversions++;
        }
        return acc;
      }, {} as Record<string, { url: string; views: number; conversions: number }>)
  )
    .map(([_, data]) => data)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Funnel data
  const funnelData = [
    { stage: 'Page View', count: metrics.pageViews, fill: COLORS[0] },
    { stage: 'View Content', count: metrics.viewContent, fill: COLORS[1] },
    { stage: 'Add to Cart', count: metrics.addToCart, fill: COLORS[2] },
    { stage: 'Purchase', count: metrics.purchases, fill: COLORS[3] },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meta Pixel Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meta Pixel Analytics</h2>
          <p className="text-muted-foreground">Track pixel events and conversion metrics</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pageViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.purchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="content">Top Content</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
                <CardDescription>Events over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineArray}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="events" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Type Breakdown</CardTitle>
                <CardDescription>Distribution of pixel events</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>User journey from view to purchase</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Top Content</CardTitle>
              <CardDescription>Most viewed pages and conversion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page URL</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topContent.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{item.url}</TableCell>
                      <TableCell className="text-right">{item.views}</TableCell>
                      <TableCell className="text-right">{item.conversions}</TableCell>
                      <TableCell className="text-right">
                        {item.views > 0 ? ((item.conversions / item.views) * 100).toFixed(1) : '0.0'}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest pixel events tracked</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.slice(0, 50).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {event.event_type.replace('meta_pixel_', '')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{event.page_url || '-'}</TableCell>
                      <TableCell>
                        {event.event_data?.value ? `$${event.event_data.value}` : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
