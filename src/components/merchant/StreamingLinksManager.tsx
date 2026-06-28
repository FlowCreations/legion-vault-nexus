import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Link as LinkIcon, ExternalLink } from "lucide-react";
import {
  PLATFORM_LABELS,
  PLATFORM_ORDER,
  StreamingPlatform,
  toEmbedUrl,
} from "@/lib/streamingPlatforms";

interface StreamingLink {
  id: string;
  platform: StreamingPlatform;
  url: string;
  embed_url: string | null;
  label: string | null;
  is_featured: boolean;
  sort_order: number;
}

export function StreamingLinksManager() {
  const { toast } = useToast();
  const [links, setLinks] = useState<StreamingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platform, setPlatform] = useState<StreamingPlatform>("spotify");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("artist_streaming_links")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Failed to load links", description: error.message, variant: "destructive" });
    } else {
      setLinks((data ?? []) as StreamingLink[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!url.trim()) {
      toast({ title: "URL required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const embed = toEmbedUrl(platform, url.trim());
    const { error } = await supabase.from("artist_streaming_links").insert({
      platform,
      url: url.trim(),
      embed_url: embed,
      label: label.trim() || null,
      sort_order: links.length,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not add link", description: error.message, variant: "destructive" });
      return;
    }
    setUrl("");
    setLabel("");
    toast({ title: "Streaming link added" });
    load();
  };

  const toggleFeatured = async (link: StreamingLink) => {
    const { error } = await supabase
      .from("artist_streaming_links")
      .update({ is_featured: !link.is_featured })
      .eq("id", link.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("artist_streaming_links").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Link removed" });
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <LinkIcon className="w-5 h-5 text-primary" />
            Add Streaming Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as StreamingPlatform)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://open.spotify.com/artist/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                placeholder="e.g. Latest Album"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} disabled={saving} className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Paste an artist, album, track, or playlist URL. Featured links will render as embedded players on the fan-facing Music page.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Your Streaming Links</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : links.length === 0 ? (
            <div className="text-sm text-muted-foreground">No links yet. Add one above.</div>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-wrap items-center gap-3 p-3 rounded-md border border-border/40 bg-background/40"
                >
                  <div className="min-w-[110px]">
                    <span className="text-xs uppercase tracking-wide text-primary font-semibold">
                      {PLATFORM_LABELS[link.platform]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-sm text-foreground truncate">{link.label || link.url}</div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 truncate"
                    >
                      {link.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Featured</Label>
                    <Switch
                      checked={link.is_featured}
                      onCheckedChange={() => toggleFeatured(link)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(link.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StreamingLinksManager;
