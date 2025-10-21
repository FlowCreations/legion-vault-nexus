import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X } from "lucide-react";

const affiliateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(500).optional(),
  ethos: z.string().max(1000).optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  spotify: z.string().optional(),
});

type AffiliateFormValues = z.infer<typeof affiliateSchema>;

interface AddAffiliateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddAffiliateForm({ onSuccess, onCancel }: AddAffiliateFormProps) {
  const [nonNegotiables, setNonNegotiables] = useState<string[]>([]);
  const [currentNonNegotiable, setCurrentNonNegotiable] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AffiliateFormValues>({
    resolver: zodResolver(affiliateSchema),
    defaultValues: {
      name: "",
      bio: "",
      ethos: "",
      avatar_url: "",
      instagram: "",
      twitter: "",
      youtube: "",
      spotify: "",
    },
  });

  const addNonNegotiable = () => {
    if (currentNonNegotiable.trim() && !nonNegotiables.includes(currentNonNegotiable.trim())) {
      setNonNegotiables([...nonNegotiables, currentNonNegotiable.trim()]);
      setCurrentNonNegotiable("");
    }
  };

  const removeNonNegotiable = (index: number) => {
    setNonNegotiables(nonNegotiables.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: AffiliateFormValues) => {
    setIsSubmitting(true);
    
    const socialLinks = {
      instagram: values.instagram || null,
      twitter: values.twitter || null,
      youtube: values.youtube || null,
      spotify: values.spotify || null,
    };

    const { error } = await supabase.from("affiliates").insert({
      artist_id: crypto.randomUUID(),
      name: values.name,
      bio: values.bio || null,
      ethos: values.ethos || null,
      avatar_url: values.avatar_url || null,
      non_negotiables: nonNegotiables.length > 0 ? nonNegotiables : null,
      social_links: socialLinks,
      analytics: {
        totalMembers: 0,
        activeMembers: 0,
        affiliationScore: 0,
      },
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to add affiliate");
      console.error(error);
    } else {
      toast.success("Affiliate added successfully");
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist Name</FormLabel>
              <FormControl>
                <Input placeholder="Chris Stapleton" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/avatar.jpg" {...field} />
              </FormControl>
              <FormDescription>Direct link to artist's profile image</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Grammy-winning country artist known for powerful vocals..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ethos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ethos</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Authentic storytelling through traditional country music..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Core values and artistic philosophy</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Non-Negotiables</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add a non-negotiable value"
              value={currentNonNegotiable}
              onChange={(e) => setCurrentNonNegotiable(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNonNegotiable();
                }
              }}
            />
            <Button type="button" size="icon" onClick={addNonNegotiable}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {nonNegotiables.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {nonNegotiables.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeNonNegotiable(index)}
                    className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <FormDescription>Core principles this artist won't compromise on</FormDescription>
        </div>

        <div className="space-y-4">
          <FormLabel>Social Links</FormLabel>
          
          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Instagram URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="twitter"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Twitter/X URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="youtube"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="YouTube URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spotify"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Spotify URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Affiliate"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
