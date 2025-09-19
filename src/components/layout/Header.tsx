import { Heart, Stethoscope, Activity, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-primary to-accent rounded-lg">
            <Heart className="h-6 w-6 text-white animate-heartbeat" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">HeartGuard</h1>
            <p className="text-xs text-muted-foreground">Heart Disease Prediction</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#home" className="text-foreground hover:text-primary transition-colors">Home</a>
          <a href="#assessment" className="text-foreground hover:text-primary transition-colors">Assessment</a>
          <a href="#dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</a>
          <a href="#about" className="text-foreground hover:text-primary transition-colors">About</a>
        </nav>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="hidden sm:flex items-center space-x-2">
            <Stethoscope className="h-4 w-4" />
            <span>Doctor Login</span>
          </Button>
          <Button className="btn-primary">
            <User className="h-4 w-4 mr-2" />
            Patient Portal
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;