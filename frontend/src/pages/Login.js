// src/pages/Login.js
import React, { useState } from "react";
import { login } from "../api";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await login(username, password);
      alert("Logged in! Token: " + response.data.access_token);

      // Chaaho toh token save bhi kar sakte ho:
      // localStorage.setItem("token", response.data.access_token);

      navigate("/home");
    } catch (error) {
      console.error(error);
      alert("Login failed!");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Login
        </button>

        <button
          type="button"
          className="btn btn-link ms-2"
          onClick={() => navigate("/register")}
        >
          Don't have an account? Register
        </button>
      </form>
    </div>
  );
}

export default Login;
