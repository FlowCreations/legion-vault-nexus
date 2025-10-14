import { Radio, Calendar, Clock, Users, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LiveStudio() {
  return (
    <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold mb-4">
            Live Studio
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Experience live performances, intimate sessions, and exclusive concerts from anywhere
          </p>
        </div>

        {/* Live Now / Next Live Section */}
        <div className="bg-gradient-to-br from-card to-card-hover rounded-3xl overflow-hidden mb-16 shadow-glow border border-primary/30">
          <div className="p-8 md:p-12">
            {/* Live Indicator */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping" />
              </div>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                Next Live Event
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Stream Preview */}
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/10 shadow-gold flex items-center justify-center group hover:shadow-glow transition-all duration-500">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <Radio className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Live Stream Preview</p>
                </div>
              </div>

              {/* Event Info */}
              <div className="flex flex-col justify-center">
                <h2 className="font-serif text-4xl font-bold mb-4">
                  Acoustic Sessions Live
                </h2>
                
                <p className="text-muted-foreground mb-6 text-lg">
                  Join us for an intimate acoustic performance featuring stripped down versions 
                  of your favorite tracks and unreleased material.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>Saturday, January 25, 2025</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>8:00 PM EST</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Users className="w-5 h-5 text-primary" />
                    <span>1,247 registered</span>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-card rounded-xl p-4 mb-6 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Starting in:</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { value: "03", label: "Days" },
                      { value: "14", label: "Hours" },
                      { value: "27", label: "Mins" },
                      { value: "45", label: "Secs" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="font-serif text-3xl font-bold text-primary">{item.value}</div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="bg-gradient-gold hover:shadow-glow transition-all">
                    <Ticket className="w-5 h-5 mr-2" />
                    Get Free Access
                  </Button>
                  <Button size="lg" variant="outline" className="border-primary/30 hover:border-primary">
                    Set Reminder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <h2 className="font-serif text-3xl font-bold mb-8">Upcoming Events</h2>
          
          <div className="grid gap-6">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-card hover:bg-card-hover rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 shadow-cosmic"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {event.isVIP && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          VIP Only
                        </Badge>
                      )}
                      {event.isPremium && (
                        <Badge className="bg-secondary/50 text-secondary-foreground border-border">
                          Premium
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-serif text-2xl font-bold mb-2">
                      {event.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{event.time}</span>
                      </div>
                      {event.price && (
                        <div className="flex items-center space-x-2">
                          <Ticket className="w-4 h-4 text-primary" />
                          <span>{event.price}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 md:min-w-[200px]">
                    <Button className="bg-gradient-gold hover:shadow-glow transition-all">
                      {event.price ? "Purchase Ticket" : "Register Free"}
                    </Button>
                    <Button variant="outline" className="border-primary/30 hover:border-primary">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Streams */}
        <div className="mt-16">
          <h2 className="font-serif text-3xl font-bold mb-8">Watch Past Streams</h2>
          <p className="text-muted-foreground mb-6">
            Missed a live show? Premium and VIP members can watch recordings of all past events.
          </p>
          <Button variant="outline" className="border-primary/30 hover:border-primary">
            Browse Archive
          </Button>
        </div>
      </div>
    </div>
  );
}

const upcomingEvents = [
  {
    id: "1",
    title: "Virtual World Tour Finale",
    description: "The grand finale of our virtual tour featuring special guests and never before performed tracks",
    date: "Feb 15, 2025",
    time: "9:00 PM EST",
    price: "$19.99",
    isVIP: false,
    isPremium: false,
  },
  {
    id: "2",
    title: "Q&A with the Band",
    description: "Ask us anything! Live video chat session with all band members",
    date: "Feb 8, 2025",
    time: "7:00 PM EST",
    price: null,
    isVIP: true,
    isPremium: false,
  },
  {
    id: "3",
    title: "Album Listening Party",
    description: "Experience 'Cosmic Echoes' from start to finish with live commentary",
    date: "Feb 1, 2025",
    time: "8:00 PM EST",
    price: null,
    isVIP: false,
    isPremium: true,
  },
];
