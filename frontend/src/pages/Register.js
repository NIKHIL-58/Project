// src/pages/Register.js
import React, { useState } from "react";
import { register } from "../api";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number.";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await register(formData.username, formData.password);
      setMessage({
        type: "success",
        text: "Account created successfully. Redirecting to login...",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Registration failed. Username might already exist.",
      });
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
          <span className="auth-badge">Start Hiring Smarter</span>
          <h2>Create your hiring workspace.</h2>
          <p>
            Build a resume bank, generate job descriptions, and use AI matching
            to find the strongest candidates.
          </p>

          <div className="auth-feature-list">
            <div>Secure JWT authentication</div>
            <div>Permanent resume storage</div>
            <div>AI-powered candidate matching</div>
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-card register-card">
          <div className="auth-header">
            <span className="auth-small-title">Get started</span>
            <h2>Create account</h2>
            <p>Enter your details to create a SmartHire account.</p>
          </div>

          {message.text && (
            <div className={`auth-alert ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                name="username"
                className={errors.username ? "input-error" : ""}
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
              />
              {errors.username && <small>{errors.username}</small>}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  className={errors.email ? "input-error" : ""}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
                {errors.email && <small>{errors.email}</small>}
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className={errors.phone ? "input-error" : ""}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                />
                {errors.phone && <small>{errors.phone}</small>}
              </div>
            </div>

            <div className="form-group">
              <label>Password *</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={errors.password ? "input-error" : ""}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <small>{errors.password}</small>}
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={errors.confirmPassword ? "input-error" : ""}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && <small>{errors.confirmPassword}</small>}
            </div>

            <button type="submit" className="auth-main-btn" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="auth-switch">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")}>
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;