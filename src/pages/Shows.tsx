import { MapPin, Calendar, ShoppingBag, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import show1 from "@/assets/shows/show-1.jpg";
import show2 from "@/assets/shows/show-2.jpg";
import show3 from "@/assets/shows/show-3.jpg";
import heroImage from "@/assets/shows-hero.png";

export default function Shows() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        </div>
      </header>

      {/* Hero Image */}
      <section className="relative aspect-[16/9] sm:aspect-[2/1] bg-background-dark overflow-hidden">
        <img 
          src={heroImage} 
          alt="Sons of Legion performing live" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent pointer-events-none" />
      </section>

      {/* Photo Gallery Promo */}
      <section className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Gallery Images */}
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="aspect-square rounded-lg bg-card overflow-hidden relative">
                <img src={show1} alt="Sons of Legion live performance" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-white font-bold text-sm">Columbus, Ohio</span>
                </div>
              </div>
              <div className="aspect-square rounded-lg bg-card overflow-hidden relative">
                <img src={show2} alt="Sons of Legion on stage" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-white font-bold text-sm">Miami, Florida</span>
                </div>
              </div>
              <div className="aspect-square rounded-lg bg-card overflow-hidden relative">
                <img src={show3} alt="Sons of Legion performing" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-white font-bold text-sm">Austin, Texas</span>
                </div>
              </div>
            </div>

            {/* Gallery Info */}
            <div className="flex-1">
              <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
                LIVE
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Tour Gallery
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Get exclusive access to the official photos from Sons of Legion tour stops across the country.
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                View Gallery
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-3">
            {upcomingShows.map((show) => (
              <div
                key={show.id}
                className="bg-card hover:bg-card-hover border border-border hover:border-primary/30 rounded-lg p-6 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold group-hover:text-primary transition-colors">
                        {show.venue}
                      </h3>
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
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{show.city}, {show.state}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{show.month} {show.day}, 2025</span>
                      </div>
                    </div>

                    {show.specialGuests && (
                      <p className="text-xs text-muted-foreground mt-2">
                        with {show.specialGuests}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button 
                      className="bg-white text-black hover:bg-white/90 font-medium"
                      disabled={show.status === "Sold Out"}
                    >
                      {show.status === "Sold Out" ? "Sold Out" : "Get Tickets"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Shows Message */}
          {upcomingShows.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Upcoming Shows</h3>
              <p className="text-muted-foreground">
                Check back soon for new tour dates
              </p>
            </div>
          )}
        </div>
      </section>
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
