import { Heart, Activity, Shield, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-heart.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-medical overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 animate-float">
          <Heart className="h-12 w-12 text-primary" />
        </div>
        <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '1s' }}>
          <Activity className="h-10 w-10 text-secondary" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float" style={{ animationDelay: '2s' }}>
          <Shield className="h-8 w-8 text-accent" />
        </div>
        <div className="absolute bottom-20 right-10 animate-float" style={{ animationDelay: '0.5s' }}>
          <Brain className="h-14 w-14 text-primary-glow" />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left animate-fade-in">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 text-shadow">
              Predict & Prevent
              <span className="block gradient-text bg-gradient-to-r from-white via-blue-200 to-green-200 bg-clip-text">
                Heart Disease
              </span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-xl">
              Advanced machine learning technology to assess cardiovascular risk, 
              provide personalized insights, and help you take control of your heart health.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              
              <Button size="lg" className="btn-primary text-lg px-8 py-4" onClick={() => {
    const section = document.getElementById("patient-form");
    section?.scrollIntoView({ behavior: "smooth" });
  }}>
                <Activity className="h-5 w-5 mr-2" />
                Start Assessment
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Shield className="h-5 w-5 mr-2" />
                Learn More
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-sm text-white/70">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-white/70">Patients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-white/70">Support</div>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="AI Heart Disease Prediction Technology" 
                className="w-full h-auto rounded-2xl shadow-2xl animate-float"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg p-4 shadow-medical animate-pulse-glow">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-success rounded-full animate-heartbeat"></div>
                  <span className="text-sm font-medium">Heart Rate: Normal</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-4 shadow-medical">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">Low Risk</div>
                  <div className="text-xs text-muted-foreground">Risk Assessment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;