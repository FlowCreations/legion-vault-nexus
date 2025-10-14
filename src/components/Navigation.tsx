import { Film, Music, Users, ShoppingBag, Radio, LogIn, Calendar } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Videos", path: "/videos", icon: Film },
  { name: "Music", path: "/music", icon: Music },
  { name: "Events", path: "/events", icon: Calendar },
  { name: "Community", path: "/community", icon: Users },
  { name: "Merch", path: "/merch", icon: ShoppingBag },
  { name: "Live Studio", path: "/live", icon: Radio },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background-dark/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/src/assets/sol-logo.jpg" 
              alt="Sons of Legion" 
              className="h-12 w-auto object-contain transition-all duration-300 group-hover:brightness-110"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
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

          {/* Sign In Button */}
          <Button 
            className="hidden md:flex bg-gradient-gold hover:shadow-glow transition-all duration-300"
            asChild
          >
            <Link to="/auth">
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Link>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
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
            
            <Button 
              size="sm"
              className="ml-2 bg-gradient-gold hover:shadow-glow transition-all duration-300 flex-shrink-0"
              asChild
            >
              <Link to="/auth">
                <LogIn className="w-4 h-4 md:mr-2" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
