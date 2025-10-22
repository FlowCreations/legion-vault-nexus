import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserPlus, CheckCircle, XCircle, Clock, Building2, Send, Mail, TrendingUp } from "lucide-react";
import { AffiliateDetail } from "./AffiliateDetail";
import { BrandPartnershipCard } from "./BrandPartnershipCard";
import { EthosRequestDialog } from "./EthosRequestDialog";
import { AddAffiliateForm } from "./AddAffiliateForm";
import { Badge } from "@/components/ui/badge";

interface Partnership {
  id: string;
  artist_id: string;
  partner_artist_id: string;
  partnership_type: string;
  status: string;
  created_at: string;
  approved_at: string | null;
}

interface Affiliate {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  ethos: string | null;
  non_negotiables: string[] | null;
  social_links: any;
  analytics: any;
}

interface BrandPartnership {
  id: string;
  brand_name: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  content: any;
  status: string;
}

interface AffiliateContent {
  id: string;
  affiliate_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  content_type: string | null;
  content_url: string | null;
}

interface EthosRequest {
  id: string;
  from_artist_id: string;
  ethos: string;
  non_negotiables: string[] | null;
  status: string;
  created_at: string;
}

export function Partnerships() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [brandPartnerships, setBrandPartnerships] = useState<BrandPartnership[]>([]);
  const [ethosRequests, setEthosRequests] = useState<EthosRequest[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [affiliateContent, setAffiliateContent] = useState<AffiliateContent[]>([]);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [ethosDialogOpen, setEthosDialogOpen] = useState(false);
  const [ethosRecipient, setEthosRecipient] = useState("");
  const [addAffiliateDialogOpen, setAddAffiliateDialogOpen] = useState(false);

  useEffect(() => {
    fetchPartnerships();
    fetchAffiliates();
    fetchBrandPartnerships();
    fetchEthosRequests();
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

  const fetchAffiliates = async () => {
    const { data, error } = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAffiliates(data);
    }
  };

  const fetchBrandPartnerships = async () => {
    const { data, error } = await supabase
      .from("brand_partnerships")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBrandPartnerships(data);
    }
  };

  const fetchEthosRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("ethos_requests")
      .select("*")
      .eq("to_artist_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEthosRequests(data);
    }
  };

  const handleAffiliateClick = async (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    
    const { data, error } = await supabase
      .from("affiliate_content")
      .select("*")
      .eq("affiliate_id", affiliate.id)
      .limit(10);

    if (!error && data) {
      setAffiliateContent(data);
    }
  };

  const handleAcceptEthos = async (request: EthosRequest) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create affiliate from ethos request
    const { error: affiliateError } = await supabase
      .from("affiliates")
      .insert({
        artist_id: user.id,
        name: "New Affiliate", // Would need to get from user_profiles
        ethos: request.ethos,
        non_negotiables: request.non_negotiables,
        analytics: {
          total_members: 0,
          active_members: 0,
          highly_active: 0,
          medium_active: 0,
          low_active: 0
        }
      });

    if (affiliateError) {
      toast.error("Failed to create affiliate");
      return;
    }

    // Update request status
    const { error: updateError } = await supabase
      .from("ethos_requests")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", request.id);

    if (updateError) {
      toast.error("Failed to update request");
    } else {
      toast.success("Ethos accepted and affiliate added");
      fetchEthosRequests();
      fetchAffiliates();
    }
  };

  const handleRejectEthos = async (requestId: string) => {
    const { error } = await supabase
      .from("ethos_requests")
      .update({ status: "rejected", responded_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast.error("Failed to reject ethos");
    } else {
      toast.success("Ethos request rejected");
      fetchEthosRequests();
    }
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

  if (selectedAffiliate) {
    return (
      <AffiliateDetail
        affiliate={selectedAffiliate}
        content={affiliateContent}
        onClose={() => {
          setSelectedAffiliate(null);
          setAffiliateContent([]);
        }}
        onContentUpdate={() => {
          handleAffiliateClick(selectedAffiliate);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="affiliates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="brands">Brand Partnerships</TabsTrigger>
          <TabsTrigger value="requests">Ethos Requests {ethosRequests.length > 0 && `(${ethosRequests.length})`}</TabsTrigger>
          <TabsTrigger value="partners">Artist Partners</TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Affiliate Artists</CardTitle>
                <CardDescription>Artists you're affiliated with for cross-promotion</CardDescription>
              </div>
              <Button onClick={() => setAddAffiliateDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Affiliate
              </Button>
            </CardHeader>
            <CardContent>
              {affiliates.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No affiliates yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {affiliates.map((affiliate) => (
                    <Card
                      key={affiliate.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleAffiliateClick(affiliate)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {affiliate.avatar_url ? (
                              <img 
                                src={affiliate.avatar_url} 
                                alt={affiliate.name} 
                                className="rounded-full object-cover w-full h-full"
                                onError={(e) => {
                                  console.error('Failed to load avatar:', affiliate.avatar_url);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Users className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{affiliate.name}</p>
                              {affiliate.analytics?.affiliationScore && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {affiliate.analytics.affiliationScore}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {affiliate.analytics?.totalMembers?.toLocaleString() || affiliate.analytics?.total_members?.toLocaleString() || 0} members
                            </p>
                          </div>
                        </div>
                        {affiliate.ethos && (
                          <p className="text-sm text-muted-foreground line-clamp-2 italic">
                            "{affiliate.ethos}"
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand Partnerships Tab */}
        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Partnerships</CardTitle>
              <CardDescription>Companies and brands you collaborate with</CardDescription>
            </CardHeader>
            <CardContent>
              {brandPartnerships.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No brand partnerships yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brandPartnerships.map((partnership) => (
                    <BrandPartnershipCard key={partnership.id} partnership={partnership} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ethos Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ethos Requests</CardTitle>
              <CardDescription>Affiliates wanting to share their ethos with you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ethosRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending ethos requests</p>
              ) : (
                ethosRequests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          From: {request.from_artist_id.slice(0, 8)}...
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Ethos:</p>
                        <p className="text-sm text-muted-foreground italic">"{request.ethos}"</p>
                      </div>
                      {request.non_negotiables && request.non_negotiables.length > 0 && (
                        <div>
                          <p className="font-semibold mb-2">Non-Negotiables:</p>
                          <div className="flex flex-wrap gap-2">
                            {request.non_negotiables.map((item, idx) => (
                              <span key={idx} className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => handleAcceptEthos(request)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept & Add Affiliate
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRejectEthos(request.id)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Artist Partners Tab */}
        <TabsContent value="partners" className="space-y-4">
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
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEthosRecipient(partnerEmail);
                      setEthosDialogOpen(true);
                    }}
                    disabled={!partnerEmail}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Ethos
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
        </TabsContent>
      </Tabs>

      <EthosRequestDialog
        open={ethosDialogOpen}
        onOpenChange={setEthosDialogOpen}
        recipientEmail={ethosRecipient}
      />

      {/* Add Affiliate Dialog */}
      <Dialog open={addAffiliateDialogOpen} onOpenChange={setAddAffiliateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Affiliate</DialogTitle>
            <DialogDescription>
              Add a new artist affiliate for cross-promotion opportunities
            </DialogDescription>
          </DialogHeader>
          <AddAffiliateForm 
            onSuccess={() => {
              setAddAffiliateDialogOpen(false);
              fetchAffiliates();
            }}
            onCancel={() => setAddAffiliateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
