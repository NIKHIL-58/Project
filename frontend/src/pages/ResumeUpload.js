import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume } from "../api";
import "./Home.css";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const onUpload = async () => {
    if (!file) return alert("Select PDF/DOCX first");
    setLoading(true);
    try {
      await uploadResume(file);
      alert("✅ Resume uploaded!");
      navigate("/home");
    } catch (e) {
      console.error(e);
      alert("❌ Upload failed. Only PDF/DOCX + backend check.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Upload Resume</h3>
        <button className="btn btn-secondary" onClick={() => navigate("/home")}>
          Back
        </button>
      </div>

      <div className="card p-3">
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button className="btn btn-primary mt-3" onClick={onUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
