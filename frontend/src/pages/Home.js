import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyJDs,
  uploadResumes,     // ✅ NEW
  getMyResumes,
  matchResumes,
  getMyMatches,
  getResumeText,
} from "../api";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");

  // JDs
  const [savedJDs, setSavedJDs] = useState([]);
  const [selectedJDId, setSelectedJDId] = useState("");

  // ✅ Multiple Resume upload
  const [resumeFiles, setResumeFiles] = useState([]); // array
  const [myResumes, setMyResumes] = useState([]);
  const [loadingResume, setLoadingResume] = useState(false);

  // Matching
  const [matchResults, setMatchResults] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // Resume Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResume, setPreviewResume] = useState({ filename: "", text: "" });

  const safeMsg = (err, fallback = "No reason") =>
    err?.response?.data?.detail || err?.message || fallback;

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
        alert("Session expired. Please login again.");
        navigate("/login");
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

  // -------------------------
  // JD Download (TXT)
  // -------------------------
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

  // -------------------------
  // ✅ Multiple Resume Pick
  // -------------------------
  const handleResumePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setResumeFiles(files);
  };

  // -------------------------
  // ✅ Multiple Resume Upload (Permanent)
  // -------------------------
  const handleResumeUpload = async () => {
    if (!resumeFiles.length) {
      alert("❌ Please choose PDF/DOCX resumes first.");
      return;
    }

    setLoadingResume(true);
    try {
      const res = await uploadResumes(resumeFiles);
      alert(`✅ Uploaded ${res?.data?.uploaded_count || resumeFiles.length} resumes permanently!`);
      setResumeFiles([]);
      // reset input value (optional)
      const input = document.getElementById("resumeMultiInput");
      if (input) input.value = "";
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert(`❌ ${safeMsg(err, "Resume upload failed")}`);
    } finally {
      setLoadingResume(false);
    }
  };

  // -------------------------
  // Resume Preview (Modal)
  // -------------------------
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
      alert(`❌ ${safeMsg(err, "Preview failed")}`);
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // -------------------------
  // Match Resumes
  // -------------------------
  const handleMatch = async () => {
    if (!selectedJDId) {
      alert("❌ Please select a JD first.");
      return;
    }

    setLoadingMatch(true);
    try {
      const res = await matchResumes(selectedJDId, 5);
      setMatchResults(res?.data?.items || []);
      alert("✅ Matching done!");
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert(`❌ ${safeMsg(err, "Match failed")}`);
    } finally {
      setLoadingMatch(false);
    }
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <a className="navbar-brand" href="/home">
            <i className="fas fa-home mr-2"></i>
            Dashboard
          </a>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ml-auto">
              <li className="nav-item">
                <span className="navbar-text text-white mr-3">
                  <i className="fas fa-user-circle mr-2"></i>
                  {username}
                </span>
              </li>
              <li className="nav-item">
                <button className="btn btn-outline-light" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid mt-4">
        <div className="row">
          {/* Generate JD */}
          <div className="col-12 mb-4">
            <button className="btn btn-primary" onClick={() => navigate("/generate-jd")}>
              <i className="fas fa-plus mr-2"></i>
              Generate Job Description
            </button>
          </div>

          {/* Welcome */}
          <div className="col-12 mb-4">
            <div className="card welcome-card">
              <div className="card-body">
                <h2 className="welcome-title">
                  <i className="fas fa-hand-sparkles mr-2"></i>
                  Welcome back, {username}!
                </h2>
                <p className="welcome-subtitle">Here's what's happening with your account today</p>
              </div>
            </div>
          </div>

          {/* Saved JDs + Match */}
          <div className="col-12 mb-4">
            <div className="card files-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="fas fa-briefcase mr-2"></i>
                  Saved Job Descriptions
                </h5>

                <div className="d-flex gap-2 align-items-center" style={{ minWidth: 340 }}>
                  <select
                    className="form-control"
                    value={selectedJDId}
                    onChange={(e) => setSelectedJDId(e.target.value)}
                  >
                    {savedJDs.length === 0 ? (
                      <option value="">No JDs</option>
                    ) : (
                      savedJDs.map((jd) => (
                        <option key={jd.id} value={jd.id}>
                          {jd.profile}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    className="btn btn-success"
                    onClick={handleMatch}
                    disabled={loadingMatch || savedJDs.length === 0}
                  >
                    {loadingMatch ? "Matching..." : "Match Resumes"}
                  </button>
                </div>
              </div>

              <div className="card-body">
                {savedJDs.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">No JDs saved yet</p>
                  </div>
                ) : (
                  <div className="files-list">
                    {savedJDs.map((jd) => (
                      <div key={jd.id} className="file-item">
                        <div className="file-info">
                          <i className="fas fa-file-alt file-icon"></i>
                          <div className="file-details">
                            <strong>{jd.profile}</strong>
                            <small className="text-muted d-block">{jd.created_at}</small>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => alert(jd.jd_text)}
                          >
                            View
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => downloadJD(jd)}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Resume Upload Permanent (MULTIPLE) */}
          <div className="col-12 mb-4">
            <div className="card upload-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-upload mr-2"></i>
                  Resume Upload (Permanent) - Multiple
                </h5>
              </div>

              <div className="card-body">
                <input
                  id="resumeMultiInput"
                  type="file"
                  className="form-control"
                  accept=".pdf,.docx"
                  multiple
                  onChange={handleResumePick}
                />

                {resumeFiles.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">
                      Selected {resumeFiles.length} file(s):{" "}
                      {resumeFiles.slice(0, 3).map((f) => f.name).join(", ")}
                      {resumeFiles.length > 3 ? " ..." : ""}
                    </small>
                  </div>
                )}

                <button
                  className="btn btn-success mt-3"
                  onClick={handleResumeUpload}
                  disabled={loadingResume}
                >
                  {loadingResume ? "Uploading..." : "Upload Resumes"}
                </button>

                <hr />

                <h5 className="mb-3">My Resumes</h5>
                {myResumes.length === 0 ? (
                  <p className="text-muted">No resumes uploaded yet</p>
                ) : (
                  <div className="files-list">
                    {myResumes.map((r) => (
                      <div key={r.id} className="file-item">
                        <div className="file-info">
                          <i className="fas fa-file-pdf file-icon"></i>
                          <div className="file-details">
                            <strong>{r.filename}</strong>
                            <small className="text-muted d-block">{r.created_at}</small>
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openPreview(r.id)}
                        >
                          Preview
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match Results (Latest) */}
          <div className="col-12 mb-4">
            <div className="card files-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-star mr-2"></i>
                  Match Results (Latest)
                </h5>
              </div>
              <div className="card-body">
                {matchResults.length === 0 ? (
                  <p className="text-muted">
                    No match results yet. Select JD and click “Match Resumes”.
                  </p>
                ) : (
                  <div className="files-list">
                    {matchResults.map((m) => (
                      <div key={m.resume_id} className="file-item">
                        <div className="file-info">
                          <i className="fas fa-user-check file-icon"></i>
                          <div className="file-details">
                            <strong>{m.filename}</strong>
                            <small className="text-muted d-block">
                              Score: {m.score}% • {m.created_at}
                            </small>
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => alert(JSON.stringify(m, null, 2))}
                        >
                          Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Match History */}
          <div className="col-12 mb-4">
            <div className="card files-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-history mr-2"></i>
                  Match History
                </h5>
              </div>
              <div className="card-body">
                {myMatches.length === 0 ? (
                  <p className="text-muted">No match history yet.</p>
                ) : (
                  <div className="files-list">
                    {myMatches.map((h) => (
                      <div key={h.id} className="file-item">
                        <div className="file-info">
                          <i className="fas fa-list file-icon"></i>
                          <div className="file-details">
                            <strong>{h.profile}</strong>
                            <small className="text-muted d-block">{h.created_at}</small>
                          </div>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => alert(JSON.stringify(h.results || [], null, 2))}
                        >
                          Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              width: "min(900px, 95vw)",
              maxHeight: "85vh",
              borderRadius: 12,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong>Preview: {previewResume.filename}</strong>
              <button className="btn btn-sm btn-danger" onClick={() => setPreviewOpen(false)}>
                Close
              </button>
            </div>

            <div style={{ padding: 16, overflow: "auto", maxHeight: "75vh" }}>
              {previewLoading ? (
                <p>Loading preview...</p>
              ) : (
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {previewResume.text || "No text extracted."}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
