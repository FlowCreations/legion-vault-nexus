import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Calendar, MapPin } from "lucide-react";
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

export function TourManager() {
  const { toast } = useToast();
  const [shows, setShows] = useState<TourShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    city: "",
    state: "",
    country: "USA",
    venue: "",
    ticket_link: "",
    status: "on_sale",
    special_guests: "",
  });

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tour_shows")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setShows(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("tour_shows").insert([
        {
          date: formData.date,
          city: formData.city,
          state: formData.state || null,
          country: formData.country,
          venue: formData.venue,
          ticket_link: formData.ticket_link || null,
          status: formData.status,
          special_guests: formData.special_guests || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tour show added successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        date: "",
        city: "",
        state: "",
        country: "USA",
        venue: "",
        ticket_link: "",
        status: "on_sale",
        special_guests: "",
      });
      loadShows();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this show?")) return;

    try {
      const { error } = await supabase.from("tour_shows").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Show deleted successfully",
      });
      loadShows();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tour Manager
            </CardTitle>
            <CardDescription>
              Manage upcoming tour dates and ticket links
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Show
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Tour Show</DialogTitle>
                <DialogDescription>
                  Enter the details for the new tour show
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="venue">Venue *</Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) =>
                        setFormData({ ...formData, venue: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ticket_link">Ticket Link</Label>
                  <Input
                    id="ticket_link"
                    type="url"
                    placeholder="https://..."
                    value={formData.ticket_link}
                    onChange={(e) =>
                      setFormData({ ...formData, ticket_link: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_sale">On Sale</SelectItem>
                      <SelectItem value="low_tickets">Low Tickets</SelectItem>
                      <SelectItem value="sold_out">Sold Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="special_guests">Special Guests</Label>
                  <Input
                    id="special_guests"
                    value={formData.special_guests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        special_guests: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add Show"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && shows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading shows...
          </div>
        ) : shows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tour shows yet. Add your first show to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ticket Link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shows.map((show) => (
                <TableRow key={show.id}>
                  <TableCell>
                    {format(new Date(show.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{show.venue}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {show.city}
                      {show.state && `, ${show.state}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        show.status === "sold_out"
                          ? "bg-destructive/20 text-destructive"
                          : show.status === "low_tickets"
                          ? "bg-yellow-500/20 text-yellow-500"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {show.status === "on_sale"
                        ? "On Sale"
                        : show.status === "low_tickets"
                        ? "Low Tickets"
                        : "Sold Out"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {show.ticket_link ? (
                      <a
                        href={show.ticket_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(show.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
