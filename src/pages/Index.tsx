import Header from "@/components/layout/Header";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import PatientForm from "@/components/forms/PatientForm";
import RiskDashboard from "@/components/dashboard/RiskDashboard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PatientForm />
        {/* <RiskDashboard /> */}
      </main>
    </div>
  );
};

export default Index;
