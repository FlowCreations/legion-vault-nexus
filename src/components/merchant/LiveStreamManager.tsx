import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LiveBroadcaster } from "@/components/livestream/LiveBroadcaster";
import { ChatbotManager } from "@/components/livestream/ChatbotManager";
import { LiveChat } from "@/components/livestream/LiveChat";
import { Plus, Calendar, Eye } from "lucide-react";

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  scheduled_start: string;
  status: string;
  access_type: string;
  viewer_count: number;
}

export const LiveStreamManager = () => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("broadcast");
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    scheduled_start: "",
    access_type: "free",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('livestream_events')
      .select('*')
      .order('scheduled_start', { ascending: false });
    
    if (data) {
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0].id);
      }
    }
  };

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.scheduled_start) {
      toast.error('Please fill in title and scheduled time');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to create events');
      return;
    }

    const { error } = await supabase
      .from('livestream_events')
      .insert({
        title: newEvent.title,
        description: newEvent.description,
        scheduled_start: newEvent.scheduled_start,
        access_type: newEvent.access_type,
        status: 'scheduled',
        created_by: user.id,
      });

    if (error) {
      console.error('Create event error:', error);
      toast.error(`Failed to create event: ${error.message}`);
    } else {
      toast.success('Event created successfully!');
      setShowCreateDialog(false);
      loadEvents();
      setNewEvent({
        title: "",
        description: "",
        scheduled_start: "",
        access_type: "free",
      });
    }
  };

  const selectedEventData = events.find(e => e.id === selectedEvent);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Live Streaming</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Live Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Acoustic Sessions Live"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Join us for an intimate live performance..."
                />
              </div>
              <div>
                <Label>Scheduled Start</Label>
                <Input
                  type="datetime-local"
                  value={newEvent.scheduled_start}
                  onChange={(e) => setNewEvent({ ...newEvent, scheduled_start: e.target.value })}
                />
              </div>
              <div>
                <Label>Access Type</Label>
                <Select
                  value={newEvent.access_type}
                  onValueChange={(value) => setNewEvent({ ...newEvent, access_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="vip">VIP Only</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createEvent} className="w-full">Create Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event Selector */}
      <Card className="p-4">
        <Label>Select Event</Label>
        <Select value={selectedEvent || undefined} onValueChange={setSelectedEvent}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Choose an event" />
          </SelectTrigger>
          <SelectContent>
            {events.map(event => (
              <SelectItem key={event.id} value={event.id}>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {event.title} - {new Date(event.scheduled_start).toLocaleDateString()}
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    event.status === 'live' ? 'bg-red-500 text-white' : 'bg-gray-200'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedEventData && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{selectedEventData.title}</h3>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{selectedEventData.viewer_count} viewers</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{selectedEventData.description}</p>
          </div>
        )}
      </Card>

      {selectedEvent && (
        <>
          {/* LiveBroadcaster stays mounted to maintain connection */}
          <div className={activeTab === "broadcast" ? "block" : "hidden"}>
            <LiveBroadcaster 
              eventId={selectedEvent} 
              isVisible={activeTab === "broadcast"}
              onSwitchToChat={() => setActiveTab("chat")}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
              <TabsTrigger value="chat">Chat Monitor</TabsTrigger>
              <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-6">
              <LiveChat eventId={selectedEvent} isModerator={true} />
            </TabsContent>
            
            <TabsContent value="chatbot" className="mt-6">
              <ChatbotManager />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};