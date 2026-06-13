import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyJDs,
  uploadResumes,
  getMyResumes,
  matchResumes,
  getMyMatches,
  getResumeText,
} from "../api";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");

  const [savedJDs, setSavedJDs] = useState([]);
  const [selectedJDId, setSelectedJDId] = useState("");

  const [resumeFiles, setResumeFiles] = useState([]);
  const [myResumes, setMyResumes] = useState([]);

  const [matchResults, setMatchResults] = useState([]);
  const [myMatches, setMyMatches] = useState([]);

  const [loadingResume, setLoadingResume] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResume, setPreviewResume] = useState({
    filename: "",
    text: "",
  });

  const safeMsg = (err, fallback = "Something went wrong") =>
    err?.response?.data?.detail || err?.message || fallback;

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 4000);
  };

  const fetchAll = async () => {
    try {
      const [jdsRes, resumesRes, matchesRes] = await Promise.all([
        getMyJDs(),
        getMyResumes(),
        getMyMatches(),
      ]);

      const jds = jdsRes?.data?.items || [];
      setSavedJDs(jds);

      if (jds.length > 0) {
        setSelectedJDId((prev) => prev || jds[0].id);
      } else {
        setSelectedJDId("");
      }

      setMyResumes(resumesRes?.data?.items || []);
      setMyMatches(matchesRes?.data?.items || []);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        showStatus("error", "Session expired. Please login again.");
        navigate("/login");
      } else {
        showStatus("error", safeMsg(err, "Failed to load dashboard data"));
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (!token) {
      navigate("/login");
      return;
    }

    setUsername(storedUsername || "User");
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("rememberMe");
    navigate("/login");
  };

  const downloadJD = (jd) => {
    const content = `PROFILE: ${jd.profile}\nCREATED_AT: ${jd.created_at}\n\n${jd.jd_text || ""}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const safeName = (jd.profile || "JD").replace(/[^a-z0-9]/gi, "_");
    a.href = url;
    a.download = `${safeName}_${jd.id}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const handleResumePick = (e) => {
    const files = Array.from(e.target.files || []);
    setResumeFiles(files);
  };

  const handleResumeUpload = async () => {
    if (!resumeFiles.length) {
      showStatus("error", "Please choose PDF or DOCX resumes first.");
      return;
    }

    setLoadingResume(true);

    try {
      const res = await uploadResumes(resumeFiles);
      showStatus(
        "success",
        `Uploaded ${res?.data?.uploaded_count || resumeFiles.length} resume(s) successfully.`
      );

      setResumeFiles([]);

      const input = document.getElementById("resumeMultiInput");
      if (input) input.value = "";

      await fetchAll();
    } catch (err) {
      console.error(err);
      showStatus("error", safeMsg(err, "Resume upload failed"));
    } finally {
      setLoadingResume(false);
    }
  };

  const openPreview = async (resume_id) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewResume({ filename: "", text: "" });

    try {
      const res = await getResumeText(resume_id);
      setPreviewResume({
        filename: res?.data?.filename || "Resume",
        text: res?.data?.text || "",
      });
    } catch (err) {
      console.error(err);
      showStatus("error", safeMsg(err, "Preview failed"));
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedJDId) {
      showStatus("error", "Please select a job description first.");
      return;
    }

    if (!myResumes.length) {
      showStatus("error", "Please upload resumes before matching.");
      return;
    }

    setLoadingMatch(true);

    try {
      const res = await matchResumes(selectedJDId, 10);
      setMatchResults(res?.data?.items || []);
      showStatus("success", "AI matching completed successfully.");
      await fetchAll();
    } catch (err) {
      console.error(err);
      showStatus("error", safeMsg(err, "Match failed"));
    } finally {
      setLoadingMatch(false);
    }
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Strong fit";
    if (score >= 60) return "Good fit";
    return "Needs review";
  };

  const getScoreClass = (score) => {
    if (score >= 80) return "score-high";
    if (score >= 60) return "score-medium";
    return "score-low";
  };

  const selectedJD = savedJDs.find((jd) => jd.id === selectedJDId);

  return (
    <div className="smart-dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h3>SmartHire</h3>
            <span>AI Resume Screening</span>
          </div>
        </div>

        <div className="side-menu">
          <button className="side-link active">Dashboard</button>
          <button className="side-link" onClick={() => navigate("/generate-jd")}>
            Generate JD
          </button>
          <button className="side-link">Resume Bank</button>
          <button className="side-link">Match History</button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>Hi, {username}</h1>
            <p className="subtitle">
              Screen resumes, rank candidates, and shortlist the best talent faster.
            </p>
          </div>

          <button className="primary-btn" onClick={() => navigate("/generate-jd")}>
            + Generate Job Description
          </button>
        </header>

        {status.message && (
          <div className={`status-banner ${status.type}`}>
            {status.message}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <span>Job Descriptions</span>
            <strong>{savedJDs.length}</strong>
            <p>Structured roles created</p>
          </div>

          <div className="stat-card">
            <span>Uploaded Resumes</span>
            <strong>{myResumes.length}</strong>
            <p>Candidate profiles stored</p>
          </div>

          <div className="stat-card">
            <span>Match Runs</span>
            <strong>{myMatches.length}</strong>
            <p>AI screening sessions</p>
          </div>

          <div className="stat-card highlight">
            <span>Latest Results</span>
            <strong>{matchResults.length}</strong>
            <p>Shortlisted candidates</p>
          </div>
        </section>

        <section className="workflow-card">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <div>
              <h4>Create JD</h4>
              <p>Generate role-specific requirements.</p>
            </div>
          </div>

          <div className="workflow-line" />

          <div className="workflow-step">
            <div className="step-number">2</div>
            <div>
              <h4>Upload Resumes</h4>
              <p>Add PDF or DOCX candidate resumes.</p>
            </div>
          </div>

          <div className="workflow-line" />

          <div className="workflow-step">
            <div className="step-number">3</div>
            <div>
              <h4>Match Candidates</h4>
              <p>Rank candidates using AI scoring.</p>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel-card large">
            <div className="panel-header">
              <div>
                <h2>Job Descriptions</h2>
                <p>Select a JD to match against your resume bank.</p>
              </div>
            </div>

            <div className="jd-action-row">
              <select
                className="smart-select"
                value={selectedJDId}
                onChange={(e) => setSelectedJDId(e.target.value)}
              >
                {savedJDs.length === 0 ? (
                  <option value="">No job descriptions available</option>
                ) : (
                  savedJDs.map((jd) => (
                    <option key={jd.id} value={jd.id}>
                      {jd.profile}
                    </option>
                  ))
                )}
              </select>

              <button
                className="success-btn"
                onClick={handleMatch}
                disabled={loadingMatch || !savedJDs.length}
              >
                {loadingMatch ? "Matching..." : "Match Resumes"}
              </button>
            </div>

            {selectedJD && (
              <div className="selected-jd-card">
                <div>
                  <span>Selected Role</span>
                  <h3>{selectedJD.profile}</h3>
                  <p>{selectedJD.created_at}</p>
                </div>

                <div className="button-group">
                  <button
                    className="ghost-btn"
                    onClick={() => setPreviewResume({
                      filename: selectedJD.profile,
                      text: selectedJD.jd_text || "No JD text available.",
                    }) || setPreviewOpen(true)}
                  >
                    View
                  </button>

                  <button className="ghost-btn" onClick={() => downloadJD(selectedJD)}>
                    Download
                  </button>
                </div>
              </div>
            )}

            <div className="list-area">
              {savedJDs.length === 0 ? (
                <EmptyState
                  title="No job descriptions yet"
                  text="Create your first JD to start screening candidates."
                />
              ) : (
                savedJDs.map((jd) => (
                  <div key={jd.id} className="list-item">
                    <div className="item-icon blue">JD</div>
                    <div className="item-info">
                      <strong>{jd.profile}</strong>
                      <span>{jd.created_at}</span>
                    </div>
                    <button className="mini-btn" onClick={() => downloadJD(jd)}>
                      Download
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h2>Upload Resumes</h2>
                <p>Upload multiple resumes permanently.</p>
              </div>
            </div>

            <label className="upload-box" htmlFor="resumeMultiInput">
              <input
                id="resumeMultiInput"
                type="file"
                accept=".pdf,.docx"
                multiple
                onChange={handleResumePick}
              />
              <div className="upload-icon">↑</div>
              <strong>Click to upload resumes</strong>
              <span>PDF or DOCX files supported</span>
            </label>

            {resumeFiles.length > 0 && (
              <div className="selected-files">
                <strong>{resumeFiles.length} selected</strong>
                <p>
                  {resumeFiles.slice(0, 3).map((f) => f.name).join(", ")}
                  {resumeFiles.length > 3 ? " ..." : ""}
                </p>
              </div>
            )}

            <button
              className="full-btn"
              onClick={handleResumeUpload}
              disabled={loadingResume}
            >
              {loadingResume ? "Uploading..." : "Upload Resumes"}
            </button>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel-card large">
            <div className="panel-header">
              <div>
                <h2>Latest Match Results</h2>
                <p>Ranked candidates for your selected job description.</p>
              </div>
            </div>

            {matchResults.length === 0 ? (
              <EmptyState
                title="No latest results"
                text="Select a JD and click Match Resumes to generate rankings."
              />
            ) : (
              <div className="candidate-list">
                {matchResults.map((m, index) => (
                  <div key={m.resume_id || index} className="candidate-card">
                    <div className="rank">#{index + 1}</div>

                    <div className="candidate-main">
                      <strong>{m.filename}</strong>
                      <span>{m.created_at}</span>

                      <div className="score-track">
                        <div
                          className={`score-fill ${getScoreClass(m.score)}`}
                          style={{ width: `${Math.min(Number(m.score || 0), 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="candidate-score">
                      <strong>{m.score}%</strong>
                      <span className={`score-badge ${getScoreClass(m.score)}`}>
                        {getScoreLabel(Number(m.score || 0))}
                      </span>
                    </div>

                    <button
                      className="mini-btn"
                      onClick={() =>
                        setPreviewResume({
                          filename: m.filename,
                          text: JSON.stringify(m, null, 2),
                        }) || setPreviewOpen(true)
                      }
                    >
                      Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h2>My Resumes</h2>
                <p>Recently uploaded candidate files.</p>
              </div>
            </div>

            <div className="list-area compact">
              {myResumes.length === 0 ? (
                <EmptyState
                  title="No resumes uploaded"
                  text="Upload resumes to build your candidate bank."
                />
              ) : (
                myResumes.slice(0, 8).map((r) => (
                  <div key={r.id} className="list-item">
                    <div className="item-icon red">CV</div>
                    <div className="item-info">
                      <strong>{r.filename}</strong>
                      <span>{r.created_at}</span>
                    </div>
                    <button className="mini-btn" onClick={() => openPreview(r.id)}>
                      Preview
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-header">
            <div>
              <h2>Match History</h2>
              <p>Previous AI screening runs.</p>
            </div>
          </div>

          {myMatches.length === 0 ? (
            <EmptyState
              title="No match history"
              text="Your completed matching sessions will appear here."
            />
          ) : (
            <div className="history-grid">
              {myMatches.map((h) => (
                <div key={h.id} className="history-card">
                  <div>
                    <span>Role</span>
                    <strong>{h.profile}</strong>
                    <p>{h.created_at}</p>
                  </div>

                  <button
                    className="mini-btn"
                    onClick={() =>
                      setPreviewResume({
                        filename: h.profile,
                        text: JSON.stringify(h.results || [], null, 2),
                      }) || setPreviewOpen(true)
                    }
                  >
                    View Results
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {previewOpen && (
        <div className="modal-backdrop" onClick={() => setPreviewOpen(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span>Preview</span>
                <strong>{previewResume.filename}</strong>
              </div>

              <button className="close-btn" onClick={() => setPreviewOpen(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {previewLoading ? (
                <p>Loading preview...</p>
              ) : (
                <pre>{previewResume.text || "No text extracted."}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">✨</div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export default Home;