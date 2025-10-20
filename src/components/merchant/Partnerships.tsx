import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserPlus, CheckCircle, XCircle, Clock } from "lucide-react";

interface Partnership {
  id: string;
  artist_id: string;
  partner_artist_id: string;
  partnership_type: string;
  status: string;
  created_at: string;
  approved_at: string | null;
}

export function Partnerships() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPartnerships();
  }, []);

  const fetchPartnerships = async () => {
    const { data, error } = await supabase
      .from("artist_partnerships")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load partnerships");
      return;
    }

    setPartnerships(data || []);
  };

  const createPartnership = async () => {
    if (!partnerEmail) {
      toast.error("Please enter partner email");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please sign in");
      setLoading(false);
      return;
    }

    // Find partner by email
    const { data: profiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("real_name", partnerEmail)
      .single();

    if (profileError || !profiles) {
      toast.error("Partner not found");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("artist_partnerships")
      .insert({
        artist_id: user.id,
        partner_artist_id: profiles.user_id,
        status: "pending"
      });

    if (error) {
      toast.error("Failed to create partnership");
    } else {
      toast.success("Partnership request sent");
      setPartnerEmail("");
      fetchPartnerships();
    }
    setLoading(false);
  };

  const updatePartnershipStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("artist_partnerships")
      .update({ 
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update partnership");
    } else {
      toast.success(`Partnership ${status}`);
      fetchPartnerships();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-affirmative-primary" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-accent" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-6 w-6 text-affirmative-primary" />
          <h2 className="text-2xl font-bold">Artist Partnerships</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="partner-email">Add Partner Artist</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="partner-email"
                placeholder="Partner's email or name"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
              />
              <Button onClick={createPartnership} disabled={loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Partner
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              When you partner with another artist, their fans will see your content recommended on their page and vice versa.
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <h3 className="font-semibold">Current Partnerships</h3>
            {partnerships.length === 0 ? (
              <p className="text-muted-foreground">No partnerships yet</p>
            ) : (
              partnerships.map((partnership) => (
                <Card key={partnership.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(partnership.status)}
                      <div>
                        <p className="font-medium">Partnership ID: {partnership.partner_artist_id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {partnership.status} • {partnership.partnership_type}
                        </p>
                      </div>
                    </div>
                    {partnership.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePartnershipStatus(partnership.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updatePartnershipStatus(partnership.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
