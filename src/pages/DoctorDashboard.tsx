// DoctorDashboard.tsx
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Search, FileText, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SAMPLE_CSV_PATH = "file:///mnt/data/finaldata.csv";

type RecordType = {
  _id: string;
  input: Record<string, any>;
  prediction: number;
  probability: number | null;
  model: string;
  timestamp?: string;
};

const DoctorDashboard: React.FC = () => {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [notesText, setNotesText] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5001/records");
      const data = await res.json();
      if (res.ok) setRecords(data.records || []);
    } catch (err) {
      console.error("Failed to fetch records", err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s?: string) => (s ? new Date(s).toLocaleString() : "-");

  const onRowClick = (r: RecordType) => {
    setSelectedId(r._id);
    setNotesText("");
    setMessage(null);
  };

  // ---------------- AI SUGGESTIONS ----------------
  const aiSuggestion = useMemo(() => {
    if (!selectedId) return "";

    const rec = records.find((x) => x._id === selectedId);
    if (!rec) return "";

    const inp = rec.input || {};
    const sug: string[] = [];

    if (inp.chol >= 240) sug.push("High cholesterol — suggest lipid profile & diet change.");
    if (inp.trestbps >= 140) sug.push("High BP — consider antihypertensive review.");
    if (inp.oldpeak >= 2.0) sug.push("Significant ST depression — cardiology consultation recommended.");
    if (rec.probability >= 0.8) sug.push("High model probability — prioritize follow-up soon.");

    return sug.slice(0, 4).join(" ");
  }, [selectedId, records]);

  const saveNote = async () => {
    if (!selectedId) {
      setMessage("Select a record first.");
      return;
    }
    if (!notesText.trim()) {
      setMessage("Write a note first.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`http://127.0.0.1:5001/records/${selectedId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor: "doctor",
          note: notesText,
          suggested_by_ai: aiSuggestion
        })
      });

      const data = await res.json();
      if (!res.ok) setMessage("Failed to save note");
      else setMessage("Note saved successfully");

    } catch (err) {
      setMessage("Network error while saving note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Doctor Dashboard</h2>
          <Button onClick={fetchRecords}>
            <Search className="mr-2" /> Refresh
          </Button>
        </div>

        {/* ----------- Patient Table ----------- */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Patient Records</CardTitle>
            <CardDescription>Click a row to add notes</CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="text-left font-semibold border-b">
                      <th className="p-2">#</th>
                      <th className="p-2">Record ID</th>
                      <th className="p-2">Input</th>
                      <th className="p-2">Prediction</th>
                      <th className="p-2">Probability</th>
                      <th className="p-2">Timestamp</th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.map((r, i) => (
                      <tr
                        key={r._id}
                        className="cursor-pointer hover:bg-muted/20 border-b"
                        onClick={() => onRowClick(r)}
                      >
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2 break-all">{r._id}</td>
                        <td className="p-2">
                          age: {r.input.age}, chol: {r.input.chol}, cp: {r.input.cp}
                        </td>
                        <td className="p-2">
                          {r.prediction === 1 ? (
                            <span className="text-red-600 font-bold">Likely</span>
                          ) : (
                            <span className="text-green-600 font-bold">Healthy</span>
                          )}
                        </td>
                        <td className="p-2">
                          {r.probability !== null
                            ? (r.probability * 100).toFixed(2) + "%"
                            : "N/A"}
                        </td>
                        <td className="p-2">{fmt(r.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ----------- Notes Section ----------- */}
        <Card>
          <CardHeader>
            <CardTitle>Add Doctor Notes</CardTitle>
            <CardDescription>AI suggestions based on patient values</CardDescription>
          </CardHeader>

          <CardContent>
            <div>
              <label className="block text-sm mb-1">Record ID</label>
              <input
                className="input-medical w-full"
                placeholder="Selected record id"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm mb-1">Doctor Notes</label>
              <textarea
                className="input-medical w-full"
                rows={4}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm mb-1">AI Suggestions</label>
              <div className="p-3 border rounded bg-muted/40 text-sm">
                {aiSuggestion || "Select a record to see suggestions"}
              </div>

              <Button
                className="mt-3 mr-3"
                onClick={() =>
                  setNotesText((prev) => prev + "\n" + aiSuggestion)
                }
                disabled={!aiSuggestion}
              >
                <FileText className="mr-2" /> Insert Suggestion
              </Button>

              <Button className="btn-primary mt-3" onClick={saveNote} disabled={saving}>
                <Save className="mr-2" /> {saving ? "Saving..." : "Save Note"}
              </Button>

              {message && (
                <p className="text-sm text-muted-foreground mt-3">{message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DoctorDashboard;
