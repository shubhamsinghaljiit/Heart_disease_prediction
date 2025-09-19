import { 
  Brain, 
  Activity, 
  Shield, 
  Users, 
  BarChart3, 
  Clock,
  Heart,
  Stethoscope,
  CheckCircle
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning algorithms analyze multiple risk factors to provide accurate predictions.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Activity,
    title: "Real-time Assessment",
    description: "Get instant risk analysis based on your medical parameters and lifestyle factors.",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  {
    icon: Shield,
    title: "Preventive Care",
    description: "Receive personalized recommendations to prevent heart disease and improve cardiovascular health.",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: BarChart3,
    title: "Visual Insights",
    description: "Interactive charts and graphs help you understand your risk factors and track progress.",
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    icon: Users,
    title: "Doctor Dashboard",
    description: "Healthcare professionals can monitor patients and make informed decisions.",
    color: "text-warning",
    bgColor: "bg-warning/10"
  },
  {
    icon: Clock,
    title: "24/7 Monitoring",
    description: "Continuous health monitoring with alerts and notifications for early intervention.",
    color: "text-destructive",
    bgColor: "bg-destructive/10"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Heart className="h-5 w-5 text-primary mr-2" />
            <span className="text-primary font-medium">Advanced Features</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Comprehensive Heart Health
            <span className="block gradient-text">Monitoring System</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform combines cutting-edge AI technology with medical expertise 
            to provide the most accurate heart disease risk assessment available.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="card-medical p-8 group hover:scale-105 transition-transform duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-8 w-8 ${feature.color}`} />
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-4">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              
              <div className="mt-6 flex items-center text-primary font-medium">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Available Now</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* CTA Section */}
        {/* <div className="mt-20 text-center">
          <div className="bg-gradient-medical rounded-3xl p-12 text-white">
            <Stethoscope className="h-16 w-16 mx-auto mb-6 animate-float" />
            <h3 className="text-3xl font-bold mb-4">Ready to Start?</h3>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Take the first step towards better heart health with our comprehensive assessment.
            </p>
            <button className="btn-primary bg-white text-primary hover:bg-white/90">
              Begin Health Assessment
            </button>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default FeaturesSection;