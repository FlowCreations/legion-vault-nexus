import { Link, useLocation } from "react-router-dom";
import { Video, Music, ShoppingBag, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Videos", path: "/videos", icon: Video },
  { name: "Music", path: "/music", icon: Music },
  { name: "Merch", path: "/merch", icon: ShoppingBag },
  { name: "Shows", path: "/shows", icon: Calendar },
  { name: "Community", path: "/community", icon: Users },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg min-w-[60px] touch-manipulation transition-all active:scale-95",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};