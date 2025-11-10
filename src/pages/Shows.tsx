import { MapPin, Calendar, ShoppingBag, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import show1 from "@/assets/shows/show-1.jpg";
import show2 from "@/assets/shows/show-2.jpg";
import show3 from "@/assets/shows/show-3.jpg";
import heroImage from "@/assets/shows-hero.png";
import { format } from "date-fns";

interface TourShow {
  id: string;
  date: string;
  city: string;
  state: string | null;
  country: string;
  venue: string;
  ticket_link: string | null;
  status: string;
  special_guests: string | null;
}

export default function Shows() {
  const navigate = useNavigate();
  const [shows, setShows] = useState<TourShow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    try {
      const { data, error } = await supabase
        .from("tour_shows")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setShows(data || []);
    } catch (error) {
      console.error("Error loading shows:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on_sale":
        return "On Sale";
      case "low_tickets":
        return "Low Tickets";
      case "sold_out":
        return "Sold Out";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-[73px] z-40 bg-background border-b border-border">
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
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate('/shows/gallery')}
              >
                View Gallery
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading shows...</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {shows.map((show) => {
                  const showDate = new Date(show.date);
                  const month = format(showDate, "MMM");
                  const day = format(showDate, "d");
                  
                  return (
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
                            <Badge 
                              className={
                                show.status === "sold_out" 
                                  ? "bg-destructive/20 text-destructive border-destructive/30"
                                  : show.status === "low_tickets"
                                  ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                                  : "bg-primary/20 text-primary border-primary/30"
                              }
                            >
                              {getStatusLabel(show.status)}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {show.city}
                                {show.state && `, ${show.state}`}
                                {show.country !== "USA" && `, ${show.country}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{month} {day}, {format(showDate, "yyyy")}</span>
                            </div>
                          </div>

                          {show.special_guests && (
                            <p className="text-xs text-muted-foreground mt-2">
                              with {show.special_guests}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {show.ticket_link ? (
                            <Button 
                              className="bg-white text-black hover:bg-white/90 font-medium"
                              disabled={show.status === "sold_out"}
                              onClick={() => window.open(show.ticket_link!, "_blank")}
                            >
                              {show.status === "sold_out" ? "Sold Out" : "Get Tickets"}
                            </Button>
                          ) : (
                            <Button 
                              className="bg-white text-black hover:bg-white/90 font-medium"
                              disabled
                            >
                              Coming Soon
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* No Shows Message */}
              {shows.length === 0 && (
                <div className="text-center py-20">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">No Upcoming Shows</h3>
                  <p className="text-muted-foreground">
                    Check back soon for new tour dates
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

