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
  isAgentExpanded,
  setIsAgentExpanded
}: { 
  showDiagnostics?: boolean; 
  setShowDiagnostics?: (show: boolean) => void;
  isAgentExpanded?: boolean;
  setIsAgentExpanded?: (expanded: boolean) => void;
}) => {
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgentActive, setIsAgentActive] = useState(false);

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

  // Check Agent status
  useEffect(() => {
    const checkAgentStatus = async () => {
      try {
        const { data } = await supabase
          .from("feature_flags")
          .select("enabled")
          .eq("flag_name", "agent_active")
          .single();

        setIsAgentActive(data?.enabled || false);
      } catch (error) {
        console.error("Error checking Agent status:", error);
      }
    };

    checkAgentStatus();
  }, []);

  // Check Agent status
  useEffect(() => {
    const checkAgentStatus = async () => {
      try {
        const { data } = await supabase
          .from("feature_flags")
          .select("enabled")
          .eq("flag_name", "agent_active")
          .single();

        setIsAgentActive(data?.enabled || false);
      } catch (error) {
        console.error("Error checking Agent status:", error);
      }
    };

    checkAgentStatus();
  }, []);

  return (
    <footer className="border-t border-border bg-background-dark/50 backdrop-blur-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Left Section - Admin Performance Icon */}
          <div className="flex items-center gap-4">
            {isAdmin && (
              <motion.button
                onClick={() => setShowDiagnostics?.(!showDiagnostics)}
                className="relative rounded-full w-10 h-10 shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                title="Performance Monitor (Admin only)"
              >
                <Activity className="w-5 h-5 text-primary-foreground absolute inset-0 m-auto" />
              </motion.button>
            )}
          </div>
          
          {/* Center Section - Links, Merchant Dashboard, Copyright */}
          <div className="flex flex-col items-center gap-4">
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
          
          {/* Right Section - AI Chat Icon */}
          <div className="flex items-center gap-4">
            {isAgentActive && (
              <motion.button
                onClick={() => setIsAgentExpanded?.(!isAgentExpanded)}
                className="relative rounded-full w-10 h-10 shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                title="AI Chat"
              >
                <MessageCircle className="w-5 h-5 text-primary-foreground absolute inset-0 m-auto" />
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Language Selector */}
        <div className="flex justify-center mt-6 pt-6 border-t border-border/30">
          <LanguageSelector />
        </div>
      </div>
    </footer>
  );
};
