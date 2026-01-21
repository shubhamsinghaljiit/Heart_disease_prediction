// DoctorLogin.tsx
const API_BASE = import.meta.env.VITE_API_URL;
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
import { Eye, EyeOff, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * DoctorLogin.tsx
 * - Posts { username/email, password } to backend /auth/login-file (dev file-based auth)
 * - Handles 2 possible backend responses:
 *    a) { token, user }  -> stores token and user
 *    b) { ok: true, username, next } -> stores username and navigates
 * - On success redirects to /doctor/dashboard
 *
 * NOTE: SAMPLE_CSV_URL uses uploaded file path from session:
 * file:///mnt/data/finaldata.csv
 */
const SAMPLE_CSV_URL = "file:///mnt/data/finaldata.csv"; // uploaded file path in session

const DoctorLogin: React.FC = () => {
  const [email, setEmail] = useState(""); // using "email" field but backend accepts username/email
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
      // Backend route in pipeline.py is /auth/login-file
      const res = await fetch(`${API_BASE}/auth/login-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send as username and password (backend accepts username or email)
        body: JSON.stringify({ username: email.trim(), password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // backend may return helpful error fields
        const msg = data.error || data.message || "Login failed. Check credentials.";
        setError(msg);
        setLoading(false);
        return;
      }

      // If backend returned a token (future or alternate backend), store it
      if (data.token) {
        if (remember) localStorage.setItem("authToken", data.token);
        else sessionStorage.setItem("authToken", data.token);
        if (data.user) localStorage.setItem("authUser", JSON.stringify(data.user));
        // navigate to doctor dashboard
        navigate("/doctor/dashboard");
        return;
      }

      // If backend returned { ok: true, username, next } (your pipeline currently returns this)
      if (data.ok || data.username) {
        // store minimal info
        localStorage.setItem("authUser", JSON.stringify({ username: data.username || email.trim() }));
        // optionally store a flag
        if (remember) localStorage.setItem("authRemember", "1");
        else sessionStorage.setItem("authRemember", "1");

        // navigate to next (if provided) or default dashboard
        const next = data.next || "/doctor/dashboard";
        navigate(next);
        return;
      }

      // Fallback: success with unknown shape
      setError("Login succeeded but response shape unexpected. Check backend.");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error while logging in. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("dr_raj");
    setPassword("mySecretPass123");
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
                    placeholder="doctor@example.com or dr_raj"
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
