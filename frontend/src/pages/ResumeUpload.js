// src/pages/ResumeUpload.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadResume } from "../api";
import "./Home.css";

export default function ResumeUpload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const onUpload = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a PDF or DOCX resume first." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await uploadResume(file);
      setMessage({ type: "success", text: "Resume uploaded successfully." });

      setTimeout(() => {
        navigate("/home");
      }, 900);
    } catch (e) {
      console.error(e);
      setMessage({
        type: "error",
        text: "Upload failed. Please upload only PDF or DOCX files.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card-single">
        <div className="upload-page-header">
          <span className="page-eyebrow">Candidate Resume Upload</span>
          <h1>Upload Resume</h1>
          <p>Add a candidate resume to your SmartHire resume bank.</p>
        </div>

        {message.text && (
          <div className={`status-banner ${message.type}`}>
            {message.text}
          </div>
        )}

        <label className="single-upload-zone">
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <div className="upload-big-icon">↑</div>
          <strong>{file ? file.name : "Choose resume file"}</strong>
          <span>PDF or DOCX supported</span>
        </label>

        <div className="upload-actions">
          <button className="secondary-action" onClick={() => navigate("/home")}>
            Back
          </button>

          <button className="primary-action" onClick={onUpload} disabled={loading}>
            {loading ? "Uploading..." : "Upload Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}