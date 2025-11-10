import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Plus, Edit2, Trash2, Video, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { LiveReactionAnalytics } from "./LiveReactionAnalytics";

type LiveStreamEvent = {
  id: string;
  title: string;
  description: string | null;
  scheduled_start: string;
  scheduled_end: string | null;
  status: string | null;
  access_type: string | null;
  created_at: string | null;
};

export function LiveStreamEventManager() {
  const [events, setEvents] = useState<LiveStreamEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LiveStreamEvent | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_start: "",
    scheduled_end: "",
    access_type: "free"
  });

  useEffect(() => {
    fetchEvents();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('livestream-events-manager')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'livestream_events'
      }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('livestream_events')
        .select('*')
        .order('scheduled_start', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from('livestream_events')
          .update({
            title: formData.title,
            description: formData.description,
            scheduled_start: formData.scheduled_start,
            scheduled_end: formData.scheduled_end,
            access_type: formData.access_type
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast.success("Event updated successfully");
      } else {
        // Create new event
        const { error } = await supabase
          .from('livestream_events')
          .insert({
            title: formData.title,
            description: formData.description,
            scheduled_start: formData.scheduled_start,
            scheduled_end: formData.scheduled_end,
            status: 'scheduled',
            access_type: formData.access_type
          });

        if (error) throw error;
        toast.success("Event created successfully");
      }

      handleCloseDialog();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error("Failed to save event");
    }
  };

  const handleEdit = (event: LiveStreamEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      scheduled_start: event.scheduled_start,
      scheduled_end: event.scheduled_end || "",
      access_type: event.access_type || "free"
    });
    setShowDialog(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from('livestream_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error("Failed to delete event");
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      scheduled_start: "",
      scheduled_end: "",
      access_type: "free"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Live</Badge>;
      case 'ended':
        return <Badge className="bg-muted/20 text-muted-foreground border-muted/30">Ended</Badge>;
      default:
        return <Badge className="bg-primary/20 text-primary border-primary/30">Scheduled</Badge>;
    }
  };

  const getAccessBadge = (level: string) => {
    switch (level) {
      case 'vip':
        return <Badge className="bg-primary/20 text-primary border-primary/30">VIP Only</Badge>;
      case 'premium':
        return <Badge className="bg-secondary/50 text-secondary-foreground border-border">Premium</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Stream Events</h2>
          <p className="text-muted-foreground">Manage your upcoming livestream events</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="p-12 text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-4">Create your first livestream event to get started</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </Card>
      ) : (
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="analytics" disabled={!selectedEventId}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Reaction Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-6">
            <div className="grid gap-4">
              {events.map((event) => (
                <Card 
                  key={event.id} 
                  className={`p-6 cursor-pointer transition-all ${
                    selectedEventId === event.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{event.title}</h3>
                        {getStatusBadge(event.status || 'scheduled')}
                        {getAccessBadge(event.access_type || 'free')}
                      </div>
                      
                      {event.description && (
                        <p className="text-muted-foreground mb-4">{event.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>{format(new Date(event.scheduled_start), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{format(new Date(event.scheduled_start), 'h:mm a zzz')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(event)}
                        disabled={event.status === 'live'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(event.id)}
                        disabled={event.status === 'live'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            {selectedEventId ? (
              <LiveReactionAnalytics eventId={selectedEventId} />
            ) : (
              <Card className="p-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No event selected</h3>
                <p className="text-muted-foreground">Select an event to view reaction analytics</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update your livestream event details' : 'Schedule a new livestream event'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Live Acoustic Session"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Watch us perform our latest songs live..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_start">Start Date & Time *</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_end">End Date & Time</Label>
                <Input
                  id="scheduled_end"
                  type="datetime-local"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_type">Access Level *</Label>
              <Select
                value={formData.access_type}
                onValueChange={(value) => 
                  setFormData({ ...formData, access_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (All Users)</SelectItem>
                  <SelectItem value="premium">Premium Members</SelectItem>
                  <SelectItem value="vip">VIP Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
