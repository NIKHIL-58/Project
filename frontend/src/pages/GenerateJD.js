// src/pages/GenerateJD.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateJD, saveJD } from "../api";
import "./Home.css";

function GenerateJD() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState("Software Engineer");
  const [customProfile, setCustomProfile] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jd, setJd] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const suggestions = [
    "Software Engineer",
    "E-commerce Operations Executive",
    "Data Analyst",
    "Digital Marketing Specialist",
    "Performance Marketing Specialist",
    "HR Recruiter",
  ];

  const selectedProfile = customProfile.trim() || profile;

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const handleGenerate = async () => {
    if (!selectedProfile.trim()) {
      showMessage("error", "Please select or enter a job profile.");
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await generateJD(selectedProfile);
      setJd(res?.data?.job_description || "");
      showMessage("success", "Job description generated successfully.");
    } catch (err) {
      console.error(err);
      showMessage("error", "JD generation failed. Please check backend or OpenAI configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!jd.trim()) {
      showMessage("error", "JD is empty. Generate or write a JD first.");
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await saveJD(selectedProfile, jd);
      showMessage("success", "Job description saved successfully.");
      setTimeout(() => navigate("/home"), 900);
    } catch (err) {
      console.error(err);
      showMessage("error", "JD save failed. Please check backend.");
    } finally {
      setSaving(false);
    }
  };

  const copyJD = async () => {
    if (!jd.trim()) {
      showMessage("error", "No JD available to copy.");
      return;
    }

    await navigator.clipboard.writeText(jd);
    showMessage("success", "JD copied to clipboard.");
  };

  return (
    <div className="jd-page">
      <div className="jd-topbar">
        <div>
          <span className="page-eyebrow">AI Job Description Generator</span>
          <h1>Create a structured JD</h1>
          <p>
            Generate role-specific responsibilities, requirements, and skills for
            smarter resume screening.
          </p>
        </div>

        <button className="secondary-action" onClick={() => navigate("/home")}>
          Back to Dashboard
        </button>
      </div>

      {message.text && (
        <div className={`status-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="jd-layout">
        <div className="jd-control-card">
          <h2>Role setup</h2>
          <p>Choose a profile or enter your own custom role.</p>

          <div className="form-block">
            <label>Select profile</label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              disabled={!!customProfile.trim()}
            >
              {suggestions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="form-block">
            <label>Custom profile</label>
            <input
              type="text"
              value={customProfile}
              onChange={(e) => setCustomProfile(e.target.value)}
              placeholder="Example: Backend Developer"
            />
          </div>

          <div className="selected-role-box">
            <span>Selected role</span>
            <strong>{selectedProfile}</strong>
          </div>

          <button
            className="primary-action full-width"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate JD"}
          </button>
        </div>

        <div className="jd-editor-card">
          <div className="editor-header">
            <div>
              <h2>Edit Job Description</h2>
              <p>Review, customize, copy, or save the generated JD.</p>
            </div>

            <button className="light-action" onClick={copyJD}>
              Copy
            </button>
          </div>

          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Your generated job description will appear here..."
          />

          <div className="editor-footer">
            <span>{jd.length} characters</span>

            <button
              className="success-action"
              onClick={handleSave}
              disabled={saving || !jd.trim()}
            >
              {saving ? "Saving..." : "Save JD"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateJD;