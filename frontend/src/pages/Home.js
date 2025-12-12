// src/pages/Home.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const [username, setUsername] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    
    if (!token) {
      navigate("/login");
      return;
    }
    
    setUsername(storedUsername || "User");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("rememberMe");
    navigate("/login");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  const getFileIcon = (type) => {
    if (type.includes("image")) return "fa-file-image";
    if (type.includes("pdf")) return "fa-file-pdf";
    if (type.includes("word")) return "fa-file-word";
    if (type.includes("excel") || type.includes("spreadsheet")) return "fa-file-excel";
    if (type.includes("video")) return "fa-file-video";
    if (type.includes("audio")) return "fa-file-audio";
    return "fa-file";
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
          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
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
          {/* Welcome Card */}
          <div className="col-12 mb-4">
            <div className="card welcome-card">
              <div className="card-body">
                <h2 className="welcome-title">
                  <i className="fas fa-hand-sparkles mr-2"></i>
                  Welcome back, {username}!
                </h2>
                <p className="welcome-subtitle">
                  Here's what's happening with your account today
                </p>
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
                <h3 className="stat-number">
                  {uploadedFiles.reduce((acc, file) => 
                    acc + parseFloat(file.size), 0).toFixed(2)} KB
                </h3>
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

          {/* File Upload Section */}
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
                  <input
                    type="file"
                    id="fileInput"
                    className="d-none"
                    onChange={handleFileChange}
                  />
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
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setSelectedFile(null)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <button
                      className="btn btn-success btn-block mt-3"
                      onClick={handleUpload}
                    >
                      <i className="fas fa-upload mr-2"></i>
                      Upload File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Files */}
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
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <i className="fas fa-trash"></i>
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