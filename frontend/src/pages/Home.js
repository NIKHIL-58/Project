// src/pages/Home.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyJDs,
  uploadResume,
  getMyResumes,
  matchResumes,
  getMyMatches,
} from "../api";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");

  // existing file UI
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // JD data
  const [savedJDs, setSavedJDs] = useState([]);
  const [viewJDText, setViewJDText] = useState("");
  const [viewJDTitle, setViewJDTitle] = useState("");

  // Resume Upload + list
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [myResumes, setMyResumes] = useState([]);

  // Matching
  const [selectedJDId, setSelectedJDId] = useState("");
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState([]);

  const storageUsedKB = useMemo(() => {
    const sum = uploadedFiles.reduce((acc, file) => acc + parseFloat(file.size), 0);
    return Number.isFinite(sum) ? sum.toFixed(2) : "0.00";
  }, [uploadedFiles]);

  const requireAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return false;
    }
    return true;
  };

  const fetchDashboardData = async () => {
    try {
      // JDs
      const jdRes = await getMyJDs();
      setSavedJDs(jdRes?.data?.items || []);

      // Resumes
      const resumeRes = await getMyResumes();
      setMyResumes(resumeRes?.data?.items || []);

      // Matches
      const matchRes = await getMyMatches();
      setMatches(matchRes?.data?.items || []);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    }
  };

  useEffect(() => {
    if (!requireAuth()) return;

    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername || "User");

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("rememberMe");
    navigate("/login");
  };

  // ===== Existing local file upload UI (as you had) =====
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      const newFile = {
        id: Date.now(),
        name: selectedFile.name,
        size: (selectedFile.size / 1024).toFixed(2) + " KB",
        type: selectedFile.type,
        uploadDate: new Date().toLocaleString(),
      };
      setUploadedFiles([...uploadedFiles, newFile]);
      setSelectedFile(null);
      alert("✅ File uploaded successfully!");
    }
  };

  const handleDeleteFile = (id) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== id));
  };

  const getFileIcon = (type) => {
    if (!type) return "fa-file";
    if (type.includes("image")) return "fa-file-image";
    if (type.includes("pdf")) return "fa-file-pdf";
    if (type.includes("word")) return "fa-file-word";
    if (type.includes("excel") || type.includes("spreadsheet")) return "fa-file-excel";
    if (type.includes("video")) return "fa-file-video";
    if (type.includes("audio")) return "fa-file-audio";
    return "fa-file";
  };

  // ===== JD View =====
  const handleViewJD = (jdItem) => {
    setViewJDTitle(jdItem?.profile || "JD");
    setViewJDText(jdItem?.jd_text || "");
    alert((jdItem?.jd_text || "").slice(0, 1500) + (jdItem?.jd_text?.length > 1500 ? "\n\n...(more)" : ""));
  };

  // ===== Resume Upload (backend) =====
  const handleResumePick = (e) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
  };

  const handleResumeUpload = async () => {
    try {
      if (!resumeFile) {
        alert("❌ Please select a resume file first.");
        return;
      }
      setResumeUploading(true);
      await uploadResume(resumeFile);
      alert("✅ Resume uploaded!");
      setResumeFile(null);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert("❌ Resume upload failed (backend error).");
    } finally {
      setResumeUploading(false);
    }
  };

  // ===== Matching =====
  const handleRunMatch = async () => {
    try {
      if (!selectedJDId) {
        alert("❌ Please select a JD first.");
        return;
      }
      setMatching(true);
      await matchResumes(selectedJDId, 5);
      alert("✅ Match created! (Top candidates calculated)");
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert("❌ Matching failed (backend error).");
    } finally {
      setMatching(false);
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
          {/* JD Generation Button */}
          <div className="col-12 mb-4">
            <button className="btn btn-primary" onClick={() => navigate("/generate-jd")}>
              <i className="fas fa-plus mr-2"></i>
              Generate Job Description
            </button>
          </div>

          {/* Welcome Card */}
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

          {/* Stats Cards */}
          <div className="col-md-4 mb-4">
            <div className="card stat-card stat-card-blue">
              <div className="card-body">
                <div className="stat-icon">
                  <i className="fas fa-file-upload"></i>
                </div>
                <h3 className="stat-number">{uploadedFiles.length}</h3>
                <p className="stat-label">Total Files</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card stat-card stat-card-green">
              <div className="card-body">
                <div className="stat-icon">
                  <i className="fas fa-database"></i>
                </div>
                <h3 className="stat-number">{storageUsedKB} KB</h3>
                <p className="stat-label">Storage Used</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card stat-card stat-card-purple">
              <div className="card-body">
                <div className="stat-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <h3 className="stat-number">Active</h3>
                <p className="stat-label">Account Status</p>
              </div>
            </div>
          </div>

          {/* File Upload Section (your existing UI) */}
          <div className="col-lg-6 mb-4">
            <div className="card upload-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-cloud-upload-alt mr-2"></i>
                  Upload Files
                </h5>
              </div>
              <div className="card-body">
                <div
                  className={`upload-area ${dragActive ? "drag-active" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <i className="fas fa-cloud-upload-alt upload-icon"></i>
                  <h5>Drag & Drop your files here</h5>
                  <p className="text-muted">or</p>
                  <label htmlFor="fileInput" className="btn btn-primary">
                    <i className="fas fa-folder-open mr-2"></i>
                    Browse Files
                  </label>
                  <input type="file" id="fileInput" className="d-none" onChange={handleFileChange} />
                </div>

                {selectedFile && (
                  <div className="selected-file mt-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <i className={`fas ${getFileIcon(selectedFile.type)} mr-2`}></i>
                        <strong>{selectedFile.name}</strong>
                        <small className="text-muted ml-2">
                          ({(selectedFile.size / 1024).toFixed(2)} KB)
                        </small>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => setSelectedFile(null)}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>

                    <button className="btn btn-success btn-block mt-3" onClick={handleUpload}>
                      <i className="fas fa-upload mr-2"></i>
                      Upload File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Files (your existing UI) */}
          <div className="col-lg-6 mb-4">
            <div className="card files-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-folder-open mr-2"></i>
                  Recent Files
                </h5>
              </div>
              <div className="card-body">
                {uploadedFiles.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fas fa-folder-open empty-folder-icon"></i>
                    <p className="text-muted mt-3">No files uploaded yet</p>
                  </div>
                ) : (
                  <div className="files-list">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="file-item">
                        <div className="file-info">
                          <i className={`fas ${getFileIcon(file.type)} file-icon`}></i>
                          <div className="file-details">
                            <strong>{file.name}</strong>
                            <small className="text-muted d-block">
                              {file.size} • {file.uploadDate}
                            </small>
                          </div>
                        </div>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteFile(file.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Saved JDs */}
          <div className="col-12 mb-4">
            <div className="card files-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="fas fa-briefcase mr-2"></i>
                  Saved Job Descriptions
                </h5>

                {/* quick match controls */}
                <div className="d-flex align-items-center" style={{ gap: 10 }}>
                  <select
                    className="form-control"
                    style={{ minWidth: 260 }}
                    value={selectedJDId}
                    onChange={(e) => setSelectedJDId(e.target.value)}
                  >
                    <option value="">Select JD to Match</option>
                    {savedJDs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.profile}
                      </option>
                    ))}
                  </select>

                  <button
                    className="btn btn-outline-primary"
                    onClick={handleRunMatch}
                    disabled={matching || !selectedJDId}
                  >
                    {matching ? "Matching..." : "Match Resumes"}
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
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewJD(jd)}>
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Resume Upload (backend) */}
          <div className="col-12 mb-4">
            <div className="card upload-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-file-upload mr-2"></i>
                  Resume Upload (Permanent)
                </h5>
              </div>

              <div className="card-body">
                <div className="d-flex align-items-center" style={{ gap: 10, flexWrap: "wrap" }}>
                  <input type="file" className="form-control" onChange={handleResumePick} />
                  <button
                    className="btn btn-success"
                    onClick={handleResumeUpload}
                    disabled={resumeUploading || !resumeFile}
                  >
                    {resumeUploading ? "Uploading..." : "Upload Resume"}
                  </button>
                </div>

                <hr />

                <h6 className="mb-2">My Resumes</h6>
                {myResumes.length === 0 ? (
                  <p className="text-muted">No resumes uploaded yet.</p>
                ) : (
                  <div className="files-list">
                    {myResumes.map((r) => (
                      <div key={r.id} className="file-item">
                        <div className="file-info">
                          <i className="fas fa-file-pdf file-icon"></i>
                          <div className="file-details">
                            <strong>{r.filename || "Resume"}</strong>
                            <small className="text-muted d-block">{r.created_at}</small>
                          </div>
                        </div>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => alert(r.text_preview || "No preview")}>
                          Preview
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Matches */}
          <div className="col-12 mb-4">
            <div className="card files-card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-star mr-2"></i>
                  Match Results
                </h5>
              </div>
              <div className="card-body">
                {matches.length === 0 ? (
                  <p className="text-muted">No matches yet. Select JD and click “Match Resumes”.</p>
                ) : (
                  <div className="files-list">
                    {matches.map((m) => (
                      <div key={m.id} className="file-item">
                        <div className="file-info">
                          <i className="fas fa-user-check file-icon"></i>
                          <div className="file-details">
                            <strong>{m.candidate_name || m.resume_filename || "Candidate"}</strong>
                            <small className="text-muted d-block">
                              Score: {m.score ?? "N/A"} • {m.created_at}
                            </small>
                          </div>
                        </div>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => alert(m.reason || "No reason")}>
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
    </div>
  );
}

export default Home;
