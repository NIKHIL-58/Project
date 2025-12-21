// ✅ src/pages/GenerateJD.js  (FINAL - Correct)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateJD, saveJD } from "../api"; // ✅ saveJD used
import "./Home.css"; // optional

function GenerateJD() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState("Software Engineer");
  const [loading, setLoading] = useState(false);
  const [jd, setJd] = useState("");

  // ✅ 4-5 profile suggestions
  const suggestions = [
    "Software Engineer",
    "E-commerce Operations Executive",
    "Data Analyst",
    "Digital Marketing Specialist",
    "HR Recruiter",
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateJD(profile);
      setJd(res.data.job_description || "");
    } catch (err) {
      console.error(err);
      alert("❌ JD generate failed. Backend error / OpenAI config check karo.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ अब DB में save होगा (JWT token headers api.js में handle होंगे)
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("❌ Token missing. Please login again.");
        navigate("/login");
        return;
      }

      if (!jd.trim()) {
        alert("❌ JD empty hai, pehle generate karo.");
        return;
      }

      // ✅ IMPORTANT: username pass nahi karna
      await saveJD(profile, jd);

      alert("✅ JD saved permanently!");
      navigate("/home");
    } catch (err) {
      console.error(err);
      alert("❌ JD save failed (backend error).");
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Generate Job Description</h3>
        <button className="btn btn-secondary" onClick={() => navigate("/home")}>
          Back to Dashboard
        </button>
      </div>

      <div className="card p-3 mb-3">
        <label className="form-label fw-bold">Select Profile</label>
        <select
          className="form-control"
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
        >
          {suggestions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <button
          className="btn btn-primary mt-3"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate JD"}
        </button>
      </div>

      <div className="card p-3">
        <label className="form-label fw-bold">Edit JD</label>
        <textarea
          className="form-control"
          rows={12}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="JD will appear here..."
        />

        <button
          className="btn btn-success mt-3"
          onClick={handleSave}
          disabled={!jd.trim()}
        >
          Save JD
        </button>
      </div>
    </div>
  );
}

export default GenerateJD;
