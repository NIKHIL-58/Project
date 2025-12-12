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
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      alert("⚠️ Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await login(username, password);
      
      // Save token
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("username", username);
      
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      navigate("/home");
    } catch (error) {
      console.error(error);
      alert("❌ Login failed! Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-container">
              <div className="logo-circle">
                <i className="fas fa-sign-in-alt"></i>
              </div>
            </div>
            <h2 className="auth-title">Welcome Back!</h2>
            <p className="auth-subtitle">Sign in to continue to your account</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-user"></i> Username
              </label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-lock"></i> Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            <div className="form-options">
              <div className="custom-control custom-checkbox">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="custom-control-label" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
              <button type="button" className="link-button forgot-password">
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm mr-2"></span>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Sign In
                </>
              )}
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="auth-footer">
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate("/register")}
                >
                  Create Account
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;