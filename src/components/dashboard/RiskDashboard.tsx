import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Info,
  Clock
} from "lucide-react";

interface RiskData {
  overallRisk: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  factors: {
    name: string;
    value: number;
    status: 'good' | 'warning' | 'danger';
    description: string;
  }[];
  recommendations: string[];
}

const mockRiskData: RiskData = {
  overallRisk: 23,
  riskLevel: 'Low',
  factors: [
    { name: 'Age', value: 45, status: 'good', description: 'Within normal range for cardiovascular health' },
    { name: 'Blood Pressure', value: 120, status: 'good', description: 'Optimal blood pressure levels' },
    { name: 'Cholesterol', value: 240, status: 'warning', description: 'Slightly elevated, monitor regularly' },
    { name: 'Exercise Capacity', value: 85, status: 'good', description: 'Good exercise tolerance' },
    { name: 'ECG Results', value: 0, status: 'good', description: 'Normal ECG findings' }
  ],
  recommendations: [
    'Maintain regular cardiovascular exercise',
    'Consider dietary changes to reduce cholesterol',
    'Monitor blood pressure regularly',
    'Schedule follow-up in 6 months'
  ]
};

const RiskDashboard = () => {
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-success';
      case 'Moderate': return 'text-warning';
      case 'High': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-success/10';
      case 'Moderate': return 'bg-warning/10';
      case 'High': return 'bg-destructive/10';
      default: return 'bg-muted/10';
    }
  };

  const getFactorIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'danger': return <Heart className="h-5 w-5 text-destructive" />;
      default: return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Heart Health Risk Assessment
            </h2>
            <p className="text-xl text-muted-foreground">
              AI-powered analysis of your cardiovascular health
            </p>
          </div>

          {/* Overall Risk Card */}
          <Card className="card-medical mb-8 overflow-hidden">
            <div className="bg-gradient-medical p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Overall Risk Score</h3>
                  <p className="text-white/80">Based on comprehensive health data analysis</p>
                </div>
                <Heart className="h-16 w-16 animate-heartbeat opacity-80" />
              </div>
              
              <div className="mt-8 grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{mockRiskData.overallRisk}%</div>
                  <div className="text-sm text-white/80">Risk Probability</div>
                </div>
                <div className="text-center">
                  <Badge className={`${getRiskBgColor(mockRiskData.riskLevel)} ${getRiskColor(mockRiskData.riskLevel)} text-lg px-4 py-2`}>
                    {mockRiskData.riskLevel} Risk
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="text-sm">Updated just now</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Risk Factors */}
            <Card className="card-medical">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Risk Factors Analysis</span>
                </CardTitle>
                <CardDescription>
                  Individual factor contributions to overall risk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRiskData.factors.map((factor, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                      selectedFactor === factor.name ? 'border-primary bg-primary/5' : 'border-border hover:border-border'
                    }`}
                    onClick={() => setSelectedFactor(selectedFactor === factor.name ? null : factor.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getFactorIcon(factor.status)}
                        <span className="font-medium">{factor.name}</span>
                      </div>
                      <span className="text-sm font-bold">{factor.value}</span>
                    </div>
                    
                    {selectedFactor === factor.name && (
                      <div className="mt-3 pt-3 border-t border-border animate-fade-in">
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="card-medical">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Health Recommendations</span>
                </CardTitle>
                <CardDescription>
                  Personalized suggestions to improve your heart health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRiskData.recommendations.map((recommendation, index) => (
                    <div 
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm leading-relaxed">{recommendation}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary">Next Steps</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Schedule a follow-up appointment with your healthcare provider to discuss these results 
                    and create a personalized treatment plan.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Tracking */}
          <Card className="card-medical mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5" />
                <span>Risk Reduction Progress</span>
              </CardTitle>
              <CardDescription>
                Track your progress towards better heart health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-primary">-5%</div>
                    <div className="text-sm text-muted-foreground">Risk Reduction</div>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-2">Since last month</div>
                </div>
                
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-secondary">12</div>
                    <div className="text-sm text-muted-foreground">Healthy Days</div>
                  </div>
                  <Progress value={60} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-2">This month</div>
                </div>
                
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-accent">8.5</div>
                    <div className="text-sm text-muted-foreground">Health Score</div>
                  </div>
                  <Progress value={85} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-2">Out of 10</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RiskDashboard;