import { Link } from "react-router-dom";
import { BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import solLogo from "@/assets/sol-logo.png";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background-dark/50 backdrop-blur-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src={solLogo} 
              alt="Sons of Legion" 
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
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
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2025 Sons of Legion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
