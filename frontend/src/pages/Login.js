// src/pages/Login.js
import React, { useState } from "react";
import { login } from "../api";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      showMessage("error", "Please enter your username and password.");
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await login(username, password);

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("username", username);

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      navigate("/home");
    } catch (error) {
      console.error(error);
      showMessage("error", "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left-panel">
        <div className="auth-brand">
          <div className="brand-mark">S</div>
          <div>
            <h1>SmartHire</h1>
            <p>AI Resume Screening Platform</p>
          </div>
        </div>

        <div className="auth-hero-content">
          <span className="auth-badge">AI Powered Hiring</span>
          <h2>Shortlist the right candidates faster.</h2>
          <p>
            Generate job descriptions, upload resumes, and let AI rank the best-fit
            candidates for every role.
          </p>

          <div className="auth-feature-list">
            <div>Structured job descriptions</div>
            <div>Resume parsing and scoring</div>
            <div>Candidate ranking and shortlisting</div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-small-title">Welcome back</span>
            <h2>Sign in to SmartHire</h2>
            <p>Continue managing your AI hiring workflow.</p>
          </div>

          {message.text && (
            <div className={`auth-alert ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <button type="button" className="text-btn">
                Forgot password?
              </button>
            </div>

            <button type="submit" className="auth-main-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="auth-switch">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => navigate("/register")}>
                Create account
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;