// DoctorLogin.tsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Eye, EyeOff, User as UserIcon, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * DoctorLogin.tsx
 * - POSTs { email, password } to backend /auth/login
 * - Expects { token, user } on success
 * - Stores token in localStorage (or sessionStorage if remember unchecked)
 * - Redirects to /doctor/dashboard
 *
 * SAMPLE CSV path points to the file you uploaded earlier:
 * local file path: /mnt/data/finaldata.csv
 * file URL used below: file:///mnt/data/finaldata.csv
 */

const SAMPLE_CSV_URL = "file:///mnt/data/finaldata.csv"; // <-- uploaded file path

const DoctorLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  const navigate = useNavigate();

  const validate = () => {
    if (!email) return "Please enter email or username.";
    if (!password) return "Please enter password.";
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || "Login failed. Check credentials.");
        setLoading(false);
        return;
      }

      if (!data.token) {
        setError("Login succeeded but token missing. Check backend.");
        setLoading(false);
        return;
      }

      // Store token
      if (remember) {
        localStorage.setItem("authToken", data.token);
      } else {
        sessionStorage.setItem("authToken", data.token);
      }
      localStorage.setItem("authUser", JSON.stringify(data.user || {}));

      // Redirect to doctor dashboard
      navigate("/doctor/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error while logging in. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("dr_demo");
    setPassword("demo1234");
    setError(null);
  };

  return (
    <section className="min-h-screen bg-muted/30 flex items-center py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card className="overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 p-6">
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 rounded-full p-2">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white text-xl font-semibold">Doctor Portal</h1>
                  <p className="text-white/90 text-sm">Sign in to access patient records & reports</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 bg-white">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email or Username</label>
                  <Input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="input-medical"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="input-medical pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-2 top-2 text-muted-foreground p-1 rounded"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="form-checkbox"
                    />
                    <span>Remember me</span>
                  </label>

                  <a href="/doctor/forgot" className="text-sm text-muted-foreground underline">
                    Forgot password?
                  </a>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex items-center justify-between space-x-3">
                  <Button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={fillDemo}
                    disabled={loading}
                  >
                    Demo
                  </Button>
                </div>

                <div className="pt-3 border-t border-muted/30 text-sm text-muted-foreground">
                  <p>
                    Need an account? Add doctors using the `create_doctor.py` script (backend), or ask admin.
                  </p>
                  <p className="mt-2">
                    Sample CSV for quick testing:
                    <br />
                    <a href={SAMPLE_CSV_URL} target="_blank" rel="noreferrer" className="underline break-all">
                      {SAMPLE_CSV_URL.replace("file://", "")}
                    </a>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DoctorLogin;
