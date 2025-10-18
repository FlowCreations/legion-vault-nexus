import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Music2, Instagram, Facebook, Youtube, Twitter } from "lucide-react";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(1000),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormData) => {
    console.log("Form submitted:", data);
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
    });
    form.reset();
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="font-serif text-6xl md:text-7xl font-bold text-center mb-16 text-primary">
          CONTACT
        </h1>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Left Column - Contact Info */}
          <div className="space-y-8 md:pl-12">
            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-xl mb-1">Tennessee</h3>
                <p className="text-foreground/90 font-medium">Nashville, Tn</p>
              </div>
            </div>

            {/* Official E-mails */}
            <div className="flex items-start gap-3">
              <Mail className="w-6 h-6 mt-1 flex-shrink-0" />
              <div className="space-y-4">
                <h3 className="font-bold text-xl mb-3">Official E-mails</h3>
                
                <div>
                  <p className="text-foreground/90 font-medium">General: <a href="mailto:hello@sonsoflegion.com" className="text-foreground hover:text-primary transition-colors">hello@sonsoflegion.com</a></p>
                </div>

                <div>
                  <p className="font-semibold mb-1">Management:</p>
                  <p className="text-foreground/90 font-medium">Tayler Bock</p>
                  <a href="mailto:tayler.bock@redlightmanagement.com" className="text-foreground hover:text-primary transition-colors font-medium">tayler.bock@redlightmanagement.com</a>
                  
                  <p className="text-foreground/90 font-medium mt-2">Bruce Flohr</p>
                  <a href="mailto:bruce.flohr@redlightmanagement.com" className="text-foreground hover:text-primary transition-colors font-medium">bruce.flohr@redlightmanagement.com</a>
                </div>

                <div>
                  <p className="text-foreground/90 font-medium">Booking only: <a href="mailto:matthew.morgan@unitedtalent.com" className="text-foreground hover:text-primary transition-colors">matthew.morgan@unitedtalent.com</a></p>
                </div>

                <div>
                  <p className="text-foreground/90 font-medium">For song clearance & licensing requests contact: <a href="mailto:Michael.Pizzuto@concord.com" className="text-foreground hover:text-primary transition-colors">Michael.Pizzuto@concord.com</a></p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[150px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-[#F2B705] hover:bg-[#F2B705]/90 text-black font-bold text-lg py-6">
                  SUBMIT
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center gap-4 mb-12">
            <a href="https://www.tiktok.com/@sonsoflegion" target="_blank" rel="noopener noreferrer" 
               className="w-12 h-12 bg-[#2D2D2D] text-white flex items-center justify-center hover:bg-[#3D3D3D] transition-colors">
              <Music2 className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/sonsoflegion" target="_blank" rel="noopener noreferrer"
               className="w-12 h-12 bg-[#2D2D2D] text-white flex items-center justify-center hover:bg-[#3D3D3D] transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://www.facebook.com/sonsoflegion" target="_blank" rel="noopener noreferrer"
               className="w-12 h-12 bg-[#2D2D2D] text-white flex items-center justify-center hover:bg-[#3D3D3D] transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://www.youtube.com/@sonsoflegion" target="_blank" rel="noopener noreferrer"
               className="w-12 h-12 bg-[#2D2D2D] text-white flex items-center justify-center hover:bg-[#3D3D3D] transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="https://open.spotify.com/artist/sonsoflegion" target="_blank" rel="noopener noreferrer"
               className="w-12 h-12 bg-[#2D2D2D] text-white flex items-center justify-center hover:bg-[#3D3D3D] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </a>
            <a href="https://music.apple.com/us/artist/sonsoflegion" target="_blank" rel="noopener noreferrer"
               className="w-12 h-12 bg-[#2D2D2D] text-white flex items-center justify-center hover:bg-[#3D3D3D] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.228 1.491-2.696 2.873-.116.343-.213.695-.276 1.052-.126.726-.194 1.46-.226 2.2-.003.016-.011.032-.014.048v11.776c.003.01.01.02.013.03.015.397.076.752.15 1.104.17 1.04.512 1.99 1.23 2.788.68.757 1.539 1.2 2.576 1.37.2.033.4.062.6.084.077.01.152.022.23.028.303.024.606.047.91.06.107.004.216.006.322.01h12.06c.2 0 .4-.013.6-.02.494-.02 1.01-.12 1.486-.196.905-.15 1.72-.53 2.39-1.2.737-.74 1.136-1.663 1.314-2.67.03-.155.046-.313.065-.47.02-.15.04-.3.054-.453.01-.103.013-.208.02-.31v-11.75c-.002-.01-.01-.02-.014-.03zM12.24 4.034c.5-.028 1.002-.013 1.502-.013.102 0 .204 0 .306.004.302.012.604.024.904.04 1.24.068 2.275.74 2.9 1.883.36.66.523 1.375.495 2.127-.01.29-.03.58-.06.87-.09.83-.41 1.52-1.05 2.058-.75.63-1.64.9-2.6.9-.03 0-.06 0-.09-.002-.69-.01-1.38-.02-2.07-.03-.05 0-.1-.01-.15-.01v4.05c0 .55 0 1.1-.01 1.65-.01.42-.02.84-.02 1.26-.01.32-.02.64-.03.96-.03.68-.08 1.35-.27 2.01-.3 1.03-.87 1.85-1.8 2.38-.6.34-1.25.51-1.94.55-.5.03-1 .02-1.49-.02-.93-.08-1.75-.43-2.4-1.14-.58-.63-.87-1.4-.95-2.27-.02-.2-.04-.4-.05-.6-.01-.1-.01-.21-.01-.31V9.44c0-.31.01-.62.01-.93 0-.38.01-.76.02-1.14.02-.64.06-1.28.18-1.92.2-1.06.7-1.95 1.6-2.6.61-.44 1.3-.67 2.04-.76.27-.03.54-.05.81-.06.44-.02.88-.01 1.33-.01zm6.04 9.824v5.736c0 .18-.01.36-.02.54-.01.27-.03.54-.05.81-.06.72-.18 1.42-.47 2.09-.38.88-.97 1.58-1.85 1.97-.25.11-.51.19-.78.25-.38.08-.77.13-1.16.15-.07 0-.14.01-.21.01h-.17c-.07 0-.13-.01-.2-.01-.5-.03-1-.11-1.47-.3-1.15-.48-1.88-1.35-2.2-2.54-.11-.42-.16-.85-.18-1.28-.01-.2-.02-.4-.03-.6v-7.58c0-.06 0-.13.01-.19.01-.44.03-.88.08-1.32.1-.86.35-1.68.87-2.4.58-.8 1.36-1.3 2.33-1.53.27-.06.55-.1.83-.13.14-.02.28-.03.42-.04h.08c.06 0 .13.01.19.01.51.03 1.01.11 1.49.3 1.1.44 1.85 1.25 2.21 2.4.14.44.22.9.26 1.37.02.25.03.5.04.75v1.91z"/>
              </svg>
            </a>
            <a href="https://twitter.com/sonsoflegion" target="_blank" rel="noopener noreferrer"
               className="w-12 h-12 bg-[#2D2D2D] text-white flex items-center justify-center hover:bg-[#3D3D3D] transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Scammer Warning */}
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-foreground/80 leading-relaxed">
            There are loads of fake accounts and scammers pretending to be us, so please be careful. We do not have any backup pages or secret accounts, only our official profiles are linked on this website. We do not use Telegram, Discord, WhatsApp, or Signal, and we'll never ask you to buy gift cards, join a "VIP membership," or share financial details in chat. We are not offering private merch, investigations, or personal conversations through reps. If someone claims to be us and starts talking romance or asking for money, it's a scam, please block and report.
          </p>
        </div>
      </div>
    </div>
  );
}
