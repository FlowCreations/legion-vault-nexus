import { Link } from "react-router-dom";
import { BarChart, Activity, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import solLogo from "@/assets/sol-logo.png";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Footer = ({ 
  showDiagnostics, 
  setShowDiagnostics,
  isLiveChatOpen,
  setIsLiveChatOpen,
  hideChat
}: { 
  showDiagnostics?: boolean; 
  setShowDiagnostics?: (show: boolean) => void;
  isLiveChatOpen?: boolean;
  setIsLiveChatOpen?: (open: boolean) => void;
  hideChat?: boolean;
}) => {
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!roles);
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);


  return (
    <footer className="border-t border-border bg-background-dark/50 backdrop-blur-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Left Section - Admin Performance Icon (positioned absolutely to bottom left) */}
          {isAdmin && (
            <motion.button
              onClick={() => setShowDiagnostics?.(!showDiagnostics)}
              className="fixed bottom-4 left-4 rounded-full w-10 h-10 shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 z-50"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              title="Performance Monitor (Admin only)"
            >
              <Activity className="w-5 h-5 text-primary-foreground absolute inset-0 m-auto" />
            </motion.button>
          )}
          
          {/* Center Section - Links, Copyright */}
          <div className="flex flex-col items-center gap-4 flex-1 justify-center">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link to="/about" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                {t('footer.about')}
              </Link>
              <Link to="/contact" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                {t('footer.contact')}
              </Link>
              <Link to="/terms" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                {t('footer.terms')}
              </Link>
              <Link to="/privacy" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
                {t('footer.privacy')}
              </Link>
            </div>
            
            {isAdmin && (
              <Button 
                asChild 
                variant="outline" 
                size="sm"
                className="bg-gradient-gold hover:shadow-glow transition-all duration-300 text-black hover:text-black"
              >
                <Link to="/merchant" onClick={() => window.scrollTo(0, 0)}>
                  <BarChart className="w-4 h-4 mr-2" />
                  Merchant Dashboard
                </Link>
              </Button>
            )}
            
            <p className="text-sm text-muted-foreground">
              {t('footer.copyright')}
            </p>
          </div>
          
          {/* Right Section - Live Chat Icon (positioned absolutely to bottom right) */}
          {!hideChat && (
            <motion.button
              onClick={() => setIsLiveChatOpen?.(!isLiveChatOpen)}
              className="fixed bottom-4 right-4 rounded-full w-10 h-10 shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90 z-50"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              title="Live Chat"
            >
              <MessageCircle className="w-5 h-5 text-primary-foreground absolute inset-0 m-auto" />
            </motion.button>
          )}
        </div>
        
        {/* Language Selector */}
        <div className="flex justify-center mt-6 pt-6 border-t border-border/30">
          <LanguageSelector />
        </div>
      </div>
    </footer>
  );
};
