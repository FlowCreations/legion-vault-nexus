import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background-dark/50 backdrop-blur-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/src/assets/sol-logo.png" 
              alt="Sons of Legion" 
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </Link>
          
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link to="/support" className="hover:text-primary transition-colors">
              Support
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2025 Sons of Legion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
