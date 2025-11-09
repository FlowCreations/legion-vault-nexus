import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ShoppingBag, Shield, Search as SearchIcon } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { GlobalSearch } from "@/components/GlobalSearch";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileSearchModal } from "@/components/MobileSearchModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TranslatedText } from "@/components/TranslatedText";
import { toast } from "sonner";
import { Crown, Award } from "lucide-react";
import { useMilestoneProgress } from "@/hooks/useMilestoneProgress";

const navItems = [
  { name: "Videos", path: "/videos", translationKey: "nav.videos" },
  { name: "Music", path: "/music", translationKey: "nav.music" },
  { name: "Merch", path: "/merch", translationKey: "nav.merch" },
  { name: "Shows", path: "/shows", translationKey: "nav.shows" },
  { name: "Community", path: "/community", translationKey: "nav.community" },
];

export const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [currentBadge, setCurrentBadge] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCurrentBadge();
    }
  }, [user]);

  const fetchCurrentBadge = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('milestone_progress')
      .select('current_badge')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setCurrentBadge(data.current_badge);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          {!isHomePage && (
            <Link to="/" className="flex items-center">
              <img
                src="/lovable-uploads/1a5ce5e3-8e93-4d34-a75e-26ee0856e5b7.png"
                alt="Sons of Legion"
                className="h-12 w-auto"
              />
            </Link>
          )}

          <div className={`flex items-center gap-1 ${isHomePage ? 'mx-auto' : ''}`}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <TranslatedText i18nKey={item.translationKey} />
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <CartDrawer />
            <GlobalSearch />
            
            {!user && (
              <Button asChild variant="outline">
                <Link to="/auth">
                  <TranslatedText i18nKey="nav.signIn" />
                </Link>
              </Button>
            )}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {currentBadge === 'Founding Member' && (
                      <Crown className="absolute -top-1 -right-1 h-4 w-4 text-gold" />
                    )}
                    {currentBadge && currentBadge !== 'Founding Member' && (
                      <Award className="absolute -top-1 -right-1 h-4 w-4 text-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                  <DropdownMenuLabel>
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/favorites">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  {user?.app_metadata?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/merchant">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </nav>

        {/* Mobile navigation - Simplified top bar */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center">
              <img
                src="/lovable-uploads/1a5ce5e3-8e93-4d34-a75e-26ee0856e5b7.png"
                alt="Sons of Legion"
                className="h-8 w-auto"
              />
            </Link>

            <div className="flex items-center gap-1">
              {/* Search Icon - Opens Modal */}
              <Button 
                variant="ghost" 
                size="icon"
                className="touch-manipulation h-10 w-10"
                onClick={() => setIsSearchModalOpen(true)}
              >
                <SearchIcon className="h-5 w-5" />
              </Button>

              {/* Cart */}
              <CartDrawer />
              
              {/* User Menu */}
              {!user && (
                <Button asChild variant="outline" className="touch-manipulation ml-1">
                  <Link to="/auth">
                    <TranslatedText i18nKey="nav.signIn" />
                  </Link>
                </Button>
              )}
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full touch-manipulation ml-1">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {currentBadge === 'Founding Member' && (
                        <Crown className="absolute -top-1 -right-1 h-4 w-4 text-gold" />
                      )}
                      {currentBadge && currentBadge !== 'Founding Member' && (
                        <Award className="absolute -top-1 -right-1 h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                    <DropdownMenuLabel>
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="py-3 touch-manipulation">
                      <Link to="/profile">
                        <User className="mr-3 h-5 w-5" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="py-3 touch-manipulation">
                      <Link to="/favorites">
                        <ShoppingBag className="mr-3 h-5 w-5" />
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    {user?.app_metadata?.role === 'admin' && (
                      <DropdownMenuItem asChild className="py-3 touch-manipulation">
                        <Link to="/merchant">
                          <Shield className="mr-3 h-5 w-5" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="py-3 touch-manipulation">
                      <LogOut className="mr-3 h-5 w-5" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Mobile Search Modal */}
      <MobileSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </>
  );
};