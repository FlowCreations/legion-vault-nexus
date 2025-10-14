import { MapPin, Calendar, Ticket, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function Events() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[600px] flex items-end overflow-hidden mt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background-dark via-card to-background-dark">
          <div className="absolute inset-0 bg-gradient-overlay" />
          {/* Artist Image Placeholder */}
          <div className="h-full flex items-center justify-center opacity-20">
            <div className="text-9xl font-serif text-muted-foreground">S</div>
          </div>
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4">
              Sons of Legion
              <br />
              <span className="text-4xl sm:text-5xl md:text-6xl text-muted-foreground">
                2025 World Tour
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="sticky top-20 z-40 bg-background-dark/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="shows" className="w-full">
            <TabsList className="w-full justify-start bg-transparent h-16 p-0 border-b-0">
              <TabsTrigger 
                value="shows" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 h-full text-base font-medium"
              >
                Shows
              </TabsTrigger>
              <TabsTrigger 
                value="gallery" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 h-full text-base font-medium"
              >
                Photo Gallery
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shows" className="mt-0 px-0">
              <ShowsList />
            </TabsContent>

            <TabsContent value="gallery" className="mt-0 px-0">
              <PhotoGallery />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function ShowsList() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-bold mb-2">Upcoming Shows</h2>
          <p className="text-muted-foreground">
            Get your tickets now for the most anticipated tour of 2025
          </p>
        </div>

        <div className="space-y-4">
          {upcomingShows.map((show) => (
            <div
              key={show.id}
              className="group bg-card hover:bg-card-hover rounded-xl border border-border hover:border-primary/30 transition-all duration-300 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6 p-6">
                {/* Date Box */}
                <div className="flex-shrink-0">
                  <div className="bg-gradient-gold rounded-lg p-4 text-center min-w-[80px] shadow-gold">
                    <div className="text-primary-foreground">
                      <div className="text-sm font-medium uppercase tracking-wide">
                        {show.month}
                      </div>
                      <div className="text-3xl font-bold font-serif">
                        {show.day}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-serif text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {show.venue}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{show.city}, {show.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{show.time}</span>
                        </div>
                      </div>
                    </div>

                    {show.status && (
                      <Badge 
                        className={
                          show.status === "Sold Out" 
                            ? "bg-destructive/20 text-destructive border-destructive/30"
                            : show.status === "Low Tickets"
                            ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                            : "bg-primary/20 text-primary border-primary/30"
                        }
                      >
                        {show.status}
                      </Badge>
                    )}
                  </div>

                  {show.specialGuests && (
                    <p className="text-sm text-muted-foreground mb-3">
                      Special guests: {show.specialGuests}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button 
                      className="bg-gradient-gold hover:shadow-glow transition-all"
                      disabled={show.status === "Sold Out"}
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      {show.status === "Sold Out" ? "Sold Out" : "Get Tickets"}
                    </Button>
                    <Button variant="outline" className="border-primary/30 hover:border-primary">
                      View Details
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* VIP Package Promotion */}
        <div className="mt-12 bg-gradient-to-br from-card to-card-hover rounded-2xl p-8 border border-primary/30 shadow-glow">
          <div className="text-center max-w-2xl mx-auto">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              VIP Experience
            </Badge>
            <h3 className="font-serif text-3xl font-bold mb-4">
              Upgrade Your Concert Experience
            </h3>
            <p className="text-muted-foreground mb-6">
              Get exclusive meet and greet access, premium seating, limited edition merchandise, 
              and more with our VIP packages.
            </p>
            <Button size="lg" className="bg-gradient-gold hover:shadow-glow transition-all">
              Explore VIP Packages
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoGallery() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-bold mb-2">Live Photo Gallery</h2>
          <p className="text-muted-foreground">
            Exclusive photos from recent shows around the world
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-card shadow-cosmic hover:shadow-glow transition-all duration-500 cursor-pointer"
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              
              {/* Badge */}
              {photo.badge && (
                <Badge className="absolute top-3 left-3 z-20 bg-primary/90 text-primary-foreground border-0">
                  {photo.badge}
                </Badge>
              )}

              {/* Info on Hover */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <p className="text-white font-semibold text-sm mb-1">{photo.location}</p>
                <p className="text-white/80 text-xs">{photo.date}</p>
              </div>

              {/* Photo Placeholder */}
              <div className="h-full bg-gradient-to-br from-card to-card-hover flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground/50">Live Photo</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <Button variant="outline" size="lg" className="border-primary/30 hover:border-primary">
            Load More Photos
          </Button>
        </div>
      </div>
    </div>
  );
}

const upcomingShows = [
  {
    id: "1",
    month: "Mar",
    day: "15",
    venue: "Madison Square Garden",
    city: "New York",
    state: "NY",
    time: "8:00 PM",
    status: "On Sale",
    specialGuests: "The Midnight Collective",
  },
  {
    id: "2",
    month: "Mar",
    day: "22",
    venue: "The Forum",
    city: "Los Angeles",
    state: "CA",
    time: "7:30 PM",
    status: "Low Tickets",
    specialGuests: "Echo Valley",
  },
  {
    id: "3",
    month: "Apr",
    day: "05",
    venue: "Red Rocks Amphitheatre",
    city: "Morrison",
    state: "CO",
    time: "8:00 PM",
    status: "Sold Out",
  },
  {
    id: "4",
    month: "Apr",
    day: "12",
    venue: "Bridgestone Arena",
    city: "Nashville",
    state: "TN",
    time: "7:00 PM",
    status: "On Sale",
  },
  {
    id: "5",
    month: "Apr",
    day: "20",
    venue: "United Center",
    city: "Chicago",
    state: "IL",
    time: "8:00 PM",
    status: "On Sale",
    specialGuests: "The Resonance",
  },
  {
    id: "6",
    month: "May",
    day: "03",
    venue: "American Airlines Center",
    city: "Dallas",
    state: "TX",
    time: "7:30 PM",
    status: "On Sale",
  },
  {
    id: "7",
    month: "May",
    day: "18",
    venue: "Climate Pledge Arena",
    city: "Seattle",
    state: "WA",
    time: "8:00 PM",
    status: "Low Tickets",
  },
  {
    id: "8",
    month: "Jun",
    day: "07",
    venue: "TD Garden",
    city: "Boston",
    state: "MA",
    time: "7:00 PM",
    status: "On Sale",
  },
];

const galleryPhotos = [
  { id: "1", location: "Red Rocks, CO", date: "Oct 15, 2024", badge: "LIVE" },
  { id: "2", location: "Madison Square Garden, NY", date: "Sep 22, 2024" },
  { id: "3", location: "The Forum, LA", date: "Sep 8, 2024" },
  { id: "4", location: "Austin City Limits", date: "Aug 30, 2024", badge: "LIVE" },
  { id: "5", location: "Nashville, TN", date: "Aug 15, 2024" },
  { id: "6", location: "Chicago, IL", date: "Jul 28, 2024" },
  { id: "7", location: "Seattle, WA", date: "Jul 10, 2024" },
  { id: "8", location: "Denver, CO", date: "Jun 22, 2024", badge: "LIVE" },
  { id: "9", location: "Portland, OR", date: "Jun 8, 2024" },
  { id: "10", location: "Phoenix, AZ", date: "May 25, 2024" },
  { id: "11", location: "San Diego, CA", date: "May 12, 2024" },
  { id: "12", location: "Houston, TX", date: "Apr 30, 2024" },
];
