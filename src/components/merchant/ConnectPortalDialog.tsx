import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Link2, Sparkles } from "lucide-react";

const portalConnectionSchema = z.object({
  partnerName: z.string().min(1, "Partner name is required").max(100),
  partnerBio: z.string().max(500).optional(),
  partnerAvatarUrl: z.string().url().optional().or(z.literal("")),
  specialOffer: z.string().max(200).optional(),
  offerDurationDays: z.number().min(1).max(365).optional(),
});

type PortalConnectionFormValues = z.infer<typeof portalConnectionSchema>;

interface ConnectPortalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConnectPortalDialog({
  open,
  onOpenChange,
  onSuccess,
}: ConnectPortalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PortalConnectionFormValues>({
    resolver: zodResolver(portalConnectionSchema),
    defaultValues: {
      partnerName: "",
      partnerBio: "",
      partnerAvatarUrl: "",
      specialOffer: "30 days free access",
      offerDurationDays: 30,
    },
  });

  const onSubmit = async (values: PortalConnectionFormValues) => {
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('connect-portal', {
        body: values,
      });

      if (error) throw error;

      toast.success(
        `🎉 Portal connected! ${data.membersNotified} members notified`,
        {
          description: `${values.partnerName} is now part of your community`,
        }
      );

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error connecting portal:', error);
      toast.error("Failed to connect portal", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Connect Partner Portal
          </DialogTitle>
          <DialogDescription>
            Link another creator's portal to yours. All community members will be instantly notified.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="partnerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tyler Childers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partnerBio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Introduce the partner to your community..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be shown in the announcement message
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="partnerAvatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialOffer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Special Offer (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="30 days free access" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give your community a special incentive to check out the partner
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offerDurationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Duration (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Connecting..." : "Connect Portal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}