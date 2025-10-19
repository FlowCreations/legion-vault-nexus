import { Film, Music, Users, ShoppingBag, Radio, LogIn, Calendar, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import solLogo from "@/assets/sol-logo.png";
import { CartDrawer } from "@/components/CartDrawer";
import { GlobalSearch } from "@/components/GlobalSearch";

const navItems = [
  { name: "Videos", path: "/videos", icon: Film },
  { name: "Music", path: "/music", icon: Music },
  { name: "Merch", path: "/merch", icon: ShoppingBag },
  { name: "Shows", path: "/shows", icon: Calendar },
  { name: "Live Studio", path: "/live", icon: Radio },
  { name: "Community", path: "/community", icon: Users },
];

export const Navigation = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdmin(false);
      setIsLoggedIn(false);
      return;
    }

    setIsLoggedIn(true);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!roles);
  };

  const isHomePage = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background-dark/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Hidden on homepage */}
          {!isHomePage && (
            <div className="flex items-center gap-4">
              {!isLoggedIn && (
                <Link to="/auth" className="hidden md:block">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
              )}
              <Link to="/" className="flex items-center group">
                <img 
                  src={solLogo} 
                  alt="Sons of Legion" 
                  className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-[0_0_20px_rgba(247,201,70,0.4)]"
                />
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <div className={cn(
            "hidden md:flex items-center space-x-1",
            isHomePage && "mx-auto"
          )}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300",
                    isActive
                      ? "text-primary bg-card"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-gold rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Search and Cart */}
          <div className="hidden md:flex items-center gap-3">
            <GlobalSearch />
            <CartDrawer />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="mb-3">
            <GlobalSearch />
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex space-x-2 pb-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300",
                        isActive
                          ? "text-primary bg-card"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <CartDrawer />
              {!isLoggedIn && (
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    <LogIn className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
