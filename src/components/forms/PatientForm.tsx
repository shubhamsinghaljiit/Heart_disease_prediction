const API_BASE = import.meta.env.VITE_API_URL;
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Heart,
  Activity,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from "lucide-react";

interface FormData {
  age: number | "";
  sex: number | "";
  cp: number | "";
  trestbps: number | "";
  chol: number | "";
  fbs: number | "";
  restecg: number | "";
  thalach: number | "";
  exang: number | "";
  oldpeak: number | "";
  slope: number | "";
  ca: number | "";
  thal: number | "";
  target?: number | "";
}

const initialFormData: FormData = {
  age: "",
  sex: "",
  cp: "",
  trestbps: "",
  chol: "",
  fbs: "",
  restecg: "",
  thalach: "",
  exang: "",
  oldpeak: "",
  slope: "",
  ca: "",
  thal: "",
  target: ""
};

const PatientForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // file upload states
  const [fileResult, setFileResult] = useState<any>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const FEATURE_LIST_PRETTY =
    "age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal";

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const numericFields: (keyof FormData)[] = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
    "target"
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    const newValue =
      numericFields.includes(field) && value !== "" ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [field]: newValue }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Simple validation: required fields for prediction
  const requiredFields: (keyof FormData)[] = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal"
  ];

  const missingRequired = useMemo(() => {
    return requiredFields.filter((f) => formData[f] === "" || formData[f] === null || formData[f] === undefined);
  }, [formData]);

  // Submit single-row prediction
  const handleSubmit = async () => {
    if (missingRequired.length > 0) {
      alert(`Please fill required fields before submitting: ${missingRequired.join(", ")}`);
      return;
    }

    setLoading(true);
    setResult(null);

    const payload: Record<string, number | null> = {};
    requiredFields.forEach((f) => {
      const val = formData[f];
      payload[f] = val === "" || val === null || val === undefined ? null : Number(val);
    });

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Server error:", data);
        alert(data.error || "Server returned an error");
        setLoading(false);
        return;
      }

      // server returns prediction, probability, model, record_id
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Failed to connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // file upload handler
  const handleFileUpload = async (file: File) => {
    setFileLoading(true);
    setFileResult(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_BASE}/predict-file`, {
        method: "POST",
        body: form
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Upload error:", data);
        alert(data.error || "Upload failed");
        setFileLoading(false);
        return;
      }

      // server returns { results: [{row, prediction, probability, record_id}, ...], model, filename }
      setFileResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Upload error", err);
      alert("Unable to upload file. Check console.");
    } finally {
      setFileLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <User className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold">Personal Information</h3>
              <p className="text-muted-foreground">Basic demographics</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="input-medical"
                  placeholder="Enter age"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => handleInputChange("sex", e.target.value)}
                  className="input-medical"
                >
                  <option value="">Select sex</option>
                  <option value="1">Male</option>
                  <option value="0">Female</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <Heart className="h-16 w-16 mx-auto text-primary mb-4 animate-heartbeat" />
              <h3 className="text-2xl font-bold">Chest Pain & Exercise</h3>
              <p className="text-muted-foreground">
                Chest pain type and exercise-induced symptoms
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Chest Pain Type (cp)
                </label>
                <select
                  value={formData.cp}
                  onChange={(e) => handleInputChange("cp", e.target.value)}
                  className="input-medical"
                >
                  <option value="">Select chest pain type</option>
                  <option value="0">Type 0</option>
                  <option value="1">Type 1</option>
                  <option value="2">Type 2</option>
                  <option value="3">Type 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Exercise Induced Angina (exang)
                </label>
                <select
                  value={formData.exang}
                  onChange={(e) => handleInputChange("exang", e.target.value)}
                  className="input-medical"
                >
                  <option value="">Select option</option>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <Activity className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold">Vital Signs</h3>
              <p className="text-muted-foreground">
                Blood pressure and heart rate measurements
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Resting Blood Pressure (trestbps)
                </label>
                <input
                  type="number"
                  value={formData.trestbps}
                  onChange={(e) =>
                    handleInputChange("trestbps", e.target.value)
                  }
                  className="input-medical"
                  placeholder="120"
                  min="80"
                  max="200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Heart Rate (thalach)
                </label>
                <input
                  type="number"
                  value={formData.thalach}
                  onChange={(e) => handleInputChange("thalach", e.target.value)}
                  className="input-medical"
                  placeholder="150"
                  min="60"
                  max="220"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Resting ECG (restecg)
                </label>
                <select
                  value={formData.restecg}
                  onChange={(e) => handleInputChange("restecg", e.target.value)}
                  className="input-medical"
                >
                  <option value="">Select ECG result</option>
                  <option value="0">Normal</option>
                  <option value="1">ST-T wave abnormality</option>
                  <option value="2">Left ventricular hypertrophy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ST Slope (slope)
                </label>
                <select
                  value={formData.slope}
                  onChange={(e) => handleInputChange("slope", e.target.value)}
                  className="input-medical"
                >
                  <option value="">Select ST slope</option>
                  <option value="0">Upsloping</option>
                  <option value="1">Flat</option>
                  <option value="2">Downsloping</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <BarChart3 className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold">Laboratory Results</h3>
              <p className="text-muted-foreground">
                Cholesterol and blood sugar levels
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cholesterol (chol)
                </label>
                <input
                  type="number"
                  value={formData.chol}
                  onChange={(e) => handleInputChange("chol", e.target.value)}
                  className="input-medical"
                  placeholder="200"
                  min="100"
                  max="400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Fasting Blood Sugar {"> 120 mg/dl (fbs)"}
                </label>
                <select
                  value={formData.fbs}
                  onChange={(e) => handleInputChange("fbs", e.target.value)}
                  className="input-medical"
                >
                  <option value="">Select option</option>
                  <option value="1">Yes ({"> 120 mg/dl"})</option>
                  <option value="0">No (≤ 120 mg/dl)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Oldpeak (ST depression)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.oldpeak}
                  onChange={(e) => handleInputChange("oldpeak", e.target.value)}
                  className="input-medical"
                  placeholder="0.0"
                  min="-3"
                  max="7"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <Activity className="h-16 w-16 mx-auto text-secondary mb-4" />
              <h3 className="text-2xl font-bold">Advanced Tests</h3>
              <p className="text-muted-foreground">Vessel and thalassemia data</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Major Vessels (ca)
                </label>
                <select
                  value={formData.ca}
                  onChange={(e) => handleInputChange("ca", e.target.value)}
                  className="input-medical"
                >
                  <option value="">Select number of vessels</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Thalassemia (thal)
                </label>
                <select
                  value={formData.thal}
                  onChange={(e) => handleInputChange("thal", e.target.value)}
                  className="input-medical"
                >
                  <option value="">Select thalassemia type</option>
                  <option value="0">Type 0</option>
                  <option value="1">Type 1</option>
                  <option value="2">Type 2</option>
                  <option value="3">Type 3</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-bold">Target (Optional)</h3>
              <p className="text-muted-foreground">
                If you’re training/testing, you can select the target value.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target</label>
              <select
                value={formData.target}
                onChange={(e) => handleInputChange("target", e.target.value)}
                className="input-medical"
              >
                <option value="">Select target</option>
                <option value="0">No disease</option>
                <option value="1">Disease present</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="patient-form" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Heart Health Assessment
            </h2>
            <p className="text-xl text-muted-foreground">
              Complete your medical assessment for AI-powered risk analysis
            </p>
          </div>

          <Card className="card-medical">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>
                  Step {currentStep} of {totalSteps}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </div>
              </div>
              <Progress value={progress} className="mb-4" />
              <CardDescription>
                Please provide accurate information for the best assessment
                results.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {renderStepContent()}

              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                {currentStep === totalSteps ? (
                  <Button
                    className="btn-primary flex items-center space-x-2"
                    onClick={handleSubmit}
                    disabled={loading || missingRequired.length > 0}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{loading ? "Predicting..." : "Get Prediction"}</span>
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {missingRequired.length > 0 && (
                <p className="mt-3 text-sm text-yellow-600">
                  Required fields missing: {missingRequired.join(", ")}
                </p>
              )}

              {result && (
                <div className="mt-10 p-6 border rounded-xl bg-white shadow animate-fade-in">
                  <h3 className="text-2xl font-bold mb-4">Prediction Result</h3>

                  <p className="text-lg">
                    <strong>Disease:</strong>{" "}
                    {result.prediction === 1 ? (
                      <span className="text-red-600 font-semibold">
                        Likely Heart Disease
                      </span>
                    ) : (
                      <span className="text-green-600 font-semibold">
                        Healthy
                      </span>
                    )}
                  </p>

                  <p className="text-lg mt-2">
                    <strong>Probability:</strong>{" "}
                    {typeof result.probability === "number"
                      ? `${(result.probability * 100).toFixed(2)}%`
                      : "N/A"}
                  </p>

                  <p className="text-md mt-1 text-muted-foreground">
                    Model Used: {result.model}
                  </p>

                  {result.record_id && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      Saved record id: <span className="font-mono">{result.record_id}</span>
                    </p>
                  )}
                </div>
              )}

              {/* ====== FILE UPLOAD INPUT (minimal, keeps CSS same) ====== */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="input-medical"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  CSV must contain columns: {FEATURE_LIST_PRETTY}
                </p>
              </div>

              {/* ====== FILE RESULTS (renders after upload) ====== */}
              {fileResult && fileResult.results && (
                <div className="mt-8 p-6 border rounded-xl bg-white shadow animate-fade-in">
                  <h3 className="text-2xl font-bold mb-4">File Predictions</h3>
                  <p className="text-sm text-muted-foreground mb-3">Model: {fileResult.model}</p>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="pr-4">Row</th>
                          <th className="pr-4">Prediction</th>
                          <th className="pr-4">Probability</th>
                          <th className="pr-4">Record ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileResult.results.map((r: any) => (
                          <tr key={r.row}>
                            <td className="pr-4">{r.row + 1}</td>
                            <td className="pr-4">
                              {r.prediction === 1 ? (
                                <span className="text-red-600 font-semibold">Likely</span>
                              ) : (
                                <span className="text-green-600 font-semibold">Healthy</span>
                              )}
                            </td>
                            <td className="pr-4">
                              {typeof r.probability === "number"
                                ? `${(r.probability * 100).toFixed(2)}%`
                                : "N/A"}
                            </td>
                            <td className="pr-4">
                              {r.record_id ? <span className="font-mono text-xs">{r.record_id}</span> : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* ======================================================== */}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PatientForm;
