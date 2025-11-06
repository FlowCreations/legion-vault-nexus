import { Link } from "react-router-dom";
import { BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import solLogo from "@/assets/sol-logo.png";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSelector } from "@/components/LanguageSelector";

export const Footer = () => {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link to="/about" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/contact" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
              Contact
            </Link>
            <Link to="/terms" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/privacy" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">
              Privacy
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
            © 2025 Sons of Legion. All rights reserved.
          </p>
        </div>
        
        {/* Language Selector */}
        <div className="flex justify-center mt-6 pt-6 border-t border-border/30">
          <LanguageSelector />
        </div>
      </div>
    </footer>
  );
};
