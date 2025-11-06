import { Film, Music, Users, ShoppingBag, Radio, LogIn, LogOut, Calendar, Shield, User, Settings, Crown, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import solLogo from "@/assets/sol-logo.png";
import { CartDrawer } from "@/components/CartDrawer";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getTierColor } from "@/lib/tierColors";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { useCartStore } from "@/stores/cartStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TranslatedText } from "@/components/TranslatedText";

const navItems = [
  { name: "nav.videos", path: "/videos", icon: Film },
  { name: "nav.music", path: "/music", icon: Music },
  { name: "nav.merch", path: "/merch", icon: ShoppingBag },
  { name: "nav.shows", path: "/shows", icon: Calendar },
  { name: "nav.community", path: "/community", icon: Users },
];

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { tier, isSubscribed } = useSubscription();
  const [currentBadge, setCurrentBadge] = useState<'silver_star' | 'gold_star' | 'medallion' | null>(null);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Load milestone progress for badge when user changes
    if (user) {
      loadMilestoneBadge();
    } else {
      setCurrentBadge(null);
    }
  }, [user]);

  const loadMilestoneBadge = async () => {
    if (!user) return;
    
    const { data: milestoneData } = await supabase
      .from("milestone_progress")
      .select("current_badge")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (milestoneData) {
      setCurrentBadge(milestoneData.current_badge as 'silver_star' | 'gold_star' | 'medallion' | null);
    }
  };

  const handleLogout = async () => {
    clearCart();
    await signOut();
    navigate("/auth");
  };

  const isHomePage = location.pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background-dark/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Hidden on homepage */}
          {!isHomePage && (
            <Link to="/" className="flex items-center group">
              <img 
                src={solLogo} 
                alt="Sons of Legion" 
                className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-[0_0_20px_rgba(247,201,70,0.4)]"
              />
            </Link>
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
                  <span className="font-medium">
                    <TranslatedText i18nKey={item.name} />
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-gold rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Cart, Search, and Auth */}
          <div className="hidden md:flex items-center gap-3">
            <CartDrawer />
            <GlobalSearch />
            {!user ? (
              <Link to="/auth">
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <LogIn className="w-4 h-4" />
                  <TranslatedText i18nKey="nav.signIn" />
                </Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || "User"} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    {currentBadge && (
                      <div className="absolute -top-1 -right-1">
                        <BadgeDisplay badge={currentBadge} size="sm" />
                      </div>
                    )}
                    {!currentBadge && isSubscribed && (
                      <div className="absolute -top-1 -right-1">
                        <Crown className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile?.display_name || "My Account"}</p>
                        <p className="text-xs text-muted-foreground">{profile?.location}</p>
                      </div>
                      {tier !== 'free' && (
                        <Badge className={cn("text-xs", getTierColor(tier))}>
                          {tier}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <TranslatedText i18nKey="nav.profile" />
                  </DropdownMenuItem>
                  
                  {!isSubscribed && (
                    <DropdownMenuItem onClick={() => navigate("/subscribe")}>
                      <Crown className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-primary font-medium">
                        <TranslatedText i18nKey="nav.upgradePlan" />
                      </span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <TranslatedText i18nKey="nav.account" />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Package className="mr-2 h-4 w-4" />
                    <TranslatedText i18nKey="nav.orders" />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Shield className="mr-2 h-4 w-4" />
                    <TranslatedText i18nKey="nav.security" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <TranslatedText i18nKey="nav.logOut" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
                      <span className="text-sm font-medium">
                        <TranslatedText i18nKey={item.name} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <CartDrawer />
              {!user ? (
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    <LogIn className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>{profile?.display_name || "My Account"}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <TranslatedText i18nKey="nav.profile" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <TranslatedText i18nKey="nav.orders" />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <TranslatedText i18nKey="nav.logOut" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
